import React from "react";
import { renderMarkdownText } from "../markdown";

function flattenText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") {
    return "";
  }

  if (Array.isArray(node)) {
    return node.map(flattenText).join("");
  }

  if (React.isValidElement(node)) {
    return flattenText((node.props as { children?: React.ReactNode }).children);
  }

  return String(node);
}

describe("renderMarkdownText", () => {
  it("preserves section spacing and newlines around headings and code blocks", () => {
    const sample = [
      "useremo **FastAPI**. È il framework più moderno, veloce e utilizzato oggi per creare API di Intelligenza Artificiale.",
      "",
      "### 1. Preparazione dell'ambiente",
      "Oltre alle librerie precedenti, devi installare `fastapi` (il framework) e `uvicorn` (il motore che fa girare il server).",
      "",
      "Apri il tuo terminale e scrivi:",
      "```bash",
      "pip install fastapi uvicorn openai duckduckgo_search",
      "```",
    ].join("\n");

    const rendered = renderMarkdownText(sample) as React.ReactNode[];
    const text = rendered.map((block) => flattenText(block)).join("");

    expect(text).toContain("useremo FastAPI. È il framework più moderno");
    expect(text).toContain("1. Preparazione dell'ambiente");
    expect(text).toContain("Oltre alle librerie precedenti");
    expect(text).toContain("devi installare fastapi");
    expect(text).toContain("Apri il tuo terminale e scrivi:");
    expect(text).toContain("pip install fastapi uvicorn openai duckduckgo_search");
    expect(text).not.toContain("**FastAPI**");
    expect(text).not.toContain("```");
  });

  it("renders the restaurant architecture explanation with rule separators and numbered lists", () => {
    const sample = [
      "Questa è la domanda fondamentale per capire l'architettura di un software moderno. La risposta breve è: **Il codice Python va sul TUO server (il Backend).**",
      "",
      "Non lo metti né nella app (lato utente), né sul server dove risiedo io (il server di OpenAI/Google).",
      "",
      "Per non fare confusione, usiamo l'**analogia del ristorante**. È il modo più semplice per capire chi fa cosa.",
      "",
      "---",
      "",
      "### L'Analogia del Ristorante 🍽️",
      "",
      "Immagina di voler creare un ristorante dove i clienti possono ordinare piatti complessi.",
      "",
      "1.  **Il Cliente (L'Utente):** È la persona che usa la tua App.",
      "2.  **Il Menù e il Cameriere (La tua App/Frontend):** L'app è solo l'interfaccia. Il cliente guarda il menù, preme un tasto (\"Voglio una ricerca sul web\") e il cameriere (l'app) porta la richiesta in cucina. **Il cameriere non cucina, porta solo messaggi.**",
      "3.  **La Cucina (Il TUO Server/Backend):** Qui è dove risiede il tuo **codice Python**. In cucina ci sono gli chef, i fornelli, gli ingredienti e gli strumenti (le funzioni `web_search`, i database, ecc.). Quando il cameriere arriva con l'ordine, lo chef (il tuo codice) decide cosa fare.",
      "4.  **Il Libro delle Ricette Magiche (L'IA/Il Modello):** Immagina che lo chef, per cucinare, debba consultare un libro di ricette magico e potentissimo che si trova in un altro palazzo (il server di OpenAI). Lo chef chiama il palazzo, chiede la ricetta, riceve l'istruzione e poi la esegue nella sua cucina.",
      "",
      "---",
      "",
      "### Perché non puoi mettere il codice Python nella App?",
      "",
      "Ci sono tre motivi critici:",
      "",
      "#### 1. La Sicurezza (Il motivo più importante! 🛡️)",
      "Se metti il codice Python nella app, la tua **API KEY** (la chiave segreta che paghi per usare l'IA) sarebbe scritta dentro il codice dell'app.",
      "Un hacker esperto potrebbe \"smontare\" (fare il reverse engineering) la tua app, estrarre la chiave e usarla tutta per sé. Risultato: **tu paghi il conto dell'IA per le azioni dell'hacker.**",
      "",
      "#### 2. La Potenza e gli Strumenti (I \"Superpoteri\" 🛠️)",
      "L'agente ha bisogno di \"strumenti\" (come la ricerca sul web tramite `duckduckgo_search`). Questi strumenti spesso richiedono librerie pesanti o l'accesso a risorse che un telefono cellulare o un browser non possono gestire bene o in modo sicuro. Il server è un ambiente controllato e potente.",
      "",
      "#### 3. L'Aggiornabilità (La comodità 🔄)",
      "Se decidi di cambiare il modo in cui l'agente cerca sul web, e il codice è sul **tuo server**, ti basta cambiare una riga di codice sul server e *tutti* gli utenti dell'app avranno subito la versione nuova.",
      "Se il codice fosse nella **app**, dovresti pubblicare una nuova versione dell'app su App Store o Play Store e aspettare che tutti gli utenti facciano l'aggiornamento.",
      "",
      "---",
      "",
      "### Quindi, qual è lo schema finale del tuo progetto?",
      "",
      "Ecco come deve apparire il flusso dei dati:",
      "",
      "1.  **UTENTE** $\\rightarrow$ digita \"Chi ha vinto l'Oscar?\" $\\rightarrow$ **APP (Frontend)**",
      "2.  **APP** $\\rightarrow$ invia la domanda tramite internet $\\rightarrow$ **TUO SERVER (Backend con Python)**",
      "3.  **TUO SERVER** $\\rightarrow$ legge la domanda, vede che serve una ricerca, esegue `web_search()` $\\rightarrow$ **INTERNET**",
      "4.  **INTERNET** $\\rightarrow$ restituisce i risultati al $\\rightarrow$ **TUO SERVER**",
      "5.  **TUO SERVER** $\\rightarrow$ invia [Domanda + Risultati Ricerca] $\\rightarrow$ **SERVER IA (OpenAI/Gemini)**",
      "6.  **SERVER IA** $\\rightarrow$ elabora la risposta finale $\\rightarrow$ **TUO SERVER**",
      "7.  **TUO SERVER** $\\rightarrow$ invia la risposta pulita $\\rightarrow$ **APP**",
      "8.  **APP** $\\rightarrow$ mostra il testo all'utente.",
      "",
      "### Cosa ti serve per iniziare concretamente?",
      "",
      "Per mettere in piedi \"La Cucina\" (il tuo server), dovrai imparare a usare un \"Framework Web\" in Python. I due più usati sono:",
      "*   **Flask:** Leggero, semplice, perfetto per iniziare.",
      "*   **FastAPI:** Moderno, velocissimo, è lo standard attuale per chi lavora con l'IA.",
      "",
      "**Vuoi che ti mostri come trasformare quello script Python che abbiamo visto prima in un vero e proprio \"Server\" usando FastAPI?** Così potrai iniziare a \"chiamarlo\" dalla tua app.",
    ].join("\n");

    const rendered = renderMarkdownText(sample) as React.ReactNode[];
    const joined = rendered.map((block) => flattenText(block)).join("\n");

    expect(joined).toContain("Questa è la domanda fondamentale");
    expect(joined).toContain("Il codice Python va sul TUO server");
    expect(joined).toContain("L'Analogia del Ristorante");
    expect(joined).toContain("Il Cliente (L'Utente):");
    expect(joined).toContain("Ci sono tre motivi critici:");
    expect(joined).toContain("1. Il Cliente (L'Utente):");
    expect(joined).toContain("Flask:");
    expect(joined).toContain("FastAPI:");
    expect(joined).not.toContain("**Il codice Python va sul TUO server (il Backend).**");
    expect(joined).not.toContain("---");
  });

  it("keeps headings, numbered lists, and separators on their own markdown lines", () => {
    const sample = [
      "Intro line before the heading.",
      "### Title",
      "1. first item",
      "2. second item",
      "---",
      "Paragraph after the divider.",
    ].join("\n");

    const rendered = renderMarkdownText(sample) as React.ReactNode[];
    const joined = rendered.map((block) => flattenText(block)).join("");

    expect(joined).toContain("Intro line before the heading.");
    expect(joined).toContain("Title");
    expect(joined).toContain("1. first item");
    expect(joined).toContain("2. second item");
    expect(joined).toContain("Paragraph after the divider.");
    expect(joined).not.toContain("Title1.");
    expect(joined).not.toContain("second item---");
  });

  it("keeps headings with surrounding blank lines in markdown blocks", () => {
    const sample = [
      "Intro paragraph before.",
      "### L'Analogia del Ristorante 🍽️",
      "Paragraph after the heading.",
    ].join("\n");

    const rendered = renderMarkdownText(sample) as React.ReactNode[];
    const joined = rendered.map((block) => flattenText(block)).join("");

    expect(joined).toContain("Intro paragraph before.");
    expect(joined).toContain("L'Analogia del Ristorante");
    expect(joined).toContain("Paragraph after the heading.");
    expect(joined).not.toContain("before.###");
    expect(joined).not.toContain("🍽️Paragraph");
  });

  it("replaces LaTeX arrows with unicode arrow glyphs", () => {
    const sample = [
      "A $\\rightarrow$ B",
      "C $\\leftarrow$ D",
    ].join("\n");

    const rendered = renderMarkdownText(sample) as React.ReactNode[];
    const joined = rendered.map((block) => flattenText(block)).join("");

    expect(joined).toContain("A → B");
    expect(joined).toContain("C ← D");
    expect(joined).not.toContain("$\\rightarrow$");
    expect(joined).not.toContain("$\\leftarrow$");
  });
});
