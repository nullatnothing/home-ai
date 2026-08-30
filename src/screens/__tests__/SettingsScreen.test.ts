import { LANGUAGE_OPTIONS, translations } from '../../constants';

describe('SettingsScreen contracts', () => {
  it('exposes the supported language choices used by the settings UI', () => {
    expect(LANGUAGE_OPTIONS).toEqual(['en', 'de', 'es', 'it', 'fr']);
    expect(LANGUAGE_OPTIONS).toContain('fr');
  });

  it('uses localized labels in the settings screen strings', () => {
    expect(translations.en.settingsTitle).toBe('Settings');
    expect(translations.fr.settingsTitle).toBe('Réglages');
    expect(translations.es.language).toBe('Idioma');
  });
});

