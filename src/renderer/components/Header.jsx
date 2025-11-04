import React, { useState, useEffect } from "react";
import "./css/header.css";

const Header = ({ onOpenSettings, showSettings }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleMinimize = () => window.electronAPI?.minimizeWindow();
  const handleClose = () => window.electronAPI?.closeWindow();
  const toggleMenu = (e) => {
    // 阻止事件冒泡，避免触发最小化
    e.stopPropagation();
    // 调用父组件方法来控制设置菜单的显示/隐藏
    onOpenSettings();
  };

  return (
    <div className="header-bar" onDoubleClick={handleMinimize}>
      <div className="header-title">🐟SlackeFish</div>
      <div className="header-actions">
        <button className="header-btn" onClick={handleMinimize} title="最小化">
          <svg width="12" height="12" viewBox="0 0 24 24">
            <rect x="5" y="11" width="14" height="2" fill="currentColor" />
          </svg>
        </button>
        <button className="header-btn" onClick={handleClose} title="关闭">
          <svg width="12" height="12" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        <button className="header-btn" onClick={toggleMenu} onDoubleClick={e => e.stopPropagation()} title="设置">
          <svg width="14" height="14" viewBox="0 0 24 24">
            <path
              d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"
              fill="currentColor"
            />
            <path
              d="M19.43 12.98a7.55 7.55 0 0 0 0-1.96l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a7.54 7.54 0 0 0-1.69-.98l-.38-2.65A.5.5 0 0 0 14 2h-4a.5.5 0 0 0-.49.42l-.38 2.65a7.54 7.54 0 0 0-1.69.98l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.64L4.57 11a7.55 7.55 0 0 0 0 1.96l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46a.5.5 0 0 0 .6.22l2.49-1a7.54 7.54 0 0 0 1.69.98l.38 2.65A.5.5 0 0 0 10 22h4a.5.5 0 0 0 .49-.42l.38-2.65a7.54 7.54 0 0 0 1.69-.98l2.49 1a.5.5 0 0 0 .6-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.1-1.65z"
              stroke="currentColor"
              strokeWidth="0.5"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Header;