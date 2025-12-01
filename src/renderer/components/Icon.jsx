import React from "react";

export const IconBack = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      d="M15 18l-6-6 6-6"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

export const IconForward = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

export const IconHome = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      d="M3 12L12 3l9 9v9a1 1 0 0 1-1 1h-6v-6H10v6H4a1 1 0 0 1-1-1v-9z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

export const IconRefresh = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      d="M21 12a9 9 0 1 0-3 6.7M21 12v-5m0 0h-5"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export const IconSetting = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z
         M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 9 3V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export const IconMinimize = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <rect x="5" y="11" width="14" height="2" fill="currentColor" />
  </svg>
);

export const IconClose = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const IconPin = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
  >
    <path d="M4 2h7v.278c0 .406-.086.778-.258 1.117-.172.339-.42.63-.742.875v2.86c.307.145.583.328.828.546.245.219.456.464.633.735.177.27.31.565.398.882.089.318.136.646.141.985v.5H8V14l-.5 1-.5-1v-3.222H3v-.5c0-.339.047-.664.14-.977.094-.312.227-.607.4-.883A3.404 3.404 0 0 1 5 7.13V4.27a2.561 2.561 0 0 1-.734-.875A2.505 2.505 0 0 1 4 2.278V2zm1.086.778c.042.125.094.232.156.32a1.494 1.494 0 0 0 .461.43L6 3.715v4.102l-.336.117c-.411.146-.76.383-1.047.711C4.331 8.973 4.09 9.573 4 10h7c-.088-.427-.33-1.027-.617-1.355a2.456 2.456 0 0 0-1.047-.71L9 7.816V3.715l.297-.18c.094-.057.177-.122.25-.195a2.28 2.28 0 0 0 .21-.242.968.968 0 0 0 .157-.32H5.086z" />
  </svg>
);
