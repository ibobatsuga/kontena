export const presets = [
  {
    id: 'bold',
    name: 'Bold Headline',
    desc: 'Foto dominan, headline putih di blok hitam.',
    ref: 1,
    category: 'Berita',
  },
  {
    id: 'yellow',
    name: 'Yellow Bulletin',
    desc: 'Blok kuning kontras dengan judul tebal.',
    ref: 2,
    category: 'Berita',
  },
  {
    id: 'serif',
    name: 'Editorial Serif',
    desc: 'Tipografi serif, panel terang, label merah.',
    ref: 3,
    category: 'Editorial',
  },
  {
    id: 'highlight',
    name: 'News Highlight',
    desc: 'Foto penuh dengan sorotan warna pada judul.',
    ref: 4,
    category: 'Berita',
  },
  {
    id: 'story',
    name: 'Deep Story',
    desc: 'Gradasi gelap, headline dan ringkasan berita.',
    ref: 5,
    category: 'Editorial',
  },
  {
    id: 'statement',
    name: 'Big Statement',
    desc: 'Judul condensed besar yang menjadi fokus.',
    ref: 6,
    category: 'Editorial',
  },
  {
    id: 'sport',
    name: 'Sport Cover',
    desc: 'Foto penuh, headline tebal di tengah.',
    ref: 7,
    category: 'Olahraga',
  },
];
export const fonts: Record<string, string> = {
  'Bold (Poppins)': 'Poppins',
  'Handwriting (Pangolin)': 'Pangolin',
  'Calligraphy (Pinyon Script)': 'Pinyon Script',
  'Narrow (Archivo Narrow)': 'Archivo Narrow',
  'Minimalist (Raleway)': 'Raleway',
  'Rounded (Nunito)': 'Nunito',
  'Editorial (Playfair Display)': 'Playfair Display',
  'Blackletter (Manufacturing Consent)': 'UnifrakturMaguntia',
  'Playful (Griffy)': 'Griffy',
};
export type Overlay = {
  type: string;
  color1: string;
  color2: string;
  alpha1: number;
  alpha2: number;
  direction: string;
  stops: number[];
  textColor1: string;
  textColor2: string;
};
export type Brief = {
  topic: string;
  referenceUrl: string;
  handle: string;
  slideCount: number;
  niche: string;
  contentType: string;
  tone: string;
  includeCta: boolean;
  characterSubject: string;
  typography: string;
  textAlign: string;
  visualLock: string;
  customTheme: string;
  ratio: string;
  template: string;
};
export type Slide = {
  eyebrow: string;
  headline: string;
  body: string;
  imagePrompt: string;
  image: string;
  isCta?: boolean;
};
export type Design = { cover: Overlay; slide: Overlay; cta: Overlay };
export type Project = {
  id: string;
  title: string;
  brief: Brief;
  design: Design;
  slides: Slide[];
  caption: string;
  createdAt: string;
  updatedAt: string;
};
export type SocialAccount = {
  id: string;
  platform: string;
  name: string;
  username: string | null;
  status: string;
  expiresAt: string | null;
  updatedAt: string;
};
export type Schedule = {
  caption: string;
  images: string[];
  ratio: string;
  accountId?: string;
  accountName?: string;
  id: string;
  projectId: string;
  title: string;
  scheduledAt: string;
  platform: string;
  status: string;
  autoPost: boolean;
  mode: string;
  error?: string;
};
export const initialBrief: Brief = {
  topic: '',
  referenceUrl: '',
  handle: '@kontena',
  slideCount: 5,
  niche: 'Bisnis',
  contentType: 'Edukasi',
  tone: 'Santai & Kasual',
  includeCta: true,
  characterSubject: 'Fokus Objek & Topik (Tanpa Karakter)',
  typography: 'Bold (Poppins)',
  textAlign: 'left',
  visualLock: 'Auto',
  customTheme: '',
  ratio: '4:5',
  template: 'highlight',
};
const base: Overlay = {
  type: 'gradient',
  color1: '#000000',
  color2: '#000000',
  alpha1: 0,
  alpha2: 0.95,
  direction: 'to-b',
  stops: [20, 100],
  textColor1: '#ffffff',
  textColor2: '#00b0a9',
};
export const initialDesign: Design = {
  cover: { ...base },
  slide: { ...base },
  cta: {
    ...base,
    type: 'solid',
    color1: '#f36a23',
    alpha1: 1,
    textColor2: '#ffffff',
  },
};
export const sampleSlide: Slide = {
  eyebrow: 'JELAJAH NUSANTARA',
  headline: 'Di balik megahnya gunung berapi Indonesia',
  body: 'Cerita tentang alam, kekuatan, dan keindahan yang terus bergerak.',
  imagePrompt:
    'Indonesian volcano erupting at night, glowing orange sparks against a dark sky',
  image: '/assets/volcano.png',
};
export const ratios: Record<string, number[]> = {
  '4:5': [1080, 1350],
  '9:16': [1080, 1920],
  '1:1': [1080, 1080],
};
export async function api(path: string, options: RequestInit = {}) {
  const r = await fetch('/api/' + path, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });
  const d: any = await r.json();
  if (!r.ok) throw new Error(d.error || 'Permintaan gagal. Silakan coba lagi.');
  return d;
}
