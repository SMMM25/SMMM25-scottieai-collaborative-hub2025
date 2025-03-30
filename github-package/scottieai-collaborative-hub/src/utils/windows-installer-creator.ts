// Windows Installer Package Creator
// This script creates a standard Windows installer (EXE) for the ScottieAI Collaborative Hub

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Define types for installer configuration
export interface InstallerConfig {
  appName: string;
  appVersion: string;
  publisher: string;
  description: string;
  outputDir: string;
  sourceDir: string;
  iconPath?: string;
  licenseFile?: string;
  installerType: 'exe' | 'msi';
  installerOptions: {
    perMachine: boolean;
    createDesktopShortcut: boolean;
    createStartMenuShortcut: boolean;
    runAfterFinish: boolean;
    allowToChangeInstallationDirectory: boolean;
  };
}

/**
 * Creates a Windows installer package (EXE or MSI) for the ScottieAI Collaborative Hub
 * @param config Installer configuration
 * @returns Path to the created installer file
 */
export async function createWindowsInstaller(config: InstallerConfig): Promise<string> {
  console.log(`Creating ${config.installerType.toUpperCase()} installer for ${config.appName} v${config.appVersion}`);
  
  // Create temporary directory for installer files
  const tempDir = path.join(config.outputDir, 'installer-temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Create package.json for electron-builder
  const packageJson = createPackageJson(config);
  fs.writeFileSync(path.join(tempDir, 'package.json'), packageJson);
  
  // Create electron-builder.yml configuration
  const builderConfig = createBuilderConfig(config);
  fs.writeFileSync(path.join(tempDir, 'electron-builder.yml'), builderConfig);
  
  // Copy source files to temp directory
  copySourceFiles(config.sourceDir, path.join(tempDir, 'app'));
  
  // Create main.js for Electron
  const mainJs = createMainJs(config);
  fs.writeFileSync(path.join(tempDir, 'main.js'), mainJs);
  
  // Create installer.nsh for NSIS customization
  if (config.installerType === 'exe') {
    const installerNsh = createInstallerNsh(config);
    fs.writeFileSync(path.join(tempDir, 'installer.nsh'), installerNsh);
  }
  
  // Copy icon if provided
  if (config.iconPath && fs.existsSync(config.iconPath)) {
    fs.copyFileSync(config.iconPath, path.join(tempDir, 'icon.ico'));
  }
  
  // Copy license file if provided
  if (config.licenseFile && fs.existsSync(config.licenseFile)) {
    fs.copyFileSync(config.licenseFile, path.join(tempDir, 'LICENSE'));
  }
  
  // Install dependencies
  console.log('Installing dependencies...');
  execSync('npm install --production', { cwd: tempDir });
  
  // Install electron-builder
  console.log('Installing electron-builder...');
  execSync('npm install electron-builder --save-dev', { cwd: tempDir });
  
  // Build installer
  console.log(`Building ${config.installerType.toUpperCase()} installer...`);
  execSync(`npx electron-builder --${config.installerType} --config electron-builder.yml`, { cwd: tempDir });
  
  // Get installer file path
  const distDir = path.join(tempDir, 'dist');
  const installerFiles = fs.readdirSync(distDir).filter(file => 
    file.endsWith(`.${config.installerType}`) && file.includes(config.appName)
  );
  
  if (installerFiles.length === 0) {
    throw new Error('Installer creation failed: No installer file found');
  }
  
  const installerPath = path.join(distDir, installerFiles[0]);
  const finalInstallerPath = path.join(config.outputDir, installerFiles[0]);
  
  // Copy installer to output directory
  fs.copyFileSync(installerPath, finalInstallerPath);
  
  // Clean up temporary directory
  fs.rmSync(tempDir, { recursive: true, force: true });
  
  console.log(`Installer created successfully: ${finalInstallerPath}`);
  return finalInstallerPath;
}

/**
 * Creates package.json for electron-builder
 */
function createPackageJson(config: InstallerConfig): string {
  const packageJson = {
    name: config.appName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    version: config.appVersion,
    description: config.description,
    main: 'main.js',
    author: config.publisher,
    license: 'MIT',
    scripts: {
      start: 'electron .',
      pack: 'electron-builder --dir',
      dist: `electron-builder --${config.installerType}`
    },
    devDependencies: {
      electron: '^26.2.1',
      'electron-builder': '^24.6.3'
    },
    dependencies: {}
  };
  
  return JSON.stringify(packageJson, null, 2);
}

/**
 * Creates electron-builder.yml configuration
 */
function createBuilderConfig(config: InstallerConfig): string {
  const appId = `com.scottieai.${config.appName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  
  return `appId: ${appId}
productName: ${config.appName}
copyright: Copyright © ${new Date().getFullYear()} ${config.publisher}

directories:
  output: dist
  buildResources: .

files:
  - main.js
  - app/**/*

${config.iconPath ? 'icon: icon.ico' : ''}

win:
  target:
    - ${config.installerType}
  artifactName: \${productName}-setup-\${version}.\${ext}

${config.installerType === 'exe' ? `
nsis:
  oneClick: false
  perMachine: ${config.installerOptions.perMachine}
  allowToChangeInstallationDirectory: ${config.installerOptions.allowToChangeInstallationDirectory}
  createDesktopShortcut: ${config.installerOptions.createDesktopShortcut}
  createStartMenuShortcut: ${config.installerOptions.createStartMenuShortcut}
  runAfterFinish: ${config.installerOptions.runAfterFinish}
  include: installer.nsh
` : ''}

${config.installerType === 'msi' ? `
msi:
  perMachine: ${config.installerOptions.perMachine}
  createDesktopShortcut: ${config.installerOptions.createDesktopShortcut}
  createStartMenuShortcut: ${config.installerOptions.createStartMenuShortcut}
` : ''}`;
}

/**
 * Creates main.js for Electron
 */
function createMainJs(config: InstallerConfig): string {
  return `const { app, BrowserWindow } = require('electron');
const path = require('path');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    },
    title: '${config.appName}'
  });

  // Load the index.html of the app
  mainWindow.loadFile(path.join(__dirname, 'app/index.html'));

  // Emitted when the window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
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
});`;
}

/**
 * Creates installer.nsh for NSIS customization
 */
function createInstallerNsh(config: InstallerConfig): string {
  return `!macro customHeader
  # Custom header macro
  !macroend

