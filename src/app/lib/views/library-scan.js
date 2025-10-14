(function (App) {
    'use strict';

    /**
     * LibraryScanView - Modal dialog for scanning local media library
     * Provides UI for selecting folders and showing scan progress
     */
    var LibraryScanView = Marionette.View.extend({
        template: '#library-scan-tpl',
        className: 'library-scan-container',

        ui: {
            scanMovies: '.scan-movies',
            scanDownloads: '.scan-downloads',
            scanCustom: '.scan-custom',
            scanFull: '.scan-full',
            cancelScan: '.cancel-scan',
            closeScan: '.close-scan',
            progressFill: '.progress-fill',
            filesFound: '.files-found',
            currentFile: '.current-file',
            scanStatus: '.scan-status',
            scanPrompt: '.scan-prompt',
            scanResults: '.scan-results',
            matched: '.results-stats .stat:first strong',
            found: '.results-stats .stat:last strong'
        },

        events: {
            'click @ui.scanMovies': 'onScanMovies',
            'click @ui.scanDownloads': 'onScanDownloads',
            'click @ui.scanCustom': 'onScanCustom',
            'click @ui.scanFull': 'onScanFull',
            'click @ui.cancelScan': 'onCancelScan',
            'click @ui.closeScan': 'onClose',
            'click .modal-backdrop': 'onClose'
        },

        templateContext: function() {
            return {
                scanning: this.scanning || false,
                progress: this.progress || 0,
                filesFound: this.filesFound || 0,
                currentFile: this.currentFile || '',
                results: this.results || null,
                matched: this.results?.matched || 0,
                found: this.results?.found || 0
            };
        },

        initialize: function() {
            this.libraryService = window.LibraryService;
            this.scanning = false;
            this.progress = 0;
            this.filesFound = 0;
            this.currentFile = '';
            this.results = null;
        },

        onScanMovies: function() {
            this.startScan(['/storage/emulated/0/Movies']);
        },

        onScanDownloads: function() {
            this.startScan(['/storage/emulated/0/Download']);
        },

        onScanCustom: function() {
            // # TODO: Implement folder picker
            win.info('Folder picker not yet implemented. Use default folders for now.');
        },

        onScanFull: function() {
            this.startScan([
                '/storage/emulated/0/Movies',
                '/storage/emulated/0/Download',
                '/storage/emulated/0/DCIM',
                '/storage/emulated/0/Documents'
            ]);
        },

        startScan: function(folders) {
            var self = this;

            this.scanning = true;
            this.progress = 0;
            this.filesFound = 0;
            this.currentFile = '';
            this.results = null;
            this.render();

            console.log('Starting library scan:', folders);

            // Progress callback
            var progressCallback = function(found, total, filename) {
                self.filesFound = found;
                self.currentFile = filename || '';
                self.progress = total ? Math.round((found / total) * 100) : 0;

                // Update UI
                self.ui.filesFound.text(found);
                self.ui.currentFile.text(filename || '');
                self.ui.progressFill.css('width', self.progress + '%');
            };

            // Start scan
            this.libraryService.scanFolders(folders, progressCallback)
                .then(function(results) {
                    console.log('Scan complete:', results);
                    self.scanning = false;
                    self.results = results;
                    self.render();

                    // Trigger library refresh
                    App.vent.trigger('library:refresh');
                })
                .catch(function(error) {
                    console.error('Scan failed:', error);
                    win.error('Scan failed: ' + error.message);
                    self.scanning = false;
                    self.render();
                });
        },

        onCancelScan: function() {
            if (this.libraryService && this.scanning) {
                this.libraryService.cancelScan();
                win.info('Scan cancelled');
            }
        },

        onClose: function() {
            this.destroy();
        }
    });

    App.View.LibraryScan = LibraryScanView;
})(window.App);
