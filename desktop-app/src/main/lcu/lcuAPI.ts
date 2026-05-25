import { RequestOptions } from "@shared/index";
import { LCUCredentials } from "./lcuConnector";
import LeagueWS from "./lcuWS";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";



export default class LCUApi {

    private creds: LCUCredentials

    ws: LeagueWS

    private baseUrl: string
    private headers: {[key: string]: string}


    constructor(creds: LCUCredentials) {
        this.creds = creds;
        
        this.baseUrl = `${creds.protocol}://${creds.address}:${creds.port}`
        this.headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "authorization": `Basic ${Buffer.from(`${this.creds.username}:${this.creds.password}`).toString("base64")}`
        }

        
        this.ws = new LeagueWS(`wss://riot:${creds.password}@${creds.address}:${creds.port}/`)
        // this.ws.on("open", () => {  
        //     logToWindow(LogType.INFO, "Connected to LoL websocket server.")
        // })
        // this.ws.on("error", (e) => {
        //     logToWindow(LogType.ERROR, "WS: " + e.message)
        // })
    }

    request(opt: RequestOptions) {

        return fetch(new URL(opt.endpoint, this.baseUrl), {
            method: opt.method,
            headers: this.headers,
            body: JSON.stringify(opt.data)
        })

    }

    setCreds(creds: LCUCredentials) {
        this.creds = creds;
    }

    getCreds() {
        return this.creds
    }
}