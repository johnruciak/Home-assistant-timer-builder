# EntityTimer Pro for Home Assistant

**EntityTimer Pro** is a high-performance web application designed for Home Assistant power users. It leverages Google Gemini AI to transform visual dashboard screenshots or technical entity lists into modular, production-ready YAML configuration blocks for countdown timers.

## 🏗️ Architecture

The application follows a "Stateless Architect" pattern:
1.  **Vision Layer**: Uses `gemini-3-pro-preview` to parse image data, identifying UI elements and mapping them to Home Assistant's technical domain structure.
2.  **Logic Engine**: Generates non-linear YAML components. Instead of flat configurations, it produces modular "Packages" that separate concerns (UI vs. Logic vs. State).
3.  **Modular Deployment**: Specifically optimized for Home Assistant's `!include` directives, allowing users to drop files into specific folders without polluting `configuration.yaml`.

## 📋 Prerequisites

Before deploying the generated code, ensure your Home Assistant instance is configured for modularity:

### 1. Enable Packages
Your `configuration.yaml` must support packages. This is the modern standard for grouping logic by device or function.
*   **Documentation**: [Home Assistant Packages](https://www.home-assistant.io/docs/configuration/packages/)
*   **Setup**: Ensure you have `packages: !include_dir_named packages/` under the `homeassistant:` block.

### 2. Directory Splitting
The generated code assumes you use folder-based organization for scripts and automations:
*   [Splitting the Configuration Guide](https://www.home-assistant.io/docs/configuration/splitting_configuration/)
*   Required includes:
    ```yaml
    automation: !include_dir_list automations/
    script: !include_dir_list scripts/
    ```

### 3. Google API Key
This app requires a valid Google Gemini API Key with access to Vision models.
*   **Get a Key**: [Google AI Studio](https://aistudio.google.com/)

## ⚙️ Operational Options

### Discovery Methods
*   **AI Vision Scan**: Drop a screenshot of your dashboard. The AI identifies entities like Valves, AC units, and Switches.
*   **Sync Exporter Card**: A custom YAML block provided in the app that you can add to your HA dashboard to "Copy-Paste" your entire entity list for high-precision mapping.
*   **Manual Entry**: Direct `domain.entity_id` input for fast-track users.

### Timer Logic Options
*   **Safety Timers**: (Optional) Logic that ensures devices turn off even if the Home Assistant core restarts during a countdown.
*   **Climate Strategy**: For `climate` entities, the app generates specific sequences to set `hvac_mode` and `temperature` before initiating the timer.

## 🛠️ Self-Hosting Instructions

EntityTimer Pro is a static React application. You can host it yourself easily:

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/ha-entity-timer-pro.git
    cd ha-entity-timer-pro
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Setup**:
    Create a `.env` file or set the environment variable:
    ```bash
    API_KEY=your_google_gemini_api_key_here
    ```
4.  **Launch**:
    ```bash
    npm run dev
    ```

## 🍴 Forks & Community Contributions

We highly encourage forking this project! 

**Specific Challenge to the Community:**
We would love to see forks that **remove the dependency on the Google Gemini API**. If you have expertise in local LLMs (like Ollama) or advanced pattern matching/OCR that can run entirely client-side or on a local server, please fork and share your version. The goal is 100% privacy and offline functionality.

## 📄 License

This project is licensed under the **MIT License**. 

This is one of the most unrestrictive licenses available. You are free to:
*   **Use** the software for any purpose.
*   **Modify** the code to suit your needs.
*   **Distribute** your modifications.
*   **Sublicense** the software.

*The only requirement is that the original copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.*

---

**EntityTimer Pro** is a community tool. Built by HA users, for HA users.