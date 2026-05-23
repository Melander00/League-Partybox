import { Channels } from "@shared/index";
import { ipcMain } from "electron";
import { emitMessage } from "./ws";

export function initIPC() {

    ipcMain.on(Channels.SET_PARTY_ID, (_ev, partyId) => {
        emitMessage("party-id", partyId)
    })
}