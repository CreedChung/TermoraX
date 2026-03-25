mod app;
mod commands;
mod error;
mod events;
mod extensions;
mod models;
mod services;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    app::run();
}
