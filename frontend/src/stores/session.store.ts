import { create } from 'zustand';

export type SessionIdentity = {
  id: string;
  traits: Record<string, unknown>;
};

export type SessionState = {
  identity?: SessionIdentity;
  session?: Record<string, unknown>;
  setSession: (payload: {
    identity?: SessionIdentity;
    session?: Record<string, unknown>;
  }) => void;
  clear: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  identity: undefined,
  session: undefined,
  setSession: ({ identity, session }) => set({ identity, session }),
  clear: () => set({ identity: undefined, session: undefined }),
}));


