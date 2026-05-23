export const Channels = {
    LOADING_LOG: "loading-log",
    LOADING_LOADED: "loading-loaded",

    REQUEST: "request",
    SUBSCRIBE: "subscribe",
    UNSUBSCRIBE: "unsubscribe",

    SET_PARTY_ID: "set-party-id",
    PING: "ping",
}


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
    method: "get" | "post" | "put" | "delete",
    data?: any
}
