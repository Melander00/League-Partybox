import type { IpcRendererListener } from "@electron-toolkit/preload";
import { ipcRenderer } from "@renderer/lib/ipcRenderer";
import { useEffect } from "react";

export function useIpc(channel: string, listener: IpcRendererListener) {

    useEffect(() => {

        const removeListener = ipcRenderer.on(channel, listener)

        return () => {
            removeListener()
        }

    }, [channel])

} 