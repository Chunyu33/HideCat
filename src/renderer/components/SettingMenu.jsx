import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Slider,
  Switch,
  Tooltip,
  Select,
  Button,
  message,
  ConfigProvider,
  theme as antdTheme,
} from "antd";
import {
  SettingOutlined,
  InfoCircleOutlined,
  MessageOutlined,
  CopyOutlined,
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
  { key: "feedback", label: "意见反馈", icon: <MessageOutlined /> },
  { key: "about", label: "关于", icon: <InfoCircleOutlined /> },
];

const CONTACT_WECHAT = "B_HH6050";
const CONTACT_EMAIL = "1378813463@qq.com";

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

  const openExternal = async (url) => {
    try {
      await window.electronAPI?.openExternal?.(url);
    } catch (e) {
      message.error("打开失败");
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success("已复制");
    } catch (e) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        message.success("已复制");
      } catch (err) {
        message.error("复制失败");
      }
    }
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
                      <a
                        className="setting-footer-link"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          openExternal("https://example.com/terms");
                        }}
                      >
                        服务协议
                      </a>
                      <a
                        className="setting-footer-link"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          openExternal("https://example.com/privacy");
                        }}
                      >
                        隐私协议
                      </a>
                      <a
                        className="setting-footer-link"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveNav("feedback");
                        }}
                      >
                        意见反馈
                      </a>
                      <a
                        className="setting-footer-link"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          message.info("暂未配置上传日志");
                        }}
                      >
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

              {activeNav === "feedback" && (
                <>
                  <div className="setting-section-title">意见反馈</div>
                  <div className="setting-feedback-section">
                    <div className="setting-feedback-header">
                      <div className="setting-feedback-title">联系方式</div>
                      <div className="setting-feedback-subtitle">
                        欢迎通过以下方式联系我
                      </div>
                    </div>

                    <div className="setting-feedback-items">
                      <div className="setting-feedback-row">
                        <div className="setting-feedback-label">微信号</div>
                        <div className="setting-feedback-right">
                          <span className="setting-feedback-value">
                            {CONTACT_WECHAT}
                          </span>
                          <Button
                            size="small"
                            type="text"
                            className="setting-copy-btn"
                            icon={<CopyOutlined />}
                            onClick={() => copyText(CONTACT_WECHAT)}
                          >
                            复制
                          </Button>
                        </div>
                      </div>

                      <div className="setting-feedback-row">
                        <div className="setting-feedback-label">邮箱</div>
                        <div className="setting-feedback-right">
                          <button
                            type="button"
                            className="setting-feedback-link"
                            onClick={() =>
                              openExternal(`mailto:${CONTACT_EMAIL}`)
                            }
                          >
                            {CONTACT_EMAIL}
                          </button>
                          <Button
                            size="small"
                            type="text"
                            className="setting-copy-btn"
                            icon={<CopyOutlined />}
                            onClick={() => copyText(CONTACT_EMAIL)}
                          >
                            复制
                          </Button>
                        </div>
                      </div>
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
