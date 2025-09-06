import { OnboardingData } from "../lib/users";

type State = OnboardingData & {
  password?: string;          // kept only client-side
};

let state: State = {};

type Listener = (s: State) => void;
const listeners = new Set<Listener>();

export const OnboardingStore = {
  get: () => state,
  set: (patch: Partial<State>) => {
    state = { ...state, ...patch };
    listeners.forEach((l) => l(state));
  },
  subscribe: (l: Listener) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  reset: () => {
    state = {};
    listeners.forEach((l) => l(state));
  }
};
