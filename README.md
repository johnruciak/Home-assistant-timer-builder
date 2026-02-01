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

![Quick Entry UI Placeholder](https://placehold.co/800x400/0f172a/6366f1?text=Step+1:+Quick+Entry+Interface)
*Caption: Simple, focused entry for known Entity IDs.*

*   **Setup**: Paste that ID into the **Quick Entry** box on the home screen and hit Configure.

### 2. Entity Sync (Recommended)
Sync your device list so you can pick from a menu instead of typing IDs.
*   **Via HACS (Best)**: Install the [Entity Exporter Card](https://github.com/scharc/ha-entity-exporter-card) via **HACS**. 
*   **How to Sync**: Open the Entity Exporter card in your dashboard, select your domains (Valves, Lights, etc.), and copy the generated JSON.

![Entity Exporter UI Placeholder](https://placehold.co/800x400/0f172a/6366f1?text=Step+2:+HA+Entity+Exporter+Card)
*Caption: Use the Entity Exporter card in HA to quickly grab your device list.*

*   **Importing**: Paste that JSON into the **Entity Sync Center** in this app.

![Sync Center UI Placeholder](https://placehold.co/800x400/0f172a/6366f1?text=Step+3:+Entity+Sync+Center)
*Caption: The Sync Center processes your JSON and organizes devices into controllable categories.*

### 3. Drop Screen (Experimental)
*   **How it works**: Take a screenshot of your Home Assistant dashboard and drop it onto this page. Our AI (Gemini 3 Pro) will attempt to identify your buttons and map them to technical IDs.

## 🚀 Activation & Privacy
This is a **Bring Your Own Key** application.
1.  Get a free API key from [Google AI Studio](https://aistudio.google.com/).
2.  Click **Activate** in the app. 
3.  **Privacy**: Your data stays in your browser. It is sent directly to Google's AI servers and is never stored by this application.

## 📁 Repository
Check out the source code and contribute here: [GitHub Repository](https://github.com/your-username/ha-entity-timer-pro)

---
**Build your smarter home today, one timer at a time.**