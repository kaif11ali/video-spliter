const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),
  createFileStream: (filePath) => ipcRenderer.invoke('create-file-stream', filePath),
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
