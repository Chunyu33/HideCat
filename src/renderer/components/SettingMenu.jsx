import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Slider,
  Switch,
  Tooltip,
  Select,
  Button,
  message,
  ConfigProvider,
  theme as antdTheme,
} from "antd";
import {
  SettingOutlined,
  InfoCircleOutlined,
  MessageOutlined,
  ThunderboltOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import QuestionMark from "./QuestionMark";
import "./css/setting.css";
import UpdateChecker from "./UpdateChecker";

// 主题选项
const themeOptions = [
  { label: "浅色模式", value: "light" },
  { label: "深色模式", value: "dark" },
  { label: "跟随系统", value: "auto" },
];

const NAV_ITEMS = [
  { key: "general", label: "通用", icon: <SettingOutlined /> },
  { key: "shortcut", label: "快捷键", icon: <ThunderboltOutlined /> },
  { key: "feedback", label: "意见反馈", icon: <MessageOutlined /> },
  { key: "about", label: "关于", icon: <InfoCircleOutlined /> },
];

const CONTACT_WECHAT = "ZENITH3399";
const CONTACT_EMAIL = "1378813463@qq.com";
const CONTACT_GITHUB = "https://github.com/Chunyu33/HideCat/issues";

const SettingMenu = ({ onClose, onScaleChange }) => {
  const [autoHide, setAutoHide] = useState(false);
  const [opacity, setOpacity] = useState(0.9);
  const [transparentBorder, setTransparentBorder] = useState(false);
  const [scale, setScale] = useState(1.0);
  const [autoZoom, setAutoZoom] = useState(true); // 自动缩放开关
  const [theme, setTheme] = useState("auto"); // 本地状态
  const [searchEngine, setSearchEngine] = useState("bing");
  const [activeNav, setActiveNav] = useState("general");
  const [globalShortcuts, setGlobalShortcuts] = useState([]);
  const [editingShortcutId, setEditingShortcutId] = useState(null);
  const [pendingAccelerator, setPendingAccelerator] = useState("");
  const shortcutRecordInputRef = useRef(null);
  const clickTimeout = useRef(null);

  useEffect(() => {
    // 初始化时读取设置
    const fetchSettings = async () => {
      const [auto, op, tb, sc, az, th, se] = await Promise.all([
        window.electronAPI.getAutoHide?.(),
        window.electronAPI.getOpacity?.(),
        window.electronAPI.getTransparentBorder?.(),
        window.electronAPI.getScale?.(),
        window.electronAPI.getAutoZoom?.(),
        window.electronAPI.getTheme?.(),
        window.electronAPI.getSearchEngine?.(),
      ]);
      if (auto !== undefined) setAutoHide(auto);
      if (op !== undefined) setOpacity(op);
      if (tb !== undefined) setTransparentBorder(!!tb);
      if (sc !== undefined) setScale(sc);
      if (az !== undefined) setAutoZoom(az);
      if (th !== undefined) {
        setTheme(th);
        applyThemeToDOM(th);
      }
      if (se) setSearchEngine(se);
    };
    fetchSettings();
  }, []);

  // 处理自动隐藏
  const handleAutoHide = (checked) => {
    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    clickTimeout.current = setTimeout(() => {
      setAutoHide(checked);
      window.electronAPI?.setAutoHide?.(checked, 200);
    }, 100);
  };

  // 处理透明度
  const handleOpacity = (value) => {
    setOpacity(value);
    window.electronAPI?.setOpacity?.(value);
  };

  // 处理透明边框
  const handleTransparentBorder = async (checked) => {
    setTransparentBorder(checked);
    const result = await window.electronAPI?.setTransparentBorder?.(checked);
    if (result?.requiresRestart) {
      message.info("透明边框已保存，重启应用后生效");
    }
  };

  // 处理缩放
  const handleScale = (value) => {
    setScale(value);
    window.electronAPI?.setScale?.(value);
    if (onScaleChange) onScaleChange(value);
  };

  // 处理自动缩放开关
  const handleAutoZoom = (checked) => {
    setAutoZoom(checked);
    window.electronAPI?.setAutoZoom?.(checked);
  };

  // 将主题应用到当前页面
  const applyThemeToDOM = (value) => {
    if (value === "auto") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute(
        "data-theme",
        isDark ? "dark" : "light"
      );
    } else {
      document.documentElement.setAttribute("data-theme", value);
    }
  };

  const restoreDefaultFor = async (id) => {
    const current = globalShortcuts.find((x) => x.id === id);
    if (!current) return;
    const next = globalShortcuts.map((x) =>
      x.id === id ? { ...x, accelerator: x.defaultAccelerator } : x
    );
    await saveGlobalShortcuts(next);
  };

  const commitEditingShortcut = async () => {
    if (!editingShortcutId) return;
    // 未录入/未监听到按键：按你的要求，默认恢复系统设定的快捷键并回显
    if (!pendingAccelerator) {
      await restoreDefaultFor(editingShortcutId);
      cancelShortcutRecording();
      return;
    }

    const next = globalShortcuts.map((x) =>
      x.id === editingShortcutId
        ? { ...x, accelerator: pendingAccelerator }
        : x
    );
    await saveGlobalShortcuts(next);
    cancelShortcutRecording();
  };

  // 取消录制（并恢复主进程快捷键注册）
  const cancelShortcutRecording = () => {
    setEditingShortcutId(null);
    setPendingAccelerator("");
    window.electronAPI?.setShortcutRecordingPaused?.(false);
  };

  // 切换主题
  const handleThemeChange = async (value) => {
    setTheme(value);
    applyThemeToDOM(value);
    await window.electronAPI?.setTheme?.(value); // 通知主进程
  };

  // 切换搜索引擎
  const handleSearchEngineChange = async (value) => {
    const next = value === "google" ? "google" : "bing";
    setSearchEngine(next);
    await window.electronAPI?.setSearchEngine?.(next);
  };
  // 计算实际生效的主题（处理 auto 模式）
  const effectiveTheme = useMemo(() => {
    if (theme === "auto") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme;
  }, [theme]);

  const antdConfig = useMemo(() => {
    return effectiveTheme === "dark"
      ? { algorithm: antdTheme.darkAlgorithm }
      : { algorithm: antdTheme.defaultAlgorithm };
  }, [effectiveTheme]);

  useEffect(() => {
    return () => {
      if (clickTimeout.current) clearTimeout(clickTimeout.current);
    };
  }, []);

  // -----------------------------
  // 快捷键录制/保存逻辑（微信风格：点击某项 -> 监听键盘 -> 生成组合键 -> 保存）
  // -----------------------------

  const normalizeKey = (key) => {
    if (!key) return "";
    if (key === " ") return "Space";
    if (key === "Escape") return "Esc";
    if (key === "ArrowUp") return "Up";
    if (key === "ArrowDown") return "Down";
    if (key === "ArrowLeft") return "Left";
    if (key === "ArrowRight") return "Right";
    if (key === "PageUp") return "PageUp";
    if (key === "PageDown") return "PageDown";
    if (key === "Home") return "Home";
    if (key === "End") return "End";
    if (key === "Insert") return "Insert";
    if (key === "Delete") return "Delete";
    if (key === "Enter") return "Enter";
    if (key.length === 1) return key.toUpperCase();
    return key;
  };

  const buildAcceleratorFromEvent = (e) => {
    const k = e.key;
    // 忽略纯修饰键
    if (k === "Control" || k === "Shift" || k === "Alt" || k === "Meta") {
      return "";
    }
    const parts = [];
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");
    if (e.metaKey) parts.push("Super");
    const mainKey = normalizeKey(k);
    if (!mainKey) return "";
    parts.push(mainKey);
    return parts.join("+");
  };

  const computeOverrides = (list) => {
    const overrides = {};
    for (const it of list || []) {
      if (!it?.id) continue;
      const acc = (it.accelerator ?? "").trim();
      const def = (it.defaultAccelerator ?? "").trim();
      // 与默认相同则不写入覆盖；写入空字符串表示禁用
      if (acc === def) continue;
      overrides[it.id] = acc;
    }
    return overrides;
  };

  const refreshGlobalShortcuts = async () => {
    try {
      const list = await window.electronAPI?.getGlobalShortcuts?.();
      if (Array.isArray(list)) {
        setGlobalShortcuts(list);
      }
    } catch (e) {
      message.error("读取快捷键失败");
    }
  };

  const saveGlobalShortcuts = async (nextList) => {
    try {
      const overrides = computeOverrides(nextList);
      const result = await window.electronAPI?.setGlobalShortcuts?.(overrides);

      if (result?.shortcuts && Array.isArray(result.shortcuts)) {
        setGlobalShortcuts(result.shortcuts);
      } else {
        setGlobalShortcuts(nextList);
      }

      if (result?.success === false && Array.isArray(result?.errors)) {
        const first = result.errors[0];
        message.error(first?.reason || "快捷键更新失败");
      } else {
        message.success("已保存并生效");
      }
    } catch (e) {
      message.error("保存失败");
    }
  };

  const resetGlobalShortcutsToDefault = async () => {
    try {
      const result = await window.electronAPI?.resetGlobalShortcuts?.();
      if (result?.shortcuts && Array.isArray(result.shortcuts)) {
        setGlobalShortcuts(result.shortcuts);
      } else {
        await refreshGlobalShortcuts();
      }
      message.success("已恢复默认设置");
    } catch (e) {
      message.error("恢复默认失败");
    }
  };

  useEffect(() => {
    if (activeNav !== "shortcut") return;
    refreshGlobalShortcuts();
  }, [activeNav]);

  useEffect(() => {
    if (activeNav === "shortcut") return;
    if (!editingShortcutId) return;
    cancelShortcutRecording();
  }, [activeNav, editingShortcutId]);

  useEffect(() => {
    if (!editingShortcutId) return;

    // 进入录制模式：通知主进程暂停全局快捷键，避免按键触发真实行为
    window.electronAPI?.setShortcutRecordingPaused?.(true);

    // 录制模式下强制聚焦一个隐藏 input，保证 keydown 一定能被捕获（比 window 监听更稳定）
    setTimeout(() => {
      try {
        shortcutRecordInputRef.current?.focus?.();
      } catch (e) {}
    }, 0);

    // 窗口失焦/页面隐藏时自动退出录制，避免快捷键一直处于 paused 状态导致“原有快捷键失效”
    const onBlur = () => cancelShortcutRecording();
    const onVisibilityChange = () => {
      if (document.hidden) cancelShortcutRecording();
    };

    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      // 退出录制模式：恢复主进程全局快捷键
      window.electronAPI?.setShortcutRecordingPaused?.(false);
    };
  }, [editingShortcutId]);

  // 关闭窗口
  const handleClose = () => {
    if (onClose) onClose();
    if (window.electronAPI?.closeSettingsWindow) {
      window.electronAPI.closeSettingsWindow();
    }
  };

  const formatTip = (tipValue) => {
    if (tipValue == null) {
      return null;
    }
    return `${Math.round(tipValue * 100)}%`;
  };

  const openExternal = async (url) => {
    try {
      await window.electronAPI?.openExternal?.(url);
    } catch (e) {
      message.error("打开失败");
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success("已复制");
    } catch (e) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        message.success("已复制");
      } catch (err) {
        message.error("复制失败");
      }
    }
  };

  return (
    <ConfigProvider
      theme={{
        ...antdConfig,
        token: {
          colorPrimary: "#4caf50",
          colorBgBase: effectiveTheme === "dark" ? "#000" : "#fff",
        },
      }}
    >
      <div className="setting-menu setting-layout">
        <div className="setting-header setting-titlebar" role="banner">
          <span className="setting-title">设置</span>
          <button
            className="close-btn setting-titlebar-btn"
            onClick={handleClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="setting-body">
          <aside className="setting-sidebar" aria-label="Settings navigation">
            <div className="setting-sidebar-inner">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`setting-nav-item ${
                    activeNav === item.key ? "is-active" : ""
                  }`}
                  onClick={() => setActiveNav(item.key)}
                >
                  <span className="setting-nav-icon">{item.icon}</span>
                  <span className="setting-nav-label">{item.label}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="setting-content" aria-label="Settings content">
            <div className="setting-content-scroll">
              {activeNav === "general" && (
                <>
                  <div className="setting-section-title">通用</div>
                  <div className="setting-items-container">
                    <div className="setting-item">
                      <span className="setting-label row-center">
                        自动隐藏
                        <Tooltip
                          title="开启后，鼠标离开窗口后自动隐藏在任务栏中。"
                          placement="bottomRight"
                          color="#4caf50"
                          styles={{ body: { color: "#fff" } }}
                        >
                          <QuestionMark size="13" />
                        </Tooltip>
                      </span>
                      <div className="range-input">
                        <Switch checked={autoHide} onChange={handleAutoHide} />
                      </div>
                    </div>

                    <div className="setting-item">
                      <span className="setting-label row-center">
                        透明边框
                        <Tooltip
                          title="开启后主窗口会使用 Electron 透明窗口能力，隐藏系统背景边框。该能力需要在窗口创建时确定，重启应用后生效。"
                          placement="bottomRight"
                          color="#4caf50"
                          styles={{ body: { color: "#fff" } }}
                        >
                          <QuestionMark size="13" />
                        </Tooltip>
                      </span>
                      <div className="range-input">
                        <Switch
                          checked={transparentBorder}
                          onChange={handleTransparentBorder}
                        />
                      </div>
                    </div>

                    <div className="setting-item">
                      <span className="setting-label row-center">
                        窗口透明
                        <Tooltip
                          title="窗口的透明度，范围0.2~1.0。"
                          placement="bottomRight"
                          color="#4caf50"
                          styles={{ body: { color: "#fff" } }}
                        >
                          <QuestionMark size="13" />
                        </Tooltip>
                      </span>
                      <div className="range-input">
                        <Slider
                          min={0.2}
                          max={1}
                          step={0.01}
                          value={opacity}
                          onChange={handleOpacity}
                          style={{ width: "100%" }}
                          tooltip={{ formatter: formatTip }}
                        />
                      </div>
                    </div>

                    <div className="setting-item">
                      <span className="setting-label row-center">
                        自动适配
                        <Tooltip
                          title="开启后，网页会根据窗口大小自动调整缩放比例。关闭后使用下方手动设置的缩放比例。"
                          placement="bottomRight"
                          color="#4caf50"
                          styles={{ body: { color: "#fff" } }}
                        >
                          <QuestionMark size="13" />
                        </Tooltip>
                      </span>
                      <div className="range-input">
                        <Switch checked={autoZoom} onChange={handleAutoZoom} />
                      </div>
                    </div>

                    <div className="setting-item">
                      <span className="setting-label row-center">
                        网页缩放
                        <Tooltip
                          title="手动设置网页缩放比例，范围50%~150%。仅在关闭自动适配时生效。"
                          placement="topRight"
                          color="#4caf50"
                          styles={{ body: { color: "#fff" } }}
                        >
                          <QuestionMark size="13" />
                        </Tooltip>
                      </span>
                      <div className="range-input">
                        <Slider
                          min={0.5}
                          max={1.5}
                          step={0.01}
                          value={scale}
                          onChange={handleScale}
                          style={{ width: "100%" }}
                          tooltip={{ formatter: formatTip }}
                          disabled={autoZoom}
                        />
                      </div>
                    </div>

                    <div className="setting-item">
                      <span className="setting-label row-center">
                        外观设置
                        <Tooltip
                          title="应用的外观，深色或者浅色模式。"
                          placement="bottomRight"
                          color="#4caf50"
                          styles={{ body: { color: "#fff" } }}
                        >
                          <QuestionMark size="13" />
                        </Tooltip>
                      </span>
                      <div className="range-input">
                        <Select
                          value={theme}
                          onChange={handleThemeChange}
                          options={themeOptions}
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>

                    <div className="setting-item">
                      <span className="setting-label row-center">
                        搜索引擎
                        <Tooltip
                          title="输入关键词搜索时使用的默认搜索引擎。"
                          placement="topRight"
                          color="#4caf50"
                          styles={{ body: { color: "#fff" } }}
                        >
                          <QuestionMark size="13" />
                        </Tooltip>
                      </span>
                      <div className="range-input">
                        <Select
                          value={searchEngine}
                          onChange={handleSearchEngineChange}
                          options={[
                            { label: "Bing", value: "bing" },
                            { label: "Google", value: "google" },
                          ]}
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeNav === "about" && (
                <>
                  <div className="setting-section-title">关于</div>
                  <UpdateChecker />

                  <div className="setting-footer">
                    <div className="setting-footer-copy">
                      Copyright © {new Date().getFullYear()} 躲躲猫. All
                      rights reserved.
                    </div>
                  </div>
                </>
              )}

              {activeNav === "feedback" && (
                <>
                  <div className="setting-section-title">意见反馈</div>
                  <div className="setting-feedback-section">
                    <div className="setting-feedback-header">
                      <div className="setting-feedback-title">联系方式</div>
                      <div className="setting-feedback-subtitle" style={{marginTop: '4px'}}>
                        欢迎通过以下方式联系我
                      </div>
                    </div>

                    <div className="setting-feedback-items">
                      {/* <div className="setting-feedback-row">
                        <div className="setting-feedback-label">微信号</div>
                        <div className="setting-feedback-right">
                          <span className="setting-feedback-value">
                            {CONTACT_WECHAT}
                          </span>
                          <Button
                            size="small"
                            type="text"
                            className="setting-copy-btn"
                            icon={<CopyOutlined />}
                            onClick={() => copyText(CONTACT_WECHAT)}
                          >
                            复制
                          </Button>
                        </div>
                      </div> */}

                      <div className="setting-feedback-row">
                        <div className="setting-feedback-label">邮箱</div>
                        <div className="setting-feedback-right">
                          <button
                            type="button"
                            className="setting-feedback-link"
                            onClick={() =>
                              openExternal(`mailto:${CONTACT_EMAIL}`)
                            }
                          >
                            {CONTACT_EMAIL}
                          </button>
                          <Button
                            size="small"
                            type="text"
                            className="setting-copy-btn"
                            icon={<CopyOutlined />}
                            onClick={() => copyText(CONTACT_EMAIL)}
                          >
                            复制
                          </Button>
                        </div>
                      </div>

                      <div className="setting-feedback-row">
                        <div className="setting-feedback-label">GitHub</div>
                        <div className="setting-feedback-right">
                          <button
                            type="button"
                            className="setting-feedback-link"
                            onClick={() => openExternal(CONTACT_GITHUB)}
                          >
                            提交 Issue
                          </button>
                          <Button
                            size="small"
                            type="text"
                            className="setting-copy-btn"
                            icon={<CopyOutlined />}
                            onClick={() => copyText(CONTACT_GITHUB)}
                          >
                            复制
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeNav === "shortcut" && (
                <>
                  <div className="setting-section-title">快捷键</div>

                  {/*
                    隐藏录制 input：
                    - 进入录制时自动 focus
                    - 使用 onKeyDown 捕获组合键
                  */}
                  <input
                    ref={shortcutRecordInputRef}
                    className="setting-shortcut-record-input"
                    aria-hidden="true"
                    tabIndex={-1}
                    onKeyDown={(e) => {
                      if (!editingShortcutId) return;
                      e.preventDefault();
                      e.stopPropagation();

                      // Enter 作为“确认/保存”快捷键，不允许被设置为快捷键本身
                      if (e.key === "Enter") {
                        commitEditingShortcut();
                        return;
                      }

                      const acc = buildAcceleratorFromEvent(e);
                      if (acc) setPendingAccelerator(acc);
                    }}
                  />

                  <div className="setting-items-container setting-shortcut-container">
                    {globalShortcuts.map((it) => {
                      const isEditing = editingShortcutId === it.id;
                      const display = isEditing
                        ? pendingAccelerator || "请按下新的快捷键"
                        : it.accelerator || "未设置";
                      const isUnset = !it.accelerator;

                      return (
                        <div
                          key={it.id}
                          className={`setting-shortcut-item-wrapper ${
                            isEditing ? "is-recording" : ""
                          }`}
                        >
                          <div className="setting-item setting-shortcut-item">
                            <span className="setting-label row-center">
                              {it.label}
                            </span>
                            <div className="setting-shortcut-right">
                              <button
                                type="button"
                                className={`setting-shortcut-pill ${
                                  isUnset ? "is-empty" : ""
                                }`}
                                onClick={() => {
                                  setEditingShortcutId(it.id);
                                  setPendingAccelerator("");
                                  setTimeout(() => {
                                    try {
                                      shortcutRecordInputRef.current?.focus?.();
                                    } catch (e) {}
                                  }, 0);
                                }}
                              >
                                {display}
                              </button>

                              {!isUnset && (
                                <button
                                  type="button"
                                  className="setting-shortcut-clear"
                                  onClick={async () => {
                                    const next = globalShortcuts.map((x) =>
                                      x.id === it.id
                                        ? { ...x, accelerator: "" }
                                        : x
                                    );
                                    await saveGlobalShortcuts(next);
                                  }}
                                  aria-label="Clear shortcut"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>

                          {isEditing && (
                            <div className="setting-shortcut-actions-row">
                              <div className="setting-shortcut-actions-left">
                                <span className="setting-shortcut-tip">
                                  {pendingAccelerator
                                    ? "已录入快捷键，可保存"
                                    : "请按下新的快捷键"}
                                </span>
                              </div>
                              <div className="setting-shortcut-actions-right">
                                <Button
                                  size="small"
                                  onClick={() => {
                                    cancelShortcutRecording();
                                  }}
                                >
                                  取消
                                </Button>
                                <Button
                                  size="small"
                                  type="primary"
                                  onClick={async () => {
                                    await commitEditingShortcut();
                                  }}
                                >
                                  保存
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="setting-shortcut-footer">
                    <Button
                      size="small"
                      onClick={resetGlobalShortcutsToDefault}
                      className="setting-shortcut-reset"
                    >
                      恢复默认设置
                    </Button>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default SettingMenu;
