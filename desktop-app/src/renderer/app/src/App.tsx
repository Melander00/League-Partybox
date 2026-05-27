import { ipcRenderer } from "@renderer/lib/ipcRenderer"
import { useIpc } from "@renderer/lib/useIpc"
import { Channels, Phase } from "@shared/index"
import { useEffect } from "react"
import { ErrorBoundary } from "react-error-boundary"
import styles from "./app.module.css"
import { loadDDragonVersion } from "./lib/ddragon/ddragon"
import { cacheGetRequest, request } from "./lib/lcu/lcu"
import { useLCU } from "./lib/lcu/useLCU"
import { setPhase } from "./store/features/gameflowSlice"
import { setMembers, setMyId, setStatus } from "./store/features/lobbySlice"
import { resetPickState, setPickableChamps, setPickFor } from "./store/features/pickSlice"
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
        dispatch(setPickableChamps(data))
    })

    useIpc(Channels.RESET_MATCH, () => {
        dispatch(resetPickState())
    })

    useIpc(Channels.GOT_PICK_CHAMP, (_ev, championId) => {
        addNotification("champ", "You received a champion pick", "info")

        const state = store.getState()

        const myActions = state.session.actions.filter(e => {
            
            for(const turn of e) {
                if(
                    turn.actorCellId === state.session.localPlayerCellId &&
                    !turn.completed && turn.type === "pick"
                ) {
                    return true;
                }
            }
            return false                
        })
        
        if(myActions.length === 0) {
            console.error("Actions was length zero", state.session)
            return
        }
        
        const myAction = myActions[0]
        
        if(myAction.length === 0) {
            
            console.error("You actions was length zero", state.session)
            return
        }

        const myTurn = myAction.find(turn =>
            turn.actorCellId === state.session.localPlayerCellId &&
            !turn.completed &&
            turn.type === "pick"
        )

        if (!myTurn) {
            console.error("No valid turn found", myAction)
            return
        }

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
            <ErrorBoundary fallbackRender={error => (<>
                <span>Error occured in lobby</span>
                <pre>{JSON.stringify(error.error, null, 2)}</pre>
            </>)}>
                <LobbyView/>
            </ErrorBoundary>
            <ErrorBoundary fallbackRender={error => (<>
                <span>Error occured in champ select</span>
                <pre>{JSON.stringify(error.error, null, 2)}</pre>
            </>)}>
                <ChampionsView/>
            </ErrorBoundary>
        </div>
        </>
    )
}

export default App


