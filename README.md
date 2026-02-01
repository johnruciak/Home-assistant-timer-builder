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
*   **Valve-Awareness**: Smart detection for Sonoff or Zigbee water valves, applying specific iconography (`mdi:water-pump`) and safety checks.

## 🚀 Deployment Workflow
1.  **Scan/Select** your target entity.
2.  **Configure** your desired default duration.
3.  **Construct** the system to generate the 4 modular blocks.
4.  **Download/Copy** each file into its respective Home Assistant folder (`packages/`, `scripts/`, `automations/`).
5.  **Reload** Home Assistant YAML configuration.