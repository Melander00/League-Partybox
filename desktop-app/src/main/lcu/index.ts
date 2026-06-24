import { openApp } from "@main/app";
import { emitMessage } from "@main/ws";
import { Channels, LogType, RequestOptions } from "@shared/index";
import { app, ipcMain } from "electron";
import { logToWindow } from "..";
import LCUApi from "./lcuAPI";
import LCUConnector from "./lcuConnector";


const lcu = new LCUConnector()
let api: LCUApi

lcu.on("connect", creds => {
    logToWindow(LogType.INFO, "Detected LoL client. Opening app...")
    api = new LCUApi(creds)

    api.ws.once("open", () => {
        api.request({
            method: "GET",
            endpoint: "/lol-summoner/v1/current-summoner"
        }).then(async res => {

            if(res.ok) {
                const data = await res.json()

                if(data.summonerId) {   
                    emitMessage("me", data.summonerId)
                }
            }

        })

        api.request({
            method: "GET",
            endpoint: "/lol-gameflow/v1/gameflow-phase"
        }).then(async res => {

            if(res.ok) {
                const data = await res.json()
                
                if(data === "Lobby") {

                    api.request({
                        method: "GET",
                        endpoint: "/lol-lobby/v2/lobby"
                    }).then(async res => {

                        if(res.ok) {
                            const data = await res.json()

                            if(data.partyId) {   
                                emitMessage("party-id", data.partyId)
                            }
                        }

                    })

                }
            }

        })
        openApp("lcu")
    })

})

lcu.on("disconnect", () => {
    logToWindow(LogType.WARNING, "LoL client closed.")
    // destroyApp("lcu")
    app.quit()
}) 

const subscriptions = new Map<number, Map<string, () => void>>()

export function initLCU() {
    logToWindow(LogType.INFO, "Waiting on LoL client")

    lcu.start()

    ipcMain.handle("raw", async (_ev, data) => {
        const res = await api.request(data)
        
        if(res.ok) {
            console.log(res)
        }

        console.error(res)

    })

    ipcMain.handle(Channels.REQUEST, async (_ev, data) => {
        return await request(data)
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

export async function request<T>(opt: RequestOptions) {
    if(!api) return null

    const res = await api.request(opt)
    if(res.ok) {
        if(res.headers.get("content-type") === "application/json" && parseInt(res.headers.get("content-length") ?? "0") > 0) {
            return await res.json() as T
        }
        return true;
    }

    return null
}

export function subscribe<T>(topic, callback: (data: T) => void) {
    if(!api) return false;

    if(!api.ws) return false

    const unsubscribe = api.ws.subscribe(topic, callback)
    return unsubscribe
}