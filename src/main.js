const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'public/preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadURL('http://localhost:80'); // React dev server가 기본적으로 사용하는 포트입니다.

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