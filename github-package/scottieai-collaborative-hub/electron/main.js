const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Configure logging
log.transports.file.level = 'info';
log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs/main.log');

// Auto updater configuration
autoUpdater.logger = log;
autoUpdater.autoDownload = false;

// Resource monitoring
let resourceMonitorInterval;
const RESOURCE_MONITOR_INTERVAL = 30000; // 30 seconds

// Application windows
let mainWindow;
let splashWindow;

// Create splash window
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.center();
  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

// Create main window
function createMainWindow() {
  // Get screen dimensions for optimal sizing
  const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize;
  const windowWidth = Math.min(1280, width * 0.8);
  const windowHeight = Math.min(800, height * 0.8);

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: 800,
    minHeight: 600,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icons/icon.png')
  });

  // Load the app
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  } else {
    // In development, load from dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }

  // Window events
  mainWindow.on('closed', () => {
    mainWindow = null;
    stopResourceMonitoring();
  });

  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.show();
    startResourceMonitoring();
    checkForUpdates();
  });
}

// App ready event
app.whenReady().then(() => {
  createSplashWindow();
  
  // Delay main window creation to show splash screen
  setTimeout(() => {
    createMainWindow();
  }, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// App events
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Check for updates
function checkForUpdates() {
  if (app.isPackaged) {
    autoUpdater.checkForUpdates();
  }
}

// Start resource monitoring
function startResourceMonitoring() {
  if (resourceMonitorInterval) {
    clearInterval(resourceMonitorInterval);
  }

  resourceMonitorInterval = setInterval(() => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem()
    };

    const resourceInfo = {
      memory: {
        rss: memoryUsage.rss / 1024 / 1024, // MB
        heapTotal: memoryUsage.heapTotal / 1024 / 1024, // MB
        heapUsed: memoryUsage.heapUsed / 1024 / 1024, // MB
        external: memoryUsage.external / 1024 / 1024, // MB
        systemTotal: systemMemory.total / 1024 / 1024, // MB
        systemFree: systemMemory.free / 1024 / 1024, // MB
        systemUsedPercent: ((systemMemory.total - systemMemory.free) / systemMemory.total) * 100
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      timestamp: new Date().toISOString()
    };

    // Log resource usage
    log.info('Resource usage:', resourceInfo);

    // Send to renderer
    if (mainWindow) {
      mainWindow.webContents.send('resource-usage', resourceInfo);
    }

    // Check if memory usage is too high and take action if needed
    if (resourceInfo.memory.systemUsedPercent > 90) {
      log.warn('High memory usage detected:', resourceInfo.memory.systemUsedPercent.toFixed(2) + '%');
      
      // Notify user
      if (mainWindow) {
        mainWindow.webContents.send('high-resource-usage', {
          type: 'memory',
          value: resourceInfo.memory.systemUsedPercent
        });
      }
    }
  }, RESOURCE_MONITOR_INTERVAL);
}

// Stop resource monitoring
function stopResourceMonitoring() {
  if (resourceMonitorInterval) {
    clearInterval(resourceMonitorInterval);
    resourceMonitorInterval = null;
  }
}

// IPC handlers
ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('get-system-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: app.getVersion(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    cpus: os.cpus(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem()
  };
});

ipcMain.handle('open-file-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result.filePaths;
});

ipcMain.handle('save-file-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result.filePath;
});

ipcMain.handle('check-for-updates', async () => {
  if (app.isPackaged) {
    autoUpdater.checkForUpdates();
    return true;
  }
  return false;
});

// Auto updater events
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for updates...');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'checking' });
  }
});

autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'available',
      info
    });
  }
});

autoUpdater.on('update-not-available', (info) => {
  log.info('No updates available');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'not-available',
      info
    });
  }
});

autoUpdater.on('error', (err) => {
  log.error('Error during update:', err);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'error',
      error: err.toString()
    });
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  log.info('Download progress:', progressObj);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'downloading',
      progress: progressObj
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded:', info);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'downloaded',
      info
    });
  }
});

// Handle update download request
ipcMain.handle('download-update', () => {
  autoUpdater.downloadUpdate();
});

// Handle update installation request
ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall(false, true);
});
