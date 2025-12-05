interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function ProfileSection({ title, children, action }: ProfileSectionProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {action}
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
