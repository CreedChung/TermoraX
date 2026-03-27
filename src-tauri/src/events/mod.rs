/// Event emitted when a live SSH session produces terminal output or lifecycle changes.
pub const SESSION_EVENT: &str = "workspace://session";
/// Event emitted when a transfer task state changes.
pub const TRANSFER_EVENT: &str = "workspace://transfer";

use serde::Serialize;

/// Incremental terminal output payload emitted by the backend.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionOutputEventPayload {
    pub kind: &'static str,
    pub session_id: String,
    pub stream: &'static str,
    pub chunk: String,
    pub occurred_at: String,
}

/// Session lifecycle payload emitted by the backend.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionStatusEventPayload {
    pub kind: &'static str,
    pub session_id: String,
    pub status: String,
    pub message: Option<String>,
    pub error_code: Option<String>,
    pub occurred_at: String,
}
