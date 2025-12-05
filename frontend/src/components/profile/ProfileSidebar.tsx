import { useSessionStore, SessionIdentity } from "../../stores/session.store";
import { useCreateLogoutFlow, useSubmitLogoutFlow } from "../../queries/auth.query";
import { useNavigate } from "@tanstack/react-router";
import { UserTraits } from "../../types/user";

export function ProfileSidebar() {
  const session = useSessionStore((state) => state.session);
  const identity = session?.identity as SessionIdentity | undefined;
  const traits = identity?.traits as unknown as UserTraits;
  const navigate = useNavigate();

  const createLogoutMutation = useCreateLogoutFlow();
  const submitLogoutMutation = useSubmitLogoutFlow();

  const handleLogout = async () => {
    try {
      const flow = await createLogoutMutation.mutateAsync({});
      if (flow?.logout_token) {
        await submitLogoutMutation.mutateAsync(flow.logout_token);
        // Store will be cleared by query invalidation or manual clear if needed
        navigate({ to: "/login" });
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const displayName = traits?.name?.first
    ? `${traits.name.first} ${traits.name.last}`
    : traits?.email || "User";

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 rounded-full bg-foxia-100 border-4 border-white shadow-md flex items-center justify-center mx-auto overflow-hidden">
            <span className="text-foxia-600 font-bold text-3xl">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></span>
        </div>

        <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
        <p className="text-sm text-slate-500 mt-1">Last sign in 4 minutes ago</p>

        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="bg-slate-100 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-600 max-w-[180px] truncate">
            User ID: {identity?.id}
          </div>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors" title="Copy ID">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
          </button>
        </div>
      </div>

      {/* Actions Menu */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-2 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left">
            <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            Impersonate User
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left">
            <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            Change Password
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
          >
            <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
