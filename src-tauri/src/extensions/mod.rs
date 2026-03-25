use crate::models::ExtensionContribution;

pub fn builtin_extensions() -> Vec<ExtensionContribution> {
    vec![
        ExtensionContribution {
            id: "builtin.sidebar.files".into(),
            title: "Remote Files".into(),
            kind: "sidebarPanel".into(),
            description: "Built-in SFTP browser contribution.".into(),
            entrypoint: "features/sftp/components/FilePanel".into(),
        },
        ExtensionContribution {
            id: "builtin.sidebar.snippets".into(),
            title: "Command Snippets".into(),
            kind: "sidebarPanel".into(),
            description: "Snippet management contribution.".into(),
            entrypoint: "features/snippets/components/SnippetPanel".into(),
        },
        ExtensionContribution {
            id: "builtin.protocol.ssh".into(),
            title: "SSH Adapter".into(),
            kind: "connectionProtocol".into(),
            description: "Primary protocol adapter contract for terminal sessions.".into(),
            entrypoint: "services/ssh".into(),
        },
    ]
}
