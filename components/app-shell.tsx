"use client";

import { useEffect, useState } from "react";

type SneatHelpers = {
  mainMenu: unknown;
  scrollToActive: (animate?: boolean) => void;
  toggleCollapsed: () => void;
};

/**
 * Layout Sneat: sidebar + navbar + content wrapper.
 * `menu` = item sidebar per role (array dari server component).
 */
export default function AppShell({
  children,
  menu,
}: {
  children: React.ReactNode;
  menu: { href: string; label: string; icon: string; badge?: string }[];
}) {
  const [helpers, setHelpers] = useState<SneatHelpers | null>(null);

  useEffect(() => {
    const w = window as unknown as {
      Menu?: new (el: HTMLElement, opts: Record<string, unknown>) => unknown;
      Helpers?: SneatHelpers;
    };
    const el = document.getElementById("layout-menu");
    if (el && w.Menu && w.Helpers && !(el as unknown as { menuInstance?: unknown }).menuInstance) {
      w.Helpers.mainMenu = new w.Menu(el, { orientation: "vertical", closeChildren: false });
      w.Helpers.scrollToActive(false);
    }
    if (w.Helpers) setHelpers(w.Helpers);

    // tandai menu aktif sesuai path saat ini
    const path = window.location.pathname;
    el?.querySelectorAll(".menu-link").forEach((a) => {
      const item = a.closest(".menu-item");
      if (!item) return;
      item.classList.toggle("active", a.getAttribute("href") === path);
    });
  }, []);

  return (
    <div className="layout-wrapper layout-content-navbar">
      <div className="layout-container">
        <aside id="layout-menu" className="layout-menu menu-vertical menu bg-menu-theme">
          <div className="app-brand demo">
            <a href="/dashboard" className="app-brand-link">
              <span className="app-brand-logo demo">
                <i className="bx bx-briefcase text-primary" style={{ fontSize: "1.5rem" }} />
              </span>
              <span className="app-brand-text demo menu-text fw-bold ms-2">MBKM 2026 UDB</span>
            </a>
          </div>

          <div className="menu-inner mt-2 py-1">
            <li className="menu-header small text-uppercase">
              <span className="menu-header-text">Menu</span>
            </li>
            {menu.map((m) => (
              <li className="menu-item" key={m.href}>
                <a href={m.href} className="menu-link">
                  <i className={`menu-icon tf-icons bx ${m.icon}`} />
                  <div className="text-truncate">{m.label}</div>
                  {m.badge && <span className="badge rounded-pill bg-label-primary ms-auto">{m.badge}</span>}
                </a>
              </li>
            ))}
            <li className="menu-header small text-uppercase mt-3">
              <span className="menu-header-text">Akun</span>
            </li>
            <li className="menu-item">
              <a href="/api/auth/signout" className="menu-link">
                <i className="menu-icon tf-icons bx bx-power-off" />
                <div>Log Out</div>
              </a>
            </li>
          </div>
        </aside>

        <div className="layout-page">
          <nav
            className="layout-navbar container-xxl navbar-detached navbar navbar-expand-xl align-items-center bg-navbar-theme"
            id="layout-navbar"
          >
            <div className="layout-menu-toggle navbar-nav align-items-xl-center me-4 me-xl-0 d-xl-none">
              <a className="nav-item nav-link px-0 me-xl-6" href="#" onClick={(e) => e.preventDefault()}>
                <i className="bx bx-menu icon-md" />
              </a>
            </div>
            <div className="navbar-nav-right d-flex align-items-center justify-content-end" id="navbar-collapse">
              <ul className="navbar-nav flex-row align-items-center ms-md-auto">
                <li className="nav-item lh-1 me-2">
                  <span className="text-body-secondary small">TA 2026/2027</span>
                </li>
              </ul>
            </div>
          </nav>

          <div className="content-wrapper">
            <div className="container-xxl flex-grow-1 container-p-y">{children}</div>
          </div>
        </div>
      </div>
      <div className="layout-overlay layout-menu-toggle" onClick={() => helpers?.toggleCollapsed()} />
    </div>
  );
}
