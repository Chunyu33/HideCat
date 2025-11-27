const {
  quit,
  minimizeWindow,
  setMainWindow,
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
  navigateView,
  getActiveKey,
  getShortcuts,
  addShortcut,
  updateShortcut,
  removeShortcut,
  setTheme,
  getTheme,
  dragWindow,
  stopDragging,
} = require("./windowControl");
const { randomUUID } = require("crypto");

function registerIPC(ipcMain, mainWindow) {
  // 初始化主窗口引用
  setMainWindow(mainWindow);

  // ======================
  // 设置窗口控制
  // ======================
  ipcMain.handle("open-settings-window", () => openSettingsWindow());
  ipcMain.handle("close-settings-window", () => closeSettingsWindow());
  ipcMain.on("navigate-view", (_, action) => navigateView(action));

  // ======================
  // 主窗口操作
  // ======================
  ipcMain.handle("minimize-window", () => minimizeWindow());
  ipcMain.handle("show-window", () => showWindow());
  ipcMain.handle("hide-window", (_, ms) => hideWindow(ms));
  ipcMain.handle("hide-immediately", () => hideImmediately());
  ipcMain.handle("drag-window", () => dragWindow());
  
  // 停止拖动（通过 IPC 消息）
  ipcMain.on("stop-dragging", () => {
    stopDragging();
  });
  
  // ======================
  // 自动隐藏 / 透明度 / 缩放
  // ======================
  ipcMain.handle("set-auto-hide", (_, args) => {
    const { enabled, count } = args || {};
    setAutoHide(enabled, count);
  });
  ipcMain.handle("get-active-key", () => getActiveKey());
  ipcMain.handle("get-auto-hide", () => getAutoHideState());

  ipcMain.handle("set-opacity", (_, val) => setOpacity(val));
  ipcMain.handle("get-opacity", () => require("./store").get("opacity"));

  ipcMain.handle("set-scale", (_, val) => setScale(val));
  ipcMain.handle("get-scale", () => require("./store").get("scale"));

  // ======================
  // 主窗口关闭
  // ======================
  ipcMain.handle("close-window", (_) => quit());

  // ======================
  // BrowserView 标签管理
  // ======================
  ipcMain.handle("add-tab", async (_, { key, url }) => addTab(key, url));
  ipcMain.handle("set-active-tab", async (_, key) => setActiveTab(key));
  ipcMain.handle("remove-tab", async (_, key) => removeTab(key));
  ipcMain.handle("create-new-tab", () => {
    return randomUUID();
  });

  // ======================
  // 快捷入口管理
  // ======================
  ipcMain.handle("get-shortcuts", () => getShortcuts());
  ipcMain.handle("add-shortcut", (_, item) => addShortcut(item));
  ipcMain.handle("update-shortcut", (_, item) => updateShortcut(item));
  ipcMain.handle("remove-shortcut", (_, id) => removeShortcut(id));

  // ======================
  // 主题管理
  // ======================
  ipcMain.handle("get-theme", () => getTheme());
  ipcMain.handle("set-theme", (_, theme) => setTheme(theme));
}

module.exports = registerIPC;
