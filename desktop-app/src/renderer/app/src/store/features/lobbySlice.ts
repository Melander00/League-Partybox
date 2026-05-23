import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { ChampionInfo, LobbyMember, SummonerInfo } from "@shared/types/lcu/lobby"

export interface LobbyState {
    members: LobbyMember[],
    summoners: {[id: number]: SummonerInfo} 
    champions: {[id: number]: ChampionInfo[]} 
}

const initialState: LobbyState = {
    members: [
  {
    "allowedChangeActivity": false,
    "allowedInviteOthers": true,
    "allowedKickOthers": false,
    "allowedStartActivity": false,
    "allowedToggleInvite": false,
    "autoFillEligible": true,
    "autoFillProtectedForPromos": false,
    "autoFillProtectedForRemedy": false,
    "autoFillProtectedForSoloing": false,
    "autoFillProtectedForStreaking": false,
    "botChampionId": 0,
    "botDifficulty": "NONE",
    "botId": "",
    "botPosition": "NONE",
    "botUuid": "",
    "fifthPositionPreference": null,
    "firstPositionPreference": "FILL",
    "fourthPositionPreference": null,
    "intraSubteamPosition": null,
    "isBot": false,
    "isLeader": false,
    "isSpectator": false,
    "memberData": null,
    "playerSlots": [],
    "puuid": "33a0a1f6-d322-58f0-860b-60a9733df991",
    "ready": true,
    "secondPositionPreference": "UNSELECTED",
    "showGhostedBanner": false,
    "strawberryMapId": null,
    "subteamIndex": null,
    "summonerIconId": 6238,
    "summonerId": 3621574233163744,
    "summonerInternalName": "",
    "summonerLevel": 87,
    "summonerName": "",
    "teamId": 0,
    "thirdPositionPreference": null
  },
  {
    "allowedChangeActivity": true,
    "allowedInviteOthers": true,
    "allowedKickOthers": true,
    "allowedStartActivity": true,
    "allowedToggleInvite": true,
    "autoFillEligible": false,
    "autoFillProtectedForPromos": false,
    "autoFillProtectedForRemedy": false,
    "autoFillProtectedForSoloing": false,
    "autoFillProtectedForStreaking": false,
    "botChampionId": 0,
    "botDifficulty": "NONE",
    "botId": "",
    "botPosition": "NONE",
    "botUuid": "",
    "fifthPositionPreference": null,
    "firstPositionPreference": "MIDDLE",
    "fourthPositionPreference": null,
    "intraSubteamPosition": null,
    "isBot": false,
    "isLeader": true,
    "isSpectator": false,
    "memberData": null,
    "playerSlots": [],
    "puuid": "88d31be6-0cf2-578a-94f5-4bdffacd7f24",
    "ready": true,
    "secondPositionPreference": "TOP",
    "showGhostedBanner": false,
    "strawberryMapId": null,
    "subteamIndex": null,
    "summonerIconId": 6382,
    "summonerId": 3684542063535424,
    "summonerInternalName": "",
    "summonerLevel": 124,
    "summonerName": "",
    "teamId": 0,
    "thirdPositionPreference": null
  }
],
    summoners: {},
    champions: {}
}

export const lobbySlice = createSlice({
    name: "config",
    initialState,
    reducers: {
        setMembers: (state, action: PayloadAction<LobbyMember[]>) => {
            state.members = action.payload
        },
        setSummonerInfo: (state, action: PayloadAction<SummonerInfo>) => {
            state.summoners[action.payload.summonerId] = action.payload
        },
        setSummonerChampions: (state, action: PayloadAction<{champions: ChampionInfo[], summonerId: number}>) => {
            state.champions[action.payload.summonerId] = action.payload.champions
        }
    }
})

export const {
    setMembers,
    setSummonerInfo,
    setSummonerChampions,
} = lobbySlice.actions

export default lobbySlice.reducer