import React, { useEffect, useRef, useMemo } from "react";

/**
 * 炫酷的动态背景组件
 * - 暗色主题：深海星空 + 游动的小鱼
 * - 亮色主题：柔和波浪 + 游动的小鱼
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

    // 小鱼数组
    let fishes = [];
    const fishCount = effectiveTheme === "dark" ? 15 : 12;

    // 绘制小鱼的函数
    const drawFish = (x, y, size, angle, color, alpha, tailWag) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.globalAlpha = alpha;

      // 鱼身 - 椭圆形
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 1.2, size * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // 鱼尾 - 三角形，带摆动效果
      const tailAngle = Math.sin(tailWag) * 0.3;
      ctx.save();
      ctx.rotate(tailAngle);
      ctx.beginPath();
      ctx.moveTo(-size * 1.1, 0);
      ctx.lineTo(-size * 2, -size * 0.5);
      ctx.lineTo(-size * 2, size * 0.5);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();

      // 鱼鳍 - 上鳍
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.5);
      ctx.quadraticCurveTo(size * 0.3, -size * 1.1, -size * 0.3, -size * 0.6);
      ctx.fillStyle = color;
      ctx.fill();

      // 鱼眼
      ctx.beginPath();
      ctx.arc(size * 0.5, -size * 0.1, size * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = effectiveTheme === "dark" ? "#fff" : "#333";
      ctx.fill();

      // 眼珠
      ctx.beginPath();
      ctx.arc(size * 0.55, -size * 0.1, size * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = "#000";
      ctx.fill();

      ctx.restore();
    };

    // 初始化小鱼
    const initFishes = () => {
      fishes = [];
      const colors = effectiveTheme === "dark"
        ? ["#60a5fa", "#818cf8", "#a78bfa", "#38bdf8", "#22d3ee", "#34d399"]
        : ["#3b82f6", "#6366f1", "#8b5cf6", "#0ea5e9", "#14b8a6", "#10b981"];

      for (let i = 0; i < fishCount; i++) {
        const speedX = (Math.random() * 0.8 + 0.3) * (Math.random() > 0.5 ? 1 : -1);
        fishes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 8 + 6,
          speedX: speedX,
          speedY: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.4 + 0.3,
          color: colors[Math.floor(Math.random() * colors.length)],
          tailWag: Math.random() * Math.PI * 2,
          wagSpeed: Math.random() * 0.15 + 0.1,
        });
      }
    };

    // 暗色主题：深海效果 + 小鱼
    const drawDarkTheme = (time) => {
      // 深海渐变背景
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0a0a1a");
      gradient.addColorStop(0.5, "#1a1a2e");
      gradient.addColorStop(1, "#16213e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 流动的光晕
      const glowX = width * 0.3 + Math.sin(time * 0.0005) * 100;
      const glowY = height * 0.4 + Math.cos(time * 0.0003) * 80;
      const glowGradient = ctx.createRadialGradient(
        glowX, glowY, 0, glowX, glowY, 300
      );
      glowGradient.addColorStop(0, "rgba(99, 102, 241, 0.15)");
      glowGradient.addColorStop(0.5, "rgba(139, 92, 246, 0.08)");
      glowGradient.addColorStop(1, "transparent");
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, width, height);

      // 第二个光晕
      const glow2X = width * 0.7 + Math.cos(time * 0.0004) * 120;
      const glow2Y = height * 0.6 + Math.sin(time * 0.0006) * 60;
      const glow2Gradient = ctx.createRadialGradient(
        glow2X, glow2Y, 0, glow2X, glow2Y, 250
      );
      glow2Gradient.addColorStop(0, "rgba(6, 182, 212, 0.12)");
      glow2Gradient.addColorStop(0.5, "rgba(34, 211, 238, 0.06)");
      glow2Gradient.addColorStop(1, "transparent");
      ctx.fillStyle = glow2Gradient;
      ctx.fillRect(0, 0, width, height);

      // 深海波浪效果
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, height);

        const waveHeight = 40 + i * 25;
        const waveSpeed = 0.0002 + i * 0.00008;
        const waveOffset = i * 80;

        for (let x = 0; x <= width; x += 10) {
          const y =
            height * (0.65 + i * 0.1) +
            Math.sin(x * 0.004 + time * waveSpeed + waveOffset) * waveHeight +
            Math.sin(x * 0.008 + time * waveSpeed * 1.3) * (waveHeight * 0.4);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const waveGradient = ctx.createLinearGradient(0, height * 0.5, 0, height);
        const alpha = 0.15 - i * 0.04;
        waveGradient.addColorStop(0, `rgba(99, 102, 241, ${alpha})`);
        waveGradient.addColorStop(0.5, `rgba(139, 92, 246, ${alpha * 0.6})`);
        waveGradient.addColorStop(1, `rgba(6, 182, 212, ${alpha * 0.3})`);
        ctx.fillStyle = waveGradient;
        ctx.fill();
      }

      // 绘制游动的小鱼
      fishes.forEach((fish) => {
        // 更新位置
        fish.x += fish.speedX;
        fish.y += fish.speedY + Math.sin(time * 0.002 + fish.tailWag) * 0.2;
        fish.tailWag += fish.wagSpeed;

        // 边界检测 - 从另一边出现
        if (fish.speedX > 0 && fish.x > width + fish.size * 3) {
          fish.x = -fish.size * 3;
          fish.y = Math.random() * height;
        } else if (fish.speedX < 0 && fish.x < -fish.size * 3) {
          fish.x = width + fish.size * 3;
          fish.y = Math.random() * height;
        }
        if (fish.y < 0) fish.y = height;
        if (fish.y > height) fish.y = 0;

        // 计算鱼的朝向角度
        const angle = fish.speedX > 0 ? 0 : Math.PI;

        drawFish(fish.x, fish.y, fish.size, angle, fish.color, fish.opacity, fish.tailWag);
      });
    };

    // 亮色主题：柔和波浪效果 + 小鱼
    const drawLightTheme = (time) => {
      // 浅色渐变背景
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#f0f9ff");
      gradient.addColorStop(0.3, "#e0f2fe");
      gradient.addColorStop(0.6, "#f0fdf4");
      gradient.addColorStop(1, "#fefce8");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 柔和的波浪
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, height);

        const waveHeight = 50 + i * 30;
        const waveSpeed = 0.0003 + i * 0.0001;
        const waveOffset = i * 100;

        for (let x = 0; x <= width; x += 10) {
          const y =
            height * (0.6 + i * 0.1) +
            Math.sin(x * 0.005 + time * waveSpeed + waveOffset) * waveHeight +
            Math.sin(x * 0.01 + time * waveSpeed * 1.5) * (waveHeight * 0.5);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const waveGradient = ctx.createLinearGradient(0, height * 0.5, 0, height);
        const alpha = 0.08 - i * 0.02;
        waveGradient.addColorStop(0, `rgba(59, 130, 246, ${alpha})`);
        waveGradient.addColorStop(1, `rgba(147, 197, 253, ${alpha * 0.5})`);
        ctx.fillStyle = waveGradient;
        ctx.fill();
      }

      // 绘制游动的小鱼
      fishes.forEach((fish) => {
        // 更新位置
        fish.x += fish.speedX;
        fish.y += fish.speedY + Math.sin(time * 0.002 + fish.tailWag) * 0.2;
        fish.tailWag += fish.wagSpeed;

        // 边界检测 - 从另一边出现
        if (fish.speedX > 0 && fish.x > width + fish.size * 3) {
          fish.x = -fish.size * 3;
          fish.y = Math.random() * height;
        } else if (fish.speedX < 0 && fish.x < -fish.size * 3) {
          fish.x = width + fish.size * 3;
          fish.y = Math.random() * height;
        }
        if (fish.y < 0) fish.y = height;
        if (fish.y > height) fish.y = 0;

        // 计算鱼的朝向角度
        const angle = fish.speedX > 0 ? 0 : Math.PI;

        drawFish(fish.x, fish.y, fish.size, angle, fish.color, fish.opacity, fish.tailWag);
      });

      // 顶部光晕
      const topGlow = ctx.createRadialGradient(
        width * 0.5, -100, 0, width * 0.5, -100, 400
      );
      topGlow.addColorStop(0, "rgba(251, 191, 36, 0.1)");
      topGlow.addColorStop(1, "transparent");
      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, width, height * 0.5);
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
    initFishes();
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
