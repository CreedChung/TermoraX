use tauri::State;

use crate::{
    error::AppResult,
    models::{AppSettings, BootstrapState, CommandSnippet, ConnectionProfile, RemoteFileEntry},
    services::app_state::AppState,
};

#[tauri::command]
pub fn get_bootstrap_state(state: State<'_, AppState>) -> AppResult<BootstrapState> {
    state.snapshot()
}

#[tauri::command]
pub fn save_connection_profile(
    state: State<'_, AppState>,
    profile: ConnectionProfile,
) -> AppResult<BootstrapState> {
    state.save_connection_profile(profile)
}

#[tauri::command]
pub fn delete_connection_profile(
    state: State<'_, AppState>,
    connection_id: String,
) -> AppResult<BootstrapState> {
    state.delete_connection_profile(&connection_id)
}

#[tauri::command]
pub fn save_command_snippet(
    state: State<'_, AppState>,
    snippet: CommandSnippet,
) -> AppResult<BootstrapState> {
    state.save_command_snippet(snippet)
}

#[tauri::command]
pub fn delete_command_snippet(
    state: State<'_, AppState>,
    snippet_id: String,
) -> AppResult<BootstrapState> {
    state.delete_command_snippet(&snippet_id)
}

#[tauri::command]
pub fn save_settings(state: State<'_, AppState>, settings: AppSettings) -> AppResult<BootstrapState> {
    state.save_settings(settings)
}

#[tauri::command]
pub fn reset_settings(state: State<'_, AppState>) -> AppResult<BootstrapState> {
    state.reset_settings()
}

#[tauri::command]
pub fn open_session(state: State<'_, AppState>, connection_id: String) -> AppResult<BootstrapState> {
    state.open_session(&connection_id)
}

#[tauri::command]
pub fn close_session(state: State<'_, AppState>, session_id: String) -> AppResult<BootstrapState> {
    state.close_session(&session_id)
}

#[tauri::command]
pub fn send_session_input(
    state: State<'_, AppState>,
    session_id: String,
    input: String,
) -> AppResult<BootstrapState> {
    state.send_session_input(&session_id, &input)
}

#[tauri::command]
pub fn run_snippet_on_session(
    state: State<'_, AppState>,
    session_id: String,
    snippet_id: String,
) -> AppResult<BootstrapState> {
    state.run_snippet_on_session(&session_id, &snippet_id)
}

#[tauri::command]
pub fn list_remote_entries(
    state: State<'_, AppState>,
    session_id: String,
) -> AppResult<Vec<RemoteFileEntry>> {
    state.list_remote_entries(&session_id)
}
