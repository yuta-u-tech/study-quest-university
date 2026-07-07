import { Link } from 'react-router-dom'

interface TopBarProps {
  backTo: string
  backLabel: string
  title?: string
}

export default function TopBar({ backTo, backLabel, title }: TopBarProps) {
  return (
    <nav className="topbar">
      <Link to={backTo} className="topbar-back">
        <span aria-hidden="true">←</span> {backLabel}
      </Link>
      {title ? <span className="topbar-title">{title}</span> : null}
    </nav>
  )
}
