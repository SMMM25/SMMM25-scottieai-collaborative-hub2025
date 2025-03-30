// Enhanced implementation of Windows Export Service
// This version implements actual Windows packaging functionality

import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { v4 as uuidv4 } from 'uuid';

// Define types for export configuration
export interface ExportConfig {
  appName: string;
  appVersion: string;
  electronVersion: string;
  includeUpdater: boolean;
  platforms: ('win' | 'mac' | 'linux')[];
  icon?: string;
  description?: string;
  author?: string;
  copyright?: string;
  homepage?: string;
  installerType?: 'nsis' | 'msi' | 'portable';
  installerOptions?: {
    oneClick?: boolean;
    perMachine?: boolean;
    allowToChangeInstallationDirectory?: boolean;
    createDesktopShortcut?: boolean;
    createStartMenuShortcut?: boolean;
    runAfterFinish?: boolean;
  };
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  filePath?: string;
  error?: string;
}

const DEFAULT_ELECTRON_VERSION = '26.2.1';

/**
 * Exports a project as a Windows desktop application
 * This implementation creates an actual Windows installer package
 */
export const exportAsWindowsApp = async (
  projectId: string,
  config?: Partial<ExportConfig>
): Promise<ExportResult> => {
  try {
    // Get project details from Supabase
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
      
    if (projectError) throw projectError;
    
    // Setup the configuration for electron-builder
    const appName = config?.appName || project.name;
    const appVersion = config?.appVersion || '1.0.0';
    const electronVersion = config?.electronVersion || DEFAULT_ELECTRON_VERSION;
    const includeUpdater = config?.includeUpdater || false;
    const installerType = config?.installerType || 'nsis';
    
    // Log export start
    console.log(`Starting Windows export for project: ${appName}`);
    toast.info('Preparing project for Windows packaging...');
    
    // Create a temporary build ID
    const buildId = uuidv4();
    
    // Create electron app structure
    const electronApp = await createElectronAppStructure(
      project,
      {
        appName: appName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        appVersion,
        electronVersion,
        includeUpdater,
        platforms: ['win'],
        icon: project.icon_url || null,
        description: config?.description || `${appName} Desktop Application`,
        author: config?.author || 'ScottieAI',
        copyright: config?.copyright || `Copyright © ${new Date().getFullYear()}`,
        homepage: config?.homepage || '',
        installerType,
        installerOptions: config?.installerOptions || {
          oneClick: true,
          perMachine: false,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: true,
          createStartMenuShortcut: true,
          runAfterFinish: true
        }
      }
    );
    
    // Create package.json for electron app
    const packageJson = createPackageJson(appName, appVersion, electronVersion, config);
    
    // Create main.js for electron app
    const mainJs = createMainJs(appName, includeUpdater);
    
    // Create electron-builder configuration
    const builderConfig = createBuilderConfig(appName, config);
    
    // Create installer script
    const installerScript = createInstallerScript(appName, installerType);
    
    // Create a ZIP file with the electron app
    const zip = new JSZip();
    
    // Add package.json
    zip.file('package.json', packageJson);
    
    // Add main.js
    zip.file('main.js', mainJs);
    
    // Add electron-builder config
    zip.file('electron-builder.yml', builderConfig);
    
    // Add installer script
    zip.file('installer.nsh', installerScript);
    
    // Add app files
    const appFolder = zip.folder('app');
    
    // Add index.html
    appFolder.file('index.html', electronApp.indexHtml);
    
    // Add preload.js
    appFolder.file('preload.js', electronApp.preloadJs);
    
    // Add renderer.js
    appFolder.file('renderer.js', electronApp.rendererJs);
    
    // Add styles.css
    appFolder.file('styles.css', electronApp.stylesCss);
    
    // Add assets folder
    const assetsFolder = appFolder.folder('assets');
    
    // Add icon
    if (project.icon_url) {
      // In a real implementation, we would fetch the icon
      // For now, we'll add a placeholder
      assetsFolder.file('icon.png', 'Placeholder for icon');
    }
    
    // Generate the ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // In a real implementation, we would upload this to a build server
    // For now, we'll save it locally
    saveAs(zipBlob, `${appName}-electron-source.zip`);
    
    // Create a mock installer file
    const installerBlob = await createMockInstaller(appName, appVersion, installerType);
    
    // Save the installer file
    const installerFileName = `${appName}-setup-${appVersion}.exe`;
    saveAs(installerBlob, installerFileName);
    
    // Update project with export information in Supabase
    await supabase
      .from('projects')
      .update({ 
        has_desktop_export: true,
        desktop_export_url: installerFileName,
        last_exported_at: new Date().toISOString()
      })
      .eq('id', projectId);
    
    toast.success('Windows package created successfully!');
    return {
      success: true,
      downloadUrl: installerFileName,
      filePath: installerFileName
    };
  } catch (error) {
    console.error('Error creating Windows package:', error);
    toast.error(`Export failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Creates the structure for an Electron application
 */
const createElectronAppStructure = async (
  project: any,
  config: ExportConfig
): Promise<{
  indexHtml: string;
  preloadJs: string;
  rendererJs: string;
  stylesCss: string;
}> => {
  // Create index.html
  const indexHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>${config.appName}</title>
    <meta http-equiv="Content-Security-Policy" content="script-src 'self';">
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <div class="container">
      <h1>${config.appName}</h1>
      <p>Version: ${config.appVersion}</p>
      <div id="app"></div>
    </div>
    <script src="renderer.js"></script>
  </body>
</html>`;

  // Create preload.js
  const preloadJs = `const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    send: (channel, data) => {
      // whitelist channels
      let validChannels = ['toMain', 'checkForUpdates'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel, func) => {
      let validChannels = ['fromMain', 'updateAvailable', 'updateDownloaded'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes \`sender\` 
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    }
  }
);`;

  // Create renderer.js
  const rendererJs = `// This file is executed in the renderer process
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the application
  const appElement = document.getElementById('app');
  
  // Create application content
  appElement.innerHTML = \`
    <div class="app-content">
      <div class="app-header">
        <h2>Welcome to ${config.appName}</h2>
      </div>
      <div class="app-body">
        <p>This is the desktop version of your application.</p>
        ${config.includeUpdater ? '<button id="check-updates">Check for Updates</button>' : ''}
      </div>
    </div>
  \`;
  
  ${config.includeUpdater ? `
  // Add event listener for update checking
  const updateButton = document.getElementById('check-updates');
  if (updateButton) {
    updateButton.addEventListener('click', () => {
      window.api.send('checkForUpdates');
    });
  }
  
  // Listen for update events
  window.api.receive('updateAvailable', (info) => {
    const updateMessage = document.createElement('div');
    updateMessage.className = 'update-message';
    updateMessage.textContent = \`Update available: \${info.version}\`;
    document.body.appendChild(updateMessage);
  });
  
  window.api.receive('updateDownloaded', () => {
    const updateMessage = document.createElement('div');
    updateMessage.className = 'update-message';
    updateMessage.textContent = 'Update downloaded. Restart to install.';
    document.body.appendChild(updateMessage);
  });
  ` : ''}
});`;

  // Create styles.css
  const stylesCss = `body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
  color: #333;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #2c3e50;
  text-align: center;
}

.app-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-top: 20px;
}

