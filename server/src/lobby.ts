// lobby.ts
import crypto from "crypto";
import { Server, Socket } from "socket.io";
import { z } from "zod";

type Member = {
    socket: Socket;
    summonerId: number;
    partyId: string;
};

enum MatchPhase {
    WAITING = "WAITING",
    PICKING = "PICKING",
    FINISHED = "FINISHED",
}

type PendingPickableRequest = {
    requesterSocketId: string;
    targetId: number;
    timeout: NodeJS.Timeout;
};

const PICK_RATE_LIMIT_MS = Number(
    process.env.PICK_RATE_LIMIT_MS ?? 1000
);

const START_RATE_LIMIT_MS = Number(
    process.env.START_RATE_LIMIT_MS ?? 5000
);

const REQUEST_TIMEOUT_MS = Number(
    process.env.REQUEST_TIMEOUT_MS ?? 10000
);

const pickChampionSchema = z.object({
    championId: z.number(),
    targetSocketId: z.string(),
});

const getPickableIdsSchema = z.object({
    targetId: z.number(),
});

const returnPickableIdsSchema = z.object({
    requestId: z.string(),
    ids: z.array(z.number()),
});

export default class Lobby {
    members = new Map<string, Member>();

    summonerSockets = new Map<number, Socket>();

    pickAssignments = new Map<string, string>();

    pendingPickableRequests =
        new Map<string, PendingPickableRequest>();

    pickRateLimitMap =
        new Map<string, number>();

    startRateLimitMap =
        new Map<string, number>();

    partyId: string;

    io: Server;

    phase: MatchPhase =
        MatchPhase.WAITING;

    hasStartedQueue = false;

    pickingOrder: Member[] = [];

    lastActivity = Date.now();

    constructor(
        partyId: string,
        io: Server
    ) {
        this.partyId = partyId;

        this.io = io;
    }

    touch() {
        this.lastActivity = Date.now();
    }

    isEmpty() {
        return this.members.size === 0;
    }

    getMember(socketId: string) {
        return this.members.get(socketId);
    }

    addMember(member: Member) {
        this.touch();

        this.members.set(
            member.socket.id,
            member
        );

        this.summonerSockets.set(
            member.summonerId,
            member.socket
        );

        this.addListeners(member);
    }

    removeMember(socketId: string) {
        const member =
            this.members.get(socketId);

        if (!member) return;

        this.touch();

        this.members.delete(socketId);

        this.summonerSockets.delete(
            member.summonerId
        );

        this.pickAssignments.delete(
            socketId
        );

        for (const [
            picker,
            target,
        ] of this.pickAssignments.entries()) {
            if (target === socketId) {
                this.pickAssignments.delete(
                    picker
                );
            }
        }

        for (const [
            requestId,
            request,
        ] of this.pendingPickableRequests.entries()) {
            if (
                request.requesterSocketId ===
                socketId
            ) {
                clearTimeout(request.timeout);

                this.pendingPickableRequests.delete(
                    requestId
                );
            }
        }

        member.socket.leave(this.partyId);

        this.resetMatch();
    }

    destroy() {
        for (const request of this
            .pendingPickableRequests.values()) {
            clearTimeout(request.timeout);
        }

        this.members.clear();

        this.summonerSockets.clear();

        this.pickAssignments.clear();

        this.pendingPickableRequests.clear();

        this.pickRateLimitMap.clear();

        this.startRateLimitMap.clear();
    }

    resetMatch() {
        this.phase = MatchPhase.WAITING;

        this.hasStartedQueue = false;

        this.pickAssignments.clear();

        this.pickingOrder = [];

        this.io.to(this.partyId).emit(
            "match-reset"
        );
    }

    isRateLimited(
        map: Map<string, number>,
        socketId: string,
        limitMs: number
    ) {
        const now = Date.now();

        const last = map.get(socketId);

        if (
            last &&
            now - last < limitMs
        ) {
            return true;
        }

        map.set(socketId, now);

        return false;
    }

