let version = "16.10.1"

export function setDDragonVersion(ver: string) {
    version = ver
}

const baseURL = new URL("https://ddragon.leagueoflegends.com/")

export async function loadDDragonVersion() {
    const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json")
    if(res.ok) {
        const json = await res.json()
        const ver = json[0]
        if(ver) {
            setDDragonVersion(ver)
            console.log("DDragon Version " + ver)
        }
    }
}





export const summonerIcon = (icon: number) => new URL(`cdn/${version}/img/profileicon/${icon}.png`,baseURL).toString()