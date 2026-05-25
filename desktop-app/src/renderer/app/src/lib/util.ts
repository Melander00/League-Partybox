export function createDebounce<T>(cb: (...args: T[]) => void, ms: number) {
    let timeout = setTimeout(() => {}, ms)
    clearTimeout(timeout)
    
    return (...args: T[]) => {
        
        clearTimeout(timeout)
        timeout = setTimeout(() => {
            cb(...args)
        }, ms)
    }
}