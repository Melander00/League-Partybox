import { ipcRenderer } from "@renderer/lib/ipcRenderer";
import { Channels, RequestOptions } from "@shared/index";

export async function request(opt: RequestOptions) {
    return ipcRenderer.invoke(Channels.REQUEST, opt)
}

export async function getRequest(endpoint: string) {
    return request({
        method: "get",
        endpoint: endpoint
    })
}