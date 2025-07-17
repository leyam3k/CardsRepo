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
  isCopy?: boolean;
}

interface CardStore {
  cards: Card[];
  searchTerm: string;
  selectedTags: string[];
  sortOrder: string;
  startDate: string;
  endDate: string;
  availableTags: string[];
  fetchAvailableTags: () => Promise<void>;
  addCard: (card: Card) => void;
  setCards: (cards: Card[]) => void;
  setSearchTerm: (term: string) => void;
  toggleTag: (tag: string) => void;
  setSortOrder: (order: string) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
}

export const useCardStore = create<CardStore>((set, get) => ({
  cards: [],
  searchTerm: '',
  selectedTags: [],
  sortOrder: 'date-desc', // Default sort order
  startDate: '',
  endDate: '',
  availableTags: [],
  fetchAvailableTags: async () => {
    try {
      const response = await fetch('http://localhost:3001/api/tags');
      if (response.ok) {
        const tags = await response.json();
        set({ availableTags: tags });
      } else {
        console.error('Failed to fetch tags');
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  },
  addCard: (card) => {
    set((state) => ({ cards: [card, ...state.cards] }));
    // After adding a card, we should refresh the tags list
    // in case new tags were introduced.
    get().fetchAvailableTags();
  },
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