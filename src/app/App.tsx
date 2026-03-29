import { WorkspaceShell } from "../features/workspace/components/WorkspaceShell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useWorkspaceApp } from "./useWorkspaceApp";
import { t } from "../shared/i18n";

function App() {
  const controller = useWorkspaceApp();

  if (controller.state.isLoading) {
    return (
      <div className="boot-screen px-4">
        <Card className="w-full max-w-md border border-app-border bg-app-surface/95 text-app-text shadow-[var(--shadow)] backdrop-blur">
          <CardHeader className="text-center">
            <p className="boot-screen__eyebrow">{t("app.name")}</p>
            <CardTitle className="text-3xl">{t("app.boot")}</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-app-muted">
            SSH / SFTP workspace
          </CardContent>
        </Card>
      </div>
    );
  }

  return <WorkspaceShell controller={controller} />;
}

export default App;
