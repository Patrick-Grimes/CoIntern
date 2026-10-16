use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .on_window_event(|window, event| {
      // One window; close quits the app (including macOS Dock behavior).
      if let tauri::WindowEvent::CloseRequested { .. } = event {
        window.app_handle().exit(0);
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running ApplyOS");
}
