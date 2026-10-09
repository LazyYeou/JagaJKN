import type { ReactNode } from "react";
import { LogoutButton } from "@/components/logout-button";
import { PortalNavigation } from "@/components/portal-navigation";

type PortalShellProps = {
  title: string;
  role: string;
  accountName: string;
  companyName?: string | null;
  navigation?: Array<{ label: string; href: string }>;
  children: ReactNode;
};

export function PortalShell({ title, role, accountName, companyName, navigation, children }: PortalShellProps) {
  return (
    <>
      <a className="skip-link" href="#portal-content">Lewati navigasi</a>
      <header className="topbar">
        <div className="topbar-brand">
          <a className="wordmark" href="/"><span className="wordmark-mark" aria-hidden="true">J</span><span className="wordmark-name">Jaga<span>JKN</span></span></a>
          <span className="topbar-context">Portal {role}</span>
        </div>
        <div className="topbar-right">
          <span className="demo-pill topbar-demo">DATA SIMULASI · BUKAN SISTEM RESMI BPJS</span>
          <div className="portal-user">
            <p><strong>{accountName}</strong><br /><span className="muted">{role}{companyName ? ` · ${companyName}` : ""}</span></p>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="portal-layout">
        <aside className="sidebar" aria-label="Ruang kerja dan navigasi">
          <span className="sidebar-eyebrow">Ruang kerja</span>
          <h2>{title}</h2>
          <p className="sidebar-role">{role}{companyName ? ` · ${companyName}` : ""}</p>
           {navigation && <PortalNavigation items={navigation} label={role} accountName={accountName} companyName={companyName} />}
          <div className="sidebar-footnote"><span className="sidebar-status-dot" />Sumber: Synthetic / Demo</div>
        </aside>
        <main className="portal-main" id="portal-content" tabIndex={-1}>
          <div className="portal-content">{children}</div>
        </main>
      </div>
    </>
  );
}
