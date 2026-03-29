# Conventions for TermoraX Workspace UI

## Tech Stack
- React 19 + TypeScript + Vite
- TailwindCSS v4 with custom theme
- shadcn/ui components
- Tauri 2 desktop integration

## File Structure Patterns
- Domain-based organization under `src/features/`
- Bootstrap code in `src/app/`
- Shared types in `src/entities/`
- Reusable primitives in `src/shared/`
- UI primitives in `src/components/ui/`

## Naming Conventions
- Components: PascalCase (e.g., `WorkspaceShell.tsx`)
- CSS classes: BEM-like with kebab-case (e.g., `workspace-pane--left`)
- CSS variables: kebab-case (e.g., `--app-surface`)
- TypeScript types: PascalCase with type suffix (e.g., `WorkspaceShellProps`)

## Localization
- Baseline: Simplified Chinese (zh-CN)
- Use `t("key")` from `src/shared/i18n`
- All user-facing text must be localized

## Code Style
- English comments in code
- Simplified Chinese for UI text
- Documentation in English

## Key Components
- WorkspaceShell: Main shell with 3-panel layout
- ConnectionSidebar: Left sidebar for connections
- TerminalWorkspace: Terminal tabs and panes
- FilePanel: SFTP file manager
- TransferPanel: File transfer tasks
- SnippetPanel: Code snippets
- HistoryPanel: Command history
- LogPanel: Application logs
