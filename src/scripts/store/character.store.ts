import { create } from 'zustand';
import { CharacterDetails } from '../../integrations/character/character.types';

type CharacterState = {
  currentCharacter: CharacterDetails | null;
  setCurrentCharacter: (character: CharacterDetails | null) => void;
};

export const useCharacterStore = create<CharacterState>((set) => ({
  currentCharacter: null,
  setCurrentCharacter: (character) => set({ currentCharacter: character }),
}));
