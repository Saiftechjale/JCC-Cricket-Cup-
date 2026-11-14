/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Calendar,
  ClipboardList,
  CreditCard,
  Database,
  FileCheck,
  FileText,
  FolderHeart,
  Globe,
  Home,
  Image as ImageIcon,
  LayoutTemplate,
  Mail,
  Menu,
  Palette,
  Radio,
  ScrollText,
  Settings,
  Shield,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { CanvasEditor } from './components/CanvasEditor';
import { DashboardHomeView } from './components/DashboardHomeView';
import { FBLiveBroadcastStudioView } from './components/FBLiveBroadcastStudioView';
import { HDExportModal } from './components/HDExportModal';
import {
  BackupRestoreView,
  MediaLibraryView,
  SavedDesignsView,
  SettingsView,
  TemplateLibraryView,
} from './components/LibraryAndSystemViews';
import { MatchManagerView } from './components/MatchManagerView';
import { OfflineIndicator } from './components/PWAInstallPrompt';
import { PlayerManagerView } from './components/PlayerManagerView';
import { TournamentProfileView } from './components/TournamentProfileView';
import {
  DEFAULT_MEDIA_ASSETS,
  DEFAULT_PLAYERS,
  DEFAULT_RESULTS,
  DEFAULT_SCHEDULES,
  DEFAULT_SCORECARDS,
  DEFAULT_SPONSORS,
  DEFAULT_TEAMS,
  DEFAULT_TOURNAMENT_PROFILES,
  buildMasterTemplates,
  syncProfileToDesign,
} from './data/defaultTemplates';
import {
  DesignDocument,
  FullStudioBackup,
  Language,
  LocalSponsorAd,
  MatchResultRecord,
  MatchScheduleRecord,
  MediaAsset,
  PlayerRecord,
  ScorecardRecord,
  StudioSettings,
  TeamSquadRecord,
  TemplateCategory,
  TournamentProfile,
  WorkspaceSection,
  t3,
} from './types/studio';
import {
  DEFAULT_SETTINGS,
  hydrateStudioData,
  idbSaveAll,
  restoreFullBackup,
  saveStudioSettings,
} from './utils/storage';

