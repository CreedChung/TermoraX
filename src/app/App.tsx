import { WorkspaceShell } from "../features/workspace/components/WorkspaceShell";
import { useWorkspaceApp } from "./useWorkspaceApp";

function App() {
  const controller = useWorkspaceApp();

  if (controller.state.isLoading) {
    return (
      <div className="boot-screen">
        <p className="boot-screen__eyebrow">TermoraX</p>
        <h1>Preparing workspace state…</h1>
      </div>
    );
  }

  return <WorkspaceShell controller={controller} />;
}

export default App;
