const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // 窗口操作
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  closeWindow: () => ipcRenderer.invoke("close-window"),
  hideWindow: (ms = 0) => ipcRenderer.invoke("hide-window", ms),
  showWindow: () => ipcRenderer.invoke("show-window"),
  dragWindow: () => ipcRenderer.invoke("drag-window"),
  stopDragging: () => ipcRenderer.send("stop-dragging"),
  togglePinWindow: () => ipcRenderer.invoke("pinned-window"),

  // 设置窗口
  openSettingsWindow: () => ipcRenderer.invoke("open-settings-window"),
  closeSettingsWindow: () => ipcRenderer.invoke("close-settings-window"),

  navigateView: (action) => ipcRenderer.send("navigate-view", action),

  // 窗口样式
  setOpacity: (val) => ipcRenderer.invoke("set-opacity", val),
  getOpacity: () => ipcRenderer.invoke("get-opacity"),
  setScale: (val) => ipcRenderer.invoke("set-scale", val),
  getScale: () => ipcRenderer.invoke("get-scale"),

  // 自动隐藏功能
  setAutoHide: (enabled, count) =>
    ipcRenderer.invoke("set-auto-hide", { enabled, count }),
  getAutoHide: () => ipcRenderer.invoke("get-auto-hide"),

  // tab窗口功能
  getActiveKey: () => ipcRenderer.invoke("get-active-key"),
  addTab: (key, url) => ipcRenderer.invoke("add-tab", { key, url }),
  removeTab: (key) => ipcRenderer.invoke("remove-tab", key),
  setActiveTab: (key) => ipcRenderer.invoke("set-active-tab", key),
  createNewTab: () => ipcRenderer.invoke("create-new-tab"),

  // 窗口加载状态事件监听
  onTabLoading: (cb) => {
    const listener = (_, data) => cb && cb(data);
    ipcRenderer.on("tab-loading", listener);
    return () => ipcRenderer.removeListener("tab-loading", listener);
  },
  onTabLoaded: (cb) => {
    const listener = (_, data) => cb && cb(data);
    ipcRenderer.on("tab-loaded", listener);
    return () => ipcRenderer.removeListener("tab-loaded", listener);
  },
  onTabLoadFailed: (cb) => {
    const listener = (_, data) => cb && cb(data);
    ipcRenderer.on("tab-load-failed", listener);
    return () => ipcRenderer.removeListener("tab-load-failed", listener);
  },
  onTabFinish: (cb) => {
    const listener = (_, data) => cb && cb(data);
    ipcRenderer.on("tab-finish", listener);
    return () => ipcRenderer.removeListener("tab-finish", listener);
  },

  // 快捷入口
  getShortcuts: () => ipcRenderer.invoke("get-shortcuts"),
  addShortcut: (item) => ipcRenderer.invoke("add-shortcut", item),
  updateShortcut: (item) => ipcRenderer.invoke("update-shortcut", item),
  removeShortcut: (id) => ipcRenderer.invoke("remove-shortcut", id),

  // 主题切换
  setTheme: (theme) => ipcRenderer.invoke("set-theme", theme),
  getTheme: () => ipcRenderer.invoke("get-theme"),
  onThemeChanged: (callback) => {
    const handler = (_, theme) => callback(theme); // 只传递 theme
    ipcRenderer.on("theme-changed", handler);
    return () => ipcRenderer.removeListener("theme-changed", handler); // 返回取消函数
  },

  // 自动更新
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  quitAndInstall: () => ipcRenderer.invoke("quit-and-install"),
  
  // 更新事件监听器
  onUpdateStatus: (callback) => {
    const handler = (_, status) => callback && callback(status);
    ipcRenderer.on("update-status", handler);
    return () => ipcRenderer.removeListener("update-status", handler);
  },
  onUpdateAvailable: (callback) => {
    const handler = (_, info) => callback && callback(info);
    ipcRenderer.on("update-available", handler);
    return () => ipcRenderer.removeListener("update-available", handler);
  },
  onUpdateNotAvailable: (callback) => {
    const handler = (_, info) => callback && callback(info);
    ipcRenderer.on("update-not-available", handler);
    return () => ipcRenderer.removeListener("update-not-available", handler);
  },
  onDownloadProgress: (callback) => {
    const handler = (_, progress) => callback && callback(progress);
    ipcRenderer.on("download-progress", handler);
    return () => ipcRenderer.removeListener("download-progress", handler);
  },
  onUpdateDownloaded: (callback) => {
    const handler = (_, info) => callback && callback(info);
    ipcRenderer.on("update-downloaded", handler);
    return () => ipcRenderer.removeListener("update-downloaded", handler);
  },
  onUpdateError: (callback) => {
    const handler = (_, error) => callback && callback(error);
    ipcRenderer.on("update-error", handler);
    return () => ipcRenderer.removeListener("update-error", handler);
  },
  onUpdateCheckResult: (callback) => {
    console.log('\n===onUpdateCheckResult========== callback registered')
    const handler = (_, result) => {
      console.log('preload: update-check-result received:', result)
      callback && callback(result);
    };
    ipcRenderer.on("update-check-result", handler);
    return () => ipcRenderer.removeListener("update-check-result", handler);
  },
});
