import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Phase } from "@shared/index";


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