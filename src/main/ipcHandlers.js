const {
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
  addTab,
  setActiveTab,
  removeTab,
} = require("./windowControl");

function registerIPC(ipcMain, mainWindow) {
  // 初始化主窗口引用
  setMainWindow(mainWindow);
  setMainWindowRef(mainWindow);

  // ======================
  // 设置窗口控制
  // ======================
  ipcMain.handle("open-settings-window", () => openSettingsWindow());
  ipcMain.handle("close-settings-window", () => closeSettingsWindow());

  // ======================
  // 主窗口操作
  // ======================
  ipcMain.handle("minimize-window", () => hideWindow());
  ipcMain.handle("show-window", () => showWindow());
  ipcMain.handle("hide-window", (_, ms) => hideWindow(ms));
  ipcMain.handle("hide-immediately", () => hideImmediately());

  // ======================
  // 自动隐藏 / 透明度 / 缩放
  // ======================
  ipcMain.handle("set-auto-hide", (_, args) => {
    const { enabled, count } = args || {};
    setAutoHide(enabled, count);
  });
  ipcMain.handle("get-auto-hide", () => getAutoHideState());

  ipcMain.handle("set-opacity", (_, val) => setOpacity(val));
  ipcMain.handle("get-opacity", () => require("./store").get("opacity"));

  ipcMain.handle("set-scale", (_, val) => setScale(val));
  ipcMain.handle("get-scale", () => require("./store").get("scale"));

  // ======================
  // 主窗口关闭
  // ======================
  ipcMain.handle("close-window", (_, args) => {
    if (args?.force) process.exit(0);
    else hideWindow();
    // process.exit(0);
  });

  // ======================
  // BrowserView 标签管理
  // ======================
  ipcMain.handle("add-tab", async (_, { key, url }) => addTab(key, url));
  ipcMain.handle("set-active-tab", async (_, key) => setActiveTab(key));
  ipcMain.handle("remove-tab", async (_, key) => removeTab(key));
}

module.exports = registerIPC;
