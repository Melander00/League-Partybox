import '@app/index.css'

import App from '@app/App'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/store'
import { NotificationsProvider } from './views/notifications/useNotifications'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Provider store={store}>
            <NotificationsProvider>
                <App />
            </NotificationsProvider>
        </Provider>
    </StrictMode>
)
