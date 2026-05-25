import { getChampionInfo } from "@app/lib/ddragon/ddragon";
import { ChampionInfo } from "@shared/types/lcu/lobby";
import { useEffect, useState } from "react";

export function useChampionInfo(championId: number): ChampionInfo | undefined {

    const [championInfo, setChampionInfo] = useState<ChampionInfo | undefined>(undefined)

    useEffect(() => {

        let cancelled = false

        async function load() {
            const info = await getChampionInfo()
            const champ = info.find(e => e.key === championId.toString())

            if (!cancelled) {
                setChampionInfo(champ)
            }
        }

        load()

        return () => {
            cancelled = true
        }

    }, [championId])

    return championInfo
}


export function useChampionInfoAll(): ChampionInfo[] | undefined {

    const [championInfo, setChampionInfo] = useState<ChampionInfo[] | undefined>(undefined)

    useEffect(() => {

        let cancelled = false

        async function load() {
            const info = await getChampionInfo()

            if (!cancelled) {
                setChampionInfo(info)
            }
        }

        load()

        return () => {
            cancelled = true
        }

    }, [])

    return championInfo
}

