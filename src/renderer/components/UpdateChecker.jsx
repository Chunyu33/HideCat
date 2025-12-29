import React, { useState, useEffect } from 'react';
import { Button, Progress, Alert } from 'antd';

const UpdateChecker = () => {
  const [updateStatus, setUpdateStatus] = useState('idle');
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [devMessage, setDevMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    console.log('UpdateChecker: useEffect called, registering event listeners')
    
    // ✅ 修复:移除 event 参数,直接接收数据
    const handleUpdateStatus = (status) => {
      console.log('UpdateChecker: received update-status:', status);
      setUpdateStatus(status);
    };

    const handleUpdateAvailable = (info) => {
      console.log('UpdateChecker: received update-available:', info);
      setUpdateStatus('available');
      setUpdateInfo(info);
    };

    const handleUpdateNotAvailable = (info) => {
      console.log('UpdateChecker: received update-not-available:', info);
      setUpdateStatus('not-available');
    };

    const handleDownloadProgress = (progress) => {
      console.log('UpdateChecker: received download-progress:', progress);
      setDownloadProgress(Math.round(progress.percent));
      setUpdateStatus('downloading');
    };

    const handleUpdateDownloaded = (info) => {
      console.log('UpdateChecker: received update-downloaded:', info);
      setUpdateStatus('downloaded');
      setUpdateInfo(info);
    };

    const handleUpdateError = (error) => {
      console.log('UpdateChecker: received update-error:', error);
      setUpdateStatus('error');
      setErrorMessage(typeof error === 'string' ? error : '');
    };

    // ✅ 关键修复:移除 event 参数
    const handleUpdateCheckResult = (result) => {
      console.log('UpdateChecker: received update-check-result:', result);
      
      if (result.isDev) {
        setUpdateStatus('dev-mode');
        setDevMessage(result.message || '开发模式下无法检查更新');
        setErrorMessage('');
        console.log('UpdateChecker: set status to dev-mode');
      } else if (result.success) {
        setErrorMessage('');
        if (result.isUpdateAvailable) {
          setUpdateStatus('available');
          setUpdateInfo(result.updateInfo);
          console.log('UpdateChecker: set status to available');
        } else {
          setUpdateStatus('not-available');
          setUpdateInfo(result.updateInfo);
          console.log('UpdateChecker: set status to not-available');
        }
      } else {
        setUpdateStatus('error');
        setErrorMessage(result.error || '');
        console.error('更新检查失败:', result.error);
        console.log('UpdateChecker: set status to error');
      }
    };

    // 注册事件监听器
    const cleanupStatus = window.electronAPI?.onUpdateStatus?.(handleUpdateStatus);
    const cleanupAvailable = window.electronAPI?.onUpdateAvailable?.(handleUpdateAvailable);
    const cleanupNotAvailable = window.electronAPI?.onUpdateNotAvailable?.(handleUpdateNotAvailable);
    const cleanupProgress = window.electronAPI?.onDownloadProgress?.(handleDownloadProgress);
    const cleanupDownloaded = window.electronAPI?.onUpdateDownloaded?.(handleUpdateDownloaded);
    const cleanupError = window.electronAPI?.onUpdateError?.(handleUpdateError);
    const cleanupCheckResult = window.electronAPI?.onUpdateCheckResult?.(handleUpdateCheckResult);

    console.log('UpdateChecker: all event listeners registered');

    return () => {
      // 清理所有事件监听器
      console.log('UpdateChecker: cleaning up event listeners');
      cleanupStatus?.();
      cleanupAvailable?.();
      cleanupNotAvailable?.();
      cleanupProgress?.();
      cleanupDownloaded?.();
      cleanupError?.();
      cleanupCheckResult?.();
    };
  }, []);

  const checkForUpdates = async () => {
    console.log('UpdateChecker: checkForUpdates called');
    setUpdateStatus('checking');
    setDevMessage('');
    setErrorMessage('');

    try {
      await window.electronAPI?.checkForUpdates?.();
      console.log('UpdateChecker: checkForUpdates invoked');
    } catch (error) {
      setUpdateStatus('error');
      setErrorMessage(error?.message || String(error));
      console.error('检查更新失败:', error);
    }
  };

  const installUpdate = () => {
    console.log('UpdateChecker: installUpdate called');
    setErrorMessage('');
    try {
      Promise.resolve(window.electronAPI?.quitAndInstall?.()).then((res) => {
        if (res && res.success === false) {
          setUpdateStatus('error');
          setErrorMessage(res.error || '安装更新失败');
        }
      }).catch((error) => {
        setUpdateStatus('error');
        setErrorMessage(error?.message || String(error));
      });
    } catch (error) {
      setUpdateStatus('error');
      setErrorMessage(error?.message || String(error));
    }
  };

  const downloadUpdate = async () => {
    console.log('UpdateChecker: downloadUpdate called');
    setErrorMessage('');
    setUpdateStatus('downloading');
    try {
      await window.electronAPI?.downloadUpdate?.();
    } catch (error) {
      setUpdateStatus('error');
      setErrorMessage(error?.message || String(error));
    }
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
        return '更新已下载完成,重启应用即可安装';
      case 'not-available':
        return '当前已是最新版本';
      case 'dev-mode':
        return devMessage || '开发模式下无法检查更新';
      case 'error':
        return errorMessage ? `检查更新失败：${errorMessage}` : '检查更新失败';
      default:
        return '点击检查更新';
    }
  };

  return (
    <div className="update-checker-section">
      <div className="update-checker-header">
        <div className="update-checker-title">
          应用更新
          <span className="update-checker-status">
            {getStatusText()}
          </span>
        </div>
      </div>
      
      <div className="update-checker-content">
        {/* 按钮区域 */}
        <div className="update-checker-actions">
          {updateStatus === 'idle' && (
            <Button 
              type="primary" 
              size="small"
              onClick={checkForUpdates}
              className="update-checker-btn-primary"
            >
              检查更新
            </Button>
          )}

          {updateStatus === 'available' && (
            <Button
              type="primary"
              size="small"
              onClick={downloadUpdate}
              className="update-checker-btn-primary"
            >
              立即下载更新
            </Button>
          )}
          
          {updateStatus === 'downloaded' && (
            <Button 
              type="primary" 
              size="small"
              onClick={installUpdate}
              className="update-checker-btn-install"
            >
              立即重启并安装
            </Button>
          )}
          
          {(updateStatus === 'not-available' || updateStatus === 'dev-mode' || updateStatus === 'error') && (
            <Button 
              size="small"
              onClick={checkForUpdates}
              className="update-checker-btn-secondary"
            >
              再次检查
            </Button>
          )}
        </div>
        
        {/* 进度条 */}
        {updateStatus === 'downloading' && (
          <div className="update-checker-progress">
            <Progress
              percent={downloadProgress}
              size="small"
              showInfo={false}
              className="update-checker-progress-bar"
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
            className="update-checker-alert"
          />
        )}
        
        {/* 开发模式信息 */}
        {updateStatus === 'dev-mode' && (
          <Alert
            message={getStatusText()}
            type="info"
            showIcon
            size="small"
            className="update-checker-alert"
          />
        )}
      </div>
    </div>
  );
};

export default UpdateChecker;