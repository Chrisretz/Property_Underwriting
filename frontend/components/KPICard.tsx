interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: "default" | "highlight";
}

export function KPICard({ title, value, subtitle, variant = "default" }: KPICardProps) {
  return (
    <div
      className={`rounded-xl bg-white p-5 shadow-sm border ${
        variant === "highlight" ? "border-primary-300 ring-1 ring-primary-100" : "border-gray-100"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {title}
      </p>
      <p
        className={`mt-2 text-2xl font-bold ${
          variant === "highlight" ? "text-primary-700" : "text-gray-900"
        }`}
      >
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
      )}
    </div>
  );
}