!macro customInstall
  # Custom install macro
  DetailPrint "Installing ${config.appName}..."
  # Add any custom installation steps here
!macroend

!macro customUnInstall
  # Custom uninstall macro
  DetailPrint "Uninstalling ${config.appName}..."
  # Add any custom uninstallation steps here
!macroend`;
}

/**
 * Copies source files to destination directory
 */
function copySourceFiles(sourceDir: string, destDir: string): void {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const files = fs.readdirSync(sourceDir);
  
  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(destDir, file);
    
    const stats = fs.statSync(sourcePath);
    
    if (stats.isDirectory()) {
      copySourceFiles(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

/**
 * Creates a mock Windows installer for demonstration purposes
 * This is used when electron-builder is not available or for testing
 */
export async function createMockWindowsInstaller(config: InstallerConfig): Promise<string> {
  console.log(`Creating mock ${config.installerType.toUpperCase()} installer for ${config.appName} v${config.appVersion}`);
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
  
  // Create a simple HTML file that simulates an installer
  const installerHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${config.appName} Installer</title>
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
    <h1>${config.appName} Installer</h1>
    <p>Version: ${config.appVersion}</p>
    <p>Publisher: ${config.publisher}</p>
    <p>Installer Type: ${config.installerType.toUpperCase()}</p>
    
    <div class="step">
      <h3>Step 1: Welcome</h3>
      <p>Welcome to the ${config.appName} installer. This will install ${config.appName} version ${config.appVersion} on your computer.</p>
    </div>
    
    <div class="step">
      <h3>Step 2: License Agreement</h3>
      <p>Please read and accept the license agreement.</p>
    </div>
    
    <div class="step">
      <h3>Step 3: Installation Location</h3>
      <p>Choose where you want to install ${config.appName}.</p>
    </div>
    
    <div class="step">
      <h3>Step 4: Installation</h3>
      <p>Installing ${config.appName}...</p>
    </div>
    
    <div class="step">
      <h3>Step 5: Completion</h3>
      <p>${config.appName} has been successfully installed!</p>
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

  // Create a ZIP file with the installer HTML and app files
  const zip = new JSZip();
  
  // Add installer HTML
  zip.file('installer.html', installerHtml);
  
  // Add a folder for the app
  const appFolder = zip.folder('app');
  
  // Add app files
  addFilesToZip(config.sourceDir, appFolder);
  
  // Generate the ZIP file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  
  // Save the ZIP file
  const installerFileName = `${config.appName}-setup-${config.appVersion}.${config.installerType}`;
  const installerPath = path.join(config.outputDir, installerFileName);
  
  // In a browser environment, use saveAs
  if (typeof window !== 'undefined') {
    saveAs(zipBlob, installerFileName);
  } else {
    // In Node.js environment, write to file
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(installerPath, buffer);
  }
  
  console.log(`Mock installer created successfully: ${installerPath}`);
  return installerPath;
}

/**
 * Adds files to a JSZip folder recursively
 */
function addFilesToZip(sourceDir: string, zipFolder: JSZip): void {
  if (!fs.existsSync(sourceDir)) {
    return;
  }
  
  const files = fs.readdirSync(sourceDir);
  
  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    
    const stats = fs.statSync(sourcePath);
    
    if (stats.isDirectory()) {
      const subFolder = zipFolder.folder(file);
      addFilesToZip(sourcePath, subFolder);
    } else {
      const content = fs.readFileSync(sourcePath);
      zipFolder.file(file, content);
    }
  }
}

/**
 * Creates a standalone executable installer using Inno Setup
 * This is an alternative approach for Windows installers
 */
export function createInnoSetupInstaller(config: InstallerConfig): string {
  console.log(`Creating Inno Setup installer for ${config.appName} v${config.appVersion}`);
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
  
  // Create temporary directory for installer files
  const tempDir = path.join(config.outputDir, 'inno-temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Copy source files to temp directory
  copySourceFiles(config.sourceDir, path.join(tempDir, 'app'));
  
  // Create Inno Setup script
  const scriptPath = path.join(tempDir, 'installer.iss');
  const script = createInnoSetupScript(config, tempDir);
  fs.writeFileSync(scriptPath, script);
  
  // Run Inno Setup compiler
  console.log('Running Inno Setup compiler...');
  execSync(`iscc "${scriptPath}"`, { cwd: tempDir });
  
  // Get installer file path
  const outputPath = path.join(tempDir, 'Output');
  const installerFiles = fs.readdirSync(outputPath).filter(file => 
    file.endsWith('.exe') && file.includes(config.appName)
  );
  
  if (installerFiles.length === 0) {
    throw new Error('Installer creation failed: No installer file found');
  }
  
  const installerPath = path.join(outputPath, installerFiles[0]);
  const finalInstallerPath = path.join(config.outputDir, installerFiles[0]);
  
  // Copy installer to output directory
  fs.copyFileSync(installerPath, finalInstallerPath);
  
  // Clean up temporary directory
  fs.rmSync(tempDir, { recursive: true, force: true });
  
  console.log(`Installer created successfully: ${finalInstallerPath}`);
  return finalInstallerPath;
}

/**
 * Creates an Inno Setup script
 */
function createInnoSetupScript(config: InstallerConfig, tempDir: string): string {
  const appId = `com.scottieai.${config.appName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const appFolder = path.join(tempDir, 'app');
  
  return `; Inno Setup Script for ${config.appName}
; Generated by ScottieAI Collaborative Hub

#define MyAppName "${config.appName}"
#define MyAppVersion "${config.appVersion}"
#define MyAppPublisher "${config.publisher}"
#define MyAppURL "https://scottieai.com"
#define MyAppExeName "launcher.exe"
#define MyAppId "${appId}"

[Setup]
AppId={{{#MyAppId}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\\{#MyAppName}
DefaultGroupName={#MyAppName}
${config.licenseFile ? `LicenseFile=${config.licenseFile}` : '; No license file specified'}
${config.iconPath ? `SetupIconFile=${config.iconPath}` : '; No icon file specified'}
Compression=lzma
SolidCompression=yes
WizardStyle=modern
${config.installerOptions.allowToChangeInstallationDirectory ? '' : 'DisableDirPage=yes'}
${config.installerOptions.createStartMenuShortcut ? '' : 'DisableProgramGroupPage=yes'}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; ${config.installerOptions.createDesktopShortcut ? 'Flags: checked' : ''}
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1; Check: not IsAdminInstallMode

[Files]
Source: "${appFolder}\\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"
Name: "{group}\\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"; Tasks: desktopicon
Name: "{userappdata}\\Microsoft\\Internet Explorer\\Quick Launch\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"; Tasks: quicklaunchicon

[Run]
${config.installerOptions.runAfterFinish ? `Filename: "{app}\\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent` : '; No post-install run'}`;
}
