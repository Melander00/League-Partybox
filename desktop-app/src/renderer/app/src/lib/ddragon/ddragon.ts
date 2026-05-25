import { ChampionInfo } from "@shared/types/lcu/lobby"

let version = "16.10.1"

export function setDDragonVersion(ver: string) {
    version = ver
}

const baseURL = new URL("https://ddragon.leagueoflegends.com/")

export async function loadDDragonVersion() {
    const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json")
    if(res.ok) {
        const json = await res.json()
        const ver = json[0]
        if(ver) {
            setDDragonVersion(ver)
            console.log("DDragon Version " + ver)
        }
    }
}


let championInfo: ChampionInfo[] = []
let championInfoPromise: Promise<ChampionInfo[]> | null = null

async function fetchChampionInfo(): Promise<ChampionInfo[]> {
    const url = new URL(`cdn/${version}/data/en_US/champion.json`, baseURL)
    const res = await fetch(url)

    if (!res.ok) return []

    const json = await res.json()
    return Object.values(json.data)
}

export async function getChampionInfo(): Promise<ChampionInfo[]> {
    if (championInfo.length > 0) {
        return championInfo
    }

    if (championInfoPromise) {
        return championInfoPromise
    }

    championInfoPromise = fetchChampionInfo()
        .then((info) => {
            championInfo = info
            championInfoPromise = null
            return info
        })
        .catch((err) => {
            championInfoPromise = null
            throw err
        })

    return championInfoPromise
}


export const summonerIcon = (icon: number) => new URL(`cdn/${version}/img/profileicon/${icon}.png`,baseURL).toString()
export const champIcon = (champ: ChampionInfo) => new URL(`cdn/${version}/img/${champ.image.group}/${champ.image.full}`, baseURL).toString()
