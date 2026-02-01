# EntityTimer Pro for Home Assistant

**EntityTimer Pro** is a high-performance web application designed for Home Assistant power users. It leverages Google Gemini AI to transform visual dashboard screenshots or technical entity lists into modular, production-ready YAML configuration blocks for countdown timers.

## 🚀 Quick Start
You can launch the latest version of the application here:
**[Launch EntityTimer Pro](https://your-deployment-url-here.web.app)** (Replace with actual deployment link)

## 🏗️ Architecture
The application follows a "Stateless Architect" pattern:
1.  **Vision Layer**: Uses `gemini-3-pro-preview` to parse image data, identifying UI elements and mapping them to Home Assistant's technical domain structure.
2.  **Logic Engine**: Generates non-linear YAML components. Instead of flat configurations, it produces modular "Packages" that separate concerns.
3.  **Modular Deployment**: Optimized for Home Assistant's `!include` directives.

## 💰 Pricing & Token Usage
### Can I use the Free Tier?
**Yes.** EntityTimer Pro is fully compatible with the Google Gemini **Free Tier**.

### Will I run out of tokens?
The "Drop Screen" (Vision) function is highly optimized:
*   **Token Usage**: A typical dashboard screenshot analysis consumes approximately **1,000 to 2,000 tokens**.
*   **Limits**: The Gemini free tier currently allows for 15 requests per minute and 1 million tokens per minute (on Flash models). Even on Pro models, the limits are generous enough that a single user will never hit them during normal configuration sessions.
*   **Privacy Note**: Be aware that on the Google "Free" tier, data may be used by Google to improve their products. For 100% privacy, use a "Paid" tier project where data is not used for training.

## 📋 Entity Sync Requirements
To use the **Entity List / Sync** function (the most reliable method), you need:

1.  **Home Assistant Access**: Ability to access the web UI.
2.  **Custom Card (Optional but Recommended)**: The [Custom Entity Exporter Card](https://github.com/scharc/ha-entity-exporter-card) installed via HACS. This allows one-click JSON exporting of your controllable entities.
3.  **Manual Fallback**: If you don't want to install a custom card, you can go to **Developer Tools > States**, highlight the table, copy it, and paste it into the "Manual States Extraction" tab in this app.

## 📋 Prerequisites for YAML
Your `configuration.yaml` must support packages:
*   **Setup**: Ensure you have `packages: !include_dir_named packages/` under the `homeassistant:` block.
*   **Includes**:
    ```yaml
    automation: !include_dir_list automations/
    script: !include_dir_list scripts/
    ```

## 🛠️ Self-Hosting Instructions
1.  **Clone**: `git clone https://github.com/your-username/ha-entity-timer-pro.git`
2.  **Install**: `npm install`
3.  **Launch**: `npm run dev` (Ensure `process.env.API_KEY` is set).

## 🍴 Forks & Community
We highly encourage forking! We especially welcome forks that integrate **Local LLMs (Ollama/LocalAI)** to remove the cloud dependency entirely for 100% local Home Assistant environments.

## 📄 License
Licensed under the **MIT License**. Use it, change it, fork it, sell it—just keep the original copyright notice.

---
Built by HA users, for HA users.