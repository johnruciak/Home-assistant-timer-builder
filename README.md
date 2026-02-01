# EntityTimer Pro for Home Assistant

**EntityTimer Pro** is a high-performance web application designed for Home Assistant power users. It leverages Google Gemini AI to transform visual dashboard screenshots or technical entity lists into modular, production-ready YAML configuration blocks for countdown timers.

## 🚀 Bring Your Own Key (BYOK)
This application is designed for 100% privacy and portability. It does **not** store your API keys on any server.
*   **Privacy**: Your API key is stored only in your browser's LocalStorage and used directly with Google's API.
*   **Cost**: You use your own Google Cloud project (Free or Paid tier).
*   **Hosting**: Can be hosted on GitHub Pages, Vercel, or locally without any backend configuration.

**[Launch Live App](https://your-username.github.io/ha-entity-timer-pro)** (Replace with your actual GitHub Pages URL)

## 🛠️ Setup Instructions
1.  **Get a Key**: Visit [Google AI Studio](https://aistudio.google.com/) and create an API key.
2.  **Activation**: When you first open the app, click **"Activate"**. This will open the official Google AI Studio key selection dialog.
3.  **Requirements**: For Vision features (Drop Screen), ensure your Google Cloud project is associated with a "Paid" tier (the free quota still applies, but Vision models require a billing-enabled project in many regions).

## 🏗️ Architecture
The application follows a "Stateless Architect" pattern:
1.  **Vision Layer**: Uses `gemini-3-pro-preview` to parse image data, identifying UI elements and mapping them to Home Assistant's technical domain structure.
2.  **Logic Engine**: Generates non-linear YAML components. Instead of flat configurations, it produces modular "Packages" that separate concerns.
3.  **Modular Deployment**: Optimized for Home Assistant's `!include` directives.

## 📋 Entity Sync Requirements
To use the **Entity List / Sync** function:
1.  **HACS Card**: Install the [Custom Entity Exporter Card](https://github.com/scharc/ha-entity-exporter-card) to export your JSON in one click.
2.  **Manual**: Copy the table from **Developer Tools > States** and paste it into the "Manual States" tab.

## 📋 Prerequisites for YAML
Your `configuration.yaml` must support packages:
```yaml
homeassistant:
  packages: !include_dir_named packages/

automation: !include_dir_list automations/
script: !include_dir_list scripts/
```

## 🍴 Forks & Community
We highly encourage forking! We especially welcome forks that integrate **Local LLMs (Ollama/LocalAI)** to remove the cloud dependency entirely for 100% local Home Assistant environments.

## 📄 License
Licensed under the **MIT License**. Use it, change it, fork it, sell it—just keep the original copyright notice.

---
Built by HA users, for HA users.