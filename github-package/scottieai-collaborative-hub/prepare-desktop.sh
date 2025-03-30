#!/bin/bash

# ScottieAI Collaborative Hub Desktop Installer
# This script prepares the desktop application for distribution

echo "📦 Preparing ScottieAI Collaborative Hub Desktop Application..."

# Create build directory
mkdir -p build/icons

# Copy electron files to main project
cp electron/main.js ../
cp electron/preload.js ../
cp electron/splash.html ../
cp electron-package.json ../package.json

# Install electron dependencies
cd ..
npm install --save electron-log electron-updater
npm install --save-dev concurrently electron electron-builder

echo "🔨 Building application..."
npm run build

echo "🚀 Creating desktop application..."
npm run electron:build

echo "✅ Desktop application created successfully!"
echo "The application can be found in the 'release' directory."
