export enum StudioMode {
  ANALYZE = 'ANALYZE',
  GENERATE = 'GENERATE',
  EDIT = 'EDIT',
  VIDEO = 'VIDEO'
}

export enum AspectRatio {
  RATIO_1_1 = '1:1',
  RATIO_3_4 = '3:4',
  RATIO_4_3 = '4:3',
  RATIO_9_16 = '9:16',
  RATIO_16_9 = '16:9',
  RATIO_21_9 = '21:9', // Valid for some models, others might fallback
  RATIO_2_3 = '2:3',
  RATIO_3_2 = '3:2'
}

export enum ImageSize {
  SIZE_1K = '1K',
  SIZE_2K = '2K',
  SIZE_4K = '4K'
}

export type GenerationResult = 
  | { type: 'image'; content: string[] } // Changed to array for multiple images
  | { type: 'video'; content: string }
  | { type: 'text'; content: string };
  
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}