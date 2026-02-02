# ⏱️ EntityTimer Pro
### The "Auto-Off" Timer Architect for Home Assistant

**EntityTimer Pro** is a specialized web-based tool designed to build reliable, high-performance timers for your smart home. If you have a water valve, space heater, or garden pump that you *never* want to accidentally leave on, this tool generates the "Watchdog" code needed to ensure they always shut off.

---

## 🚀 Quick Start: How to use this tool

### 1. This is a Web App (No Installation)
You do not need to install this app on your computer or your Home Assistant server. You run it right here in your browser. It acts like a "factory" that produces custom YAML code for you to copy into your Home Assistant.

### 2. Connect the "Brain" (API Key)
To use the AI features (like dropping a screenshot to detect buttons), the app needs a connection to Google's AI engine.
*   **Cost**: It is free for most home users.
*   **Get a Key**: Visit [Google AI Studio](https://aistudio.google.com/) and click **"Get API Key"**.
*   **Activate**: Paste that key into the **Activate** button in this app. 
*   *Why?* We don't charge you for our service, so we use the "Bring Your Own Key" model to keep the tool free and private for everyone.

### 3. Generate your Code
Choose your device (by name, ID, or screenshot), set your preferred duration, and click **Construct**.

---

## 🛠️ Home Assistant Setup (One-Time)

Before the generated code will work, you must tell Home Assistant to look for the new files.

### 1. Create Folders
Using the **File Editor** add-on in Home Assistant, create these folders in your `/config/` directory:
*   `packages/`
*   `automations/`
*   `scripts/`

### 2. Link the Folders
Open your `configuration.yaml` file and add these lines at the very top:

```yaml
homeassistant:
  packages: !include_dir_named packages/

automation: !include_dir_list automations/
script: !include_dir_list scripts/
```

**⚠️ Important:** After adding these lines, **Restart Home Assistant.** You only ever have to do this once!

---

## 🔒 Privacy & Security
*   **No HA Access**: This app **never** asks for your Home Assistant password or URL. It does not connect to your house directly.
*   **Browser-Based**: All processing happens in your browser. 
*   **Encryption**: When you upload a screenshot for the AI to scan, it is sent over an encrypted (SSL) connection directly to Google's AI servers and is not stored by us.

---
**Ready to build?** [Open the Documentation](DOCUMENTATION.md) for a deeper look at how the safety logic works.