const { globalShortcut } = require('electron');
const windowControl = require('./windowControl');
const store = require('./store');

/**
 * 全局快捷键存储 key。
 * 注意：store.defaults 里已有 `shortcuts` 用于“快捷入口列表”，这里单独使用 `globalShortcuts` 避免冲突。
 */
const STORE_KEY = 'globalShortcuts';

/**
 * 默认快捷键配置（只保留系统原定快捷键：显示/隐藏/退出）。
 * - id: 唯一标识（用于持久化覆盖）
 * - label: 设置页展示名称
 * - defaultAccelerator: Electron globalShortcut 支持的字符串
 * - handler: 快捷键触发回调
 */
const DEFAULT_SHORTCUT_ITEMS = [
  {
    id: 'show_window',
    label: '显示窗口',
    defaultAccelerator: 'Alt+F',
    handler: () => {
      windowControl.showWindow(100);
      // 恢复“鼠标移入自动显示”能力
      windowControl.setAutoShow(false);
    },
  },
  {
    id: 'hide_window',
    label: '隐藏窗口',
    defaultAccelerator: 'Esc',
    handler: () => {
      // 关键：保持与旧实现一致。
      // 触发隐藏时“暂停鼠标移入自动显示”，确保鼠标回到窗口区域不会自动弹出。
      windowControl.setAutoShow(true);
      windowControl.hideImmediately();
      console.log('\nEsc Esc Esc mouse status monitoring has been resumed.');
    },
  },
  {
    id: 'quit_app',
    label: '退出应用',
    defaultAccelerator: 'Ctrl+Q',
    handler: () => windowControl.quit(),
  },
];

// 记录本模块注册过的快捷键，避免 unregisterAll() 误伤其他模块
let registeredAccelerators = [];
let isRecordingPaused = false;

function _getStoredOverrides() {
  const val = store.get(STORE_KEY, {});
  return val && typeof val === 'object' ? val : {};
}

function _unregisterRegistered() {
  for (const acc of registeredAccelerators) {
    try {
      globalShortcut.unregister(acc);
    } catch (e) {}
  }
  registeredAccelerators = [];
}

function _sanitizeOverrides(overrides) {
  const safe = overrides && typeof overrides === 'object' ? overrides : {};
  const next = {};
  for (const [k, v] of Object.entries(safe)) {
    if (typeof v === 'string') next[k] = v.trim();
  }
  return next;
}

/**
 * 根据 overrides 注册快捷键（不依赖 store），并返回“最终生效”的 shortcuts + effectiveOverrides。
 * 规则：
 * - 若自定义注册失败/冲突：提示失败，并回退到系统原定快捷键（defaultAccelerator）
 * - 空字符串表示禁用该项
 */
function _registerFromOverrides(overridesInput) {
  _unregisterRegistered();

  // 录制模式下暂不注册，避免用户按键触发全局快捷键行为（例如 Esc 导致窗口被隐藏）
  if (isRecordingPaused) {
    const shortcuts = DEFAULT_SHORTCUT_ITEMS.map((it) => ({
      id: it.id,
      label: it.label,
      accelerator: (overridesInput?.[it.id] ?? it.defaultAccelerator) || '',
      defaultAccelerator: it.defaultAccelerator,
    }));
    return { success: true, errors: [], shortcuts, effectiveOverrides: _sanitizeOverrides(overridesInput) };
  }

  const overrides = _sanitizeOverrides(overridesInput);
  const errors = [];
  const used = new Set();
  const applied = {};
  const effectiveOverrides = { ...overrides };

  for (const item of DEFAULT_SHORTCUT_ITEMS) {
    const desiredRaw = Object.prototype.hasOwnProperty.call(overrides, item.id)
      ? overrides[item.id]
      : item.defaultAccelerator;
    const desired = (desiredRaw || '').trim();

    // 允许用户清空（禁用）
    if (!desired) {
      applied[item.id] = '';
      continue;
    }

    const tryRegister = (acc) => {
      if (!acc) return false;
      if (used.has(acc)) return false;
      const ok = globalShortcut.register(acc, item.handler);
      if (!ok) return false;
      used.add(acc);
      registeredAccelerators.push(acc);
      return true;
    };

    // 先尝试注册自定义/当前值
    const ok = tryRegister(desired);
    if (ok) {
      applied[item.id] = desired;
      continue;
    }

    // 自定义失败：回退到系统原定快捷键
    const def = (item.defaultAccelerator || '').trim();
    const defOk = tryRegister(def);

    errors.push({
      id: item.id,
      accelerator: desired,
      reason: defOk
        ? `注册失败：${desired}，已恢复默认：${def}`
        : `注册失败：${desired}`,
    });

    applied[item.id] = defOk ? def : '';

    // 若已恢复默认，则不要把失败的自定义值持久化到 store
    if (defOk && Object.prototype.hasOwnProperty.call(effectiveOverrides, item.id)) {
      delete effectiveOverrides[item.id];
    }
  }

  const shortcuts = DEFAULT_SHORTCUT_ITEMS.map((it) => ({
    id: it.id,
    label: it.label,
    accelerator: applied[it.id] ?? '',
    defaultAccelerator: it.defaultAccelerator,
  }));

  return {
    success: errors.length === 0,
    errors,
    shortcuts,
    effectiveOverrides,
  };
}

/**
 * 重新注册全局快捷键（读取 store 覆盖配置后生效）。
 */
function registerShortcuts() {
  const overrides = _getStoredOverrides();
  const result = _registerFromOverrides(overrides);
  // 确保 store 中只保存“最终生效”的覆盖配置（避免下次启动反复注册失败）
  store.set(STORE_KEY, result.effectiveOverrides || {});
  return result;
}

function unregisterShortcuts() {
  _unregisterRegistered();
}

// -----------------------------
// 给 IPC/设置页使用的 API
// -----------------------------

function getGlobalShortcuts() {
  const overrides = _getStoredOverrides();
  const merged = DEFAULT_SHORTCUT_ITEMS.map((it) => {
    const accelerator = Object.prototype.hasOwnProperty.call(overrides, it.id)
      ? overrides[it.id]
      : it.defaultAccelerator;
    return {
      id: it.id,
      label: it.label,
      accelerator: (accelerator || '').trim(),
      defaultAccelerator: it.defaultAccelerator,
    };
  });
  return merged;
}

/**
 * 设置全量覆盖配置：{ [id]: acceleratorString }
 * - 传空字符串表示禁用该项
 */
function setGlobalShortcuts(overrides) {
  const result = _registerFromOverrides(overrides);
  store.set(STORE_KEY, result.effectiveOverrides || {});
  return result;
}

function resetGlobalShortcuts() {
  const result = _registerFromOverrides({});
  store.set(STORE_KEY, {});
  return result;
}

/**
 * 设置“录制快捷键”模式。
 * - paused=true: 取消注册当前模块的快捷键（避免按键触发动作）
 * - paused=false: 重新按 store 配置注册
 */
function setShortcutRecordingPaused(paused) {
  isRecordingPaused = !!paused;
  if (isRecordingPaused) {
    _unregisterRegistered();
    return { success: true };
  }
  return registerShortcuts();
}

module.exports = {
  registerShortcuts,
  unregisterShortcuts,
  getGlobalShortcuts,
  setGlobalShortcuts,
  resetGlobalShortcuts,
  setShortcutRecordingPaused,
};
