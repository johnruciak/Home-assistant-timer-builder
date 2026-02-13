
import { GoogleGenAI, Type } from "@google/genai";
import { DiscoveryResult } from "../types";

const VISION_MODEL = 'gemini-3-pro-preview';
const TEXT_MODEL = 'gemini-3-pro-preview';

// Handle undefined text correctly
const cleanJsonResponse = (text: string | undefined) => {
  if (!text) return "";
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
  if (!text) throw new Error("Empty response from AI");
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
  scheduleMode: 'none' | 'time' | 'sunset' | 'sunrise',
  scheduleTime?: string,
  recurrence?: 'daily' | 'weekdays' | 'weekends' | 'weekly'
}): Promise<{
  package: string,
  dashboard: string
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const technicalIdOnly = config.entityId.includes('.') ? config.entityId.split('.')[1] : config.entityId;
  const slug = technicalIdOnly.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const domain = config.entityId.split('.')[0] || 'switch';

  const isClimate = domain === 'climate';

  const prompt = `Generate a Home Assistant PACKAGE YAML for an Auto-Off Timer with Advanced Scheduling.

INPUT:
- Device: "${config.deviceName}" (${config.entityId})
- Unique Slug: "${slug}"
- Domain: "${domain}"
- Duration Default: ${config.duration} minutes
- Schedule Mode: "${config.scheduleMode}"
- Schedule Time: "${config.scheduleTime || 'N/A'}"
- Recurrence: "${config.recurrence || 'daily'}"
${isClimate ? `- Climate Specifics: Target Mode=${config.hvacMode || 'heat_cool'}, Target Temp=${config.targetTemp || 21}` : ''}

CRITICAL PACKAGE REQUIREMENTS (FIXING INTEGRATION NOT FOUND ERROR):
1. VALID PACKAGE STRUCTURE: The YAML MUST NOT have a custom root key like "${slug}_timer:".
2. INSTEAD, use standard top-level integration keys:
   timer:
     ${slug}_timer:
       ...
   input_number:
     ${slug}_duration:
       mode: slider
       ...
   automation:
     - id: ${slug}_automation
       ...
   script:
     ${slug}_start:
       ...

LOGIC REQUIREMENTS:
- AUTOMATION ID: MUST have a unique "id" for visual editor compatibility.
- CLIMATE LOGIC: 
  - 'start' script: Call climate.set_hvac_mode AND climate.set_temperature.
  - 'stop' or 'timer finished': Call climate.set_hvac_mode with hvac_mode: 'off'.
- DURATION SLIDER: In the 'input_number' definition, MUST set 'mode: slider'.

DASHBOARD UI (LOVELACE):
- Use 'type: entities' card.
- AVOID 'type: call-service'. Use standard script entity rows (e.g., "- entity: script.${slug}_start") to avoid visual editor warnings.
- Home Assistant automatically displays a "RUN" button for scripts in entities cards.

EXPECTED JSON:
{
  "package": "Valid YAML Package string...",
  "dashboard": "Valid Lovelace YAML string..."
}`;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          package: { type: Type.STRING },
          dashboard: { type: Type.STRING },
        },
        required: ["package", "dashboard"],
      }
    }
  });

  const text = cleanJsonResponse(response.text);
  if (!text) throw new Error("Empty response from AI");
  return JSON.parse(text);
};
