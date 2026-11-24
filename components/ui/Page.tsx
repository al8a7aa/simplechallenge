import type { ReactNode } from "react";

/**
 * Page content container, centered, with a 16px gutter on phones.
 * Only page content is capped, never the app shell:
 *   narrow 640px (single task) · medium 760px (detail, settings) · wide 1040px.
 */
const WIDTH = { narrow: "max-w-[640px]", medium: "max-w-[760px]", wide: "max-w-[1040px]" } as const;

export function Page({ children, width = "wide", className = "" }: { children: ReactNode; width?: keyof typeof WIDTH; className?: string }) {
  return <main className={`mx-auto flex w-full ${WIDTH[width]} flex-col gap-5 px-4 py-6 sm:px-6 md:gap-6 md:px-10 md:py-10 ${className}`}>{children}</main>;
}

/** Page heading block: title plus an optional one-line description. */
export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="font-display text-[40px] leading-[1.05] font-normal md:text-[48px]">{title}</h1>
        {description && <p className="text-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}
