const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // App info
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // File operations
  openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options),
  saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog', options),
  
  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  
  // Listeners
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (_, data) => callback(data));
  },
  onResourceUsage: (callback) => {
    ipcRenderer.on('resource-usage', (_, data) => callback(data));
  },
  onHighResourceUsage: (callback) => {
    ipcRenderer.on('high-resource-usage', (_, data) => callback(data));
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
