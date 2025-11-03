const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // 窗口操作
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  closeWindow: () => ipcRenderer.invoke("close-window"),
  hideWindow: (ms = 0) => ipcRenderer.invoke("hide-window", ms),
  showWindow: () => ipcRenderer.invoke("show-window"),

  // 窗口样式
  setOpacity: (val) => ipcRenderer.invoke("set-opacity", val),
  getOpacity: () => ipcRenderer.invoke("get-opacity"),
  setScale: (val) => ipcRenderer.invoke("set-scale", val),
  getScale: () => ipcRenderer.invoke("get-scale"),

  // 自动隐藏功能
  setAutoHide: (enabled, count) =>
    ipcRenderer.invoke("set-auto-hide", { enabled, count }),
  getAutoHide: () => ipcRenderer.invoke("get-auto-hide"),

  // 额外功能
  cancelHideTimer: () => ipcRenderer.invoke("cancel-hide-timer"),
  triggerHideImmediately: () => ipcRenderer.invoke("trigger-hide-immediately"),

  // tab窗口功能
  addTab: (key, url) => ipcRenderer.invoke("add-tab", { key, url }),
  removeTab: (key) => ipcRenderer.invoke("remove-tab", key),
  setActiveTab: (key) => ipcRenderer.invoke("set-active-tab", key),
});
