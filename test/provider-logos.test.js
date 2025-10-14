import { describe, it, expect, beforeEach } from 'vitest';

// Mock window and App namespace
globalThis.window = { App: {} };

// Import provider-logos
const ProviderLogosModule = await import('../src/app/lib/provider-logos.js');
const ProviderLogos = window.ProviderLogos || window.App?.ProviderLogos;

describe('ProviderLogos', () => {
    describe('getProvider()', () => {
        it('should return MIT provider for exact match', () => {
            const result = ProviderLogos.getProvider('MIT');
            expect(result.name).toBe('MIT');
            expect(result.color).toBe('#A31F34');
            expect(result.logo).toContain('MIT_logo');
            expect(result.textColor).toBe('#ffffff');
        });

        it('should return Stanford provider for exact match', () => {
            const result = ProviderLogos.getProvider('Stanford');
            expect(result.name).toBe('Stanford');
            expect(result.color).toBe('#8C1515');
            expect(result.logo).toContain('Stanford');
        });

        it('should match case-insensitively', () => {
            const result = ProviderLogos.getProvider('mit');
            expect(result.name).toBe('MIT');
        });

        it('should match case-insensitively for mixed case', () => {
            const result = ProviderLogos.getProvider('StAnFoRd');
            expect(result.name).toBe('Stanford');
        });

        it('should return Harvard provider', () => {
            const result = ProviderLogos.getProvider('Harvard');
            expect(result.name).toBe('Harvard');
            expect(result.color).toBe('#A51C30');
        });

        it('should return UC Berkeley provider', () => {
            const result = ProviderLogos.getProvider('UC Berkeley');
            expect(result.name).toBe('UC Berkeley');
            expect(result.color).toBe('#003262');
        });

        it('should return Yale provider', () => {
            const result = ProviderLogos.getProvider('Yale');
            expect(result.name).toBe('Yale');
            expect(result.color).toBe('#00356B');
        });

        it('should return Princeton provider', () => {
            const result = ProviderLogos.getProvider('Princeton');
            expect(result.name).toBe('Princeton');
            expect(result.color).toBe('#FF8F00');
            expect(result.textColor).toBe('#000000');
        });

        it('should return Udemy provider', () => {
            const result = ProviderLogos.getProvider('Udemy');
            expect(result.name).toBe('Udemy');
            expect(result.color).toBe('#A435F0');
        });

        it('should return Coursera provider', () => {
            const result = ProviderLogos.getProvider('Coursera');
            expect(result.name).toBe('Coursera');
            expect(result.color).toBe('#0056D2');
        });

        it('should return edX provider', () => {
            const result = ProviderLogos.getProvider('edX');
            expect(result.name).toBe('edX');
            expect(result.color).toBe('#02262B');
        });

        it('should return Khan Academy provider', () => {
            const result = ProviderLogos.getProvider('Khan Academy');
            expect(result.name).toBe('Khan Academy');
            expect(result.color).toBe('#14BF96');
        });

        it('should return Caltech provider', () => {
            const result = ProviderLogos.getProvider('Caltech');
            expect(result.name).toBe('Caltech');
            expect(result.color).toBe('#FF6C0C');
        });

        it('should return Oxford provider', () => {
            const result = ProviderLogos.getProvider('Oxford');
            expect(result.name).toBe('Oxford');
            expect(result.color).toBe('#002147');
        });

        it('should return Cambridge provider', () => {
            const result = ProviderLogos.getProvider('Cambridge');
            expect(result.name).toBe('Cambridge');
            expect(result.color).toBe('#A3C1AD');
            expect(result.textColor).toBe('#000000');
        });
    });

    describe('Partial Matching', () => {
        it('should match partial provider name in string', () => {
            const result = ProviderLogos.getProvider('MIT OpenCourseWare');
            expect(result.name).toBe('MIT');
        });

        it('should match provider name within longer string', () => {
            const result = ProviderLogos.getProvider('Stanford University');
            expect(result.name).toBe('Stanford');
        });

        it('should match UC Berkeley variations', () => {
            const result = ProviderLogos.getProvider('Berkeley');
            expect(result.name).toBe('UC Berkeley');
        });
    });

    describe('getDefaultProvider()', () => {
        it('should return default provider for unknown name', () => {
            const result = ProviderLogos.getProvider('Unknown University');
            expect(result.name).toBe('Academic Torrents');
            expect(result.color).toBe('#4A90E2');
            expect(result.logo).toBeNull();
            expect(result.textColor).toBe('#ffffff');
        });

        it('should return default provider for null', () => {
            const result = ProviderLogos.getProvider(null);
            expect(result.name).toBe('Academic Torrents');
        });

        it('should return default provider for undefined', () => {
            const result = ProviderLogos.getProvider(undefined);
            expect(result.name).toBe('Academic Torrents');
        });

        it('should return default provider for empty string', () => {
            const result = ProviderLogos.getProvider('');
            expect(result.name).toBe('Academic Torrents');
        });

        it('should call getDefaultProvider directly', () => {
            const result = ProviderLogos.getDefaultProvider();
            expect(result.name).toBe('Academic Torrents');
            expect(result.color).toBe('#4A90E2');
            expect(result.logo).toBeNull();
            expect(result.textColor).toBe('#ffffff');
        });
    });

    describe('getProviderStyle()', () => {
        it('should return CSS style object for MIT', () => {
            const style = ProviderLogos.getProviderStyle('MIT');
            expect(style['background-color']).toBe('#A31F34');
            expect(style['color']).toBe('#ffffff');
        });

        it('should return CSS style object for Princeton', () => {
            const style = ProviderLogos.getProviderStyle('Princeton');
            expect(style['background-color']).toBe('#FF8F00');
            expect(style['color']).toBe('#000000');
        });

        it('should return CSS style object for Cambridge', () => {
            const style = ProviderLogos.getProviderStyle('Cambridge');
            expect(style['background-color']).toBe('#A3C1AD');
            expect(style['color']).toBe('#000000');
        });

        it('should return default style for unknown provider', () => {
            const style = ProviderLogos.getProviderStyle('Unknown');
            expect(style['background-color']).toBe('#4A90E2');
            expect(style['color']).toBe('#ffffff');
        });
    });

    describe('Logo URLs', () => {
        it('should have valid Wikimedia URLs for all providers', () => {
            const providers = ['MIT', 'Stanford', 'Harvard', 'UC Berkeley', 'Yale',
                              'Princeton', 'Caltech', 'Oxford', 'Cambridge'];

            providers.forEach(provider => {
                const result = ProviderLogos.getProvider(provider);
                expect(result.logo).toBeTruthy();
                expect(result.logo).toContain('wikimedia.org');
            });
        });

        it('should have non-Wikipedia URLs for online platforms', () => {
            const platforms = ['Udemy', 'Coursera', 'edX', 'Khan Academy'];

            platforms.forEach(platform => {
                const result = ProviderLogos.getProvider(platform);
                expect(result.logo).toBeTruthy();
            });
        });
    });

    describe('Provider Count', () => {
        it('should have exactly 13 providers', () => {
            const count = Object.keys(ProviderLogos.providers).length;
            expect(count).toBe(13);
        });

        it('should have all expected providers', () => {
            const expectedProviders = [
                'MIT', 'Stanford', 'Harvard', 'UC Berkeley', 'Yale', 'Princeton',
                'Udemy', 'Coursera', 'edX', 'Khan Academy', 'Caltech', 'Oxford', 'Cambridge'
            ];

            expectedProviders.forEach(provider => {
                expect(ProviderLogos.providers[provider]).toBeDefined();
            });
        });
    });

    describe('Data Validation', () => {
        it('should have all required fields for each provider', () => {
            Object.keys(ProviderLogos.providers).forEach(key => {
                const provider = ProviderLogos.providers[key];
                expect(provider.name).toBeDefined();
                expect(provider.color).toBeDefined();
                expect(provider.logo).toBeDefined();
                expect(provider.textColor).toBeDefined();
            });
        });

        it('should have valid hex colors', () => {
            Object.keys(ProviderLogos.providers).forEach(key => {
                const provider = ProviderLogos.providers[key];
                expect(provider.color).toMatch(/^#[0-9A-F]{6}$/i);
                expect(provider.textColor).toMatch(/^#[0-9A-F]{6}$/i);
            });
        });

        it('should have valid logo URLs or null', () => {
            Object.keys(ProviderLogos.providers).forEach(key => {
                const provider = ProviderLogos.providers[key];
                if (provider.logo !== null) {
                    expect(provider.logo).toMatch(/^https?:\/\//);
                }
            });
        });
    });
});
