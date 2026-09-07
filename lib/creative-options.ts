export const nicheOptions = [
  'Bisnis',
  'Keuangan Pribadi',
  'Investasi',
  'Bisnis Digital',
  'Pengembangan Karir',
  'Kesehatan',
  'Olahraga',
  'Diet & Nutrisi',
  'Kesehatan Mental',
  'Teknologi & Gadget',
  'Ulasan Gadget',
  'Kecerdasan Buatan (AI)',
  'Pemrograman',
  'Gaming',
  'Gaya Hidup & Hiburan',
  'Wisata (Travel)',
  'Kecantikan',
  'Fashion',
  'Kuliner',
  'Parenting',
  'Pernikahan',
  'Hewan Peliharaan',
  'Edukasi & Hobi',
  'Bahasa Asing',
  'Otomotif',
  'Fotografi',
  'Seni & Kerajinan',
];

export const visualThemeOptions = [
  'Auto',
  '3D Cute Render Pixar (Disney)',
  '3D Realistic Wool / Felt (Original)',
  '3D Toy Miniature Render',
  'Anime Studio Ghibli Style',
  'Chalkboard Art (Kapur)',
  'Children Coloring Book Style',
  'Claymorphism Plasticine',
  'Cyberpunk Neon',
  'Embroidery (Sulaman Benang)',
  'Flat Vector Illustration',
  'Glassmorphism Illustration',
  'Gouache Illustration (Matte)',
  'Hand Drawn Sketch (Pencil)',
  'Ink Wash Painting (Sumi-e)',
  'Islamic Geometric Pattern',
  'Isometric 3D Diorama',
  'Low Poly Art',
  'Luxury Editorial Poster',
  'Macro Photography (Realistic)',
  'Minimalist Line Art',
  'Oil Painting Impressionist',
  'Origami / Folded Paper',
  'Paper Collage Handmade',
  'Paper Cutout Layered Paper',
  'Pixel Art 8 bit',
  'Pop Art Style',
  'Quilted Patchwork',
  'Rajut / Knitted',
  'Retro Vintage Poster',
  'Risograph Print Grainy',
  'Silhouette Art Shadow',
  'Soft Pastel Story Illustration',
  'Stained Glass (Kaca Patri)',
  'Sticker Art Die cut',
  'Storybook Illustration (Children)',
  'Synthwave Vaporwave',
  'Ukiyo-e / Japanese Style',
  'Vector Infographic Style',
  'Watercolor / Cat Air',
  'Kustom (Ketik Sendiri)',
];

export const STYLE_BUCKETS = {
  photo: {
    quality:
      'professional commercial photography quality, ultra realistic, high resolution, ultra-detailed, natural color grading, ambient shallow shadows',
    negative:
      'no illustration style, no 3D render, no cartoon style, no painterly style,',
  },
  render3d: {
    quality:
      'professional 3D render quality, high resolution, ultra-detailed textures, studio-quality CGI rendering, soft realistic lighting',
    negative: 'no live-action photography, no flat 2D vector illustration,',
  },
  illustration: {
    quality:
      'professional illustration quality, high resolution, ultra-detailed linework, polished consistent artistic execution',
    negative:
      'no live-action photography, no photorealistic rendering, no 3D CGI render,',
  },
};

export const VISUAL_STYLE_MAP: Record<
  string,
  { bucket: string; style: string }