/*

det är bara en person som kan välja åt någon annan

kolla bans så man inte kan välja dem


när petter försöker välja åt mig: i renderer
VM24 node:events:519 Uncaught Error: Cannot read properties of undefined (reading 'length')
    at IpcRenderer.emit (VM24 node:events:519:28)
    at Object.onMessage (VM117 renderer_init:2:13457)



onMessage verkar vara från receive from socket
ipcRenderer emit



{
    "data": {
        "actions": [
            [
                {
                    "actorCellId": 0,
                    "championId": 950,
                    "completed": true,
                    "duration": 0,
                    "id": 0,
                    "isAllyAction": true,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ban"
                },
                {
                    "actorCellId": 1,
                    "championId": 53,
                    "completed": true,
                    "duration": 0,
                    "id": 1,
                    "isAllyAction": true,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ban"
                },
                {
                    "actorCellId": 2,
                    "championId": 35,
                    "completed": true,
                    "duration": 0,
                    "id": 2,
                    "isAllyAction": true,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ban"
                },
                {
                    "actorCellId": 3,
                    "championId": 24,
                    "completed": true,
                    "duration": 0,
                    "id": 3,
                    "isAllyAction": true,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ban"
                },
                {
                    "actorCellId": 4,
                    "championId": 21,
                    "completed": true,
                    "duration": 0,
                    "id": 4,
                    "isAllyAction": true,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ban"
                },
                {
                    "actorCellId": 5,
                    "championId": 950,
                    "completed": true,
                    "duration": 0,
                    "id": 5,
                    "isAllyAction": false,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ban"
                },
                {
                    "actorCellId": 6,
                    "championId": 25,
                    "completed": true,
                    "duration": 0,
                    "id": 6,
                    "isAllyAction": false,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ban"
                },
                {
                    "actorCellId": 7,
                    "championId": 266,
                    "completed": true,
                    "duration": 0,
                    "id": 7,
                    "isAllyAction": false,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ban"
                },
                {
                    "actorCellId": 8,
                    "championId": 875,
                    "completed": true,
                    "duration": 0,
                    "id": 8,
                    "isAllyAction": false,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ban"
                },
                {
                    "actorCellId": 9,
                    "championId": 55,
                    "completed": true,
                    "duration": 0,
                    "id": 9,
                    "isAllyAction": false,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ban"
                }
            ],
            [
                {
                    "actorCellId": -1,
                    "championId": 0,
                    "completed": true,
                    "duration": 0,
                    "id": 100,
                    "isAllyAction": false,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ten_bans_reveal"
                }
            ],
            [
                {
                    "actorCellId": 0,
                    "championId": 147,
                    "completed": true,
                    "duration": 0,
                    "id": 10,
                    "isAllyAction": true,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "pick"
                }
            ],
            [
                {
                    "actorCellId": 5,
                    "championId": 0,
                    "completed": false,
                    "duration": 0,
                    "id": 11,
                    "isAllyAction": false,
                    "isInProgress": true,
                    "pickTurn": 0,
                    "type": "pick"
                },
                {
                    "actorCellId": 6,
                    "championId": 0,
                    "completed": false,
                    "duration": 0,
                    "id": 12,
                    "isAllyAction": false,
                    "isInProgress": true,
                    "pickTurn": 0,
                    "type": "pick"
                }
            ],
            [
                {
                    "actorCellId": 1,
                    "championId": 0,
                    "completed": false,
                    "duration": 0,
                    "id": 13,
                    "isAllyAction": true,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "pick"
                },
                {
                    "actorCellId": 2,
                    "championId": 0,
                    "completed": false,
                    "duration": 0,
                    "id": 14,
                    "isAllyAction": true,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "pick"
                }
            ],
            [
                {
                    "actorCellId": 7,
                    "championId": 0,
                    "completed": false,
                    "duration": 0,
                    "id": 15,
                    "isAllyAction": false,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "pick"
                },
                {
                    "actorCellId": 8,
                    "championId": 0,
                    "completed": false,
                    "duration": 0,
                    "id": 16,
                    "isAllyAction": false,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "pick"
                }
            ],
            [
                {
                    "actorCellId": 3,
                    "championId": 32,
                    "completed": false,
                    "duration": 0,
                    "id": 17,
                    "isAllyAction": true,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "pick"
                },
                {
                    "actorCellId": 4,
                    "championId": 0,
                    "completed": false,
                    "duration": 0,
                    "id": 18,
                    "isAllyAction": true,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "pick"
                }
            ],
            [
                {
                    "actorCellId": 9,
                    "championId": 0,
                    "completed": false,
                    "duration": 0,
                    "id": 19,
                    "isAllyAction": false,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "pick"
                }
            ]
        ],
        "allowBattleBoost": false,
        "allowDuplicatePicks": false,
        "allowLockedEvents": false,
        "allowPlayerPickSameChampion": false,
        "allowRerolling": false,
        "allowSkinSelection": true,
        "allowSubsetChampionPicks": false,
        "bans": {
            "myTeamBans": [],
            "numBans": 0,
            "theirTeamBans": []
        },
        "benchChampions": [],
        "benchEnabled": false,
        "boostableSkinCount": 0,
        "chatDetails": {
            "mucJwtDto": {
                "channelClaim": "0d564f96-90db-480a-bc98-59b23e566d2b",
                "domain": "lol-champ-select",
                "jwt": "eyJraWQiOiIxIiwiYWxnIjoiUlMyNTYifQ.eyJ0Z3QiOiJldTEiLCJzdWIiOiIzM2EwYTFmNi1kMzIyLTU4ZjAtODYwYi02MGE5NzMzZGY5OTEiLCJtZXRhZGF0YSI6eyJnYW1lSWQiOiI3ODY2OTEzNDUyIiwicmVnaW9uIjoiRVVXMSIsImxvYmJ5VHlwZSI6InByZS1nYW1lIiwicHJvZHVjdCI6ImxvbCJ9LCJpc3MiOiJsb2wtdGVhbWJ1aWxkZXIiLCJjaG4iOiIwZDU2NGY5Ni05MGRiLTQ4MGEtYmM5OC01OWIyM2U1NjZkMmIiLCJ0eXAiOiJsb2wtY2hhbXAtc2VsZWN0IiwiZXhwIjoxNzc5ODI1MzEyLCJpYXQiOjE3Nzk4MjQ3MTIsImp0aSI6IjEwOTVlZDdiLTMxMzYtNDYxMS1iZDk0LTU2ZDhkZWJiOTY0MyIsImNybSI6IjBkNTY0Zjk2LTkwZGItNDgwYS1iYzk4LTU5YjIzZTU2NmQyYkBsb2wtY2hhbXAtc2VsZWN0LnB2cC5uZXQifQ.GKlQN_CbHbAZAqXCK1YYbKOIHfeLZef4HigdggPZaPZxlD-VeHybE03yjkq9rbqpQdjteUBJ8FMyZHv1LilXRaVuoXod-XT0abprOEueOkIriFMZDVQQozij0Nw34lQ9Ztbv2OfpIturAgcuXmE9Nx4ZIbpXzvVgLicKj-M64zaLN-TD_9CiKi1BhMEAYRQsY2Z6dNEvIb0uCH41ZZlQJtUPTGqXt1ReGYFlXM8ZtxbeTt_I32SaYgvGR5NXW0pb0ldVdizx7i4NW6i8JaVf4QEoqqD9XM8ZRyepitFk5BbwBM_CN8xKx72qlJSXp6m_qDbmY4km1GKA0nDt6hr-zw",
                "targetRegion": "eu1"
            },
            "multiUserChatId": "0d564f96-90db-480a-bc98-59b23e566d2b",
            "multiUserChatPassword": "eyJraWQiOiIxIiwiYWxnIjoiUlMyNTYifQ.eyJ0Z3QiOiJldTEiLCJzdWIiOiIzM2EwYTFmNi1kMzIyLTU4ZjAtODYwYi02MGE5NzMzZGY5OTEiLCJtZXRhZGF0YSI6eyJnYW1lSWQiOiI3ODY2OTEzNDUyIiwicmVnaW9uIjoiRVVXMSIsImxvYmJ5VHlwZSI6InByZS1nYW1lIiwicHJvZHVjdCI6ImxvbCJ9LCJpc3MiOiJsb2wtdGVhbWJ1aWxkZXIiLCJjaG4iOiIwZDU2NGY5Ni05MGRiLTQ4MGEtYmM5OC01OWIyM2U1NjZkMmIiLCJ0eXAiOiJsb2wtY2hhbXAtc2VsZWN0IiwiZXhwIjoxNzc5ODI1MzEyLCJpYXQiOjE3Nzk4MjQ3MTIsImp0aSI6IjEwOTVlZDdiLTMxMzYtNDYxMS1iZDk0LTU2ZDhkZWJiOTY0MyIsImNybSI6IjBkNTY0Zjk2LTkwZGItNDgwYS1iYzk4LTU5YjIzZTU2NmQyYkBsb2wtY2hhbXAtc2VsZWN0LnB2cC5uZXQifQ.GKlQN_CbHbAZAqXCK1YYbKOIHfeLZef4HigdggPZaPZxlD-VeHybE03yjkq9rbqpQdjteUBJ8FMyZHv1LilXRaVuoXod-XT0abprOEueOkIriFMZDVQQozij0Nw34lQ9Ztbv2OfpIturAgcuXmE9Nx4ZIbpXzvVgLicKj-M64zaLN-TD_9CiKi1BhMEAYRQsY2Z6dNEvIb0uCH41ZZlQJtUPTGqXt1ReGYFlXM8ZtxbeTt_I32SaYgvGR5NXW0pb0ldVdizx7i4NW6i8JaVf4QEoqqD9XM8ZRyepitFk5BbwBM_CN8xKx72qlJSXp6m_qDbmY4km1GKA0nDt6hr-zw"
        },
        "counter": 37,
        "disallowBanningTeammateHoveredChampions": true,
        "gameId": 7866913452,
        "hasSimultaneousBans": true,
        "hasSimultaneousPicks": false,
        "id": "0d564f96-90db-480a-bc98-59b23e566d2b",
        "isCustomGame": false,
        "isLegacyChampSelect": false,
        "isSpectating": false,
        "localPlayerCellId": 3,
        "lockedEventIndex": -1,
        "myTeam": [
            {
                "assignedPosition": "utility",
                "cellId": 0,
                "championId": 147,
                "championPickIntent": 0,
                "gameName": "Lockkis",
                "internalName": "",
                "isAutofilled": false,
                "isHumanoid": false,
                "nameVisibilityType": "VISIBLE",
                "obfuscatedPuuid": "",
                "obfuscatedSummonerId": 0,
                "pickMode": 0,
                "pickTurn": 0,
                "playerAlias": "",
                "playerType": "",
                "puuid": "4bf85059-2419-5b64-8941-2d6e24bfc54b",
                "selectedSkinId": 147041,
                "spell1Id": 4,
                "spell2Id": 7,
                "summonerId": 3139690870261632,
                "tagLine": "EUW",
                "team": 1,
                "wardSkinId": -1
            },
            {
                "assignedPosition": "middle",
                "cellId": 1,
                "championId": 0,
                "championPickIntent": 0,
                "gameName": "III00IIII",
                "internalName": "",
                "isAutofilled": false,
                "isHumanoid": false,
                "nameVisibilityType": "VISIBLE",
                "obfuscatedPuuid": "",
                "obfuscatedSummonerId": 0,
                "pickMode": 0,
                "pickTurn": 0,
                "playerAlias": "",
                "playerType": "",
                "puuid": "45ced7f4-6085-5f91-9ef6-b557d4b94a08",
                "selectedSkinId": 0,
                "spell1Id": 4,
                "spell2Id": 6,
                "summonerId": 3220199588849472,
                "tagLine": "EUW",
                "team": 1,
                "wardSkinId": -1
            },
            {
                "assignedPosition": "jungle",
                "cellId": 2,
                "championId": 0,
                "championPickIntent": 0,
                "gameName": "TheLazyTurtle",
                "internalName": "",
                "isAutofilled": false,
                "isHumanoid": false,
                "nameVisibilityType": "VISIBLE",
                "obfuscatedPuuid": "",
                "obfuscatedSummonerId": 0,
                "pickMode": 0,
                "pickTurn": 0,
                "playerAlias": "",
                "playerType": "",
                "puuid": "939f7578-a65d-5879-aa5b-a016f4c76f0b",
                "selectedSkinId": 0,
                "spell1Id": 11,
                "spell2Id": 4,
                "summonerId": 3543468602483840,
                "tagLine": "1337",
                "team": 1,
                "wardSkinId": -1
            },
            {
                "assignedPosition": "top",
                "cellId": 3,
                "championId": 0,
                "championPickIntent": 32,
                "gameName": "Melander00",
                "internalName": "",
                "isAutofilled": false,
                "isHumanoid": false,
                "nameVisibilityType": "VISIBLE",
                "obfuscatedPuuid": "",
                "obfuscatedSummonerId": 0,
                "pickMode": 0,
                "pickTurn": 0,
                "playerAlias": "",
                "playerType": "",
                "puuid": "33a0a1f6-d322-58f0-860b-60a9733df991",
                "selectedSkinId": 0,
                "spell1Id": 6,
                "spell2Id": 4,
                "summonerId": 3621574233163744,
                "tagLine": "1337",
                "team": 1,
                "wardSkinId": -1
            },
            {
                "assignedPosition": "bottom",
                "cellId": 4,
                "championId": 0,
                "championPickIntent": 0,
                "gameName": "king its here",
                "internalName": "",
                "isAutofilled": false,
                "isHumanoid": false,
                "nameVisibilityType": "VISIBLE",
                "obfuscatedPuuid": "",
                "obfuscatedSummonerId": 0,
                "pickMode": 0,
                "pickTurn": 0,
                "playerAlias": "",
                "playerType": "",
                "puuid": "88d31be6-0cf2-578a-94f5-4bdffacd7f24",
                "selectedSkinId": 0,
                "spell1Id": 14,
                "spell2Id": 4,
                "summonerId": 3684542063535424,
                "tagLine": "1337",
                "team": 1,
                "wardSkinId": -1
            }
        ],
        "pickOrderSwaps": [
            {
                "cellId": 4,
                "id": 5,
                "state": "AVAILABLE"
            },
            {
                "cellId": 2,
                "id": 7,
                "state": "AVAILABLE"
            },
            {
                "cellId": 1,
                "id": 24,
                "state": "AVAILABLE"
            },
            {
                "cellId": 0,
                "id": 25,
                "state": "AVAILABLE"
            }
        ],
        "positionSwaps": [
            {
                "cellId": 1,
                "id": 4,
                "state": "AVAILABLE"
            },
            {
                "cellId": 4,
                "id": 5,
                "state": "AVAILABLE"
            },
            {
                "cellId": 0,
                "id": 6,
                "state": "AVAILABLE"
            },
            {
                "cellId": 2,
                "id": 7,
                "state": "AVAILABLE"
            }
        ],
        "queueId": 400,
        "rerollsRemaining": 0,
        "showQuitButton": false,
        "skipChampionSelect": false,
        "theirTeam": [
            {
                "assignedPosition": "",
                "cellId": 5,
                "championId": 0,
                "championPickIntent": 0,
                "gameName": "",
                "internalName": "",
                "isAutofilled": false,
                "isHumanoid": false,
                "nameVisibilityType": "HIDDEN",
                "obfuscatedPuuid": "",
                "obfuscatedSummonerId": 0,
                "pickMode": 0,
                "pickTurn": 0,
                "playerAlias": "",
                "playerType": "",
                "puuid": "",
                "selectedSkinId": 0,
                "spell1Id": 0,
                "spell2Id": 0,
                "summonerId": 0,
                "tagLine": "",
                "team": 2,
                "wardSkinId": -1
            },
            {
                "assignedPosition": "",
                "cellId": 6,
                "championId": 0,
                "championPickIntent": 0,
                "gameName": "",
                "internalName": "",
                "isAutofilled": false,
                "isHumanoid": false,
                "nameVisibilityType": "HIDDEN",
                "obfuscatedPuuid": "",
                "obfuscatedSummonerId": 0,
                "pickMode": 0,
                "pickTurn": 0,
                "playerAlias": "",
                "playerType": "",
                "puuid": "",
                "selectedSkinId": 0,
                "spell1Id": 0,
                "spell2Id": 0,
                "summonerId": 0,
                "tagLine": "",
                "team": 2,
                "wardSkinId": -1
            },
            {
                "assignedPosition": "",
                "cellId": 7,
                "championId": 0,
                "championPickIntent": 0,
                "gameName": "",
                "internalName": "",
                "isAutofilled": false,
                "isHumanoid": false,
                "nameVisibilityType": "HIDDEN",
                "obfuscatedPuuid": "",
                "obfuscatedSummonerId": 0,
                "pickMode": 0,
                "pickTurn": 0,
                "playerAlias": "",
                "playerType": "",
                "puuid": "",
                "selectedSkinId": 0,
                "spell1Id": 0,
                "spell2Id": 0,
                "summonerId": 0,
                "tagLine": "",
                "team": 2,
                "wardSkinId": -1
            },
            {
                "assignedPosition": "",
                "cellId": 8,
                "championId": 0,
                "championPickIntent": 0,
                "gameName": "",
                "internalName": "",
                "isAutofilled": false,
                "isHumanoid": false,
                "nameVisibilityType": "HIDDEN",
                "obfuscatedPuuid": "",
                "obfuscatedSummonerId": 0,
                "pickMode": 0,
                "pickTurn": 0,
                "playerAlias": "",
                "playerType": "",
                "puuid": "",
                "selectedSkinId": 0,
                "spell1Id": 0,
                "spell2Id": 0,
                "summonerId": 0,
                "tagLine": "",
                "team": 2,
                "wardSkinId": -1
            },
            {
                "assignedPosition": "",
                "cellId": 9,
                "championId": 0,
                "championPickIntent": 0,
                "gameName": "",
                "internalName": "",
                "isAutofilled": false,
                "isHumanoid": false,
                "nameVisibilityType": "HIDDEN",
                "obfuscatedPuuid": "",
                "obfuscatedSummonerId": 0,
                "pickMode": 0,
                "pickTurn": 0,
                "playerAlias": "",
                "playerType": "",
                "puuid": "",
                "selectedSkinId": 0,
                "spell1Id": 0,
                "spell2Id": 0,
                "summonerId": 0,
                "tagLine": "",
                "team": 2,
                "wardSkinId": -1
            }
        ],
        "timer": {
            "adjustedTimeLeftInPhase": 25000,
            "internalNowInEpochMs": 1779824760068,
            "isInfinite": false,
            "phase": "BAN_PICK",
            "totalTimeInPhase": 25000
        },
        "trades": [
            {
                "cellId": 1,
                "id": 4,
                "state": "INVALID"
            },
            {
                "cellId": 4,
                "id": 5,
                "state": "INVALID"
            },
            {
                "cellId": 2,
                "id": 7,
                "state": "INVALID"
            },
            {
                "cellId": 0,
                "id": 21,
                "state": "INVALID"
            }
        ]
    },
    "eventType": "Update",
    "uri": "/lol-champ-select/v1/session"
}




{
    "data": {
        "actions": [
            [
                {
                    "actorCellId": 0,
                    "championId": 950,
                    "completed": true,
                    "duration": 0,
                    "id": 0,
                    "isAllyAction": true,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ban"
                },
                {
                    "actorCellId": 1,
                    "championId": 53,
                    "completed": true,
                    "duration": 0,
                    "id": 1,
                    "isAllyAction": true,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ban"
                },
                {
                    "actorCellId": 2,
                    "championId": 35,
                    "completed": true,
                    "duration": 0,
                    "id": 2,
                    "isAllyAction": true,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ban"
                },
                {
                    "actorCellId": 3,
                    "championId": 24,
                    "completed": true,
                    "duration": 0,
                    "id": 3,
                    "isAllyAction": true,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ban"
                },
                {
                    "actorCellId": 4,
                    "championId": 21,
                    "completed": true,
                    "duration": 0,
                    "id": 4,
                    "isAllyAction": true,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ban"
                },
                {
                    "actorCellId": 5,
                    "championId": 950,
                    "completed": true,
                    "duration": 0,
                    "id": 5,
                    "isAllyAction": false,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ban"
                },
                {
                    "actorCellId": 6,
                    "championId": 25,
                    "completed": true,
                    "duration": 0,
                    "id": 6,
                    "isAllyAction": false,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ban"
                },
                {
                    "actorCellId": 7,
                    "championId": 266,
                    "completed": true,
                    "duration": 0,
                    "id": 7,
                    "isAllyAction": false,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ban"
                },
                {
                    "actorCellId": 8,
                    "championId": 875,
                    "completed": true,
                    "duration": 0,
                    "id": 8,
                    "isAllyAction": false,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ban"
                },
                {
                    "actorCellId": 9,
                    "championId": 55,
                    "completed": true,
                    "duration": 0,
                    "id": 9,
                    "isAllyAction": false,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ban"
                }
            ],
            [
                {
                    "actorCellId": -1,
                    "championId": 0,
                    "completed": true,
                    "duration": 0,
                    "id": 100,
                    "isAllyAction": false,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "ten_bans_reveal"
                }
            ],
            [
                {
                    "actorCellId": 0,
                    "championId": 147,
                    "completed": true,
                    "duration": 0,
                    "id": 10,
                    "isAllyAction": true,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "pick"
                }
            ],
            [
                {
                    "actorCellId": 5,
                    "championId": 238,
                    "completed": true,
                    "duration": 0,
                    "id": 11,
                    "isAllyAction": false,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "pick"
                },
                {
                    "actorCellId": 6,
                    "championId": 37,
                    "completed": true,
                    "duration": 0,
                    "id": 12,
                    "isAllyAction": false,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "pick"
                }
            ],
            [
                {
                    "actorCellId": 1,
                    "championId": 910,
                    "completed": true,
                    "duration": 0,
                    "id": 13,
                    "isAllyAction": true,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "pick"
                },
                {
                    "actorCellId": 2,
                    "championId": 904,
                    "completed": true,
                    "duration": 0,
                    "id": 14,
                    "isAllyAction": true,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "pick"
                }
            ],
            [
                {
                    "actorCellId": 7,
                    "championId": 91,
                    "completed": true,
                    "duration": 0,
                    "id": 15,
                    "isAllyAction": false,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "pick"
                },
                {
                    "actorCellId": 8,
                    "championId": 800,
                    "completed": true,
                    "duration": 0,
                    "id": 16,
                    "isAllyAction": false,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "pick"
                }
            ],
            [
                {
                    "actorCellId": 3,
                    "championId": 78,
                    "completed": true,
                    "duration": 0,
                    "id": 17,
                    "isAllyAction": true,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "pick"
                },
                {
                    "actorCellId": 4,
                    "championId": 523,
                    "completed": true,
                    "duration": 0,
                    "id": 18,
                    "isAllyAction": true,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "pick"
                }
            ],
            [
                {
                    "actorCellId": 9,
                    "championId": 223,
                    "completed": true,
                    "duration": 0,
                    "id": 19,
                    "isAllyAction": false,
                    "isInProgress": false,
                    "pickTurn": 0,
                    "type": "pick"
                }
            ]
        ],
        "allowBattleBoost": false,
        "allowDuplicatePicks": false,
        "allowLockedEvents": false,
        "allowPlayerPickSameChampion": false,
        "allowRerolling": false,
        "allowSkinSelection": true,
        "allowSubsetChampionPicks": false,
        "bans": {
            "myTeamBans": [],
            "numBans": 0,
            "theirTeamBans": []
        },
        "benchChampions": [],
        "benchEnabled": false,
        "boostableSkinCount": 0,
        "chatDetails": {
            "mucJwtDto": {
                "channelClaim": "0d564f96-90db-480a-bc98-59b23e566d2b",
                "domain": "lol-champ-select",
                "jwt": "eyJraWQiOiIxIiwiYWxnIjoiUlMyNTYifQ.eyJ0Z3QiOiJldTEiLCJzdWIiOiIzM2EwYTFmNi1kMzIyLTU4ZjAtODYwYi02MGE5NzMzZGY5OTEiLCJtZXRhZGF0YSI6eyJnYW1lSWQiOiI3ODY2OTEzNDUyIiwicmVnaW9uIjoiRVVXMSIsImxvYmJ5VHlwZSI6InByZS1nYW1lIiwicHJvZHVjdCI6ImxvbCJ9LCJpc3MiOiJsb2wtdGVhbWJ1aWxkZXIiLCJjaG4iOiIwZDU2NGY5Ni05MGRiLTQ4MGEtYmM5OC01OWIyM2U1NjZkMmIiLCJ0eXAiOiJsb2wtY2hhbXAtc2VsZWN0IiwiZXhwIjoxNzc5ODI1MzEyLCJpYXQiOjE3Nzk4MjQ3MTIsImp0aSI6IjEwOTVlZDdiLTMxMzYtNDYxMS1iZDk0LTU2ZDhkZWJiOTY0MyIsImNybSI6IjBkNTY0Zjk2LTkwZGItNDgwYS1iYzk4LTU5YjIzZTU2NmQyYkBsb2wtY2hhbXAtc2VsZWN0LnB2cC5uZXQifQ.GKlQN_CbHbAZAqXCK1YYbKOIHfeLZef4HigdggPZaPZxlD-VeHybE03yjkq9rbqpQdjteUBJ8FMyZHv1LilXRaVuoXod-XT0abprOEueOkIriFMZDVQQozij0Nw34lQ9Ztbv2OfpIturAgcuXmE9Nx4ZIbpXzvVgLicKj-M64zaLN-TD_9CiKi1BhMEAYRQsY2Z6dNEvIb0uCH41ZZlQJtUPTGqXt1ReGYFlXM8ZtxbeTt_I32SaYgvGR5NXW0pb0ldVdizx7i4NW6i8JaVf4QEoqqD9XM8ZRyepitFk5BbwBM_CN8xKx72qlJSXp6m_qDbmY4km1GKA0nDt6hr-zw",
                "targetRegion": "eu1"
            },
            "multiUserChatId": "0d564f96-90db-480a-bc98-59b23e566d2b",
            "multiUserChatPassword": "eyJraWQiOiIxIiwiYWxnIjoiUlMyNTYifQ.eyJ0Z3QiOiJldTEiLCJzdWIiOiIzM2EwYTFmNi1kMzIyLTU4ZjAtODYwYi02MGE5NzMzZGY5OTEiLCJtZXRhZGF0YSI6eyJnYW1lSWQiOiI3ODY2OTEzNDUyIiwicmVnaW9uIjoiRVVXMSIsImxvYmJ5VHlwZSI6InByZS1nYW1lIiwicHJvZHVjdCI6ImxvbCJ9LCJpc3MiOiJsb2wtdGVhbWJ1aWxkZXIiLCJjaG4iOiIwZDU2NGY5Ni05MGRiLTQ4MGEtYmM5OC01OWIyM2U1NjZkMmIiLCJ0eXAiOiJsb2wtY2hhbXAtc2VsZWN0IiwiZXhwIjoxNzc5ODI1MzEyLCJpYXQiOjE3Nzk4MjQ3MTIsImp0aSI6IjEwOTVlZDdiLTMxMzYtNDYxMS1iZDk0LTU2ZDhkZWJiOTY0MyIsImNybSI6IjBkNTY0Zjk2LTkwZGItNDgwYS1iYzk4LTU5YjIzZTU2NmQyYkBsb2wtY2hhbXAtc2VsZWN0LnB2cC5uZXQifQ.GKlQN_CbHbAZAqXCK1YYbKOIHfeLZef4HigdggPZaPZxlD-VeHybE03yjkq9rbqpQdjteUBJ8FMyZHv1LilXRaVuoXod-XT0abprOEueOkIriFMZDVQQozij0Nw34lQ9Ztbv2OfpIturAgcuXmE9Nx4ZIbpXzvVgLicKj-M64zaLN-TD_9CiKi1BhMEAYRQsY2Z6dNEvIb0uCH41ZZlQJtUPTGqXt1ReGYFlXM8ZtxbeTt_I32SaYgvGR5NXW0pb0ldVdizx7i4NW6i8JaVf4QEoqqD9XM8ZRyepitFk5BbwBM_CN8xKx72qlJSXp6m_qDbmY4km1GKA0nDt6hr-zw"
        },
        "counter": 58,
        "disallowBanningTeammateHoveredChampions": true,
        "gameId": 7866913452,
        "hasSimultaneousBans": true,
        "hasSimultaneousPicks": false,
        "id": "0d564f96-90db-480a-bc98-59b23e566d2b",
        "isCustomGame": false,
        "isLegacyChampSelect": false,
        "isSpectating": false,
        "localPlayerCellId": 3,
        "lockedEventIndex": -1,
        "myTeam": [
            {
                "assignedPosition": "utility",
                "cellId": 0,
                "championId": 147,
                "championPickIntent": 0,
                "gameName": "Lockkis",
                "internalName": "",
                "isAutofilled": false,
                "isHumanoid": false,
                "nameVisibilityType": "VISIBLE",
                "obfuscatedPuuid": "",
                "obfuscatedSummonerId": 0,
                "pickMode": 0,
                "pickTurn": 0,
                "playerAlias": "",
                "playerType": "",
                "puuid": "4bf85059-2419-5b64-8941-2d6e24bfc54b",
                "selectedSkinId": 147041,
                "spell1Id": 4,
                "spell2Id": 7,
                "summonerId": 3139690870261632,
                "tagLine": "EUW",
                "team": 1,
                "wardSkinId": -1
            },
            {
                "assignedPosition": "middle",
                "cellId": 1,
                "championId": 910,
                "championPickIntent": 0,
                "gameName": "III00IIII",
                "internalName": "",
                "isAutofilled": false,
                "isHumanoid": false,
                "nameVisibilityType": "VISIBLE",
                "obfuscatedPuuid": "",
                "obfuscatedSummonerId": 0,
                "pickMode": 0,
                "pickTurn": 0,
                "playerAlias": "",
                "playerType": "",
                "puuid": "45ced7f4-6085-5f91-9ef6-b557d4b94a08",
                "selectedSkinId": 910001,
                "spell1Id": 4,
                "spell2Id": 12,
                "summonerId": 3220199588849472,
                "tagLine": "EUW",
                "team": 1,
                "wardSkinId": -1
            },
            {
                "assignedPosition": "jungle",
                "cellId": 2,
                "championId": 904,
                "championPickIntent": 0,
                "gameName": "TheLazyTurtle",
                "internalName": "",
                "isAutofilled": false,
                "isHumanoid": false,
                "nameVisibilityType": "VISIBLE",
                "obfuscatedPuuid": "",
                "obfuscatedSummonerId": 0,
                "pickMode": 0,
                "pickTurn": 0,
                "playerAlias": "",
                "playerType": "",
                "puuid": "939f7578-a65d-5879-aa5b-a016f4c76f0b",
                "selectedSkinId": 904000,
                "spell1Id": 11,
                "spell2Id": 4,
                "summonerId": 3543468602483840,
                "tagLine": "1337",
                "team": 1,
                "wardSkinId": -1
            },
            {
                "assignedPosition": "top",
                "cellId": 3,
                "championId": 78,
                "championPickIntent": 0,
                "gameName": "Melander00",
                "internalName": "",
                "isAutofilled": false,
                "isHumanoid": false,
                "nameVisibilityType": "VISIBLE",
                "obfuscatedPuuid": "",
                "obfuscatedSummonerId": 0,
                "pickMode": 0,
                "pickTurn": 0,
                "playerAlias": "",
                "playerType": "",
                "puuid": "33a0a1f6-d322-58f0-860b-60a9733df991",
                "selectedSkinId": 78005,
                "spell1Id": 12,
                "spell2Id": 4,
                "summonerId": 3621574233163744,
                "tagLine": "1337",
                "team": 1,
                "wardSkinId": -1
            },
            {
                "assignedPosition": "bottom",
                "cellId": 4,
                "championId": 523,
                "championPickIntent": 0,
                "gameName": "king its here",
                "internalName": "",
                "isAutofilled": false,
                "isHumanoid": false,
                "nameVisibilityType": "VISIBLE",
                "obfuscatedPuuid": "",
                "obfuscatedSummonerId": 0,
                "pickMode": 0,
                "pickTurn": 0,
                "playerAlias": "",
                "playerType": "",
                "puuid": "88d31be6-0cf2-578a-94f5-4bdffacd7f24",
                "selectedSkinId": 523000,
                "spell1Id": 21,
                "spell2Id": 4,
                "summonerId": 3684542063535424,
                "tagLine": "1337",
                "team": 1,
                "wardSkinId": -1
            }
        ],
        "pickOrderSwaps": [],
        "positionSwaps": [
            {
                "cellId": 1,
                "id": 4,
                "state": "AVAILABLE"
            },
            {
                "cellId": 4,
                "id": 5,
                "state": "AVAILABLE"
            },
            {
                "cellId": 0,
                "id": 6,
                "state": "AVAILABLE"
            },
            {
                "cellId": 2,
                "id": 7,
                "state": "AVAILABLE"
            }
        ],
        "queueId": 400,
        "rerollsRemaining": 0,
        "showQuitButton": false,
        "skipChampionSelect": false,
        "theirTeam": [
            {
                "assignedPosition": "",
                "cellId": 5,
                "championId": 238,
                "championPickIntent": 0,
                "gameName": "",
                "internalName": "",
                "isAutofilled": false,
                "isHumanoid": false,
                "nameVisibilityType": "HIDDEN",
                "obfuscatedPuuid": "",
                "obfuscatedSummonerId": 0,
                "pickMode": 0,
                "pickTurn": 0,
                "playerAlias": "",
                "playerType": "",
                "puuid": "",
                "selectedSkinId": 238000,
                "spell1Id": 0,
                "spell2Id": 0,
                "summonerId": 0,
                "tagLine": "",
                "team": 2,
                "wardSkinId": -1
            },
            {
                "assignedPosition": "",
                "cellId": 6,
                "championId": 37,
                "championPickIntent": 0,
                "gameName": "",
                "internalName": "",
                "isAutofilled": false,
                "isHumanoid": false,
                "nameVisibilityType": "HIDDEN",
                "obfuscatedPuuid": "",
                "obfuscatedSummonerId": 0,
                "pickMode": 0,
                "pickTurn": 0,
                "playerAlias": "",
                "playerType": "",
                "puuid": "",
                "selectedSkinId": 37000,
                "spell1Id": 0,
                "spell2Id": 0,
                "summonerId": 0,
                "tagLine": "",
                "team": 2,
                "wardSkinId": -1
            },
            {
                "assignedPosition": "",
                "cellId": 7,
                "championId": 91,
                "championPickIntent": 0,
                "gameName": "",
                "internalName": "",
                "isAutofilled": false,
                "isHumanoid": false,
                "nameVisibilityType": "HIDDEN",
                "obfuscatedPuuid": "",
                "obfuscatedSummonerId": 0,
                "pickMode": 0,
                "pickTurn": 0,
                "playerAlias": "",
                "playerType": "",
                "puuid": "",
                "selectedSkinId": 91000,
                "spell1Id": 0,
                "spell2Id": 0,
                "summonerId": 0,
                "tagLine": "",
                "team": 2,
                "wardSkinId": -1
            },
            {
                "assignedPosition": "",
                "cellId": 8,
                "championId": 800,
                "championPickIntent": 0,
                "gameName": "",
                "internalName": "",
                "isAutofilled": false,
                "isHumanoid": false,
                "nameVisibilityType": "HIDDEN",
                "obfuscatedPuuid": "",
                "obfuscatedSummonerId": 0,
                "pickMode": 0,
                "pickTurn": 0,
                "playerAlias": "",
                "playerType": "",
                "puuid": "",
                "selectedSkinId": 800000,
                "spell1Id": 0,
                "spell2Id": 0,
                "summonerId": 0,
                "tagLine": "",
                "team": 2,
                "wardSkinId": -1
            },
            {
                "assignedPosition": "",
                "cellId": 9,
                "championId": 223,
                "championPickIntent": 0,
                "gameName": "",
                "internalName": "",
                "isAutofilled": false,
                "isHumanoid": false,
                "nameVisibilityType": "HIDDEN",
                "obfuscatedPuuid": "",
                "obfuscatedSummonerId": 0,
                "pickMode": 0,
                "pickTurn": 0,
                "playerAlias": "",
                "playerType": "",
                "puuid": "",
                "selectedSkinId": 223000,
                "spell1Id": 0,
                "spell2Id": 0,
                "summonerId": 0,
                "tagLine": "",
                "team": 2,
                "wardSkinId": -1
            }
        ],
        "timer": {
            "adjustedTimeLeftInPhase": 26688,
            "internalNowInEpochMs": 1779824833703,
            "isInfinite": false,
            "phase": "FINALIZATION",
            "totalTimeInPhase": 30000
        },
        "trades": [
            {
                "cellId": 0,
                "id": 44,
                "state": "INVALID"
            },
            {
                "cellId": 1,
                "id": 48,
                "state": "INVALID"
            },
            {
                "cellId": 2,
                "id": 50,
                "state": "AVAILABLE"
            },
            {
                "cellId": 4,
                "id": 55,
                "state": "AVAILABLE"
            }
        ]
    },
    "eventType": "Update",
    "uri": "/lol-champ-select/v1/session"
}

*/