    addListeners(member: Member) {
        const socket = member.socket;

        socket.removeAllListeners(
            "get-pickable-ids"
        );

        socket.removeAllListeners(
            "return-pickable-ids"
        );

        socket.removeAllListeners(
            "pick-champion"
        );

        socket.removeAllListeners(
            "started-queue"
        );

        socket.removeAllListeners(
            "get-to-pick-for"
        );

        socket.removeAllListeners(
            "reset-game"
        );

        socket.on(
            "get-pickable-ids",
            (payload) => {
                this.touch();

                const parsed =
                    getPickableIdsSchema.safeParse(
                        payload
                    );

                if (!parsed.success) {
                    return;
                }

                const { targetId } =
                    parsed.data;

                const forwardSocket =
                    this.summonerSockets.get(
                        targetId
                    );

                if (!forwardSocket) {
                    return;
                }

                const sender =
                    this.members.get(
                        socket.id
                    );

                if (!sender) {
                    return;
                }

                const requestId =
                    crypto.randomUUID();

                const timeout =
                    setTimeout(() => {
                        this.pendingPickableRequests.delete(
                            requestId
                        );
                    }, REQUEST_TIMEOUT_MS);

                this.pendingPickableRequests.set(
                    requestId,
                    {
                        requesterSocketId:
                            socket.id,
                        targetId,
                        timeout,
                    }
                );

                forwardSocket.emit(
                    "get-pickable-ids",
                    {
                        requestId,
                        requesterId:
                            sender.summonerId,
                    }
                );
            }
        );

        socket.on(
            "return-pickable-ids",
            (payload) => {
                this.touch();

                const parsed =
                    returnPickableIdsSchema.safeParse(
                        payload
                    );

                if (!parsed.success) {
                    return;
                }

                const {
                    requestId,
                    ids,
                } = parsed.data;

                const request =
                    this.pendingPickableRequests.get(
                        requestId
                    );

                if (!request) {
                    return;
                }

                clearTimeout(
                    request.timeout
                );

                this.pendingPickableRequests.delete(
                    requestId
                );

                const requester =
                    this.members.get(
                        request.requesterSocketId
                    );

                if (!requester) {
                    return;
                }

                requester.socket.emit(
                    "return-pickable-ids",
                    {
                        summonerId:
                            request.targetId,
                        ids,
                    }
                );
            }
        );

        socket.on(
            "pick-champion",
            (payload) => {
                this.touch();

                if (
                    this.phase !==
                    MatchPhase.PICKING
                ) {
                    return;
                }

                if (
                    this.isRateLimited(
                        this.pickRateLimitMap,
                        socket.id,
                        PICK_RATE_LIMIT_MS
                    )
                ) {
                    return;
                }

                const parsed =
                    pickChampionSchema.safeParse(
                        payload
                    );

                if (!parsed.success) {
                    return;
                }

                const {
                    championId,
                    targetSocketId,
                } = parsed.data;

                const allowedTarget =
                    this.pickAssignments.get(
                        socket.id
                    );

                if (
                    allowedTarget !==
                    targetSocketId
                ) {
                    console.log(
                        "Invalid pick target"
                    );

                    return;
                }

                const targetMember =
                    this.members.get(
                        targetSocketId
                    );

                if (!targetMember) {
                    return;
                }

                targetMember.socket.emit(
                    "pick-champion",
                    {
                        sender:
                            member.summonerId,
                        championId,
                    }
                );
            }
        );

        socket.on(
            "started-queue",
            () => {
                this.touch();

                if (
                    this.isRateLimited(
                        this.startRateLimitMap,
                        socket.id,
                        START_RATE_LIMIT_MS
                    )
                ) {
                    return;
                }

                if (
                    this.hasStartedQueue
                ) {
                    return;
                }

                this.hasStartedQueue =
                    true;

                this.startGame();
            }
        );

        socket.on(
            "get-to-pick-for",
            () => {
                this.touch();

                if (
                    this.phase !==
                    MatchPhase.PICKING
                ) {
                    return;
                }

                const targetSocketId =
                    this.pickAssignments.get(
                        socket.id
                    );

                if (
                    !targetSocketId
                ) {
                    return;
                }

                const targetMember =
                    this.members.get(
                        targetSocketId
                    );

                if (!targetMember) {
                    return;
                }

                socket.emit(
                    "you-pick-for",
                    {
                        summonerId:
                            targetMember.summonerId,
                        socketId:
                            targetMember
                                .socket.id,
                    }
                );
            }
        );

        socket.on(
            "reset-game",
            () => {
                this.touch();

                this.resetMatch();
            }
        );
    }

    startGame() {
        this.phase =
            MatchPhase.PICKING;

        this.pickAssignments.clear();

        const shuffled =
            Array.from(
                this.members.values()
            );

        shuffle(shuffled);

        for (
            let i = 0;
            i < shuffled.length;
            i++
        ) {
            const curr =
                shuffled[i];

            const next =
                shuffled[
                    (i + 1) %
                        shuffled.length
                ];

            this.pickAssignments.set(
                curr.socket.id,
                next.socket.id
            );

            curr.socket.emit(
                "you-pick-for",
                {
                    summonerId:
                        next.summonerId,
                    socketId:
                        next.socket.id,
                }
            );
        }

        this.pickingOrder =
            shuffled;
    }
}

function shuffle(array: any[]) {
    let currentIndex =
        array.length;

    while (
        currentIndex !== 0
    ) {
        const randomIndex =
            Math.floor(
                Math.random() *
                    currentIndex
            );

        currentIndex--;

        [
            array[currentIndex],
            array[randomIndex],
        ] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }
}