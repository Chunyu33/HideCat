import React, { useState, useEffect, useRef } from "react";
import { Slider, Switch, Tooltip } from "antd";
import "./css/setting.css";

const SettingMenu = ({ onClose }) => {
  const [autoHide, setAutoHide] = useState(false);
  const [opacity, setOpacity] = useState(0.9);
  const [scale, setScale] = useState(1.0);
  const clickTimeout = useRef(null);

  const autoHideTip = `开启后，鼠标离开窗口后自动隐藏在折叠的任务栏中。点击折叠任务栏图标菜单或按ALT+F可恢复显示。`

  // 打开设置时从主进程获取最新状态
  useEffect(() => {
    const fetchSettings = async () => {
      const [auto, op, sc] = await Promise.all([
        window.electronAPI.getAutoHide?.(),
        window.electronAPI.getOpacity?.(),
        window.electronAPI.getScale?.(),
      ]);
      console.log(auto, op, sc, '-----store')
      if (auto !== undefined) setAutoHide(auto);
      if (op !== undefined) setOpacity(op);
      if (sc !== undefined) setScale(sc);
    };
    fetchSettings();
  }, []);

  const handleAutoHide = (checked) => {
    // 清除之前的timeout
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
    }
    
    // 设置新的timeout，防抖处理
    clickTimeout.current = setTimeout(() => {
      setAutoHide(checked);
      // 更新主进程 store 并触发自动隐藏逻辑
      window.electronAPI?.setAutoHide?.(checked, 200);
    }, 100);
  };

  const handleOpacity = (value) => {
    setOpacity(value);
    window.electronAPI?.setOpacity?.(value); // 更新 store 并立即设置窗口透明度
  };

  const handleScale = (value) => {
    setScale(value);
    window.electronAPI?.setScale?.(value); // 更新 store 并触发窗口缩放
  };

  // 清理timeout
  useEffect(() => {
    return () => {
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
      }
    };
  }, []);

  return (
    <div className="setting-menu" onMouseLeave={onClose}>
      <div className="setting-item">
        <span className="setting-label row-center">
          自动隐藏
          <Tooltip title={autoHideTip}>
            <svg width="14" height="14" viewBox="0 0 24 24" style={{ marginLeft: 4, verticalAlign: 'middle', cursor: 'pointer' }}>
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M12 16v-4" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="8" r="1" fill="currentColor" />
            </svg>
          </Tooltip>
        </span>
        <div style={{ margin: '6px 0', textAlign: 'center' }}>
          <Switch 
            checked={autoHide} 
            onChange={handleAutoHide} 
            style={{ marginLeft: 'auto' }}
          />
        </div>
      </div>
      
      <div className="setting-item">
        <span className="setting-label">透明度</span>
        <div className="range-input">
          <Slider
            min={0.4}
            max={1}
            step={0.01}
            value={opacity}
            onChange={handleOpacity}
            style={{ width: 100 }}
          />
          <span className="range-value">{Math.round(opacity * 100)}%</span>
        </div>
      </div>
      
      <div className="setting-item">
        <span className="setting-label">网页缩放</span>
        <div className="range-input">
          <Slider
            min={0.5}
            max={1.5}
            step={0.1}
            value={scale}
            onChange={handleScale}
            style={{ width: 100 }}
          />
          <span className="range-value">{Math.round(scale * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

export default SettingMenu;