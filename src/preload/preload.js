const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // 窗口操作
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  closeWindow: () => ipcRenderer.invoke("close-window"),
  hideWindow: (ms = 0) => ipcRenderer.invoke("hide-window", ms),
  showWindow: () => ipcRenderer.invoke("show-window"),

  // 设置窗口
  openSettingsWindow: () => ipcRenderer.invoke("open-settings-window"),
  closeSettingsWindow: () => ipcRenderer.invoke("close-settings-window"),

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
  addTab: (key, url) => ipcRenderer.invoke("add-tab", { key, url }),
  removeTab: (key) => ipcRenderer.invoke("remove-tab", key),
  setActiveTab: (key) => ipcRenderer.invoke("set-active-tab", key),

  // 窗口加载
  onTabLoading: (cb) =>
    ipcRenderer.on("tab-loading", (_, data) => cb && cb(data)),
  onTabLoaded: (cb) =>
    ipcRenderer.on("tab-loaded", (_, data) => cb && cb(data)),
  onTabLoadFailed: (cb) =>
    ipcRenderer.on("tab-load-failed", (_, data) => cb && cb(data)),
});
