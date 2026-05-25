import { champIcon } from "@app/lib/ddragon/ddragon"
import { useAppSelector } from "@app/store/hooks"
import { ipcRenderer } from "@renderer/lib/ipcRenderer"
import { Channels } from "@shared/index"
import { ChampionInfo } from "@shared/types/lcu/lobby"
import { useMemo, useState } from "react"
import styles from "./champions.module.css"
import { useChampionInfoAll } from "./useChampionInfo"

export default function ChampionsView() {
    
    const pickableChamps = useAppSelector(state => state.pick.pickableChampIds)

    const isChampSelect = useAppSelector(state => state.gameflow.phase === "ChampSelect")

    const champInfo = useChampionInfoAll()

    const champInfoMap = useMemo(() => {
        if(!champInfo) return;
        const map = new Map<number, ChampionInfo>()
        for (const champ of champInfo) {
            map.set(parseInt(champ.key), champ)
        }
        return map
    }, [champInfo])

    const champions = useMemo(() => {
        if(!champInfoMap) return;
        return pickableChamps
            .map(id => ({
                id,
                info: champInfoMap.get(id)
            }))
            .filter(c => c.info) // remove missing
    }, [pickableChamps, champInfoMap])

    const sortedChampions = useMemo(() => {
        if(!champions) return;
        return [...champions].sort((a, b) =>
            a.info!.name.localeCompare(b.info!.name)
        )
    }, [champions])

    const [search, setSearch] = useState("")

    const filteredChampions = useMemo(() => {
        if(!sortedChampions) return [];
        return sortedChampions.filter(c =>
            c.info!.name.toLowerCase().includes(search.toLowerCase())
        )
    }, [sortedChampions, search])


    const target = useAppSelector(state => state.lobby.summoners[state.pick.pickForId.summonerId])

    const teamPlayer = useAppSelector(state => state.session.myTeam.find(e => e.summonerId === state.pick.pickForId.summonerId))

    if(!isChampSelect) return <></>



    return(
        <>

        <div className={styles.container}>

            <div className={styles.search}>

                <span>Pick for <b>{target?.gameName}</b></span>

                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search..."
                />
            </div>

            <div className={styles.list}>

                {filteredChampions.map(c => (
                    <Champion key={c.id} id={c.id} info={c.info!} selected={c.id === teamPlayer?.championPickIntent} />
                ))}

            </div>
        
        </div>
        </>
    )
}

type ChampionProps = {
    id: number
    info: ChampionInfo
    selected?: boolean
}

function Champion({
    id,
    info: champInfo,
    selected
}: ChampionProps) {

    const targetId = useAppSelector(state => state.pick.pickForId.socketId)

    const select = () => {
        ipcRenderer.send(Channels.PICK_CHAMP, {id, targetId})
    }

    return(
        <div onClick={select} className={[styles.champion, selected ? styles.selected : ""].join(" ")}>
            
            <img src={champIcon(champInfo)}/>

            <span>{champInfo.name}</span>
        </div>
    )
}