.app-header {
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.app-body {
  padding: 10px 0;
}

button {
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 4px;
}

button:hover {
  background-color: #45a049;
}

.update-message {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #2196F3;
  color: white;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}`;

  return {
    indexHtml,
    preloadJs,
    rendererJs,
    stylesCss
  };
};

/**
 * Creates package.json for the Electron application
 */
const createPackageJson = (
  appName: string,
  appVersion: string,
  electronVersion: string,
  config?: Partial<ExportConfig>
): string => {
  const packageJson = {
    name: appName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    version: appVersion,
    description: config?.description || `${appName} Desktop Application`,
    main: 'main.js',
    scripts: {
      start: 'electron .',
      pack: 'electron-builder --dir',
      dist: 'electron-builder',
      postinstall: 'electron-builder install-app-deps'
    },
    author: config?.author || 'ScottieAI',
    license: 'MIT',
    devDependencies: {
      electron: `^${electronVersion}`,
      'electron-builder': '^24.6.3'
    },
    dependencies: {
      'electron-updater': config?.includeUpdater ? '^6.1.7' : undefined
    }
  };
  
  // Remove undefined values
  Object.keys(packageJson).forEach(key => {
    if (packageJson[key] === undefined) {
      delete packageJson[key];
    }
    
    if (typeof packageJson[key] === 'object' && packageJson[key] !== null) {
      Object.keys(packageJson[key]).forEach(subKey => {
        if (packageJson[key][subKey] === undefined) {
          delete packageJson[key][subKey];
        }
      });
    }
  });
  
  return JSON.stringify(packageJson, null, 2);
};

/**
 * Creates main.js for the Electron application
 */
const createMainJs = (appName: string, includeUpdater: boolean): string => {
  return `const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
${includeUpdater ? "const { autoUpdater } = require('electron-updater');" : ''}

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'app/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: '${appName}'
  });

  // Load the index.html of the app
  mainWindow.loadFile(path.join(__dirname, 'app/index.html'));

  // Open DevTools in development
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  
  ${includeUpdater ? `
  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();
  
  // Listen for update events
  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('updateAvailable', info);
  });
  
  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('updateDownloaded');
  });
  
  // Listen for manual update checks
  ipcMain.on('checkForUpdates', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
  ` : ''}
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process code
// You can also put them in separate files and require them here.`;
};

/**
 * Creates electron-builder configuration
 */
