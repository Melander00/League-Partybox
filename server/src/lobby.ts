import { Server, Socket } from "socket.io";

type Member = {
    socket: Socket;
    summonerId: number;
    partyId: string;
};

export default class Lobby {
    members = new Map<string, Member>();
    summonerSockets = new Map<number, Socket>();

    partyId: string;
    io: Server;

    hasShuffled = false;
    pickingOrder: Member[] = []

    constructor(partyId: string, io: Server) {
        this.partyId = partyId;
        this.io = io;
    }

    addMember(member: Member) {
        this.members.set(member.socket.id, member);
        this.summonerSockets.set(member.summonerId, member.socket);

        this.addListeners(member);
    }

    addListeners(member: Member) {
        const socket = member.socket;

        socket.on("get-pickable-ids", ({ targetId }) => {
            const forwardSocket = this.summonerSockets.get(targetId);
            if (!forwardSocket) return;

            const sender = this.members.get(socket.id);
            if (!sender) return;

            forwardSocket.once("return-pickable-ids", (ids) => {
                socket.emit("return-pickable-ids", {
                    summonerId: targetId,
                    ids: ids,
                });
            });

            forwardSocket.emit("get-pickable-ids", sender.summonerId);
        });

        socket.on("pick-champion", ({ championId, targetId }) => {
            const forwardSocket = this.summonerSockets.get(targetId);
            if (!forwardSocket) return;

            const sender = this.members.get(socket.id);
            if (!sender) return;

            forwardSocket.emit("pick-champion", {
                sender: sender.summonerId,
                championId,
            });
        });
    }

    shuffle() {
        if (this.hasShuffled) return;
        this.hasShuffled = true;

        const shuffled = Array.from(this.members.values());
        shuffle(shuffled)

        for(let i = 0; i < shuffled.length; i++) {
            const curr = shuffled[i]
            const next = shuffled[(i+1) % shuffled.length]

            curr.socket.emit("you-pick-for", next.summonerId)
        }

        this.pickingOrder = shuffled
    }
}

function shuffle(array: any[]) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {
        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
}
