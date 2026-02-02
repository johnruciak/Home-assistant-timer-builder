# ⏱️ EntityTimer Pro
### Automated "Auto-Off" timers for Home Assistant devices.

**🛑 ACTION REQUIRED: Prepare Home Assistant**
This app generates modular YAML files. Before you can use the generated code, you **must** prepare your Home Assistant folders and configuration.

## 🛠️ Mandatory Setup (One-Time)

### 1. Create Required Folders
Using the [File Editor](https://www.home-assistant.io/addons/configurator/) or [VS Code (Studio Code Server)](https://github.com/hassio-addons/addon-vscode) add-on in Home Assistant, navigate to your `/config/` directory (the root folder where `configuration.yaml` is located) and create these three folders:
*   `packages/`
*   `automations/`
*   `scripts/`

### 2. Update configuration.yaml
Open your `configuration.yaml` file and add the following lines. This tells Home Assistant to automatically load any files you place in the new folders.

```yaml
homeassistant:
  packages: !include_dir_named packages/

automation: !include_dir_list automations/
script: !include_dir_list scripts/
```

**⚠️ Initial Activation:**
After saving `configuration.yaml` for the first time, you **must Restart Home Assistant** to activate the new folder links. 

*Once this setup is finished, you do NOT need to restart again. You can simply use **Developer Tools > YAML > Reload All YAML Configuration** to activate any new timers you download.*

---

## 🚀 How to Use

### 1. Quick Entry
Use this if you already know the technical ID of your device (e.g., `switch.garden_pump`).

*   **Setup**: Paste your Entity ID into the **Quick Entry** box on the home screen and hit **Configure**.

### 2. Entity Sync (Recommended)
Sync your device list so you can pick from a menu instead of typing IDs.

*   **Step A: Install Exporter**: Use [Entity Exporter Card](https://github.com/scharc/ha-entity-exporter-card) via [HACS](https://hacs.xyz/). 
*   **Step B: Generate JSON**: Add the card to your dashboard, select your domains (Valves, Lights, etc.), and copy the generated JSON.
*   **Step C: Import**: Paste that JSON into the **Entity Sync Center** in this app to populate your local library.

### 3. Drop Screen (Experimental)
*   **How it works**: Take a screenshot of your Home Assistant dashboard and drop it onto the app.
*   **AI Vision**: Our AI (Gemini 3 Pro) scans the image, identifies buttons/toggles, and attempts to map them to technical IDs automatically.

---

## 🔑 Activation & Privacy
This is a **Bring Your Own Key** application.
1.  **Get a Key**: Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).
2.  **Activate**: Click the **Activate** button in the app to connect the AI engine.
3.  **Privacy**: Your data stays in your browser. Images and IDs are sent directly to Google's AI servers via encrypted SSL.

## 📁 Repository
Check out the source: [GitHub Repository](https://github.com/johnruciak/Home-assistant-timer-builder)

---
**Build your smarter home today, one timer at a time.**