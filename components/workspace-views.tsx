'use client';
import { useState } from 'react';
import { TemplatePreview } from './template-preview';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpRight,
  Search,
  Image as ImageIcon,
  Layers,
  Camera as Instagram,
  Globe as Facebook,
  Link2,
  Check,
  Clock3,
  Zap,
  Settings2,
  LoaderCircle,
  Download,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Project, Schedule, presets, api } from '@/lib/model';
import { renderBlob } from '@/lib/render';
import { Choice, SlideCanvas } from './creative-studio';
export function TemplateGallery({
  onSelect,
}: {
  onSelect: (id: string) => void;
}) {
  const [category, setCategory] = useState('Semua');
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">THE TEMPLATE COLLECTION</div>
          <h1>
            Sebuah awal yang bagus<span>.</span>
          </h1>
          <p>Tujuh layout editorial dari referensimu. Jadikan milikmu.</p>
        </div>
        <span className="badge neutral">7 preset layout</span>
      </div>
      <Tabs value={category} onValueChange={(v) => setCategory(String(v))}>
        <TabsList className="filter-tabs">
          {['Semua', 'Berita', 'Editorial', 'Olahraga'].map((c) => (
            <TabsTrigger value={c} key={c}>
              {c}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="template-gallery">
        {presets
          .filter((t) => category === 'Semua' || t.category === category)
          .map((t) => (
            <article className="preset-card" key={t.id}>
              <div className="preset-image">
                <TemplatePreview id={t.id} />
                <span className="reference-label">Layout preview</span>
                <button className="primary" onClick={() => onSelect(t.id)}>
                  Gunakan template <ArrowUpRight size={16} />
                </button>
              </div>
              <div className="preset-info">
                <div>
                  <h2>{t.name}</h2>
                  <span>{t.category}</span>
                </div>
                <p>{t.desc}</p>
                <div className="preset-ratios">
                  <span>4:5</span>
                  <span>9:16</span>
                  <span>1:1</span>
                </div>
              </div>
            </article>
          ))}
      </div>
      <p className="reference-note">
        Setiap preset menampilkan komposisi layout. Gambar, teks, warna, dan
        nama akun bisa kamu sesuaikan di studio.
      </p>
    </>
  );
}
export function ContentLibrary({
  projects,
  onOpen,
  onCreate,
  onSchedule,
}: {
  projects: Project[];
  onOpen: (p: Project) => void;
  onCreate: () => void;
  onSchedule: (p: Project) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR CONTENT LIBRARY</div>
          <h1>
            Semua ceritamu, satu tempat<span>.</span>
          </h1>
          <p>
            {projects.length} konten tersimpan. Siap dilanjutkan kapan saja.
          </p>
        </div>
        <button className="primary" onClick={onCreate}>
          <Plus size={16} />
          Buat Konten
        </button>
      </div>
      <div className="library-bar">
        <div className="search-input">
          <Search size={16} />
          <input
            aria-label="Cari konten"
            placeholder="Cari judul konten…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="muted">{filtered.length} konten</span>
      </div>
      {filtered.length ? (
        <div className="content-grid">
          {filtered.map((p) => (
            <article className="content-card" key={p.id}>
              <button
                className="content-preview"
                onClick={() => onOpen(p)}
                aria-label={'Edit ' + p.title}
              >
                <SlideCanvas
                  slide={p.slides[0]}
                  brief={p.brief}
                  design={p.design}
                  total={p.slides.length}
                />
                <span className="content-count">
                  <Layers size={12} />
                  {p.slides.length} slide
                </span>
              </button>
              <div className="content-info">
                <h2>{p.title}</h2>
                <p>
                  {new Date(p.updatedAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                  <span>{p.brief.ratio}</span>
                </p>
                <div>
                  <button className="secondary" onClick={() => onOpen(p)}>
                    Buka editor <ArrowUpRight size={14} />
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => onSchedule(p)}
                    aria-label={'Jadwalkan ' + p.title}
                  >
                    <CalendarDays size={17} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span>
            <ImageIcon size={27} />
          </span>
          <h2>
            {search
              ? 'Konten belum ditemukan'
              : 'Cerita pertamamu dimulai di sini.'}
          </h2>
          <p>
            {search
              ? 'Coba kata kunci yang lain.'
              : 'Buat dan simpan konten dari studio. Semua karyamu akan ada di sini.'}
          </p>
          {!search && (
            <button className="primary" onClick={onCreate}>
              <Plus size={16} />
              Buat konten pertama
            </button>
          )}
        </div>
      )}
    </>
  );
}
const statusNames: Record<string, string> = {
  scheduled: 'Scheduled',
  published: 'Success',
  cancelled: 'Dibatalkan',
  processing: 'Diproses',
  needs_attention: 'Failed · Perlu diperiksa',
};
function dateKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
export function Scheduler({
  schedules,
  onNew,
  onEdit,
  onOpenContent,
  onRefresh,
}: {
  onEdit: (schedule: Schedule) => void;
  onOpenContent: (schedule: Schedule) => void;
  schedules: Schedule[];
  onNew: () => void;
  onRefresh: () => void;
}) {
  const [month, setMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selected, setSelected] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const offset = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const today = dateKey(new Date());
  const rows = schedules.filter(
    (s) =>
      (statusFilter === 'all' || s.status === statusFilter) &&
      (!selected || dateKey(new Date(s.scheduledAt)) === selected),
  );
  async function cancel(id: string) {
    setBusy(id);
    try {
      await api('schedules', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      onRefresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">CONTENT CALENDAR</div>
          <h1>
            Konsisten, tanpa terburu-buru<span>.</span>
          </h1>
          <p>Rencanakan ceritamu. Semua jadwal menggunakan WIB (UTC+7).</p>
        </div>
        <button className="primary" onClick={onNew}>
          <Plus size={16} />
          Jadwal Baru
        </button>
      </div>
      <div className="calendar-filters" aria-label="Filter status jadwal">
        {[
          ['all', 'Semua'],
          ['scheduled', 'Scheduled'],
          ['published', 'Success'],
          ['needs_attention', 'Failed'],
          ['processing', 'Diproses'],
          ['cancelled', 'Dibatalkan'],
        ].map(([value, label]) => (
          <button
            key={value}
            className={statusFilter === value ? 'active' : ''}
            aria-pressed={statusFilter === value}
            onClick={() => setStatusFilter(value)}
          >
            <i className={'status-dot ' + value} />
            {label}
            <span>
              {
                schedules.filter((s) => value === 'all' || s.status === value)
                  .length
              }
            </span>
          </button>
        ))}
      </div>
      <div className="scheduler-layout">
        <section className="calendar-card">
          <div className="calendar-toolbar">
            <h2>
              {month.toLocaleDateString('id-ID', {
                month: 'long',
                year: 'numeric',
              })}
            </h2>
            <div>
              <button
                className="secondary compact"
                onClick={() => {
                  setMonth(
                    new Date(
                      new Date().getFullYear(),
                      new Date().getMonth(),
                      1,
                    ),
                  );
                  setSelected('');
                }}
              >
                Hari ini
              </button>
              <button
                className="icon-button"
                aria-label="Bulan sebelumnya"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() - 1, 1),
                  )
                }
              >
                <ChevronLeft size={17} />
              </button>
              <button
                className="icon-button"
                aria-label="Bulan berikutnya"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() + 1, 1),
                  )
                }
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
          <div className="calendar-grid weekday">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="calendar-grid days">
            {Array.from(
              { length: Math.ceil((days + offset) / 7) * 7 },
              (_, i) => {
                const d = i - offset + 1;
                const valid = d > 0 && d <= days;
                const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const events = schedules.filter(
                  (s) =>
                    dateKey(new Date(s.scheduledAt)) === key &&
                    (statusFilter === 'all' || s.status === statusFilter),
                );
                return (
                  <button
                    key={i}
                    disabled={!valid}
                    className={`${key === today ? 'today' : ''} ${selected === key ? 'selected' : ''}`}
                    onClick={() => setSelected(selected === key ? '' : key)}
                  >
                    <span>{valid ? d : ''}</span>
                    <div>
                      {events.slice(0, 2).map((s) => (
                        <small key={s.id} className={'event-' + s.status}>
                          {s.mode === 'demo' ? 'Demo · ' : ''}
                          {s.title}
                        </small>
                      ))}
                      {events.length > 2 && (
                        <small>+{events.length - 2} lainnya</small>
                      )}
                    </div>
                  </button>
                );
              },
            )}
          </div>
          <div className="calendar-legend">
            <span>
              <i className="status-dot scheduled" />
              Scheduled
            </span>
            <span>
              <i className="status-dot published" />
              Success
            </span>
            <span>
              <i className="status-dot needs_attention" />
              Failed
            </span>
          </div>
        </section>
        <aside className="schedule-list">
          <div className="section-heading">
            <h2>
              {selected
                ? new Date(selected + 'T12:00:00+07:00').toLocaleDateString(
                    'id-ID',
                    { day: 'numeric', month: 'long' },
                  )
                : 'Antrean konten'}{' '}
              <span>{rows.length}</span>
            </h2>
            {selected && (
              <button className="text-button" onClick={() => setSelected('')}>
                Semua
              </button>
            )}
          </div>
          {rows.length ? (
            rows.map((s) => (
              <article className="schedule-item" key={s.id}>
                <div className="schedule-item-top">
                  <span className={'platform-icon ' + s.platform.toLowerCase()}>
                    {s.platform === 'Instagram' ? (
                      <Instagram size={16} />
                    ) : (
                      <Facebook size={16} />
                    )}
                  </span>
                  <span
                    className={
                      'badge ' +
                      (s.status === 'published'
                        ? 'green'
                        : s.status === 'needs_attention'
                          ? 'red'
                          : 'neutral')
                    }
                  >
                    {s.mode === 'demo' ? 'Demo · ' : ''}
                    {statusNames[s.status] || s.status}
                  </span>
                </div>
                <h3>{s.title}</h3>
                {s.accountName && <small>Akun: {s.accountName}</small>}
                <p>
                  <Clock3 size={13} />
                  {new Date(s.scheduledAt).toLocaleString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  WIB
                </p>
                {s.mode === 'demo' && (
                  <small>Simulasi jadwal. Tidak dikirim ke platform.</small>
                )}
                {s.mode === 'live' && !s.autoPost && (
                  <small>Pengingat manual. Auto post dimatikan.</small>
                )}
                {s.error && <small className="error-text">{s.error}</small>}
                <div className="schedule-actions">
                  <button
                    className="secondary compact"
                    onClick={() => onEdit(s)}
                  >
                    {s.status === 'scheduled' || s.status === 'needs_attention'
                      ? 'Edit jadwal'
                      : 'Lihat detail'}
                  </button>
                  <button
                    className="text-button"
                    onClick={() => onOpenContent(s)}
                  >
                    Buka konten <ArrowUpRight size={13} />
                  </button>
                </div>
                {['scheduled', 'needs_attention'].includes(s.status) && (
                  <button
                    className="text-button"
                    disabled={busy === s.id}
                    onClick={() => cancel(s.id)}
                  >
                    Batalkan jadwal
                  </button>
                )}
              </article>
            ))
          ) : (
            <div className="small-empty">
              <CalendarDays size={30} />
              <h3>Ruang untuk cerita baru.</h3>
              <p>
                Belum ada konten{' '}
                {selected ? 'pada tanggal ini' : 'dalam antrean'}.
              </p>
              <button className="text-button" onClick={onNew}>
                Tambahkan jadwal <ArrowRight size={14} />
              </button>
            </div>
          )}
          <div className="scheduler-note">
            <Zap size={17} />
            <p>
              Auto post live aktif setelah akun sosial dan runner scheduler
              terhubung.
            </p>
          </div>
        </aside>
      </div>
      {error && (
        <div className="feedback error" role="alert">
          {error}
        </div>
      )}
    </>
  );
}
export function ScheduleDialog({
  project,
  projects,
  onClose,
  onSaved,
  settings,
  accounts,
  onConnect,
  schedule,
}: {
  schedule?: Schedule | null;
  accounts: import('@/lib/model').SocialAccount[];
  onConnect: () => void;
  project: Project | null | undefined;
  projects: Project[];
  onClose: () => void;
  onSaved: () => void;
  settings: any;
}) {
  const [projectId, setProjectId] = useState(
    schedule?.projectId || project?.id || '',
  );
  const [date, setDate] = useState(
    schedule
      ? new Date(new Date(schedule.scheduledAt).getTime() + 7 * 3600000)
          .toISOString()
          .slice(0, 16)
      : '',
  );
  const [platform, setPlatform] = useState(schedule?.platform || 'Instagram');
  const [accountId, setAccountId] = useState(schedule?.accountId || '');
  const availableAccounts = accounts.filter(
    (a) => a.platform === platform && a.status === 'connected',
  );
  const targetAccount = availableAccounts.find((a) => a.id === accountId);
  const liveReady =
    !!targetAccount &&
    settings.schedulerReady &&
    (platform === 'Facebook' || settings.instagramMediaReady);
  const [mode, setMode] = useState(schedule?.mode === 'live' ? 'Live' : 'Demo');
  const [auto, setAuto] = useState(
    schedule ? !!schedule.autoPost : !!settings.autoPost,
  );
  const [caption, setCaption] = useState(
    schedule?.caption ?? project?.caption ?? '',
  );
  const [replaceImages, setReplaceImages] = useState(false);
  const [confirmedRetry, setConfirmedRetry] = useState(false);
  const readOnly =
    !!schedule && !['scheduled', 'needs_attention'].includes(schedule.status);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const chosen = project || projects.find((p) => p.id === projectId);
  async function submit() {
    setError('');
    if (!chosen) {
      setError('Pilih konten yang sudah disimpan.');
      return;
    }
    if (!date || new Date(date + ':00+07:00').getTime() < Date.now() + 60000) {
      setError('Pilih waktu minimal 1 menit dari sekarang.');
      return;
    }
    if (readOnly) return;
    if (schedule?.status === 'needs_attention' && !confirmedRetry) {
      setError(
        'Periksa terlebih dahulu bahwa konten belum terpublikasi di platform.',
      );
      return;
    }
    if (mode === 'Live' && !liveReady) {
      setError('Hubungkan akun tujuan dan lengkapi kesiapan auto post.');
      return;
    }
    setBusy('Menyiapkan gambar…');
    try {
      const images: string[] =
        schedule && !replaceImages ? [...schedule.images] : [];
      if (!schedule || replaceImages)
        for (let i = 0; i < chosen.slides.length; i++) {
          setBusy(`Menyiapkan slide ${i + 1}/${chosen.slides.length}…`);
          const blob = await renderBlob(
            chosen.slides[i],
            chosen.brief,
            chosen.design,
            i,
            chosen.slides.length,
            'image/jpeg',
          );
          const form = new FormData();
          form.append('file', blob, `slide-${i + 1}.jpg`);
          const result = await api('upload', { method: 'POST', body: form });
          images.push(result.image);
        }
      await api('schedules', {
        method: schedule ? 'PATCH' : 'POST',
        body: JSON.stringify({
          id: schedule?.id,
          confirmedRetry,
          caption: caption || (!schedule ? chosen.caption : ''),
          replaceImages,
          projectId: chosen.id,
          scheduledAt: new Date(date + ':00+07:00').toISOString(),
          platform,
          accountId: targetAccount?.id || null,
          mode: mode === 'Demo' ? 'demo' : 'live',
          autoPost: auto,
          images,
        }),
      });
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  return (
    <Dialog
      open={project !== undefined}
      onOpenChange={(v) => !v && !busy && onClose()}
    >
      <DialogContent className="schedule-dialog">
        <DialogHeader>
          <DialogTitle>
            {readOnly
              ? 'Detail publikasi'
              : schedule
                ? 'Edit jadwal'
                : 'Jadwalkan konten'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Riwayat publikasi dan salinan konten yang dijadwalkan.'
              : 'Atur waktu, akun tujuan, dan caption konten.'}
          </DialogDescription>
        </DialogHeader>
        <fieldset className="schedule-fields" disabled={readOnly || !!busy}>
          {project ? (
            <div className="chosen-project">
              <Layers size={18} />
              <div>
                <strong>{project.title}</strong>
                <small>
                  {project.slides.length} slide · {project.brief.ratio}
                </small>
              </div>
            </div>
          ) : (
            <div className="field">
              <label>Konten tersimpan</label>
              <Choice
                label="Pilih konten"
                value={
                  chosen ? `${chosen.title} · ${chosen.id.slice(0, 6)}` : ''
                }
                options={projects.map(
                  (p) => `${p.title} · ${p.id.slice(0, 6)}`,
                )}
                onChange={(v) =>
                  setProjectId(
                    projects.find(
                      (p) => `${p.title} · ${p.id.slice(0, 6)}` === v,
                    )!.id,
                  )
                }
              />
              {!projects.length && (
                <small>Simpan konten di studio sebelum membuat jadwal.</small>
              )}
            </div>
          )}
          {schedule && (
            <div className="schedule-snapshot">
              {schedule.images.map((src, i) => (
                <img key={src} src={src} alt={'Slide terjadwal ' + (i + 1)} />
              ))}
            </div>
          )}
          <div className="field">
            <label htmlFor="schedule-caption">Caption publikasi</label>
            <textarea
              id="schedule-caption"
              rows={4}
              maxLength={10000}
              value={caption}
              placeholder={chosen?.caption || 'Tulis caption…'}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
          {schedule && !readOnly && (
            <label className="switch-row">
              <div>
                Perbarui gambar dari konten terbaru
                <small>
                  Aktifkan setelah mengedit dan menyimpan konten di studio.
                </small>
              </div>
              <Switch
                checked={replaceImages}
                onCheckedChange={setReplaceImages}
              />
            </label>
          )}
          <div className="field">
            <label htmlFor="schedule-date">Tanggal & waktu · WIB</label>
            <input
              id="schedule-date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="two-fields">
            <Choice
              label="Platform"
              value={platform}
              options={['Instagram', 'Facebook']}
              onChange={(v) => {
                setPlatform(v);
                setAccountId('');
                setMode('Demo');
              }}
            />
            <Choice
              label="Mode jadwal"
              value={mode}
              options={liveReady ? ['Demo', 'Live'] : ['Demo']}
              onChange={setMode}
            />
          </div>
          <div className="field">
            <label>Akun tujuan</label>
            {availableAccounts.length ? (
              <Choice
                label="Pilih akun terhubung"
                value={
                  targetAccount
                    ? `${targetAccount.name}${targetAccount.username ? ' · @' + targetAccount.username : ''}`
                    : ''
                }
                options={availableAccounts.map(
                  (a) => `${a.name}${a.username ? ' · @' + a.username : ''}`,
                )}
                onChange={(v) =>
                  setAccountId(
                    availableAccounts.find(
                      (a) =>
                        `${a.name}${a.username ? ' · @' + a.username : ''}` ===
                        v,
                    )!.id,
                  )
                }
              />
            ) : (
              <div className="info-note">
                Belum ada akun {platform} terhubung.
              </div>
            )}
            <button className="text-button" onClick={onConnect}>
              <Link2 size={14} />
              Hubungkan / kelola akun
            </button>
            {targetAccount && !liveReady && (
              <small>
                Akun terpilih. Konfigurasi auto post masih perlu dilengkapi di
                menu Scheduler.
              </small>
            )}
          </div>
          <label className="switch-row">
            <div>
              Auto post
              <small>
                {mode === 'Demo'
                  ? 'Preferensi demo. Tidak mengirim postingan.'
                  : 'Kirim otomatis pada waktu yang dipilih.'}
              </small>
            </div>
            <Switch checked={auto} onCheckedChange={setAuto} />
          </label>
          <div className="info-note">
            <AlertCircle size={17} />
            <p>
              {mode === 'Demo'
                ? 'Jadwal demo tersimpan di kalender, tetapi tidak dipublikasikan ke media sosial.'
                : 'Konten yang dijadwalkan memakai salinan slide saat ini. Perubahan di editor tidak mengubah jadwal.'}
            </p>
          </div>
          {schedule?.status === 'needs_attention' && (
            <label className="retry-confirm">
              <input
                type="checkbox"
                checked={confirmedRetry}
                onChange={(e) => setConfirmedRetry(e.target.checked)}
              />
              <span>
                Saya sudah memeriksa platform dan memastikan konten belum
                terpublikasi. Simpan untuk mencoba lagi pada jadwal baru.
              </span>
            </label>
          )}
        </fieldset>
        {readOnly && (
          <div className="info-note">
            {schedule?.status === 'published'
              ? 'Postingan sudah terbit. Perubahan konten di studio tidak mengubah postingan di platform.'
              : schedule?.status === 'processing'
                ? 'Publikasi sedang diproses. Jadwal dikunci agar tidak terkirim dua kali.'
                : 'Jadwal ini telah dibatalkan.'}
          </div>
        )}
        {error && (
          <div className="feedback error" role="alert">
            {error}
          </div>
        )}
        {!readOnly && (
          <button
            className="primary full"
            disabled={!!busy || !chosen}
            onClick={submit}
          >
            {busy ? (
              <LoaderCircle size={16} className="spinning" />
            ) : (
              <CalendarDays size={16} />
            )}{' '}
            {busy || (schedule ? 'Simpan perubahan' : 'Simpan jadwal')}
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
export function SettingsView({
  settings,
  onUpdate,
}: {
  settings: any;
  onUpdate: () => void;
}) {
  const [brand, setBrand] = useState(settings.brand || 'Kontena');
  const [handle, setHandle] = useState(settings.handle || '@kontena');
  const [auto, setAuto] = useState(!!settings.autoPost);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function save() {
    setBusy(true);
    try {
      await api('settings', {
        method: 'POST',
        body: JSON.stringify({ brand, handle, autoPost: auto }),
      });
      setMessage('Pengaturan workspace tersimpan.');
      onUpdate();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">WORKSPACE SETTINGS</div>
          <h1>
            Atur ruang kreatifmu<span>.</span>
          </h1>
          <p>Identitas akun dan koneksi yang menggerakkan kontenmu.</p>
        </div>
      </div>
      <div className="settings-layout">
        <section className="settings-card">
          <div className="settings-title">
            <span>
              <Settings2 size={20} />
            </span>
            <div>
              <h2>Identitas workspace</h2>
              <p>Nama brand dan akun default untuk konten baru.</p>
            </div>
          </div>
          <div className="field">
            <label htmlFor="brand">Nama brand</label>
            <input
              id="brand"
              value={brand}
              maxLength={80}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="brand-handle">Nama akun</label>
            <input
              id="brand-handle"
              value={handle}
              maxLength={80}
              onChange={(e) => setHandle(e.target.value)}
            />
          </div>
          <label className="switch-row">
            <div>
              Preferensi auto post
              <small>Diterapkan saat membuat jadwal baru.</small>
            </div>
            <Switch checked={auto} onCheckedChange={setAuto} />
          </label>
          <button className="primary" disabled={busy} onClick={save}>
            <Check size={16} />
            {busy ? 'Menyimpan…' : 'Simpan pengaturan'}
          </button>
          {message && (
            <p className="feedback" role="status">
              {message}
            </p>
          )}
        </section>
        <section className="settings-card">
          <div className="settings-title">
            <span>
              <Link2 size={20} />
            </span>
            <div>
              <h2>Koneksi & automasi</h2>
              <p>Status layanan untuk pembuatan dan publikasi.</p>
            </div>
          </div>
          {[
            [
              Zap,
              'AI image & content',
              settings.aiReady,
              'Model akan ditentukan menyusul.',
            ],
            [
              Instagram,
              'Publisher sosial media',
              settings.publisherReady,
              'Instagram / Facebook melalui layanan publisher.',
            ],
            [
              Clock3,
              'Runner scheduler',
              settings.schedulerReady,
              'Menjalankan antrean meskipun browser ditutup.',
            ],
          ].map(([Icon, title, ready, desc]: any) => (
            <div className="connection-row" key={title}>
              <Icon size={20} />
              <div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
              <span className={'badge ' + (ready ? 'green' : 'neutral')}>
                {ready ? 'Terhubung' : 'Belum diatur'}
              </span>
            </div>
          ))}
          <div className="info-note">
            <AlertCircle size={17} />
            <p>
              Konfigurasi layanan dan kredensial disimpan di backend. Mode demo
              tersedia sambil menunggu koneksi live.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
