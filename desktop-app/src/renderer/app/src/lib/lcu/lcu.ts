import { ipcRenderer } from "@renderer/lib/ipcRenderer";
import { Channels, RequestOptions } from "@shared/index";

export async function request(opt: RequestOptions) {
    return ipcRenderer.invoke(Channels.REQUEST, opt)
}

export async function getRequest(endpoint: string) {
    return request({
        method: "GET",
        endpoint: endpoint
    })
}


// const cache = new LRUCache({
//     ttl: 60 * 60 * 1000,
//     ttlAutopurge: true
// })

const cache = {
  data: new Map(),
  timers: new Map(),
  set: (k, v, ttl) => {
    if (cache.timers.has(k)) {
      clearTimeout(cache.timers.get(k))
    }
    cache.timers.set(
      k,
      setTimeout(() => cache.delete(k), ttl),
    )
    cache.data.set(k, v)
  },
  get: k => cache.data.get(k),
  has: k => cache.data.has(k),
  delete: k => {
    if (cache.timers.has(k)) {
      clearTimeout(cache.timers.get(k))
    }
    cache.timers.delete(k)
    return cache.data.delete(k)
  },
  clear: () => {
    cache.data.clear()
    for (const v of cache.timers.values()) {
      clearTimeout(v)
    }
    cache.timers.clear()
  },
}

type CacheOptions = {
    ttl: number
}

export async function cacheGetRequest(endpoint: string, opt?: CacheOptions) {
    if(cache.has(endpoint)) {
        return cache.get(endpoint)
    }

    const data = await getRequest(endpoint)
    cache.set(endpoint, data, {
        ttl: opt?.ttl,
    })

    return data
}





