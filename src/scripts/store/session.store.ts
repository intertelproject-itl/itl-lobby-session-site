import { create } from 'zustand';
import { PublicSession } from '../../integrations/sessions/sessions.types';

type SessionState = {
  currentSession: PublicSession | null;
  setCurrentSession: (session: PublicSession | null) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  currentSession: null,
  setCurrentSession: (session) => set({ currentSession: session }),
}));
