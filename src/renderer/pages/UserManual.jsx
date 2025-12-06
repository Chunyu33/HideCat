import React from 'react';
import { Modal } from 'antd';

const userManualData = [
  { 
    q: "如何使用该软件？", 
    a: "您可以通过点击首页的快捷按钮来或者搜索框输入关键字开始摸鱼。",
    img: ""
  },
  { 
    q: "如何调整设置？", 
    a: "点击右上角的设置按钮，在设置页面中您可以修改个人偏好。",
    img: ""
  },
  { 
    q: "开启自动隐藏后，为什么鼠标移回原窗口的位置，窗口没有显示？", 
    a: "大概是您目前鼠标在其他的窗口操作，SlackeFish的层级被其他的窗口遮住，或者按到了`ESC`。按`ALT+F`或者`Ctrl+E`恢复就好。",
    img: ""
  },
  { 
    q: "开启自动隐藏后，鼠标移到到原位置又显示，担心被Leader看见？ 如何暂停这个交互？", 
    a: "这种场景大多数是Leader来看您的工作进展情况，您可以按`ESC`键暂停交互，之后按`ALT+F`或者`Ctrl+E`键恢复交互。",
    img: ""
  },
  { 
    q: "标签栏过多时怎么切换？", 
    a: "可以把鼠标移动到标签栏位置，然后滚动滚轮进行切换。",
    img: ""
  },
  { 
    q: "软件支持哪些操作系统？", 
    a: "该软件支持 Windows、macOS操作系统。",
    img: ""
  },
  { 
    q: "如何反馈建议或报告问题？", 
    a: "你可以加入QQ群：735521320 直接@群主提出问题或建议。必要的话后续会增加其他反馈渠道。",
    img: ""
  },
  { 
    q: "遇到其他问题怎么办？", 
    a: "如果遇到其他问题，可以通过添加作者微信 B_HH6050 联系技术支持。",
    img: ""
  },
  // { 
  //   q: "如何查看版本信息？", 
  //   a: "点击设置页面底部，您将看到当前的版本信息。",
  //   img: ""
  // },
  // { 
  //   q: "如何更新到最新版本？", 
  //   a: "您可以在主界面选择检查更新，系统会自动下载并安装最新版本。",
  //   img: ""
  // },
];

const UserManual = ({ visible, onClose }) => {
  return (
    <Modal
      title="用户手册"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 30 }}
    >
      <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
        {userManualData.map((item, index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'var(--background-secondary)',
              margin: '10px 0',
              borderRadius: '8px',
              padding: '15px',
              boxShadow: 'var(--shadow-color)',
            }}
          >
            <h3 style={{ color: 'var(--primary-color)' }}>Q{index + 1}: {item.q}</h3>
            <p style={{ color: 'var(--text-color-secondary)' }}>A: {item.a}</p>
            {/* 条件渲染图片 */}
            {item.img && (
              <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <img
                  src={item.img}
                  alt={item.q} // 设置 alt 属性为问题描述
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default UserManual;
