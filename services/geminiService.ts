import { GoogleGenAI, LiveSession, Modality } from "@google/genai";
import { blobToBase64 } from "./audioUtils";

const API_KEY_STORAGE_KEY = 'google_genai_api_key';

const getApiKey = (): string => {
  // 1. Check Local Storage
  const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
  if (storedKey) return storedKey;

  // 2. Check Environment Variable
  if (process.env.API_KEY && process.env.API_KEY.length > 0) {
    return process.env.API_KEY;
  }

  // 3. Prompt User to Connect
  const userKey = window.prompt("Connect to Google Cloud: Please enter your Gemini API Key.");
  if (userKey && userKey.trim().length > 0) {
    localStorage.setItem(API_KEY_STORAGE_KEY, userKey.trim());
    return userKey.trim();
  }

  throw new Error("API_KEY_MISSING");
};

// Helper to clear key if invalid
export const clearApiKey = () => {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
  window.location.reload();
};

const getAI = () => new GoogleGenAI({ apiKey: getApiKey() });

// Helper to normalize errors
const processError = (error: any): never => {
  const msg = (error.message || JSON.stringify(error)).toLowerCase();
  
  // Handle Auth Errors by clearing key
  if (msg.includes("api key") || msg.includes("unauthenticated") || msg.includes("403")) {
    const shouldReset = window.confirm("API Key seems invalid or expired. Reset connection?");
    if (shouldReset) {
      clearApiKey();
    }
  }

  if (msg.includes("requested entity was not found") || msg.includes("404")) {
    throw new Error("ENTITY_NOT_FOUND");
  }
  if (msg.includes("quota") || msg.includes("429") || msg.includes("resource exhausted")) {
    throw new Error("QUOTA_EXCEEDED");
  }
  throw error;
};

const SYSTEM_INSTRUCTION_APP_GEN = `
You are a helpful AI assistant. 
If the user asks to create a web app, website, dashboard, game, or UI component:
1. Generate the complete, single-file HTML code.
2. Include all necessary CSS in a <style> tag.
3. Include all necessary JavaScript in a <script> tag.
4. Wrap the entire HTML code in a markdown code block labeled "html" (e.g., \`\`\`html ... \`\`\`).
5. Ensure the code is self-contained and ready to run in a browser iframe.
6. Use Tailwind CSS via CDN if styling is needed: <script src="https://cdn.tailwindcss.com"></script>.
`;

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    processError(error);
  }
};

export const editImage = async (imageFile: File, prompt: string): Promise<string> => {
  try {
    const ai = getAI();
    const base64Data = await blobToBase64(imageFile);
    const mimeType = imageFile.type;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No edited image generated");
  } catch (error) {
    processError(error);
  }
};

export const generateVideo = async (imageFile: File, aspectRatio: string = '16:9'): Promise<string> => {
  try {
    const ai = getAI();
    const base64Data = await blobToBase64(imageFile);
    const mimeType = imageFile.type;

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      image: {
        imageBytes: base64Data,
        mimeType: mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio as any,
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("No video URI returned");

    // Fetch video bytes using the resolved API key
    const videoResponse = await fetch(`${videoUri}&key=${getApiKey()}`);
    if (!videoResponse.ok) throw new Error("Failed to download video");
    
    const videoBlob = await videoResponse.blob();
    
    // Convert blob to base64 so it can be stored in LocalStorage
    const base64Video = await blobToBase64(videoBlob);
    return `data:video/mp4;base64,${base64Video}`;

  } catch (error) {
    processError(error);
  }
};

export const generateFastResponse = async (prompt: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_APP_GEN
      }
    });
    return response.text || "";
  } catch (error) {
    processError(error);
  }
};

export const generateThinkingResponse = async (prompt: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 2048 },
        systemInstruction: SYSTEM_INSTRUCTION_APP_GEN
      }
    });
    return response.text || "";
  } catch (error) {
    processError(error);
  }
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const ai = getAI();
    const base64Data = await blobToBase64(audioBlob);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
          parts: [
              {
                  inlineData: {
                      mimeType: audioBlob.type || 'audio/webm',
                      data: base64Data
                  }
              },
              { text: "Transcribe this audio." }
          ]
      }
    });
    
    return response.text || "";
  } catch (error) {
    processError(error);
  }
};

// --- Live API Connection ---
export const connectLiveSession = async (
  callbacks: {
    onOpen: () => void;
    onMessage: (message: any) => void;
    onError: (e: any) => void;
    onClose: (e: any) => void;
  }
): Promise<{ 
  session: LiveSession; 
  disconnect: () => void;
  sendText: (text: string) => void;
}> => {
  try {
    const ai = getAI();
    
    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: callbacks.onOpen,
        onmessage: callbacks.onMessage,
        onerror: (e) => {
             try {
                processError(e);
             } catch (processedErr) {
                callbacks.onError(processedErr);
                return;
             }
             callbacks.onError(e);
        },
        onclose: callbacks.onClose,
      },
      config: {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {}, 
        inputAudioTranscription: {},
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: "You are Lumina, a futuristic 3D intelligent assistant. You have access to real-time information via Google Search. Keep responses concise and conversational. If the user sends a text message, read it and respond to it.",
        tools: [{ googleSearch: {} }],
      },
    });

    const session = await sessionPromise;
    
    return {
      session,
      disconnect: () => session.close(),
      sendText: (text: string) => {
        console.log("Sending text to Live API:", text);
        session.send({
          clientContent: {
            turns: [{ role: 'user', parts: [{ text }] }],
            turnComplete: true
          }
        });
      }
    };
  } catch (error) {
    processError(error);
  }
};