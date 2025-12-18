import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Slider,
  Switch,
  Tooltip,
  Select,
  ConfigProvider,
  theme as antdTheme,
} from "antd";
import {
  SettingOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import QuestionMark from "./QuestionMark";
import "./css/setting.css";
import UpdateChecker from "./UpdateChecker";

// 主题选项
const themeOptions = [
  { label: "浅色模式", value: "light" },
  { label: "深色模式", value: "dark" },
  // { label: "跟随系统", value: "auto" },
];

const NAV_ITEMS = [
  { key: "general", label: "通用", icon: <SettingOutlined /> },
  { key: "about", label: "关于", icon: <InfoCircleOutlined /> },
];

const SettingMenu = ({ onClose, onScaleChange }) => {
  const [autoHide, setAutoHide] = useState(false);
  const [opacity, setOpacity] = useState(0.9);
  const [scale, setScale] = useState(1.0);
  const [theme, setTheme] = useState("auto"); // 本地状态
  const [activeNav, setActiveNav] = useState("general");
  const clickTimeout = useRef(null);

  useEffect(() => {
    // 初始化时读取设置
    const fetchSettings = async () => {
      const [auto, op, sc, th] = await Promise.all([
        window.electronAPI.getAutoHide?.(),
        window.electronAPI.getOpacity?.(),
        window.electronAPI.getScale?.(),
        window.electronAPI.getTheme?.(),
      ]);
      if (auto !== undefined) setAutoHide(auto);
      if (op !== undefined) setOpacity(op);
      if (sc !== undefined) setScale(sc);
      if (th !== undefined) {
        setTheme(th);
        applyThemeToDOM(th);
      }
    };
    fetchSettings();
  }, []);

  // 处理自动隐藏
  const handleAutoHide = (checked) => {
    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    clickTimeout.current = setTimeout(() => {
      setAutoHide(checked);
      window.electronAPI?.setAutoHide?.(checked, 200);
    }, 100);
  };

  // 处理透明度
  const handleOpacity = (value) => {
    setOpacity(value);
    window.electronAPI?.setOpacity?.(value);
  };

  // 处理缩放
  const handleScale = (value) => {
    setScale(value);
    window.electronAPI?.setScale?.(value);
    if (onScaleChange) onScaleChange(value);
  };

  // 将主题应用到当前页面
  const applyThemeToDOM = (value) => {
    if (value === "auto") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute(
        "data-theme",
        isDark ? "dark" : "light"
      );
    } else {
      document.documentElement.setAttribute("data-theme", value);
    }
  };

  // 切换主题
  const handleThemeChange = async (value) => {
    setTheme(value);
    applyThemeToDOM(value);
    await window.electronAPI?.setTheme?.(value); // 通知主进程
  };
  const antdConfig = useMemo(() => {
    console.log("\n setting theme", theme);
    if (theme === "auto") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      console.log("systemTheme", systemTheme);
      return systemTheme === "dark"
        ? { algorithm: antdTheme.darkAlgorithm }
        : { algorithm: antdTheme.defaultAlgorithm };
    }
    return theme === "dark"
      ? { algorithm: antdTheme.darkAlgorithm }
      : { algorithm: antdTheme.defaultAlgorithm };
  }, [theme]);

  useEffect(() => {
    return () => {
      if (clickTimeout.current) clearTimeout(clickTimeout.current);
    };
  }, []);

  // 关闭窗口
  const handleClose = () => {
    if (onClose) onClose();
    if (window.electronAPI?.closeSettingsWindow) {
      window.electronAPI.closeSettingsWindow();
    }
  };

  const formatTip = (tipValue) => {
    if (tipValue == null) {
      return null;
    }
    return `${Math.round(tipValue * 100)}%`;
  };

  return (
    <ConfigProvider
      theme={{
        ...antdConfig,
        token: {
          colorPrimary: "#4caf50",
          colorBgBase: theme === "dark" ? "#000" : "#fff",
        },
      }}
    >
      <div className="setting-menu setting-layout">
        <div className="setting-header setting-titlebar" role="banner">
          <span className="setting-title">设置</span>
          <button
            className="close-btn setting-titlebar-btn"
            onClick={handleClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="setting-body">
          <aside className="setting-sidebar" aria-label="Settings navigation">
            <div className="setting-sidebar-inner">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`setting-nav-item ${
                    activeNav === item.key ? "is-active" : ""
                  }`}
                  onClick={() => setActiveNav(item.key)}
                >
                  <span className="setting-nav-icon">{item.icon}</span>
                  <span className="setting-nav-label">{item.label}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="setting-content" aria-label="Settings content">
            <div className="setting-content-scroll">
              {activeNav === "general" && (
                <>
                  <div className="setting-section-title">通用</div>
                  <div className="setting-items-container">
                    <div className="setting-item">
                      <span className="setting-label row-center">
                        自动隐藏
                        <Tooltip
                          title="开启后，鼠标离开窗口后自动隐藏在任务栏中。"
                          placement="bottomRight"
                          color="#4caf50"
                          styles={{ body: { color: "#fff" } }}
                        >
                          <QuestionMark size="13" />
                        </Tooltip>
                      </span>
                      <div className="range-input">
                        <Switch checked={autoHide} onChange={handleAutoHide} />
                      </div>
                    </div>

                    <div className="setting-item">
                      <span className="setting-label row-center">
                        透明度
                        <Tooltip
                          title="窗口的透明度，范围0.2~1.0。"
                          placement="bottomRight"
                          color="#4caf50"
                          styles={{ body: { color: "#fff" } }}
                        >
                          <QuestionMark size="13" />
                        </Tooltip>
                      </span>
                      <div className="range-input">
                        <Slider
                          min={0.2}
                          max={1}
                          step={0.01}
                          value={opacity}
                          onChange={handleOpacity}
                          style={{ width: "100%" }}
                          tooltip={{ formatter: formatTip }}
                        />
                      </div>
                    </div>

                    <div className="setting-item">
                      <span className="setting-label row-center">
                        网页缩放
                        <Tooltip
                          title="网页缩放，范围50%~150%。首页不会进行缩放。"
                          placement="topRight"
                          color="#4caf50"
                          styles={{ body: { color: "#fff" } }}
                        >
                          <QuestionMark size="13" />
                        </Tooltip>
                      </span>
                      <div className="range-input">
                        <Slider
                          min={0.5}
                          max={1.5}
                          step={0.1}
                          value={scale}
                          onChange={handleScale}
                          style={{ width: "100%" }}
                          tooltip={{ formatter: formatTip }}
                        />
                      </div>
                    </div>

                    <div className="setting-item">
                      <span className="setting-label row-center">外观设置</span>
                      <div className="range-input">
                        <Select
                          value={theme}
                          onChange={handleThemeChange}
                          options={themeOptions}
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeNav === "about" && (
                <>
                  <div className="setting-section-title">关于</div>
                  <UpdateChecker />

                  <div className="setting-footer">
                    <div className="setting-footer-links">
                      <a className="setting-footer-link" href="#">
                        服务协议
                      </a>
                      <a className="setting-footer-link" href="#">
                        隐私协议
                      </a>
                      <a className="setting-footer-link" href="#">
                        意见反馈
                      </a>
                      <a className="setting-footer-link" href="#">
                        上传日志
                      </a>
                    </div>
                    <div className="setting-footer-copy">
                      Copyright © {new Date().getFullYear()} SlackeFish. All
                      rights reserved.
                    </div>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default SettingMenu;
