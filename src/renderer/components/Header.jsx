import React, { useMemo } from "react";
import "./css/header.css";
import {
  IconBack,
  IconForward,
  IconHome,
  IconRefresh,
  IconSetting,
  IconMinimize,
  IconClose,
} from "./Icon";
import useTheme from "../hooks/useTheme";
import AppIcon from "../../assets/app.png";

// 独立 SVG 组件
const IconButton = ({ title, onClick, children }) => (
  <button className="header-btn" onClick={onClick} title={title}>
    {children}
  </button>
);

const Header = ({ onOpenSettings }) => {
  const navigate = (action) => {
    window.electronAPI?.navigateView?.(action);
  };
  const handleMinimize = () => window.electronAPI?.minimizeWindow();
  const handleClose = () => window.electronAPI?.closeWindow();
  const { theme } = useTheme();

  const baseStyle = {
    width: "18px",
    height: "18px",
    borderRadius: "2px",
  }

  const iconStyle = useMemo(() => {
    if (theme === "auto") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      return systemTheme === "dark"
        ? {...baseStyle, filter: "invert(100%)"}
        : {...baseStyle, filter: "invert(0%)"};
    }
    return theme === "dark"
      ? {...baseStyle, filter: "invert(100%)"}
      : {...baseStyle, filter: "invert(0%)"};
  }, [theme]);

  return (
    <div className="header-bar">
      {/* 左侧 Logo + 导航 */}
      <div className="header-left">
        <div className="header-title">
          <img
            src={AppIcon}
            alt=""
            style={iconStyle}
          />
          SlackeFish
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
  );
};

export default Header;
