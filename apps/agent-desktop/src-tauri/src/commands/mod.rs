/// Basic commands for Phase 1 scaffold

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Bienvenue sur Diplomate.ga, {} !", name)
}

#[tauri::command]
pub fn get_app_info() -> AppInfo {
    AppInfo {
        name: "Diplomate.ga".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        description: "Application desktop pour agents consulaires".to_string(),
    }
}

#[derive(serde::Serialize)]
pub struct AppInfo {
    name: String,
    version: String,
    description: String,
}
