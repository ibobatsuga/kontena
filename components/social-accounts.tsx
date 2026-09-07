'use client';
import { useEffect, useState } from 'react';
import {
  Link2,
  Plus,
  CheckCircle2,
  RefreshCw,
  Unplug,
  ShieldCheck,
  ArrowUpRight,
  Settings2,
  Camera,
  Globe,
  Clock3,
  Send,
  Zap,
  CalendarDays,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { api, SocialAccount, Schedule } from '@/lib/model';
export function SocialAccounts({
  accounts,
  onRefresh,
}: {
  accounts: SocialAccount[];
  onRefresh: () => void;
}) {
  const [config, setConfig] = useState<any>(null);
  const [setup, setSetup] = useState(false);
  const [appId, setAppId] = useState('');
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [disconnect, setDisconnect] = useState<SocialAccount | null>(null);
  useEffect(() => {
    api('social/config')
      .then((c) => {
        setConfig(c);
        setAppId(c.appId);
      })
      .catch((e) => setError(e.message));
    const q = new URLSearchParams(window.location.search);
    const status = q.get('connection');
    const messages: Record<string, string> = {
      connected:
        'Akun berhasil dihubungkan. Pilih akun ini saat membuat jadwal.',
      cancelled: 'Proses koneksi dibatalkan. Akun belum dihubungkan.',
      no_accounts:
        'Tidak ada Page atau Instagram profesional dengan izin publikasi. Periksa akses Page dan hubungan akun Instagram.',
      permissions: 'Izin membaca daftar Page belum diberikan.',
      invalid_state:
        'Sesi koneksi tidak valid atau telah berakhir. Mulai hubungkan akun kembali.',
      failed:
        'Koneksi belum berhasil. Periksa pengaturan Meta App dan coba lagi.',
    };
    if (status && messages[status]) setMessage(messages[status]);
  }, []);
  async function connect() {
    if (!config?.configured) {
      setSetup(true);
      return;
    }
    setBusy('connect');
    setError('');
    try {
      const result = await api('social/connect', {
        method: 'POST',
        body: '{}',
      });
      window.location.assign(result.url);
    } catch (e) {
      setError((e as Error).message);
      setBusy('');
    }
  }
  async function saveConfig() {
    setBusy('setup');
    setError('');
    try {
      await api('social/config', {
        method: 'POST',
        body: JSON.stringify({ appId, appSecret: secret }),
      });
      const result = await api('social/config');
      setConfig(result);
      setSecret('');
      setSetup(false);
      setMessage(
        'Aplikasi Meta tersimpan. Kamu bisa melanjutkan ke login Meta.',
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  async function check(a: SocialAccount) {
    setBusy(a.id);
    setError('');
    try {
      await api('social/accounts', {
        method: 'POST',
        body: JSON.stringify({ id: a.id }),
      });
      setMessage('Koneksi ' + a.name + ' masih aktif.');
      onRefresh();
    } catch (e) {
      setError((e as Error).message);
      onRefresh();
    } finally {
      setBusy('');
    }
  }
  async function remove() {
    if (!disconnect) return;
    setBusy('disconnect');
    try {
      await api('social/accounts', {
        method: 'DELETE',
        body: JSON.stringify({ id: disconnect.id }),
      });
      setMessage(
        'Koneksi dilepas dari Kontena. Jadwal yang terkait memerlukan perhatian. Izin aplikasi di Meta dapat dicabut melalui Business Integrations.',
      );
      setDisconnect(null);
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
          <div className="eyebrow">CONNECTED ACCOUNTS</div>
          <h1>
            Akunmu, terhubung<span>.</span>
          </h1>
          <p>Hubungkan akun sekali. Pilih tujuan untuk setiap cerita.</p>
        </div>
        <button className="primary" disabled={!!busy} onClick={connect}>
          <Plus size={17} />
          {busy === 'connect' ? 'Membuka Meta…' : 'Hubungkan akun'}
        </button>
      </div>
      <div className="social-connect-banner">
        <span>
          <Link2 size={24} />
        </span>
        <div>
          <h2>Login resmi. Kendali tetap di tanganmu.</h2>
          <p>
            Instagram Business / Creator melalui Facebook Page, dan Facebook
            Page. Pilih Page serta izin yang kamu berikan di Meta.
          </p>
        </div>
        <span className="badge neutral">OAuth Meta</span>
      </div>
      {(message || error) && (
        <div
          className={'feedback ' + (error ? 'error' : 'success')}
          role={error ? 'alert' : 'status'}
        >
          {error || message}
        </div>
      )}
      <div className="social-account-grid">
        {accounts.map((a) => (
          <article key={a.id} className="social-account-card">
            <div className="account-card-head">
              <span className={'platform-icon ' + a.platform.toLowerCase()}>
                {a.platform === 'Instagram' ? (
                  <Camera size={24} />
                ) : (
                  <Globe size={24} />
                )}
              </span>
              <span
                className={
                  'badge ' + (a.status === 'connected' ? 'green' : 'neutral')
                }
              >
                {a.status === 'connected' ? 'Terhubung' : 'Hubungkan ulang'}
              </span>
            </div>
            <h2>{a.name}</h2>
            <p>
              {a.username ? '@' + a.username : 'Facebook Page'}
              <span> · {a.platform}</span>
            </p>
            <div className="account-permissions">
              <ShieldCheck size={14} />
              Izin publikasi melalui Meta
            </div>
            <div className="account-expiry">
              <Clock3 size={13} />
              {a.expiresAt
                ? 'Periksa koneksi sebelum ' +
                  new Date(a.expiresAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Diperiksa sebelum setiap publikasi'}
            </div>
            <div className="account-card-actions">
              <button
                className="secondary"
                disabled={!!busy}
                onClick={() =>
                  a.status === 'connected' ? check(a) : connect()
                }
              >
                <RefreshCw size={14} />
                {a.status === 'connected'
                  ? 'Periksa koneksi'
                  : 'Hubungkan ulang'}
              </button>
              <button
                className="icon-button"
                disabled={!!busy}
                aria-label={'Putuskan ' + a.name}
                onClick={() => setDisconnect(a)}
              >
                <Unplug size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
      {!accounts.length && (
        <div className="empty-state social-empty">
          <span>
            <Link2 size={28} />
          </span>
          <h2>Ke mana ceritamu akan dibagikan?</h2>
          <p>
            Hubungkan Facebook Page atau akun Instagram profesional. Akun akan
            muncul sebagai pilihan di scheduler.
          </p>
          <button className="primary" disabled={!!busy} onClick={connect}>
            <Plus size={16} />
            Hubungkan akun pertama
          </button>
        </div>
      )}
      <div className="social-setup-row">
        <div>
          <Settings2 size={16} />
          <span>
            {config?.configured
              ? 'Aplikasi Meta telah diatur'
              : 'Aplikasi Meta belum dikonfigurasi'}
          </span>
        </div>
        <button
          className="text-button"
          onClick={() => {
            setError('');
            setSetup(true);
          }}
        >
          Pengaturan integrasi <ArrowUpRight size={14} />
        </button>
      </div>
      <Dialog
        open={setup}
        onOpenChange={(v) => {
          setSetup(v);
          if (!v) setSecret('');
        }}
      >
        <DialogContent className="schedule-dialog">
          <DialogHeader>
            <DialogTitle>Siapkan koneksi Meta</DialogTitle>
            <DialogDescription>
              Pengaturan satu kali oleh pemilik aplikasi. Pengguna kemudian
              cukup login dan mengizinkan akun di Meta.
            </DialogDescription>
          </DialogHeader>
          <div className="info-note">
            <AlertCircle size={17} />
            <p>
              Siapkan Meta App dengan Facebook Login dan akses Instagram. Untuk
              pengguna di luar role aplikasi, lengkapi App Review dan izin yang
              diperlukan.
            </p>
          </div>
          <div className="field">
            <label htmlFor="meta-id">Meta App ID</label>
            <input
              id="meta-id"
              value={appId}
              inputMode="numeric"
              onChange={(e) => setAppId(e.target.value)}
              placeholder="App ID dari Meta for Developers"
            />
          </div>
          <div className="field">
            <label htmlFor="meta-secret">Meta App Secret</label>
            <input
              id="meta-secret"
              type="password"
              autoComplete="new-password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Disimpan terenkripsi di backend"
            />
          </div>
          <div className="field">
            <label>Valid OAuth Redirect URI</label>
            <code className="callback-url">
              {config?.redirectUri || 'Memuat…'}
            </code>
            <small>
              Tambahkan URI ini persis di pengaturan Facebook Login. Aktifkan
              izin pages_show_list, pages_read_engagement, pages_manage_posts,
              instagram_basic, dan instagram_content_publish.
            </small>
          </div>
          {error && (
            <div className="feedback error" role="alert">
              {error}
            </div>
          )}
          {!config?.storageReady && (
            <div className="info-note">
              Penyimpanan kredensial belum aktif. Hubungi pengelola aplikasi.
            </div>
          )}
          <button
            className="primary full"
            disabled={!!busy || !config?.storageReady || !appId || !secret}
            onClick={saveConfig}
          >
            <ShieldCheck size={16} />
            {busy === 'setup' ? 'Menyimpan…' : 'Simpan konfigurasi Meta'}
          </button>
          <a
            className="text-button"
            href="https://developers.facebook.com/apps/"
            target="_blank"
            rel="noreferrer"
          >
            Buka Meta for Developers <ArrowUpRight size={13} />
          </a>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!disconnect}
        onOpenChange={(v) => !v && setDisconnect(null)}
      >
        <AlertDialogContent className="schedule-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Putuskan {disconnect?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Token akun di Kontena akan dihapus. Jadwal yang belum diproses
              akan ditandai perlu perhatian. Postingan yang sudah terbit tetap
              ada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <button className="primary full" disabled={!!busy} onClick={remove}>
            Putuskan koneksi
          </button>
          <button className="secondary" onClick={() => setDisconnect(null)}>
            Batal
          </button>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
export function PublishingScheduler({
  accounts,
  schedules,
  settings,
  onAccounts,
  onCalendar,
  onNew,
  onRefresh,
}: {
  accounts: SocialAccount[];
  schedules: Schedule[];
  settings: any;
  onAccounts: () => void;
  onCalendar: () => void;
  onNew: () => void;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const active = accounts.filter((a) => a.status === 'connected');
  const jobs = schedules.filter((s) => s.mode === 'live' && s.autoPost);
  async function toggle(value: boolean) {
    setBusy(true);
    try {
      await api('settings', {
        method: 'POST',
        body: JSON.stringify({
          brand: settings.brand || 'Kontena',
          handle: settings.handle || '@kontena',
          autoPost: value,
        }),
      });
      onRefresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">PUBLISH ON YOUR TERMS</div>
          <h1>
            Siap terbit, tepat waktu<span>.</span>
          </h1>
          <p>Kelola kesiapan akun dan pantau publikasi otomatis.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary" onClick={onCalendar}>
            <CalendarDays size={17} />
            Lihat kalender
          </button>
          <button className="primary" onClick={onNew}>
            <Plus size={17} />
            Jadwal baru
          </button>
        </div>
      </div>
      <div className="auto-stats">
        {[
          [Link2, 'Akun terhubung', active.length],
          [
            Clock3,
            'Dalam antrean',
            jobs.filter(
              (s) => s.status === 'scheduled' || s.status === 'processing',
            ).length,
          ],
          [
            CheckCircle2,
            'Terpublikasi',
            jobs.filter((s) => s.status === 'published').length,
          ],
          [
            AlertCircle,
            'Perlu perhatian',
            jobs.filter((s) => s.status === 'needs_attention').length,
          ],
        ].map(([Icon, label, value]: any) => (
          <div className="stat" key={label}>
            <div className="stat-top">
              <span className="stat-icon">
                <Icon size={18} />
              </span>
              {label}
            </div>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="auto-layout">
        <section className="settings-card">
          <h2 className="auto-section-title">Kesiapan publikasi</h2>
          <div className="readiness-step">
            <span className={active.length ? 'ready' : ''}>
              {active.length ? <CheckCircle2 size={19} /> : <Link2 size={19} />}
            </span>
            <div>
              <h3>1. Hubungkan akun</h3>
              <p>
                {active.length
                  ? `${active.length} akun siap dipilih sebagai tujuan.`
                  : 'Login dengan Meta dan izinkan akun tujuan.'}
              </p>
            </div>
            <button className="text-button" onClick={onAccounts}>
              Kelola <ArrowUpRight size={13} />
            </button>
          </div>
          <div className="readiness-step">
            <span className={settings.schedulerReady ? 'ready' : ''}>
              <Clock3 size={19} />
            </span>
            <div>
              <h3>2. Aktifkan runner scheduler</h3>
              <p>
                {settings.schedulerReady
                  ? 'Runner dikonfigurasi untuk memproses jadwal.'
                  : 'Pengelola perlu menghubungkan runner agar jadwal berjalan saat browser ditutup.'}
              </p>
            </div>
          </div>
          <div className="readiness-step">
            <span className={settings.instagramMediaReady ? 'ready' : ''}>
              <Camera size={19} />
            </span>
            <div>
              <h3>3. Pengiriman gambar Instagram</h3>
              <p>
                {settings.instagramMediaReady
                  ? 'Layanan URL gambar telah dikonfigurasi.'
                  : 'Layanan URL gambar publik sementara diperlukan untuk Instagram. Facebook memakai upload langsung.'}
              </p>
            </div>
          </div>
          <label className="switch-row">
            <div>
              Auto post untuk jadwal baru
              <small>
                Setiap jadwal tetap memiliki pilihan akun dan konfirmasi
                sendiri.
              </small>
            </div>
            <Switch
              disabled={busy}
              checked={!!settings.autoPost}
              onCheckedChange={toggle}
            />
          </label>
          {error && <div className="feedback error">{error}</div>}
        </section>
        <section className="settings-card">
          <h2 className="auto-section-title">Aktivitas auto post</h2>
          {jobs.length ? (
            jobs.map((s) => (
              <div className="auto-job" key={s.id}>
                <div>
                  <h3>{s.title}</h3>
                  <p>
                    {s.accountName || 'Akun belum dipilih'} · {s.platform}
                  </p>
                  <small>
                    {new Date(s.scheduledAt).toLocaleString('id-ID', {
                      timeZone: 'Asia/Jakarta',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    WIB
                  </small>
                </div>
                <span
                  className={
                    'badge ' + (s.status === 'published' ? 'green' : 'neutral')
                  }
                >
                  {{
                    scheduled: 'Terjadwal',
                    processing: 'Diproses',
                    published: 'Terbit',
                    needs_attention: 'Perlu diperiksa',
                    cancelled: 'Dibatalkan',
                  }[s.status] || s.status}
                </span>
              </div>
            ))
          ) : (
            <div className="small-empty">
              <Send size={30} />
              <h3>Belum ada publikasi otomatis.</h3>
              <p>
                Buat jadwal live dan aktifkan auto post untuk melihat
                aktivitasnya di sini.
              </p>
              <button className="text-button" onClick={onCalendar}>
                Lihat kalender <ArrowUpRight size={14} />
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
