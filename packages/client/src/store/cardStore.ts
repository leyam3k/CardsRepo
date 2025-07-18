import { create } from 'zustand';

export interface Card {
  id: string;
  imageUrl: string;
  name: string;
  description: string;
  creator?: string;
  // V2/V3 Spec fields
  nickname?: string;
  character_version?: string;
  personality?: string; // Mapped from 'character'
  scenario?: string;
  first_mes?: string;
  mes_example?: string;
  system_prompt?: string;
  post_history_instructions?: string;
  creator_notes?: string;
  alternate_greetings?: string[];
  group_only_greetings?: string[];
  // Organization
  tags: string[];
  language?: string;
  url?: string;
  // Metadata
  originalFilename?: string;
  creation_date?: number; // Renamed from importDate, type changed to number
  modification_date?: number; // Renamed from lastModified, type changed to number
  // App-specific
  isCopy?: boolean;
  extensions: Record<string, any>;
  assets: any[]; // Using any[] for now, will be a typed array in Phase 3
  creator_notes_multilingual: Record<string, string>;
}

interface CardStore {
  cards: Card[];
  searchTerm: string;
  selectedTags: string[];
  sortBy: string;
  sortDirection: string;
  startDate: string;
  endDate: string;
  dateFilterType: string;
  availableTags: string[];
  tagSearch: string;
  fetchAvailableTags: () => Promise<void>;
  addCard: (card: Card) => void;
  setCards: (cards: Card[]) => void;
  setSearchTerm: (term: string) => void;
  setTagSearch: (term: string) => void;
  clearTagFilters: () => void;
  toggleTag: (tag: string) => void;
  setSortBy: (field: string) => void;
  setSortDirection: (direction: string) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setDateFilterType: (type: string) => void;
  clearDateFilters: () => void;
}

export const useCardStore = create<CardStore>((set, get) => ({
  cards: [],
  searchTerm: '',
  selectedTags: [],
  sortBy: 'importDate',
  sortDirection: 'desc',
  startDate: '',
  endDate: '',
  dateFilterType: 'importDate',
  availableTags: [],
  tagSearch: '',
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
  setTagSearch: (term) => set({ tagSearch: term }),
  clearTagFilters: () => set({ selectedTags: [], tagSearch: '' }),
  setSortBy: (field) => set({ sortBy: field }),
  setSortDirection: (direction) => set({ sortDirection: direction }),
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  setDateFilterType: (type) => set({ dateFilterType: type }),
  clearDateFilters: () => set({ startDate: '', endDate: '' }),
  toggleTag: (tag) => set((state) => {
    const { selectedTags } = state;
    if (selectedTags.includes(tag)) {
      return { selectedTags: selectedTags.filter((t) => t !== tag) };
    } else {
      return { selectedTags: [...selectedTags, tag] };
    }
  }),
}));