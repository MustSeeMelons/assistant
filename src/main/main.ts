import { LOGGER } from "./../logger";
import { IAppConfig, DEFAULT_CONFIG, IResizeEvent } from "./../definitions";
import { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } from "electron";
import * as path from "path";
import * as url from "url";
import { EVENTS } from "../definitions";
import * as fs from "fs";

// Importing files, so that webpack copies them
const trayImg = require("../resources/images/clippy_tray.png");

const nativeIcon = nativeImage.createFromPath(
    path.join(__dirname, "src/resources/images/clippy_tray.png")
);

let mainWindow: Electron.BrowserWindow;
let tray: Electron.Tray;
let wakeTimeout: NodeJS.Timeout;
let config: IAppConfig;

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

const loadConfiguration = () => {
    try {
        const buffer = fs.readFileSync(
            path.join(__dirname, "src/resources/config.json")
        );

        config = JSON.parse(buffer.toString("UTF-8")) as IAppConfig;
    } catch (e) {
        LOGGER.error(`$CONFIG READ FAIL ${e}`);
        config = DEFAULT_CONFIG;
    }
};

/*
    Hides the window setting a timeout for its reappearance.
 */
const snoozeProcessor = () => {
    wakeTimeout = setTimeout(() => {
        mainWindow.show();
        mainWindow.webContents.send(EVENTS.WAKE);
    }, config.sleepTime);

    mainWindow.hide();
};

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        height: 400,
        width: 500,
        frame: false,
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
            devTools: false
        },
        resizable: true,
        alwaysOnTop: true,
        icon: nativeIcon,
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
        if (wakeTimeout) {
            wakeTimeout.unref();
        }
        mainWindow = null;
    });

    mainWindow.on("minimize", function (event: any) {
        event.preventDefault();
        mainWindow.hide();
        snoozeProcessor();
    });

    tray = new Tray(nativeIcon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: "Summon Clippy",
            click: function () {
                mainWindow.show();
            },
        },
        {
            label: "Hurt Clippy",
            click: function () {
                mainWindow.destroy();
                app.quit();
            },
        },
    ]);

    tray.setToolTip("Clippy");
    tray.setContextMenu(contextMenu);

    ipcMain.addListener(EVENTS.SLEEP, () => {
        snoozeProcessor();
    });

    ipcMain.on(EVENTS.RESIZE, (e: any, event: IResizeEvent) => {
        mainWindow.setContentSize(event.x, event.y);
    });

    loadConfiguration();

    // Sending the configuration over to the renderer
    mainWindow.webContents.on("did-finish-load", () => {
        mainWindow.webContents.send(EVENTS.CONFIG, config);
    });
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
