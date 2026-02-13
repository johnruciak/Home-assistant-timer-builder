# ⏱️ EntityTimer
### Precise "Auto-Off" Logic for Home Assistant via Data-Driven Discovery.

**EntityTimer** generates industrial-grade Home Assistant YAML packages. While it can "guess" entities from screenshots, its true power lies in importing your real system state via JSON, ensuring 100% accuracy for entity IDs and names.

---

## 🎨 The Result: The Ultimate Timer Card
When you deploy an EntityTimer package, you get a clean, functional control set for your dashboard:

```text
+------------------------------------------+
|  Sonoff Water Valve                      |
|                                          |
|  [⚡] Switch State                ( OFF ) |
|  [⏱️] Countdown                      Idle |
|                                          |
|  [🕒] Duration (Minutes)  [---●-------] 30|
|                                          |
|  Start Timer Manually            [ START ]|
+------------------------------------------+
```
*Generated YAML bundles the logic, the timer, the slider, and the scripts into one package.*

---

## 🚀 The Pro Workflow (Recommended)

To ensure your timers actually work, skip the visual guessing and use the **Entity Exporter** method.

### 1. Install Entity Exporter
To get your real entity list into this tool:
1. Go to your Home Assistant **Developer Tools** > **States**.
2. This tool supports raw JSON from the states list. 
3. (Optional) For a cleaner experience, use the **[Entity Exporter](https://github.com/thomasloven/hass-browser-mod)** or similar tools to fetch your state machine.
4. **Copy the JSON** from the Developer Tools States page (or download via the `states` API).

### 2. Import to EntityTimer
1. Open the **Library** in this app.
2. Switch to the **Import JSON** tab.
3. Paste your states JSON or drop the file.
4. All your real `switch.*`, `valve.*`, and `light.*` entities are now instantly available with zero typos.

---

## ✨ Key Features

- **💎 Data-Driven Precision**: Import your actual HA state JSON to eliminate entity ID typos.
- **🛡️ Watchdog Security**: Uses the native `timer` integration (not simple "delays"). Your device turns off even if Home Assistant restarts.
- **📅 Advanced Scheduling**: Built-in support for Sunrise/Sunset triggers and daily/weekly recurrence.
- **❄️ Climate Intelligence**: Specialized logic for AC units—sets target temperatures and resets HVAC modes automatically.
- **📸 Visual Guessing (Party Trick)**: Drop a screenshot to have the AI *attempt* to identify your UI. Great for quick demos, but use JSON for production.

---

## 🛠️ Mandatory Home Assistant Setup

You must enable **Packages** in your `configuration.yaml` to use the generated code:

```yaml
homeassistant:
  packages: !include_dir_named packages/
```

1. Create a `packages/` folder in your `/config/` directory.
2. Drop the generated `.yaml` file from this app into that folder.
3. **Developer Tools > YAML > Check Configuration**.
4. **Reload All YAML Configuration**.

---

## 🧠 Why Packages?
EntityTimer uses **Packages** to keep your system clean. Instead of hunting through three different files for one timer, everything—the timer, the input slider, the automations, and the scripts—is bundled into **one single file per device**. 

**Portability**: Want to move a timer to another system? Just copy the file.

---

**License**: MIT - Created for the Home Assistant Community.