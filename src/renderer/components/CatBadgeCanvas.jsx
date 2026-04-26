import React, { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_COLOR = "#43a047";

const resolveTitleColor = () => {
  if (typeof window === "undefined") return DEFAULT_COLOR;
  const rootStyle = getComputedStyle(document.documentElement);
  const titleColor = rootStyle.getPropertyValue("--text-color-title").trim();
  return titleColor || DEFAULT_COLOR;
};

const drawPaw = (ctx, size, color, phase) => {
  const c = size / 2;
  const bob = Math.sin(phase) * 0.8;

  ctx.clearRect(0, 0, size, size);

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.ellipse(c, c + size * 0.14 + bob, size * 0.2, size * 0.17, 0, 0, Math.PI * 2);
  ctx.fill();

  const toeDots = [
    [c - size * 0.16, c - size * 0.1 + bob],
    [c - size * 0.05, c - size * 0.2 + bob],
    [c + size * 0.07, c - size * 0.2 + bob],
    [c + size * 0.18, c - size * 0.1 + bob],
  ];

  toeDots.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.07, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
};

const drawPin = (ctx, size, color, phase) => {
  const c = size / 2;
  const bob = Math.sin(phase) * 0.6;

  ctx.clearRect(0, 0, size, size);

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.16;
  ctx.beginPath();
  ctx.arc(c, c - size * 0.12 + bob, size * 0.34, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(c, c - size * 0.12 + bob, size * 0.17, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(c, c - size * 0.12 + bob, size * 0.05, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineCap = "round";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(c, c + size * 0.08 + bob);
  ctx.lineTo(c, c + size * 0.33 + bob);
  ctx.stroke();
};

const CatBadgeCanvas = ({ type = "paw", size = 26, className = "" }) => {
  const canvasRef = useRef(null);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useEffect(() => {
    setColor(resolveTitleColor());

    const refresh = () => setColor(resolveTitleColor());

    const observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let rafId = 0;

    const render = (time) => {
      const phase = reducedMotion ? 0 : time * 0.004;

      if (type === "pin") {
        drawPin(ctx, size, color, phase);
      } else {
        drawPaw(ctx, size, color, phase);
      }

      if (!reducedMotion) {
        rafId = requestAnimationFrame(render);
      }
    };

    render(0);

    if (!reducedMotion) {
      rafId = requestAnimationFrame(render);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [color, reducedMotion, size, type]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
};

export default CatBadgeCanvas;
