/**
 * Provider Loader for Mobile
 * Replaces bootstrap.js provider loading logic with explicit imports
 */

// Type definitions
interface ProviderClass {
    new (...args: any[]): any;
}

interface ProviderRegistry {
    content: Record<string, any>;
    metadata: Record<string, any>;
    subtitle: Record<string, any>;
    watchlist: Record<string, any>;
}

interface ProviderStats {
    content: number;
    metadata: number;
    subtitle: number;
    watchlist: number;
    total: number;
}

interface ProviderLoaderAPI {
    registerContentProvider: (name: string, ProviderClass: ProviderClass) => any;
    registerMetadataProvider: (name: string, ProviderClass: ProviderClass) => any;
    registerSubtitleProvider: (name: string, ProviderClass: ProviderClass) => any;
    registerWatchlistProvider: (name: string, ProviderClass: ProviderClass) => any;
    getProvider: (type: string, name: string) => any;
    getProvidersByType: (type: string) => Record<string, any>;
    initializeProviders: () => Promise<{ local: any[]; npm: any[] }>;
    loadLocalProviders: () => Promise<any[]>;
    loadNpmProviders: () => Promise<any[]>;
    getProviderStats: () => ProviderStats;
    registry: ProviderRegistry;
}

/**
 * Provider registry
 */
const ProviderRegistry: ProviderRegistry = {
    content: {},
    metadata: {},
    subtitle: {},
    watchlist: {}
};

/**
 * Register a content provider (movies, TV, anime)
 */
function registerContentProvider(name: string, ProviderClass: ProviderClass): any {
    console.log('Registering content provider:', name);

    try {
        const provider = new ProviderClass();
        ProviderRegistry.content[name] = provider;

        // Install provider into App.Providers
        const App = (window as any).App;
        if (App && App.Providers) {
            App.Providers.install(ProviderClass);
        }

        console.log('Content provider registered:', name);
        return provider;
    } catch (error) {
        console.error('Failed to register content provider:', name, error);
        return null;
    }
}

/**
 * Register a metadata provider (Trakt, TVDB, etc.)
 */
function registerMetadataProvider(name: string, ProviderClass: ProviderClass): any {
    console.log('Registering metadata provider:', name);

    try {
        const provider = new ProviderClass();
        ProviderRegistry.metadata[name] = provider;

        console.log('Metadata provider registered:', name);
        return provider;
    } catch (error) {
        console.error('Failed to register metadata provider:', name, error);
        return null;
    }
}

/**
 * Register a subtitle provider (OpenSubtitles, etc.)
 */
function registerSubtitleProvider(name: string, ProviderClass: ProviderClass): any {
    console.log('Registering subtitle provider:', name);

    try {
        const provider = new ProviderClass();
        ProviderRegistry.subtitle[name] = provider;

        console.log('Subtitle provider registered:', name);
        return provider;
    } catch (error) {
        console.error('Failed to register subtitle provider:', name, error);
        return null;
    }
}

/**
 * Register a watchlist provider (Trakt watchlist, etc.)
 */
function registerWatchlistProvider(name: string, ProviderClass: ProviderClass): any {
    console.log('Registering watchlist provider:', name);

    try {
        const provider = new ProviderClass();
        ProviderRegistry.watchlist[name] = provider;

        console.log('Watchlist provider registered:', name);
        return provider;
    } catch (error) {
        console.error('Failed to register watchlist provider:', name, error);
        return null;
    }
}

/**
 * Get a provider by type and name
 */
function getProvider(type: string, name: string): any {
    const typeRegistry = (ProviderRegistry as any)[type];
    if (!typeRegistry) {
        console.error('Unknown provider type:', type);
        return null;
    }

    const provider = typeRegistry[name];
    if (!provider) {
        console.warn('Provider not found:', type, name);
        return null;
    }

    return provider;
}

/**
 * Get all providers of a specific type
 */
function getProvidersByType(type: string): Record<string, any> {
    const typeRegistry = (ProviderRegistry as any)[type];
    if (!typeRegistry) {
        console.error('Unknown provider type:', type);
        return {};
    }

    return { ...typeRegistry };
}

/**
 * Load local providers from src/app/lib/providers/
 * Note: On mobile, we'll need to explicitly import these
 * # TODO: Import local provider modules when Phase 4 streaming is implemented
 */
async function loadLocalProviders(): Promise<any[]> {
    console.log('Loading local providers...');

    // Mobile: Local providers will be explicitly imported in Phase 4
    // For now, mark as TODO since they depend on the streaming service

    console.log('Local providers loading deferred to Phase 4');
    return Promise.resolve([]);
}

/**
 * Load NPM-based providers
 * Note: These are defined in package.json "providers" array
 * # TODO: Dynamically import butter-provider packages when needed
 */
async function loadNpmProviders(): Promise<any[]> {
    console.log('Loading NPM providers...');

    try {
        // Mobile: NPM providers need to be explicitly imported
        // The desktop version uses require() to dynamically load from package.json
        // We'll handle this in Phase 4 with the streaming system

        // Example structure (to be implemented in Phase 4):
        // const MovieProvider = await import('butter-provider-movies');
        // registerContentProvider('movies', MovieProvider.default);

        console.log('NPM providers loading deferred to Phase 4');
        return [];
    } catch (error) {
        console.error('Failed to load NPM providers:', error);
        return [];
    }
}

/**
 * Initialize all providers
 */
async function initializeProviders(): Promise<{ local: any[]; npm: any[] }> {
    console.log('Initializing provider system...');

    try {
        // Load local providers
        const localProviders = await loadLocalProviders();
        console.log('Local providers loaded:', localProviders.length);

        // Load NPM providers
        const npmProviders = await loadNpmProviders();
        console.log('NPM providers loaded:', npmProviders.length);

        // Trigger event when providers are ready
        const App = (window as any).App;
        if (App && App.vent) {
            App.vent.trigger('providers:loaded');
        }

        console.log('Provider system initialized');
        return {
            local: localProviders,
            npm: npmProviders
        };
    } catch (error) {
        console.error('Failed to initialize providers:', error);
        throw error;
    }
}

/**
 * Get provider statistics
 */
function getProviderStats(): ProviderStats {
    return {
        content: Object.keys(ProviderRegistry.content).length,
        metadata: Object.keys(ProviderRegistry.metadata).length,
        subtitle: Object.keys(ProviderRegistry.subtitle).length,
        watchlist: Object.keys(ProviderRegistry.watchlist).length,
        total: Object.keys(ProviderRegistry.content).length +
               Object.keys(ProviderRegistry.metadata).length +
               Object.keys(ProviderRegistry.subtitle).length +
               Object.keys(ProviderRegistry.watchlist).length
    };
}

// Create the API object
const ProviderLoader: ProviderLoaderAPI = {
    // Registration
    registerContentProvider,
    registerMetadataProvider,
    registerSubtitleProvider,
    registerWatchlistProvider,

    // Retrieval
    getProvider,
    getProvidersByType,

    // Initialization
    initializeProviders,
    loadLocalProviders,
    loadNpmProviders,

    // Stats
    getProviderStats,

    // Registry (read-only access)
    get registry() {
        return { ...ProviderRegistry };
    }
};

// Export to global scope
(window as any).ProviderLoader = ProviderLoader;

// Export as ES module
export default ProviderLoader;

console.log('Provider loader module initialized');
