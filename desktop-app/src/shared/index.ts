export const Channels = {
    LOADING_LOG: "loading-log",
    LOADING_LOADED: "loading-loaded",

    REQUEST: "request",
    SUBSCRIBE: "subscribe",
    UNSUBSCRIBE: "unsubscribe",

    SET_PARTY_ID: "set-party-id",
    PHASE: "phase",

    PING: "ping",
    YOU_PICK_FOR: "you-pick-for",
    PICKABLE_CHAMP_IDS: "pickable-champ-ids",

    PICK_CHAMP: "pick-champ",
    GET_PICKABLE_CHAMPS: "get-pickable-champs",
    GOT_PICK_CHAMP: "got-pick-champ",
}

const Phases = [
    "None",
    "Lobby",
    "Matchmaking",
    "ReadyCheck",
    "ChampSelect",
    "GameStart",
    "InProgress",
    "WaitingForStats",
    "PreEndOfGame",
    "EndOfGame",
] as const

export type Phase = typeof Phases[number]



export type ValueOf<T> = T[keyof T];

export type Log = {
    type: string,
    text: string,
    time: number,
}

export const LogType = {
    WARNING: "warning",
    ERROR: "error",
    INFO: "info"
}

export type RequestOptions = {
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    data?: any
}
