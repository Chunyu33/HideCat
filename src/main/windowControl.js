const { BrowserWindow, BrowserView, screen, session } = require("electron");
const store = require("./store"); // 使用持久化 store

let mainWindow = null;
let settingsWin = undefined;
let isWindowVisible = true;
let checkTimer = null;
let startupTimer = null;
let lastCursorInside = true;

const COUNTDOWN = 3500; // 倒计时

// -----------------------------
// 设置主窗口引用
// -----------------------------
function setMainWindow(win) {
  mainWindow = win;
}

// -----------------------------
// 设置窗口逻辑
// -----------------------------
function openSettingsWindow() {
  // ✅ 获取主窗口当前尺寸
  const [parentWidth, parentHeight] = mainWindow.getSize();

  // ✅ 按比例计算子窗口尺寸
  const width = Math.floor(parentWidth * 0.6);
  const height = Math.floor(parentHeight * 0.3);
  settingsWin = new BrowserWindow({
    // width: 420,
    // height: 360,
    width,
    height,
    minWidth: 340,
    minHeight: 240,
    resizable: false,
    frame: false,
    parent: mainWindow,
    modal: true, // 模态，阻止主窗口交互
    show: false,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 关键点：带上 query 参数告诉 React “我是设置窗口”
  settingsWin.loadURL(`${MAIN_WINDOW_WEBPACK_ENTRY}?window=settings`);

  settingsWin.once("ready-to-show", () => {
    settingsWin.show();
  });

  settingsWin.on("closed", () => {
    settingsWin = null;
  });

  return true;
}

function closeSettingsWindow() {
  if (settingsWin) {
    settingsWin.close();
    settingsWin = null;
  }
}

// -----------------------------
// 自动隐藏逻辑
// -----------------------------
function setAutoHide(enabled, count) {
  // console.log('\n config----', enabled, '===count===', count);

  // 持久化状态
  store.set("autoHide", enabled);

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
  return store.get("autoHide", true);
}

// 显示窗口
function showWindow(customCountDown = undefined) {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  mainWindow.show(); // 原来的抢焦点方式
  // mainWindow.showInactive(); // 不抢焦点
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
    closeSettingsWindow();
    isWindowVisible = false;
  }, ms);
}

// 立即隐藏（备用）
function hideImmediately() {
  hideWindow(0);
}

// 设置透明度
function setOpacity(val) {
  store.set("opacity", val); // 持久化
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setOpacity(val);
  }
}

// 设置网页缩放
function setScale(val) {
  store.set("scale", val); // 持久化
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
        closeSettingsWindow();
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

// -----------------------------
// BrowserView 标签管理逻辑
// -----------------------------
let mainWindowRef = null;
const browserViews = new Map();
let activeTabKey = null;

// 提供外部初始化方法
function setMainWindowRef(win) {
  mainWindowRef = win;
}

function _getBorserSize() {
  // if(!mainWindowRef) return;
  // let [x, y] = mainWindowRef.getPosition();
  const [width, height] = mainWindowRef.getContentSize();
  let sizeObj = {
    width,
    height,
    x: 0,
    y: 66,
  };
  return sizeObj;
}

/**
 * 创建新标签页并加载 URL
 */
async function addTab(key, url) {
  if (!mainWindowRef) return;

  let view = browserViews.get(key);

  if (!view) {
    view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        partition: `persist:tab-${key}`,
      },
    });

    browserViews.set(key, view);

    view.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
      view.webContents.loadURL(targetUrl);
      return { action: "deny" };
    });

    view.webContents.on(
      "did-fail-load",
      (e, errorCode, errorDescription, validatedURL) => {
        mainWindowRef.webContents.send("tab-load-failed", {
          key,
          errorCode,
          errorDescription,
          url: validatedURL,
        });
      }
    );

    view.webContents.on("dom-ready", () => {
      const title = view.webContents.getTitle?.() || "";
      mainWindowRef.webContents.send("tab-loaded", { key, url, title });
      console.log(`DOM ready...Tab ${key} loaded: ${url}`);
    });

    view.webContents.on("did-finish-load", () => {
      mainWindowRef.webContents.send("tab-finish", { key, url });
      console.log(`✅ Tab ${key} finished loading: ${url}`);
    });
  }

  try {
    mainWindowRef.webContents.send("tab-loading", { key, url });
    console.log(`[addTab] load url for key=${key}, url=${url}`);
    view.webContents.loadURL(url);
  } catch (e) {
    console.warn("loadURL failed", e);
  }

  // ✅ 如果当前激活 tab 就是这个 key，则刷新 BrowserView 显示
  if (activeTabKey === key) {
    try {
      mainWindowRef.setBrowserView(view);
      view.setBounds(_getBorserSize());
      view.setAutoResize({ width: true, height: true });
      console.log(`🔁 refreshed active tab view for key=${key}`);
    } catch (e) {
      console.warn("refresh active tab failed", e);
    }
  }
}

/**
 * 激活（切换）标签页
 */
async function setActiveTab(key) {
  if (!mainWindowRef) return;
  if (activeTabKey === key) return;

  const currentView = browserViews.get(activeTabKey);
  const newView = browserViews.get(key);

  if (currentView) mainWindowRef.removeBrowserView(currentView);

  if (newView) {
    mainWindowRef.setBrowserView(newView);
    newView.setBounds(_getBorserSize());
    newView.setAutoResize({ width: true, height: true });
  }

  activeTabKey = key;
}

function getActiveKey() {
  console.log(`\n getActiveKey: ${activeTabKey}`);
  return activeTabKey;
}

/**
 * 删除标签页
 */
async function removeTab(key) {
  const view = browserViews.get(key);
  if (!view) return;

  if (activeTabKey === key && mainWindowRef) {
    mainWindowRef.removeBrowserView(view);
    activeTabKey = null;
  }

  // 清理缓存和会话数据
  const viewSession = view.webContents.session;
  if (viewSession) {
    try {
      await viewSession.clearCache();
      await viewSession.clearStorageData();
    } catch {}
  }

  browserViews.delete(key);
  view.webContents.destroy();
}

// 导航
function navigateView(action) {
  const view = browserViews.get(activeTabKey);
  if (!view) return;

  const wc = view.webContents;
  console.log(`\n[navigateView] action=${action}`);
  switch (action) {
    case "back":
      if (wc.canGoBack()) wc.goBack();
      break;
    case "forward":
      if (wc.canGoForward()) wc.goForward();
      break;
    case "reload":
      wc.reload();
      break;
    case "home":
      // TODO: 改成核心页面 不需要header
      wc.loadURL(`${MAIN_WINDOW_WEBPACK_ENTRY}?window=home`);
      break;
  }
}

module.exports = {
  setMainWindow,
  setMainWindowRef,
  openSettingsWindow,
  closeSettingsWindow,
  showWindow,
  hideWindow,
  hideImmediately,
  setAutoHide,
  getAutoHideState,
  setOpacity,
  setScale,
  initAutoHideWatcher,
  clearAllTimer,
  addTab,
  setActiveTab,
  removeTab,
  navigateView,
  getActiveKey
};
