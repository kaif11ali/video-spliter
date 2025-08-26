const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let serverInstance = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 900,
    minWidth: 600,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Video Splitter',
    show: false,
    backgroundColor: '#667eea'
  });

  // Start the backend server
  startBackendServer();

  // Load the frontend
  mainWindow.loadFile('renderer/index.html');

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    stopBackendServer();
  });
}

function startBackendServer() {
  try {
    // Set environment variables for the server
    process.env.PORT = 4000;
    process.env.NODE_ENV = 'production';
    
    // Start the Express server directly in this process
    const serverPath = path.join(__dirname, 'server', 'server.js');
    delete require.cache[require.resolve(serverPath)];
    
    const server = require(serverPath);
    serverInstance = server;
    console.log('Backend server started on port 4000');
  } catch (error) {
    console.error('Failed to start backend server:', error);
  }
}

function stopBackendServer() {
  if (serverInstance && typeof serverInstance.close === 'function') {
    serverInstance.close(() => {
      console.log('Backend server stopped');
    });
    serverInstance = null;
  }
}

// Handle file selection
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Videos', extensions: ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  return result;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  stopBackendServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  stopBackendServer();
});
