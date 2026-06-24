import { openApp, sendToAppWindow } from "@main/app";
import { getConfig } from "@main/config";
import { request } from "@main/lcu";
import { Channels, LogType } from "@shared/index";
import { Manager, Socket } from "socket.io-client";
import { logToWindow } from "..";

let manager: Manager
let socket: Socket

type Message = {
    channel: string,
    message: any
}

const messages: Message[]= []

export function initWebsocket() {
    logToWindow(LogType.INFO, "Connecting to server")

    const config = getConfig()

    manager = new Manager(config.serverUrl)
    socket = manager.socket("/")

    manager.on("reconnect_attempt", attempt => {
        logToWindow(LogType.INFO, "Attempting to recconect. Try " + attempt)
    })

    manager.on("error", err => {
        logToWindow(LogType.ERROR, "Connection error: " + err.message)
    })

    socket.on("connect", () => {
        logToWindow(LogType.INFO, "Connected to server")
        openApp("ws")

        for(const msg of messages) {
            socket.emit(msg.channel, msg.message)
        }

        messages.length = 0
    })

    socket.on("close", () => {
        logToWindow(LogType.WARNING, "Lost connection to server.")
    })

    socket.on("latency", (data) => {
        sendToAppWindow(Channels.PING, data)
    })

    socket.on("get-pickable-ids", async ({ requestId }) => {

        const ids = await request({
            method: "GET",
            endpoint: "/lol-champ-select/v1/pickable-champion-ids"
        })
        
        socket.emit("return-pickable-ids", {
            requestId,
            ids
        })

    })

    socket.on("return-pickable-ids", ({ ids }) => {
        sendToAppWindow(Channels.PICKABLE_CHAMP_IDS, ids)
    })
    
    socket.on("pick-champion", async ({
        championId
    }) => {

        sendToAppWindow(Channels.GOT_PICK_CHAMP, championId)


        // // await request({
        // //     method: "patch",
        // //     endpoint: "/lol-champ-select/v1/session/actions/",
        // //     data: {
        // //         championId
        // //     }
        // // })

        // try {
        //     const res = await getApi()!.request({
        //         method: "PATCH",
        //         endpoint: "/lol-champ-select/v1/session/my-selection",
        //         data: {
        //             championId
        //         }
        //     })
        //     // const res = await request({
        //     //     method: "PATCH",
        //     //     endpoint: "/lol-champ-select/v1/session/my-selection",
        //     //     data: {
        //     //         championId
        //     //     }
        //     // })

        //     console.log(res)


        // } catch (e) {
        //     console.error(e)
        // }

    })

    socket.on("you-pick-for", ({ summonerId, socketId }) => {

        sendToAppWindow(Channels.YOU_PICK_FOR, {summonerId, socketId})

        logToWindow(LogType.INFO, `Pick for ${summonerId}`)
    })

    socket.on("match-reset", () => {
        sendToAppWindow(Channels.RESET_MATCH)
    })


    setInterval(() => {

        const time = Date.now()
        socket.emit("ping", () => {
            const latency = Date.now() - time

            // logToWindow(LogType.INFO, `Ping: ${latency} ms`)

            socket.emit("latency", latency)
        })

    }, 5000)
}

export function getSocket() {
    return socket
}


export function emitMessage(channel: string, data?: any) {
    if(!socket) {

        messages.push({
            channel,
            message: data
        })

        return;
    }

    socket.emit(channel, data)
}
