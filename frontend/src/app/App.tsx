import { Outlet } from '@tanstack/react-router';

export function AppLayout() {
  return (
    <div className="app-shell">
      <main className="app-shell__main">
        <Outlet />
      </main>
    </div>
  );
}

