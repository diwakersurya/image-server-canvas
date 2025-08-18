/**
 * Multilingual greeting messages
 */

export const MESSAGES: Record<string, string> = {
  "Afrikaans": "Hallo",
  "Albanian": "Përshëndetje (Per-shen-DEAT-ye)",
  "Arabic": "مرحبا (marhabaan)",
  "Azerbaijani": "Salam",
  "Basque": "Kaixo",
  "Breton": "Demat",
  "Bulgarian": "Здравейте (Zdraveĭte)",
  "Catalan": "Hola",
  "Chichewa": "Moni",
  "Corsican": "Bonghjornu",
  "Croatian": "Bok",
  "Czech": "Ahoj",
  "Danish": "Hej",
  "Dutch": "Hallo",
  "English": "Hello",
  "Espetanto": "Saluton",
  "Estonian": "Tere",
  "Filipino": "Kamusta",
  "Finnish": "Hei",
  "French": "Bonjour",
  "Georgian": "მიესალმები (miesalmebi)",
  "German": "Hallo",
  "Greek": "Χαίρε (chai-ray)",
  "Hausa": "Hello",
  "Hebrew": "שלום (shalom)",
  "Hindi": "नमस्ते (namaste)",
  "Hungarian": "Helló",
  "Irish": "Dia dhuit",
  "Korean": "안녕하세요",
  "Italian": "Ciao",
  "Lao": "ສະບາຍດີ (sabaidi)",
  "Latin": "Salve",
  "Lithuanian": "Sveiki",
  "Maltese": "Bongu",
  "Nepali": "नमस्ते (namaste)",
  "Pashto": "سلام (salam)",
  "Portugese": "Olá",
  "Romanian": "Buna",
  "Samoan": "Talofa",
  "Shona": "Mhoro",
  "Slovak": "Ahoj",
  "Slovenian": "Zdravo",
  "Spanish": "Hola",
  "Swahili": "Hodi",
  "Tamil": "வணக்கம் (vanakaam)",
  "Turkish": "Merhaba",
  "Vietnamese": "chào bạn",
  "Welsh": "Helo",
  "Yiddish": "העלא (hela)",
  "Zulu": "Sawubona"
};

/**
 * Get a random greeting message
 */
export function getRandomGreeting(): { language: string; message: string } {
  const languages = Object.keys(MESSAGES);
  const randomIndex = Math.floor(Math.random() * languages.length);
  const language = languages[randomIndex];
  const message = MESSAGES[language];
  
  return { language, message };
}

/**
 * Get all available messages
 */
export function getAllMessages(): Record<string, string> {
  return { ...MESSAGES };
}