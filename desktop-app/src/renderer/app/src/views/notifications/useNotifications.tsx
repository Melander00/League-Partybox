import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react'

type NotificationStatus = 'success' | 'warning' | 'info' | 'error'

export type CustomNotification = {
    id: string
    title: string
    message: string
    status: NotificationStatus
}

export function createNotification(
    title: string,
    message: string,
    status: NotificationStatus
): CustomNotification {
    return {
        id: crypto.randomUUID(),
        title,
        message,
        status
    }
}

type NotificationsContextType = {
    notifications: CustomNotification[]
    addNotification: (title: string, message: string, status: NotificationStatus) => void
    removeNotification: (id: string) => void
}

const NotificationsContext = createContext<NotificationsContextType | null>(null)

type NotificationsProviderProps = {
    children: ReactNode
    duration?: number
}

export function NotificationsProvider({ children, duration = 3000 }: NotificationsProviderProps) {
    const [notifications, setNotifications] = useState<CustomNotification[]>([])

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id))
    }, [])

    const addNotification = useCallback(
        (title: string, message: string, status: NotificationStatus) => {
            const notification = createNotification(title, message, status)

            setNotifications((prev) => [...prev, notification])

            setTimeout(() => {
                removeNotification(notification.id)
            }, duration)
        },
        [duration, removeNotification]
    )

    const value = useMemo(
        () => ({
            notifications,
            addNotification,
            removeNotification
        }),
        [notifications, addNotification, removeNotification]
    )

    return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
    const context = useContext(NotificationsContext)

    if (!context) {
        throw new Error('useNotifications must be used inside NotificationsProvider')
    }

    return context
}