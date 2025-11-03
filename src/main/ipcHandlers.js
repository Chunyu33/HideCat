const {
  showWindow,
  hideWindow,
  hideImmediately,
  setAutoHide,
  getAutoHideState,
  setOpacity,
  setScale,
} = require("./windowControl");

const { BrowserWindow } = require("electron");

let settingsWin = undefined;

function registerIPC(ipcMain, mainWindow) {
  // 用独立窗口加载设置组件
  ipcMain.handle("open-settings-window", () => {
    settingsWin = new BrowserWindow({
      width: 420,
      height: 360,
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
  });

  ipcMain.handle("close-settings-window", () => {
    if (settingsWin) {
      settingsWin.close();
      settingsWin = null;
    }
  });

  ipcMain.handle("minimize-window", () => hideWindow());
  ipcMain.handle("show-window", () => showWindow());
  ipcMain.handle("hide-window", (_, ms) => hideWindow(ms));
  ipcMain.handle("hide-immediately", () => hideImmediately());
  ipcMain.handle("set-auto-hide", (_, args) => {
    const { enabled, count } = args || {};
    setAutoHide(enabled, count);
  });
  ipcMain.handle("get-auto-hide", () => getAutoHideState());
  ipcMain.handle("set-opacity", (_, val) => setOpacity(val));
  ipcMain.handle("get-opacity", () => require("./store").get("opacity"));
  ipcMain.handle("set-scale", (_, val) => setScale(val));
  ipcMain.handle("get-scale", () => require("./store").get("scale"));
  ipcMain.handle("close-window", (_, args) => {
    if (args?.force) process.exit(0);
    else hideWindow();
    // process.exit(0);
  });
}

// BrowserView 标签管理逻辑
const { BrowserView, session } = require("electron");

let mainWindowRef = null;
const browserViews = new Map();
let activeTabKey = null;

// 提供外部初始化方法
function setMainWindowRef(win) {
  mainWindowRef = win;
}

function registerTabHandlers(ipcMain) {
  ipcMain.handle("add-tab", async (_, { key, url }) => {
    if (!mainWindowRef) return;
    if (browserViews.has(key)) return;

    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        partition: `persist:tab-${key}`, // 每个 tab 拥有独立会话
      },
    });

    // 拦截新窗口事件
    view.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
      // 让新链接在当前 view 内加载
      view.webContents.loadURL(targetUrl);
      return { action: "deny" };
    });

    browserViews.set(key, view);
    view.webContents.loadURL(url);
  });

  ipcMain.handle("set-active-tab", async (_, key) => {
    if (!mainWindowRef) return;
    if (activeTabKey === key) return;

    const currentView = browserViews.get(activeTabKey);
    const newView = browserViews.get(key);

    if (currentView) mainWindowRef.removeBrowserView(currentView);

    if (newView) {
      mainWindowRef.setBrowserView(newView);
      const [width, height] = mainWindowRef.getContentSize();
      newView.setBounds({ x: 0, y: 66, width: width, height: height - 66 }); // header 高度 80
      newView.setAutoResize({ width: true, height: true });
    }

    activeTabKey = key;
  });

  ipcMain.handle("remove-tab", async (_, key) => {
    const view = browserViews.get(key);
    if (!view) return;

    if (activeTabKey === key && mainWindowRef) {
      mainWindowRef.removeBrowserView(view);
      activeTabKey = null;
    }

    // 销毁会话缓存
    const viewSession = view.webContents.session;
    if (viewSession) {
      try {
        await viewSession.clearCache();
        await viewSession.clearStorageData();
      } catch {}
    }

    browserViews.delete(key);
    view.webContents.destroy();
  });
}

module.exports = (ipcMain, mainWindow) => {
  registerIPC(ipcMain, mainWindow);
  setMainWindowRef(mainWindow);
  registerTabHandlers(ipcMain);
};
