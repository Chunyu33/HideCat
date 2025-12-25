import React, { useMemo, useState } from "react";
import "./css/header.css";
import {
  IconBack,
  IconForward,
  IconHome,
  IconRefresh,
  IconSetting,
  IconMinimize,
  IconClose,
  IconPin,
} from "./Icon";
import useTheme from "../hooks/useTheme";
// import AppIcon from "../../assets/app.png";

const IconButton = ({ title, onClick, children }) => (
  <button className="header-btn" onClick={onClick} title={title}>
    {children}
  </button>
);

const Header = ({ onOpenSettings, headerVisible, onRequestHide }) => {
  const { theme } = useTheme();
  const [hideTimeout, setHideTimeout] = useState(null);
  const [isPinned, setIsPinned] = useState(false);

  const navigate = (action) => {
    window.electronAPI?.navigateView?.(action);
  };
  const handleMinimize = () => window.electronAPI?.minimizeWindow();
  const handleClose = () => window.electronAPI?.closeWindow();

  // 处理置顶窗口
  const handlePinToggle = async () => {
    const newPinnedState = await window.electronAPI?.togglePinWindow();
    if (newPinnedState !== undefined) {
      setIsPinned(newPinnedState);
    }
  };

  // 处理拖动窗口（IPC 自定义实现）
  const handleDragStart = (e) => {
    // 阻止事件冒泡，避免影响按钮点击
    e.stopPropagation();
    window.electronAPI?.dragWindow?.();

    // 添加鼠标释放事件监听器
    const handleMouseUp = () => {
      window.electronAPI?.stopDragging?.();
      document.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("blur", handleMouseUp);
    };

    document.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("blur", handleMouseUp);
  };

  const handleMouseLeave = () => {
    if (hideTimeout) clearTimeout(hideTimeout);
    const timeout = setTimeout(() => {
      onRequestHide?.();
    }, 300); // 延迟隐藏，避免鼠标滑出瞬间关闭
    setHideTimeout(timeout);
  };

  const handleMouseEnter = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
  };

  const baseStyle = { width: "18px", height: "18px", borderRadius: "2px" };
  const iconStyle = useMemo(() => {
    if (theme === "auto") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      return systemTheme === "dark"
        ? { ...baseStyle, filter: "invert(100%)" }
        : { ...baseStyle, filter: "invert(0%)" };
    }
    return theme === "dark"
      ? { ...baseStyle, filter: "invert(100%)" }
      : { ...baseStyle, filter: "invert(0%)" };
  }, [theme]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        transform: headerVisible ? "translateY(0)" : "translateY(-100%)",
        transition: "transform 0.3s ease",
      }}
      onMouseEnter={handleMouseEnter}
    >
      <div
        className="header-bar"
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleDragStart}
      >
        {/* 左侧 Logo + 导航 */}
        <div className="header-left">
          {/* <div className="header-title">
            <img src={AppIcon} alt="" style={iconStyle} />
            SlackeFish
          </div> */}
          {/* 生成一个置顶的图标 */}
          <div
            className="pinned-box"
            title={isPinned ? "取消置顶" : "置顶窗口"}
            onClick={handlePinToggle}
          >
            <IconPin className={isPinned ? "pinned" : ""} />
          </div>
        </div>

        {/* 右侧操作按钮 */}
        <div className="header-actions">
          <IconButton title="后退" onClick={() => navigate("back")}>
            <IconBack />
          </IconButton>
          <IconButton title="前进" onClick={() => navigate("forward")}>
            <IconForward />
          </IconButton>
          <IconButton title="主页" onClick={() => navigate("home")}>
            <IconHome />
          </IconButton>
          <IconButton title="刷新" onClick={() => navigate("reload")}>
            <IconRefresh />
          </IconButton>
          <IconButton title="设置" onClick={onOpenSettings}>
            <IconSetting />
          </IconButton>
          <IconButton title="最小化" onClick={handleMinimize}>
            <IconMinimize />
          </IconButton>
          <IconButton title="关闭" onClick={handleClose}>
            <IconClose />
          </IconButton>
        </div>
      </div>
    </div>
  );
};

export default Header;
