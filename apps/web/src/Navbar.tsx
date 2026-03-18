import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

export default function Navbar() {
    return (
        <nav className="nav">
            <Link to="/" className="site-title">Home</Link>
            <ul>
                <CustomLink to="/strategies">Strategies</CustomLink>
                <CustomLink to="/backtests">Backtests</CustomLink>
            </ul>
        </nav>
    )
}

function CustomLink({ to, children, ...props }: { to: string, children: ReactNode }) {
    const { pathname } = useLocation();

    return (
        <li className={pathname === to ? "active" : ""}>
            <Link to={to} {...props}>
                {children}
            </Link>
        </li>
    )
}
