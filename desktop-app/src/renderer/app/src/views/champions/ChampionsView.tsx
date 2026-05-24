import { useAppSelector } from "@app/store/hooks"
import { ipcRenderer } from "@renderer/lib/ipcRenderer"
import { Channels } from "@shared/index"
import styles from "./champions.module.css"

export default function ChampionsView() {
    
    const pickableChamps = useAppSelector(state => state.pick.pickableChampIds)

    const isChampSelect = useAppSelector(state => state.gameflow.phase === "ChampSelect")


    if(!isChampSelect) return <><h1>Not champ select</h1></>

    return(
        <>
        
        <div className={styles.container}>

            {pickableChamps.map(e => <Champion id={e} key={e} />)}

        </div>
        
        </>
    )
}

type ChampionProps = {
    id: number
}

function Champion({
    id
}: ChampionProps) {

    const targetId = useAppSelector(state => state.pick.pickForId.socketId)

    const select = () => {
        ipcRenderer.send(Channels.PICK_CHAMP, {id, targetId})
    }

    return(
        <div onClick={select}>
            <span>{id}</span>
        </div>
    )
}