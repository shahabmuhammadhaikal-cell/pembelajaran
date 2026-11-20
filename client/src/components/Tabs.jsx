import { useApp } from "../state/useApp.js"
import { IconCards, IconChat, IconGrid, IconKids, IconQuiz, IconTranslate } from "./Icons.jsx"

const TABS = [
  { id: "dashboard", label: "Dasbor", key: "1", Icon: IconGrid },
  { id: "kids", label: "Anak", key: "2", Icon: IconKids },
  { id: "cards", label: "Kartu", key: "3", Icon: IconCards },
  { id: "quiz", label: "Kuis", key: "4", Icon: IconQuiz },
  { id: "phrases", label: "Frasa", key: "5", Icon: IconChat },
  { id: "translate", label: "Terjemah", key: "6", Icon: IconTranslate }
]

export default function Tabs() {
  const { state, actions } = useApp()
  return (
    <nav className="tabs" aria-label="Navigasi utama">
      {TABS.map(({ id, label, key, Icon }) => (
        <button
          key={id}
          className={`tab ${state.ui.tab === id ? "active" : ""}`}
          onClick={() => actions.setUi({ tab: id })}
          aria-current={state.ui.tab === id ? "page" : undefined}
        >
          <Icon size={17} />
          {label}
          <span className="tab-key">{key}</span>
        </button>
      ))}
    </nav>
  )
}
