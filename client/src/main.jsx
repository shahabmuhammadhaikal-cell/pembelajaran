import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.jsx"
import { AppProvider } from "./state/AppContext.jsx"
import { AuthProvider } from "./state/AuthContext.jsx"
import { SyncProvider } from "./state/SyncContext.jsx"
import "./styles/tokens.css"
import "./styles/app.css"
import "./styles/kids.css"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <SyncProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </SyncProvider>
    </AuthProvider>
  </StrictMode>
)
