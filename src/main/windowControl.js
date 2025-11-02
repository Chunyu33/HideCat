const { screen } = require("electron");
const store = require('./store'); // 使用持久化 store

let mainWindow = null;
let isWindowVisible = true;
let checkTimer = null;
let startupTimer = null;
let lastCursorInside = true;

const COUNTDOWN = 3500; // 倒计时

// 设置主窗口引用
function setMainWindow(win) {
  mainWindow = win;
}

// 设置自动隐藏开关
function setAutoHide(enabled, count) {
  // console.log('\n config----', enabled, '===count===', count);

  // 持久化状态
  store.set('autoHide', enabled);

  if (!enabled) {
    clearInterval(checkTimer);
    clearTimeout(startupTimer);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show(); // 抢焦点显示
      isWindowVisible = true;
    }
  } else {
    initAutoHideWatcher(count); // 重新启动检测逻辑
  }
}

// 获取自动隐藏状态
function getAutoHideState() {
  return store.get('autoHide', true);
}

// 显示窗口
function showWindow(customCountDown = undefined) {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  // mainWindow.show(); // 原来的抢焦点方式
  mainWindow.showInactive(); // 不抢焦点
  isWindowVisible = true;

  // 重新启动 秒定时器
  if (getAutoHideState()) {
    clearTimeout(startupTimer);
    startupTimer = setTimeout(() => {
      console.log(
        `\n ⏳ Mouse status monitoring will begin ${COUNTDOWN} seconds after startup.`
      );
      startMouseWatcher();
    }, customCountDown ?? COUNTDOWN);
  }
}

// 隐藏窗口
function hideWindow(ms = 0) {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  setTimeout(() => {
    mainWindow.hide();
    isWindowVisible = false;
  }, ms);
}

// 立即隐藏（备用）
function hideImmediately() {
  hideWindow(0);
}

// 设置透明度
function setOpacity(val) {
  store.set('opacity', val); // 持久化
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setOpacity(val);
  }
}

// 设置网页缩放
function setScale(val) {
  store.set('scale', val); // 持久化
  // 为了避免整个窗口被缩放, 不使用setZoomFactor
  // if (mainWindow && !mainWindow.isDestroyed()) {
  //   mainWindow.webContents.setZoomFactor(val);
  // }
}

// -----------------------------
// ✅ 核心逻辑部分：鼠标检测自动隐藏
// -----------------------------
function startMouseWatcher() {
  clearInterval(checkTimer);

  checkTimer = setInterval(() => {
    if (!mainWindow || !getAutoHideState()) return;

    const cursor = screen.getCursorScreenPoint();
    const bounds = mainWindow.getBounds();

    const isInside =
      cursor.x >= bounds.x &&
      cursor.x <= bounds.x + bounds.width &&
      cursor.y >= bounds.y &&
      cursor.y <= bounds.y + bounds.height;

    if (isInside && !lastCursorInside) {
      lastCursorInside = true;
      // 鼠标进入窗口范围
      if (!isWindowVisible) {
        // mainWindow.showInactive(); // 保留原来的注释
        // isWindowVisible = true;
        console.log("🟢 in -> show");
      }
    } else if (!isInside && lastCursorInside) {
      lastCursorInside = false;
      // 鼠标离开窗口范围
      if (isWindowVisible) {
        mainWindow.hide();
        isWindowVisible = false;
        console.log("🔴 leave -> hide");
      }
    }
  }, 200);
}

// 清除定时器
function clearAllTimer() {
  clearInterval(checkTimer);
  clearTimeout(startupTimer);
}

// 初始化自动隐藏检测
function initAutoHideWatcher(customCountDown = undefined) {
  clearInterval(checkTimer);
  clearTimeout(startupTimer);

  if (!getAutoHideState()) return;

  console.log(
    `\n🚀 initAutoHideWatcher ${COUNTDOWN} secends，active mouse check...`
  );

  // 启动定时器开始检测鼠标
  startupTimer = setTimeout(() => {
    startMouseWatcher();
  }, customCountDown ?? COUNTDOWN);
}

module.exports = {
  setMainWindow,
  showWindow,
  hideWindow,
  hideImmediately,
  setAutoHide,
  getAutoHideState,
  setOpacity,
  setScale,
  initAutoHideWatcher,
  clearAllTimer,
};