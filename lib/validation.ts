import { fonts, presets, ratios } from './model';
export function validateCreative(p: any) {
  const b = p.brief;
  if (
    !b ||
    !ratios[b.ratio] ||
    !presets.some((t) => t.id === b.template) ||
    !fonts[b.typography] ||
    !['left', 'center', 'right', 'justify'].includes(b.textAlign) ||
    typeof b.handle !== 'string' ||
    b.handle.length > 80 ||
    typeof b.topic !== 'string' ||
    b.topic.length > 12000 ||
    !Number.isInteger(b.slideCount) ||
    b.slideCount < 1 ||
    b.slideCount > 10
  )
    throw new Error('Pengaturan konten tidak valid.');
  for (const key of ['cover', 'slide', 'cta']) {
    const s = p.design?.[key];
    if (
      !s ||
      !['solid', 'gradient', 'transparent'].includes(s.type) ||
      !['to-b', 'to-t', 'to-r', 'to-l', 'to-br', 'center'].includes(s.direction)
    )
      throw new Error('Desain tidak valid.');
    for (const color of ['color1', 'color2', 'textColor1', 'textColor2'])
      if (typeof s[color] !== 'string' || !/^#[a-fA-F0-9]{6}$/.test(s[color]))
        throw new Error('Warna tidak valid.');
    if (
      ![s.alpha1, s.alpha2].every(
        (x) => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 1,
      ) ||
      !Array.isArray(s.stops) ||
      s.stops.length !== 2 ||
      !s.stops.every(
        (x: unknown) =>
          typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 100,
      )
    )
      throw new Error('Pengaturan overlay tidak valid.');
  }
}
