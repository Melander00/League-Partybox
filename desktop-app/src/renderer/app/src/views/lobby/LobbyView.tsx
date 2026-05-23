import { summonerIcon } from "@app/lib/ddragon/ddragon"
import { cacheGetRequest } from "@app/lib/lcu/lcu"
import { setSummonerInfo } from "@app/store/features/lobbySlice"
import { useAppDispatch, useAppSelector } from "@app/store/hooks"
import { LobbyMember } from "@shared/types/lcu/lobby"
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
            <div className={styles.member}>
                <img src={summonerIcon(member.summonerIconId)} />
                <span>{summoner?.gameName}</span>
            </div>
        </>
    )
}
