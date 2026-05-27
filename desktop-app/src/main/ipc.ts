import { Channels, Phase } from "@shared/index";
import { ipcMain } from "electron";
import { emitMessage } from "./ws";

export function initIPC() {

    ipcMain.on(Channels.SET_PARTY_ID, (_ev, partyId) => {
        emitMessage("party-id", partyId)
    })

    ipcMain.on(Channels.PHASE, (_ev, phase: Phase) => {
        if(phase === "Matchmaking") {
            emitMessage("started-queue")
        } else if(phase === "Lobby") {
            emitMessage("reset-game")
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