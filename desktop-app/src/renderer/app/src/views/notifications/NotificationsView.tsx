import styles from "./notifications.module.css";
import { CustomNotification, useNotifications } from "./useNotifications";
export default function NotificationsView() {

    const {
        notifications
    } = useNotifications()

    return(
        <>
        <div className={styles.container}>
            {
                notifications.map(e => <NotificationComponent notification={e} key={e.id}  />)
            }
        </div>
        </>
    )
}

function NotificationComponent({
  notification,
}: {
  notification: CustomNotification;
}) {
  return (
    <div
      className={`${styles.notification} ${
        styles[notification.status]
      }`}
    >
      <div className={styles.title}>
        {notification.status}
      </div>

      <div className={styles.message}>
        {notification.message}
      </div>
    </div>
  );
}