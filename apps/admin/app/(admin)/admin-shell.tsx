"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/(admin)/actions";
import type { AdminNavigationItem } from "@/src/navigation/admin-navigation";

type AdminShellProps = {
  account: { name: string; email: string; isMasterAdmin: boolean };
  navigation: AdminNavigationItem[];
  unreadOperationalCount: number;
  showNotifications: boolean;
  children: React.ReactNode;
};

function isActive(pathname: string, item: AdminNavigationItem) {
  if (item.href === "/dashboard") return pathname === item.href;
  if (item.href && pathname === item.href) return true;
  return item.children?.some((child) => child.href === pathname) ?? false;
}

function NavLabel({ item }: { item: AdminNavigationItem }) {
  return <><span>{item.label}</span>{item.badge ? <span className="nav-badge" aria-label={`${item.badge} ${item.badgeLabel ?? "items"}`}>{item.badge}</span> : null}</>;
}

export function AdminShell({ account, navigation, unreadOperationalCount, showNotifications, children }: AdminShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="admin-shell">
      <a className="skip-link" href="#admin-content">Skip to main content</a>
      <header className="admin-header">
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="admin-sidebar"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">{menuOpen ? "Close" : "Menu"}</span>
        </button>
        <Link className="header-brand" href="/dashboard">Eraasim Admin</Link>
        <div className="header-actions">{showNotifications ? <Link className="notification-bell" href="/notifications/unread" aria-label={`${unreadOperationalCount} unread operational notifications`}><span aria-hidden="true">&#128276;</span>{unreadOperationalCount ? <span className="header-badge">{unreadOperationalCount}</span> : null}</Link> : null}<span className="header-account">{account.name}</span></div>
      </header>

      {menuOpen ? <button className="sidebar-scrim" type="button" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} /> : null}

      <aside id="admin-sidebar" className={`admin-sidebar${menuOpen ? " is-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true">E</span>
          <div><strong>Eraasim</strong><span>Administration</span></div>
        </div>

        <nav className="admin-nav" aria-label="Administration">
          <ul>
            {navigation.map((item) => {
              const active = isActive(pathname, item);
              if (item.children?.length) {
                return (
                  <li key={item.label}>
                    <details className="nav-group" open={active}>
                      <summary className={active ? "is-active" : undefined}>
                        <NavLabel item={item}/><span className="nav-chevron" aria-hidden="true">›</span>
                      </summary>
                      <ul>
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link href={child.href!} aria-current={pathname === child.href ? "page" : undefined} onClick={() => setMenuOpen(false)}>
                              <NavLabel item={child}/>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link href={item.href!} aria-current={pathname === item.href ? "page" : undefined} onClick={() => setMenuOpen(false)}><NavLabel item={item}/></Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-account">
          <div className="account-avatar" aria-hidden="true">{account.name.charAt(0).toUpperCase()}</div>
          <div className="account-copy">
            <strong>{account.name}</strong>
            <span>{account.email}</span>
            <small>{account.isMasterAdmin ? "Master Admin" : "Staff"}</small>
          </div>
          <form action={logout}><button className="logout-button" type="submit">Logout</button></form>
          <small className="admin-designer-credit">Designed by Aliasgar Raj</small>
        </div>
      </aside>

      <main id="admin-content" className="admin-content" tabIndex={-1}>{children}</main>
    </div>
  );
}
