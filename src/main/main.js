const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  screen,
} = require("electron");
const path = require("node:path");
const windowControl = require("./windowControl");
const registerIpcHandlers = require("./ipcHandlers");
const { registerShortcuts, unregisterShortcuts } = require("./shortcuts");

if (require("electron-squirrel-startup")) app.quit();

let mainWindow;
let tray;
let isDev = process.env.NODE_ENV === "development";

const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    x: width - 820,
    y: height - 620,
    frame: false,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  if (isDev) mainWindow.webContents.openDevTools();

  windowControl.setMainWindow(mainWindow);
  // initAutoHideWatcher(); // ✅ 初始化自动隐藏检测逻辑
};

const createTray = () => {
  const iconPath = path.join(__dirname, "assets", "fish.png");
  const trayIcon = nativeImage.createFromPath(iconPath);
  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    { label: "显示窗口", click: () => windowControl.showWindow() },
    { label: "隐藏窗口", click: () => windowControl.hideWindow() },
    { type: "separator" },
    {
      label: "退出",
      click: () => {
        windowControl.clearAllTimer();
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Fish Slacke");
  tray.setContextMenu(contextMenu);

  tray.on("click", () =>
    mainWindow.isVisible()
      ? windowControl.hideWindow()
      : windowControl.showWindow()
  );
};

app.whenReady().then(() => {
  createWindow();
  createTray();

  // 注册IPC事件
  registerIpcHandlers(ipcMain, mainWindow);
  // 注册快捷键
  registerShortcuts();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 清理快捷键
app.on("will-quit", () => {
  unregisterShortcuts();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