interface NavItem {
  id: WorkspaceSection;
  labelHi: string;
  labelEn: string;
  labelMix: string;
  icon: React.ElementType;
  category?: TemplateCategory;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', labelHi: '1. मुख्य पटल (डैशबोर्ड)', labelEn: '1. Dashboard', labelMix: '1. डैशबोर्ड (Dashboard)', icon: Home },
  { id: 'fb-live-studio', labelHi: '🔴 फेसबुक लाइव स्कोरिंग स्टूडियो', labelEn: '🔴 FB Live Scoring Studio', labelMix: '🔴 FB Live & 2-मोबाइल स्टूडियो', icon: Radio },
  { id: 'tournament-profile', labelHi: '2. टूर्नामेंट जानकारी', labelEn: '2. Tournament Profile', labelMix: '2. टूर्नामेंट प्रोफाइल (Profile)', icon: Shield },
  { id: 'poster-maker', labelHi: '3. पोस्टर और बैनर निर्माता', labelEn: '3. Poster & Banner Maker', labelMix: '3. पोस्टर और बैनर मेकर', icon: Palette, category: 'poster' },
  { id: 'invitation-maker', labelHi: '4. आमंत्रण पत्र निर्माता', labelEn: '4. Invitation Card Maker', labelMix: '4. आमंत्रण कार्ड मेकर', icon: Mail, category: 'invitation' },
  { id: 'player-list-maker', labelHi: '5. 8-टीम व 15-खिलाड़ी सूची', labelEn: '5. 8-Team & 15-Player List', labelMix: '5. 8-टीम & 15-खिलाड़ी मेकर', icon: Users, category: 'player-list' },
  { id: 'rules-maker', labelHi: '6. नियम व शर्तें पत्र', labelEn: '6. Rules & Regulations', labelMix: '6. नियम व शर्तें (Rules)', icon: ScrollText, category: 'rules' },
  { id: 'prize-maker', labelHi: '7. पुरस्कार वितरण सूची', labelEn: '7. Prize Distribution', labelMix: '7. पुरस्कार वितरण (Prize)', icon: Trophy, category: 'prize' },
  { id: 'certificate-maker', labelHi: '8. प्रमाण-पत्र (सर्टिफिकेट)', labelEn: '8. Certificate Maker', labelMix: '8. सर्टिफिकेट मेकर (Certificate)', icon: Award, category: 'certificate' },
  { id: 'voucher-maker', labelHi: '9. इनाम वाउचर निर्माता', labelEn: '9. Prize Voucher Maker', labelMix: '9. प्राइज वाउचर मेकर', icon: CreditCard, category: 'voucher' },
  { id: 'schedule-maker', labelHi: '10. मैच समय-सारणी (शेड्यूल)', labelEn: '10. 8-Team Match Schedule', labelMix: '10. 8-टीम शेड्यूल & FB पोस्ट', icon: Calendar, category: 'schedule' },
  { id: 'result-maker', labelHi: '11. मैच परिणाम व अखबार खबर', labelEn: '11. Match Results & Press News', labelMix: '11. मैच रिजल्ट & अखबार खबर', icon: FileCheck, category: 'result' },
  { id: 'scorecard-maker', labelHi: '12. स्कोरकार्ड व माइक प्रचार', labelEn: '12. Scorecard & Mic Announcement', labelMix: '12. स्कोरकार्ड & माइक प्रचार', icon: ClipboardList, category: 'scorecard' },
  { id: 'letter-maker', labelHi: '13. आधिकारिक अनुमति पत्र', labelEn: '13. Official Permission Letter', labelMix: '13. आधिकारिक पत्र (Letter)', icon: FileText, category: 'letter' },
  { id: 'template-library', labelHi: '14. सभी रेडीमेड डिज़ाइन', labelEn: '14. Template Library', labelMix: '14. टेम्पलेट लाइब्रेरी', icon: LayoutTemplate },
  { id: 'saved-designs', labelHi: '15. मेरे सुरक्षित डिज़ाइन', labelEn: '15. My Saved Designs', labelMix: '15. मेरे सेव डिज़ाइन (Saved)', icon: FolderHeart },
  { id: 'media-library', labelHi: '16. फोटो व लोगो संग्रह', labelEn: '16. Media & Logo Library', labelMix: '16. मीडिया व लोगो लाइब्रेरी', icon: ImageIcon },
  { id: 'backup-restore', labelHi: '17. डेटा सुरक्षा (बैकअप)', labelEn: '17. Backup & Restore', labelMix: '17. बैकअप और रीस्टोर', icon: Database },
  { id: 'settings', labelHi: '18. ऐप सेटिंग्स', labelEn: '18. App Settings', labelMix: '18. सेटिंग्स (Settings)', icon: Settings },
];

