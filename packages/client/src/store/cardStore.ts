import { create } from 'zustand';

interface Card {
  id: string;
  image: string;
  name: string;
  // Add other card properties as needed
}

interface CardStore {
  cards: Card[];
  addCard: (card: Card) => void;
  setCards: (cards: Card[]) => void;
}

export const useCardStore = create<CardStore>((set) => ({
  cards: [],
  addCard: (card) => set((state) => ({ cards: [...state.cards, card] })),
  setCards: (cards) => set(() => ({ cards })),
}));