(function (App) {
    'use strict';

    /**
     * LibraryBrowser - displays local media library
     * Shows scanned media files with metadata
     * Supports filtering by media type (movies, TV shows, other)
     */
    var LibraryBrowser = App.View.PCTBrowser.extend({
        collectionModel: App.Model.LibraryCollection,
        filters: {
            types: ['All', 'Movies', 'TV Shows', 'Other'],
            genres: App.Config.genres,
            sorters: ['title', 'year', 'rating', 'last played', 'play count', 'date added']
        },

        onAttach: function () {
            // Call parent onAttach
            App.View.PCTBrowser.prototype.onAttach.apply(this, arguments);

            // Check if library is empty and prompt for scan
            this.checkLibraryStatus();
        },

        checkLibraryStatus: function () {
            var self = this;

            window.LibraryService.getMediaCount()
                .then(function (count) {
                    if (count === 0) {
                        self.showScanPrompt();
                    }
                })
                .catch(function (err) {
                    win.error('Failed to check library status:', err);
                });
        },

        showScanPrompt: function () {
            // Show scan dialog
            var scanView = new App.View.LibraryScan();
            App.vent.trigger('system:openModal', scanView);
        }
    });

    App.View.LibraryBrowser = LibraryBrowser;
})(window.App);
