import type { ReactNode } from "react";
import Image from "next/image";
import { LogoutButton } from "@/components/logout-button";
import { PortalNavigation } from "@/components/portal-navigation";
import { accountDisplayName } from "@/components/user-copy";

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
          <a className="wordmark brand-logo-link" href="/" aria-label="JagaJKN — Beranda"><Image className="brand-logo-image" src="/jagajkn-logo.png" alt="JagaJKN — Transparan dan Terverifikasi" width={1536} height={1024} priority /></a>
          <span className="topbar-context">Portal {role}</span>
        </div>
        <div className="topbar-right">
          <div className="portal-user">
            <p><strong>{accountDisplayName(accountName)}</strong><br /><span className="muted">{role}{companyName ? ` · ${companyName}` : ""}</span></p>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="portal-layout">
        <aside className="sidebar" aria-label="Ruang kerja dan navigasi">
          <span className="sidebar-eyebrow">Ruang kerja</span>
          <h2>{title}</h2>
          <p className="sidebar-role">{role}{companyName ? ` · ${companyName}` : ""}</p>
            {navigation && <PortalNavigation items={navigation} label={role} accountName={accountDisplayName(accountName)} companyName={companyName} />}
        </aside>
        <main className="portal-main" id="portal-content" tabIndex={-1}>
          <div className="portal-content">{children}</div>
        </main>
      </div>
    </>
  );
}
