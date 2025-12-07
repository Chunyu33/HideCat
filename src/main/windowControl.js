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
let dragInterval = null; // 拖动定时器

const COUNTDOWN = 3500; // 倒计时

// 设置主窗口引用
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

// 最小化窗口
function minimizeWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.minimize();
}

// =================== 功能设置窗口逻辑 ===================
function openSettingsWindow() {
  if (!mainWindow) return false;

  const [parentWidth, parentHeight] = mainWindow.getSize();

  const width = Math.floor(parentWidth * 0.8);
  const height = Math.floor(parentHeight * 0.8);

  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

  // 子窗口 preload 路径
  const preloadPath = path.join(__dirname, "../preload/preload.js");

  console.log("\nprocess.resourcesPath===", process.resourcesPath);
  // 子窗口 URL
  const url = isDev
    ? `http://localhost:5173/?window=settings`
    : `file://${path.join(__dirname, "../../h5/index.html")}?window=settings`;

  settingsWin = new BrowserWindow({
    width,
    height,
    minWidth: 340,
    minHeight: 240,
    resizable: true,
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
  // if (isDev) {
  //   settingsWin.webContents.openDevTools();
  // }
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

// ============== 窗口控制基本功能 ==============
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
// ============== 最核心逻辑部分：鼠标检测自动隐藏 ==============
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
        mainWindow.show();
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

// ======================== BrowserView 标签管理逻辑 ========================
const browserViews = new Map();
let activeTabKey = null;

/**
 * 基于URL生成稳定的key，确保同一网站的标签页共享会话
 */
function generateStableKey(url, originalKey) {
  // 如果是主页或空白页，使用原始key
  if (url === "about:blank" || url.includes("?window=home")) {
    return originalKey;
  }

  try {
    // 提取域名作为稳定的key基础
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, ""); // 移除www前缀

    // 生成基于域名的稳定key
    const stableKey = `tab-${domain}`;
    console.log(`URL: ${url} -> 稳定key: ${stableKey}`);
    return stableKey;
  } catch (e) {
    // 如果URL解析失败，使用原始key
    console.warn(`URL解析失败，使用原始key: ${originalKey}`);
    return originalKey;
  }
}

// 获取浏览器窗口大小
function _getBorserSize() {
  // if(!mainWindow) return;
  // let [x, y] = mainWindow.getPosition();
  const [width, height] = mainWindow.getContentSize();
  let sizeObj = {
    width,
    height: height - 32.4,
    x: 0,
    y: 32.4,
  };
  return sizeObj;
}

/**
 * 创建新标签页并加载 URL
 */
async function addTab(key, url) {
  if (!mainWindow) return;

  // 基于URL生成稳定的key，确保同一网站的标签页共享会话
  const stableKey = generateStableKey(url, key);

  let view = browserViews.get(stableKey);
  const preloadPath = path.join(__dirname, "../preload/preload.js");
  if (!view) {
    // 使用基于URL的稳定会话分区名称，确保同一网站的登录信息可以共享
    const sessionName = `persist:tab-${stableKey}`;
    const session = require("electron").session.fromPartition(sessionName, {
      cache: true,
      persistent: true,
    });

    view = new BrowserView({
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        session: session, // 用自定义 session
        webSecurity: false, // 允许跨域请求
        allowRunningInsecureContent: true, // 允许不安全内容
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
        mainWindow.webContents.send("tab-load-failed", {
          key,
          errorCode,
          errorDescription,
          url: validatedURL,
        });
      }
    );

    view.webContents.on("dom-ready", () => {
      const title = view.webContents.getTitle?.() || "";
      mainWindow.webContents.send("tab-loaded", { key, url, title });
      console.log(`DOM ready...Tab ${key} loaded: ${url}`);
    });

    view.webContents.on("did-finish-load", () => {
      mainWindow.webContents.send("tab-finish", { key, url });
      // 加载完成后 确保缩放比例立即生效
      const scale = store.get("scale", 1.0); // 获取全局缩放比例
      view.webContents.setZoomFactor(scale); // 立即应用缩放
      console.log(`\n setZoomFactor for scale=${scale}`);
      console.log(`✅ Tab ${key} finished loading: ${url}`);
    });

    // view.webContents.on("did-navigate", (event, url) => {
    //   console.log("\njump new URL:", url);
    //   updateAllTheme();
    // });

    // view.webContents.on(
    //   "did-navigate-in-page",
    //   (event, url, isMainFrame, frameProcessId, frameRoutingId) => {
    //     console.log("\n inner router:", url);
    //     updateAllTheme();
    //   }
    // );
  }

  try {
    mainWindow.webContents.send("tab-loading", { key, url });
    console.log(`[addTab] load url for key=${key}, url=${url}`);
    view.webContents.loadURL(url);
  } catch (e) {
    console.warn("loadURL failed", e);
  }

  // 如果当前激活 tab 就是这个 key，则刷新 BrowserView 显示
  if (activeTabKey === key) {
    try {
      mainWindow.setBrowserView(view);
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
  if (!mainWindow) return;
  if (activeTabKey === key) return;

  const currentView = browserViews.get(activeTabKey);
  const newView = browserViews.get(key);

  if (currentView) mainWindow.removeBrowserView(currentView);

  if (newView) {
    mainWindow.setBrowserView(newView);
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

  if (activeTabKey === key && mainWindow) {
    mainWindow.removeBrowserView(view);
    activeTabKey = null;
  }

  // 重要：不清理缓存和会话数据，以保留登录信息
  // 会话数据会随着应用关闭而自动清理，但标签页切换时保持登录状态
  console.log(`删除标签页 ${key}，但保留会话数据`);

  browserViews.delete(key);
  view.webContents.destroy();
}

// ================= 网页导航 ========================
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
      const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
      const homeUrl = isDev
        ? "http://localhost:5173/?window=home"
        : `file://${path.join(__dirname, "../../h5/index.html")}?window=home`;
      wc.loadURL(homeUrl);
      break;
  }
}

// =================== 快捷入口逻辑====================
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

// ===========================主题设置逻辑==========================
// 设置主题
function setTheme(theme) {
  store.set("theme", theme);
  console.log(`\n [setTheme] theme=${theme}`);
  if (!mainWindow) return;
  mainWindow.setBackgroundColor(theme === "dark" ? "#1E1E1E" : "#FFFFFF");
  mainWindow.webContents.send("theme-changed", theme);
  // updateAllTheme();
}
// 获取当前主题
function getTheme() {
  return store.get("theme", "light");
}

// ========================== 拖动窗口 ==========================
function dragWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  // 先停止之前的拖动（如果存在）
  if (dragInterval) {
    clearInterval(dragInterval);
    dragInterval = null;
  }

  // 对于无边框窗口，需要手动实现拖动
  const { screen } = require("electron");
  const mousePos = screen.getCursorScreenPoint();
  const windowBounds = mainWindow.getBounds();

  // 计算鼠标在窗口内的相对位置
  const offsetX = mousePos.x - windowBounds.x;
  const offsetY = mousePos.y - windowBounds.y;

  // 开始拖动循环
  dragInterval = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      clearInterval(dragInterval);
      dragInterval = null;
      return;
    }

    const currentMousePos = screen.getCursorScreenPoint();

    // 移动窗口到新的位置
    mainWindow.setPosition(
      currentMousePos.x - offsetX,
      currentMousePos.y - offsetY
    );
  }, 16); // 约60fps
}

// 停止拖动窗口
function stopDragging() {
  if (dragInterval) {
    clearInterval(dragInterval);
    dragInterval = null;
  }
}

// ========================== 置顶窗口 ==========================
function pinWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const isAlwaysOnTop = mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(!isAlwaysOnTop);

  // 发送置顶状态变化事件到渲染进程
  mainWindow.webContents.send("pin-state-changed", !isAlwaysOnTop);
  return !isAlwaysOnTop;
}

module.exports = {
  quit,
  setMainWindow,
  minimizeWindow,
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
  dragWindow,
  stopDragging,
  pinWindow,
};
