import { IpcRendererListener } from "@electron-toolkit/preload";
import { ipcRenderer } from "@renderer/lib/ipcRenderer";
import { Channels } from "@shared/index";
import { useEffect } from "react";

export function useLCU(
    endpoint: string,
    listener: IpcRendererListener
) {

    useEffect(() => {
        let removeIpcListener: (() => void) | undefined
        let disposed = false
        let channel: string | null = null

        const setup = async () => {
            const result = await ipcRenderer.invoke(
                Channels.SUBSCRIBE,
                endpoint
            )

            if (!result) return

            // cleanup already happened before subscribe finished
            if (disposed) {
                ipcRenderer.invoke(Channels.UNSUBSCRIBE, result)
                return
            }

            channel = result

            removeIpcListener = ipcRenderer.on(result, listener)
        }

        setup()

        return () => {
            disposed = true

            if (channel) {
                ipcRenderer.invoke(Channels.UNSUBSCRIBE, channel)
            }

            if (removeIpcListener) {
                removeIpcListener()
            }
        }
    }, [endpoint, listener])
}