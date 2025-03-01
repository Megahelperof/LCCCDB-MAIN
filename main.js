const { app, BrowserWindow } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const { ipcMain } = require('electron');
const Store = require('electron-store');
const store = new Store();

// Add these to your existing IPC handlers
ipcMain.handle('get-stored-token', () => store.get('token'));
ipcMain.handle('store-token', (event, token) => store.set('token', token));

// Store the main window reference
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false, // Security: disable nodeIntegration
      contextIsolation: true, // Security: enable contextIsolation
      preload: path.join(__dirname, 'preload.js') // Add preload script
    },
  });

  // In development, load from localhost
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from local files
    mainWindow.loadFile(path.join(__dirname, 'build/index.html'));
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupAutoUpdater() {
  // Configure logging
  autoUpdater.logger = require('electron-log');
  autoUpdater.logger.transports.file.level = 'info';

  // Configure updater events
  autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    sendStatusToWindow('Update available.');
  });

  autoUpdater.on('update-not-available', (info) => {
    sendStatusToWindow('Update not available.');
  });

  autoUpdater.on('error', (err) => {
    sendStatusToWindow('Error in auto-updater. ' + err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let message = `Download speed: ${progressObj.bytesPerSecond}`;
    message += ` - Downloaded ${progressObj.percent}%`;
    message += ` (${progressObj.transferred}/${progressObj.total})`;
    sendStatusToWindow(message);
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendStatusToWindow('Update downloaded');
    // Wait 5 seconds, then quit and install
    setTimeout(() => {
      autoUpdater.quitAndInstall();
    }, 5000);
  });
}

// Send status updates to the renderer
function sendStatusToWindow(text) {
  if (mainWindow) {
    mainWindow.webContents.send('update-message', text);
  }
}

// App events
app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();

  // On macOS, recreate window when dock icon is clicked
  app.on('activate', () => {
    if (mainWindow === null) createWindow();
  });

  // Start checking for updates
  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.checkForUpdates();
    
    // Check for updates every hour
    setInterval(() => {
      autoUpdater.checkForUpdates();
    }, 60 * 60 * 1000);
  }
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle activation
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});