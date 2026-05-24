import { ipcRenderer } from "@renderer/lib/ipcRenderer"
import { useIpc } from "@renderer/lib/useIpc"
import { Channels, Phase } from "@shared/index"
import { useEffect } from "react"
import styles from "./app.module.css"
import { loadDDragonVersion } from "./lib/ddragon/ddragon"
import { cacheGetRequest, request } from "./lib/lcu/lcu"
import { useLCU } from "./lib/lcu/useLCU"
import { setPhase } from "./store/features/gameflowSlice"
import { setMembers, setMyId, setStatus } from "./store/features/lobbySlice"
import { setPickableChamps, setPickFor } from "./store/features/pickSlice"
import { setSession } from "./store/features/sessionSlice"
import { useAppDispatch } from "./store/hooks"
import { store } from "./store/store"
import ChampionsView from "./views/champions/ChampionsView"
import LobbyView from "./views/lobby/LobbyView"
import NotificationsView from "./views/notifications/NotificationsView"
import { useNotifications } from "./views/notifications/useNotifications"

function App(): React.JSX.Element {

    const dispatch = useAppDispatch()

    // useLCU("On")

    useLCU("OnJsonApiEvent_lol-gameflow_v1_gameflow-phase", (_ev, data: {data: Phase}) => {

        dispatch(setPhase(data.data))

        addNotification("phase", data.data, "info")

        ipcRenderer.send(Channels.PHASE, data.data)

        if(data.data === "ChampSelect") {
            // Race condition for non-matchmaking lobbies
            setTimeout(() => {
                const state = store.getState()
                const forId = state.pick.pickForId.summonerId
                
                console.log(forId)
                
                if(forId !== -1) {
                    ipcRenderer.send(Channels.GET_PICKABLE_CHAMPS, forId)
                }
            }, 2000)
        }

    })

    useLCU("OnJsonApiEvent_lol-lobby_v2_lobby", (_ev, data) => {
        
        if(data.uri === "/lol-lobby/v2/lobby/members") {
            dispatch(setMembers(data.data))
            return;
        }
        
        if(data.uri === "/lol-lobby/v2/lobby") {
            if(data.eventType === "Delete") {
                dispatch(setMembers([]))
                return;
            }
            
            if(data.eventType === "Update") {
                console.log(data)
                ipcRenderer.send(Channels.SET_PARTY_ID, data.data.partyId)
            }
        }
    })

    useLCU("OnJsonApiEvent_lol-champ-select_v1_session", (_ev, data) => {

        dispatch(setSession(data.data))

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

    useIpc(Channels.YOU_PICK_FOR, (_ev, {summonerId, socketId}) => {
        dispatch(setPickFor({summonerId, socketId}))
    }) 

    useIpc(Channels.PICKABLE_CHAMP_IDS, (_ev, data) => {
        console.log(data)
        dispatch(setPickableChamps(data.ids))
    })

    useIpc(Channels.GOT_PICK_CHAMP, (_ev, championId) => {
        const state = store.getState()

        const myActions = state.session.actions.filter(e => 
            e[0].actorCellId === state.session.localPlayerCellId &&
            !e[0].completed && e[0].type === "pick"
        )[0]

        if(myActions.length === 0) return;

        const myTurn = myActions[0]

        request({
            method: "PATCH",
            endpoint: `/lol-champ-select/v1/session/actions/${myTurn.id}`,
            data: {
                championId: championId
            }
        })

        
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
                <ChampionsView/>
            </div>

        </div>
        </>
    )
}

export default App
