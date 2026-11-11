import React from 'react';
import {
  Award,
  Calendar,
  ClipboardList,
  CreditCard,
  Database,
  FileCheck,
  FileText,
  FolderHeart,
  Image as ImageIcon,
  LayoutTemplate,
  Mail,
  Palette,
  ScrollText,
  Settings,
  Shield,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import {
  DesignDocument,
  Language,
  MatchScheduleRecord,
  PlayerRecord,
  TournamentProfile,
  WorkspaceSection,
} from '../types/studio';
import { exportDesignDocument } from '../utils/exportEngine';

interface DashboardHomeViewProps {
  lang: Language;
  activeProfile: TournamentProfile;
  profiles: TournamentProfile[];
  templates: DesignDocument[];
  savedDesigns: DesignDocument[];
  players: PlayerRecord[];
  schedules: MatchScheduleRecord[];
  onSelectProfile: (id: string) => void;
  onNavigate: (section: WorkspaceSection) => void;
  onOpenTemplateInEditor: (tpl: DesignDocument) => void;
}

export const DashboardHomeView: React.FC<DashboardHomeViewProps> = ({
  lang,
  activeProfile,
  profiles,
  templates,
  savedDesigns,
  players,
  schedules,
  onSelectProfile,
  onNavigate,
  onOpenTemplateInEditor,
}) => {
  const studioTools: {
    section: WorkspaceSection;
    titleHi: string;
    titleEn: string;
    descHi: string;
    descEn: string;
    icon: React.ElementType;
    accentClass: string;
  }[] = [
    {
      section: 'poster-maker',
      titleHi: 'पोस्टर और बैनर मेकर',
      titleEn: 'Poster & Banner Maker',
      descHi: 'टूर्नामेंट मुख्य पोस्टर, फाइनल पोस्टर, मैच डे और विजेता पोस्टर',
      descEn: 'Tournament posters, grand final banners, match day & winner posters',
      icon: Palette,
      accentClass: 'bg-blue-600 text-white',
    },
    {
      section: 'invitation-maker',
      titleHi: 'आमंत्रण कार्ड मेकर',
      titleEn: 'Invitation Card Maker',
      descHi: 'मुख्य अतिथि, विशिष्ट अतिथि, उद्घाटन एवं फाइनल मैच आमंत्रण पत्र',
      descEn: 'Chief guest, special guest, opening & final match invitation cards',
      icon: Mail,
      accentClass: 'bg-sky-500 text-white',
    },
    {
      section: 'player-list-maker',
      titleHi: 'खिलाड़ी सूची व शपथ पत्र',
      titleEn: 'Player List & Undertaking',
      descHi: '15-खिलाड़ियों की सूची, टीम रजिस्ट्रेशन फॉर्म, Excel व PDF प्रिंट',
      descEn: '15-player roster, team undertaking form, Excel & printable PDF',
      icon: Users,
      accentClass: 'bg-emerald-600 text-white',
    },
    {
      section: 'voucher-maker',
      titleHi: 'प्राइज वाउचर व चेक मेकर',
      titleEn: 'Prize Voucher & Cheque Maker',
      descHi: 'मैन ऑफ द सीरीज, मैन ऑफ द मैच और विजेता बैंक चेक वाउचर',
      descEn: 'Man of the Series, MOM & Winner giant prize cheque vouchers',
      icon: CreditCard,
      accentClass: 'bg-amber-500 text-slate-950',
    },
    {
      section: 'letter-maker',
      titleHi: 'आधिकारिक आवेदन पत्र मेकर',
      titleEn: 'Official Letter Maker',
      descHi: 'प्रधानाचार्य मैदान अनुमति पत्र एवं थाना अध्यक्ष शांति व्यवस्था सूचना पत्र',
      descEn: 'College ground permission & Police Station SHO intimation letters',
      icon: FileText,
      accentClass: 'bg-indigo-600 text-white',
    },
    {
      section: 'certificate-maker',
      titleHi: 'सर्टिफिकेट (प्रमाण-पत्र) मेकर',
      titleEn: 'Certificate Maker',
      descHi: 'विजेता, उप-विजेता, मैन ऑफ द मैच, सीरीज एवं सहभागिता प्रमाण-पत्र',
      descEn: 'Winner, Runner-up, MOM, MOS, Best Batsman & Bowler certificates',
      icon: Award,
      accentClass: 'bg-purple-600 text-white',
    },
    {
      section: 'rules-maker',
      titleHi: 'नियम व शर्तें मेकर',
      titleEn: 'Rules & Regulations Maker',
      descHi: 'टूर्नामेंट के 10 मुख्य नियम, अनुशासन व शतक इनाम की नियमावली',
      descEn: 'Official tournament rules, discipline policies & century rewards',
      icon: ScrollText,
      accentClass: 'bg-red-600 text-white',
    },
    {
      section: 'prize-maker',
      titleHi: 'पुरस्कार वितरण शीट मेकर',
      titleEn: 'Prize Distribution Maker',
      descHi: 'प्रथम, द्वितीय, तृतीय व सभी व्यक्तिगत पुरस्कारों की आधिकारिक सूची',
      descEn: 'Complete prize breakdown sheet for final ceremony distribution',
      icon: Trophy,
      accentClass: 'bg-yellow-500 text-slate-950',
    },
    {
      section: 'schedule-maker',
      titleHi: 'मैच शेड्यूल (समय-सारणी)',
      titleEn: 'Match Schedule Maker',
      descHi: 'लीग, क्वार्टर, सेमीफाइनल और ग्रैंड फाइनल की समय-सारणी व PDF',
      descEn: 'League, Semi-Final & Grand Final match fixtures and PDF export',
      icon: Calendar,
      accentClass: 'bg-teal-600 text-white',
    },
    {
      section: 'result-maker',
      titleHi: 'मैच रिजल्ट (परिणाम) मेकर',
      titleEn: 'Match Result Maker',
      descHi: 'दोनों टीमों का स्कोर, विजेता अंतर और मैन ऑफ द मैच पोस्टर/शीट',
      descEn: 'Team scores, winning margin & Man of the Match result cards',
      icon: FileCheck,
      accentClass: 'bg-orange-600 text-white',
    },
    {
      section: 'scorecard-maker',
      titleHi: 'फुल स्कोरकार्ड मेकर',
      titleEn: 'Full Scorecard Maker',
      descHi: 'बल्लेबाजों के रन/चौके/छक्के व गेंदबाजों के ओवर/विकेट का पूरा रिकॉर्ड',
      descEn: 'Full batting & bowling statistics table with automatic strike rate',
      icon: ClipboardList,
      accentClass: 'bg-cyan-700 text-white',
    },
    {
      section: 'tournament-profile',
      titleHi: 'टूर्नामेंट प्रोफाइल सेटअप',
      titleEn: 'Tournament Profile Setup',
      descHi: 'सीजन, तारीख, मैदान, इनाम व अध्यक्ष का नाम एक जगह से अपडेट करें',
      descEn: 'Central tournament profile that auto-fills all designs & templates',
      icon: Shield,
      accentClass: 'bg-slate-800 text-amber-400',
    },
  ];

  // Top 6 featured templates modeled directly after the user's reference collage
  const signatureTemplates = templates.slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-7">
      {/* HERO TOURNAMENT BANNER */}
      <section className="rounded-3xl bg-gradient-to-br from-[#0B192C] via-[#1E3A8A] to-[#090D16] text-white p-6 sm:p-8 border border-amber-500/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <img
              src={activeProfile.tournamentLogo}
              alt={activeProfile.tournamentName}
              referrerPolicy="no-referrer"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-contain bg-slate-950/80 p-2 border-2 border-amber-400 shrink-0"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-amber-300">
                <span>JALE CRICKET STUDIO</span>
                <span aria-hidden="true">·</span>
                <span>{activeProfile.seasonNumber}</span>
                <span aria-hidden="true">·</span>
                <span>{activeProfile.startingDate} — {activeProfile.finalDate}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                {activeProfile.tournamentName}
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 font-semibold">
                स्थान: {activeProfile.venue} · समय: {activeProfile.matchTime}
              </p>
              <p className="text-xs text-amber-300/90 font-semibold">
                आयोजन समिति अध्यक्ष: {activeProfile.presidentName} · संपर्क: {activeProfile.contactNumber}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">
                {lang === 'hi' ? 'सक्रिय सीजन:' : 'Active Season:'}
              </span>
              <select
                value={activeProfile.id}
                onChange={(e) => onSelectProfile(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900/90 border border-amber-500/50 text-amber-300 text-xs font-extrabold focus:outline-none"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.tournamentName} ({p.seasonNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenTemplateInEditor(templates[0])}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                {lang === 'hi'
                  ? 'मुख्य टूर्नामेंट पोस्टर एडिट करें'
                  : 'Edit Main Tournament Poster'}
              </button>
              <button
                onClick={() => onNavigate('tournament-profile')}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-colors cursor-pointer whitespace-nowrap"
              >
                {lang === 'hi' ? 'प्रोफाइल बदलें' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* 4 Key Tournament Prize & Stat Strips */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
          <div className="bg-slate-950/45 rounded-xl p-3.5 border border-white/10">
            <div className="text-[11px] font-bold text-amber-300">
              {lang === 'hi' ? 'प्रथम पुरस्कार (WINNER PRIZE)' : 'WINNER PRIZE'}
            </div>
            <div className="text-lg sm:text-xl font-black text-white mt-0.5 tabular-nums">
              ₹ {activeProfile.winnerPrize}
            </div>
          </div>
          <div className="bg-slate-950/45 rounded-xl p-3.5 border border-white/10">
            <div className="text-[11px] font-bold text-sky-300">
              {lang === 'hi' ? 'उप-विजेता (RUNNER-UP PRIZE)' : 'RUNNER-UP PRIZE'}
            </div>
            <div className="text-lg sm:text-xl font-black text-white mt-0.5 tabular-nums">
              ₹ {activeProfile.runnerUpPrize}
            </div>
          </div>
          <div className="bg-slate-950/45 rounded-xl p-3.5 border border-white/10">
            <div className="text-[11px] font-bold text-emerald-300">
              {lang === 'hi' ? 'मैन ऑफ द सीरीज (MOS)' : 'MAN OF THE SERIES'}
            </div>
            <div className="text-base sm:text-lg font-black text-white mt-0.5 truncate">
              {activeProfile.manOfTheSeriesPrize}
            </div>
          </div>
          <div className="bg-slate-950/45 rounded-xl p-3.5 border border-white/10">
            <div className="text-[11px] font-bold text-slate-300">
              {lang === 'hi' ? 'एंट्री फीस एवं रिकॉर्ड्स' : 'ENTRY FEE & RECORDS'}
            </div>
            <div className="text-base sm:text-lg font-black text-white mt-0.5 tabular-nums">
              ₹ {activeProfile.entryFee} · {players.length} Players · {schedules.length} Matches
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: SIGNATURE JALE CRICKET CUP REFERENCE TEMPLATES (1-CLICK OPEN OR DOWNLOAD) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>
                {lang === 'hi'
                  ? 'जाले क्रिकेट कप स्पेशल रेडीमेड डिज़ाइन (आपके रेफरेंस पर आधारित)'
                  : 'Jale Cricket Cup Official Templates (Inspired by Your Reference)'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'hi'
                ? 'किसी भी डिज़ाइन को कैनवास एडिटर में खोलकर एडिट करें या सीधे उच्च क्वालिटी PDF/PNG डाउनलोड करें।'
                : 'Click any template to customize every text, font, and graphic in the visual editor or download directly.'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('template-library')}
            className="text-xs font-extrabold text-blue-700 dark:text-amber-400 hover:underline self-start sm:self-auto cursor-pointer"
          >
            {lang === 'hi'
              ? `सभी ${templates.length} टेम्पलेट्स देखें →`
              : `View All ${templates.length} Templates →`}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {signatureTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between hover:border-amber-500 transition-all shadow-xs"
            >
              <div
                onClick={() => onOpenTemplateInEditor(tpl)}
                style={{
                  backgroundColor: tpl.backgroundColor,
                  backgroundImage: tpl.backgroundGradient || 'none',
                }}
                className="h-48 p-4 flex flex-col items-center justify-center text-center cursor-pointer border-b border-slate-200 dark:border-slate-800"
              >
                <div
                  className="w-full h-full rounded-xl border-2 flex flex-col items-center justify-center p-3 bg-white/80 backdrop-blur-xs"
                  style={{ borderColor: tpl.borderFrameColor || '#0B192C' }}
                >
                  <span className="text-sm font-black text-slate-900 line-clamp-2">
                    {tpl.nameHi || tpl.name}
                  </span>
                  <span className="text-xs font-bold text-blue-800 mt-1 line-clamp-1">
                    {activeProfile.tournamentName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 mt-2">
                    {tpl.width} × {tpl.height} px · Ready to Print
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {lang === 'hi' ? tpl.nameHi : tpl.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {tpl.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenTemplateInEditor(tpl)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'कैनवास में एडिट करें' : 'Edit in Studio'}</span>
                  </button>
                  <button
                    onClick={() =>
                      exportDesignDocument(tpl, {
                        format: 'pdf',
                        preset: 'original',
                        scale: 2,
                      })
                    }
                    className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
                    title="Instant PDF Download"
                  >
                    PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: ALL 12 DESIGN & MANAGEMENT STUDIO MAKERS */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            {lang === 'hi'
              ? 'संपूर्ण क्रिकेट टूर्नामेंट डिज़ाइन एवं मैनेजमेंट टूल्स'
              : 'All Cricket Tournament Design & Management Workspaces'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'hi'
              ? 'प्रत्येक सेक्शन अपना समर्पित कार्यक्षेत्र (Workspace) खोलता है।'
              : 'Every section opens its own dedicated functional workspace.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {studioTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.section}
                onClick={() => onNavigate(tool.section)}
                className="text-left bg-white dark:bg-slate-900 hover:border-amber-500 dark:hover:border-amber-500 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all flex items-start gap-3.5 cursor-pointer shadow-2xs"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tool.accentClass}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {lang === 'hi' ? tool.titleHi : tool.titleEn}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {lang === 'hi' ? tool.descHi : tool.descEn}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: UPLOADED ORIGINAL REFERENCE BANNER */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {lang === 'hi'
                ? 'आपके मूल जाले क्रिकेट कप (Season-2) रेफरेंस डिज़ाइन'
                : 'Your Uploaded Jale Cricket Cup Reference Collage'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'hi'
                ? 'आमंत्रण कार्ड · 15-खिलाड़ी सूची व शपथ पत्र · मुख्य पोस्टर · प्रधानाचार्य अनुमति पत्र · थाना सूचना पत्र · मैन ऑफ द सीरीज वाउचर'
                : 'Invitation · 15-Player List & Undertaking · Tournament Poster · Principal Letter · Police SHO Letter · Prize Voucher'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('saved-designs')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {lang === 'hi'
                ? `सेव डिज़ाइन (${savedDesigns.length})`
                : `Saved Designs (${savedDesigns.length})`}
            </button>
            <button
              onClick={() => onNavigate('backup-restore')}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-bold cursor-pointer"
            >
              {lang === 'hi' ? 'बैकअप व रीस्टोर' : 'Backup & Restore'}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <img
            src="/assets/aistudio/IMG_20261111_234956_d4e6eb07.jpg"
            alt="Jale Cricket Cup Reference Collage"
            referrerPolicy="no-referrer"
            className="min-w-[960px] w-full h-auto object-contain"
          />
        </div>
      </section>
    </div>
  );
};
