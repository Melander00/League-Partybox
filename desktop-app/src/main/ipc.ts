import { Channels, LogType, Phase } from "@shared/index";
import { ipcMain } from "electron";
import { logToWindow } from ".";
import { emitMessage } from "./ws";

export function initIPC() {

    ipcMain.on(Channels.SET_PARTY_ID, (_ev, partyId) => {
        logToWindow(LogType.INFO, "Joined party " + partyId)
        emitMessage("party-id", partyId)
    })

    ipcMain.on(Channels.PHASE, (_ev, phase: Phase) => {
        if(phase === "Matchmaking") {
            emitMessage("started-queue")
        }
    })

    ipcMain.on(Channels.PICK_CHAMP, (_ev, {targetId, id}) => {
        emitMessage("pick-champion", {
            championId: id,
            targetSocketId: targetId
        })
    })

    ipcMain.on(Channels.GET_PICKABLE_CHAMPS, (_ev, summonerId) => {
        emitMessage("get-pickable-ids", {
            targetId: summonerId
        })
    })
}