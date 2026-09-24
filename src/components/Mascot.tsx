import type { AnimalKey } from "@/lib/types";
import { cn } from "@/lib/utils";

export type Mood = "happy" | "wave" | "sparkle" | "dizzy" | "lucky";

interface AnimalStyle {
  label: string;
  fur: string;
  inner: string;
  ear: "pointy" | "round" | "long" | "tiny" | "none";
  extra?: "panda" | "penguin" | "frog";
}

export const ANIMALS: Record<AnimalKey, AnimalStyle> = {
  cat: { label: "Kucing", fur: "#f7c59f", inner: "#ffe8d6", ear: "pointy" },
  panda: { label: "Panda", fur: "#f4f1ec", inner: "#ffffff", ear: "round", extra: "panda" },
  bunny: { label: "Kelinci", fur: "#f6dff0", inner: "#ffeef9", ear: "long" },
  fox: { label: "Rubah", fur: "#ffab76", inner: "#fff0e2", ear: "pointy" },
  penguin: { label: "Pinguin", fur: "#bcd8ff", inner: "#ffffff", ear: "none", extra: "penguin" },
  bear: { label: "Beruang", fur: "#d8b08c", inner: "#f6e3d0", ear: "round" },
  frog: { label: "Kodok", fur: "#b7e4a8", inner: "#e4f7dc", ear: "tiny", extra: "frog" },
  shiba: { label: "Shiba", fur: "#ffd59e", inner: "#fff3e0", ear: "pointy" },
};

export const ANIMAL_KEYS = Object.keys(ANIMALS) as AnimalKey[];

function Eyes({ mood }: { mood: Mood }) {
  if (mood === "dizzy") {
    return (
      <g stroke="#3d2b2b" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M30 46 l10 10 M40 46 l-10 10" />
        <path d="M60 46 l10 10 M70 46 l-10 10" />
      </g>
    );
  }
  if (mood === "sparkle" || mood === "lucky") {
    return (
      <g fill="#3d2b2b">
        <path d="M35 42 l4 8 8 4 -8 4 -4 8 -4 -8 -8 -4 8 -4z" />
        <path d="M65 42 l4 8 8 4 -8 4 -4 8 -4 -8 -8 -4 8 -4z" />
      </g>
    );
  }
  return (
    <g fill="#3d2b2b">
      <ellipse cx="35" cy="51" rx="5.5" ry="6.5" />
      <ellipse cx="65" cy="51" rx="5.5" ry="6.5" />
      <circle cx="37" cy="48.5" r="2" fill="#fff" />
      <circle cx="67" cy="48.5" r="2" fill="#fff" />
    </g>
  );
}

export function Mascot({
  animal,
  mood = "happy",
  className,
}: {
  animal: AnimalKey;
  mood?: Mood;
  className?: string;
}) {
  const style = ANIMALS[animal] ?? ANIMALS.cat;

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn(
        "h-14 w-14 shrink-0",
        mood === "wave" && "animate-chibi-wave",
        mood === "sparkle" && "animate-chibi-bounce",
        mood === "dizzy" && "animate-chibi-wobble",
        mood === "lucky" && "animate-chibi-bounce",
        className,
      )}
      role="img"
      aria-label={style.label}
    >
      {/* ears */}
      {style.ear === "pointy" && (
        <g fill={style.fur} stroke="#3d2b2b" strokeWidth="3" strokeLinejoin="round">
          <path d="M22 30 L20 8 L42 20 Z" />
          <path d="M78 30 L80 8 L58 20 Z" />
        </g>
      )}
      {style.ear === "round" && (
        <g fill={style.extra === "panda" ? "#3d2b2b" : style.fur} stroke="#3d2b2b" strokeWidth="3">
          <circle cx="24" cy="20" r="12" />
          <circle cx="76" cy="20" r="12" />
        </g>
      )}
      {style.ear === "long" && (
        <g fill={style.fur} stroke="#3d2b2b" strokeWidth="3" strokeLinejoin="round">
          <ellipse cx="33" cy="16" rx="8" ry="18" />
          <ellipse cx="67" cy="16" rx="8" ry="18" />
        </g>
      )}
      {style.ear === "tiny" && (
        <g fill={style.fur} stroke="#3d2b2b" strokeWidth="3">
          <circle cx="27" cy="22" r="9" />
          <circle cx="73" cy="22" r="9" />
        </g>
      )}

      {/* head */}
      <circle cx="50" cy="55" r="36" fill={style.fur} stroke="#3d2b2b" strokeWidth="3.5" />
      <ellipse cx="50" cy="63" rx="26" ry="22" fill={style.inner} />

      {style.extra === "panda" && (
        <g fill="#3d2b2b">
          <ellipse cx="35" cy="51" rx="11" ry="13" />
          <ellipse cx="65" cy="51" rx="11" ry="13" />
        </g>
      )}
      {style.extra === "penguin" && (
        <path d="M50 38 a24 22 0 0 1 24 22 a24 30 0 0 1 -48 0 a24 22 0 0 1 24 -22z" fill="#2f3b52" opacity="0.18" />
      )}
      {style.extra === "frog" && (
        <g fill={style.fur} stroke="#3d2b2b" strokeWidth="3">
          <circle cx="32" cy="34" r="12" />
          <circle cx="68" cy="34" r="12" />
        </g>
      )}

      <Eyes mood={mood} />

      {/* blush */}
      <ellipse cx="24" cy="63" rx="7" ry="4.5" fill="#ff9aa8" opacity="0.6" />
      <ellipse cx="76" cy="63" rx="7" ry="4.5" fill="#ff9aa8" opacity="0.6" />

      {/* nose + mouth */}
      <path d="M46 62 h8 l-4 5 z" fill="#3d2b2b" />
      {mood === "dizzy" ? (
        <path d="M42 76 q8 -7 16 0" stroke="#3d2b2b" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M42 70 q8 10 16 0" stroke="#3d2b2b" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}
