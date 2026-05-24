import { LogType, ValueOf } from "@shared/index";
import { EventEmitter } from "events";
import ws from "ws";
import { logToWindow } from "..";

const TYPES = {
    WELCOME: 0,
    PREFIX: 1,
    CALL: 2,
    CALLRESULT: 3,
    CALLERROR: 4,
    SUBSCRIBE: 5,
    UNSUBSCRIBE: 6,
    PUBLISH: 7,
    EVENT: 8
};

type Listener = (...args: any[]) => void;

export default class LeagueWS extends EventEmitter {

    private socket: ws | null = null;
    private session: any = null;

    private readonly url: string;
    private readonly protocol = "wamp";

    private reconnectDelay = 10000;
    private shouldReconnect = true;
    private reconnectTimeout: NodeJS.Timeout | null = null;

    // topic -> listeners
    private subscriptions = new Map<string, Set<Listener>>();

    constructor(url: string) {
        super();

        this.url = url;

        this.connect();
    }

    private connect() {
        logToWindow(LogType.INFO, "LoL WS connecting...")
        this.socket = new ws(this.url, this.protocol);

        this.socket.on("open", this._onOpen.bind(this));
        this.socket.on("message", this._onMessage.bind(this));
        this.socket.on("close", this._onClose.bind(this));
        this.socket.on("error", this._onError.bind(this));
    }

    close() {
        this.shouldReconnect = false;

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        this.socket?.close();
        this.session = null;
    }

    terminate() {
        this.shouldReconnect = false;

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        this.socket?.terminate();
        this.session = null;
    }

    subscribe(topic: string, listener: Listener) {
        let listeners = this.subscriptions.get(topic);

        if (!listeners) {
            listeners = new Set();
            this.subscriptions.set(topic, listeners);
        }

        const hadListeners = listeners.size > 0;

        listeners.add(listener);

        super.addListener(topic, listener);

        if (!hadListeners && this.isOpen()) {
            this.sendMessage(TYPES.SUBSCRIBE, topic);
        }

        return () => {
            this.unsubscribe(topic, listener);
        };
    }

    unsubscribe(topic: string, listener: Listener) {
        const listeners = this.subscriptions.get(topic);

        if (listeners) {
            listeners.delete(listener);

            if (listeners.size === 0) {
                this.subscriptions.delete(topic);

                if (this.isOpen()) {
                    this.sendMessage(TYPES.UNSUBSCRIBE, topic);
                }
            }
        }

        super.removeListener(topic, listener);
    }

    send(type: ValueOf<typeof TYPES>, message: any) {
        this.sendMessage(type, message);
    }

    private reconnect() {
        if(!this.shouldReconnect) return

        logToWindow(LogType.INFO, "LoL WS Reconnecting in " + Math.round(this.reconnectDelay / 1000) + "...");
        this.reconnectTimeout = setTimeout(() => {
            this.connect();
        }, this.reconnectDelay);
    }

    private sendMessage(type: ValueOf<typeof TYPES>, message: any) {
        if (!this.isOpen()) {
            return;
        }

        this.socket!.send(JSON.stringify([type, message]));
    }

    private isOpen() {
        return this.socket?.readyState === ws.OPEN;
    }

    private _onOpen() {
        logToWindow(LogType.INFO, "LoL WS Connected");

        // Restore subscriptions
        for (const topic of this.subscriptions.keys()) {
            this.sendMessage(TYPES.SUBSCRIBE, topic);
        }

        this.emit("open");
    }

    private _onClose(code: number, reason: Buffer) {
        logToWindow( LogType.WARNING,
            `LoL WS Disconnected (${code}) ${reason.toString() || ""}`
        );

        this.session = null;

        this.emit("close", code, reason);

        this.reconnect()
    }

    private _onError(error: Error) {
        logToWindow(LogType.ERROR, "LoL WS Error: " + error.message);
        console.log(error)
        // this.emit("error", error);

        this.session = null;

        // this.reconnect()
    }

    private _onMessage(message: ws.RawData) {
        const [type, ...data] = JSON.parse(message.toString());

        switch(type) {
            case TYPES.WELCOME:
                this.session = data[0];
                break;

            case TYPES.EVENT: {
                const [topic, payload] = data;

                this.emit(topic, payload);

                break;
            }

            default:
                console.log("Unknown type:", data);
                break;
        }
    }
}