const { BrowserWindow, BrowserView, screen, app } = require("electron");
const path = require("path");
const { randomUUID } = require("crypto");
const store = require("./store"); // 使用持久化 store

let mainWindow = null;
let settingsWin = undefined;
let isWindowVisible = true;
let checkTimer = null;
let startupTimer = null;
let lastCursorInside = true;
let autoShowPaused = false; // 是否暂停自动显示

const COUNTDOWN = 3500; // 倒计时

// -----------------------------
// 设置主窗口引用
// -----------------------------
function setMainWindow(win) {
  mainWindow = win;
}

function quit() {
  const allWindows = BrowserWindow.getAllWindows();
  for (const win of allWindows) {
    try {
      win.destroy(); // 直接销毁，不触发渲染进程事件
    } catch (e) {}
  }

  setTimeout(() => {
    store.set("autoHide", false); // 取消自动隐藏
    app.exit(0); // 代替 process.exit()
  }, 100);
}

// -----------------------------
// 设置窗口逻辑
// -----------------------------
function openSettingsWindow() {
  if (!mainWindow) return false;

  const [parentWidth, parentHeight] = mainWindow.getSize();

  const width = Math.floor(parentWidth * 0.6);
  const height = Math.floor(parentHeight * 0.4);

  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

  // 子窗口 preload 路径
  const preloadPath = isDev
    ? path.join(__dirname, "../preload/preload.js") // 开发模式
    : path.join(__dirname, "../preload/preload.js"); // 打包模式
  // 子窗口 URL
  const url = isDev
    ? `http://localhost:5173/?window=settings`
    : `file://${path.join(
        __dirname,
        "../renderer/dist/index.html"
      )}?window=settings`;

  settingsWin = new BrowserWindow({
    width,
    height,
    minWidth: 340,
    minHeight: 240,
    resizable: false,
    frame: false,
    hasShadow: false,
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: {
      preload: preloadPath,
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: true,
    },
  });

  settingsWin.loadURL(url);
  if (isDev) {
    settingsWin.webContents.openDevTools();
  }

  settingsWin.once("ready-to-show", () => settingsWin.show());

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
        `\n ⏳ Mouse status monitoring will begin ${
          customCountDown ?? COUNTDOWN
        } seconds after startup.`
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
function setScale(scale) {
  store.set("scale", scale); // 持久化
  // 为了避免整个主窗口被缩放, 不在mainWindow使用setZoomFactor
  // if (mainWindow && !mainWindow.isDestroyed()) {
  //   mainWindow.webContents.setZoomFactor(scale);
  // }

  // 缩放BrowserView
  // 更新所有的 BrowserView 缩放
  browserViews.forEach((view) => {
    view.webContents.setZoomFactor(scale);
  });

  // 更新当前活动 BrowserView 的缩放
  if (activeTabKey && browserViews.has(activeTabKey)) {
    const activeView = browserViews.get(activeTabKey);
    activeView.webContents.setZoomFactor(scale);
  }
}

// -----------------------------
// ✅ 最核心逻辑部分：鼠标检测自动隐藏
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
      // 检查是否暂停自动显示
      if (autoShowPaused) {
        console.log("⏸ autoShowPaused=true -> skip show");
        return;
      }
      // 鼠标进入窗口范围
      if (!isWindowVisible) {
        mainWindow.showInactive(); // 保留原来的注释
        isWindowVisible = true;
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

// 暂停/继续 鼠标移入自动显示
function setAutoShow(paused) {
  autoShowPaused = paused;
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
  const preloadPath = path.join(__dirname, "../preload/preload.js");
  if (!view) {
    view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        preload: preloadPath,
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
      // 加载完成后 确保缩放比例立即生效
      const scale = store.get("scale", 1.0); // 获取全局缩放比例
      view.webContents.setZoomFactor(scale); // 立即应用缩放
      console.log(`\n setZoomFactor for scale=${scale}`);
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

  // 如果当前激活 tab 就是这个 key，则刷新 BrowserView 显示
  if (activeTabKey === key) {
    try {
      mainWindowRef.setBrowserView(view);
      view.setBounds(_getBorserSize());
      view.setAutoResize({ width: true, height: true });
      setTimeout(() => {
        const scale = store.get("scale", 1.0); // 获取全局缩放比例
        view.webContents.setZoomFactor(scale); // 立即应用缩放
      }, 1000);
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

  // 清理缓存和会话数据（如果不想清除登录信息，可以注释掉下面两行）
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
      wc.loadURL(`${MAIN_WINDOW_WEBPACK_ENTRY}?window=home`);
      break;
  }
}

// =====================================================
// 快捷入口逻辑
function getShortcuts() {
  return store.get("shortcuts", []);
}
function addShortcut(newShortcut) {
  newShortcut.id = randomUUID();
  const current = store.get("shortcuts", []);
  const updated = [...current, newShortcut];
  store.set("shortcuts", updated);
  console.log(`✅ Shortcut added: ${newShortcut.id}-- ${newShortcut.name}`);
  return updated;
}
function updateShortcut(updatedItem) {
  const current = store.get("shortcuts", []);
  const index = current.findIndex((item) => item.name === updatedItem.name);
  if (index !== -1) {
    current[index] = { ...current[index], ...updatedItem };
  } else {
    current.push(updatedItem);
  }
  console.log(
    `✅ Shortcut update: ${current[index].id}-- ${current[index].name}`
  );
  store.set("shortcuts", current);
  return current;
}
function removeShortcut(sid) {
  const current = store.get("shortcuts", []);
  const updated = current.filter((item) => item.id !== sid);
  store.set("shortcuts", updated);
  console.log(`✅ Shortcut removed`);
  return updated;
}
// =====================================================

// 设置主题
function setTheme(theme) {
  store.set("theme", theme);
  console.log(`\n [setTheme] theme=${theme}`);
  if (!mainWindowRef) return;
  mainWindowRef.setBackgroundColor(theme === "dark" ? "#1E1E1E" : "#FFFFFF");
  mainWindowRef.webContents.send("theme-changed", theme);
}
// 获取当前主题
function getTheme() {
  return store.get("theme", "light");
}

module.exports = {
  quit,
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
  getActiveKey,
  getShortcuts,
  addShortcut,
  updateShortcut,
  removeShortcut,
  setTheme,
  getTheme,
  setAutoShow,
};