> = {
  Auto: {
    bucket: 'photo',
    style:
      'editorial lifestyle business photography style, shot on a 50mm prime lens at f/1.8, soft natural window light, warm and muted color palette, candid unposed body language, realistic skin texture, soft background bokeh, shot on a Sony A7IV',
  },
  'Macro Photography (Realistic)': {
    bucket: 'photo',
    style:
      'editorial lifestyle business photography style, shot on a 50mm prime lens at f/1.8, soft natural window light, warm and muted color palette, candid unposed body language, realistic skin texture, soft background bokeh, shot on a Sony A7IV',
  },
  'Luxury Editorial Poster': {
    bucket: 'photo',
    style:
      'high-fashion luxury editorial poster photography, dramatic directional studio lighting, opulent minimal set design, premium magazine-cover aesthetic, rich deep color grading',
  },
  '3D Cute Render Pixar (Disney)': {
    bucket: 'render3d',
    style:
      '3D animated character render in Pixar/Disney feature film style, soft cinematic global illumination, rounded friendly shapes, vibrant saturated colors, subtle subsurface scattering on skin',
  },
  '3D Realistic Wool / Felt (Original)': {
    bucket: 'render3d',
    style:
      '3D render made entirely of felted wool material, soft fuzzy needle-felt texture, handcrafted plush toy aesthetic, warm cozy studio lighting',
  },
  '3D Toy Miniature Render': {
    bucket: 'render3d',
    style:
      '3D rendered miniature toy diorama, tilt-shift shallow depth of field, glossy plastic toy material, vibrant playful colors, tiny-world perspective',
  },
  'Claymorphism Plasticine': {
    bucket: 'render3d',
    style:
      'claymation stop-motion style render, soft plasticine clay texture, matte surfaces, visible fingerprint and sculpting tool marks, gentle pastel clay palette',
  },
  'Isometric 3D Diorama': {
    bucket: 'render3d',
    style:
      'isometric 3D diorama render, precise 30-degree axonometric perspective, miniature scene design, clean geometric shapes, soft ambient occlusion',
  },
  'Low Poly Art': {
    bucket: 'render3d',
    style:
      'low-poly 3D render, faceted geometric surfaces, minimal polygon count, flat-shaded triangulated forms, stylized simplified color palette',
  },
  'Anime Studio Ghibli Style': {
    bucket: 'illustration',
    style:
      'Studio Ghibli-inspired hand-painted anime illustration, soft painterly backgrounds, warm nostalgic color grading, gentle character linework, whimsical atmospheric detail',
  },
  'Chalkboard Art (Kapur)': {
    bucket: 'illustration',
    style:
      'hand-drawn chalk illustration on a dark chalkboard texture, white and pastel chalk strokes, visible chalk dust and smudges, educational aesthetic',
  },
  'Children Coloring Book Style': {
    bucket: 'illustration',
    style:
      "black and white children's coloring book illustration, bold clean thick outlines, no shading, simple friendly rounded shapes",
  },
  'Cyberpunk Neon': {
    bucket: 'illustration',
    style:
      'cyberpunk digital illustration, glowing neon pink and cyan lighting, futuristic urban atmosphere, moody rain-slicked reflective surfaces, high contrast dramatic lighting',
  },
  'Embroidery (Sulaman Benang)': {
    bucket: 'illustration',
    style:
      'detailed embroidery thread art render, visible satin and chain stitching texture on fabric, textile craft aesthetic, soft fabric weave background',
  },
  'Flat Vector Illustration': {
    bucket: 'illustration',
    style:
      'flat vector illustration, clean simplified geometric shapes, bold flat colors with no gradients, modern minimal graphic design aesthetic',
  },
  'Glassmorphism Illustration': {
    bucket: 'illustration',
    style:
      'glassmorphism digital illustration, frosted translucent glass layers, soft blurred gradient background, subtle light refraction, modern aesthetic',
  },
  'Gouache Illustration (Matte)': {
    bucket: 'illustration',
    style:
      'gouache painting illustration, matte opaque pigment texture, soft visible brushstrokes, muted artisanal color mixing',
  },
  'Hand Drawn Sketch (Pencil)': {
    bucket: 'illustration',
    style:
      'hand-drawn pencil sketch illustration, visible graphite shading and crosshatching, raw sketchbook paper texture, monochrome tones',
  },
  'Ink Wash Painting (Sumi-e)': {
    bucket: 'illustration',
    style:
      'traditional sumi-e ink wash painting, minimal expressive brushstrokes, soft graduated black ink tones on textured rice paper, strong negative space',
  },
  'Islamic Geometric Pattern': {
    bucket: 'illustration',
    style:
      'intricate Islamic geometric pattern art style, precise symmetrical tessellation, ornate interlocking linework, rich jewel-toned color accents',
  },
  'Minimalist Line Art': {
    bucket: 'illustration',
    style:
      'minimalist single continuous line art illustration, clean thin uniform strokes, generous negative space, no shading or color fill',
  },
  'Oil Painting Impressionist': {
    bucket: 'illustration',
    style:
      'impressionist oil painting, visible thick expressive brushstrokes, rich textured paint layering, soft diffused natural light',
  },
  'Origami / Folded Paper': {
    bucket: 'illustration',
    style:
      'origami folded paper art render, crisp geometric paper fold creases, subtle paper grain texture, soft directional lighting casting gentle fold shadows',
  },
  'Paper Collage Handmade': {
    bucket: 'illustration',
    style:
      'handmade paper collage art, layered cut paper textures, visible torn edges, mixed paper grain and color layering',
  },
  'Paper Cutout Layered Paper': {
    bucket: 'illustration',
    style:
      'layered paper cutout diorama art, precise clean-cut paper layers, soft drop shadows between layers creating depth, matte paper texture',
  },
  'Pixel Art 8 bit': {
    bucket: 'illustration',
    style:
      'retro 8-bit pixel art, visible chunky square pixels, limited retro color palette, crisp hard edges, nostalgic video game aesthetic',
  },
  'Pop Art Style': {
    bucket: 'illustration',
    style:
      'pop art illustration in bold comic style, halftone dot patterns, thick black outlines, vibrant primary color blocks',
  },
  'Quilted Patchwork': {
    bucket: 'illustration',
    style:
      'quilted fabric patchwork art, visible stitched seams between fabric patches, soft cotton textile texture, warm homespun color palette',
  },
  'Rajut / Knitted': {
    bucket: 'illustration',
    style:
      'knitted yarn texture art render, visible looped knit stitching pattern, soft wool fiber texture, cozy handcrafted aesthetic',
  },
  'Retro Vintage Poster': {
    bucket: 'illustration',
    style:
      'retro vintage travel poster illustration, faded muted color palette, bold mid-century poster shapes, subtle halftone print texture',
  },
  'Risograph Print Grainy': {
    bucket: 'illustration',
    style:
      'risograph print illustration, visible grainy misregistered ink layers, limited spot-color palette, soft paper texture bleed',
  },
  'Silhouette Art Shadow': {
    bucket: 'illustration',
    style:
      'silhouette art, solid flat black shapes against a soft gradient colored background, minimal detail, strong dramatic negative space',
  },
  'Soft Pastel Story Illustration': {
    bucket: 'illustration',
    style:
      'soft pastel storybook illustration, gentle rounded shapes, warm dreamy pastel color palette, soft diffused lighting',
  },
  'Stained Glass (Kaca Patri)': {
    bucket: 'illustration',
    style:
      'stained glass window art, bold black leading lines separating vibrant jewel-toned glass panels, luminous backlit glow',
  },
  'Sticker Art Die cut': {
    bucket: 'illustration',
    style:
      'die-cut sticker illustration, bold white outline border, glossy flat vector coloring, playful simplified shapes',
  },
  'Storybook Illustration (Children)': {
    bucket: 'illustration',
    style:
      "warm children's storybook illustration, soft rounded character design, gentle watercolor-and-ink texture, whimsical inviting atmosphere",
  },
  'Synthwave Vaporwave': {
    bucket: 'illustration',
    style:
      'synthwave vaporwave digital art, glowing pink and purple gradient sky, retro grid horizon, neon chrome reflective surfaces, 80s retro-futuristic mood',
  },
  'Ukiyo-e / Japanese Style': {
    bucket: 'illustration',
    style:
      'traditional ukiyo-e Japanese woodblock print style, flat bold color layering, characteristic black outline linework, stylized wave and cloud motifs',
  },
  'Vector Infographic Style': {
    bucket: 'illustration',
    style:
      'clean vector infographic illustration style, simplified geometric icons and shapes, flat modern color palette, organized structured composition',
  },
  'Watercolor / Cat Air': {
    bucket: 'illustration',
    style:
      'loose watercolor illustration, visible textured paper grain, soft bleeding pigment edges, delicate transparent color layering',
  },
};

export const resolveVisualTheme = (visualLock: string, customTheme: string) => {
  if (visualLock === 'Kustom (Ketik Sendiri)') {
    const trimmed = (customTheme || '').trim();
    return {
      bucket: 'illustration',
      style: trimmed
        ? `${trimmed} art style, distinctive and consistent visual execution matching this custom aesthetic throughout the frame`
        : VISUAL_STYLE_MAP['Auto'].style,
    };
  }
  return VISUAL_STYLE_MAP[visualLock] || VISUAL_STYLE_MAP['Auto'];
};
