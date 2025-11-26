
export interface SpeechConfig {
  voiceName: string;
}

export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  timestamp: number;
  model: string;
}

// Window augmentation if needed
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}
