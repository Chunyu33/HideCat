const { autoUpdater } = require('electron-updater')


let mainWindowRef = null;
function checkUpdate(win) {
  mainWindowRef = win;
  // 检查更新
  autoUpdater.checkForUpdatesAndNotify();
}

// 退出并更新
function quitAndInstall() {
  autoUpdater.quitAndInstall();
}

// 监听更新事件
autoUpdater.on('update-downloaded', () => {
  mainWindowRef.webContents.send('updateReady');
})

module.exports = {
  checkUpdate,
  quitAndInstall
}