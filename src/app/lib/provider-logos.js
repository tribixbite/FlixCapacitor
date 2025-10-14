/**
 * Provider Logo Mappings for Learning Section
 * Maps provider names to logo URLs and colors
 */

(function (App) {
    'use strict';

    const ProviderLogos = {
        // Provider logo URLs and branding
        providers: {
            'MIT': {
                name: 'MIT',
                color: '#A31F34',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.svg/200px-MIT_logo.svg.png',
                textColor: '#ffffff'
            },
            'Stanford': {
                name: 'Stanford',
                color: '#8C1515',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Stanford_Cardinal_logo.svg/200px-Stanford_Cardinal_logo.svg.png',
                textColor: '#ffffff'
            },
            'Harvard': {
                name: 'Harvard',
                color: '#A51C30',
                logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/29/Harvard_shield_wreath.svg/200px-Harvard_shield_wreath.svg.png',
                textColor: '#ffffff'
            },
            'UC Berkeley': {
                name: 'UC Berkeley',
                color: '#003262',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Seal_of_University_of_California%2C_Berkeley.svg/200px-Seal_of_University_of_California%2C_Berkeley.svg.png',
                textColor: '#ffffff'
            },
            'Yale': {
                name: 'Yale',
                color: '#00356B',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Yale_University_Shield_1.svg/200px-Yale_University_Shield_1.svg.png',
                textColor: '#ffffff'
            },
            'Princeton': {
                name: 'Princeton',
                color: '#FF8F00',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Princeton_seal.svg/200px-Princeton_seal.svg.png',
                textColor: '#000000'
            },
            'Udemy': {
                name: 'Udemy',
                color: '#A435F0',
                logo: 'https://www.udemy.com/staticx/udemy/images/v7/logo-udemy.svg',
                textColor: '#ffffff'
            },
            'Coursera': {
                name: 'Coursera',
                color: '#0056D2',
                logo: 'https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://coursera_assets.s3.amazonaws.com/images/Coursera_Logo.png',
                textColor: '#ffffff'
            },
            'edX': {
                name: 'edX',
                color: '#02262B',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/EdX_newer_logo.svg/200px-EdX_newer_logo.svg.png',
                textColor: '#ffffff'
            },
            'Khan Academy': {
                name: 'Khan Academy',
                color: '#14BF96',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Khan_Academy_logo_and_wordmark.svg/200px-Khan_Academy_logo_and_wordmark.svg.png',
                textColor: '#ffffff'
            },
            'Caltech': {
                name: 'Caltech',
                color: '#FF6C0C',
                logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a4/Seal_of_the_California_Institute_of_Technology.svg/200px-Seal_of_the_California_Institute_of_Technology.svg.png',
                textColor: '#ffffff'
            },
            'Oxford': {
                name: 'Oxford',
                color: '#002147',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Oxford-University-Circlet.svg/200px-Oxford-University-Circlet.svg.png',
                textColor: '#ffffff'
            },
            'Cambridge': {
                name: 'Cambridge',
                color: '#A3C1AD',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Cambridgecrest.svg/200px-Cambridgecrest.svg.png',
                textColor: '#000000'
            }
        },

        /**
         * Get provider info by name
         * @param {string} providerName - Name of the provider
         * @returns {Object} Provider info with logo, color, etc.
         */
        getProvider: function(providerName) {
            if (!providerName) {
                return this.getDefaultProvider();
            }

            // Try exact match
            if (this.providers[providerName]) {
                return this.providers[providerName];
            }

            // Try case-insensitive match
            const lowerName = providerName.toLowerCase();
            for (const key in this.providers) {
                if (key.toLowerCase() === lowerName) {
                    return this.providers[key];
                }
            }

            // Try partial match
            for (const key in this.providers) {
                if (providerName.includes(key) || key.includes(providerName)) {
                    return this.providers[key];
                }
            }

            return this.getDefaultProvider();
        },

        /**
         * Get default provider info for unknown providers
         */
        getDefaultProvider: function() {
            return {
                name: 'Academic Torrents',
                color: '#4A90E2',
                logo: null,
                textColor: '#ffffff'
            };
        },

        /**
         * Generate CSS for provider badge
         * @param {string} providerName - Name of the provider
         * @returns {Object} CSS properties
         */
        getProviderStyle: function(providerName) {
            const provider = this.getProvider(providerName);
            return {
                'background-color': provider.color,
                'color': provider.textColor
            };
        }
    };

    // Export to App namespace
    App.ProviderLogos = ProviderLogos;

    // Also export to window for global access
    if (typeof window !== 'undefined') {
        window.ProviderLogos = ProviderLogos;
    }

})(window.App);
