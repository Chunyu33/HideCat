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
const store = require("./store");

// Squirrel startup check removed - using NSIS installer

let mainWindow;
let tray;
// 更可靠的开发环境检测
let isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

const createWindow = () => {
  const transparentBorder = store.get("transparentBorder", false);

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    center: true,
    minWidth: 350,
    minHeight: 260,
    frame: false,
    hasShadow: !transparentBorder,
    resizable: true,
    transparent: transparentBorder, // 透明边框，需要在窗口创建时确定
    thickFrame: true,
    backgroundColor: transparentBorder ? "#00000000" : "#ffffff",
    fullscreenable: false,        // 禁止系统级全屏（绿色按钮 / 双击标题栏）
    simpleFullscreen: false,      // 禁止 macOS 独立空间全屏
    titleBarStyle: "hiddenInset", // 隐藏标题栏不会影响此行为
    icon: getIconPath(),
    // 下面这几行才是控制阴影样式的关键（不同平台写法略有区别）
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  // console.log('\n is dev ==========', isDev)
  if (isDev) {
    // 开发模式加载 Vite dev server
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    // 打包模式加载 Vite build 输出
    // 使用正确的路径：在打包后，dist 目录位于 app.asar 中
    const indexPath = path.join(__dirname, "../../h5/index.html");
    mainWindow.loadFile(indexPath);
    // 生产环境不自动打开开发者工具
    // mainWindow.webContents.openDevTools();
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
    tray.setToolTip("躲躲猫");

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
  // Windows 系统通知/任务栏分组用的 AppUserModelId
  // 不设置时可能显示为 electron.app.Electron
  if (process.platform === "win32") {
    app.setAppUserModelId("HideCat");
  }

  // macOS 通知/菜单栏等展示名通常来自应用 bundle 信息。
  // 开发态可能显示为 Electron，这里设置一下 name，尽量让展示名更符合产品。
  if (process.platform === "darwin") {
    app.setName("躲躲猫");
  }

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
