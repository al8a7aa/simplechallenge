import type { ReactNode } from "react";

/**
 * Page content container: capped at 1040px and centered, with a 16px gutter
 * on phones. Only page content is capped, never the app shell.
 */
export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`mx-auto flex w-full max-w-[1040px] flex-col gap-6 px-4 py-6 md:px-12 md:py-10 ${className}`}>{children}</main>;
}

/** Page heading block: title plus an optional one-line description. */
export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-[28px] font-semibold leading-tight md:text-[32px]">{title}</h1>
        {description && <p className="text-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}
