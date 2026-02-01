# Technical Documentation: EntityTimer Pro

## 1. Overview
EntityTimer Pro is a client-side tool that generates modular YAML packages for Home Assistant. It automates the creation of countdown timers, safety shut-offs, and dashboard controls for controllable devices.

## 2. Mandatory Setup (READ CAREFULLY)
Home Assistant does not support modular files by default. You must enable "Packages" and "Dir Lists" before you can use the code from this app.

### Step A: Install the File Editor
Go to **Settings > Add-ons** and install the **File Editor** add-on. Ensure it is started and "Show in sidebar" is checked.

### Step B: Create Required Folders
Using the File Editor, navigate to your `/config/` directory. You **MUST** create these three folders exactly as named. **Home Assistant will crash if you try to proceed to Step C before these folders exist.**

1. `packages/`
2. `automations/`
3. `scripts/`

### Step C: Update configuration.yaml
Open your `configuration.yaml` in the File Editor and add these lines at the top level:

```yaml
homeassistant:
  packages: !include_dir_named packages/

automation: !include_dir_list automations/
script: !include_dir_list scripts/
```

## 3. How the Generated Code Works
The app generates a "Modular Package." Unlike standard automations, these are self-contained:
*   **Input Number**: Creates a slider on your dashboard to adjust the time (e.g., 10 mins vs 60 mins).
*   **Timer**: A backend entity that handles the actual countdown.
*   **Script**: The logic that turns the device ON and starts the countdown simultaneously.
*   **Automation**: The safety "watchdog" that triggers when the timer hits zero to turn the device OFF.

## 4. AI Engine Details
*   **Model**: Google Gemini 3 Pro.
*   **Vision**: Used in the "Drop Screen" to map UI elements to technical `entity_id` strings.
*   **Logic**: Used to ensure YAML syntax is 100% compliant with Home Assistant's strict formatting.

## 5. License

**MIT License**

Copyright (c) 2025 EntityTimer Pro Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.