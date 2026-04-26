import React, { useState } from "react";
import BrowserMark from "./BrowserMark";

/**
 * 自动加载网站 favicon 的组件
 * 优先使用 Google S2 服务获取高清图标，失败后回退到 BrowserMark
 */
const Favicon = ({ url, size = 22 }) => {
  const [error, setError] = useState(false);

  if (!url || error) {
    return <BrowserMark size={size} />;
  }

  let domain;
  try {
    domain = new URL(url).hostname;
  } catch {
    return <BrowserMark size={size} />;
  }

  const faviconUrl = `https://favicon.im/${domain}`;

  return (
    <img
      src={faviconUrl}
      alt=""
      width={size}
      height={size}
      style={{ borderRadius: 4, objectFit: "contain" }}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
};

export default Favicon;
