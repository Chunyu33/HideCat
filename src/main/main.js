const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
} = require("electron");
const path = require("path");
const windowControl = require("./windowControl");
const autoUpdate = require("./autoUpdate");
const registerIpcHandlers = require("./ipcHandlers");
const { registerShortcuts, unregisterShortcuts } = require("./shortcuts");

if (require("electron-squirrel-startup")) app.quit();

let mainWindow;
let tray;
// 更可靠的开发环境检测
let isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

const createWindow = () => {

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    center: true,
    minWidth: 350,
    frame: false,
    hasShadow: false,
    resizable: true,
    transparent: true, // 开启透明
    // 关键一行！！！开启拉伸热区
    thickFrame: false,               // Windows 专属：关闭厚边框（否则有白边）
    // backgroundColor: '#00000000',
    icon: getIconPath(),
    // 下面这几行才是控制阴影样式的关键（不同平台写法略有区别）
    // titleBarStyle: 'hidden',        // macOS 需要这行才能彻底去掉标题栏残影
    visualEffectState: 'active',    // macOS 毛玻璃振动特效（可选）
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  console.log('\n is dev ==========', isDev)
  if (isDev) {
    // 开发模式加载 Vite dev server
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    // 打包模式加载 Vite build 输出
    mainWindow.loadFile(path.join(__dirname, "../renderer/dist/index.html"));
  }
  // 核心功能
  windowControl.setMainWindow(mainWindow);
  autoUpdate.checkUpdate(mainWindow);
};

// 跨平台获取图标路径
const getIconPath = () => {
  return process.platform === "darwin"
    ? path.join(__dirname, "../assets/app.png")
    : path.join(__dirname, "../assets/app.ico");
};

// 托盘
const createTray = () => {
  const iconPath = getIconPath();
  console.log('\niconPath ==========', iconPath)
  try {
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "显示窗口",
        click: () => {
          windowControl.showWindow();
          windowControl.setAutoShow(false);
        },
      },
      { label: "隐藏窗口", click: () => windowControl.hideWindow() },
      { type: "separator" },
      { label: "退出", click: () => app.quit() },
    ]);
    tray.setContextMenu(contextMenu);
    tray.setToolTip("SlackeFish");

    tray.on("click", () =>
      mainWindow.isVisible()
        ? windowControl.hideWindow()
        : windowControl.showWindow()
    );
  } catch (err) {
    console.warn("Tray icon not found:", err);
  }
};

app.whenReady().then(() => {
  createWindow();
  createTray();

  // 注册 IPC
  registerIpcHandlers(ipcMain, mainWindow);
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

// 全局 unhandledRejection
process.on("unhandledRejection", (reason, promise) => {
  console.warn("Unhandled Rejection at:", promise, "reason:", reason);
});
