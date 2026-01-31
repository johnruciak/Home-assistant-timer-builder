
import { GoogleGenAI, Type } from "@google/genai";
import { DiscoveryResult } from "../types";

const VISION_MODEL = 'gemini-3-pro-preview';
const TEXT_MODEL = 'gemini-3-pro-preview';

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
  const domain = config.entityId.split('.')[0] || 'switch';
  const turnOnService = `${domain}.turn_on`;
  const turnOffService = `${domain}.turn_off`;

  const prompt = `Generate Home Assistant YAML components for a modular timer system.

INPUT PARAMETERS (CRITICAL):
- Target Device Name: "${config.deviceName}"
- Target Entity ID: "${config.entityId}" (MUST USE THIS EXACT ID FOR ALL ACTIONS)
- Target Domain: "${domain}"
- Slug for Helpers: "${slug}"
- Default Duration: ${config.duration} minutes

RELIABILITY RULES:
1. You MUST use "${config.entityId}" as the target for all turn_on and turn_off services.
2. All helper entities MUST use the slug "${slug}" to ensure they link correctly.
   - timer.${slug}_countdown
   - input_number.${slug}_timer_duration
   - script.${slug}_run_timer
3. Use 2-space indentation and standard YAML with NEWLINES.
4. "helpers" block MUST be in 'Package' format (including top-level domain keys like input_number: and timer:).

EXPECTED JSON STRUCTURE:
{
  "helpers": "input_number:\\n  ${slug}_timer_duration:\\n    name: ...\\n    ...\\ntimer:\\n  ${slug}_countdown:\\n    ...",
  "scripts": "${slug}_run_timer:\\n  alias: Start ${config.deviceName} Timer\\n  sequence:\\n    - service: ${turnOnService}\\n      target:\\n        entity_id: ${config.entityId}\\n    ...",
  "automations": "alias: ${config.deviceName} Timer Finished\\ntrigger:\\n  - platform: event\\n    event_type: timer.finished\\n    event_data:\\n      entity_id: timer.${slug}_countdown\\naction:\\n  - service: ${turnOffService}\\n    target:\\n      entity_id: ${config.entityId}",
  "dashboard": "type: entities\\ntitle: ${config.deviceName} Timer\\nentities:\\n  - entity: ${config.entityId}\\n  - entity: timer.${slug}_countdown\\n  ..."
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
