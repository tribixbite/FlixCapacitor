export interface CacheConfig {
    name: string;
    version: string;
    tables: string[];
    desc: string;
    size: number;
}

export interface CacheV2Config {
    name: string;
    version: number;
    tables: string[];
}

export interface TabType {
    name: string;
    order: number;
    type: string;
}

export interface ConfigType {
    title: string;
    platform: string;
    genres: string[];
    sorters: string[];
    sorters_tv: string[];
    sorters_fav: string[];
    sorters_anime: string[];
    types_anime: string[];
    types_fav: string[];
    genres_anime: string[];
    genres_tv: string[];
    genres_indie: string[];
    sorters_indie: string[];
    types_indie: string[];
    cache: CacheConfig;
    cachev2: CacheV2Config;
    getTabTypes: () => TabType[];
    getProviderForType: (type: string) => any;
    getProviderNameForType: (type: string) => string[];
    getFiltredProviderNames: (type: string) => string[];
}

const Config: ConfigType = {
    title: (window as any).Settings?.projectName || 'FlixCapacitor',
    platform: (typeof process !== 'undefined' && process.platform) || 'mobile',
    genres: [
        'All',
        'Action',
        'Adventure',
        'Animation',
        'Biography',
        'Comedy',
        'Crime',
        'Documentary',
        'Drama',
        'Family',
        'Fantasy',
        'Film-Noir',
        'History',
        'Horror',
        'Music',
        'Musical',
        'Mystery',
        'Romance',
        'Sci-Fi',
        'Short',
        'Sport',
        'Thriller',
        'War',
        'Western'
    ],

    sorters: ['trending', 'popularity', 'last added', 'year', 'title', 'rating'],

    sorters_tv: ['trending', 'popularity', 'updated', 'year', 'name', 'rating'],

    sorters_fav: ['watched items', 'year', 'title', 'rating'],

    sorters_anime: ['popularity', 'name', 'year'],

    types_anime: ['All', 'Movies', 'TV', 'OVA', 'ONA'],

    types_fav: ['All', 'Movies', 'TV', 'Anime'],

    genres_anime: [
        'All',
        'Action',
        'Adventure',
        'Cars',
        'Comedy',
        'Dementia',
        'Demons',
        'Drama',
        'Ecchi',
        'Fantasy',
        'Game',
        'Harem',
        'Historical',
        'Horror',
        'Josei',
        'Kids',
        'Magic',
        'Martial Arts',
        'Mecha',
        'Military',
        'Music',
        'Mystery',
        'Parody',
        'Police',
        'Psychological',
        'Romance',
        'Samurai',
        'School',
        'Sci-Fi',
        'Seinen',
        'Shoujo',
        'Shoujo Ai',
        'Shounen',
        'Shounen Ai',
        'Slice of Life',
        'Space',
        'Sports',
        'Super Power',
        'Supernatural',
        'Thriller',
        'Vampire'
    ],

    genres_tv: [
        'All',
        'Action',
        'Adventure',
        'Animation',
        'Children',
        'Comedy',
        'Crime',
        'Documentary',
        'Drama',
        'Family',
        'Fantasy',
        'Game Show',
        'Home and Garden',
        'Horror',
        'Mini Series',
        'Mystery',
        'News',
        'Reality',
        'Romance',
        'Science Fiction',
        'Soap',
        'Special Interest',
        'Sport',
        'Suspense',
        'Talk Show',
        'Thriller',
        'Western'
    ],

    genres_indie: [
        'All',
        'Action',
        'Adventure',
        'Animation',
        'Biography',
        'Comedy',
        'Crime',
        'Documentary',
        'Drama',
        'Family',
        'Fantasy',
        'Film-Noir',
        'History',
        'Horror',
        'Music',
        'Musical',
        'Mystery',
        'Romance',
        'Sci-Fi',
        'Short',
        'Sport',
        'Thriller',
        'War',
        'Western'
    ],
    sorters_indie: ['popularity', 'updated', 'year', 'alphabet', 'rating'],
    types_indie: [],

    cache: {
        name: 'cachedb',
        version: '1.7',
        tables: ['subtitle'],
        desc: 'Cache database',
        size: 10 * 1024 * 1024
    },

    cachev2: {
        name: 'cache',
        version: 5,
        tables: ['metadata']
    },

    getTabTypes(): TabType[] {
        const Settings = (window as any).Settings || { providers: {} };
        const _ = (window as any)._;

        if (!_) {
            return [];
        }

        return _.sortBy(
            _.filter(
                _.map(Settings.providers, (p: any, t: string) => {
                    return {
                        name: p.name,
                        order: p.order || 1,
                        type: t
                    };
                }),
                (p: any) => {
                    if ((p.name === 'Anime' && Settings.animeTabDisable) || p.name === 'Indie') {
                        return false;
                    }
                    return p.name;
                }
            ),
            'order'
        );
    },

    getProviderForType(type: string): any {
        const Settings = (window as any).Settings || { providers: {} };
        const App = (window as any).App;
        const _ = (window as any)._;

        if (type === 'indie') {
            return null;
        }

        let provider = Settings.providers[type];
        if (typeof provider !== 'string') {
            if (provider && provider.uri) {
                provider = provider.uri;
            }
        }

        if (!provider) {
            console.warn(`Provider type: "${type}" isn't defined in App.Config.providers`);
            return;
        } else if (provider instanceof Array || typeof provider === 'object') {
            return _.map(provider, (t: string) => {
                return App.Providers.get(t);
            });
        } else {
            return App.Providers.get(provider);
        }
    },

    getProviderNameForType(type: string): string[] {
        return this.getProviderForType(type).map((p: any) => {
            return p.config.tabName;
        });
    },

    getFiltredProviderNames(type: string): string[] {
        const _ = (window as any)._;
        const ret: Record<string, number> = {};

        this.getProviderNameForType(type).map((n: string) => {
            ret[n] = ret[n] ? ret[n] + 1 : 1;
        });

        return _.map(ret, (v: number, k: string) => {
            return k.concat(v > 1 ? ':' + v : '');
        });
    }
};

// Export for ES modules
export { Config };
export default Config;

// Make available globally
if (typeof window !== 'undefined') {
    const App = (window as any).App || {};
    App.Config = Config;
    (window as any).App = App;
}
