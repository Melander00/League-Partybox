import { useEffect } from "react"
import { loadDDragonVersion } from "./lib/ddragon/ddragon"
import { useLCU } from "./lib/lcu/useLCU"
import { setMembers } from "./store/features/lobbySlice"
import { useAppDispatch, useAppSelector } from "./store/hooks"
import NotificationsView from "./views/notifications/NotificationsView"
import { useNotifications } from "./views/notifications/useNotifications"

function App(): React.JSX.Element {

    const dispatch = useAppDispatch()

    useLCU("OnJsonApiEvent_lol-lobby_v2_lobby", (_ev, data) => {
        if(data.uri === "/lol-lobby/v2/lobby/members") {
            dispatch(setMembers(data.data))
        }
    })

    const { addNotification } = useNotifications()

    useEffect(() => {

        loadDDragonVersion().then(() => { addNotification("DDragon", "Loaded latest ddragon version.", "success") })
        

    }, [])

    const members = useAppSelector(state => state.lobby.members)

    return (
        <>
        
        <NotificationsView />
        <pre>{JSON.stringify(members, null, 2)}</pre>
        </>
    )
}

export default App
