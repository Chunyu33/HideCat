import React, { useEffect, useRef, useMemo } from "react";

/**
 * 动态背景组件 - 猫咪主题
 * - 暗色主题：夜空星空 + 飘落的猫爪印 + 右下角猫咪
 * - 亮色主题：清新草原绿 + 飘落的猫爪印 + 右下角猫咪
 */
const AnimatedBackground = ({ theme = "light" }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // 根据主题计算实际使用的主题
  const effectiveTheme = useMemo(() => {
    if (theme === "auto") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // 猫爪印数组
    let pawPrints = [];
    const pawCount = 12;

    // 绘制猫爪印
    const drawPawPrint = (x, y, size, rotation, alpha, color) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = alpha;

      // 主掌垫
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.5, size * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // 四个小肉垫
      const toePositions = [
        { x: -size * 0.45, y: -size * 0.55, rx: size * 0.22, ry: size * 0.25 },
        { x: -size * 0.15, y: -size * 0.75, rx: size * 0.2, ry: size * 0.22 },
        { x: size * 0.15, y: -size * 0.75, rx: size * 0.2, ry: size * 0.22 },
        { x: size * 0.45, y: -size * 0.55, rx: size * 0.22, ry: size * 0.25 },
      ];

      toePositions.forEach((toe) => {
        ctx.beginPath();
        ctx.ellipse(toe.x, toe.y, toe.rx, toe.ry, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    };

    // 绘制右下角的猫咪装饰
    const drawCornerCat = (isDark) => {
      // 根据屏幕大小自适应猫咪尺寸
      const baseSize = Math.min(width, height) * 0.12;
      const size = Math.max(60, Math.min(baseSize, 120));
      const x = width - size * 0.8;
      const y = height - size * 0.6;

      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = isDark ? 0.15 : 0.12;

      const catColor = isDark ? "#a0a0a0" : "#2d5a3d";
      const earInnerColor = isDark ? "#d4a0b0" : "#7cb08a";

      // 身体
      ctx.beginPath();
      ctx.ellipse(-size * 0.3, size * 0.1, size * 0.5, size * 0.35, -0.2, 0, Math.PI * 2);
      ctx.fillStyle = catColor;
      ctx.fill();

      // 头部
      ctx.beginPath();
      ctx.arc(size * 0.15, -size * 0.15, size * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // 左耳
      ctx.beginPath();
      ctx.moveTo(-size * 0.05, -size * 0.4);
      ctx.lineTo(-size * 0.15, -size * 0.7);
      ctx.lineTo(size * 0.1, -size * 0.45);
      ctx.closePath();
      ctx.fill();
      // 左耳内
      ctx.beginPath();
      ctx.moveTo(-size * 0.02, -size * 0.42);
      ctx.lineTo(-size * 0.1, -size * 0.62);
      ctx.lineTo(size * 0.06, -size * 0.45);
      ctx.closePath();
      ctx.fillStyle = earInnerColor;
      ctx.fill();

      // 右耳
      ctx.fillStyle = catColor;
      ctx.beginPath();
      ctx.moveTo(size * 0.35, -size * 0.4);
      ctx.lineTo(size * 0.45, -size * 0.7);
      ctx.lineTo(size * 0.2, -size * 0.45);
      ctx.closePath();
      ctx.fill();
      // 右耳内
      ctx.beginPath();
      ctx.moveTo(size * 0.32, -size * 0.42);
      ctx.lineTo(size * 0.4, -size * 0.62);
      ctx.lineTo(size * 0.22, -size * 0.45);
      ctx.closePath();
      ctx.fillStyle = earInnerColor;
      ctx.fill();

      // 尾巴 - 翘起来
      ctx.strokeStyle = catColor;
      ctx.lineWidth = size * 0.12;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-size * 0.7, size * 0.15);
      ctx.quadraticCurveTo(-size * 1.0, -size * 0.2, -size * 0.85, -size * 0.5);
      ctx.stroke();

      ctx.restore();
    };

    // 初始化猫爪印
    const initPawPrints = () => {
      pawPrints = [];
      for (let i = 0; i < pawCount; i++) {
        pawPrints.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 12 + 8,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.008,
          speedY: Math.random() * 0.25 + 0.08,
          speedX: (Math.random() - 0.5) * 0.15,
          opacity: Math.random() * 0.2 + 0.08,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    // 暗色主题：夜空 + 星星 + 猫爪印
    const drawDarkTheme = (time) => {
      // 深色渐变背景 - 偏绿色调
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0a1510");
      gradient.addColorStop(0.5, "#121f1a");
      gradient.addColorStop(1, "#0f1a15");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 绘制星星
      const starCount = 40;
      for (let i = 0; i < starCount; i++) {
        const starX = (Math.sin(i * 567.89 + time * 0.00005) * 0.5 + 0.5) * width;
        const starY = (Math.cos(i * 123.45) * 0.5 + 0.5) * height;
        const twinkle = Math.sin(time * 0.0015 + i) * 0.5 + 0.5;
        const starSize = (Math.sin(i * 234.56) * 0.5 + 0.5) * 1.2 + 0.4;

        ctx.beginPath();
        ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 230, 210, ${twinkle * 0.5 + 0.15})`;
        ctx.fill();
      }

      // 柔和的绿色光晕
      const glowX = width * 0.3 + Math.sin(time * 0.0002) * 40;
      const glowY = height * 0.4 + Math.cos(time * 0.00015) * 25;
      const glowGradient = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 200);
      glowGradient.addColorStop(0, "rgba(100, 180, 130, 0.06)");
      glowGradient.addColorStop(1, "transparent");
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, width, height);

      // 绘制飘落的猫爪印
      const pawColor = "rgba(120, 160, 140, 0.35)";
      pawPrints.forEach((paw) => {
        paw.y += paw.speedY;
        paw.x += paw.speedX + Math.sin(time * 0.0008 + paw.phase) * 0.2;
        paw.rotation += paw.rotationSpeed;

        if (paw.y > height + paw.size) {
          paw.y = -paw.size;
          paw.x = Math.random() * width;
        }
        if (paw.x < -paw.size) paw.x = width + paw.size;
        if (paw.x > width + paw.size) paw.x = -paw.size;

        drawPawPrint(paw.x, paw.y, paw.size, paw.rotation, paw.opacity, pawColor);
      });

      // 右下角猫咪
      drawCornerCat(true);
    };

    // 亮色主题：清新草原绿 + 猫爪印
    const drawLightTheme = (time) => {
      // 清新绿色渐变背景
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#f5faf7");
      gradient.addColorStop(0.3, "#eef6f0");
      gradient.addColorStop(0.6, "#f0f8f2");
      gradient.addColorStop(1, "#f8fcf9");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 柔和的绿色光斑
      const spotX = width * 0.75 + Math.sin(time * 0.00015) * 50;
      const spotY = height * 0.25 + Math.cos(time * 0.0002) * 35;
      const spotGradient = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, 280);
      spotGradient.addColorStop(0, "rgba(144, 200, 160, 0.1)");
      spotGradient.addColorStop(1, "transparent");
      ctx.fillStyle = spotGradient;
      ctx.fillRect(0, 0, width, height);

      // 第二个光斑
      const spot2X = width * 0.2 + Math.cos(time * 0.00012) * 45;
      const spot2Y = height * 0.65 + Math.sin(time * 0.00018) * 30;
      const spot2Gradient = ctx.createRadialGradient(spot2X, spot2Y, 0, spot2X, spot2Y, 220);
      spot2Gradient.addColorStop(0, "rgba(180, 220, 190, 0.08)");
      spot2Gradient.addColorStop(1, "transparent");
      ctx.fillStyle = spot2Gradient;
      ctx.fillRect(0, 0, width, height);

      // 绘制飘落的猫爪印 - 绿色调
      const pawColor = "rgba(100, 150, 120, 0.18)";
      pawPrints.forEach((paw) => {
        paw.y += paw.speedY;
        paw.x += paw.speedX + Math.sin(time * 0.0008 + paw.phase) * 0.2;
        paw.rotation += paw.rotationSpeed;

        if (paw.y > height + paw.size) {
          paw.y = -paw.size;
          paw.x = Math.random() * width;
        }
        if (paw.x < -paw.size) paw.x = width + paw.size;
        if (paw.x > width + paw.size) paw.x = -paw.size;

        drawPawPrint(paw.x, paw.y, paw.size, paw.rotation, paw.opacity, pawColor);
      });

      // 右下角猫咪
      drawCornerCat(false);
    };

    // 动画循环
    const animate = (time) => {
      if (effectiveTheme === "dark") {
        drawDarkTheme(time);
      } else {
        drawLightTheme(time);
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    // 窗口大小变化处理
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    initPawPrints();
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [effectiveTheme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
};

export default AnimatedBackground;
