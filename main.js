
const path = require('path')
const os = require('os')
const { app, BrowserWindow, Menu, globalShortcut ,ipcMain} = require("electron");
const imagemin = require('imagemin')
const imageminMozjpeg = require('imagemin-mozjpeg')
const imageminPngquant = require('imagemin-pngquant')
const slash = require('slash')
const log = require('electron-log');
const { shell } = require('electron');

let win;
process.env.NODE_ENV = "production";
const isDev = process.env.NODE_ENV !== "production" ? true : false;
const isMac = (process.platform = "darvin" ? true : false);
console.log(process.platform);
const createWindow = () => {
  win = new BrowserWindow({
    title: "image shrink",
    width: 500,
    height: 600,
    //icon: "./assets/icons/Icon_256x256.png",
    resizable: isDev,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation:false
    }
  });
  //win.loadFile('./app/index.html');
  win.loadURL(`file://${__dirname}/aap/index.html`);
};
function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    title: "About ImageShrink",
    width: 200,
    height: 800,
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    resizable: false,
    backgroundColor: "white"
  });

  aboutWindow.loadFile("./app/about.html");
}
const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  {
    role: "fileMenu",
  },
  ...(!isMac
    ? [
        {
          label: "Help",
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  ...(isDev
    ? [
        {
          label: "Developer",
          submenu: [
            { role: "reload" },
            { role: "forcereload" },
            { type: "separator" },
            { role: "toggledevtools" },
          ],
        },
      ]
    : []),
];
ipcMain.on('image:minimize', (e, options) => {
  options.dest = path.join(os.homedir(), 'imageshrink')
  console.log(options)
  shrinkImage(options)
})
async function shrinkImage({ imgPath, quality, dest }) {
  try {
    const pngQuality = quality / 100

    const files = await imagemin([slash(imgPath)], {
      destination: dest,
      plugins: [
        imageminMozjpeg({ quality }),
        imageminPngquant({
          quality: [pngQuality, pngQuality],
        }),
      ],
    })

    log.info(files)

    shell.openPath(dest)

    win.webContents.send('image:done')
  } catch (err) {
    log.error(err)
  }
}

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit()
  }
})
app.on("ready", () => {
  createWindow();
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);
  globalShortcut.register("CmdOrCtrl+R", () => {
    win.reload();
  });
  globalShortcut.register("CmdOrCtrl+I", () => win.toggleDevTools());
  win.on("close", () => (win = null));
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
