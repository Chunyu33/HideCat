const StoreImport = require("electron-store");
const Store = StoreImport.default || StoreImport;

const store = new Store({
  name: "settings",
  defaults: {
    autoHide: false, //初始化时默认不自动隐藏
    opacity: 1.0,
    scale: 1.0,
    shortcuts: [], // 用户快捷入口列表
    theme: "light", // 主题
  },
});

module.exports = store;
