import React, { useState, useEffect, useRef } from "react";
import { Slider, Switch, Tooltip } from "antd";
import QuestionMark from "./QuestionMark";
import "./css/setting.css";

const SettingMenu = ({ onClose, onScaleChange }) => {
  const [autoHide, setAutoHide] = useState(false);
  const [opacity, setOpacity] = useState(0.9);
  const [scale, setScale] = useState(1.0);
  const clickTimeout = useRef(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const [auto, op, sc] = await Promise.all([
        window.electronAPI.getAutoHide?.(),
        window.electronAPI.getOpacity?.(),
        window.electronAPI.getScale?.(),
      ]);
      if (auto !== undefined) setAutoHide(auto);
      if (op !== undefined) setOpacity(op);
      if (sc !== undefined) setScale(sc);
    };
    fetchSettings();
  }, []);

  const handleAutoHide = (checked) => {
    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    clickTimeout.current = setTimeout(() => {
      setAutoHide(checked);
      window.electronAPI?.setAutoHide?.(checked, 200);
    }, 100);
  };

  const handleOpacity = (value) => {
    setOpacity(value);
    window.electronAPI?.setOpacity?.(value);
  };

  const handleScale = (value) => {
    setScale(value);
    if (onScaleChange) onScaleChange(value);
  };

  useEffect(() => {
    return () => {
      if (clickTimeout.current) clearTimeout(clickTimeout.current);
    };
  }, []);

  const handleClose = () => {
    // ✅ 优先触发 React 传入的关闭逻辑
    if (onClose) onClose();
    // ✅ 如果这是独立弹窗（即 settingsWindow），调用主进程关闭
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
    <div className="setting-menu">
      <div className="setting-header">
        <span className="setting-title">设置</span>
        <button className="close-btn" onClick={handleClose}>
          ✕
        </button>
      </div>

      <div className="setting-item">
        <span className="setting-label row-center">
          自动隐藏
          <Tooltip
            title="开启后，鼠标离开窗口后自动隐藏在任务栏中。"
            placement="bottomRight"
            color="#4caf50"
            styles={{
              body: { color: "#fff" },
            }}
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
            styles={{
              body: { color: "#fff" },
            }}
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
            tipFormatter={formatTip}
          />
        </div>
      </div>

      <div className="setting-item">
        <span className="setting-label row-center">网页缩放</span>
        <div className="range-input">
          <Slider
            min={0.5}
            max={1.5}
            step={0.1}
            value={scale}
            onChange={handleScale}
            style={{ width: "100%" }}
            tipFormatter={formatTip}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingMenu;
