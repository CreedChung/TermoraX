import type { PropsWithChildren, ReactNode } from "react";

interface PanelProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function Panel({ title, subtitle, actions, className, children }: PanelProps) {
  return (
    <section className={["panel", className].filter(Boolean).join(" ")}>
      <header className="panel__header">
        <div>
          <p className="panel__eyebrow">{title}</p>
          {subtitle ? <h2 className="panel__title">{subtitle}</h2> : null}
        </div>
        {actions ? <div className="panel__actions">{actions}</div> : null}
      </header>
      <div className="panel__body">{children}</div>
    </section>
  );
}
