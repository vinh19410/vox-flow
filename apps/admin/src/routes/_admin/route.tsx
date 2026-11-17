import {
  Outlet,
  createFileRoute,
  useNavigate,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { Button } from "@vox-flow/ui/ds/button";
import { Card } from "@vox-flow/ui/ds/card";
import { Logo } from "@vox-flow/ui/ds/logo";
import { LogOut, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/layouts/admin-shell";
import { requireAdminAccess } from "@/lib/admin-guard";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_admin")({
  beforeLoad: ({ location }) => requireAdminAccess(location.href),
  component: AdminLayoutRoute,
  errorComponent: AdminRouteError,
});

function AdminRouteError({ reset }: ErrorComponentProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-12 text-ink">
      <Card className="w-full max-w-md p-7 text-center sm:p-10">
        <div className="mx-auto flex justify-center">
          <Logo />
        </div>
        <div className="mx-auto mt-6 grid h-12 w-12 place-items-center rounded-2xl bg-bad-soft text-bad">
          <ShieldAlert size={24} />
        </div>
        <h1 className="mt-4 text-xl font-bold text-ink">Không thể xác thực quyền quản trị</h1>
        <p className="mt-2 text-sm text-ink-2">
          Kết nối tới máy chủ gặp sự cố tạm thời. Vui lòng thử tải lại.
        </p>
        <Button type="button" variant="primary" size="md" className="mt-6 w-full" onClick={reset}>
          Thử lại
        </Button>
      </Card>
    </div>
  );
}

function AdminAccessDenied({ email }: { email: string }) {
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleSwitchAccount = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const res = await authClient.signOut();
      if (res && typeof res === "object" && "error" in res && res.error) {
        toast.error("Đăng xuất thất bại. Vui lòng thử lại.");
        return;
      }
      await navigate({ to: "/login" });
    } catch {
      toast.error("Đăng xuất thất bại. Vui lòng thử lại.");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-12 text-ink">
      <Card className="w-full max-w-md p-7 text-center sm:p-10">
        <div className="mx-auto flex justify-center">
          <Logo />
        </div>
        <div className="mx-auto mt-6 grid h-12 w-12 place-items-center rounded-2xl bg-bad-soft text-bad">
          <ShieldAlert size={24} />
        </div>
        <h1 className="mt-4 text-xl font-bold text-ink">Truy cập bị từ chối</h1>
        <p className="mt-2 text-sm text-ink-2">
          Tài khoản <strong className="text-ink">{email}</strong> không có quyền truy cập cổng quản
          trị Vox Flow.
        </p>
        <Button
          type="button"
          variant="primary"
          size="md"
          className="mt-6 w-full"
          disabled={signingOut}
          onClick={() => void handleSwitchAccount()}
        >
          <LogOut size={16} />
          Đăng xuất / đổi tài khoản
        </Button>
      </Card>
    </div>
  );
}

function AdminLayoutRoute() {
  const { session, isAdmin } = Route.useRouteContext();

  if (!isAdmin) {
    return <AdminAccessDenied email={session.user.email} />;
  }

  return (
    <AdminShell adminUser={session.user}>
      <Outlet />
    </AdminShell>
  );
}
