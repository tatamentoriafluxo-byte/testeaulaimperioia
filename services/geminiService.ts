
import { GoogleGenAI } from "@google/genai";
import { AspectRatio, ImageSize } from '../types';

// Helper: In this version, we trust the key passed by the user.
// The user is responsible for using a key with billing enabled for Paid models.
function getAI(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey: apiKey });
}

// Convert base64 data URI to raw base64 string
const cleanBase64 = (dataUri: string) => {
  return dataUri.replace(/^data:(.*,)?/, '');
};

const getMimeType = (dataUri: string) => {
  return dataUri.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
};

// GLOBAL NEGATIVE PROMPT - Used across all image functions
const STRICT_CLEAN_IMAGE_PROMPT = `
  CRITICAL VISUAL RESTRICTIONS (MANDATORY):
  1. NO UI ELEMENTS: The output must be a CLEAN PHOTOGRAPH. Do NOT render any User Interface (UI), buttons, icons, or software overlays.
  2. SPECIFIC BANNED ITEMS: 
     - NO 'Recortar', 'Crop', 'Edit', 'Phase One', 'Save', or 'Done' buttons.
     - NO pill-shaped buttons at the top/bottom (like in iOS/Android editors).
     - NO camera viewfinder overlays, crosshairs, or grids.
     - NO text, watermarks, subtitles, or timestamps.
  3. REALISM: The image must look like a developed raw file or a printed photo, NEVER like a screenshot of a phone screen or computer app.
  4. FAIL-SAFE: If the model 'wants' to add a crop button, it must suppress it and fill the area with the natural background of the photo.
`;

export const analyzeImage = async (apiKey: string, imageUri: string, userPrompt: string): Promise<string> => {
  const ai = getAI(apiKey);
  const base64Data = cleanBase64(imageUri);
  const mimeType = getMimeType(imageUri);

  const prompt = userPrompt || "Aja como um consultor de imagem de luxo e fotógrafo de moda profissional. Analise esta foto. Sugira melhorias no enquadramento, iluminação, vestuário, maquiagem e cenário para tornar esta imagem digna de uma revista de alta costura ou cinema.";

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        { text: prompt }
      ]
    },
    config: {
      systemInstruction: "Você é um especialista em estética visual de alto padrão.",
    }
  });

  return response.text || "Não foi possível analisar a imagem.";
};

export const editImage = async (apiKey: string, imageUri: string, prompt: string): Promise<string[]> => {
  const ai = getAI(apiKey);
  const base64Data = cleanBase64(imageUri);
  const mimeType = getMimeType(imageUri);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        { text: `INSTRUCTION: ${prompt}. Maintain high-fidelity facial features, ensuring the face is not distorted even if the edit changes the environment. ${STRICT_CLEAN_IMAGE_PROMPT}` }
      ]
    }
  });

  // Extract image from response
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return [`data:image/png;base64,${part.inlineData.data}`];
    }
  }
  throw new Error("Nenhuma imagem retornada pelo modelo de edição.");
};

