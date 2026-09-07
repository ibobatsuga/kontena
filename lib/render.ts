import { Brief, Design, Slide, fonts, ratios, Overlay } from './model';
function rgba(hex: string, a: number) {
  return `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
}
function background(
  c: CanvasRenderingContext2D,
  s: Overlay,
  w: number,
  h: number,
) {
  if (s.type === 'transparent') return;
  if (s.type === 'solid') {
    c.fillStyle = rgba(s.color1, s.alpha1);
  } else {
    let g: CanvasGradient;
    switch (s.direction) {
      case 'to-t':
        g = c.createLinearGradient(0, h, 0, 0);
        break;
      case 'to-r':
        g = c.createLinearGradient(0, 0, w, 0);
        break;
      case 'to-l':
        g = c.createLinearGradient(w, 0, 0, 0);
        break;
      case 'to-br':
        g = c.createLinearGradient(0, 0, w, h);
        break;
      case 'center':
        g = c.createRadialGradient(
          w / 2,
          h / 2,
          0,
          w / 2,
          h / 2,
          Math.max(w, h) * 0.65,
        );
        break;
      default:
        g = c.createLinearGradient(0, 0, 0, h);
    }
    g.addColorStop(Math.min(...s.stops) / 100, rgba(s.color1, s.alpha1));
    g.addColorStop(Math.max(...s.stops) / 100, rgba(s.color2, s.alpha2));
    c.fillStyle = g;
  }
  c.fillRect(0, 0, w, h);
}
function lines(c: CanvasRenderingContext2D, text: string, width: number) {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let current = '';
    for (const word of para.split(/\s+/)) {
      const candidate = current ? current + ' ' + word : word;
      if (c.measureText(candidate).width > width && current) {
        out.push(current);
        current = word;
      } else current = candidate;
      if (c.measureText(current).width > width) {
        let part = '';
        for (const char of current) {
          if (c.measureText(part + char).width > width) {
            out.push(part);
            part = char;
          } else part += char;
        }
        current = part;
      }
    }
    out.push(current);
  }
  return out;
}
function textBlock(
  c: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  w: number,
  maxH: number,
  size: number,
  family: string,
  color: string,
  align: string,
  weight = 750,
  highlight?: string,
) {
  let lineList: string[] = [];
  let fontSize = size;
  do {
    c.font = `${weight} ${fontSize}px "${family}", Arial, sans-serif`;
    lineList = lines(c, text, w);
    if (lineList.length * fontSize * 1.16 <= maxH) break;
    fontSize -= 1;
  } while (fontSize > 12);
  c.fillStyle = color;
  c.textAlign =
    align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
  const tx = align === 'center' ? x + w / 2 : align === 'right' ? x + w : x;
  lineList.forEach((line, i) => {
    if (i === 0 && highlight) {
      const first = line.split(' ')[0];
      const origin =
        align === 'center'
          ? tx - c.measureText(line).width / 2
          : align === 'right'
            ? tx - c.measureText(line).width
            : tx;
      c.fillStyle = highlight;
      c.fillRect(
        origin - 6,
        y + 3,
        c.measureText(first).width + 12,
        fontSize * 1.15,
      );
      c.fillStyle = color;
    }
    if (align === 'justify' && i < lineList.length - 1 && line.includes(' ')) {
      const words = line.split(' ');
      const wordsW = words.reduce((a, b) => a + c.measureText(b).width, 0);
      const gap = (w - wordsW) / (words.length - 1);
      let px = x;
      for (const word of words) {
        c.fillText(word, px, y + fontSize + i * fontSize * 1.16);
        px += c.measureText(word).width + gap;
      }
    } else c.fillText(line, tx, y + fontSize + i * fontSize * 1.16);
  });
  return lineList.length * fontSize * 1.16;
}
const imageCache = new Map<string, Promise<HTMLImageElement>>();
function loadImage(src: string) {
  if (!imageCache.has(src))
    imageCache.set(
      src,
      new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
          imageCache.delete(src);
          reject(new Error('Gambar tidak dapat dimuat.'));
        };
        img.src = src;
      }),
    );
  return imageCache.get(src)!;
}
export async function renderSlide(
  canvas: HTMLCanvasElement,
  slide: Slide,
  brief: Brief,
  design: Design,
  index: number,
  total: number,
) {
  const [w, h] = ratios[brief.ratio];
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('Canvas tidak didukung.');
  const font = fonts[brief.typography] || 'Poppins';
  await Promise.all([
    document.fonts.load(`750 50px "${font}"`),
    document.fonts.load('700 50px "Archivo Narrow"'),
    document.fonts.ready,
  ]);
  c.fillStyle = '#0d0e10';
  c.fillRect(0, 0, w, h);
  const style = slide.isCta
    ? design.cta
    : index === 0
      ? design.cover
      : design.slide;
  const t = brief.template;
  const panel = ['bold', 'yellow', 'serif'].includes(t) && !slide.isCta;
  const photoH = panel ? h * 0.64 : h;
  if (!slide.isCta) {
    const img = await loadImage(slide.image);
    const scale = Math.max(w / img.width, photoH / img.height);
    c.drawImage(
      img,
      (w - img.width * scale) / 2,
      (photoH - img.height * scale) / 2,
      img.width * scale,
      img.height * scale,
    );
    background(c, style, w, h);
  } else {
    background(c, style, w, h);
  }
  const margin = w * 0.065;
  const bw = w - margin * 2;
  let headlineY = h * 0.6;
  let titleSize = 72;
  let titleH = h * 0.23;
  let bodyH = h * 0.105;
  let fg = style.textColor1;
  let family = font;
  let align = brief.textAlign;
  if (panel) {
    headlineY = photoH + margin * 0.7;
    c.fillStyle =
      t === 'yellow' ? '#ffdc00' : t === 'serif' ? '#eeeded' : '#050505';
    c.fillRect(0, photoH, w, h - photoH);
    titleH = h * 0.2;
    bodyH = h * 0.07;
    titleSize = 66;
  }
  if (t === 'serif' && !slide.isCta) {
    family = brief.typography === 'Bold (Poppins)' ? 'Playfair Display' : font;
    headlineY += 48;
    titleSize = 61;
  }
  if (t === 'statement' && !slide.isCta) {
    family = brief.typography === 'Bold (Poppins)' ? 'Archivo Narrow' : font;
    align = 'center';
    titleSize = 106;
    headlineY = h * 0.67;
    titleH = h * 0.245;
    bodyH = 0;
    c.strokeStyle = '#ffffff88';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(margin, headlineY - 24);
    c.lineTo(w - margin, headlineY - 24);
    c.stroke();
  }
  if (t === 'sport' && !slide.isCta) {
    align = 'center';
    headlineY = h * 0.69;
    titleSize = 76;
    bodyH = h * 0.06;
    titleH = h * 0.2;
  }
  if (t === 'story' && !slide.isCta) {
    headlineY = h * 0.55;
    titleSize = 76;
    titleH = h * 0.235;
    bodyH = h * 0.12;
  }
  if (slide.isCta) {
    headlineY = h * 0.32;
    titleSize = 83;
    titleH = h * 0.27;
    bodyH = h * 0.16;
    align = 'center';
  }
  if (t === 'serif' && !slide.isCta) {
    c.fillStyle = style.textColor2;
    c.fillRect(
      margin,
      photoH + 27,
      Math.min(bw, c.measureText(slide.eyebrow).width + 45),
      40,
    );
    textBlock(
      c,
      slide.eyebrow.toUpperCase(),
      margin + 10,
      photoH + 30,
      bw - 20,
      32,
      24,
      'Arial',
      '#fff',
      'left',
      700,
    );
  } else {
    textBlock(
      c,
      slide.eyebrow.toUpperCase(),
      margin,
      margin,
      bw * 0.65,
      70,
      27,
      'Arial',
      style.textColor2,
      'left',
      700,
    );
  }
  textBlock(
    c,
    brief.handle.replace('@', ''),
    w * 0.63,
    margin,
    w * 0.3,
    70,
    30,
    'Arial',
    style.textColor1,
    'right',
    800,
  );
  const title = ['bold', 'yellow', 'statement', 'sport'].includes(t)
    ? slide.headline.toUpperCase()
    : slide.headline;
  const available = Math.max(80, h - 110 - headlineY);
  titleH = Math.min(titleH, available * (bodyH ? 0.68 : 1));
  const used = textBlock(
    c,
    title,
    margin,
    headlineY,
    bw,
    titleH,
    titleSize,
    family,
    fg,
    align,
    800,
    t === 'highlight' && !slide.isCta ? style.textColor2 : undefined,
  );
  if (bodyH && slide.body)
    textBlock(
      c,
      slide.body,
      margin,
      headlineY + used + 22,
      bw,
      Math.max(30, Math.min(bodyH, h - 100 - (headlineY + used + 22))),
      32,
      family,
      fg,
      align,
      450,
    );
  c.globalAlpha = 0.75;
  textBlock(
    c,
    brief.handle,
    margin,
    h - 65,
    bw,
    32,
    23,
    'Arial',
    fg,
    'left',
    500,
  );
  c.textAlign = 'right';
  c.font = '500 23px Arial';
  c.fillStyle = fg;
  c.fillText(`${index + 1} / ${total}`, w - margin, h - 42);
  c.globalAlpha = 1;
}
export async function renderBlob(
  slide: Slide,
  brief: Brief,
  design: Design,
  index: number,
  total: number,
) {
  const canvas = document.createElement('canvas');
  await renderSlide(canvas, slide, brief, design, index, total);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Ekspor gagal.'))),
      'image/png',
    ),
  );
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
