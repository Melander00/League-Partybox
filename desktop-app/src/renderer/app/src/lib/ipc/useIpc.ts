import { ipcRenderer } from "@app/lib/ipc/ipcRenderer";
import type { IpcRendererListener } from "@electron-toolkit/preload";
import { useEffect } from "react";

export function useIpc(channel: string, listener: IpcRendererListener) {

    useEffect(() => {

        const removeListener = ipcRenderer.on(channel, listener)

        return () => {
            removeListener()
        }

    }, [channel])

} 