
# ⏱️ EntityTimer
### Add a timer to any Home Assistant device in seconds.

**EntityTimer** is a simple tool designed to solve a common problem: forgetting to turn things off. Whether it's a water valve, a space heater, or a pool pump, this tool builds the code needed to give any device a reliable "Auto-Off" timer.

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

---

## 🏠 Self-Hosting
Want to run this locally or on your own server?
1. **Clone & Install**: `git clone` the repo and run `npm install`.
2. **Set Environment**: Ensure you have a Google Gemini API Key.
3. **Build**: Run `npm run build` to generate the static site.
4. **Deploy**: Host the resulting `dist/` folder on any web server (NGINX, Caddy, etc.).

---

## 🗺️ Roadmap: The Future of EntityTimer
We are looking for contributors! Help us move toward these goals:
*   **HACS Integration**: Transform this into a native Home Assistant dashboard card.
*   **Blueprint Generator**: Option to output Home Assistant Blueprints instead of Packages for easier sharing.
*   **Websocket Sync**: Direct connection to your HA instance (via Long Lived Access Token) for real-time entity selection.
*   **Multi-Timer Management**: A dashboard view to see all currently active timers in one place.

---

## 🤝 Contributing & Forking
This project is open-source. We encourage you to **fork this repository**, add your own logic, and submit Pull Requests. If you've improved the "Watchdog" logic or added support for new domains, we want to see it!

---
**Build your first timer now.** [Open Documentation](DOCUMENTATION.md) for detailed safety logic and self-hosting info.
