import { ipcRenderer } from "@renderer/lib/ipcRenderer"
import { useIpc } from "@renderer/lib/useIpc"
import { Channels } from "@shared/index"
import { useEffect } from "react"
import styles from "./app.module.css"
import { loadDDragonVersion } from "./lib/ddragon/ddragon"
import { cacheGetRequest } from "./lib/lcu/lcu"
import { useLCU } from "./lib/lcu/useLCU"
import { setPhase } from "./store/features/gameflowSlice"
import { setMembers, setMyId, setStatus } from "./store/features/lobbySlice"
import { useAppDispatch } from "./store/hooks"
import LobbyView from "./views/lobby/LobbyView"
import NotificationsView from "./views/notifications/NotificationsView"
import { useNotifications } from "./views/notifications/useNotifications"

function App(): React.JSX.Element {

    const dispatch = useAppDispatch()

    // useLCU("On")

    useLCU("OnJsonApiEvent_lol-gameflow_v1_gameflow-phase", (_ev, data) => {

        dispatch(setPhase(data.data))

        addNotification("phase", data.data, "info")

    })

    useLCU("OnJsonApiEvent_lol-lobby_v2_lobby", (_ev, data) => {
        // console.log(data)

        if(data.uri === "/lol-lobby/v2/lobby/members" && data.eventType === "Update") {
            dispatch(setMembers(data.data))
            return;
        }

        if(data.uri === "/lol-lobby/v2/lobby") {
            if(data.eventType === "Delete") {
                dispatch(setMembers([]))
                return;
            }

            if(data.eventType === "Update") {
                ipcRenderer.send(Channels.SET_PARTY_ID, data.data.partyId)
            }
        }
    })

    useLCU("OnJsonApiEvent_lol-champ-select_v1_session", (_ev, data) => {
        console.log(data)
    })

    useIpc(Channels.PING, (_ev, data) => {
        dispatch(setStatus({
            summonerId: data.id,
            status: {
                ping: data.ping,
                connected: true
            }
        }))
    })

    const { addNotification } = useNotifications()

    useEffect(() => {
        loadDDragonVersion().then(() => { addNotification("DDragon", "Loaded latest ddragon version.", "success") })
        cacheGetRequest("/lol-summoner/v1/current-summoner/account-and-summoner-ids").then(data => {
            dispatch(setMyId(data.summonerId))
        })
    }, [])


    return (
        <>
        <NotificationsView />

        <div className={styles.container}>

            <div>
                <LobbyView/>
            </div>

        </div>
        </>
    )
}

export default App
