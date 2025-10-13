// Logging functions are now provided by nw-compat.js
// Imported via global-mobile.js

// Mobile: Command-line arguments not supported
// Reset functionality will be handled via app settings UI
// # TODO: Implement reset functionality in settings UI

// Global App skeleton for backbone
var App = new Marionette.Application({
  region: '.main-window-region'
});

// Expose App globally for other modules
window.App = App;

_.extend(App, {
  Controller: {},
  View: {},
  Model: {},
  Page: {},
  Scrapers: {},
  Providers: {},
  Localization: {}
});

// Create old v2 style vent
App.vent = Backbone.Radio.channel('v2-vent');

// set database
App.db = Database;

// Set settings
App.advsettings = AdvSettings;
App.settings = Settings;
// Mobile: WebTorrent removed - will use server-based streaming
// # TODO: Implement StreamingService for server-side torrent handling
App.WebTorrent = null;

fs.readFile('./.git.json', 'utf8', function (err, json) {
  if (!err) {
    App.git = JSON.parse(json);
  }
});

// Mobile: No menu bar on mobile platforms

//Keeps a list of stacked views
App.ViewStack = [];

App.onBeforeStart = function (options) {
  // Mobile: No window management needed
  win.info('App starting on mobile platform');
};

var initTemplates = function () {
  // Load in external templates
  var ts = [];

  _.each(document.querySelectorAll('[type="text/x-template"]'), function (el) {
    var d = Q.defer();
    $.get(el.src, function (res) {
      el.innerHTML = res;
      d.resolve(true);
    });
    ts.push(d.promise);
  });

  return Q.all(ts);
};

var initApp = function () {
  var mainWindow = new App.View.MainWindow();
  win.show();

  try {
    App.showView(mainWindow);
  } catch (e) {
    console.error('Couldn\'t start app: ', e, e.stack);
  }
};

App.onStart = function (options) {
  // Initialize toast notification system
  if (window.App && window.App.ToastManager) {
    window.App.ToastManager.init();
  }

  initTemplates().then(initApp);
};