export const generateImage = async (apiKey: string, prompt: string, aspectRatio: AspectRatio, size: ImageSize, imageUri?: string | null): Promise<string[]> => {
  // If user provides an image for reference/editing (to keep face identical), we prioritize Nano Banana (Flash Image) 
  // because it handles image-to-image/editing very robustly via generateContent parts.
  const usePro = !imageUri && (size === ImageSize.SIZE_2K || size === ImageSize.SIZE_4K);

  const ai = getAI(apiKey);

  // Helper to run a single generation
  const runGeneration = async (specificPrompt: string): Promise<string> => {
    if (usePro) {
      // High Quality (Typically requires billing on the project key for heavy usage, though preview may be free)
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: prompt + " " + specificPrompt + " " + STRICT_CLEAN_IMAGE_PROMPT }]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: size
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("O modelo Pro não gerou uma imagem. Verifique se sua chave API tem permissões para Gemini 1.5 Pro/Image.");

    } else {
      // Nano Banana / Flash Image
      
      // Map complex ratios to supported ones for Flash Image
      let safeRatio = aspectRatio;
      const supported = ["1:1", "3:4", "4:3", "9:16", "16:9"];
      if (!supported.includes(safeRatio)) {
        switch (safeRatio) {
            case AspectRatio.RATIO_21_9: safeRatio = AspectRatio.RATIO_16_9; break;
            case AspectRatio.RATIO_2_3: safeRatio = AspectRatio.RATIO_3_4; break;
            case AspectRatio.RATIO_3_2: safeRatio = AspectRatio.RATIO_4_3; break;
            default: safeRatio = AspectRatio.RATIO_1_1;
        }
      }

      const parts: any[] = [];
      
      // If we have an image, add it to parts to use as reference/base
      if (imageUri) {
        parts.push({
          inlineData: {
            mimeType: getMimeType(imageUri),
            data: cleanBase64(imageUri)
          }
        });
        // SUPER PROMPT for Photorealistic Identity Preservation & Styling
        const stylingPrompt = `
          ROLE: World-class high-end portrait photographer.

          CORE INSTRUCTION: Re-imagine the input image based on the user request, but maintain the subject's identity perfectly.

          CRITICAL PRIORITY: FACIAL FIDELITY AT DISTANCE.
          - When generating full-body or environmental shots, the face usually loses detail. YOU MUST PREVENT THIS.
          - The face must remain CRYSTAL CLEAR, high-resolution, and perfectly recognizable as the reference person, regardless of the camera distance.
          - Do not allow the face to become "smudged", "melted", or generic in wide shots.

          USER REQUEST: ${prompt}
          SPECIFIC ANGLE/STYLE: ${specificPrompt}

          ${STRICT_CLEAN_IMAGE_PROMPT}

          ADDITIONAL QUALITY RULES:
          - Skin texture must be visible (pores, natural imperfections).
          - Lighting must be physical and realistic (Raytraced look).
          - NO "AI Plastic" look.
        `;
        parts.push({ text: stylingPrompt });
      } else {
        parts.push({ text: `${prompt} ${specificPrompt}. Photorealistic. ${STRICT_CLEAN_IMAGE_PROMPT}` });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: parts
        },
        config: {
          imageConfig: {
            aspectRatio: safeRatio
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("O modelo Flash não gerou uma imagem.");
    }
  };

  // If we have an image (Photoshoot mode), we generate 3 variations/angles
  if (imageUri || !usePro) {
    // We run 3 requests. 
    // CHANGE: Running sequentially to avoid "429 Too Many Requests" on free tier keys.
    const angles = [
      "Variation 1: Close-up Portrait. Sharp focus on eyes. High texture.",
      "Variation 2: Fashion Editorial Shot (3/4 or Full Body). IMPORTANT: Face must be perfectly detailed and identical to reference, avoiding any distortion.",
      "Variation 3: Cinematic Environmental Shot. IMPORTANT: Even with the scenery, the subject's face must remain the sharpest and most detailed part of the image."
    ];
    
    const results: string[] = [];

    // Loop sequentially
    for (const angle of angles) {
      try {
        const result = await runGeneration(angle);
        results.push(result);
      } catch (e: any) {
        console.warn(`Skipping angle due to error: ${angle}`, e);
        // If we hit a hard limit (429), break to avoid wasting time/retries on doomed requests
        if (e.message && (e.message.includes('429') || e.message.includes('quota'))) {
           break;
        }
      }
    }
    
    if (results.length > 0) {
      return results;
    }
    
    // If absolutely nothing was generated, throw an error
    throw new Error("Não foi possível gerar as imagens. Verifique sua cota de API (Erro 429) ou tente novamente em alguns instantes.");
  } else {
    // Single High Quality generation
    const result = await runGeneration("High quality professional photo.");
    return [result];
  }
};

export const generateVideo = async (apiKey: string, prompt: string, aspectRatio: AspectRatio): Promise<string> => {
  const ai = getAI(apiKey);
  
  // Veo 3.1 Fast usually supports 16:9 and 9:16.
  let targetRatio = '16:9';
  if (aspectRatio === AspectRatio.RATIO_9_16 || aspectRatio === AspectRatio.RATIO_3_4) {
    targetRatio = '9:16';
  }

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: targetRatio as any
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Falha na geração do vídeo.");

    // Append API key for retrieval
    return `${videoUri}&key=${apiKey}`;
  } catch (error: any) {
    // Better error message for Veo payment requirement
    if (error.message && error.message.includes("403")) {
      throw new Error("O modelo Veo (Vídeo) exige uma Chave de API de um projeto com faturamento (Billing) ativado no Google Cloud.");
    }
    throw error;
  }
};

export const transcribeAudio = async (apiKey: string, audioBlob: Blob): Promise<string> => {
  const ai = getAI(apiKey); 
  
  // Convert Blob to Base64
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: {
            parts: [{
              inlineData: {
                mimeType: audioBlob.type || 'audio/wav',
                data: base64Data
              }
            }, {
              text: "Transcreva o áudio exatamente como falado."
            }]
          }
        });
        resolve(response.text || "");
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = (e) => reject(e);
  });
};
