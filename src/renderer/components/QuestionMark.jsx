import React from 'react';

/**
 * @description 返回一个精致小巧且与外圆有适当间隙的问号 SVG 图标。
 * @param {object} props - 组件属性。
 * @param {string} [props.size='14'] - 图标的宽度和高度。
 * @param {object} [props.style={}] - 自定义样式对象。
 * @param {function} [props.onClick] - 点击事件处理函数。
 * @param {string} [props.className] - 自定义 CSS 类名。
 */
const QuestionMark = ({ size = '14', style, onClick, className, ...restProps }) => {
  
  const defaultStyle = { 
    marginLeft: 4, 
    cursor: onClick ? 'pointer' : 'default',
    ...style 
  };
  
  const INNER_STROKE_WIDTH = "1.5"; 
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24" 
      style={defaultStyle}
      onClick={onClick}
      className={className}
      {...restProps} 
    >
      {/* 外部圆圈 - 保持不变 */}
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor" 
        strokeWidth="2" 
      />
      
      {/* 问号的弧线和垂直部分 - 主要调整这里 */}
      <path 
        // 调整路径 d 属性：
        // 1. M10 8：将起始点 Y 坐标提高 (从 9 -> 8)
        // 2. a2 2：减小弧度半径
        // 3. c...：调整曲线控制点，使问号整体更紧凑，向上收缩
        d="M10 8a2 2 0 014 0c0 1-0.5 1.5-1 2.5s-1.5 1.5-1.5 2.5"
        fill="none"
        stroke="currentColor" 
        strokeWidth={INNER_STROKE_WIDTH} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* 问号的点 - 调整 cy 使其向上移动一些 */}
      <circle cx="12" cy="16.5" r="0.8" fill="currentColor" /> {/* 将点从 18 移到 16.5 */}
    </svg>
  );
};

export default QuestionMark;
