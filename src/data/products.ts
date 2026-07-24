export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: string[];
  sizes: Size[];
  color: string;
  colorHex: string;
  description: string;
  details: string[];
  collection: string;
  category: string;
  inStock: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
}

export interface Size {
  label: string;
  available: boolean;
}

export const products: Product[] = [
  {
    id: "ss-001",
    name: "Void Tee",
    slug: "void-tee-black",
    price: 2999,
    images: [
      "/images/products/tee-black.png",
      "/images/products/tee-black.png",
    ],
    sizes: [
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: true },
      { label: "XXL", available: false },
    ],
    color: "Void Black",
    colorHex: "#0A0A0A",
    description: "300 GSM heavyweight cotton. Oversized drop-shoulder cut. Ribbed collar. Washed finish.",
    details: [
      "100% premium combed cotton",
      "300 GSM heavyweight jersey",
      "Oversized drop-shoulder fit",
      "Ribbed crewneck collar",
      "Bio-washed for softness",
      "Made in India",
    ],
    collection: "Drop 001",
    category: "Tees",
    inStock: true,
    isNew: true,
    isFeatured: true,
  },
  {
    id: "ss-002",
    name: "Static Tee",
    slug: "static-tee-charcoal",
    price: 2999,
    images: [
      "/images/products/tee-charcoal.png",
      "/images/products/tee-charcoal.png",
    ],
    sizes: [
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: true },
      { label: "XXL", available: true },
    ],
    color: "Washed Charcoal",
    colorHex: "#3D3D3D",
    description: "300 GSM heavyweight cotton. Oversized drop-shoulder cut. Enzyme-washed charcoal finish.",
    details: [
      "100% premium combed cotton",
      "300 GSM heavyweight jersey",
      "Oversized drop-shoulder fit",
      "Enzyme-washed finish",
      "Relaxed collar",
      "Made in India",
    ],
    collection: "Drop 001",
    category: "Tees",
    inStock: true,
    isNew: true,
    isFeatured: true,
  },
  {
    id: "ss-003",
    name: "Noise Tee",
    slug: "noise-tee-ivory",
    price: 2999,
    images: [
      "/images/products/tee-ivory.png",
      "/images/products/tee-ivory.png",
    ],
    sizes: [
      { label: "S", available: false },
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: true },
      { label: "XXL", available: true },
    ],
    color: "Off-White",
    colorHex: "#F0EDE8",
    description: "300 GSM heavyweight cotton. Oversized drop-shoulder cut. Raw ivory tone with natural texture.",
    details: [
      "100% premium combed cotton",
      "300 GSM heavyweight jersey",
      "Oversized drop-shoulder fit",
      "Garment-dyed ivory",
      "Reinforced shoulder seams",
      "Made in India",
    ],
    collection: "Drop 001",
    category: "Tees",
    inStock: true,
    isNew: true,
    isFeatured: true,
  },
  {
    id: "ss-004",
    name: "Signal Tee",
    slug: "signal-tee-olive",
    price: 3199,
    images: [
      "/images/products/tee-olive.png",
      "/images/products/tee-olive.png",
    ],
    sizes: [
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: false },
      { label: "XXL", available: false },
    ],
    color: "Faded Olive",
    colorHex: "#5C6B4F",
    description: "300 GSM heavyweight cotton. Oversized drop-shoulder cut. Garment-dyed olive with faded wash.",
    details: [
      "100% premium combed cotton",
      "300 GSM heavyweight jersey",
      "Oversized drop-shoulder fit",
      "Garment-dyed with fade wash",
      "Double-stitched hems",
      "Made in India",
    ],
    collection: "Drop 001",
    category: "Tees",
    inStock: true,
    isNew: true,
  },
  {
    id: "ss-005",
    name: "Drift Tee",
    slug: "drift-tee-washed-grey",
    price: 2999,
    images: [
      "/images/products/tee-washed-grey.png",
      "/images/products/tee-washed-grey.png",
    ],
    sizes: [
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: true },
      { label: "XXL", available: true },
    ],
    color: "Washed Stone",
    colorHex: "#9A9A9A",
    description: "300 GSM heavyweight cotton. Oversized drop-shoulder cut. Stone-washed grey with lived-in softness.",
    details: [
      "100% premium combed cotton",
      "300 GSM heavyweight jersey",
      "Oversized drop-shoulder fit",
      "Stone-washed finish",
      "Relaxed crewneck",
      "Made in India",
    ],
    collection: "Drop 001",
    category: "Tees",
    inStock: true,
    isNew: true,
    isFeatured: true,
  },
  {
    id: "ss-006",
    name: "Echo Tee",
    slug: "echo-tee-charcoal",
    price: 3199,
    comparePrice: 3599,
    images: [
      "/images/products/tee-charcoal.png",
      "/images/products/tee-charcoal.png",
    ],
    sizes: [
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: false },
      { label: "XL", available: true },
      { label: "XXL", available: false },
    ],
    color: "Dark Charcoal",
    colorHex: "#2A2A2A",
    description: "320 GSM heavyweight cotton. Oversized boxy cut. Double-layered collar. Heavy enzyme wash.",
    details: [
      "100% premium combed cotton",
      "320 GSM extra-heavyweight jersey",
      "Oversized boxy fit",
      "Double-layered collar",
      "Heavy enzyme wash",
      "Made in India",
    ],
    collection: "Drop 002",
    category: "Tees",
    inStock: true,
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCollection(collection: string): Product[] {
  return products.filter((p) => p.collection === collection);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.isFeatured);
}
