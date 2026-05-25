import { openApp, sendToAppWindow } from "@main/app";
import { getConfig } from "@main/config";
import { request } from "@main/lcu";
import { Channels, LogType } from "@shared/index";
import { io, Socket } from "socket.io-client";
import { logToWindow } from "..";

let socket: Socket

type Message = {
    channel: string,
    message: any
}

const messages: Message[]= []

export function initWebsocket() {
    logToWindow(LogType.INFO, "Connecting to server")

    const config = getConfig()

    socket = io(config.serverUrl)

    socket.on("connect", () => {
        logToWindow(LogType.INFO, "Connected to server")
        openApp("ws")

        for(const msg of messages) {
            socket.emit(msg.channel, msg.message)
        }
    })

    socket.on("latency", (data) => {
        sendToAppWindow(Channels.PING, data)
    })

    socket.on("get-pickable-ids", async () => {

        const ids = await request({
            method: "GET",
            endpoint: "/lol-champ-select/v1/pickable-champion-ids"
        })
        
        socket.emit("return-pickable-ids", ids)

    })

    socket.on("return-pickable-ids", ids => {
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
