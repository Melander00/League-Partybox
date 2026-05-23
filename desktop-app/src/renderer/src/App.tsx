import { Channels, Log, LogType } from "@shared/index"
import { useEffect, useState } from "react"
import "./App.css"
import { ipcRenderer } from "./lib/ipcRenderer"
import { useIpc } from "./lib/useIpc"



const prelogs: Log[] = [
]

function App(): React.JSX.Element {

    const [logs, setLogs] = useState<Log[]>([...prelogs])

    const addLog = (log: Log) => {
        setLogs(e => [...e, log])
    }

    useIpc(Channels.LOADING_LOG, (_ev, data) => {
        addLog(data)
    })

    useEffect(() => {
        ipcRenderer.send(Channels.LOADING_LOADED)
    }, [])


    return (
        <>
        <div className="container">
            {logs.map((e, i) => <LogComponent key={i} log={e} />)}
        </div>
        </>
    )
}

export default App

function logMapper(log: Log) {
    const obj = {
        color: "#fbfbfb",
        text: "[Info]"
    }

    switch(log.type) {
        case LogType.WARNING:
            obj.color = "#ffff00"; obj.text = "[Warning]"
            break;
        case LogType.ERROR:
            obj.color = "#ff0000"; obj.text = "[Error]"
            break;
        default:
            break;
    }

    return obj
}

function zeroPad(nr: number) {
    if(nr >= 10) {   
        return nr.toString()
    }

    return "0" + nr
}


type LogProps = {
    log: Log
}

function LogComponent({
    log
}: LogProps) {

    const meta = logMapper(log) 
    const date = new Date(log.time)

    return(
        <>
        
        <div className="log" style={{
            color: meta.color
        }}>

            <span>{
            `${zeroPad(date.getHours())}:${zeroPad(date.getMinutes())}:${zeroPad(date.getSeconds())}`    
            }</span>
            <span>{meta.text}</span>
            <span>{log.text}</span>

        </div>

        </>
    )
}