import cors from "cors"
import express from "express"
import { Server, Socket } from "socket.io"
import Lobby from "./lobby"

const app = express()

app.use(cors())

const server = app.listen(3000, () => {
    console.log("Listening on port 3000") 
})

const io = new Server(server, {
    cors: {
        origin: "*"
    }
})

const sumIdMap = new Map<number, Socket>()
const socketToSumIdMap = new Map<Socket, number>()
const partyIdMap = new Map<Socket, string>()

const lobbyMap = new Map<string, Lobby>()

io.on("connection", socket => {
    socket.on("ping", (callback) => {
        callback()
    })

    socket.on("latency", ping => {
        if(!partyIdMap.has(socket)) return;
        const partyId = partyIdMap.get(socket)
        if(!partyId) return;
        
        if(!socketToSumIdMap.has(socket)) return
        const sumId = socketToSumIdMap.get(socket)
        if(!sumId) return;

        socket.to(partyId).emit("latency", {
            id: sumId,
            ping: ping
        })
    })

    socket.on("me", (summonerId) => {
        sumIdMap.set(summonerId, socket)
        socketToSumIdMap.set(socket, summonerId)
    })

    socket.on("party-id", id => {
        let lobby = lobbyMap.get(id)
        if(!lobby) {
            lobby = new Lobby(id, io)
            lobbyMap.set(id, lobby)
        }

        const summonerId = socketToSumIdMap.get(socket)
        if(summonerId) {
            lobby.addMember({
                socket,
                summonerId,
                partyId: id
            })
        }

        partyIdMap.set(socket, id)
        socket.join(id)
    })
})