var deleteFolder = function (path) {
  if (typeof path !== 'string') {
    return;
  }

  var files = [];
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);
    files.forEach(function (file, index) {
      var curPath = path + '\/' + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolder(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

var deleteCookies = function () {
  function removeCookie(cookie) {
    var lurl =
      'http' + (cookie.secure ? 's' : '') + '://' + cookie.domain + cookie.path;
    win.cookies.remove(
      {
        url: lurl,
        name: cookie.name
      },
      function (result) {
        if (result) {
          if (!result.name) {
            result = result[0];
          }
          win.debug('cookie removed: ' + result.name + ' ' + result.url);
        } else {
          win.error('cookie removal failed');
        }
      }
    );
  }

  win.cookies.getAll({}, function (cookies) {
    if (cookies.length > 0) {
      win.debug('Removing ' + cookies.length + ' cookies...');
      for (var i = 0; i < cookies.length; i++) {
        removeCookie(cookies[i]);
      }
    }
  });
};

// Mobile: Cache cleanup using IndexedDB (works on mobile)
var delCache = function () {
  return new Promise((resolve, reject) => {
    try {
      const deleteRequest = window.indexedDB.deleteDatabase('cache');
      deleteRequest.onsuccess = () => {
        console.log('Cache database deleted successfully');
        resolve();
      };
      deleteRequest.onerror = (e) => {
        console.error('Failed to delete cache database:', e);
        reject(e);
      };
      deleteRequest.onblocked = () => {
        console.warn('Cache database deletion blocked - will retry');
        resolve();
      };
    } catch (e) {
      console.error('Error deleting cache:', e);
      reject(e);
    }
  });
};

// Mobile: App state cleanup function
async function close() {
  console.log('App cleanup initiated');

  $('.spinner').show();

  try {
    // Mobile: No WebTorrent to destroy (using server-based streaming)
    // Stop any active streaming sessions
    if (window.App.StreamingService) {
      await window.App.StreamingService.stopAll();
    }

    // Close any open players
    if (window.App.PlayerView) {
      try {
        window.App.PlayerView.closePlayer();
      } catch (e) {
        console.warn('Failed to close player:', e);
      }
    }

    // Clean up temp files if setting is enabled
    if (App.settings.deleteTmpOnClose && App.settings.tmpLocation) {
      try {
        await deleteFolder(App.settings.tmpLocation);
        console.log('Temp folder cleaned');
      } catch (e) {
        console.error('Failed to clean temp folder:', e);
      }
    }

    // Delete log file
    try {
      const logPath = window.path.join(window.data_path, 'logs.txt');
      if (await window.fs.existsSync(logPath)) {
        await window.fs.unlinkSync(logPath);
        console.log('Log file deleted');
      }
    } catch (e) {
      console.warn('Failed to delete log file:', e);
    }

    // Clear cache database
    try {
      await delCache();
    } catch (e) {
      console.error('Failed to clear cache:', e);
    }

    // Save any pending state
    if (window.App.vent) {
      window.App.vent.trigger('app:cleanup:complete');
    }

    console.log('App cleanup complete');
  } catch (error) {
    console.error('Error during app cleanup:', error);
  } finally {
    $('.spinner').hide();
  }
}

// Mobile: Cleanup on app state change (backgrounding/closing)
// Handled via Capacitor App plugin in main.js
if (window.App) {
  window.App.cleanup = close;
}

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.capitalizeEach = function () {
  return this.replace(/\w*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

String.prototype.endsWith = function (suffix) {
  return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
// Mobile: Keyboard shortcuts removed - touch gestures will be used instead
// # TODO: Implement touch gestures for common actions

// Mobile: Drag-and-drop and tray not supported
// # TODO: Implement UI button for adding magnet links/torrents

var isVideo = function (file) {
  var ext = path.extname(file).toLowerCase();
  switch (ext) {
    case '.mp4':
    case '.avi':
    case '.mov':
    case '.mkv':
    case '.wmv':
      return true;
    default:
      return false;
  }
};

var handleVideoFile = function (file) {
  $('.spinner').show();

  // look for local subtitles
  var checkSubs = function () {
    var _ext = path.extname(file.name);
    var toFind = file.path.replace(_ext, '.srt');

    if (fs.existsSync(path.join(toFind))) {
      return {
        local: path.join(toFind)
      };
    } else {
      return null;
    }
  };

  // get subtitles from provider
  var getSubtitles = function (subdata) {
    return Q.Promise(function (resolve, reject) {
      win.debug('Subtitles data request:', subdata);

      var subtitleProvider = App.Config.getProviderForType('subtitle');

      subtitleProvider
        .fetch(subdata)
        .then(function (subs) {
          if (subs && Object.keys(subs).length > 0) {
            win.info(Object.keys(subs).length + ' subtitles found');
            resolve(subs);
          } else {
            win.warn('No subtitles returned');
            if (Settings.subtitle_language !== 'none') {
              App.vent.trigger(
                'notification:show',
                new App.Model.Notification({
                  title: i18n.__('No subtitles found'),
                  body: i18n.__(
                    'Try again later or drop a subtitle in the player'
                  ),
                  showRestart: false,
                  type: 'warning',
                  autoclose: true
                })
              );
            }
            reject(new Error('No subtitles returned'));
          }
        })
        .catch(function (err) {
          reject(err);
        });
    });
  };

  // close the player if needed
  try {
    App.PlayerView.closePlayer();
  } catch (err) { }

  return new Promise(function (resolve, reject) {
    // init our objects
    var playObj = {
      src: 'file://' + path.join(file.path),
      type: 'video/mp4'
    };
    var sub_data = {
      filename: path.basename(file.path),
      path: file.path
    };

    App.Trakt.client.matcher
      .match({
        path: file.path
      })
      .then(function (res) {
        return App.Trakt.client.images.get(res[res.type]).then(function (img) {
          switch (res.quality) {
            case 'SD':
              res.quality = '480p';
              break;
            case 'HD':
              res.quality = '720p';
              break;
            case 'FHD':
              res.quality = '1080p';
              break;
            default:
          }
          switch (res.type) {
            case 'movie':
              playObj.title = res.movie.title;
              playObj.quality = res.quality;
              playObj.imdb_id = res.movie.ids.imdb;
              playObj.poster = img.poster;
              playObj.backdrop = img.background;
              playObj.year = res.movie.year;

              sub_data.imdbid = res.movie.ids.imdb;
              break;
            case 'episode':
              playObj.title =
                res.show.title +
                ' - ' +
                i18n.__('Season %s', res.episode.season) +
                ', ' +
                i18n.__('Episode %s', res.episode.number) +
                ' - ' +
                res.episode.title;
              playObj.quality = res.quality;
              playObj.season = res.episode.season;
              playObj.episode = res.episode.number;
              playObj.poster = img.poster;
              playObj.backdrop = img.background;
              playObj.tvdb_id = res.show.ids.tvdb;
              playObj.imdb_id = res.show.ids.imdb;
              playObj.episode_id = res.episode.ids.tvdb;

              sub_data.imdbid = res.show.ids.imdb;
              sub_data.season = res.episode.season;
              sub_data.episode = res.episode.number;
              break;
            default:
              throw new Error('trakt.matcher.match failed');
          }

          playObj.metadataCheckRequired = true;
          playObj.videoFile = file.path;

          // try to get subtitles for that movie/episode
          return getSubtitles(sub_data);
        });
      })
      .then(function (subtitles) {
        var localsub = checkSubs();
        if (localsub !== null) {
          subtitles = jQuery.extend({}, subtitles, localsub);
        }
        playObj.subtitle = subtitles;

        if (localsub !== null) {
          playObj.defaultSubtitle = 'local';
        } else {
          playObj.defaultSubtitle = 'none';
        }
        resolve(playObj);
      })
      .catch(function (err) {
        win.warn('trakt.matcher.match error:', err);
        var localsub = checkSubs();
        if (localsub !== null) {
          playObj.defaultSubtitle = 'local';
        } else {
          playObj.defaultSubtitle = 'none';
        }

        if (!playObj.title) {
          playObj.title = file.name;
        }
        playObj.quality = false;
        playObj.videoFile = file.path;
        playObj.subtitle = localsub;

        resolve(playObj);
      });
  }).then(function (play) {
    $('.spinner').hide();

    var localVideo = new Backbone.Model(play); // streamer model
    console.debug(
      'Trying to play local file',
      localVideo.get('src'),
      localVideo.attributes
    );

    var tmpPlayer = App.Device.Collection.selected.attributes.id;
    App.Device.Collection.setDevice('local');
    App.vent.trigger('stream:ready', localVideo); // start stream
    App.Device.Collection.setDevice(tmpPlayer);

    $('.eye-info-player').hide();
    $('.vjs-load-progress').css('width', '100%');
  });
};

// Store last torrent for retry functionality
var lastTorrent = null;
var retryCount = 0;
var maxRetries = 3;

var handleTorrent = async function (torrent, isRetry = false) {
  try {
    App.PlayerView.closePlayer();
  } catch (err) {
    // The player wasn't running
  }

  // Store torrent for retry
  if (!isRetry) {
    lastTorrent = torrent;
    retryCount = 0;
  }

  try {
    const streamingMethod = Settings.streamingMethod || 'server';

    if (streamingMethod === 'native') {
      // Use native torrent client
      console.log('Using native torrent client for streaming');

      if (!window.NativeTorrentClient) {
        throw new Error('Native torrent client not available. Please install the native client or switch to server-based streaming in settings.');
      }

      const streamInfo = await window.NativeTorrentClient.startStream(torrent, {}, (progress) => {
        console.log('Native client progress:', progress);
      });

      // Convert to model format expected by player
      const stream = {
        src: streamInfo.streamUrl,
        type: 'video/mp4',
        title: streamInfo.file?.name || 'Video',
        torrent: streamInfo.torrent
      };

      App.vent.trigger('stream:ready', new Backbone.Model(stream));
    } else {
      // Use server-based streaming
      console.log('Using server-based streaming');
      const stream = await App.StreamingService.streamAndWait(torrent);

      // Try to fetch subtitles if we have metadata
      if (stream.streamId && stream.imdbId) {
        const subtitleOptions = {
          imdbId: stream.imdbId,
          language: Settings.subtitle_language || 'en'
        };

        // Add season/episode for TV shows
        if (stream.season) subtitleOptions.season = stream.season;
        if (stream.episode) subtitleOptions.episode = stream.episode;

        console.log('Fetching subtitles with options:', subtitleOptions);

        const subtitles = await App.StreamingService.getSubtitles(stream.streamId, subtitleOptions);

        if (subtitles && subtitles.subtitles) {
          // Convert subtitle URLs to format expected by player
          const subtitleMap = {};
          for (const [lang, url] of Object.entries(subtitles.subtitles)) {
            subtitleMap[lang] = App.StreamingService.getSubtitleUrl(stream.streamId, lang);
          }
          stream.subtitle = subtitleMap;
          stream.defaultSubtitle = Settings.subtitle_language || 'en';
          console.log('Subtitles attached to stream:', Object.keys(subtitleMap));
        }
      }

      App.vent.trigger('stream:ready', new Backbone.Model(stream));
    }

    // Reset retry count on success
    retryCount = 0;

  } catch (error) {
    console.error('Torrent streaming error:', error);

    // Show detailed error with retry option
    const errorMsg = error.message || 'Unknown streaming error occurred';

    if (retryCount < maxRetries) {
      window.App.SafeToast.error(
        'Streaming Error',
        `${errorMsg}\n\nClick to retry (${retryCount}/${maxRetries})`,
        0,
        () => {
          // Retry callback
          retryCount++;
          console.log(`Retrying stream (attempt ${retryCount}/${maxRetries})...`);
          handleTorrent(lastTorrent, true);
        }
      );
    } else {
      window.App.SafeToast.error(
        'Streaming Error',
        `${errorMsg}\n\nMax retries reached. Please check your settings or try a different torrent.`,
        0
      );
      retryCount = 0;
    }

    // Trigger error event for other components
    if (App.vent) {
      App.vent.trigger('stream:error', { error: error, torrent: torrent });
    }
  }
};

// Expose retry function for manual retry
window.retryLastTorrent = function() {
  if (lastTorrent) {
    retryCount++;
    console.log('Manual retry triggered');
    handleTorrent(lastTorrent, true);
  } else {
    console.warn('No torrent to retry');
  }
};

window.ondrop = function (e) {
  e.preventDefault();
  $('#drop-mask').hide();
  console.debug('Drag completed');
  $('.drop-indicator').hide();

  var file = e.dataTransfer.files[0];
  var ext = path.extname((file || {}).name || '').toLowerCase();

  // TODO: Make a function 'isSubtitleFile' to avoid having many || everywhere
  if (
    (file != null && ext === '.torrent') ||
    ext === '.srt' ||
    ext === '.smi' ||
    ext === '.sami'
  ) {
    fs.writeFile(
      path.join(App.settings.tmpLocation, file.name),
      fs.readFileSync(file.path),
      function (err) {
        if (err) {
          App.PlayerView.closePlayer();
          window.alert(i18n.__('Error Loading File') + ': ' + err);
        } else {
          if (file.name.indexOf('.torrent') !== -1) {
            Settings.droppedTorrent = file.name;
            handleTorrent(path.join(App.settings.tmpLocation, file.name));
          } else if (ext === '.srt' || ext === '.smi' || ext === '.sami') {
            Settings.droppedSub = file.name;
            App.vent.trigger('videojs:drop_sub');
          }
        }
      }
    );
  } else if (file != null && isVideo(file.name)) {
    handleVideoFile(file);
  } else {
    var data = e.dataTransfer.getData('text/plain');
    Settings.droppedMagnet = data;
    handleTorrent(data);
  }

  return false;
};

// Paste Magnet Link to start stream
$(document).on('paste', function (e) {
  if (e.target.nodeName === 'INPUT' || e.target.nodeName === 'TEXTAREA') {
    return;
  }

  var data = (e.originalEvent || e).clipboardData.getData('text/plain');
  e.preventDefault();

  Settings.droppedMagnet = data;
  handleTorrent(data);
  return true;
});

// nwjs sdk flavor has an invasive context menu
$(document).on('contextmenu', function (e) {
  e.preventDefault();
});

// Pass magnet link as last argument to start stream
var last_arg = nw.App.argv.pop();

if (
  last_arg &&
  (last_arg.substring(0, 8) === 'magnet:?' ||
    last_arg.substring(0, 7) === 'http://' ||
    last_arg.endsWith('.torrent'))
) {
  App.vent.on('app:started', function () {
    handleTorrent(last_arg);
  });
}

// Play local files
if (last_arg && isVideo(last_arg)) {
  App.vent.on('app:started', function () {
    var fileModel = {
      path: last_arg,
      name: /([^\\]+)$/.exec(last_arg)[1]
    };
    handleVideoFile(fileModel);
  });
}

// VPN
let subscribed = false;
const subscribeEvents = () => {
  const appInstalled = VPNht.isInstalled();
  if (subscribed || !appInstalled) {
    return;
  }
  try {
    const vpnStatus = VPNht.status();

    vpnStatus.on('connected', () => {
      App.vent.trigger('vpn:connected');
    });

    vpnStatus.on('disconnected', () => {
      App.vent.trigger('vpn:disconnected');
    });

    vpnStatus.on('error', error => {
      console.log('ERROR', error);
    });

    subscribed = true;
  } catch (error) {
    console.log(error);
    subscribed = false;
  }
};

const checkVPNStatus = () => {
  try {
    const appInstalled = VPNht.isInstalled();
    if (!appInstalled) {
      return;
    }

    VPNht.isConnected().then(isConnected => {
      console.log(isConnected);
      if (isConnected) {
        App.vent.trigger('vpn:connected');
      }
    });
  } catch (error) {
    console.log(error);
  }
};

App.vent.on('app:started', function () {
  subscribeEvents();
  checkVPNStatus();
});

App.vent.on('vpn:open', function () {
  try {
    const appInstalled = VPNht.isInstalled();
    if (!appInstalled) {
      App.vent.trigger('vpn:show');
    } else {
      VPNht.open();
      subscribeEvents();
    }
  } catch (error) {
    console.log(error);
  }
});

App.vent.on('vpn:install', function () {
  try {
    const appInstalled = VPNht.isInstalled();
    if (!appInstalled) {
      VPNht.install().then(installer => {
        installer.on('download', data => {
          if (data && data.percent) {
            App.vent.trigger('vpn:installProgress', data.percent);
          }
        });

        installer.on('downloaded', () => {
          App.vent.trigger('vpn:downloaded');
        });

        installer.on('installed', () => {
          VPNht.open();
          subscribeEvents();
        });

        installer.on('error', data => {
          console.log(data);
        });
      });
    } else {
      VPNht.open();
      subscribeEvents();
    }
  } catch (error) {
    console.log(error);
  }
});

// Mobile: Command-line file opening not supported
// Deep linking for magnet links and video files will be handled via App.addListener('appUrlOpen')
// # TODO: Implement deep link handler in main.js for magnet:// and video file URIs

// Mobile: Window focus management not needed - apps are always focused when visible

// Mobile: Command-line arguments not supported
// Fullscreen is handled automatically by video player
// Background/foreground state managed by OS

// Mobile: Global error handling using window.onerror
window.onerror = function (message, source, lineno, colno, error) {
  try {
    if (message && message.indexOf('[sprintf]') !== -1) {
      var currentLocale =
        App.Localization.langcodes[i18n.getLocale()].nativeName;
      AdvSettings.set('language', 'en');
      i18n.setLocale('en');
      App.vent.trigger('movies:list');
      $('.notification_alert')
        .show()
        .html('An error occured with the localization in ' + currentLocale)
        .delay(4000)
        .fadeOut(400);
    }
  } catch (e) { }
  win.error(error || message, error ? error.stack : '');
};
