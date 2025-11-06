const StoreImport = require('electron-store');
const Store = StoreImport.default || StoreImport;

const store = new Store({
  name: 'settings',
  defaults: {
    autoHide: true,
    opacity: 0.9,
    scale: 1.0,
    shortcuts: [], // 用户快捷入口列表
  },
});

module.exports = store;
