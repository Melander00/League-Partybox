import { createSlice, PayloadAction } from "@reduxjs/toolkit";


export interface PickState {
    pickForId: {
        summonerId: number,
        socketId: string
    },
    pickableChampIds: number[]
}

const initialState: PickState = {
    pickForId: {
        summonerId: -1,
        socketId: ""
    },
    pickableChampIds: []
}

const pickSlice = createSlice({
    initialState,
    name: "pick",
    reducers: {
        setPickFor: (state, action: PayloadAction<{summonerId: number, socketId: string}>) => {
            state.pickForId = action.payload
        },
        setPickableChamps: (state, action: PayloadAction<number[]>) => {
            state.pickableChampIds = action.payload
        }
    } 
})

export const {
    setPickFor,
    setPickableChamps
} = pickSlice.actions;
export default pickSlice.reducer;