<div class="library-scan-modal">
    <div class="modal-backdrop"></div>
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fa fa-folder-open"></i> <%= i18n.__("Scan Library") %></h3>
            </div>

            <div class="modal-body">
                <div class="scan-status <%= scanning ? '' : 'hidden' %>">
                    <div class="scan-message"><%= i18n.__("Scanning folders for media files...") %></div>
                    <div class="scan-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: <%= progress %>%"></div>
                        </div>
                        <div class="progress-text">
                            <span class="files-found"><%= filesFound %></span> <%= i18n.__("files found") %>
                            <span class="current-file"><%= currentFile %></span>
                        </div>
                    </div>
                </div>

                <div class="scan-prompt <%= scanning ? 'hidden' : '' %>">
                    <p><%= i18n.__("Select folders to scan for movies and TV shows:") %></p>
                    <div class="folder-options">
                        <button class="btn btn-primary scan-movies">
                            <i class="fa fa-film"></i> <%= i18n.__("Scan Movies Folder") %>
                        </button>
                        <button class="btn btn-primary scan-downloads">
                            <i class="fa fa-download"></i> <%= i18n.__("Scan Downloads") %>
                        </button>
                        <button class="btn btn-primary scan-custom">
                            <i class="fa fa-folder"></i> <%= i18n.__("Choose Custom Folder") %>
                        </button>
                        <button class="btn btn-primary scan-full">
                            <i class="fa fa-mobile"></i> <%= i18n.__("Full Device Scan") %>
                        </button>
                    </div>
                </div>

                <div class="scan-results <%= results ? '' : 'hidden' %>">
                    <div class="results-message">
                        <i class="fa fa-check-circle"></i>
                        <%= i18n.__("Scan Complete!") %>
                    </div>
                    <div class="results-stats">
                        <div class="stat">
                            <strong><%= matched %></strong> <%= i18n.__("media files added") %>
                        </div>
                        <div class="stat">
                            <strong><%= found %></strong> <%= i18n.__("files scanned") %>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-default cancel-scan <%= scanning ? '' : 'hidden' %>">
                    <i class="fa fa-stop"></i> <%= i18n.__("Cancel") %>
                </button>
                <button class="btn btn-default close-scan <%= scanning ? 'hidden' : '' %>">
                    <%= i18n.__("Close") %>
                </button>
            </div>
        </div>
    </div>
</div>
