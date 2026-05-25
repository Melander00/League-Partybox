import { app } from "electron"
import { existsSync } from "fs"
import fs from "fs/promises"
import { join } from "path"


export interface Config {
    serverUrl: string,
    loadingScreen: ScreenPosition
    appConfig: AppConfig
}

export type ScreenPosition = {
    x: number,
    y: number,
    width: number,
    height: number,
    fullScreen: boolean,
}

export interface AppConfig {
    screen: ScreenPosition
}

const configDir = join(app.getPath("userData"), "config")

let config: Config = {
    serverUrl: "https://lol.melander.dev",
    loadingScreen: {
        x: 100,
        y: 100,
        width: 600,
        height: 400,
        fullScreen: false,
    },
    appConfig: {
        screen: {
            x: 100,
            y: 100,
            width: 1200,
            height: 800,
            fullScreen: false,
        }
    }
} 

export async function loadConfig() {
    const configPath = join(configDir, "config.json")
    
    if(!existsSync(configPath)) {
        // Load default config
        saveConfig(config)
        return config
    }
    
    const raw = await fs.readFile(configPath)
    const data = JSON.parse(raw.toString())
    config = data
    return config
}

export async function saveConfig(config: Config) {
    const configPath = join(configDir, "config.json")
    if(!existsSync(configDir)) {
        await fs.mkdir(configDir, {recursive: true})
    }
    await fs.writeFile(configPath, JSON.stringify(config, null, 2))
}

export function getConfig() {
    return config;
}