# ⏱️ EntityTimer Pro
### Automated "Auto-Off" timers for Home Assistant devices.

**STOP!** Before using this tool, you **must** prepare your Home Assistant configuration. Failure to do so will result in errors when you try to use the generated code.

## ⚠️ Mandatory Prerequisite
Read the **[Technical Documentation & Setup Guide](DOCUMENTATION.md)** first. It explains how to set up the 3 required folders and update your `configuration.yaml`.

---

## 🛠️ How to Use

### 1. Quick Entry
Use this if you already know the technical ID of your device.
*   **Finding the ID**: In Home Assistant, go to **Developer Tools > States**. Look for the `entity_id` column (e.g., `valve.garden_tap`).
*   **Setup**: Paste that ID into the **Quick Entry** box on the home screen.

![Quick Entry Interface Placeholder](https://placehold.co/800x400/0f172a/6366f1?text=Step+1:+Quick+Entry+Interface)
*Caption: Simply paste your Entity ID and click Configure.*

### 2. Entity Sync (Recommended)
Sync your device list so you can pick from a menu instead of typing IDs.
*   **Via HACS (Best)**: Install the [Entity Exporter Card](https://github.com/scharc/ha-entity-exporter-card) via [HACS](https://hacs.xyz/). Copy the JSON it generates and paste it into the **Sync Library**.
*   **Manual**: Go to **Developer Tools > States**, copy the entire table, and paste it into the "Manual" tab in the Sync Center.

![Entity Sync Interface Placeholder](https://placehold.co/800x400/0f172a/6366f1?text=Step+2:+Entity+Sync+Center)
*Caption: Syncing your devices allows for one-click selection from your existing Home Assistant library.*

### 3. Drop Screen (Experimental)
*   **How it works**: Take a screenshot of your Home Assistant dashboard and drop it onto this page. Our AI (Gemini 3 Pro) will attempt to identify your buttons and map them to technical IDs.
*   **Note**: This feature is experimental and requires a high-resolution screenshot to work reliably.

![Drop Screen Interface Placeholder](https://placehold.co/800x400/0f172a/6366f1?text=Step+3:+Drop+Screen+AI+Vision)
*Caption: Drag and drop a screenshot of your dashboard to let AI identify controllable entities.*

## 🚀 Activation & Privacy
This is a **Bring Your Own Key** application.
1.  Get a free API key from [Google AI Studio](https://aistudio.google.com/).
2.  Click **Activate** in the app.
3.  **Privacy**: Your data stays in your browser. It is sent directly to Google's AI servers and is never stored by this application.

## 📁 Repository
Check out the source code and contribute here: [GitHub Repository](https://github.com/your-username/ha-entity-timer-pro)

---
**Build your smarter home today, one timer at a time.**

> **Note to Developer**: Actual screenshots can be provided upon request to replace these placeholders.