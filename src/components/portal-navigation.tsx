"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/logout-button";

type NavigationItem = { label: string; href: string };

export function PortalNavigation({ items, label, accountName, companyName }: { items: NavigationItem[]; label: string; accountName: string; companyName?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  function close() { dialog.current?.close(); setOpen(false); }
  useEffect(() => { dialog.current?.close(); setOpen(false); }, [pathname]);
  if (items.length === 0) return null;

  function links() {
    return items.map((item) => {
      const path = item.href.split("?")[0]!;
      const moreSpecific = items.some(other => { const otherPath = other.href.split("?")[0]!; return otherPath.length > path.length && (pathname === otherPath || pathname.startsWith(`${otherPath}/`)); });
      const active = pathname === path || (!moreSpecific && path !== "/login" && path !== "/" && pathname.startsWith(`${path}/`));
      return <Link aria-current={active ? "page" : undefined} className={active ? "is-active" : undefined} href={item.href} key={item.href} onClick={close}><span className="nav-marker" aria-hidden="true">{path.includes("report") ? "↗" : path.includes("contract") ? "≡" : path.includes("contributions") ? "↔" : "▦"}</span>{item.label}</Link>;
    });
  }

  return (
    <div className="portal-nav-container">
      <button
        aria-expanded={open}
        aria-controls="portal-navigation"
        className="portal-nav-toggle"
        ref={trigger}
        onClick={() => { dialog.current?.showModal(); setOpen(true); }}
        type="button"
      >
        <span aria-hidden="true">☰</span><span className="sr-only">Menu {label}</span>
      </button>
      <nav aria-label={`Navigasi ${label}`} className="portal-nav desktop-navigation">{links()}</nav>
      <dialog ref={dialog} className="navigation-drawer" id="portal-navigation" aria-label={`Menu ${label}`} onClose={() => { setOpen(false); trigger.current?.focus(); }} onCancel={() => setOpen(false)} onKeyDown={event => {
        if (event.key !== "Tab") return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
        const first = controls[0]; const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
        <div className="drawer-header"><strong>Portal {label}</strong><button className="drawer-close" onClick={close} type="button" aria-label="Tutup menu">×</button></div>
        <p className="drawer-account"><strong>{accountName}</strong><br />{companyName}</p>
        <nav aria-label={`Navigasi ${label}`} className="portal-nav">{links()}</nav>
        <div className="drawer-footer"><p>Synthetic / Demo · Bukan sistem resmi BPJS</p><LogoutButton /></div>
      </dialog>
    </div>
  );
}
