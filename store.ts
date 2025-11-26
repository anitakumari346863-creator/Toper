import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GalleryItem } from './types';

interface GalleryState {
  items: GalleryItem[];
  addToGallery: (item: GalleryItem) => void;
  removeFromGallery: (id: string) => void;
  clearGallery: () => void;
}

export const useGalleryStore = create<GalleryState>()(
  persist(
    (set) => ({
      items: [],
      addToGallery: (item) => set((state) => ({ items: [item, ...state.items] })),
      removeFromGallery: (id) => set((state) => ({ 
        items: state.items.filter((item) => item.id !== id) 
      })),
      clearGallery: () => set({ items: [] }),
    }),
    {
      name: 'lumina-gallery-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);