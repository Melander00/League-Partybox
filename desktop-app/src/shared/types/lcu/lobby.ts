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

export interface ChampionInfo {
    id: string,
    key: string,
    name: string,
    title: string,
    blurb: string,
    info: {
        attack: number,
        defense: number,
        magic: number,
        difficulty: number,
    },
    image: {
        full: string,
        sprite: string,
        group: string,
        x: number,
        y: number,
        w: number,
        h: number,
    },
    tags: string[],
    partype: string,
    stats: {
        hp: number,
        hpperlevel: number,
        mp: number,
        mpperlevel: number,
        movespeed: number,
        armor: number,
        armorperlevel: number,
        spellblock: number,
        spellblockperlevel: number,
        attackrange: number,
        hpregen: number,
        hpregenperlevel: number,
        mpregen: number,
        mpregenperlevel: number,
        crit: number,
        critperlevel: number,
        attackdamage: number,
        attackdamageperlevel: number,
        attackspeedperlevel: number,
        attackspeed: number,
    }
}

export interface LobbyMemberStatus {
    ping: number
    connected: boolean
}


