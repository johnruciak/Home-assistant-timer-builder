# Technical Documentation: EntityTimer Pro

## 1. Overview
EntityTimer Pro is a client-side web application designed to bridge the gap between Home Assistant's UI and its underlying YAML configuration. It utilizes the **Google Gemini 3 Pro** model to perform visual entity mapping and code generation.

## 2. Architecture
The application is built on a **Bring Your Own Key (BYOK)** model. This ensures:
- **Zero Backend**: No user data is stored on external servers.
- **Cost Efficiency**: Users utilize their own API quotas.
- **Portability**: The app can be hosted as a static site (GitHub Pages, etc.).

### Tech Stack
- **Framework**: React 19 (ESM)
- **Styling**: Tailwind CSS (Glassmorphism design system)
- **AI Integration**: `@google/genai` (SDK v1.38.0+)
- **Deployment**: Optimized for GitHub Pages / Static hosting.

## 3. AI Implementation
The app uses two distinct AI pipelines:

### A. Vision Discovery (`analyzeImage`)
- **Model**: `gemini-3-pro-preview`
- **Purpose**: Parses dashboard screenshots to extract technical `entity_id` values.
- **Logic**: Filters for "controllable" domains (valves, lights, switches, climate) and ignores sensors or read-only entities.

### B. YAML Architect (`generateYaml`)
- **Model**: `gemini-3-pro-preview`
- **Purpose**: Generates logically separated YAML blocks.
- **Strategy**: It produces a "Modular Package" which includes:
    1. `input_number`: A helper for the user to adjust duration on the fly.
    2. `timer`: The countdown entity.
    3. `script`: The execution logic that turns on the device and starts the timer.
    4. `automation`: The "Safety" logic that turns the device off when the timer ends.

## 4. Home Assistant Integration
The app promotes a **Package-based** approach for Home Assistant. Instead of dumping everything into `automations.yaml`, it encourages users to use the `!include` directive.

### Recommended Directory Structure
```text
/config
  /packages
    - valve_timer_package.yaml
  /scripts
    - scripts_list.yaml
  /automations
    - automations_list.yaml
  configuration.yaml
```

## 5. Security & Privacy
- **Direct API Communication**: All requests go directly from the client's browser to `generativelanguage.googleapis.com`.
- **Key Management**: Uses the official `window.aistudio` key selection flow.
- **No Persistence**: The app does not maintain a database of entities or screenshots.

## 6. Error Handling
The application includes specialized handling for:
- **API Failures**: Graceful retries and user-friendly error messages.
- **Invalid Keys**: Automatic redirection to the Activation screen if a key is invalid or lacks billing permissions (required for Gemini 3 Pro Vision).
- **ID Collisions**: AI-generated slugs use `entity_id` suffixes to ensure uniqueness.