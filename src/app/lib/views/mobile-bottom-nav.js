(function (App) {
    'use strict';

    /**
     * MobileBottomNav - Mobile bottom navigation bar
     * Provides quick access to Browse, Favorites, Library, and Learning
     */
    var MobileBottomNav = Marionette.View.extend({
        template: '#mobile-bottom-nav-tpl',
        className: 'mobile-bottom-nav-container',

        events: {
            'click .nav-item': 'onNavItemClick'
        },

        onAttach: function() {
            // Set initial active state
            this.setActive('movies');
        },

        onNavItemClick: function(e) {
            var $target = $(e.currentTarget);
            var route = $target.data('route');

            // Update active state
            this.setActive(route);

            // Trigger navigation
            switch(route) {
                case 'movies':
                    App.vent.trigger('movies:list');
                    break;
                case 'favorites':
                    App.vent.trigger('favorites:list');
                    break;
                case 'library':
                    App.vent.trigger('library:list');
                    break;
                case 'learning':
                    App.vent.trigger('learning:list');
                    break;
            }
        },

        setActive: function(route) {
            this.$('.nav-item').removeClass('active');
            this.$('[data-route="' + route + '"]').addClass('active');
        }
    });

    App.View.MobileBottomNav = MobileBottomNav;
})(window.App);
