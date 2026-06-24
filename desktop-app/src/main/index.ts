import { electronApp, is, optimizer } from "@electron-toolkit/utils"
import { Channels, Log, LogType } from "@shared/index"
import { app, BrowserWindow, ipcMain, shell } from "electron"
import { autoUpdater } from "electron-updater"
import { join } from "path"
import icon from "../../resources/icon.png?asset"
import { getConfig, loadConfig, saveConfig, ScreenPosition } from "./config"
import { initIPC } from "./ipc"
import { initLCU } from "./lcu"
import { clampWindowBounds } from "./util"
import { initWebsocket } from "./ws"

let logWindow: BrowserWindow

function createWindow(screen: ScreenPosition) {
    const bounds = clampWindowBounds(screen)

    const mainWindow = new BrowserWindow({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        fullscreen: bounds.fullScreen,
        show: false,
        // autoHideMenuBar: true,
        ...(process.platform === "linux" ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, "../preload/index.js"),
            sandbox: false
        }
    })

    mainWindow.on("ready-to-show", () => {
        mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: "deny" }
    })

    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
        mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"])
    } else {
        mainWindow.loadFile(join(__dirname, "../renderer/index.html"))
    }

    return mainWindow
}

const logQueue: Log[] = []
let loaded = false

export function logToWindow(level: string, text: string) {
    // if (!loaded) {
        logQueue.push({
            type: level,
            text,
            time: Date.now()
        })
        // return
    // }

    sendToLogWindow({
        type: level,
        text,
        time: Date.now()
    })
}

function sendToLogWindow(log: Log) {
    if (!logWindow) return
    if (logWindow.isDestroyed()) return
    logWindow.webContents.send(Channels.LOADING_LOG, log)
}

app.whenReady().then(async () => {
    autoUpdater.checkForUpdatesAndNotify()

    electronApp.setAppUserModelId("se.melander")

    app.on("browser-window-created", (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    const config = await loadConfig()

    initIPC()

    logWindow = createWindow(config.loadingScreen)

    autoUpdater.on("checking-for-update", () => {
        logToWindow(LogType.INFO, "Checking for update...")
    })
    autoUpdater.on("update-available", (info) => {
        logToWindow(LogType.INFO, `Found new version ${info.version}, downloading...`)
    })
    autoUpdater.on("update-not-available", (_info) => {
        logToWindow(LogType.INFO, "No update found.")
    })
    autoUpdater.on("error", (err) => {
        logToWindow(LogType.ERROR, "Error in auto-updater. " + err.message)
    })
    autoUpdater.on("update-downloaded", (_info) => {
        logToWindow(LogType.INFO, "Update downloaded. Quitting and installing in 5...")
        setTimeout(() => {
            autoUpdater.quitAndInstall()
        }, 5000)
    })

    logWindow.on("close", async () => {
        if (!logWindow) return

        const config = getConfig()

        const pos = logWindow.getPosition()
        const size = logWindow.getSize()
        const isFullscreen = logWindow.isFullScreen()

        config.loadingScreen = {
            x: pos[0],
            y: pos[1],
            width: size[0],
            height: size[1],
            fullScreen: isFullscreen
        }

        await saveConfig(config)
    })

    ipcMain.on(Channels.LOADING_LOADED, () => {
        loaded = true
        for (const log of logQueue) {
            sendToLogWindow(log)
        }
        // logQueue.length = 0
    })

    initLCU()
    initWebsocket()

    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow(config.loadingScreen)
    })
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit()
    }
})
