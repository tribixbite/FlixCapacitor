(function (App) {
    'use strict';

    /**
     * LibraryCollection - manages local media library items
     * Fetches from LibraryService which scans local filesystem
     */
    var LibraryCollection = Backbone.Collection.extend({
        model: App.Model.Movie,

        initialize: function (models, options) {
            options = options || {};
            options.filter = options.filter || new App.Model.Filter();

            this.filter = _.defaults(_.clone(options.filter.attributes), {
                page: 1,
                type: 'all', // all, movie, tvshow, other
                genre: 'all'
            });

            this.hasMore = false; // Local library, no pagination needed
            this.libraryService = window.LibraryService;

            Backbone.Collection.prototype.initialize.apply(this, arguments);
        },

        fetch: function () {
            var self = this;

            if (this.state === 'loading') {
                return;
            }

            this.state = 'loading';
            self.trigger('loading', self);

            // Fetch media from local library
            return this.libraryService.getMedia(this.filter)
                .then(function (mediaItems) {
                    // Transform library items to movie-like format for display
                    var items = mediaItems.map(function (item) {
                        return {
                            imdb_id: item.imdb_id || `local_${item.id}`,
                            title: item.title,
                            year: item.year,
                            rating: {
                                percentage: Math.round((item.rating || 5.0) * 10),
                                watching: 0,
                                votes: 0
                            },
                            runtime: 0,
                            synopsis: item.metadata_json ? JSON.parse(item.metadata_json).synopsis : '',
                            genres: item.genres ? item.genres.split(',') : [],
                            images: {
                                poster: item.poster_url,
                                fanart: item.backdrop_url,
                                banner: item.backdrop_url
                            },
                            type: item.media_type,
                            torrents: {
                                // Local file, create pseudo-torrent for compatibility
                                local: {
                                    url: `file://${item.file_path}`,
                                    size: item.file_size ? `${(item.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
                                    seed: 0,
                                    peer: 0
                                }
                            },
                            // Local-specific fields
                            file_path: item.file_path,
                            last_played: item.last_played,
                            play_count: item.play_count
                        };
                    });

                    self.reset(items);
                    self.trigger('sync', self);
                    self.state = 'loaded';
                    self.trigger('loaded', self, self.state);
                })
                .catch(function (err) {
                    self.state = 'error';
                    self.trigger('loaded', self, self.state);
                    win.error('LibraryCollection.fetch()', err);
                });
        },

        fetchMore: function () {
            // No pagination for local library
            return;
        }
    });

    App.Model.LibraryCollection = LibraryCollection;
})(window.App);
