const { app, BrowserWindow } = require('electron')
const path = require('path')

// 判断是否为开发环境
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function getAppIconPath() {
  if (isDev) {
    return path.join(
      __dirname,
      '../android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png'
    )
  }

  return path.join(process.resourcesPath, 'ic_launcher.png')
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: getAppIconPath(),
    title: 'Mini Bot',
  })

  // 开发环境加载 vite 开发服务器，生产环境加载打包后的文件
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
