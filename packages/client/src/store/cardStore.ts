import { create } from 'zustand';

export interface LorebookEntry {
  keys: string[];
  content: string;
  enabled: boolean;
  insertion_order: number;
  name?: string;
  id?: number | string;
  comment?: string;
  extensions: Record<string, any>;
  // V2+
  case_sensitive?: boolean;
  // V3+
  use_regex?: boolean;
  constant?: boolean;
  selective?: boolean;
  secondary_keys?: string[];
  position?: 'before_char' | 'after_char';
  priority?: number;
}

export interface Lorebook {
  name?: string;
  description?: string;
  scan_depth?: number;
  token_budget?: number;
  recursive_scanning?: boolean;
  extensions: Record<string, any>;
  entries: LorebookEntry[];
}

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
  character_book?: Lorebook;
  // Organization
  tags: string[];
  collections?: string[];
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
  tags: string[]; // for management page
  tagSearch: string;
  collections: string[];
  fetchAvailableTags: () => Promise<void>;
  fetchTags: () => Promise<void>; // for management page
  updateTag: (oldName: string, newName: string) => Promise<void>;
  deleteTag: (tagName: string) => Promise<void>;
  fetchCollections: () => Promise<void>;
  updateCollection: (oldName: string, newName: string) => Promise<void>;
  deleteCollection: (collectionName: string) => Promise<void>;
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
  tags: [],
  collections: [],
  fetchAvailableTags: async () => {
    try {
      const response = await fetch('http://localhost:3001/api/tags');
      if (response.ok) {
        const tags = await response.json();
        set({ availableTags: tags });
      } else {
        console.error('Failed to fetch available tags');
      }
    } catch (error) {
      console.error('Error fetching available tags:', error);
    }
  },
  fetchTags: async () => {
    try {
      const response = await fetch('http://localhost:3001/api/tags');
      if (response.ok) {
        const tags = await response.json();
        set({ tags });
      } else {
        console.error('Failed to fetch tags for management');
      }
    } catch (error) {
      console.error('Error fetching tags for management:', error);
    }
  },
  fetchCollections: async () => {
    try {
      const response = await fetch('http://localhost:3001/api/collections');
      if (response.ok) {
        const collections = await response.json();
        set({ collections });
      } else {
        console.error('Failed to fetch collections');
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  },
  updateCollection: async (oldName, newName) => {
    try {
      const response = await fetch(`http://localhost:3001/api/collections/${oldName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newName }),
      });
      if (response.ok) {
        get().fetchCollections();
      } else {
        console.error('Failed to update collection');
      }
    } catch (error) {
      console.error('Error updating collection:', error);
    }
  },
  deleteCollection: async (collectionName) => {
    try {
      const response = await fetch(`http://localhost:3001/api/collections/${collectionName}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        get().fetchCollections();
      } else {
        console.error('Failed to delete collection');
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
    }
  },
  updateTag: async (oldName, newName) => {
    try {
      const response = await fetch(`http://localhost:3001/api/tags/${oldName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newName }),
      });

      if (response.ok) {
        // Refresh both tag lists after a successful update
        get().fetchTags();
        get().fetchAvailableTags();
      } else {
        console.error('Failed to update tag');
      }
    } catch (error) {
      console.error('Error updating tag:', error);
    }
  },
  deleteTag: async (tagName) => {
    try {
      const response = await fetch(`http://localhost:3001/api/tags/${tagName}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh both tag lists after a successful delete
        get().fetchTags();
        get().fetchAvailableTags();
      } else {
        console.error('Failed to delete tag');
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
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