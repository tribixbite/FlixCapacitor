/**
 * Mobile UI Components
 * Replaces desktop drag-and-drop with mobile-friendly UI
 */

(function () {
    'use strict';

    /**
     * Create floating action button (FAB) for adding torrents
     */
    function createFAB() {
        // Check if FAB already exists
        if (document.getElementById('mobile-fab')) {
            return;
        }

        const fab = document.createElement('button');
        fab.id = 'mobile-fab';
        fab.className = 'mobile-fab';
        fab.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
            </svg>
        `;
        fab.setAttribute('aria-label', 'Add torrent or magnet link');

        // Add click handler
        fab.addEventListener('click', showAddTorrentDialog);

        // Add to body
        document.body.appendChild(fab);

        // Add styles
        addFABStyles();

        console.log('Mobile FAB created');
    }

    /**
     * Add CSS styles for FAB
     */
    function addFABStyles() {
        if (document.getElementById('mobile-fab-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'mobile-fab-styles';
        style.textContent = `
            .mobile-fab {
                position: fixed;
                bottom: calc(10vh + 80px);
                right: 20px;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: #e74c3c;
                color: white;
                border: none;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 1000;
                transition: transform 0.2s, box-shadow 0.2s;
            }

            .mobile-fab:active {
                transform: scale(0.95);
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }

            .mobile-dialog-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.7);
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            .mobile-dialog {
                background: #1a1a1a;
                border-radius: 12px;
                padding: 24px;
                max-width: 500px;
                width: 100%;
                box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                animation: slideUp 0.3s ease-out;
            }

            @keyframes slideUp {
                from {
                    transform: translateY(50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .mobile-dialog h2 {
                margin: 0 0 16px 0;
                font-size: 20px;
                color: #fff;
            }

            .mobile-dialog-input {
                width: 100%;
                padding: 12px;
                border: 1px solid #333;
                border-radius: 8px;
                background: #2a2a2a;
                color: #fff;
                font-size: 16px;
                margin-bottom: 16px;
                box-sizing: border-box;
            }

            .mobile-dialog-input:focus {
                outline: none;
                border-color: #e74c3c;
            }

            .mobile-dialog-buttons {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }

            .mobile-dialog-button {
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                transition: background 0.2s;
            }

            .mobile-dialog-button.primary {
                background: #e74c3c;
                color: white;
            }

            .mobile-dialog-button.primary:active {
                background: #c0392b;
            }

            .mobile-dialog-button.secondary {
                background: #333;
                color: white;
            }

            .mobile-dialog-button.secondary:active {
                background: #444;
            }

            .mobile-dialog-or {
                text-align: center;
                color: #888;
                margin: 16px 0;
                font-size: 14px;
            }

            .mobile-dialog-file-button {
                width: 100%;
                padding: 12px;
                border: 2px dashed #555;
                border-radius: 8px;
                background: transparent;
                color: #aaa;
                font-size: 16px;
                cursor: pointer;
                transition: border-color 0.2s, color 0.2s;
                margin-bottom: 16px;
            }

            .mobile-dialog-file-button:active {
                border-color: #e74c3c;
                color: #e74c3c;
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Show dialog for adding torrent/magnet link
     */
    function showAddTorrentDialog() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'mobile-dialog-overlay';

        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'mobile-dialog';

        dialog.innerHTML = `
            <h2>Add Torrent</h2>
            <input
                type="text"
                class="mobile-dialog-input"
                id="torrent-url-input"
                placeholder="Paste magnet link or torrent URL"
                autocomplete="off"
                autocapitalize="off"
            />
            <div class="mobile-dialog-or">OR</div>
            <button class="mobile-dialog-file-button" id="select-torrent-file">
                📁 Select .torrent file
            </button>
            <input
                type="file"
                id="torrent-file-input"
                accept=".torrent"
                style="display: none;"
            />
            <div class="mobile-dialog-buttons">
                <button class="mobile-dialog-button secondary" id="dialog-cancel">Cancel</button>
                <button class="mobile-dialog-button primary" id="dialog-add">Add</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Get elements
        const input = document.getElementById('torrent-url-input');
        const fileButton = document.getElementById('select-torrent-file');
        const fileInput = document.getElementById('torrent-file-input');
        const cancelButton = document.getElementById('dialog-cancel');
        const addButton = document.getElementById('dialog-add');

        // Auto-focus input
        setTimeout(() => input.focus(), 100);

        // File button handler
        fileButton.addEventListener('click', () => {
            fileInput.click();
        });

        // File input handler
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.name.endsWith('.torrent')) {
                handleTorrentFile(file);
                closeDialog();
            }
        });

        // Cancel button
        cancelButton.addEventListener('click', closeDialog);

        // Add button
        addButton.addEventListener('click', () => {
            const url = input.value.trim();
            if (url) {
                if (url.startsWith('magnet:')) {
                    handleMagnetLink(url);
                    closeDialog();
                } else if (url.endsWith('.torrent') || url.includes('torrent')) {
                    handleTorrentURL(url);
                    closeDialog();
                } else {
                    alert('Please enter a valid magnet link or torrent URL');
                }
            }
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeDialog();
            }
        });

        // Close on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeDialog();
            }
        };
        document.addEventListener('keydown', escapeHandler);

        function closeDialog() {
            overlay.remove();
            document.removeEventListener('keydown', escapeHandler);
        }
    }

    /**
     * Handle magnet link
     */
    function handleMagnetLink(magnetURL) {
        console.log('Adding magnet link:', magnetURL);

        if (window.Settings) {
            window.Settings.droppedMagnet = magnetURL;
        }

        // Mobile app: Use NativeTorrentClient directly instead of old provider system
        if (window.NativeTorrentClient && window.App && window.App.UI) {
            try {
                // Parse magnet link to get a title if possible
                const magnetMatch = magnetURL.match(/dn=([^&]+)/);
                const title = magnetMatch ? decodeURIComponent(magnetMatch[1]) : 'Unknown Video';

                // Show video player with the magnet link
                const mockMovie = {
                    title: title,
                    imdb_id: 'magnet-link',
                    year: new Date().getFullYear(),
                    torrents: {
                        '720p': {
                            url: magnetURL,
                            seed: 0,
                            peer: 0
                        }
                    },
                    images: {
                        poster: 'https://via.placeholder.com/300x450/1f1f1f/808080?text=Magnet+Link',
                        fanart: 'https://via.placeholder.com/1280x720/1f1f1f/808080?text=Magnet+Link'
                    }
                };

                // Use the UI controller to play the movie
                window.App.UI.playMovie(mockMovie);

                console.log('Magnet link handled successfully');
            } catch (err) {
                console.error('Failed to handle magnet link:', err);
                alert('Failed to play magnet link. Please try again.');
            }
        } else {
            console.log('App not ready yet, queueing magnet link for later...');
            // Queue the magnet link to be processed when app is ready
            window._pendingMagnetLink = magnetURL;

            // Show feedback to user
            alert('Magnet link saved. It will open automatically in a moment...');

            // Retry after a short delay
            setTimeout(() => {
                if (window._pendingMagnetLink) {
                    const url = window._pendingMagnetLink;
                    delete window._pendingMagnetLink;
                    handleMagnetLink(url);
                }
            }, 2000);
        }
    }

    /**
     * Handle torrent URL
     */
    function handleTorrentURL(torrentURL) {
        console.log('Adding torrent URL:', torrentURL);

        // For now, treat torrent URLs as magnet links
        // In a full implementation, you would fetch and parse the .torrent file
        alert('Torrent URLs not yet supported. Please use magnet links or .torrent files instead.');
    }

    /**
     * Handle torrent file
     */
    function handleTorrentFile(file) {
        console.log('Adding torrent file:', file.name);

        const reader = new FileReader();

        reader.onload = function (e) {
            const arrayBuffer = e.target.result;

            // Convert to data URL for compatibility
            const blob = new Blob([arrayBuffer], { type: 'application/x-bittorrent' });
            const url = URL.createObjectURL(blob);

            if (window.Settings) {
                window.Settings.droppedTorrent = file.name;
            }

            // Torrent files not supported yet in mobile app
            // Would need to parse .torrent file and convert to magnet link
            alert('Torrent files not yet supported. Please use magnet links instead.');
        };

        reader.onerror = function () {
            console.error('Failed to read torrent file');
            alert('Failed to read torrent file. Please try again.');
        };

        reader.readAsArrayBuffer(file);
    }

    /**
     * Initialize mobile UI
     */
    function init() {
        console.log('Mobile UI initializing...');

        // Create FAB when app is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(createFAB, 500);
            });
        } else {
            setTimeout(createFAB, 500);
        }

        console.log('Mobile UI initialized');
    }

    // Export to global scope
    window.MobileUI = {
        init: init,
        showAddTorrentDialog: showAddTorrentDialog
    };

    // Auto-initialize
    init();

})();
