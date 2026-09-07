'use client';
import { useState, useEffect } from 'react';
import {
  SocialAccounts,
  PublishingScheduler,
} from '@/components/social-accounts';
import { TemplatePreview } from '@/components/template-preview';
import CreativeStudio from '@/components/creative-studio';
import {
  TemplateGallery,
  ContentLibrary,
  Scheduler,
  ScheduleDialog,
  SettingsView,
} from '@/components/workspace-views';
import { Project, Schedule, SocialAccount, api, presets } from '@/lib/model';
import {
  Send,
  Link2,
  Sparkles,
  LayoutDashboard,
  Image,
  CalendarDays,
  Layers,
  Settings2,
  ArrowUpRight,
  Plus,
  ChevronRight,
  WandSparkles,
  CircleHelp,
  Zap,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
const templates = [
  'Bold Headline',
  'Yellow Bulletin',
  'Editorial Serif',
  'News Highlight',
  'Deep Story',
  'Big Statement',
  'Sport Cover',
];
export default function Home() {
  const [view, setView] = useState('Dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loadProject, setLoadProject] = useState<Project | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [scheduleProject, setScheduleProject] = useState<
    Project | null | undefined
  >(undefined);
  const [dataError, setDataError] = useState('');
  async function refresh() {
    const results = await Promise.allSettled([
      api('projects'),
      api('schedules'),
      api('settings'),
      api('social/accounts'),
    ]);
    let failed = false;
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        if (i === 0) setProjects(r.value);
        if (i === 1) setSchedules(r.value);
        if (i === 2) setSettings(r.value);
        if (i === 3) setAccounts(r.value);
      } else failed = true;
    });
    setDataError(failed ? 'Data belum dapat dimuat. Coba muat ulang.' : '');
  }
  useEffect(() => {
    refresh();
    if (new URLSearchParams(window.location.search).get('view') === 'accounts')
      setView('Akun Sosial');
  }, []);
  useEffect(() => {
    if (!['Kalender', 'Scheduler', 'Akun Sosial'].includes(view)) return;
    const timer = window.setInterval(refresh, 30000);
    return () => window.clearInterval(timer);
  }, [view]);
  const selectTemplate = (id: string) => {
    setSelectedTemplate(id);
    setView('Buat Konten');
  };
  const openProject = (p: Project) => {
    setLoadProject(p);
    setView('Buat Konten');
  };
  return (
    <SidebarProvider
      style={{ '--sidebar-width': '228px' } as React.CSSProperties}
    >
      <Sidebar>
        <SidebarHeader>
          <div className="logo">
            <span>
              <Zap fill="currentColor" />
            </span>
            kontena<span className="logo-dot">.</span>
          </div>
          <button className="workspace">
            <span className="workspace-icon">K</span>
            <span>
              My Workspace<small>Personal workspace</small>
            </span>
            <ChevronDown size={14} />
          </button>
        </SidebarHeader>
        <SidebarContent>
          <p className="nav-label">WORKSPACE</p>
          <SidebarMenu>
            {[
              [LayoutDashboard, 'Dashboard'],
              [WandSparkles, 'Buat Konten'],
              [Image, 'Konten Saya'],
              [Layers, 'Template'],
              [Send, 'Scheduler'],
              [CalendarDays, 'Kalender'],
              [Link2, 'Akun Sosial'],
            ].map(([Icon, label]: any) => (
              <SidebarMenuItem key={label}>
                <SidebarMenuButton
                  className="nav-item"
                  isActive={view === label}
                  onClick={() => setView(label)}
                >
                  <Icon />
                  <span>{label}</span>
                  {label === 'Buat Konten' && (
                    <span className="new-badge">AI</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <p className="nav-label second">PREFERENSI</p>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="nav-item"
                onClick={() => setView('Pengaturan')}
              >
                <Settings2 />
                <span>Pengaturan</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="studio-card">
            <Sparkles size={21} />
            <h3>Ide bagus. Konten hebat.</h3>
            <p>Mulai dari ide, biarkan kreativitas mengambil alih.</p>
            <button onClick={() => setView('Buat Konten')}>
              Buka AI Studio <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="profile">
            <span className="avatar">K</span>
            <div>
              Kreator<small>Personal workspace</small>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <div className="app-main">
        <header className="topbar">
          <div className="breadcrumb">
            <SidebarTrigger />
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{view}</strong>
          </div>
          <div className="top-right">
            <span className="demo-dot" />
            {settings.aiReady ? 'AI terhubung' : 'Mode demo'}
            <span className="top-divider" />
            <span className="avatar small">K</span>
          </div>
        </header>
        <main className={view === 'Buat Konten' ? 'page studio-page' : 'page'}>
          {dataError && (
            <div className="feedback error" role="alert">
              {dataError} <button onClick={refresh}>Muat ulang</button>
            </div>
          )}
          <div hidden={view !== 'Buat Konten'}>
            <CreativeStudio
              loadProject={loadProject}
              template={selectedTemplate}
              aiReady={!!settings.aiReady}
              defaultHandle={settings.handle}
              onSaved={() => refresh()}
              onSchedule={(p) => {
                setEditingSchedule(null);
                setScheduleProject(p);
              }}
            />
          </div>
          {view === 'Template' && <TemplateGallery onSelect={selectTemplate} />}{' '}
          {view === 'Konten Saya' && (
            <ContentLibrary
              projects={projects}
              onOpen={openProject}
              onCreate={() => setView('Buat Konten')}
              onSchedule={(p) => {
                setEditingSchedule(null);
                setScheduleProject(p);
              }}
            />
          )}{' '}
          {view === 'Akun Sosial' && (
            <SocialAccounts accounts={accounts} onRefresh={refresh} />
          )}
          {view === 'Scheduler' && (
            <PublishingScheduler
              accounts={accounts}
              schedules={schedules}
              settings={settings}
              onAccounts={() => setView('Akun Sosial')}
              onCalendar={() => setView('Kalender')}
              onNew={() => {
                setEditingSchedule(null);
                setScheduleProject(null);
              }}
              onRefresh={refresh}
            />
          )}
          {view === 'Kalender' && (
            <Scheduler
              schedules={schedules}
              onNew={() => {
                setEditingSchedule(null);
                setScheduleProject(null);
              }}
              onEdit={(s) => {
                setEditingSchedule(s);
                setScheduleProject(
                  projects.find((p) => p.id === s.projectId) || null,
                );
              }}
              onOpenContent={(s) => {
                const p = projects.find((p) => p.id === s.projectId);
                if (p) openProject(p);
              }}
              onRefresh={refresh}
            />
          )}{' '}
          {view === 'Pengaturan' && (
            <SettingsView
              key={JSON.stringify(settings)}
              settings={settings}
              onUpdate={refresh}
            />
          )}{' '}
          {view === 'Dashboard' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">YOUR CREATIVE SPACE</div>
                  <h1>
                    Ide hari ini, konten selanjutnya<span>.</span>
                  </h1>
                  <p>
                    Semua yang kamu butuhkan untuk membuat, mengatur, dan
                    membagikan cerita.
                  </p>
                </div>
                <button
                  className="primary"
                  onClick={() => setView('Buat Konten')}
                >
                  <Plus size={18} />
                  Buat Konten
                </button>
              </div>
              <section className="stats">
                {[
                  [
                    Image,
                    'Total konten',
                    String(projects.length),
                    'Tersimpan di workspace',
                  ],
                  [
                    CalendarDays,
                    'Terjadwal',
                    String(
                      schedules.filter((s) => s.status === 'scheduled').length,
                    ),
                    'Konten dalam antrean',
                  ],
                  [
                    Layers,
                    'Template siap pakai',
                    '7',
                    'Dirancang untuk ceritamu',
                  ],
                  [
                    Sparkles,
                    'AI image generation',
                    settings.aiReady ? 'Live' : 'Demo',
                    settings.aiReady
                      ? 'Model terhubung'
                      : 'Model belum terhubung',
                  ],
                ].map(([Icon, label, value, foot]: any) => (
                  <div className="stat" key={label}>
                    <div className="stat-top">
                      <span className="stat-icon">
                        <Icon size={18} />
                      </span>
                      {label}
                      <ArrowUpRight size={15} />
                    </div>
                    <strong>{value}</strong>
                    <small>{foot}</small>
                  </div>
                ))}
              </section>
              <section className="creative-banner">
                <div>
                  <span className="light-label">
                    <Sparkles size={14} /> DARI IDE JADI KARYA
                  </span>
                  <h2>
                    Ceritamu layak
                    <br />
                    mendapat visual yang hebat.
                  </h2>
                  <p>Tulis idenya. Pilih gayanya. Buat jadi nyata.</p>
                  <button onClick={() => setView('Buat Konten')}>
                    Mulai berkreasi <ArrowRight size={17} />
                  </button>
                </div>
                <div className="banner-type">
                  <span>CREATE</span>
                  <span>
                    SOMETHING<span className="asterisk">✳</span>
                  </span>
                  <span>
                    WORTH <i>sharing.</i>
                  </span>
                  <div className="ratio-pills">
                    <b>4:5</b>
                    <b>9:16</b>
                    <b>1:1</b>
                  </div>
                </div>
              </section>
              <div className="section-heading">
                <div>
                  <h2>Mulai dengan template</h2>
                  <p>Layout editorial pilihan. Tinggal tambahkan ceritamu.</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => setView('Template')}
                >
                  Semua template <ArrowRight size={16} />
                </button>
              </div>
              <div className="template-grid">
                {templates.slice(0, 4).map((t, i) => (
                  <button
                    className="template-card"
                    key={t}
                    onClick={() => selectTemplate(presets[i].id)}
                  >
                    <TemplatePreview id={presets[i].id} />
                    <div>
                      <h3>{t}</h3>
                      <span>
                        Editorial <b>4:5</b>
                      </span>
                    </div>
                    <span className="template-open">
                      <ArrowUpRight size={17} />
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </main>
        <ScheduleDialog
          key={
            (editingSchedule?.id || 'new') +
            (scheduleProject?.id || String(scheduleProject))
          }
          schedule={editingSchedule}
          project={scheduleProject}
          projects={projects}
          onClose={() => {
            setScheduleProject(undefined);
            setEditingSchedule(null);
          }}
          onSaved={() => {
            refresh();
            setView('Kalender');
          }}
          settings={settings}
          accounts={accounts}
          onConnect={() => {
            setScheduleProject(undefined);
            setView('Akun Sosial');
          }}
        />
        <footer className="app-footer">
          Dibuat untuk ide yang terus bergerak.
          <span>
            Kontena Studio <span>✳</span>
          </span>
        </footer>
      </div>
    </SidebarProvider>
  );
}
