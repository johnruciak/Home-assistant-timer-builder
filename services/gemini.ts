
import { GoogleGenAI, Type } from "@google/genai";
import { DiscoveryResult } from "../types";

const VISION_MODEL = 'gemini-3-pro-preview';
const TEXT_MODEL = 'gemini-3-flash-preview';

const cleanJsonResponse = (text: string) => {
  return text.replace(/```json\n?|```/g, "").trim();
};

export const analyzeImage = async (base64Image: string): Promise<DiscoveryResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const response = await ai.models.generateContent({
    model: VISION_MODEL,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64Image.split(',')[1] || base64Image,
          },
        },
        {
          text: `DASHBOARD DISCOVERY PROTOCOL:
          1. Scan the provided Home Assistant UI for ALL controllable entities.
          2. Identify switches, lights, valves, fans, input_booleans, and script triggers.
          3. Extract technical entity_ids or provide high-probability guesses.
          
          Required JSON Response:
          - entities: Array of { entityId: string, name: string, type: 'switch'|'light'|'valve'|'fan'|'other', icon: string }
          - explanation: Brief summary of findings.
          
          OUTPUT JSON ONLY.`
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          entities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                entityId: { type: Type.STRING },
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                icon: { type: Type.STRING }
              },
              required: ["entityId", "name", "type"]
            }
          },
          explanation: { type: Type.STRING },
        },
        required: ["entities", "explanation"],
      }
    }
  });

  const text = cleanJsonResponse(response.text);
  return JSON.parse(text);
};

export const generateYaml = async (config: {
  deviceName: string,
  entityId: string,
  duration: number,
  safety: boolean,
  helper: boolean
}): Promise<{
  scripts: string,
  automations: string,
  helpers: string,
  dashboard: string
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const slug = config.deviceName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const helperName = `${slug}_timer_duration`;
  const helperEntity = `input_number.${helperName}`;
  const timerName = `${slug}_countdown`;
  const timerEntity = `timer.${timerName}`;
  const scriptEntity = `script.${slug}_run_timer`;
  const domain = config.entityId.split('.')[0] || 'switch';

  const prompt = `Generate Home Assistant YAML for "${config.deviceName}" (${config.entityId}).

IMPORTANT: The user uses a MODULAR YAML structure.
- For Automations and Scripts, DO NOT include the top-level keys. They go into !include_dir_list folders.
- For Helpers (input_number and timer), they should be formatted as a "Package" (containing the domain keys) so they can be saved as a single standalone file in a "packages/" directory.
- Use 2-space indentation.

YAML Content:

1. "helpers" (Save as "packages/${slug}_timer_config.yaml"):
# This is a standalone Package file. It includes the domain keys.
input_number:
  ${helperName}:
    name: "${config.deviceName} Duration"
    min: 1
    max: 240
    step: 1
    initial: ${config.duration}
    unit_of_measurement: "min"
    mode: slider

timer:
  ${timerName}:
    name: "${config.deviceName} Countdown"
    icon: mdi:timer-outline

2. "scripts" (Save as "scripts/timer_${slug}.yaml"):
# No top-level "script:" key.
${slug}_run_timer:
  alias: "Start ${config.deviceName} Timer"
  sequence:
    - service: ${domain}.turn_on
      target:
        entity_id: ${config.entityId}
    - service: timer.start
      target:
        entity_id: ${timerEntity}
      data:
        duration: "00:{{ states('${helperEntity}') | int(default=${config.duration}) }}:00"
  mode: restart

3. "automations" (Save as "automations/timer_${slug}_finished.yaml"):
# No top-level "automation:" key.
alias: "${config.deviceName} Timer Finished"
description: "Automatically turn off the entity when timer ends"
trigger:
  - platform: event
    event_type: timer.finished
    event_data:
      entity_id: ${timerEntity}
action:
  - service: ${domain}.turn_off
    target:
      entity_id: ${config.entityId}

4. "dashboard" (Paste into Manual Card Editor):
type: entities
title: "${config.deviceName} Timer"
entities:
  - entity: ${config.entityId}
    name: "Manual Toggle"
  - entity: ${timerEntity}
    name: "Remaining Time"
  - entity: ${helperEntity}
    name: "Timer Duration (min)"
  - entity: ${scriptEntity}
    name: "Trigger Countdown"
    icon: mdi:play-circle-outline

Return JSON with "scripts", "automations", "helpers", and "dashboard" keys.`;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scripts: { type: Type.STRING },
          automations: { type: Type.STRING },
          helpers: { type: Type.STRING },
          dashboard: { type: Type.STRING },
        },
        required: ["scripts", "automations", "helpers", "dashboard"],
      }
    }
  });

  const text = cleanJsonResponse(response.text);
  return JSON.parse(text);
};
