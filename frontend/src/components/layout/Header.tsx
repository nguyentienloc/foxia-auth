import { useSessionStore, SessionIdentity } from "../../stores/session.store";
import { UserTraits } from "../../types/user";

export function Header() {
  const session = useSessionStore((state) => state.session);
  const identity = session?.identity as SessionIdentity | undefined;
  const traits = identity?.traits as unknown as UserTraits;

  // Get name or email for display
  const displayName = traits?.name?.first
    ? `${traits.name.first} ${traits.name.last}`
    : traits?.email || "User";

  const email = traits?.email || "";

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-10">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </span>
          <input
            type="text"
            placeholder="Search here..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-12 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foxia-500/20 focus:border-foxia-500 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-slate-500 bg-white border border-slate-200 rounded shadow-sm">⌘</kbd>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-slate-500 bg-white border border-slate-200 rounded shadow-sm">K</kbd>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        {/* Notification */}
        <button className="relative text-slate-500 hover:text-slate-700 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-900 leading-none">{displayName}</p>
            <p className="text-xs text-slate-500 mt-1">{email}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-foxia-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
            {/* Placeholder Avatar if no image */}
            <span className="text-foxia-600 font-bold text-lg">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
