import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { LobbyMember } from "@shared/types/lcu/lobby"

export interface LobbyState {
    members: LobbyMember[]
}

const initialState: LobbyState = {
    members: []
}

export const lobbySlice = createSlice({
    name: "config",
    initialState,
    reducers: {
        setMembers: (state, action: PayloadAction<LobbyMember[]>) => {
            state.members = action.payload
        }
    }
})

export const {
    setMembers
} = lobbySlice.actions

export default lobbySlice.reducer