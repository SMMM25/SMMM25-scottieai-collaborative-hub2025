// Windows Installer Package Builder
// This script builds a standard Windows installer (EXE) for the ScottieAI Collaborative Hub

import * as fs from 'fs';
import * as path from 'path';
import { createWindowsInstaller, createMockWindowsInstaller, InstallerConfig } from './windows-installer-creator';

// Main function to build the Windows installer
async function buildWindowsInstaller() {
  console.log('Building Windows installer for ScottieAI Collaborative Hub...');
  
  // Define installer configuration
  const config: InstallerConfig = {
    appName: 'ScottieAI Collaborative Hub',
    appVersion: '1.0.0',
    publisher: 'ScottieAI',
    description: 'A collaborative platform for enhancing software projects with AI capabilities',
    outputDir: path.resolve(__dirname, 'dist'),
    sourceDir: path.resolve(__dirname, 'scottieai-collaborative-hub-main/dist'),
    iconPath: path.resolve(__dirname, 'scottieai-collaborative-hub-main/public/static/media/icon-512.svg'),
    installerType: 'exe',
    installerOptions: {
      perMachine: false,
      createDesktopShortcut: true,
      createStartMenuShortcut: true,
      runAfterFinish: true,
      allowToChangeInstallationDirectory: true
    }
  };
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
  
  try {
    // Try to create a real installer using electron-builder
    const installerPath = await createWindowsInstaller(config);
    console.log(`Windows installer created successfully: ${installerPath}`);
    return installerPath;
  } catch (error) {
    console.error('Error creating Windows installer:', error);
    console.log('Falling back to mock installer...');
    
    // Create a mock installer as fallback
    const mockInstallerPath = await createMockWindowsInstaller(config);
    console.log(`Mock Windows installer created successfully: ${mockInstallerPath}`);
    return mockInstallerPath;
  }
}

// Run the installer builder
buildWindowsInstaller().catch(error => {
  console.error('Failed to build Windows installer:', error);
  process.exit(1);
});
