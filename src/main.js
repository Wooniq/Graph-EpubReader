const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  let options = {
    /*
    width: 1200,
    height: 1900,
    x: 0,
    y: 0,
    */
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
    },
  }
  options.fullscreen = true
  options.autoHideMenuBar = true
  const win = new BrowserWindow(options)

  win.loadURL('https://uncommon-closely-sparrow.ngrok-free.app');
  //win.loadURL('http://localhost:3000')

  // 개발자 도구 열기 (옵션)
  win.webContents.openDevTools();
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});