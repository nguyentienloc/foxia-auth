import clsx from "clsx";

interface InfoFieldProps {
  label: string;
  value: string;
  verified?: boolean;
  className?: string;
}

export function InfoField({ label, value, verified, className }: InfoFieldProps) {
  return (
    <div className={clsx("space-y-2", className)}>
      <label className="text-sm font-medium text-slate-500">{label}</label>
      <div className="relative group">
        <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 font-medium text-sm flex items-center justify-between">
          <span className="truncate">{value}</span>
          {verified && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200">
              Verified
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