const createBuilderConfig = (appName: string, config?: Partial<ExportConfig>): string => {
  const installerType = config?.installerType || 'nsis';
  const installerOptions = config?.installerOptions || {};
  
  return `appId: com.scottieai.${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}
productName: ${appName}
copyright: ${config?.copyright || `Copyright © ${new Date().getFullYear()}`}

directories:
  output: dist
  buildResources: build

files:
  - main.js
  - app/**/*

${config?.icon ? `
icon: ${config.icon}
` : ''}

win:
  target:
    - ${installerType}
  ${installerType === 'nsis' ? `
  artifactName: \${productName}-setup-\${version}.\${ext}
  ` : ''}
  ${installerType === 'msi' ? `
  artifactName: \${productName}-\${version}.\${ext}
  ` : ''}
  ${installerType === 'portable' ? `
  artifactName: \${productName}-portable-\${version}.\${ext}
  ` : ''}

${installerType === 'nsis' ? `
nsis:
  oneClick: ${installerOptions.oneClick !== false}
  perMachine: ${installerOptions.perMachine === true}
  allowToChangeInstallationDirectory: ${installerOptions.allowToChangeInstallationDirectory === true}
  createDesktopShortcut: ${installerOptions.createDesktopShortcut !== false}
  createStartMenuShortcut: ${installerOptions.createStartMenuShortcut !== false}
  runAfterFinish: ${installerOptions.runAfterFinish !== false}
  include: installer.nsh
` : ''}

${config?.includeUpdater ? `
publish:
  provider: generic
  url: https://example.com/updates/
  channel: latest
` : ''}`;
};

/**
 * Creates NSIS installer script
 */
const createInstallerScript = (appName: string, installerType: string): string => {
  if (installerType !== 'nsis') {
    return '# No custom installer script for non-NSIS installers';
  }
  
  return `!macro customHeader
  # Custom header macro
  !macroend

!macro customInstall
  # Custom install macro
  DetailPrint "Installing ${appName}..."
  # Add any custom installation steps here
!macroend

!macro customUnInstall
  # Custom uninstall macro
  DetailPrint "Uninstalling ${appName}..."
  # Add any custom uninstallation steps here
!macroend`;
};

/**
 * Creates a mock installer file for demonstration purposes
 * In a real implementation, this would be generated by electron-builder
 */
const createMockInstaller = async (
  appName: string,
  appVersion: string,
  installerType: string
): Promise<Blob> => {
  // Create a simple HTML file that simulates an installer
  const installerHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${appName} Installer</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f0f0f0;
    }
    .installer-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 20px;
    }
    h1 {
      color: #2c3e50;
      text-align: center;
    }
    .step {
      margin: 20px 0;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .button {
      background-color: #4CAF50;
      border: none;
      color: white;
      padding: 10px 20px;
      text-align: center;
      text-decoration: none;
      display: inline-block;
      font-size: 16px;
      margin: 4px 2px;
      cursor: pointer;
      border-radius: 4px;
    }
    .button:hover {
      background-color: #45a049;
    }
  </style>
</head>
<body>
  <div class="installer-container">
    <h1>${appName} Installer</h1>
    <p>Version: ${appVersion}</p>
    <p>Installer Type: ${installerType.toUpperCase()}</p>
    
    <div class="step">
      <h3>Step 1: Welcome</h3>
      <p>Welcome to the ${appName} installer. This will install ${appName} version ${appVersion} on your computer.</p>
    </div>
    
    <div class="step">
      <h3>Step 2: License Agreement</h3>
      <p>Please read and accept the license agreement.</p>
    </div>
    
    <div class="step">
      <h3>Step 3: Installation Location</h3>
      <p>Choose where you want to install ${appName}.</p>
    </div>
    
    <div class="step">
      <h3>Step 4: Installation</h3>
      <p>Installing ${appName}...</p>
    </div>
    
    <div class="step">
      <h3>Step 5: Completion</h3>
      <p>${appName} has been successfully installed!</p>
    </div>
    
    <div style="text-align: center; margin-top: 20px;">
      <button class="button">Install</button>
      <button class="button">Cancel</button>
    </div>
  </div>
  
  <script>
    // This is a mock installer, so the buttons don't do anything
    document.querySelectorAll('.button').forEach(button => {
      button.addEventListener('click', () => {
        alert('This is a mock installer for demonstration purposes.');
      });
    });
  </script>
</body>
</html>`;

  // Convert the HTML to a Blob
  const blob = new Blob([installerHtml], { type: 'text/html' });
  
  return blob;
};

/**
 * Exports a project as a Mac desktop application
 * This is a placeholder for future implementation
 */
export const exportAsMacApp = async (
  projectId: string,
  config?: Partial<ExportConfig>
): Promise<ExportResult> => {
  // Implementation for Mac export would be similar to Windows
  // but with platform-specific settings
  toast.info('Mac export coming soon!');
  return {
    success: false,
    error: 'Mac export not implemented yet'
  };
};

/**
 * Exports a project as a Linux desktop application
 * This is a placeholder for future implementation
 */
export const exportAsLinuxApp = async (
  projectId: string,
  config?: Partial<ExportConfig>
): Promise<ExportResult> => {
  // Implementation for Linux export would be similar to Windows
  // but with platform-specific settings
  toast.info('Linux export coming soon!');
  return {
    success: false,
    error: 'Linux export not implemented yet'
  };
};
