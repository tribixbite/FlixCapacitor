(function (App) {
    'use strict';

    /**
     * LearningCollection - manages educational courses from Academic Torrents
     * Fetches from LearningService which syncs with Academic Torrents CSV
     */
    var LearningCollection = Backbone.Collection.extend({
        model: App.Model.Movie,

        initialize: function (models, options) {
            options = options || {};
            options.filter = options.filter || new App.Model.Filter();

            this.filter = _.defaults(_.clone(options.filter.attributes), {
                page: 1,
                provider: 'all', // all, MIT, Stanford, Udemy, etc.
                subject: 'all'  // all, Computer Science, Math, Physics, etc.
            });

            this.hasMore = false; // All courses loaded at once
            this.learningService = window.LearningService;

            Backbone.Collection.prototype.initialize.apply(this, arguments);
        },

        fetch: function () {
            var self = this;

            if (this.state === 'loading') {
                return;
            }

            this.state = 'loading';
            self.trigger('loading', self);

            // Map filter values: type → provider, genre → subject
            var serviceFilters = {
                provider: this.filter.type || this.filter.provider || 'all',
                subject: this.filter.genre || this.filter.subject || 'all',
                search: this.filter.search,
                limit: this.filter.limit || 50,
                offset: ((this.filter.page || 1) - 1) * 50
            };

            // Fetch courses from learning service
            return this.learningService.getCourses(serviceFilters)
                .then(function (courses) {
                    // Transform course items to movie-like format for display
                    var items = courses.map(function (course) {
                        return {
                            imdb_id: `course_${course.id}`,
                            title: course.title,
                            year: null,
                            rating: {
                                percentage: 70, // Default rating for courses
                                watching: course.downloaders || 0,
                                votes: course.times_completed || 0
                            },
                            runtime: 0,
                            synopsis: course.description || 'Educational course from Academic Torrents',
                            genres: course.subject_area ? [course.subject_area] : ['Education'],
                            images: {
                                poster: course.thumbnail_url || course.provider_logo,
                                fanart: course.thumbnail_url || course.provider_logo,
                                banner: course.thumbnail_url || course.provider_logo
                            },
                            type: 'course',
                            torrents: {
                                '720p': {
                                    url: course.magnet_link,
                                    size: course.size_bytes ? `${(course.size_bytes / 1024 / 1024 / 1024).toFixed(2)} GB` : 'Unknown',
                                    seed: course.mirrors || 0,
                                    peer: course.downloaders || 0
                                }
                            },
                            // Course-specific fields
                            provider: course.provider,
                            subject_area: course.subject_area,
                            infohash: course.infohash,
                            mirrors: course.mirrors,
                            downloaders: course.downloaders,
                            times_completed: course.times_completed
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
                    win.error('LearningCollection.fetch()', err);
                });
        },

        fetchMore: function () {
            // No pagination for courses
            return;
        }
    });

    App.Model.LearningCollection = LearningCollection;
})(window.App);
