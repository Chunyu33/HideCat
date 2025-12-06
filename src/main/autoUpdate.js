const { autoUpdater } = require('electron-updater');
const { app } = require('electron');

let mainWindowRef = null;

// 检查是否为开发环境
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// 配置自动更新器
function configureUpdater() {
  // 设置自动下载更新
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  
  // 开发环境下强制启用更新检查（仅用于测试）
  if (isDev) {
    autoUpdater.forceDevUpdateConfig = true;
  }
  
  // 设置更新日志输出（如果 electron-log 可用）
  try {
    autoUpdater.logger = require('electron-log');
    autoUpdater.logger.transports.file.level = 'info';
  } catch (error) {
    // 如果 electron-log 不可用，使用 console 作为备用
    console.log('electron-log not available, using console for logging');
  }
}

function checkUpdate(win) {
  mainWindowRef = win;
  configureUpdater();
  
  // 开发环境下不自动检查更新，避免频繁的警告
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
}

// 手动检查更新
function checkForUpdates() {
  if (!mainWindowRef) return;
  
  configureUpdater();
  
  // 先发送检查中状态
  mainWindowRef.webContents.send('update-status', 'checking');
  
  // 开发环境下模拟检查更新
  if (isDev) {
    console.log('开发模式：模拟更新检查');
    // 模拟延迟，让用户看到"正在检查更新"状态
    setTimeout(() => {
      mainWindowRef.webContents.send('update-check-result', {
        success: true,
        isDev: true,
        message: '开发模式下无法检查更新，请打包后测试',
        version: '1.2.0 (开发版)'
      });
    }, 1000);
    return;
  }
  
  autoUpdater.checkForUpdates()
    .then(result => {
      mainWindowRef.webContents.send('update-check-result', {
        success: true,
        updateInfo: result.updateInfo
      });
    })
    .catch(error => {
      mainWindowRef.webContents.send('update-check-result', {
        success: false,
        error: error.message
      });
    });
}

// 退出并更新
function quitAndInstall() {
  autoUpdater.quitAndInstall();
}

// 监听更新事件
autoUpdater.on('checking-for-update', () => {
  mainWindowRef?.webContents.send('update-status', 'checking');
});

autoUpdater.on('update-available', (info) => {
  mainWindowRef?.webContents.send('update-available', info);
});

autoUpdater.on('update-not-available', (info) => {
  mainWindowRef?.webContents.send('update-not-available', info);
});

autoUpdater.on('download-progress', (progressObj) => {
  mainWindowRef?.webContents.send('download-progress', progressObj);
});

autoUpdater.on('update-downloaded', (info) => {
  mainWindowRef?.webContents.send('update-downloaded', info);
});

autoUpdater.on('error', (error) => {
  mainWindowRef?.webContents.send('update-error', error.message);
});

module.exports = {
  checkUpdate,
  checkForUpdates,
  quitAndInstall
}