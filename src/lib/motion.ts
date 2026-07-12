// Motion-Dauer-Tokens (Anforderungsdokument §11), in Sekunden für Framer
// Motion. Dieselben Werte in Millisekunden liegen als CSS-Variablen in
// globals.css (--duration-*) für reine CSS-Transitions – zwei Formate, eine
// Quelle an Zahlen, damit sie nicht auseinanderlaufen.
export const MOTION_DURATION = {
  hover: 0.2,
  button: 0.15,
  reveal: 0.4,
  page: 0.4,
  sheet: 0.3,
  marker: 0.7,
} as const;

// Entspricht --ease-standard in globals.css.
export const EASE_STANDARD = [0.21, 0.47, 0.32, 0.98] as const;
