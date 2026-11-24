import type { ComponentProps, ReactNode } from "react";

/**
 * The one card style: liquid glass (see .glass in globals.css) with the
 * 28px card radius. Pass a `rounded-*` class to use another radius.
 */
export function Card({ className = "", ...props }: ComponentProps<"section">) {
  const radius = /(^|\s)rounded-/.test(className) ? "" : "rounded-card";
  return <section className={`glass ${radius} ${className}`} {...props} />;
}

/** Card heading with an optional icon and an action on the opposite side. */
export function CardTitle({ icon, children, action }: { icon?: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        {icon}
        {children}
      </h2>
      {action}
    </div>
  );
}

/** Big-number tile for the dashboard summary row. */
export function StatTile({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <Card className="flex flex-col gap-2 p-4">
      {icon}
      <span className="font-num text-[32px] font-medium leading-none">{value}</span>
      <span className="text-sm text-muted">{label}</span>
    </Card>
  );
}
