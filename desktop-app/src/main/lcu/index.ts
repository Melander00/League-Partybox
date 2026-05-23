import { destroyApp, openApp } from "@main/app";
import { Channels, LogType } from "@shared/index";
import { ipcMain } from "electron";
import { logToWindow } from "..";
import LCUApi from "./lcuAPI";
import LCUConnector from "./lcuConnector";


const lcu = new LCUConnector()
let api: LCUApi

lcu.on("connect", creds => {
    logToWindow(LogType.INFO, "Detected LoL client. Opening app...")
    api = new LCUApi(creds)

    openApp("lcu")
})

lcu.on("disconnect", () => {
    logToWindow(LogType.WARNING, "LoL client closed.")
    destroyApp("lcu")
}) 

const subscriptions = new Map<number, Map<string, () => void>>()

export function initLCU() {
    logToWindow(LogType.INFO, "Waiting on LoL client")

    lcu.start()

    ipcMain.handle(Channels.REQUEST, async (_ev, data) => {
        if(api) {
            return await (await api.request(data)).json()
        }
        return null;
    })

    ipcMain.handle(Channels.SUBSCRIBE, (ev, endpoint) => {
        const wcId = ev.sender.id

        const channel = crypto.randomUUID()

        const unsubscribe = api.ws.subscribe(endpoint, (data) => {
            ev.sender.send(channel, data)
        })

        if (!subscriptions.has(wcId)) {
            subscriptions.set(wcId, new Map())

            function cleanup() {

                const subs = subscriptions.get(wcId)

                if (subs) {
                    for (const unsub of subs.values()) {
                        unsub()
                    }

                    subscriptions.delete(wcId)
                }
            }

            ev.sender.once("destroyed", cleanup)
            ev.sender.once("did-start-loading", cleanup)
        }

        subscriptions.get(wcId)!.set(channel, unsubscribe)

        return channel
    })

    ipcMain.handle(Channels.UNSUBSCRIBE, async (ev, channel) => {
        const wcId = ev.sender.id
        const unsubscribe = subscriptions.get(wcId)!.get(channel)

        if (unsubscribe) {
            unsubscribe()
            subscriptions.delete(channel)
        }
    })
}

export function getApi() {
    return api;
}