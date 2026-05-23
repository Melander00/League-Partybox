import { openApp } from "@main/app";
import { LogType } from "@shared/index";
import { logToWindow } from "..";

export function initWebsocket() {
    logToWindow(LogType.INFO, "Connecting to websocket")

    openApp("ws")
}