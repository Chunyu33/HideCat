import React, { useEffect, useState, useRef } from "react";
import { ConfigProvider } from "antd";
import Header from "./components/Header";
import SettingMenu from "./components/SettingMenu";

const App = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [scale, setScale] = useState(1.0); // 添加缩放状态
  const settingsRef = useRef(null);

  // 初始化设置
  const initSettings = async () => {
    // 从store中获取
    const [auto, op, sc] = await Promise.all([
      window.electronAPI.getAutoHide?.(),
      window.electronAPI.getOpacity?.(),
      window.electronAPI.getScale?.(),
    ]);
    console.log(auto, op, sc, '-----store')
    if (auto !== undefined) {
      window.electronAPI?.setAutoHide?.(auto);
    };
    if (op !== undefined) {
      window.electronAPI?.setOpacity?.(op);
    };
    if (sc !== undefined) {
      // window.electronAPI?.setScale?.(sc);
      setScale(sc); // 设置初始缩放级别
    };
  }

  // 初始化时从 store 获取状态并且应用设置
  useEffect(() => {
    initSettings();
  }, []);

  // 处理点击外部区域关闭设置菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSettings && settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  // 控制设置菜单显示/隐藏的函数
  const toggleSettings = () => {
    setShowSettings(prev => !prev);
  };

  // 处理缩放变化
  const handleScaleChange = (newScale) => {
    setScale(newScale);
  };

  // 全局快捷键 Alt+F 在主进程已注册，这里不需要
  // 这里只管理设置菜单展示和页面嵌入 iframe

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4caf50',
        },
      }}
    >
      <div className="app-container">
        <Header onOpenSettings={toggleSettings} showSettings={showSettings} />
        <div className="content-container">
          {showSettings && (
            <div ref={settingsRef}>
              <SettingMenu onClose={() => setShowSettings(false)} onScaleChange={handleScaleChange} />
            </div>
          )}
          {/* 主要内容区域，应用缩放 */}
          <div className="main-content" style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: 'top left',
            width: `calc(100% / ${scale})`,
            height: `calc(100% / ${scale})`,
            overflow: 'auto'
          }}>
            {/* 这里放置你的主要内容 */}
            <div>
              <h1>你好兄弟的</h1>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default App;