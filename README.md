# ⏱️ EntityTimer Pro
### Add "Auto-Off" timers to Home Assistant devices without writing code.

EntityTimer Pro generates the YAML configuration needed to add countdown timers to your Home Assistant switches, valves, lights, and climate units. It is designed for new users who want modular, safe automations without learning complex syntax.

## 🛠️ How to Use

### 1. Quick Entry (Fastest)
Use this if you already know the technical ID of your device.
*   **Where to find the ID**: In Home Assistant, go to **Developer Tools > States**. Look for the `entity_id` column (e.g., `switch.living_room_fan` or `valve.garden_tap`).
*   **How to setup**: Paste the ID into the "Quick Entry" field in this app and set your desired duration.

### 2. Entity Sync (Bulk Selection)
Use this to import your device list so you can set up multiple timers quickly.
*   **How to get the list**: 
    1.  Go to **Developer Tools > States** in Home Assistant.
    2.  Highlight and copy the text in the states table.
    3.  Click **Entity Sync** in this app and paste the text into the "Manual" tab.
*   **Alternative**: Use a custom JSON exporter card (link provided in the app) for a cleaner sync.

### 3. Drop Screen (Experimental)
This uses AI Vision to "read" your dashboard.
*   **How it works**: Take a screenshot of your Home Assistant dashboard and drop it into the app.
*   **Note**: This is an **experimental feature**. It works best with high-resolution screenshots. It requires your Google Gemini API key to be linked to a project with billing enabled (even if usage stays within the free tier).

## 🚀 Activation
This application uses a **Bring Your Own Key** model. Your home data never leaves your browser except to talk directly to Google's AI service.
1.  Generate a key at [Google AI Studio](https://aistudio.google.com/).
2.  Click **Activate** in the app and paste your key.
3.  The key is stored safely in your browser's local storage.

## 📦 Installation in Home Assistant
The app provides "Modular Packages." Before using the generated code, ensure your `configuration.yaml` is set up to read from folders:
```yaml
homeassistant:
  packages: !include_dir_named packages/

automation: !include_dir_list automations/
script: !include_dir_list scripts/
```
Detailed steps are available in the [Technical Documentation](DOCUMENTATION.md).

---
**Build your smarter home today, one timer at a time.**