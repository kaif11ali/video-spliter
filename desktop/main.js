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
    process.env.NODE_ENV = 'production';
    
    // Start the Express server directly in this process
    const serverPath = path.join(__dirname, 'server', 'server.js');
    delete require.cache[require.resolve(serverPath)];
    
    const { startServer } = require(serverPath);
    
    // Start server with dynamic port
    startServer().then(server => {
      serverInstance = server;
      console.log('Backend server started successfully');
    }).catch(error => {
      console.error('Failed to start backend server:', error);
    });
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

// Handle file reading - just get file info, not the actual content
ipcMain.handle('get-file-info', async (event, filePath) => {
  const fs = require('fs');
  try {
    const stats = fs.statSync(filePath);
    return {
      success: true,
      size: stats.size,
      name: require('path').basename(filePath),
      path: filePath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Handle file stream creation for upload
ipcMain.handle('create-file-stream', async (event, filePath) => {
  const fs = require('fs');
  try {
    // Check if file exists and is readable
    await fs.promises.access(filePath, fs.constants.R_OK);
    return {
      success: true,
      path: filePath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Handle file downloads
ipcMain.handle('download-file', async (event, url, fileName) => {
  const { shell, app } = require('electron');
  const fs = require('fs');
  const path = require('path');
  
  console.log('Download request:', { url, fileName });
  
  try {
    // Get the user's Downloads directory
    const downloadsPath = app.getPath('downloads');
    console.log('Downloads directory:', downloadsPath);
    
    // For local files served by our server, convert URL to local path and copy to Downloads
    if (url.startsWith('http://localhost:')) {
      // Extract the path part after /parts/
      const urlParts = url.split('/parts/');
      if (urlParts.length > 1) {
        const relativePath = urlParts[1];
        console.log('Relative path from URL:', relativePath);
        
        // Try both server/uploads and uploads directories
        const possiblePaths = [
          path.join(__dirname, 'server', 'uploads', relativePath),
          path.join(__dirname, 'uploads', relativePath),
          path.join(process.cwd(), 'server', 'uploads', relativePath),
          path.join(process.cwd(), 'uploads', relativePath)
        ];
        
        console.log('Looking for file in possible paths:', possiblePaths);
        
        for (const localPath of possiblePaths) {
          console.log('Checking:', localPath, 'exists:', fs.existsSync(localPath));
          if (fs.existsSync(localPath)) {
            // Generate a unique filename for the download
            const originalName = fileName || path.basename(localPath);
            let downloadPath = path.join(downloadsPath, originalName);
            let counter = 1;
            
            // Handle duplicate filenames by adding a number
            while (fs.existsSync(downloadPath)) {
              const ext = path.extname(originalName);
              const nameWithoutExt = path.basename(originalName, ext);
              downloadPath = path.join(downloadsPath, `${nameWithoutExt} (${counter})${ext}`);
              counter++;
            }
            
            // Copy the file to Downloads directory
            await fs.promises.copyFile(localPath, downloadPath);
            
            // Open the Downloads folder to show the downloaded file
            shell.showItemInFolder(downloadPath);
            
            console.log('Successfully downloaded file to:', downloadPath);
            return { success: true, path: downloadPath };
          }
        }
        
        console.log('File not found in any expected path. Available files:');
        // Debug: List what files are actually in the uploads directory
        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (fs.existsSync(uploadsDir)) {
          const files = fs.readdirSync(uploadsDir, { withFileTypes: true });
          files.forEach(file => {
            console.log('  ', file.name, file.isDirectory() ? '(directory)' : '(file)');
            if (file.isDirectory()) {
              const subDir = path.join(uploadsDir, file.name);
              const subFiles = fs.readdirSync(subDir);
              subFiles.forEach(subFile => {
                console.log('    ', subFile);
              });
            }
          });
        }
        
        return { success: false, error: 'File not found in uploads directory: ' + relativePath };
      }
    }
    
    return { success: false, error: 'Invalid URL format: ' + url };
  } catch (error) {
    console.error('Download error:', error);
    return { success: false, error: error.message };
  }
});

// Handle opening external URLs
ipcMain.handle('open-external', async (event, url) => {
  const { shell } = require('electron');
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('Failed to open external URL:', error);
    return { success: false, error: error.message };
  }
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
