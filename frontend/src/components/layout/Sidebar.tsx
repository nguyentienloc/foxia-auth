import { Link, useLocation } from "@tanstack/react-router";
import { MENU_CONFIG } from "../../config/menu";
import clsx from "clsx";

export function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 h-screen flex flex-col fixed left-0 top-0 z-20 overflow-y-auto">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2 text-foxia-600">
          <div className="w-8 h-8 bg-foxia-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            F
          </div>
          <span className="text-xl font-bold text-slate-800">Foxia</span>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-6 px-4 space-y-8">
        {MENU_CONFIG.map((section, index) => (
          <div key={index}>
            {section.title && (
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path || ''));
                return (
                  <Link
                    key={item.key}
                    to={item.path}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-foxia-100 text-foxia-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <span className={clsx("w-5 h-5", isActive ? "text-foxia-600" : "text-slate-400")}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
