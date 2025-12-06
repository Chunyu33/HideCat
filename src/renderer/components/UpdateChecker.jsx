import React, { useState, useEffect } from 'react';
import { Button, Progress, Alert } from 'antd';

const UpdateChecker = () => {
  const [updateStatus, setUpdateStatus] = useState('idle');
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [devMessage, setDevMessage] = useState('');

  useEffect(() => {
    // 监听更新事件
    const handleUpdateStatus = (event, status) => {
      setUpdateStatus(status);
    };

    const handleUpdateAvailable = (event, info) => {
      setUpdateStatus('available');
      setUpdateInfo(info);
      console.log('发现新版本:', info);
    };

    const handleUpdateNotAvailable = (event, info) => {
      setUpdateStatus('not-available');
      console.log('当前已是最新版本');
    };

    const handleDownloadProgress = (event, progress) => {
      setDownloadProgress(Math.round(progress.percent));
      setUpdateStatus('downloading');
    };

    const handleUpdateDownloaded = (event, info) => {
      setUpdateStatus('downloaded');
      setUpdateInfo(info);
      console.log('更新已下载完成，准备安装');
    };

    const handleUpdateError = (event, error) => {
      setUpdateStatus('error');
      console.error('更新检查失败:', error);
    };

    // 监听检查更新结果（处理开发环境）
    const handleUpdateCheckResult = (event, result) => {
      if (result.isDev) {
        setUpdateStatus('dev-mode');
        setDevMessage(result.message || '开发模式下无法检查更新');
      } else if (result.success) {
        setUpdateStatus('not-available');
        setUpdateInfo(result.updateInfo);
      } else {
        setUpdateStatus('error');
        console.error('更新检查失败:', result.error);
      }
    };

    // 注册事件监听器
    window.electronAPI?.onUpdateStatus?.(handleUpdateStatus);
    window.electronAPI?.onUpdateAvailable?.(handleUpdateAvailable);
    window.electronAPI?.onUpdateNotAvailable?.(handleUpdateNotAvailable);
    window.electronAPI?.onDownloadProgress?.(handleDownloadProgress);
    window.electronAPI?.onUpdateDownloaded?.(handleUpdateDownloaded);
    window.electronAPI?.onUpdateError?.(handleUpdateError);
    window.electronAPI?.onUpdateCheckResult?.(handleUpdateCheckResult);

    return () => {
      // 清理事件监听器
      window.electronAPI?.removeUpdateStatusListener?.();
      window.electronAPI?.removeUpdateAvailableListener?.();
      window.electronAPI?.removeUpdateNotAvailableListener?.();
      window.electronAPI?.removeDownloadProgressListener?.();
      window.electronAPI?.removeUpdateDownloadedListener?.();
      window.electronAPI?.removeUpdateErrorListener?.();
      window.electronAPI?.removeUpdateCheckResultListener?.();
    };
  }, []);

  const checkForUpdates = async () => {
    setUpdateStatus('checking');
    setDevMessage('');
    try {
      await window.electronAPI?.checkForUpdates?.();
    } catch (error) {
      setUpdateStatus('error');
      console.error('检查更新失败:', error);
    }
  };

  const installUpdate = () => {
    window.electronAPI?.quitAndInstall?.();
  };

  const getStatusText = () => {
    switch (updateStatus) {
      case 'checking':
        return '正在检查更新...';
      case 'available':
        return `发现新版本: ${updateInfo?.version}`;
      case 'downloading':
        return `正在下载更新: ${downloadProgress}%`;
      case 'downloaded':
        return '更新已下载完成，重启应用即可安装';
      case 'not-available':
        return '当前已是最新版本';
      case 'dev-mode':
        return devMessage || '开发模式下无法检查更新';
      case 'error':
        return '检查更新失败';
      default:
        return '点击检查更新';
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      fontSize: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {/* 状态显示区域 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        minHeight: '24px'
      }}>
        <span style={{ 
          color: 'var(--text-color-secondary)',
          fontWeight: '500',
          fontSize: '12px'
        }}>
          自动更新状态:
        </span>
        <span style={{ 
          color: updateStatus === 'idle' ? 'var(--text-color-secondary)' : 'var(--text-color)',
          fontWeight: 'normal',
          fontSize: '12px',
          fontStyle: updateStatus === 'idle' ? 'italic' : 'normal'
        }}>
          {getStatusText()}
        </span>
      </div>
      
      {/* 按钮区域 - 始终显示，但不同状态显示不同内容 */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        justifyContent: 'flex-end',
        minHeight: '24px'
      }}>
        {updateStatus === 'idle' && (
          <Button 
            type="primary" 
            size="small"
            onClick={checkForUpdates}
            style={{
              fontSize: '12px',
              height: '24px',
              padding: '0 12px'
            }}
          >
            检查更新
          </Button>
        )}
        
        {updateStatus === 'downloaded' && (
          <Button 
            type="primary" 
            size="small"
            onClick={installUpdate}
            style={{
              fontSize: '12px',
              height: '24px',
              padding: '0 12px',
              backgroundColor: '#ff9800',
              borderColor: '#ff9800'
            }}
          >
            立即重启并安装
          </Button>
        )}
        
        {(updateStatus === 'not-available' || updateStatus === 'dev-mode') && (
          <Button 
            size="small"
            onClick={checkForUpdates}
            style={{
              fontSize: '12px',
              height: '24px',
              padding: '0 12px'
            }}
          >
            再次检查
          </Button>
        )}
      </div>
      
      {/* 进度条 - 只在下载时显示 */}
      {updateStatus === 'downloading' && (
        <div style={{ marginTop: '4px' }}>
          <Progress
            percent={downloadProgress}
            size="small"
            strokeColor={{
              '0%': '#4caf50',
              '100%': '#4caf50',
            }}
            trailColor="rgba(0, 0, 0, 0.06)"
            showInfo={false}
            style={{
              width: '100%'
            }}
          />
        </div>
      )}
      
      {/* 错误信息 */}
      {updateStatus === 'error' && (
        <Alert
          message={getStatusText()}
          type="error"
          showIcon
          size="small"
          style={{ 
            fontSize: '12px',
            marginTop: '4px'
          }}
        />
      )}
      
      {/* 开发模式信息 */}
      {updateStatus === 'dev-mode' && (
        <Alert
          message={getStatusText()}
          type="info"
          showIcon
          size="small"
          style={{ 
            fontSize: '12px',
            marginTop: '4px'
          }}
        />
      )}
    </div>
  );
};

export default UpdateChecker;