import { summonerIcon } from "@app/lib/ddragon/ddragon"
import { cacheGetRequest } from "@app/lib/lcu/lcu"
import { isMe, setSummonerInfo } from "@app/store/features/lobbySlice"
import { useAppDispatch, useAppSelector } from "@app/store/hooks"
import { LobbyMember, LobbyMemberStatus } from "@shared/types/lcu/lobby"
import { useEffect } from "react"
import styles from "./lobby.module.css"

export default function LobbyView() {
    const members = useAppSelector((state) => state.lobby.members)

    return (
        <>
            <div className={styles.container}>
                {members.map((e) => (
                    <Member member={e} key={e.summonerId} />
                ))}
            </div>
        </>
    )
}

type MemberProps = {
    member: LobbyMember
}



function Member({ member }: MemberProps) {
    // const [summoner, setSummoner] = useState<SummonerInfo|null>(null)

    const dispatch = useAppDispatch()

    const summoner = useAppSelector(state => state.lobby.summoners[member.summonerId])
    const status = useAppSelector(state => state.lobby.status[member.summonerId])

    const me = isMe(member.summonerId)
    const target = useAppSelector(state => state.pick.pickForId.summonerId === member.summonerId)

    useEffect(() => {

        cacheGetRequest("/lol-summoner/v2/summoners/puuid/"+member.puuid).then(data => {
            if(data.errorCode) {
                console.error(data)
                return
            }

            dispatch(setSummonerInfo(data))
        })

        // cacheGetRequest(`/lol-champions/v1/owned-champions-minimal`).then(data => {
        //     if(data.errorCode) {
        //         console.error(data)
        //         return
        //     }
            
        //     console.log(data.filter(e => e))
        // })

    }, [member.puuid])



    return (
        <>
            <div className={[styles.member, target ? styles.target : ""].join(" ")}>
                <Status status={status ?? {connected: me, ping: 0}} />
                <img src={summonerIcon(member.summonerIconId)} />
                <span>{summoner?.gameName}</span>
            </div>
        </>
    )
}


function Status({status}: {status: LobbyMemberStatus}) {

    if(status === undefined) return null;

    return(
        <>
        
        <div className={styles.status} title={`${status.ping} ms`}
            style={{
                background: status.connected ? "#52FF29" : "#FF282E"
            }}
        >

            &nbsp;

        </div>
        
        </>
    )    
}