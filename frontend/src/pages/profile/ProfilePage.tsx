import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSessionQuery } from "../../queries/auth.query";
import { useSessionStore } from "../../stores/session.store";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { ProfileSidebar } from "../../components/profile/ProfileSidebar";
import { ProfileInfo } from "../../components/profile/ProfileInfo";

export default function ProfilePage() {
  const navigate = useNavigate();
  const sessionQuery = useSessionQuery();
  const session = useSessionStore((state) => state.session);

  useEffect(() => {
    if (!sessionQuery.isLoading && !session) {
      navigate({ to: "/login" });
    }
  }, [session, sessionQuery.isLoading, navigate]);

  if (sessionQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foxia-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Sidebar/Summary */}
        <div className="lg:col-span-4 xl:col-span-3">
          <ProfileSidebar />
        </div>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-8 xl:col-span-9">
          <ProfileInfo />
        </div>
      </div>
    </DashboardLayout>
  );
}
