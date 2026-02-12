
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
  scheduleMode: 'none' | 'time' | 'sunset' | 'sunrise',
  scheduleTime?: string
}): Promise<{
  package: string,
  dashboard: string
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const technicalIdOnly = config.entityId.includes('.') ? config.entityId.split('.')[1] : config.entityId;
  const slug = technicalIdOnly.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const domain = config.entityId.split('.')[0] || 'switch';

  const prompt = `Generate a Home Assistant PACKAGE YAML for an Auto-Off Timer.

INPUT:
- Device: "${config.deviceName}" (${config.entityId})
- Unique Slug: "${slug}"
- Duration Default: ${config.duration} minutes
- Schedule: "${config.scheduleMode}"

CRITICAL SYNTAX:
1. Return a single YAML block containing: timer, input_number, script, and automation.
2. The automation MUST handle both the manual start (via the script) and the auto-off (when the timer finishes).
3. Logic: When timer.${slug}_countdown finishes, call ${domain}.turn_off on ${config.entityId}.
4. Script alias: "${slug}_run_script".
5. Automation ID: "${slug}_timer_manager".

EXPECTED JSON:
{
  "package": "The full YAML package starting with timer: ...",
  "dashboard": "The Lovelace UI YAML for the control card..."
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
  return JSON.parse(text);
};
