import { createSlice, PayloadAction } from "@reduxjs/toolkit"

export interface SessionAction {
    actorCellId: number
    championId: number
    completed: boolean
    duration: number
    id: number
    isAllyAction: boolean
    isInProgress: boolean
    pickTurn: number
    type: "ban" | "pick" | "ten_bans_reveal" | string
}

export interface SessionState {
    actions: SessionAction[][]

    // // actions
    // // :
    // // [Array(1)]
    // allowBattleBoost: false
    // allowDuplicatePicks: false
    // allowLockedEvents: false
    // allowPlayerPickSameChampion: false
    // allowRerolling: false
    // allowSkinSelection: true
    // allowSubsetChampionPicks: false
    // // bans
    // // :
    // // {myTeamBans: Array(0), numBans: 0, theirTeamBans: Array(0)}
    // benchChampions: []
    // benchEnabled: false
    // boostableSkinCount: 0
    // // chatDetails
    // // :
    // // {mucJwtDto: {…}, multiUserChatId: '726b49aa-e914-47da-9248-607cdc2732e5', multiUserChatPassword: 'eyJraWQiOiIxIiwiYWxnIjoiUlMyNTYifQ.eyJ0Z3QiOiJldTE…x1fIZsk0Io8mQ-HYK1kGVPkIn9-T_YJnj-mAHkDIqzTmJVM1A'}
    // counter: 2
    // disallowBanningTeammateHoveredChampions: true
    // gameId: 7864517862
    // hasSimultaneousBans: true
    // hasSimultaneousPicks: true
    // id: "726b49aa-e914-47da-9248-607cdc2732e5"
    // isCustomGame: true
    // isLegacyChampSelect: false
    // isSpectating: false
    localPlayerCellId: number
    // lockedEventIndex: -1
    myTeam: {
        assignedPosition: string,
        championId: number,
        championPickIntent: number,
        summonerId: number
    }[]
    // // myTeam
    // // :
    // // [{…}]
    // pickOrderSwaps: []
    // positionSwaps: []
    // queueId: 3140
    // rerollsRemaining: 0
    // showQuitButton: true
    // skipChampionSelect: false
    // theirTeam: []
    // timer: {
    //     adjustedTimeLeftInPhase: 90000
    //     internalNowInEpochMs: 1779642498809
    //     isInfinite: false
    //     phase: "BAN_PICK"
    //     totalTimeInPhase: 90000
    // }
    // trades: []
}

const initialState: SessionState = {
    actions: [],
    localPlayerCellId: -1,
    myTeam: []
}

const sessionState = createSlice({
    initialState,
    name: "session",
    reducers: {
        setSession: (_state, action: PayloadAction<SessionState>) => {
            return action.payload
        },
        setSessionActions: (state, action: PayloadAction<SessionAction[][]>) => {
            state.actions = action.payload
        },
        setLocalPlayerCellId: (state, action: PayloadAction<number>) => {
            state.localPlayerCellId = action.payload
        }
    }
})

export const { setSessionActions, setSession, setLocalPlayerCellId } = sessionState.actions
export default sessionState.reducer
