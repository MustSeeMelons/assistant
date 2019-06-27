import { app, BrowserWindow, Tray, Menu, ipcMain } from "electron";
import * as path from "path";
import * as url from "url";
const trayIcon = require("../resources/images/clippy_tray.png");

let mainWindow: Electron.BrowserWindow;
let tray: Electron.Tray;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        height: 600,
        width: 400,
        frame: false,
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
        },
        resizable: true,
        icon: trayIcon,
        alwaysOnTop: true
    });

    // hiding the default menu
    mainWindow.setMenu(null);

    // and load the index.html of the app.
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, "./index.html"),
            protocol: "file:",
            slashes: true,
        })
    );

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on("closed", () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    mainWindow.on("minimize", function(event: any) {
        event.preventDefault();
        mainWindow.hide();
    });

    tray = new Tray(trayIcon);

    var contextMenu = Menu.buildFromTemplate([
        {
            label: "Summon Clippy",
            click: function() {
                mainWindow.show();
            },
        },
        {
            label: "Hurt Clippy",
            click: function() {
                mainWindow.destroy();
                app.quit();
            },
        },
    ]);

    tray.setToolTip("Clippy");
    tray.setContextMenu(contextMenu);

    ipcMain.addListener("", () => {

    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On OS X it"s common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
