import { ipcRenderer } from "@renderer/lib/ipcRenderer"
import { Channels } from "@shared/index"
import { useEffect } from "react"
import styles from "./app.module.css"
import { loadDDragonVersion } from "./lib/ddragon/ddragon"
import { useLCU } from "./lib/lcu/useLCU"
import { setMembers } from "./store/features/lobbySlice"
import { useAppDispatch } from "./store/hooks"
import LobbyView from "./views/lobby/LobbyView"
import NotificationsView from "./views/notifications/NotificationsView"
import { useNotifications } from "./views/notifications/useNotifications"

function App(): React.JSX.Element {

    const dispatch = useAppDispatch()

    useLCU("OnJsonApiEvent_lol-lobby_v2_lobby", (_ev, data) => {
        console.log(data)

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

    const { addNotification } = useNotifications()

    useEffect(() => {
        loadDDragonVersion().then(() => { addNotification("DDragon", "Loaded latest ddragon version.", "success") })
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
