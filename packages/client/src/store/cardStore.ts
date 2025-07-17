import { create } from 'zustand';

export interface Card {
  id: string;
  imageUrl: string;
  name: string;
  description: string;
  creator?: string;
  character?: string;
  scenario?: string;
  system?: string;
  tags: string[];
}

interface CardStore {
  cards: Card[];
  searchTerm: string;
  selectedTags: string[];
  addCard: (card: Card) => void;
  setCards: (cards: Card[]) => void;
  setSearchTerm: (term: string) => void;
  toggleTag: (tag: string) => void;
}

export const useCardStore = create<CardStore>((set) => ({
  cards: [],
  searchTerm: '',
  selectedTags: [],
  addCard: (card) => set((state) => ({ cards: [...state.cards, card] })),
  setCards: (cards) => set(() => ({ cards })),
  setSearchTerm: (term) => set({ searchTerm: term }),
  toggleTag: (tag) => set((state) => {
    const { selectedTags } = state;
    if (selectedTags.includes(tag)) {
      return { selectedTags: selectedTags.filter((t) => t !== tag) };
    } else {
      return { selectedTags: [...selectedTags, tag] };
    }
  }),
}));