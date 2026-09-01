import { LANGUAGE_OPTIONS, translations } from "../../constants";
import { sanitizeUrl } from "../../services/api";

describe("SettingsScreen contracts", () => {
  it("exposes the supported language choices used by the settings UI", () => {
    expect(LANGUAGE_OPTIONS).toEqual(["en", "de", "es", "it", "fr"]);
    expect(LANGUAGE_OPTIONS).toContain("fr");
  });

  it("uses localized labels in the settings screen strings", () => {
    expect(translations.en.settingsTitle).toBe("Settings");
    expect(translations.fr.settingsTitle).toBe("Réglages");
    expect(translations.es.language).toBe("Idioma");
  });

  it("sanitizes raw server URLs for the settings flow", () => {
    expect(sanitizeUrl(" http://localhost:11434/ ")).toBe(
      "http://localhost:11434",
    );
    expect(sanitizeUrl("localhost:11434/")).toBe("http://localhost:11434");
    expect(sanitizeUrl("   ")).toBe("");
  });
});
