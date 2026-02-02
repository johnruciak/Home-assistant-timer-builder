# ⏱️ EntityTimer Pro
### Add a timer to any Home Assistant device in seconds.

**EntityTimer Pro** is a simple tool designed to solve a common problem: forgetting to turn things off. Whether it's a water valve, a space heater, or a pool pump, this tool builds the code needed to give any device a reliable "Auto-Off" timer.

---

## 🚀 How it works

1.  **Select your device**: Paste an ID, pick from your synced library, or drop a screenshot of your dashboard.
2.  **Set the time**: Use the slider to choose your auto-off duration (e.g., 30 minutes).
3.  **Get the code**: Copy the generated YAML blocks into your Home Assistant folders.

---

## 🛠️ One-Time Setup

Before you use the code, your Home Assistant needs to be ready to accept modular files.

### 1. Create the folders
In your `/config/` directory, create these three folders:
*   `packages/`
*   `automations/`
*   `scripts/`

### 2. Update configuration.yaml
Add these lines to the top of your `configuration.yaml` and **Restart Home Assistant**:

```yaml
homeassistant:
  packages: !include_dir_named packages/

automation: !include_dir_list automations/
script: !include_dir_list scripts/
```

*Once this is done, you never need to restart again. Just click "Reload YAML" in Developer Tools when adding new timers.*

---

## 🔒 Private & Free
*   **No Login**: We don't want your Home Assistant credentials. All work happens in your browser.
*   **Bring Your Own Key**: Use a free Google Gemini API key to power the dashboard-scanning AI. 
*   **Encrypted**: Your data is yours. Screenshots are processed securely and never stored.

---
**Build your first timer now.** [Open Documentation](DOCUMENTATION.md) for detailed safety logic info.