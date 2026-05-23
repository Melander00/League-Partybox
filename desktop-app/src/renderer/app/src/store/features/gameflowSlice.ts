import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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

export interface GameflowState {
    phase: Phase
}

const initialState: GameflowState = {
    phase: "None"
}

const gameflowSlice = createSlice({
    initialState,
    name: "gameflow",
    reducers: {
        setPhase: (state, action: PayloadAction<Phase>) => {
            state.phase = action.payload
        }
    } 
})

export const {
    setPhase
} = gameflowSlice.actions;
export default gameflowSlice.reducer;