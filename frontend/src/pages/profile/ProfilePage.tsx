import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  useCreateLogoutFlow,
  useSessionQuery,
  useSubmitLogoutFlow,
} from "../../queries/auth.query";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useSessionQuery();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const createLogoutFlow = useCreateLogoutFlow();
  const submitLogoutFlow = useSubmitLogoutFlow();

  const handleLogout = useMemo(
    () => async () => {
      try {
        const logoutFlow = await createLogoutFlow.mutateAsync(undefined);
        const responseData = (logoutFlow as any)?.data || logoutFlow;

        if (responseData?.logout_token) {
          await submitLogoutFlow.mutateAsync(responseData.logout_token);
          navigate({ to: "/login" });
          return;
        }

        if (responseData?.logout_url) {
          window.location.href = responseData.logout_url;
        }
      } catch (logoutError) {
        console.error("Logout error:", logoutError);
      } finally {
        setShowLogoutConfirm(false);
      }
    },
    [createLogoutFlow, submitLogoutFlow, navigate]
  );

  useEffect(() => {
    if (!isLoading && (error || !data)) {
      navigate({ to: "/login" });
    }
  }, [isLoading, error, data, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-foxia-50 text-slate-600">
        Đang tải thông tin phiên...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-foxia-50 text-slate-600">
        Đang chuyển hướng...
      </div>
    );
  }

  const responseData = (data as any)?.data || data;
  const identity = responseData?.identity;
  const session = responseData?.session;

  if (!identity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-foxia-50 text-slate-600">
        Không thể tải thông tin tài khoản.
      </div>
    );
  }

  const email = identity.traits?.email || "N/A";
  const userId = identity.id || "N/A";
  const state = identity.state || "N/A";
  const emailVerified = identity.verifiable_addresses?.[0]?.verified ?? false;
  const sessionActive = session?.active ?? false;
  const sessionExpiresAt = session?.expires_at
    ? new Date(session.expires_at).toLocaleString("vi-VN")
    : "N/A";
  const authenticatedAt = session?.authenticated_at
    ? new Date(session.authenticated_at).toLocaleString("vi-VN")
    : "N/A";

  return (
    <div className="min-h-screen bg-gradient-to-br from-foxia-50 via-white to-slate-100 px-4 py-10 text-slate-800">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-slate-900 rounded-3xl text-white p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1500522144261-ea64433bbe27?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold">
                {email.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-white/70">
                  Welcome back
                </p>
                <h1 className="text-3xl font-bold">{email}</h1>
                <p className="text-white/70">ID: {userId}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-semibold ${
                  emailVerified
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "bg-orange-500/20 text-orange-100"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {emailVerified ? "Email verified" : "Email pending"}
              </span>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-semibold ${
                  sessionActive
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "bg-rose-500/20 text-rose-100"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {sessionActive ? "Session active" : "Session inactive"}
              </span>
            </div>
            <div className="flex-1 text-right">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/20 transition"
                onClick={() => setShowLogoutConfirm(true)}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-foxia-strong rounded-3xl p-8 space-y-10">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 p-6 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foxia-500">
                Personal
              </p>
              <h2 className="text-xl font-bold text-slate-900">
                Account Details
              </h2>
              <div className="space-y-3">
                <InfoRow label="Email" value={email} />
                <InfoRow
                  label="User ID"
                  value={<code className="text-xs">{userId}</code>}
                />
                <InfoRow label="State" value={state} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 p-6 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foxia-500">
                Session
              </p>
              <h2 className="text-xl font-bold text-slate-900">
                Activity Details
              </h2>
              <div className="space-y-3">
                <InfoRow label="Authenticated at" value={authenticatedAt} />
                <InfoRow label="Session expires" value={sessionExpiresAt} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full space-y-6 shadow-2xl">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foxia-500">
                Confirm
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                Đăng xuất khỏi Foxia?
              </h3>
              <p className="text-slate-500 mt-2">
                Bạn sẽ cần đăng nhập lại để sử dụng các dịch vụ bảo mật của
                Foxia.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-600 hover:bg-slate-50 transition"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl px-4 py-3 font-semibold text-white foxia-gradient shadow-foxia-500/30 hover:opacity-90 transition"
                onClick={handleLogout}
                disabled={
                  createLogoutFlow.isPending || submitLogoutFlow.isPending
                }
              >
                {createLogoutFlow.isPending || submitLogoutFlow.isPending
                  ? "Đang xử lý..."
                  : "Đăng xuất"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type InfoRowProps = {
  label: string;
  value: React.ReactNode;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex justify-between text-sm text-slate-600">
      <span>{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
