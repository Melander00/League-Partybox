// main.ts
import cors from "cors";
import express from "express";
import { Server, Socket } from "socket.io";
import Lobby from "./lobby";

const app = express();

app.use(cors());

const server = app.listen(3000, () => {
    console.log("Listening on port 3000");
});

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

const LOBBY_TIMEOUT_MS = Number(process.env.LOBBY_TIMEOUT_MS ?? 1000 * 60 * 30);

const sumIdMap = new Map<number, Socket>();
const socketToSumIdMap = new Map<string, number>();

const lobbyMap = new Map<string, Lobby>();

function removeSocketFromAllLobbies(socket: Socket, exceptPartyId?: string) {
    for (const [partyId, lobby] of lobbyMap.entries()) {
        if (exceptPartyId && partyId === exceptPartyId) continue;

        lobby.removeMember(socket.id);

        if (lobby.isEmpty()) {
            lobby.destroy();
            lobbyMap.delete(partyId);
        }
    }
}

setInterval(() => {
    const now = Date.now();

    for (const [partyId, lobby] of lobbyMap.entries()) {
        if (now - lobby.lastActivity > LOBBY_TIMEOUT_MS) {
            console.log(`Destroying inactive lobby ${partyId}`);

            lobby.destroy();
            lobbyMap.delete(partyId);
        }
    }
}, 60_000);

io.on("connection", (socket) => {
    socket.on("ping", (callback) => {
        callback();
    });

    socket.on("latency", (ping) => {
        const summonerId = socketToSumIdMap.get(socket.id);
        if (!summonerId) return;

        for (const lobby of lobbyMap.values()) {
            const member = lobby.getMember(socket.id);
            if (!member) continue;

            lobby.touch();

            socket.to(lobby.partyId).emit("latency", {
                id: summonerId,
                ping,
            });

            break;
        }
    });

    socket.on("me", (summonerId: number) => {
        sumIdMap.set(summonerId, socket);
        socketToSumIdMap.set(socket.id, summonerId);
    });

    socket.on("party-id", (partyId: string) => {
        removeSocketFromAllLobbies(socket, partyId);

        let lobby = lobbyMap.get(partyId);

        if (!lobby) {
            lobby = new Lobby(partyId, io);
            lobbyMap.set(partyId, lobby);
        }

        const summonerId = socketToSumIdMap.get(socket.id);

        if (!summonerId) {
            console.log("Socket tried joining without summonerId");
            return;
        }

        lobby.addMember({
            socket,
            summonerId,
            partyId,
        });

        socket.join(partyId);

        console.log(`Socket ${socket.id} joined lobby ${partyId}`);
    });

    socket.on("disconnect", () => {
        const summonerId = socketToSumIdMap.get(socket.id);

        if (summonerId) {
            sumIdMap.delete(summonerId);
        }

        socketToSumIdMap.delete(socket.id);

        removeSocketFromAllLobbies(socket);

        console.log(`Socket disconnected ${socket.id}`);
    });
});
