import { is } from "@electron-toolkit/utils";
import { BrowserWindow, shell } from "electron";
import { join } from "path";
import icon from "../../resources/icon.png?asset";
import { getConfig, saveConfig, ScreenPosition } from "./config";
import { clampWindowBounds } from "./util";

let appWindow: BrowserWindow|undefined;

export function createAppWindow(screen: ScreenPosition) {
    const bounds = clampWindowBounds(screen)

    const mainWindow = new BrowserWindow({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        fullscreen: bounds.fullScreen,
        show: false,
        autoHideMenuBar: !is.dev,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '..', 'preload', 'index.js'),
            sandbox: false
        }
    })
    
    mainWindow.on('ready-to-show', () => {
        // mainWindow.maximize()
        mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return {
            action: 'deny'
        }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if(is.dev && process.env["ELECTRON_RENDERER_URL"]) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + "/app/index.html")
    } else {
        mainWindow.loadFile(join(__dirname, "../renderer/app/index.html"))
    }

    return mainWindow
}


const requires = {
    "lcu": false,
    "ws": false,
}

export function openApp(caller: string) {

    if(appWindow) return;

    requires[caller] = true

    if(Object.values(requires).some(e => e === false)) {
        return;
    }

    appWindow = createAppWindow(getConfig().appConfig.screen)

    appWindow.on("close", async () => {
        if(!appWindow) return

        const config = getConfig()

        const pos = appWindow.getPosition()
        const size = appWindow.getSize()
        const isFullscreen = appWindow.isFullScreen()

        config.appConfig.screen = {
            x: pos[0],
            y: pos[1],
            width: size[0],
            height: size[1],
            fullScreen: isFullscreen
        }

        await saveConfig(config)

        for(const win of BrowserWindow.getAllWindows()) {
            if(win.isClosable()) {
                win.close()
            }
        }
    })
}

export function destroyApp(caller: string) {
    requires[caller] = false

    if(appWindow && !appWindow.isDestroyed()) {
        appWindow.destroy()
        appWindow = undefined;
    }
}


export function getAppWindow() {
    return appWindow;
}