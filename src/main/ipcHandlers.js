const {
  quit,
  minimizeWindow,
  setMainWindow,
  openSettingsWindow,
  closeSettingsWindow,
  openExternalUrl,
  showWindow,
  hideWindow,
  hideImmediately,
  setAutoHide,
  getAutoHideState,
  setOpacity,
  setScale,
  setAutoZoom,
  getAutoZoom,
  addTab,
  setActiveTab,
  removeTab,
  navigateView,
  getActiveKey,
  getShortcuts,
  getHiddenDefaultShortcutIds,
  hideDefaultShortcut,
  unhideDefaultShortcut,
  addShortcut,
  updateShortcut,
  removeShortcut,
  setTheme,
  getTheme,
  setSearchEngine,
  getSearchEngine,
  dragWindow,
  stopDragging,
  pinWindow
} = require("./windowControl");
const {
  getGlobalShortcuts,
  setGlobalShortcuts,
  resetGlobalShortcuts,
  setShortcutRecordingPaused,
} = require("./shortcuts");
const { checkForUpdates, quitAndInstall } = require("./autoUpdate");
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
  // 全局快捷键（可自定义）
  // ======================
  ipcMain.handle("get-global-shortcuts", () => getGlobalShortcuts());
  ipcMain.handle("set-global-shortcuts", (_, overrides) =>
    setGlobalShortcuts(overrides)
  );
  ipcMain.handle("reset-global-shortcuts", () => resetGlobalShortcuts());
  ipcMain.handle("set-shortcut-recording-paused", (_, paused) =>
    setShortcutRecordingPaused(paused)
  );

  // ======================
  // 打开外部链接
  // ======================
  ipcMain.handle("open-external", (_, url) => openExternalUrl(url));

  // ======================
  // 主窗口操作
  // ======================
  ipcMain.handle("minimize-window", () => minimizeWindow());
  ipcMain.handle("show-window", () => showWindow());
  ipcMain.handle("hide-window", (_, ms) => hideWindow(ms));
  ipcMain.handle("hide-immediately", () => hideImmediately());
  ipcMain.handle("drag-window", () => dragWindow());
  ipcMain.handle("toggle-pin-window", () => pinWindow());
  
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

  // 自动缩放开关
  ipcMain.handle("set-auto-zoom", (_, enabled) => setAutoZoom(enabled));
  ipcMain.handle("get-auto-zoom", () => getAutoZoom());

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

  // 默认快捷入口隐藏（非删除）
  ipcMain.handle("get-hidden-default-shortcuts", () =>
    getHiddenDefaultShortcutIds()
  );
  ipcMain.handle("hide-default-shortcut", (_, id) => hideDefaultShortcut(id));
  ipcMain.handle("unhide-default-shortcut", (_, id) =>
    unhideDefaultShortcut(id)
  );

  // ======================
  // 主题管理
  // ======================
  ipcMain.handle("get-theme", () => getTheme());
  ipcMain.handle("set-theme", (_, theme) => setTheme(theme));

  // ======================
  // 搜索引擎
  // ======================
  ipcMain.handle("get-search-engine", () => getSearchEngine());
  ipcMain.handle("set-search-engine", (_, engine) => setSearchEngine(engine));

  // ======================
  // 自动更新管理
  // ======================
  ipcMain.handle("check-for-updates", () => checkForUpdates());
  ipcMain.handle("quit-and-install", () => quitAndInstall());
}

module.exports = registerIPC;
