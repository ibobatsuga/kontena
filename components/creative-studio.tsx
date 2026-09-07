'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  FileText,
  Palette,
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  Save,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Image as ImageIcon,
  Layers,
  ArrowRight,
  LoaderCircle,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Brief,
  Design,
  Overlay,
  Project,
  Slide,
  initialBrief,
  initialDesign,
  sampleSlide,
  presets,
  fonts,
  ratios,
  api,
} from '@/lib/model';
import { nicheOptions, visualThemeOptions } from '@/lib/creative-options';
import { renderSlide, renderBlob, downloadBlob } from '@/lib/render';
export function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <Select value={value} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger className="field-select" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((v) => (
            <SelectItem key={v} value={v}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="color-field">
      <span>{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <code>{value}</code>
    </label>
  );
}
function StyleEditor({
  title,
  value,
  onChange,
}: {
  title: string;
  value: Overlay;
  onChange: (v: Overlay) => void;
}) {
  const set = (k: keyof Overlay, v: any) => onChange({ ...value, [k]: v });
  return (
    <details className="style-editor">
      <summary>
        {title}
        <ChevronRight size={15} />
      </summary>
      <div className="style-editor-body">
        <Choice
          label="Jenis warna"
          value={value.type}
          options={['transparent', 'solid', 'gradient']}
          onChange={(v) => set('type', v)}
        />
        {value.type !== 'transparent' && (
          <>
            <ColorField
              label="Warna 1"
              value={value.color1}
              onChange={(v) => set('color1', v)}
            />
            <div className="range-label">
              Opasitas 1 <span>{Math.round(value.alpha1 * 100)}%</span>
            </div>
            <Slider
              aria-label="Opasitas warna 1"
              value={[value.alpha1 * 100]}
              onValueChange={(v) =>
                set('alpha1', (Array.isArray(v) ? v[0] : v) / 100)
              }
            />
          </>
        )}
        {value.type === 'gradient' && (
          <>
            <ColorField
              label="Warna 2"
              value={value.color2}
              onChange={(v) => set('color2', v)}
            />
            <div className="range-label">
              Opasitas 2 <span>{Math.round(value.alpha2 * 100)}%</span>
            </div>
            <Slider
              aria-label="Opasitas warna 2"
              value={[value.alpha2 * 100]}
              onValueChange={(v) =>
                set('alpha2', (Array.isArray(v) ? v[0] : v) / 100)
              }
            />
            <Choice
              label="Arah gradasi"
              value={value.direction}
              options={['to-b', 'to-t', 'to-r', 'to-l', 'to-br', 'center']}
              onChange={(v) => set('direction', v)}
            />
            <div className="range-label">
              Rentang gradasi <span>{value.stops.join(' – ')}%</span>
            </div>
            <Slider
              aria-label="Rentang gradasi"
              value={value.stops}
              onValueChange={(v) => set('stops', Array.isArray(v) ? v : [v])}
            />
          </>
        )}
        <ColorField
          label="Warna teks"
          value={value.textColor1}
          onChange={(v) => set('textColor1', v)}
        />
        <ColorField
          label="Warna aksen"
          value={value.textColor2}
          onChange={(v) => set('textColor2', v)}
        />
      </div>
    </details>
  );
}
export function SlideCanvas({
  slide,
  brief,
  design,
  index = 0,
  total = 1,
}: {
  slide: Slide;
  brief: Brief;
  design: Design;
  index?: number;
  total?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    const temp = document.createElement('canvas');
    renderSlide(temp, slide, brief, design, index, total)
      .then(() => {
        if (!live || !ref.current) return;
        ref.current.width = temp.width;
        ref.current.height = temp.height;
        ref.current.getContext('2d')?.drawImage(temp, 0, 0);
        setError('');
      })
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [slide, brief, design, index, total]);
  return (
    <div
      className="canvas-wrap"
      style={{ aspectRatio: brief.ratio.replace(':', '/') }}
    >
      <canvas
        ref={ref}
        aria-label={'Slide ' + (index + 1) + ': ' + slide.headline}
      />
      {error && (
        <div role="alert" className="canvas-error">
          {error}
        </div>
      )}
    </div>
  );
}
export default function CreativeStudio({
  loadProject,
  template,
  onSaved,
  onSchedule,
  aiReady,
  defaultHandle,
}: {
  loadProject: Project | null;
  template: string | null;
  onSaved: (p: Project) => void;
  onSchedule: (p: Project) => void;
  aiReady: boolean;
  defaultHandle?: string;
}) {
  const [brief, setBrief] = useState<Brief>(initialBrief);
  const [design, setDesign] = useState<Design>(initialDesign);
  const [slides, setSlides] = useState<Slide[]>([sampleSlide]);
  const [caption, setCaption] = useState('');
  const [id, setId] = useState('');
  const [tab, setTab] = useState('content');
  const [current, setCurrent] = useState(0);
  const [busy, setBusy] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [edit, setEdit] = useState(false);
  const [mode, setMode] = useState('demo');
  const [hasContent, setHasContent] = useState(false);
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (defaultHandle && !id && !dirty && !hasContent)
      setBrief((b) => ({ ...b, handle: defaultHandle }));
  }, [defaultHandle]);
  useEffect(() => {
    if (loadProject) {
      setBrief(loadProject.brief);
      setDesign(loadProject.design);
      setSlides(loadProject.slides);
      setCaption(loadProject.caption);
      setId(loadProject.id);
      setCurrent(0);
      setHasContent(true);
      setDirty(false);
      setFeedback('Konten dibuka.');
    }
  }, [loadProject]);
  function choosePreset(template: string) {
    const light = template === 'serif' || template === 'yellow';
    setBrief((b) => ({
      ...b,
      template,
      typography:
        template === 'serif'
          ? 'Editorial (Playfair Display)'
          : template === 'statement'
            ? 'Narrow (Archivo Narrow)'
            : 'Bold (Poppins)',
      textAlign:
        template === 'sport' || template === 'statement' ? 'center' : 'left',
    }));
    setDesign((d) => ({
      ...d,
      cover: {
        ...d.cover,
        textColor1: light ? '#101010' : '#ffffff',
        textColor2:
          template === 'yellow'
            ? '#ffdc00'
            : template === 'serif'
              ? '#ed263f'
              : '#00b0a9',
      },
      slide: {
        ...d.slide,
        textColor1: light ? '#101010' : '#ffffff',
        textColor2:
          template === 'yellow'
            ? '#ffdc00'
            : template === 'serif'
              ? '#ed263f'
              : '#00b0a9',
      },
    }));
    setDirty(true);
  }
  useEffect(() => {
    if (template) {
      choosePreset(template);
      setTab('style');
    }
  }, [template]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const set = (key: keyof Brief, value: any) => {
    setBrief((b) => ({ ...b, [key]: value }));
    setDirty(true);
  };
  const updateSlide = (patch: Partial<Slide>) => {
    setSlides((a) => a.map((s, i) => (i === current ? { ...s, ...patch } : s)));
    setDirty(true);
    setHasContent(true);
  };
  async function task(label: string, fn: () => Promise<void>) {
    setBusy(label);
    setError('');
    setFeedback('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    } finally {
      setBusy('');
    }
  }
  async function generate() {
    await task('Menyusun carousel…', async () => {
      const result = await api('generate', {
        method: 'POST',
        body: JSON.stringify({ brief, mode }),
      });
      let out: Slide[] = result.slides;
      setSlides(out);
      setCurrent(0);
      setCaption(result.caption);
      setId('');
      setHasContent(true);
      setDirty(true);
      if (mode === 'live') {
        for (let i = 0; i < out.length; i++) {
          if (out[i].isCta) continue;
          setBusy(`Membuat gambar ${i + 1} dari ${out.length}…`);
          const img = await api('image', {
            method: 'POST',
            body: JSON.stringify({ prompt: out[i].imagePrompt, ...brief }),
          });
          out = out.map((s, j) => (j === i ? { ...s, image: img.image } : s));
          setSlides(out);
        }
      }
      setFeedback(
        mode === 'demo'
          ? 'Contoh carousel siap. Mode demo menggunakan contoh tetap; topik dan URL belum diproses AI.'
          : 'Carousel berhasil dibuat. Periksa teks sebelum dibagikan.',
      );
    });
  }
  async function save() {
    const project = await api('projects', {
      method: 'POST',
      body: JSON.stringify({
        id,
        title: brief.topic.trim().slice(0, 180) || slides[0].headline,
        brief,
        design,
        slides,
        caption,
      }),
    });
    setId(project.id);
    setHasContent(true);
    setDirty(false);
    onSaved(project);
    return project as Project;
  }
  async function exportSlides(kind: 'single' | 'all' | 'zip') {
    await task('Menyiapkan ekspor…', async () => {
      const name = brief.handle.replace(/[^a-zA-Z0-9_-]/g, '') || 'kontena';
      if (kind === 'single') {
        downloadBlob(
          await renderBlob(
            slides[current],
            brief,
            design,
            current,
            slides.length,
          ),
          `${name}-${current + 1}.png`,
        );
      } else {
        const { default: JSZip } = await import('jszip');
        const zip = new JSZip();
        for (let i = 0; i < slides.length; i++) {
          setBusy(`Merender slide ${i + 1} dari ${slides.length}…`);
          const blob = await renderBlob(
            slides[i],
            brief,
            design,
            i,
            slides.length,
          );
          if (kind === 'all') downloadBlob(blob, `${name}-${i + 1}.png`);
          else zip.file(`slide-${String(i + 1).padStart(2, '0')}.png`, blob);
        }
        if (kind === 'zip') {
          zip.file('caption.txt', caption);
          downloadBlob(
            await zip.generateAsync({ type: 'blob' }),
            `${name}-carousel.zip`,
          );
        }
      }
      setFeedback(
        'Ekspor siap. Gambar berukuran ' +
          ratios[brief.ratio].join(' × ') +
          ' px.',
      );
    });
  }
  async function upload(file: File) {
    await task('Mengunggah gambar…', async () => {
      const form = new FormData();
      form.append('file', file);
      const result = await api('upload', { method: 'POST', body: form });
      updateSlide({ image: result.image });
      setFeedback('Gambar slide diganti.');
    });
  }
  async function regenerate() {
    await task('Membuat visual baru…', async () => {
      if (mode === 'demo')
        throw new Error(
          'Generate visual baru memerlukan model AI. Kamu bisa unggah gambar sendiri.',
        );
      const result = await api('image', {
        method: 'POST',
        body: JSON.stringify({ prompt: slides[current].imagePrompt, ...brief }),
      });
      updateSlide({ image: result.image });
      setFeedback('Visual slide diperbarui.');
    });
  }
  useEffect(() => {
    const context = (document as any).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    Promise.resolve(
      context.registerTool(
        {
          name: 'stage_content_brief',
          description:
            'Isi topik dan rasio pada form studio. Tidak membuat, menyimpan, atau mempublikasikan konten.',
          inputSchema: {
            type: 'object',
            properties: {
              topic: { type: 'string', maxLength: 12000 },
              ratio: { type: 'string', enum: ['4:5', '9:16', '1:1'] },
            },
            required: ['topic', 'ratio'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false },
          execute: async (input: any) => {
            if (
              typeof input.topic !== 'string' ||
              input.topic.length > 12000 ||
              !ratios[input.ratio]
            )
              throw new Error('Brief tidak valid');
            setBrief((b) => ({ ...b, topic: input.topic, ratio: input.ratio }));
            setDirty(true);
            return { staged: true, topic: input.topic, ratio: input.ratio };
          },
        },
        { signal: controller.signal },
      ),
    ).catch(() => {});
    return () => controller.abort();
  }, []);
  return (
    <>
      <div className="studio-heading">
        <div>
          <div className="eyebrow">AI CONTENT STUDIO</div>
          <h1>
            Dari ide, jadi cerita<span>.</span>
          </h1>
          <p>Buat satu visual atau satu rangkaian carousel.</p>
        </div>
        <div className="heading-actions">
          <span className="save-state">
            {dirty ? 'Belum disimpan' : id ? 'Tersimpan' : 'Preview contoh'}
          </span>
          <button
            className="secondary"
            disabled={!!busy}
            onClick={() =>
              task('Menyimpan…', async () => {
                await save();
                setFeedback('Konten tersimpan di Konten Saya.');
              })
            }
          >
            <Save size={16} />
            Simpan
          </button>
          <button
            className="primary"
            disabled={!!busy}
            onClick={() =>
              task('Menyiapkan jadwal…', async () => {
                onSchedule(await save());
              })
            }
          >
            <CalendarDays size={16} />
            Jadwalkan
          </button>
        </div>
      </div>
      <div className="studio-layout">
        <div className="editor-panel">
          <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
            <TabsList className="editor-tabs" variant="line">
              <TabsTrigger value="content">
                <FileText size={15} />
                Konten & Ide
              </TabsTrigger>
              <TabsTrigger value="style">
                <Palette size={15} />
                Desain & Visual
              </TabsTrigger>
              <TabsTrigger value="caption">
                <Sparkles size={15} />
                Caption
              </TabsTrigger>
            </TabsList>
            <div className="editor-scroll">
              <TabsContent value="content">
                <div className="field">
                  <label htmlFor="topic">Topik / bahan konten</label>
                  <textarea
                    id="topic"
                    rows={4}
                    maxLength={12000}
                    value={brief.topic}
                    placeholder="Cth: Cerita di balik keindahan gunung berapi Indonesia…"
                    onChange={(e) => set('topic', e.target.value)}
                  />
                  <small>
                    Mulai dengan ide, artikel, atau instruksi khusus.
                  </small>
                </div>
                <div className="field">
                  <label htmlFor="reference-url">
                    URL referensi <span>Opsional</span>
                  </label>
                  <input
                    id="reference-url"
                    type="url"
                    value={brief.referenceUrl}
                    onChange={(e) => set('referenceUrl', e.target.value)}
                    placeholder="https://artikel-referensi.com"
                  />
                </div>
                <div className="two-fields">
                  <div className="field">
                    <label htmlFor="handle">Nama akun</label>
                    <input
                      id="handle"
                      value={brief.handle}
                      maxLength={80}
                      onChange={(e) => set('handle', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="slides">Jumlah slide</label>
                    <input
                      id="slides"
                      type="number"
                      min={1}
                      max={10}
                      value={brief.slideCount}
                      onChange={(e) =>
                        set('slideCount', Number(e.target.value))
                      }
                    />
                  </div>
                </div>
                <div className="two-fields">
                  <Choice
                    label="Niche / kategori"
                    value={brief.niche}
                    options={nicheOptions}
                    onChange={(v) => set('niche', v)}
                  />
                  <Choice
                    label="Tipe konten"
                    value={brief.contentType}
                    options={[
                      'Edukasi',
                      'Hiburan',
                      'Promosi',
                      'Inspirasi',
                      'Interaksi',
                      'Berita',
                    ]}
                    onChange={(v) => set('contentType', v)}
                  />
                </div>
                <Choice
                  label="Gaya bahasa (tone)"
                  value={brief.tone}
                  options={[
                    'Formal & Profesional',
                    'Santai & Kasual',
                    'Bijak & Bersahaja',
                    'Hype & To the Point',
                    'Emosional & Storytelling',
                    'Inspiratif & Positif',
                  ]}
                  onChange={(v) => set('tone', v)}
                />
                <label className="switch-row">
                  <div>
                    Tambahkan slide CTA
                    <small>Slide penutup untuk ajakan atau promosi.</small>
                  </div>
                  <Switch
                    checked={brief.includeCta}
                    onCheckedChange={(v) => set('includeCta', v)}
                  />
                </label>
                <div className="info-note">
                  <Layers size={16} />
                  <p>
                    {brief.slideCount} slide isi
                    {brief.includeCta ? ' + 1 slide CTA' : ''}. Pilih 1 slide
                    tanpa CTA untuk single image.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="style">
                <div className="field">
                  <label>Rasio canvas</label>
                  <RadioGroup
                    className="ratio-options"
                    value={brief.ratio}
                    onValueChange={(v) => set('ratio', v)}
                  >
                    {['4:5', '9:16', '1:1'].map((r) => (
                      <label
                        key={r}
                        className={brief.ratio === r ? 'selected' : ''}
                      >
                        <RadioGroupItem value={r} />
                        <span
                          className="ratio-icon"
                          style={{ aspectRatio: r.replace(':', '/') }}
                        />
                        <strong>{r}</strong>
                        <small>
                          {r === '4:5'
                            ? 'Feed'
                            : r === '9:16'
                              ? 'Story'
                              : 'Square'}
                        </small>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
                <Choice
                  label="Preset layout"
                  value={presets.find((t) => t.id === brief.template)!.name}
                  options={presets.map((t) => t.name)}
                  onChange={(v) =>
                    choosePreset(presets.find((t) => t.name === v)!.id)
                  }
                />
                <Choice
                  label="Elemen / karakter utama"
                  value={brief.characterSubject}
                  options={[
                    'Fokus Objek & Topik (Tanpa Karakter)',
                    'Simbol & Ikon Konseptual',
                    'Pemandangan / Suasana',
                    'Random Kontekstual',
                    'Pria Profesional',
                    'Wanita Profesional',
                    'Laki-laki Kasual',
                    'Perempuan Kasual',
                    'Pria Chibi Cute',
                    'Wanita Chibi Cute',
                    'Robot / AI / Teknologi',
                  ]}
                  onChange={(v) => set('characterSubject', v)}
                />
                <Choice
                  label="Tema visual gambar AI"
                  value={brief.visualLock}
                  options={visualThemeOptions}
                  onChange={(v) => set('visualLock', v)}
                />
                {brief.visualLock === 'Kustom (Ketik Sendiri)' && (
                  <div className="field">
                    <label htmlFor="custom-theme">Tema kustom</label>
                    <input
                      id="custom-theme"
                      value={brief.customTheme}
                      onChange={(e) => set('customTheme', e.target.value)}
                      placeholder="Cth: Fotografi analog, grain halus…"
                    />
                  </div>
                )}
                <Choice
                  label="Tipografi font"
                  value={brief.typography}
                  options={Object.keys(fonts)}
                  onChange={(v) => set('typography', v)}
                />
                <Choice
                  label="Rata teks paragraf"
                  value={brief.textAlign}
                  options={['left', 'center', 'right', 'justify']}
                  onChange={(v) => set('textAlign', v)}
                />
                <StyleEditor
                  title="Overlay cover · Slide 1"
                  value={design.cover}
                  onChange={(v) => {
                    setDesign((d) => ({ ...d, cover: v }));
                    setDirty(true);
                  }}
                />
                <StyleEditor
                  title="Overlay slide materi"
                  value={design.slide}
                  onChange={(v) => {
                    setDesign((d) => ({ ...d, slide: v }));
                    setDirty(true);
                  }}
                />
                <StyleEditor
                  title="Background CTA"
                  value={design.cta}
                  onChange={(v) => {
                    setDesign((d) => ({ ...d, cta: v }));
                    setDirty(true);
                  }}
                />
              </TabsContent>
              <TabsContent value="caption">
                <div className="field">
                  <label htmlFor="caption">Caption Instagram</label>
                  <textarea
                    id="caption"
                    rows={15}
                    maxLength={6000}
                    value={caption}
                    onChange={(e) => {
                      setCaption(e.target.value);
                      setDirty(true);
                    }}
                    placeholder="Caption akan muncul setelah carousel dibuat. Kamu juga bisa menulis caption sendiri."
                  />
                  <small>
                    {caption.length} karakter · Hook, ringkasan, CTA, dan
                    hashtag.
                  </small>
                </div>
                <button
                  className="secondary full"
                  disabled={!caption}
                  onClick={() =>
                    task('Menyalin…', async () => {
                      await navigator.clipboard.writeText(caption);
                      setFeedback('Caption tersalin.');
                    })
                  }
                >
                  <Copy size={15} />
                  Salin caption
                </button>
              </TabsContent>
            </div>
          </Tabs>
          <div className="generate-footer">
            <Choice
              label="Mode pembuatan"
              value={mode === 'demo' ? 'Demo · Contoh tetap' : 'AI Live'}
              options={
                aiReady
                  ? ['Demo · Contoh tetap', 'AI Live']
                  : ['Demo · Contoh tetap']
              }
              onChange={(v) => setMode(v.startsWith('Demo') ? 'demo' : 'live')}
            />
            <button
              className="primary full"
              disabled={!!busy}
              onClick={generate}
            >
              {busy ? (
                <LoaderCircle className="spinning" size={17} />
              ) : (
                <Sparkles size={17} />
              )}{' '}
              {busy ||
                (mode === 'demo' ? 'Coba Carousel Demo' : 'Generate Carousel')}
            </button>
            <small>
              {aiReady
                ? 'AI diproses melalui backend.'
                : 'Model belum terhubung. Upload dan edit tetap bisa digunakan.'}
            </small>
          </div>
        </div>
        <div className="preview-panel">
          <div className="preview-toolbar">
            <div>
              <span className="live-indicator" />
              Preview <span className="muted">/ {brief.ratio}</span>
            </div>
            <div className="preview-actions">
              <button
                className="icon-button"
                title="Ekspor semua PNG"
                disabled={!!busy}
                onClick={() => exportSlides('all')}
              >
                <Download size={17} />
              </button>
              <button
                className="secondary compact"
                disabled={!!busy}
                onClick={() => exportSlides('zip')}
              >
                <Download size={14} />
                Unduh ZIP
              </button>
            </div>
          </div>
          <div className="preview-stage">
            <div className="preview-slide">
              <div className="slide-meta">
                <span>
                  {slides[current]?.isCta
                    ? 'CALL TO ACTION'
                    : current === 0
                      ? 'COVER'
                      : 'SLIDE MATERI'}
                </span>
                <span>
                  {current + 1} / {slides.length}
                </span>
              </div>
              <SlideCanvas
                slide={slides[current] || sampleSlide}
                brief={brief}
                design={design}
                index={current}
                total={slides.length}
              />
              <div className="slide-tools">
                <button onClick={() => setEdit(true)}>
                  <FileText size={14} />
                  Edit teks
                </button>
                <button
                  disabled={!!busy || slides[current]?.isCta}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload size={14} />
                  Ganti gambar
                </button>
                <button
                  aria-label="Unduh slide ini"
                  title="Unduh slide ini"
                  disabled={!!busy}
                  onClick={() => exportSlides('single')}
                >
                  <Download size={15} />
                </button>
              </div>
            </div>
          </div>
          <div className="filmstrip">
            <button
              className="icon-button"
              aria-label="Slide sebelumnya"
              disabled={current === 0}
              onClick={() => setCurrent(current - 1)}
            >
              <ChevronLeft size={17} />
            </button>
            <div className="slide-numbers">
              {slides.map((s, i) => (
                <button
                  className={i === current ? 'active' : ''}
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={'Pilih slide ' + (i + 1)}
                >
                  <span>{i + 1}</span>
                  <small>{s.isCta ? 'CTA' : i === 0 ? 'Cover' : 'Slide'}</small>
                </button>
              ))}
            </div>
            <button
              className="icon-button"
              aria-label="Slide selanjutnya"
              disabled={current === slides.length - 1}
              onClick={() => setCurrent(current + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
          <div className="preview-bottom">
            <span>{ratios[brief.ratio].join(' × ')} px · PNG</span>
            <button
              disabled={!!busy || slides[current]?.isCta}
              onClick={regenerate}
            >
              <RefreshCw size={13} />
              Re-generate visual
            </button>
          </div>
          {!hasContent && (
            <p className="sample-note">
              Visual contoh AI · Buat carousel atau mulai edit contoh ini.
            </p>
          )}
        </div>
      </div>
      {(error || feedback) && (
        <div
          className={error ? 'feedback error' : 'feedback success'}
          role={error ? 'alert' : 'status'}
        >
          {error || feedback}
        </div>
      )}
      <input
        className="sr-only"
        tabIndex={-1}
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          if (e.target.files?.[0]) upload(e.target.files[0]);
          e.target.value = '';
        }}
      />
      <Dialog open={edit} onOpenChange={setEdit}>
        <DialogContent className="edit-dialog">
          <DialogHeader>
            <DialogTitle>Edit teks · Slide {current + 1}</DialogTitle>
            <DialogDescription>
              Perubahan langsung terlihat pada preview.
            </DialogDescription>
          </DialogHeader>
          <div className="field">
            <label htmlFor="eyebrow">Eyebrow / label</label>
            <input
              id="eyebrow"
              maxLength={70}
              value={slides[current]?.eyebrow || ''}
              onChange={(e) => updateSlide({ eyebrow: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="headline">Headline utama</label>
            <textarea
              id="headline"
              rows={3}
              maxLength={180}
              value={slides[current]?.headline || ''}
              onChange={(e) => updateSlide({ headline: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="body">Body / penjelasan</label>
            <textarea
              id="body"
              rows={4}
              maxLength={600}
              value={slides[current]?.body || ''}
              onChange={(e) => updateSlide({ body: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="image-prompt">Prompt visual</label>
            <textarea
              id="image-prompt"
              rows={2}
              maxLength={6000}
              value={slides[current]?.imagePrompt || ''}
              onChange={(e) => updateSlide({ imagePrompt: e.target.value })}
            />
          </div>
          <button className="primary full" onClick={() => setEdit(false)}>
            <Check size={16} />
            Selesai mengedit
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
