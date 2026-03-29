import type { PropsWithChildren, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PanelProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function Panel({ title, subtitle, actions, className, children }: PanelProps) {
  return (
    <Card className={cn("panel border border-app-border bg-app-surface/90 text-app-text shadow-none", className)}>
      <CardHeader className="panel__header flex flex-row items-start justify-between gap-4">
        <div>
          <p className="panel__eyebrow">{title}</p>
          {subtitle ? <CardTitle className="panel__title">{subtitle}</CardTitle> : null}
        </div>
        {actions ? <div className="panel__actions">{actions}</div> : null}
      </CardHeader>
      <CardContent className="panel__body">
        {!subtitle ? <CardDescription className="sr-only">{title}</CardDescription> : null}
        {children}
      </CardContent>
    </Card>
  );
}
