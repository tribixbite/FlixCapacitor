(function (App) {
    'use strict';

    /**
     * LearningBrowser - displays educational courses from Academic Torrents
     * Shows courses with provider logos and subject area filtering
     */
    var LearningBrowser = App.View.PCTBrowser.extend({
        collectionModel: App.Model.LearningCollection,
        filters: {
            types: ['All', 'MIT', 'Stanford', 'Udemy', 'UC Berkeley', 'Khan Academy', 'Coursera', 'edX'],
            genres: ['All', 'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Engineering', 'Business', 'Arts', 'Languages'],
            sorters: ['title', 'provider', 'subject', 'downloaders', 'size', 'date added']
        },

        onAttach: function () {
            // Call parent onAttach
            App.View.PCTBrowser.prototype.onAttach.apply(this, arguments);

            // Check if courses need to be synced
            this.checkCoursesSync();
        },

        checkCoursesSync: function () {
            var self = this;

            window.LearningService.getCoursesCount()
                .then(function (count) {
                    if (count === 0) {
                        self.showSyncPrompt();
                    }
                })
                .catch(function (err) {
                    win.error('Failed to check courses status:', err);
                });
        },

        showSyncPrompt: function () {
            // # TODO: Show UI prompt for syncing courses
            // For now, trigger automatic sync
            var self = this;

            win.info('Syncing educational courses from Academic Torrents...');
            console.log('Courses database empty - triggering sync');

            window.LearningService.syncCourses()
                .then(function (count) {
                    win.info(`Successfully synced ${count} courses`);
                    // Refresh the collection
                    self.collection.fetch();
                })
                .catch(function (err) {
                    win.error('Failed to sync courses:', err.message);
                });
        }
    });

    App.View.LearningBrowser = LearningBrowser;
})(window.App);
