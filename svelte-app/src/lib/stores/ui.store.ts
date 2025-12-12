import { writable, derived, type Writable, type Readable } from 'svelte/store';

interface UIState {
  currentRoute: string;
  previousRoute: string | null;
  isLoading: boolean;
  loadingMessage: string | null;
  toasts: Toast[];
  activeSheet: string | null;
  activeModal: string | null;
  searchQuery: string;
  isSearchOpen: boolean;
  scrollPosition: Record<string, number>;
}

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration: number;
}

interface UIStore extends Writable<UIState> {
  navigate: (route: string) => void;
  setLoading: (isLoading: boolean, message?: string | null) => void;
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  dismissToast: (id: string) => void;
  openSheet: (id: string) => void;
  closeSheet: () => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  setSearchQuery: (query: string) => void;
  toggleSearch: () => void;
  saveScrollPosition: (route: string, position: number) => void;
  getScrollPosition: (route: string) => number;
}

const initialState: UIState = {
  currentRoute: '/',
  previousRoute: null,
  isLoading: false,
  loadingMessage: null,
  toasts: [],
  activeSheet: null,
  activeModal: null,
  searchQuery: '',
  isSearchOpen: false,
  scrollPosition: {}
};

function createUIStore(): UIStore {
  const { subscribe, set, update } = writable<UIState>(initialState);

  let currentValue: UIState = initialState;
  subscribe(value => { currentValue = value; });

  return {
    subscribe,
    set,
    update,

    navigate: (route: string) => update(state => ({
      ...state,
      previousRoute: state.currentRoute,
      currentRoute: route
    })),

    setLoading: (isLoading: boolean, message: string | null = null) => update(state => ({
      ...state,
      isLoading,
      loadingMessage: message
    })),

    showToast: (message: string, type: Toast['type'] = 'info', duration = 3000) => {
      const id = crypto.randomUUID();
      update(state => ({
        ...state,
        toasts: [...state.toasts, { id, message, type, duration }]
      }));

      if (duration > 0) {
        setTimeout(() => {
          update(state => ({
            ...state,
            toasts: state.toasts.filter(t => t.id !== id)
          }));
        }, duration);
      }
    },

    dismissToast: (id: string) => update(state => ({
      ...state,
      toasts: state.toasts.filter(t => t.id !== id)
    })),

    openSheet: (id: string) => update(state => ({ ...state, activeSheet: id })),
    closeSheet: () => update(state => ({ ...state, activeSheet: null })),

    openModal: (id: string) => update(state => ({ ...state, activeModal: id })),
    closeModal: () => update(state => ({ ...state, activeModal: null })),

    setSearchQuery: (query: string) => update(state => ({ ...state, searchQuery: query })),
    toggleSearch: () => update(state => ({ ...state, isSearchOpen: !state.isSearchOpen })),

    saveScrollPosition: (route: string, position: number) => update(state => ({
      ...state,
      scrollPosition: { ...state.scrollPosition, [route]: position }
    })),

    getScrollPosition: (route: string) => currentValue.scrollPosition[route] || 0
  };
}

export const uiStore = createUIStore();

// Derived stores
export const currentRoute: Readable<string> = derived(uiStore, $ui => $ui.currentRoute);
export const isLoading: Readable<boolean> = derived(uiStore, $ui => $ui.isLoading);
export const toasts: Readable<Toast[]> = derived(uiStore, $ui => $ui.toasts);
export const searchQuery: Readable<string> = derived(uiStore, $ui => $ui.searchQuery);
export const isSearchOpen: Readable<boolean> = derived(uiStore, $ui => $ui.isSearchOpen);
