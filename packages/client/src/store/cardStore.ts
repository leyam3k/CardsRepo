import { create } from 'zustand';

export interface Card {
  id: string;
  imageUrl: string;
  name: string;
  description: string;
  creator?: string;
  character?: string;
  scenario?: string;
  tags: string[];
  // New fields for Phase 2
  language?: string;
  url?: string;
  first_mes?: string;
  mes_example?: string;
  system_prompt?: string;
  post_history_instructions?: string;
  creator_notes?: string;
  originalFilename?: string;
  spec?: string;
  // Fields for future phases
  importDate?: string;
  lastModified?: string;
}

interface CardStore {
  cards: Card[];
  searchTerm: string;
  selectedTags: string[];
  sortOrder: string;
  startDate: string;
  endDate: string;
  addCard: (card: Card) => void;
  setCards: (cards: Card[]) => void;
  setSearchTerm: (term: string) => void;
  toggleTag: (tag: string) => void;
  setSortOrder: (order: string) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
}

export const useCardStore = create<CardStore>((set) => ({
  cards: [],
  searchTerm: '',
  selectedTags: [],
  sortOrder: 'date-desc', // Default sort order
  startDate: '',
  endDate: '',
  addCard: (card) => set((state) => ({ cards: [...state.cards, card] })),
  setCards: (cards) => set(() => ({ cards })),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  toggleTag: (tag) => set((state) => {
    const { selectedTags } = state;
    if (selectedTags.includes(tag)) {
      return { selectedTags: selectedTags.filter((t) => t !== tag) };
    } else {
      return { selectedTags: [...selectedTags, tag] };
    }
  }),
}));