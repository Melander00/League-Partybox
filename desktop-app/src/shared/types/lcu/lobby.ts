export interface LobbyMember {
    allowedChangeActivity: boolean
    allowedInviteOthers: boolean
    allowedKickOthers: boolean
    allowedStartActivity: boolean
    allowedToggleInvite: boolean
    autoFillEligible: boolean
    autoFillProtectedForPromos: boolean
    autoFillProtectedForRemedy: boolean
    autoFillProtectedForSoloing: boolean
    autoFillProtectedForStreaking: boolean
    botChampionId: number
    botDifficulty: string
    botId: string
    botPosition: string
    botUuid: string
    fifthPositionPreference: any
    firstPositionPreference: string
    fourthPositionPreference: any
    intraSubteamPosition: any
    isBot: boolean
    isLeader: boolean
    isSpectator: boolean
    memberData: any
    playerSlots: any[]
    puuid: string
    ready: boolean
    secondPositionPreference: string
    showGhostedBanner: boolean
    strawberryMapId: any
    subteamIndex: any
    summonerIconId: number
    summonerId: number
    summonerInternalName: string
    summonerLevel: number
    summonerName: string
    teamId: number
    thirdPositionPreference: any
}

export interface SummonerInfo {
    accountId: number
    displayName: string
    gameName: string
    internalName: string
    nameChangeFlag: boolean
    percentCompleteForNextLevel: number
    privacy: string
    profileIconId: number
    puuid: string
    rerollPoints: {
        currentPoints: number
        maxRolls: number
        numberOfRolls: number
        pointsCostToRoll: number
        pointsToReroll: number
    }
    summonerId: number
    summonerLevel: number
    tagLine: string
    unnamed: boolean
    xpSinceLastLevel: number
    xpUntilNextLevel: number
}

export interface ChampionInfo {}

export interface LobbyMemberStatus {
    ping: number
    connected: boolean
}


