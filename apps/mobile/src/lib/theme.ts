import { useCSSVariable } from "uniwind";

function color(value: string | number | undefined, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

/** Colors needed by native navigation APIs, which cannot consume className. */
export function useNavigationColors() {
  const [background, foreground, primary, muted, border, card] = useCSSVariable([
    "--color-background",
    "--color-foreground",
    "--color-primary",
    "--color-muted-foreground",
    "--color-border",
    "--color-card",
  ]);

  return {
    background: color(background, "#0a0a0c"),
    foreground: color(foreground, "#f4f4f6"),
    primary: color(primary, "#8b5cf6"),
    muted: color(muted, "#9494a0"),
    border: color(border, "#24242c"),
    card: color(card, "#141418"),
  };
}
