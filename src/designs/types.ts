import type { GiftContent } from "@/lib/db/schema";

export type Occasion = "love" | "proposal" | "anniversary" | "long-distance" | "birthday" | "friends" | "graduation" | "apology";

export type FieldDef = {
  key: string;
  label: string;
  kind: "text" | "textarea";
  max: number;
  placeholder?: string;
  help?: string;
  optional?: boolean;
  /** Filled by the AI writer. Names are always typed by the buyer. */
  ai?: boolean;
};

export type DesignMeta = {
  id: string;
  name: string;
  kind: "page" | "world";
  tagline: string;
  description: string;
  occasions: Occasion[];
  usdCents: number;
  players?: number;
  minutes: string;
  photos: { max: number; label: string };
  /** Present when the gift ends with a question the recipient answers. */
  question?: { field: string; yes: string; no?: string };
  fields: FieldDef[];
  demo: GiftContent;
  palette: { from: string; to: string; ink: string };
};

export type RendererProps = {
  content: GiftContent;
  mode: "live" | "preview" | "demo";
  slug?: string;
  /** Called once when the recipient answers. Resolves when saved. */
  onAnswer?: (answer: string, note?: string) => Promise<void>;
};