export default function App() {
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [desktopSidebarHidden, setDesktopSidebarHidden] = useState<boolean>(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState<boolean>(false);

  // Persistent State
  const [settings, setSettings] = useState<StudioSettings>(DEFAULT_SETTINGS);
  const [profiles, setProfiles] = useState<TournamentProfile[]>(
    DEFAULT_TOURNAMENT_PROFILES
  );
  const [savedDesigns, setSavedDesigns] = useState<DesignDocument[]>([]);
  const [customTemplates, setCustomTemplates] = useState<DesignDocument[]>([]);
  const [players, setPlayers] = useState<PlayerRecord[]>(DEFAULT_PLAYERS);
  const [teams, setTeams] = useState<TeamSquadRecord[]>(DEFAULT_TEAMS);
  const [sponsors, setSponsors] = useState<LocalSponsorAd[]>(DEFAULT_SPONSORS);
  const [schedules, setSchedules] =
    useState<MatchScheduleRecord[]>(DEFAULT_SCHEDULES);
  const [results, setResults] = useState<MatchResultRecord[]>(DEFAULT_RESULTS);
  const [scorecards, setScorecards] =
    useState<ScorecardRecord[]>(DEFAULT_SCORECARDS);
  const [mediaLibrary, setMediaLibrary] =
    useState<MediaAsset[]>(DEFAULT_MEDIA_ASSETS);

  // Active Document in Visual Canvas Editor
  const [editorDoc, setEditorDoc] = useState<DesignDocument | null>(null);
  const [editorCatFilter, setEditorCatFilter] = useState<
    TemplateCategory | undefined
  >(undefined);

  // Hydrate from IndexedDB & LocalStorage on startup
  useEffect(() => {
    hydrateStudioData().then((state) => {
      setSettings(state.settings);
      setProfiles(state.profiles);
      setSavedDesigns(state.savedDesigns);
      setCustomTemplates(state.customTemplates);
      setPlayers(state.players);
      setTeams(state.teams);
      setSponsors(state.sponsors);
      setSchedules(state.schedules);
      setResults(state.results);
      setScorecards(state.scorecards);
      setMediaLibrary(state.mediaLibrary);
    });
  }, []);

  // Detect PRISM Live / CameraFi Web Overlay URL Mode (?liveOverlay=1&room=JALE-2026)
  const overlayParams = useMemo(() => {
    if (typeof window === 'undefined') {
      return { isOverlay: false, room: 'JALE-2026' };
    }
    const sp = new URLSearchParams(window.location.search);
    return {
      isOverlay: sp.get('liveOverlay') === '1',
      room: (sp.get('room') || 'JALE-2026').toUpperCase(),
    };
  }, []);

  // Sync Dark Mode class on <html> (or transparent background in Web Overlay mode)
  useEffect(() => {
    if (overlayParams.isOverlay) {
      document.documentElement.style.background = 'transparent';
      document.body.style.background = 'transparent';
      return;
    }
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode, overlayParams.isOverlay]);

  // Android / Browser Back Button support
  useEffect(() => {
    const handlePopState = () => {
      if (activeSection !== 'dashboard') {
        setActiveSection('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeSection]);

  const activeProfile = useMemo(() => {
    return (
      profiles.find((p) => p.id === settings.activeProfileId) || profiles[0]
    );
  }, [profiles, settings.activeProfileId]);

  const masterTemplates = useMemo(() => {
    return buildMasterTemplates(activeProfile);
  }, [activeProfile]);

  const allTemplates = useMemo(() => {
    const customIds = new Set(customTemplates.map((t) => t.id));
    return [
      ...customTemplates,
      ...masterTemplates.filter((m) => !customIds.has(m.id)),
    ];
  }, [customTemplates, masterTemplates]);

  const lang = settings.language;

  // Navigation Handler that opens the appropriate Maker or Workspace
  const handleNavigate = (section: WorkspaceSection) => {
    window.history.pushState({ section }, '', `#${section}`);
    setSidebarOpen(false);

    const makerCategoryMap: Partial<
      Record<WorkspaceSection, { cat: TemplateCategory; defaultTplId: string }>
    > = {
      'poster-maker': { cat: 'poster', defaultTplId: 'tpl-poster-jale-official' },
      'invitation-maker': { cat: 'invitation', defaultTplId: 'tpl-inv-final-jale' },
      'rules-maker': { cat: 'rules', defaultTplId: 'tpl-doc-rules-jale' },
      'prize-maker': { cat: 'prize', defaultTplId: 'tpl-poster-prize-dist' },
      'certificate-maker': { cat: 'certificate', defaultTplId: 'tpl-cert-winner' },
      'voucher-maker': { cat: 'voucher', defaultTplId: 'tpl-voucher-mos-jale' },
      'letter-maker': { cat: 'letter', defaultTplId: 'tpl-letter-principal-jale' },
    };

    const mapped = makerCategoryMap[section];
    if (mapped) {
      const foundTpl =
        allTemplates.find((t) => t.id === mapped.defaultTplId) ||
        allTemplates.find((t) => t.category === mapped.cat) ||
        allTemplates[0];
      setEditorDoc(foundTpl);
      setEditorCatFilter(mapped.cat);
    }

    setActiveSection(section);
  };

  const handleOpenTemplateInEditor = (tpl: DesignDocument) => {
    setEditorDoc(tpl);
    setEditorCatFilter(tpl.category);
    const targetSectionMap: Record<TemplateCategory, WorkspaceSection> = {
      poster: 'poster-maker',
      invitation: 'invitation-maker',
      'player-list': 'poster-maker',
      rules: 'rules-maker',
      prize: 'prize-maker',
      certificate: 'certificate-maker',
      voucher: 'voucher-maker',
      schedule: 'poster-maker',
      result: 'poster-maker',
      scorecard: 'poster-maker',
      letter: 'letter-maker',
    };
    setActiveSection(targetSectionMap[tpl.category] || 'poster-maker');
  };

  // Persistence Handlers
  const handleUpdateSettings = (next: StudioSettings) => {
    setSettings(next);
    saveStudioSettings(next);
  };

  const handleSaveProfiles = (
    nextProfiles: TournamentProfile[],
    activeId: string
  ) => {
    setProfiles(nextProfiles);
    idbSaveAll('profiles', nextProfiles);
    handleUpdateSettings({ ...settings, activeProfileId: activeId });

    // Also dynamically sync savedDesigns & customTemplates with updated active profile
    const updatedActive =
      nextProfiles.find((p) => p.id === activeId) || nextProfiles[0];
    if (updatedActive) {
      if (savedDesigns.length > 0) {
        const syncedSaved = savedDesigns.map((d) =>
          syncProfileToDesign(d, updatedActive)
        );
        setSavedDesigns(syncedSaved);
        idbSaveAll('savedDesigns', syncedSaved);
      }
      if (customTemplates.length > 0) {
        const syncedCustom = customTemplates.map((t) =>
          syncProfileToDesign(t, updatedActive)
        );
        setCustomTemplates(syncedCustom);
        idbSaveAll('customTemplates', syncedCustom);
      }
    }
  };

  const handleQuickUpdateProfile = (updatedProfile: TournamentProfile) => {
    const nextProfiles = profiles.map((p) =>
      p.id === updatedProfile.id ? updatedProfile : p
    );
    handleSaveProfiles(nextProfiles, updatedProfile.id);
  };

  const handleSaveDesign = (doc: DesignDocument, asTemplate?: boolean) => {
    const nowIso = new Date().toISOString();

    if (asTemplate) {
      const customTpl: DesignDocument = {
        ...doc,
        id: `custom-tpl-${Date.now()}`,
        isTemplate: true,
        isCustomTemplate: true,
        updatedAt: nowIso,
      };
      const nextCustom = [customTpl, ...customTemplates];
      setCustomTemplates(nextCustom);
      idbSaveAll('customTemplates', nextCustom);
      return;
    }

    // 1. If the user is editing a template (master or custom), override/update it in customTemplates
    // so reopening Poster Maker, Invitation Maker, or Dashboard keeps their exact saved edits!
    const isKnownTemplate =
      doc.isTemplate ||
      masterTemplates.some((m) => m.id === doc.id) ||
      customTemplates.some((c) => c.id === doc.id);

    if (isKnownTemplate) {
      const updatedTpl: DesignDocument = {
        ...doc,
        isTemplate: true,
        isCustomTemplate: true,
        updatedAt: nowIso,
      };
      const existsInCustom = customTemplates.some((c) => c.id === doc.id);
      const nextCustom = existsInCustom
        ? customTemplates.map((c) => (c.id === doc.id ? updatedTpl : c))
        : [updatedTpl, ...customTemplates];
      setCustomTemplates(nextCustom);
      idbSaveAll('customTemplates', nextCustom);
      setEditorDoc(updatedTpl);
    }

    // 2. Also save/update in savedDesigns so it appears in "My Saved Designs"
    const savedId = doc.id.startsWith('saved-') ? doc.id : `saved-${doc.id}`;
    const existsInSaved = savedDesigns.some((d) => d.id === savedId);
    const savedEntry: DesignDocument = {
      ...doc,
      id: savedId,
      isTemplate: false,
      version: existsInSaved
        ? (savedDesigns.find((d) => d.id === savedId)?.version || 1) + 1
        : 1,
      updatedAt: nowIso,
    };
    const nextSaved = existsInSaved
      ? savedDesigns.map((d) => (d.id === savedId ? savedEntry : d))
      : [savedEntry, ...savedDesigns];

    setSavedDesigns(nextSaved);
    idbSaveAll('savedDesigns', nextSaved);
  };

  const handleSaveTeams = (list: TeamSquadRecord[]) => {
    setTeams(list);
    idbSaveAll('teams', list);
  };

  const handleSaveSponsors = (list: LocalSponsorAd[]) => {
    setSponsors(list);
    idbSaveAll('sponsors', list);
  };

  const handleSaveSchedules = (list: MatchScheduleRecord[]) => {
    setSchedules(list);
    idbSaveAll('schedules', list);
  };

  const handleSaveResults = (list: MatchResultRecord[]) => {
    setResults(list);
    idbSaveAll('results', list);
  };

  const handleSaveScorecards = (list: ScorecardRecord[]) => {
    setScorecards(list);
    idbSaveAll('scorecards', list);
  };

  const handleSaveMedia = (list: MediaAsset[]) => {
    setMediaLibrary(list);
    idbSaveAll('mediaLibrary', list);
  };

  const handleAddSingleMedia = (asset: Omit<MediaAsset, 'id' | 'createdAt'>) => {
    const created: MediaAsset = {
      ...asset,
      id: `media-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    handleSaveMedia([created, ...mediaLibrary]);
  };

  const handleRestoreFullBackup = async (backup: FullStudioBackup) => {
    await restoreFullBackup(backup);
    const hydrated = await hydrateStudioData();
    setSettings(hydrated.settings);
    setProfiles(hydrated.profiles);
    setSavedDesigns(hydrated.savedDesigns);
    setCustomTemplates(hydrated.customTemplates);
    setPlayers(hydrated.players);
    setTeams(hydrated.teams);
    setSponsors(hydrated.sponsors);
    setSchedules(hydrated.schedules);
    setResults(hydrated.results);
    setScorecards(hydrated.scorecards);
    setMediaLibrary(hydrated.mediaLibrary);
  };

  const isCanvasMakerSection =
    activeSection === 'poster-maker' ||
    activeSection === 'invitation-maker' ||
    activeSection === 'rules-maker' ||
    activeSection === 'prize-maker' ||
    activeSection === 'certificate-maker' ||
    activeSection === 'voucher-maker' ||
    activeSection === 'letter-maker';

  const fullBackupObject: FullStudioBackup = {
    appVersion: '4.0.0',
    exportedAt: new Date().toISOString(),
    settings,
    profiles,
    savedDesigns,
    customTemplates,
    players,
    teams,
    sponsors,
    schedules,
    results,
    scorecards,
    mediaLibrary,
  };

  if (overlayParams.isOverlay) {
    return (
      <FBLiveBroadcastStudioView
        lang={lang}
        activeProfile={activeProfile}
        teams={teams}
        sponsors={sponsors}
        templates={allTemplates}
        overlayOnly={true}
        initialRoomId={overlayParams.room}
      />
    );
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* TOP BAR: Clean, zero-overflow mobile & laptop header */}
      <header className="sticky top-0 z-30 h-14 flex items-center justify-between gap-2 px-3 sm:px-6 bg-[#0B192C] text-white border-b border-slate-800 shrink-0 w-full overflow-hidden">
        {/* Zone 1: Menu + Brand Title */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => {
              if (window.innerWidth >= 1280) {
                setDesktopSidebarHidden(!desktopSidebarHidden);
              } else {
                setSidebarOpen(!sidebarOpen);
              }
            }}
            className="p-2 rounded-lg text-slate-200 hover:bg-slate-800 cursor-pointer shrink-0"
            aria-label="Toggle Menu"
            title="मेनू दिखाएं / छुपाएं (बड़ी स्क्रीन के लिए)"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleNavigate('dashboard')}
            className="text-sm sm:text-lg font-black tracking-wide text-amber-400 truncate cursor-pointer text-left"
          >
            JALE CRICKET STUDIO
          </button>
        </div>

        {/* Zone 2: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-bold text-slate-200">
          <button
            onClick={() => handleNavigate('dashboard')}
            className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'dashboard'
                ? 'text-amber-400 underline underline-offset-4'
                : ''
            }`}
          >
            {t3(lang, 'मुख्य पटल', 'Dashboard', 'डैशबोर्ड (Home)')}
          </button>
          <button
            onClick={() => handleNavigate('tournament-profile')}
            className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'tournament-profile'
                ? 'text-amber-400 underline underline-offset-4'
                : ''
            }`}
          >
            {t3(lang, 'टूर्नामेंट जानकारी', 'Tournament Profile', 'टूर्नामेंट प्रोफाइल')}
          </button>
          <button
            onClick={() => handleNavigate('poster-maker')}
            className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isCanvasMakerSection
                ? 'text-amber-400 underline underline-offset-4'
                : ''
            }`}
          >
            {t3(lang, 'डिज़ाइन कक्ष', 'Design Editor', 'डिज़ाइन स्टूडियो')}
          </button>
          <button
            onClick={() => handleNavigate('player-list-maker')}
            className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'player-list-maker'
                ? 'text-amber-400 underline underline-offset-4'
                : ''
            }`}
          >
            {t3(lang, '8-टीम व खिलाड़ी', '8 Teams & Players', '8-टीम & 15-खिलाड़ी')}
          </button>
          <button
            onClick={() => handleNavigate('fb-live-studio')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'fb-live-studio'
                ? 'bg-red-600 text-white font-black'
                : 'bg-red-600/20 text-red-300 hover:bg-red-600 hover:text-white border border-red-500/40'
            }`}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>
              {t3(lang, '🔴 लाइव स्कोरिंग', '🔴 FB Live Studio', '🔴 FB Live स्टूडियो')}
            </span>
          </button>
          <button
            onClick={() => handleNavigate('schedule-maker')}
            className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'schedule-maker'
                ? 'text-amber-400 underline underline-offset-4'
                : ''
            }`}
          >
            {t3(lang, 'मैच व प्रचार', 'Schedule & News', 'शेड्यूल / अखबार / प्रचार')}
          </button>
        </nav>

        {/* Zone 3: Laptop Full-Screen Button, Profile & 3-Mode Language Switcher */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement
                  .requestFullscreen?.()
                  .then(() => {
                    setIsBrowserFullscreen(true);
                    setDesktopSidebarHidden(true);
                  })
                  .catch(() => {
                    setDesktopSidebarHidden(!desktopSidebarHidden);
                  });
              } else {
                document
                  .exitFullscreen?.()
                  .then(() => {
                    setIsBrowserFullscreen(false);
                    setDesktopSidebarHidden(false);
                  })
                  .catch(() => {
                    setDesktopSidebarHidden(false);
                  });
              }
            }}
            className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black cursor-pointer border transition-colors ${
              isBrowserFullscreen || desktopSidebarHidden
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
            }`}
            title="लैपटॉप / बड़ी स्क्रीन फुल-स्क्रीन कंट्रोल व्यू"
          >
            <span>
              {isBrowserFullscreen || desktopSidebarHidden
                ? t3(lang, '🖥️ सामान्य स्क्रीन', '🖥️ Exit Fullscreen', '🖥️ नॉर्मल व्यू')
                : t3(lang, '🖥️ बड़ी स्क्रीन', '🖥️ Fullscreen (PC)', '🖥️ फुल-स्क्रीन (Laptop)')}
            </span>
          </button>

          <button
            onClick={() => handleNavigate('tournament-profile')}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-300 text-xs font-bold cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{t3(lang, 'प्रोफाइल / लोगो', 'Profile / Logo', 'प्रोफाइल / Logo')}</span>
          </button>

          {/* 3-MODE LANGUAGE SWITCHER: [ हिंदी | English | हिंदी+EN ] */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-700 shrink-0">
            <Globe className="w-3.5 h-3.5 text-amber-400 ml-1.5 mr-1 hidden sm:inline shrink-0" />
            {(
              [
                { id: 'hi' as Language, label: 'हिंदी' },
                { id: 'en' as Language, label: 'English' },
                { id: 'mix' as Language, label: 'हिंदी+EN' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() =>
                  handleUpdateSettings({
                    ...settings,
                    language: opt.id,
                  })
                }
                className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  lang === opt.id
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE BODY WITH SIDEBAR DRAWER */}
      <div className="flex flex-1 min-h-0 relative w-full overflow-x-hidden">
        {/* Sidebar Overlay on Mobile/Desktop when toggled */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs xl:hidden"
          />
        )}

        {/* Full 18-Section Navigation Sidebar */}
        <aside
          className={`${
            sidebarOpen
              ? 'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw]'
              : desktopSidebarHidden
              ? 'hidden'
              : 'hidden xl:flex w-60'
          } flex-col bg-[#0B192C] text-slate-200 border-r border-slate-800 shrink-0 overflow-y-auto`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 xl:hidden">
            <span className="text-sm font-black text-amber-400">
              JALE CRICKET STUDIO
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {t3(lang, item.labelHi, item.labelEn, item.labelMix)}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ACTIVE WORKSPACE VIEWPORT */}
        <div className="flex-1 min-w-0 w-full pb-16 lg:pb-0 overflow-y-auto overflow-x-hidden">
          {activeSection === 'dashboard' && (
            <DashboardHomeView
              lang={lang}
              activeProfile={activeProfile}
              profiles={profiles}
              templates={allTemplates}
              savedDesigns={savedDesigns}
              players={players}
              schedules={schedules}
              onSelectProfile={(id) =>
                handleUpdateSettings({ ...settings, activeProfileId: id })
              }
              onQuickUpdateProfile={handleQuickUpdateProfile}
              onNavigate={handleNavigate}
              onOpenTemplateInEditor={handleOpenTemplateInEditor}
            />
          )}

          {activeSection === 'fb-live-studio' && (
            <FBLiveBroadcastStudioView
              lang={lang}
              activeProfile={activeProfile}
              teams={teams}
              sponsors={sponsors}
              templates={allTemplates}
              onSaveSponsors={handleSaveSponsors}
            />
          )}

          {activeSection === 'tournament-profile' && (
            <TournamentProfileView
              lang={lang}
              profiles={profiles}
              activeProfileId={activeProfile.id}
              onSelectProfile={(id) =>
                handleUpdateSettings({ ...settings, activeProfileId: id })
              }
              onSaveProfiles={handleSaveProfiles}
            />
          )}

          {isCanvasMakerSection && (
            <CanvasEditor
              lang={lang}
              initialDoc={editorDoc || allTemplates[0]}
              activeProfile={activeProfile}
              templates={allTemplates}
              mediaLibrary={mediaLibrary}
              categoryFilter={editorCatFilter}
              onSaveDesign={handleSaveDesign}
              onUploadMedia={handleAddSingleMedia}
              onQuickUpdateProfile={handleQuickUpdateProfile}
            />
          )}

          {activeSection === 'player-list-maker' && (
            <PlayerManagerView
              lang={lang}
              teams={teams}
              activeProfile={activeProfile}
              templates={allTemplates}
              onSaveTeams={handleSaveTeams}
              onOpenInEditor={(doc) => {
                setEditorDoc(doc);
                setEditorCatFilter('player-list');
                setActiveSection('poster-maker');
              }}
            />
          )}

          {(activeSection === 'schedule-maker' ||
            activeSection === 'result-maker' ||
            activeSection === 'scorecard-maker') && (
            <MatchManagerView
              lang={lang}
              initialSubTab={
                activeSection === 'schedule-maker'
                  ? 'schedule'
                  : activeSection === 'result-maker'
                  ? 'result'
                  : 'scorecard'
              }
              teams={teams}
              sponsors={sponsors}
              schedules={schedules}
              results={results}
              scorecards={scorecards}
              activeProfile={activeProfile}
              templates={allTemplates}
              onSaveSchedules={handleSaveSchedules}
              onSaveResults={handleSaveResults}
              onSaveScorecards={handleSaveScorecards}
              onSaveSponsors={handleSaveSponsors}
              onOpenInEditor={(doc) => {
                setEditorDoc(doc);
                setEditorCatFilter(doc.category);
                setActiveSection('poster-maker');
              }}
            />
          )}

          {activeSection === 'template-library' && (
            <TemplateLibraryView
              lang={lang}
              templates={masterTemplates}
              customTemplates={customTemplates}
              activeProfile={activeProfile}
              onOpenTemplate={handleOpenTemplateInEditor}
              onDeleteCustomTemplate={(id) => {
                const next = customTemplates.filter((t) => t.id !== id);
                setCustomTemplates(next);
                idbSaveAll('customTemplates', next);
              }}
            />
          )}

          {activeSection === 'saved-designs' && (
            <SavedDesignsView
              lang={lang}
              savedDesigns={savedDesigns}
              onOpenDesign={handleOpenTemplateInEditor}
              onUpdateDesigns={(list) => {
                setSavedDesigns(list);
                idbSaveAll('savedDesigns', list);
              }}
            />
          )}

          {activeSection === 'media-library' && (
            <MediaLibraryView
              lang={lang}
              mediaLibrary={mediaLibrary}
              onSaveMedia={handleSaveMedia}
            />
          )}

          {activeSection === 'backup-restore' && (
            <BackupRestoreView
              lang={lang}
              fullState={fullBackupObject}
              onRestoreBackup={handleRestoreFullBackup}
            />
          )}

          {activeSection === 'settings' && (
            <SettingsView
              lang={lang}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {!isCanvasMakerSection && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-[#0B192C]/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-5 items-center text-slate-300">
          {[
            { id: 'dashboard', icon: Home, labelHi: 'मुख्य पटल', labelEn: 'Home', labelMix: 'होम (Home)' },
            { id: 'fb-live-studio', icon: Radio, labelHi: '🔴 लाइव', labelEn: '🔴 FB Live', labelMix: '🔴 FB Live' },
            { id: 'player-list-maker', icon: Users, labelHi: '8-टीम', labelEn: '8 Teams', labelMix: '8-टीम/खिलाड़ी' },
            { id: 'schedule-maker', icon: Calendar, labelHi: 'मैच/खबर', labelEn: 'Matches', labelMix: 'शेड्यूल/प्रचार' },
            { id: 'poster-maker', icon: Palette, labelHi: 'डिज़ाइन', labelEn: 'Editor', labelMix: 'एडिटर' },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleNavigate(tab.id as WorkspaceSection)}
                className={`flex flex-col items-center justify-center h-full cursor-pointer ${
                  active ? 'text-amber-400 font-extrabold' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] mt-0.5 truncate max-w-full px-1">
                  {t3(lang, tab.labelHi, tab.labelEn, tab.labelMix)}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Single-Option Ultra-HD Download Modal */}
      <HDExportModal lang={lang} />

      {/* Offline Status Toast */}
      <OfflineIndicator lang={lang} />
    </div>
  );
}
