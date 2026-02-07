
import { GoogleGenAI, Type } from "@google/genai";
import { DiscoveryResult } from "../types";

const VISION_MODEL = 'gemini-3-pro-preview';
const TEXT_MODEL = 'gemini-3-pro-preview';

const cleanJsonResponse = (text: string) => {
  return text.replace(/```json\n?|```/g, "").trim();
};

export const analyzeImage = async (base64Image: string): Promise<DiscoveryResult> => {
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
  fade?: boolean,
  targetTemp?: number,
  hvacMode?: string,
  presenceSensor?: string,
  preWarning?: boolean,
  presets?: boolean,
  sunsetOnly?: boolean
}): Promise<{
  scripts: string,
  automations: string,
  helpers: string,
  dashboard: string
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const technicalIdOnly = config.entityId.includes('.') ? config.entityId.split('.')[1] : config.entityId;
  const slug = technicalIdOnly.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const domain = config.entityId.split('.')[0] || 'switch';

  const prompt = `Generate Home Assistant YAML components for a modular timer system.

INPUT PARAMETERS:
- Name: "${config.deviceName}"
- Entity: "${config.entityId}"
- Domain: "${domain}"
- Slug: "${slug}"
- Base Duration: ${config.duration} min
- Presence Blocker Sensor: ${config.presenceSensor || 'NONE'}
- Notify 2m before end: ${config.preWarning ? 'YES' : 'NO'}
- Include Dashboard Presets: ${config.presets ? 'YES' : 'NO'}
- Sunset Only Constraint: ${config.sunsetOnly ? 'YES' : 'NO'}

RELIABILITY RULES:
1. Target ID: "${config.entityId}".
2. Domain Logic:
   - If 'climate', use service 'climate.set_temperature' with hvac_mode: ${config.hvacMode || 'cool'} and temp: ${config.targetTemp || 21}. Turn off via 'climate.turn_off'.
   - If 'light' and fade is active, use transition: 10 in turn_off.
3. Advanced Logic Integration:
   - If Presence Blocker: Add condition to the "Timer Finished" automation checking that the presence sensor is 'off'. If 'on', do not turn off the device (optionally restart timer).
   - If Sunset Only: Add condition to the "Start Timer" script so it only executes if the sun is below the horizon.
   - If Pre-Warning: Generate an automation triggered by timer starting that waits (duration - 2) mins and sends a 'notify.mobile_app_user' message.
   - If Presets: The dashboard YAML should include a horizontal-stack with buttons for 15m, 30m, 1h, 2h intervals that call script.${slug}_run_timer with a 'duration' variable.
4. Script Flexibility: Update script.${slug}_run_timer to accept an optional 'minutes' variable, defaulting to input_number.${slug}_timer_duration if not passed.

EXPECTED JSON:
{
  "helpers": "YAML for input_number and timer entities...",
  "scripts": "YAML for the timer control script...",
  "automations": "YAML for the shutdown logic and warnings...",
  "dashboard": "YAML for a rich Lovelace card..."
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
