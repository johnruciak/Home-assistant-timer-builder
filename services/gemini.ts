import { GoogleGenAI, Type } from "@google/genai";
import { DiscoveryResult } from "../types";

const VISION_MODEL = 'gemini-3-pro-preview';
const TEXT_MODEL = 'gemini-3-pro-preview';

const cleanJsonResponse = (text: string) => {
  return text.replace(/```json\n?|```/g, "").trim();
};

export const analyzeImage = async (base64Image: string): Promise<DiscoveryResult> => {
  // Initialize right before use to pick up injected process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
          2. Identify switches, lights, valves, fans, climate units (AC), and scripts.
          3. Extract technical entity_ids or provide high-probability guesses.
          
          Required JSON Response:
          - entities: Array of { entityId: string, name: string, type: 'switch'|'light'|'valve'|'fan'|'climate'|'other', icon: string }
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
  helper: boolean,
  targetTemp?: number,
  hvacMode?: string
}): Promise<{
  scripts: string,
  automations: string,
  helpers: string,
  dashboard: string
}> => {
  // Initialize right before use to pick up injected process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const technicalIdOnly = config.entityId.includes('.') ? config.entityId.split('.')[1] : config.entityId;
  const slug = technicalIdOnly.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const domain = config.entityId.split('.')[0] || 'switch';

  const isValveLikely = config.deviceName.toLowerCase().includes('valve') || config.entityId.toLowerCase().includes('valve') || config.entityId.toLowerCase().includes('swv');

  const prompt = `Generate Home Assistant YAML components for a modular timer system.

INPUT PARAMETERS:
- Name: "${config.deviceName}"
- Entity: "${config.entityId}"
- Domain: "${domain}"
- Slug: "${slug}"
- Duration: ${config.duration} min
- Perception: ${isValveLikely ? 'Treat as Water Valve' : 'Default'}
${domain === 'climate' ? `- Target Temp: ${config.targetTemp}°C\n- HVAC Mode: ${config.hvacMode}` : ''}

RELIABILITY RULES:
1. Target ID: "${config.entityId}".
2. Domain Logic:
   - If domain is 'climate', use 'climate.set_temperature' with hvac_mode: ${config.hvacMode || 'cool'} and temperature: ${config.targetTemp || 21}. Use 'climate.turn_off' to stop.
   - For all others, use standard '${domain}.turn_on' and '${domain}.turn_off'.
3. Modular Sync: 
   - Timer ID: timer.${slug}_countdown
   - Script ID: script.${slug}_run_timer
   - Input Number ID: input_number.${slug}_timer_duration
4. Syntax: Strict 2-space YAML.
5. Iconography: If 'Treat as Water Valve', use 'mdi:water-pump' or 'mdi:valve'.

EXPECTED JSON:
{
  "helpers": "input_number:\\n  ${slug}_timer_duration:\\n    name: ...\\n    ...\\ntimer:\\n  ${slug}_countdown:\\n    ...",
  "scripts": "${slug}_run_timer:\\n  alias: Start ${config.deviceName} Timer\\n  sequence:\\n    - service: ${domain === 'climate' ? 'climate.set_temperature' : domain + '.turn_on'}\\n      target:\\n        entity_id: ${config.entityId}\\n      ${domain === 'climate' ? 'data:\\n        temperature: ' + (config.targetTemp || 21) + '\\n        hvac_mode: ' + (config.hvacMode || 'cool') : ''}\\n    - service: timer.start\\n      target:\\n        entity_id: timer.${slug}_countdown\\n      data:\\n        duration: \"{{ states('input_number.${slug}_timer_duration') | int * 60 }}\"",
  "automations": "alias: ${config.deviceName} Timer Finished\\ntrigger:\\n  - platform: event\\n    event_type: timer.finished\\n    event_data:\\n      entity_id: timer.${slug}_countdown\\naction:\\n  - service: ${domain}.turn_off\\n    target:\\n      entity_id: ${config.entityId}",
  "dashboard": "type: entities\\ntitle: ${config.deviceName} Timer\\nentities:\\n  - entity: ${config.entityId}\\n  - entity: input_number.${slug}_timer_duration\\n  - entity: timer.${slug}_countdown\\n  - entity: script.${slug}_run_timer\\n    name: Run Timer"
}`;

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