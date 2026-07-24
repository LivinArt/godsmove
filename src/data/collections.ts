export interface Collection {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  heroImage: string;
  campaignImages: string[];
  season: string;
  releaseDate: string;
}

export const collections: Collection[] = [
  {
    id: "drop-001",
    name: "Drop 001",
    slug: "drop-001",
    tagline: "First contact.",
    description: "Heavyweight essentials for the interior monologue. 300 GSM. Oversized. Washed. Quiet on the outside.",
    heroImage: "/images/campaign/editorial-01.png",
    campaignImages: [
      "/images/campaign/editorial-01.png",
      "/images/campaign/editorial-02.png",
    ],
    season: "SS26",
    releaseDate: "2026-05-15",
  },
  {
    id: "drop-002",
    name: "Drop 002",
    slug: "drop-002",
    tagline: "Signal decay.",
    description: "Heavier weight. Heavier wash. The same quiet rebellion at 320 GSM.",
    heroImage: "/images/campaign/editorial-02.png",
    campaignImages: [
      "/images/campaign/editorial-02.png",
    ],
    season: "SS26",
    releaseDate: "2026-06-01",
  },
];

export interface ArchiveEntry {
  id: string;
  title: string;
  slug: string;
  type: "editorial" | "moodboard" | "observation" | "artifact";
  excerpt: string;
  image: string;
  date: string;
  tags: string[];
}

export const archiveEntries: ArchiveEntry[] = [
  {
    id: "arc-001",
    title: "The Weight of a T-Shirt",
    slug: "weight-of-a-tshirt",
    type: "editorial",
    excerpt: "300 grams per square meter. Enough to feel something when you put it on.",
    image: "/images/textures/fabric-texture.png",
    date: "2026-05-07",
    tags: ["fabric", "process", "identity"],
  },
  {
    id: "arc-002",
    title: "Scroll Fatigue",
    slug: "scroll-fatigue",
    type: "observation",
    excerpt: "Everyone has an opinion. Most of them are screenshots of someone else's.",
    image: "/images/campaign/editorial-01.png",
    date: "2026-05-05",
    tags: ["internet", "culture", "observation"],
  },
  {
    id: "arc-003",
    title: "Colour Theory: Void Black",
    slug: "colour-theory-void-black",
    type: "moodboard",
    excerpt: "Black absorbs everything. That's the point.",
    image: "/images/products/tee-black.png",
    date: "2026-05-03",
    tags: ["colour", "design", "void"],
  },
  {
    id: "arc-004",
    title: "Drop 001 Development",
    slug: "drop-001-development",
    type: "artifact",
    excerpt: "From 240 GSM rejects to 300 GSM conviction. Process notes from the first production run.",
    image: "/images/campaign/editorial-02.png",
    date: "2026-04-28",
    tags: ["process", "production", "drop-001"],
  },
];
