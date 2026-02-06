
# Technical Documentation: EntityTimer

## 1. Overview
EntityTimer is a client-side tool that generates modular YAML packages for Home Assistant. It automates the creation of countdown timers, safety shut-offs, and dashboard controls for controllable devices.

## 2. Mandatory Setup (READ CAREFULLY)
Home Assistant does not support modular files by default. You must enable "Packages" and "Dir Lists" before you can use the code from this app.

### Step A: Install the File Editor
Go to **Settings > Add-ons** and install the [File Editor](https://www.home-assistant.io/addons/configurator/) add-on or [VS Code (Studio Code Server)](https://github.com/hassio-addons/addon-vscode). 

### Step B: Create Required Folders
Using your file editor, navigate to your `/config/` folder and create:
*   `packages/`
*   `automations/`
*   `scripts/`

### Step C: Update configuration.yaml
Add these lines at the top level:

```yaml
homeassistant:
  packages: !include_dir_named packages/

automation: !include_dir_list automations/
script: !include_dir_list scripts/
```

### Step D: Reload YAML Configuration
After editing `configuration.yaml` or adding new files to the folders above:
1. Go to **Developer Tools** in your Home Assistant sidebar.
2. Navigate to the **YAML** tab.
3. Click **Reload All YAML Configuration** (or restart Home Assistant if it's your first time setting up packages).

## 3. The Architecture of Reliability
EntityTimer uses a **Modular Package** approach:
*   **Watchdog Security**: Uses the `timer` integration instead of `delay` commands, ensuring safety even after a system restart.
*   **Atomic Logic**: One device = one file. This prevents "spaghetti code" and makes maintenance simple.
*   **Zero Collisions**: Uses unique slug-based namespacing for all entities.

## 4. Self-Hosting & Development

### Requirements
*   **Node.js**: v18 or higher.
*   **NPM**: v9 or higher.
*   **Google Gemini API Key**: Required for the "Drop Screen" vision discovery.

### Development Workflow
1.  **Clone**: `git clone https://github.com/johnruciak/Home-assistant-timer-builder/`
2.  **Install**: `npm install`
3.  **Local Dev**: `npm run dev`
4.  **Production Build**: `npm run build`

### Environment Variables
The application expects `process.env.API_KEY` to be available. In a self-hosted environment, you can provide this via a `.env` file or through the UI's activation dialog.

## 5. Roadmap for Better Integration
1.  **Direct API Sync**: Implement `hass.callService` via the Home Assistant WebSocket API to eliminate the need for manual copy-pasting.
2.  **Add-on Wrapper**: Package the app as a standard Home Assistant Add-on with Ingress support.
3.  **Visual Blueprinting**: A drag-and-drop editor for complex multi-stage timers.

## 6. License

**MIT License**

Copyright (c) 2025 EntityTimer Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
