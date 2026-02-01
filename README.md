# ⏱️ EntityTimer Pro
### Automated "Auto-Off" timers for Home Assistant devices.

**🛑 STOP! DO NOT SKIP THIS.** 
Before using this tool, you **must** prepare your Home Assistant configuration. Failure to do so will result in errors or a system crash when you try to use the generated code.

## ⚠️ Mandatory Prerequisite
Read the **[Technical Documentation & Setup Guide](DOCUMENTATION.md)** first. It explains how to set up the 3 required folders and update your `configuration.yaml` with the necessary include directives.

---

## 🛠️ How to Use

### 1. Quick Entry
Use this if you already know the technical ID of your device (e.g., from the States dev tool).

> **🖥️ Visual Guide: Quick Entry**
> *The "Quick Entry" interface is a focused modal where you can directly paste an entity ID like `valve.garden_tap` or `switch.pool_pump` to begin configuration immediately.*

*   **Setup**: Paste your Entity ID into the **Quick Entry** box on the home screen and hit **Configure**.

### 2. Entity Sync (Recommended)
Sync your device list so you can pick from a menu instead of typing IDs.

*   **Step A: Install Exporter**: Use [Entity Exporter Card](https://github.com/scharc/ha-entity-exporter-card) via **HACS**. 
*   **Step B: Generate JSON**: Add the card to your dashboard, select your domains (Valves, Lights, etc.), and copy the generated JSON.

> **📊 Visual Guide: Sync Center**
> *The Sync Center organizes your Home Assistant devices into categories (Valves, Climate, Lights, etc.) allowing you to click any device to instantly load its timer configuration.*

*   **Step C: Import**: Paste that JSON into the **Entity Sync Center** in this app to populate your local library.

### 3. Drop Screen (Experimental)
*   **How it works**: Take a screenshot of your Home Assistant dashboard and drop it onto the app.
*   **AI Vision**: Our AI (Gemini 3 Pro) scans the image, identifies buttons/toggles, and attempts to map them to technical IDs automatically.

---

## 🚀 Activation & Privacy
This is a **Bring Your Own Key** application.
1.  **Get a Key**: Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).
2.  **Activate**: Click the **Activate** button in the app to connect the AI engine.
3.  **Privacy**: Your data stays in your browser. Images and IDs are sent directly to Google's AI servers via encrypted SSL and are never stored or seen by this application's creators.

## 📁 Repository & Contributing
Found a bug or want to add a feature? 
Check out the source: [GitHub Repository](https://github.com/your-username/ha-entity-timer-pro)

---
**Build your smarter home today, one timer at a time.**

<!-- 
NOTE TO MAINTAINER: 
To restore screenshots, upload files named 'quick_entry.png', 'exporter_card.png', 
and 'sync_center.png' to the root directory and update the markdown tags. 
-->