import { Badge } from "@/components/ui/badge";
import type { SessionStatus } from "../../entities/domain";
import { t } from "../i18n";

interface StatusBadgeProps {
  status: SessionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant = (() => {
    switch (status) {
      case "connected":
        return "secondary";
      case "connecting":
      case "idle":
        return "outline";
      case "disconnected":
        return "destructive";
      default:
        return "outline";
    }
  })();

  return <Badge variant={variant}>{t(`status.${status}`)}</Badge>;
}
