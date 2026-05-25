import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const temp = [
    1,
    10,
    101,
    102,
    103,
    106,
    11,
    111,
    113,
    122,
    13,
    134,
    14,
    15,
    154,
    16,
    163,
    164,
    18,
    19,
    20,
    201,
    203,
    21,
    22,
    222,
    223,
    233,
    245,
    25,
    26,
    27,
    30,
    31,
    32,
    33,
    350,
    36,
    37,
    4,
    41,
    412,
    45,
    48,
    498,
    5,
    516,
    518,
    54,
    57,
    63,
    67,
    68,
    711,
    72,
    75,
    777,
    78,
    800,
    804,
    82,
    86,
    875,
    888,
    89,
    893,
    895,
    897,
    9,
    902,
    904,
    92,
    96,
    99
]

export interface PickState {
    pickForId: {
        summonerId: number,
        socketId: string
    },
    pickableChampIds: number[]
}

const initialState: PickState = {
    pickForId: {
        // summonerId: 3684542063535424,
        summonerId: -1,
        socketId: ""
    },
    // pickableChampIds: temp // Todo: set this to empty array
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


