import type { ReactNode } from "react";

import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:pl-64">
      <Sidebar />
      <BottomNav />
      <main className="mx-auto max-w-6xl px-5 pt-6 pb-28 sm:px-8 lg:pt-10 lg:pb-16">
        {children}
      </main>
    </div>
  );
}
