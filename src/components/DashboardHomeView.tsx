import React, { useState } from 'react';
import {
  Award,
  Calendar,
  Camera,
  Check,
  ClipboardList,
  CreditCard,
  Download,
  Edit3,
  FileCheck,
  FileText,
  FolderHeart,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  Mail,
  Palette,
  PenTool,
  ScrollText,
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
import { DesignMiniPreview } from './DesignMiniPreview';

interface DashboardHomeViewProps {
  lang: Language;
  activeProfile: TournamentProfile;
  profiles: TournamentProfile[];
  templates: DesignDocument[];
  savedDesigns: DesignDocument[];
  players: PlayerRecord[];
  schedules: MatchScheduleRecord[];
  onSelectProfile: (id: string) => void;
  onQuickUpdateProfile: (updated: TournamentProfile) => void;
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
  onQuickUpdateProfile,
  onNavigate,
  onOpenTemplateInEditor,
}) => {
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [doneActionId, setDoneActionId] = useState<string | null>(null);
  const [quickToast, setQuickToast] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<string>('ALL');

  const triggerFeedback = (id: string, toastMessage?: string) => {
    setDoneActionId(id);
    if (toastMessage) {
      setQuickToast(toastMessage);
      setTimeout(() => setQuickToast(null), 2800);
    }
    setTimeout(() => {
      setDoneActionId((prev) => (prev === id ? null : prev));
    }, 1800);
  };

  const handleQuickImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'tournamentLogo' | 'signatureImage'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) return;
      onQuickUpdateProfile({
        ...activeProfile,
        [field]: dataUrl,
        updatedAt: new Date().toISOString(),
      });
      triggerFeedback(
        field,
        lang === 'hi'
          ? field === 'tournamentLogo'
            ? '✓ टूर्नामेंट लोगो सफलतापूर्वक अपडेट हो गया! सभी टेम्पलेट्स में नया लोगो लग गया है।'
            : '✓ अध्यक्ष/आयोजक हस्ताक्षर अपडेट हो गया! सभी वाउचर व पत्रों में नया साइन लग गया है।'
          : field === 'tournamentLogo'
          ? '✓ Tournament Logo updated across all templates!'
          : '✓ Authorized Signature updated across all templates!'
      );
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleQuickExport = async (
    tpl: DesignDocument,
    format: 'pdf' | 'png' | 'jpg'
  ) => {
    const actionKey = `${tpl.id}-${format}`;
    setBusyActionId(actionKey);
    try {
      await exportDesignDocument(tpl, {
        format,
        preset: 'original',
        scale: 3,
        filename: tpl.name || 'Jale_Cricket_Cup_Design',
      });
      triggerFeedback(actionKey);
    } finally {
      setBusyActionId(null);
    }
  };

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

  const categoryTabs = [
    { id: 'ALL', labelHi: 'सभी रेडीमेड डिज़ाइन', labelEn: 'All Ready Templates' },
    { id: 'poster', labelHi: 'पोस्टर व बैनर', labelEn: 'Posters' },
    { id: 'invitation', labelHi: 'आमंत्रण कार्ड', labelEn: 'Invitations' },
    { id: 'player-list', labelHi: '15-खिलाड़ी फॉर्म', labelEn: 'Player Form' },
    { id: 'voucher', labelHi: 'प्राइज चेक/वाउचर', labelEn: 'Prize Cheques' },
    { id: 'letter', labelHi: 'आधिकारिक पत्र', labelEn: 'Official Letters' },
    { id: 'certificate', labelHi: 'सर्टिफिकेट', labelEn: 'Certificates' },
  ];

  const displayedTemplates =
    selectedCat === 'ALL'
      ? templates.slice(0, 9)
      : templates.filter((t) => t.category === selectedCat);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 overflow-x-hidden">
      {/* FLOATING QUICK FEEDBACK TOAST */}
      {quickToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-md bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-400 flex items-center gap-2.5 text-xs font-extrabold">
          <Check className="w-4 h-4 shrink-0 stroke-[3]" />
          <span>{quickToast}</span>
        </div>
      )}

      {/* HERO TOURNAMENT BANNER — 100% MOBILE SAFE, ZERO CUTOFF */}
      <section className="w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0B192C] via-[#1E3A8A] to-[#090D16] text-white p-4 sm:p-7 border border-amber-500/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10 min-w-0">
          {/* Left: Clickable Logo + Tournament Details */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-5 min-w-0">
            {/* Interactive Clickable Logo with Camera Badge */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <label
                role="button"
                title={lang === 'hi' ? 'लोगो बदलने के लिए क्लिक करें' : 'Click to Change Tournament Logo'}
                className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-950/90 p-1.5 border-2 border-amber-400 shrink-0 cursor-pointer overflow-hidden shadow-lg"
              >
                <img
                  src={activeProfile.tournamentLogo}
                  alt={activeProfile.tournamentName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-x-0 bottom-0 bg-amber-500/95 text-slate-950 text-[9px] font-black py-0.5 text-center flex items-center justify-center gap-0.5">
                  <Camera className="w-2.5 h-2.5" />
                  <span>{lang === 'hi' ? 'लोगो बदलें' : 'LOGO'}</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleQuickImageUpload(e, 'tournamentLogo')}
                  className="hidden"
                />
              </label>

              {/* Quick Logo & Signature Upload Buttons on Mobile Top Row */}
              <div className="flex sm:hidden flex-col gap-1.5">
                <label
                  role="button"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold cursor-pointer border transition-all ${
                    doneActionId === 'tournamentLogo'
                      ? 'bg-emerald-500 text-white border-emerald-300'
                      : 'bg-white/10 hover:bg-white/20 text-amber-300 border-amber-400/40'
                  }`}
                >
                  {doneActionId === 'tournamentLogo' ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {doneActionId === 'tournamentLogo'
                      ? lang === 'hi'
                        ? 'लोगो अपडेट हुआ!'
                        : 'Logo Updated!'
                      : lang === 'hi'
                      ? 'लोगो अपलोड'
                      : 'Upload Logo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleQuickImageUpload(e, 'tournamentLogo')}
                    className="hidden"
                  />
                </label>

                <label
                  role="button"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold cursor-pointer border transition-all ${
                    doneActionId === 'signatureImage'
                      ? 'bg-emerald-500 text-white border-emerald-300'
                      : 'bg-white/10 hover:bg-white/20 text-sky-200 border-sky-400/40'
                  }`}
                >
                  {doneActionId === 'signatureImage' ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <PenTool className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {doneActionId === 'signatureImage'
                      ? lang === 'hi'
                        ? 'साइन अपडेट हुआ!'
                        : 'Sign Updated!'
                      : lang === 'hi'
                      ? 'हस्ताक्षर (Sign) बदलें'
                      : 'Upload Sign'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleQuickImageUpload(e, 'signatureImage')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-1.5 min-w-0 w-full">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs font-extrabold text-amber-300">
                <span>JALE CRICKET STUDIO</span>
                <span aria-hidden="true">•</span>
                <span className="bg-amber-500/20 px-2 py-0.5 rounded text-amber-200 border border-amber-400/30">
                  {activeProfile.seasonNumber}
                </span>
                <span aria-hidden="true">•</span>
                <span>
                  {activeProfile.startingDate} — {activeProfile.finalDate}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-snug break-words">
                {activeProfile.tournamentName}
              </h1>

              <p className="text-xs sm:text-sm text-blue-100 font-semibold break-words leading-relaxed">
                📍 स्थान: {activeProfile.venue} · ⏰ समय: {activeProfile.matchTime}
              </p>

              <p className="text-xs text-amber-300/95 font-bold break-words">
                👤 अध्यक्ष: {activeProfile.presidentName} · 📞 संपर्क: {activeProfile.contactNumber}
              </p>
            </div>
          </div>

          {/* Right: Season Switcher, Quick Logo/Sign Update & Primary Actions */}
          <div className="flex flex-col items-stretch lg:items-end gap-2.5 w-full lg:w-auto min-w-0 shrink-0 pt-2 lg:pt-0 border-t border-white/10 lg:border-t-0">
            {/* Active Season Selector — Constrained so it never overflows mobile */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 w-full lg:w-80 min-w-0">
              <span className="text-xs font-bold text-slate-300 shrink-0">
                {lang === 'hi' ? 'सक्रिय सीजन:' : 'Active Season:'}
              </span>
              <select
                value={activeProfile.id}
                onChange={(e) => {
                  onSelectProfile(e.target.value);
                  triggerFeedback(
                    'season-switch',
                    lang === 'hi'
                      ? '✓ सीजन बदल गया! सभी टेम्पलेट्स अपडेट हो गए हैं।'
                      : '✓ Active season switched!'
                  );
                }}
                className="w-full min-w-0 px-3 py-2 rounded-xl bg-slate-900/95 border border-amber-500/60 text-amber-300 text-xs font-extrabold focus:outline-none truncate cursor-pointer"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.seasonNumber} — {p.tournamentName}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop/Tablet Quick Logo & Sign Upload Row */}
            <div className="hidden sm:flex items-center gap-2 flex-wrap">
              <label
                role="button"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold cursor-pointer border transition-all ${
                  doneActionId === 'tournamentLogo'
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-white/10 hover:bg-white/20 text-amber-300 border-amber-400/40'
                }`}
              >
                {doneActionId === 'tournamentLogo' ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                <span>
                  {doneActionId === 'tournamentLogo'
                    ? lang === 'hi'
                      ? '✓ लोगो अपडेट हो गया'
                      : '✓ Logo Updated'
                    : lang === 'hi'
                    ? 'लोगो बदलें (Logo)'
                    : 'Change Logo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleQuickImageUpload(e, 'tournamentLogo')}
                  className="hidden"
                />
              </label>

              <label
                role="button"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold cursor-pointer border transition-all ${
                  doneActionId === 'signatureImage'
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-white/10 hover:bg-white/20 text-sky-200 border-sky-400/40'
                }`}
              >
                {doneActionId === 'signatureImage' ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <PenTool className="w-3.5 h-3.5" />
                )}
                <span>
                  {doneActionId === 'signatureImage'
                    ? lang === 'hi'
                      ? '✓ साइन अपडेट हो गया'
                      : '✓ Sign Updated'
                    : lang === 'hi'
                    ? 'हस्ताक्षर बदलें (Sign)'
                    : 'Change Signature'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleQuickImageUpload(e, 'signatureImage')}
                  className="hidden"
                />
              </label>
            </div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full">
              <button
                onClick={() => onOpenTemplateInEditor(templates[0])}
                className="col-span-1 py-2.5 px-3 sm:px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <Palette className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {lang === 'hi' ? 'मुख्य पोस्टर एडिट करें' : 'Edit Main Poster'}
                </span>
              </button>
              <button
                onClick={() => onNavigate('tournament-profile')}
                className="col-span-1 py-2.5 px-3 sm:px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {lang === 'hi' ? 'प्रोफाइल अपडेट करें' : 'Edit Profile'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Key Tournament Prize & Stat Strips — FULL TEXT VISIBILITY, NO TRUNCATION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mt-5 pt-5 border-t border-white/15">
          <div className="bg-slate-950/55 rounded-xl p-3 sm:p-3.5 border border-amber-400/25">
            <div className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wide">
              🏆 {lang === 'hi' ? 'प्रथम पुरस्कार (WINNER PRIZE)' : 'WINNER PRIZE'}
            </div>
            <div className="text-base sm:text-lg font-black text-white mt-0.5 break-words leading-snug">
              ₹ {activeProfile.winnerPrize}
            </div>
          </div>

          <div className="bg-slate-950/55 rounded-xl p-3 sm:p-3.5 border border-sky-400/25">
            <div className="text-[11px] font-extrabold text-sky-300 uppercase tracking-wide">
              🥈 {lang === 'hi' ? 'उप-विजेता (RUNNER-UP PRIZE)' : 'RUNNER-UP PRIZE'}
            </div>
            <div className="text-base sm:text-lg font-black text-white mt-0.5 break-words leading-snug">
              ₹ {activeProfile.runnerUpPrize}
            </div>
          </div>

          <div className="bg-slate-950/55 rounded-xl p-3 sm:p-3.5 border border-emerald-400/25">
            <div className="text-[11px] font-extrabold text-emerald-300 uppercase tracking-wide">
              ⭐ {lang === 'hi' ? 'मैन ऑफ द सीरीज (MOS PRIZE)' : 'MAN OF THE SERIES'}
            </div>
            <div className="text-sm sm:text-base font-black text-white mt-0.5 break-words leading-snug">
              {activeProfile.manOfTheSeriesPrize}
            </div>
          </div>

          <div className="bg-slate-950/55 rounded-xl p-3 sm:p-3.5 border border-purple-400/25">
            <div className="text-[11px] font-extrabold text-purple-200 uppercase tracking-wide">
              📋 {lang === 'hi' ? 'एंट्री फीस एवं रिकॉर्ड्स' : 'ENTRY FEE & RECORDS'}
            </div>
            <div className="text-sm sm:text-base font-black text-white mt-0.5 break-words leading-snug">
              ₹ {activeProfile.entryFee} · {players.length} Players · {schedules.length} Matches
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: READY-MADE DYNAMIC TEMPLATES WITH LIVE VISUAL PREVIEW & 1-CLICK HD DOWNLOAD */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
              <span>
                {lang === 'hi'
                  ? 'बना-बनाया रेडीमेड डिज़ाइन टेम्पलेट्स (Live Dynamic Templates)'
                  : 'Ready-Made Dynamic Cricket Templates (Live Preview)'}
              </span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {lang === 'hi'
                ? 'हर टेम्पलेट में आपका नाम, लोगो और साइन अपने-आप सेट है। सीधे HD PNG, JPG या PDF डाउनलोड करें या एडिट करें।'
                : 'Every template is pre-populated with your tournament logo, signature & details. Download in HD or customize.'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('template-library')}
            className="px-3.5 py-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-extrabold self-start sm:self-auto cursor-pointer"
          >
            {lang === 'hi'
              ? `सभी ${templates.length} टेम्पलेट्स खोलें →`
              : `View All ${templates.length} Templates →`}
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
          {categoryTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCat(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap cursor-pointer transition-all ${
                selectedCat === tab.id
                  ? 'bg-[#0B192C] dark:bg-amber-500 text-amber-400 dark:text-slate-950 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {lang === 'hi' ? tab.labelHi : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Ready-Made Templates Grid with REAL Miniature Canvas Render */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {displayedTemplates.map((tpl) => {
            const pdfKey = `${tpl.id}-pdf`;
            const pngKey = `${tpl.id}-png`;
            const jpgKey = `${tpl.id}-jpg`;

            return (
              <div
                key={tpl.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between hover:border-amber-500 transition-all shadow-sm"
              >
                {/* Live Scaled Visual Preview of the Template */}
                <div
                  onClick={() => onOpenTemplateInEditor(tpl)}
                  className="cursor-pointer relative group border-b border-slate-200 dark:border-slate-800"
                >
                  <DesignMiniPreview doc={tpl} maxHeight={220} />
                  <div className="absolute top-2.5 right-2.5 bg-slate-950/85 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-amber-400/30">
                    {tpl.width}×{tpl.height} HD
                  </div>
                </div>

                {/* Card Footer: Title + Edit + Instant HD PDF / PNG / JPG Buttons */}
                <div className="p-3.5 sm:p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                      {lang === 'hi' ? tpl.nameHi || tpl.name : tpl.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {tpl.description}
                    </p>
                  </div>

                  {/* Primary Customize Button */}
                  <button
                    onClick={() => onOpenTemplateInEditor(tpl)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#0B192C] dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Palette className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {lang === 'hi'
                        ? 'डिज़ाइन व टेक्स्ट एडिट करें (Customize)'
                        : 'Customize in Studio Editor'}
                    </span>
                  </button>

                  {/* 1-Click Direct HD Download Strip (PDF / PNG / JPG) */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleQuickExport(tpl, 'pdf')}
                      disabled={busyActionId === pdfKey}
                      className={`py-2 px-2 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all ${
                        doneActionId === pdfKey
                          ? 'bg-emerald-600 text-white'
                          : 'bg-red-600 hover:bg-red-500 text-white'
                      }`}
                    >
                      {busyActionId === pdfKey ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : doneActionId === pdfKey ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                      <span>{doneActionId === pdfKey ? 'Done!' : 'HD PDF'}</span>
                    </button>

                    <button
                      onClick={() => handleQuickExport(tpl, 'png')}
                      disabled={busyActionId === pngKey}
                      className={`py-2 px-2 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all ${
                        doneActionId === pngKey
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-700 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {busyActionId === pngKey ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : doneActionId === pngKey ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>{doneActionId === pngKey ? 'Done!' : 'HD PNG'}</span>
                    </button>

                    <button
                      onClick={() => handleQuickExport(tpl, 'jpg')}
                      disabled={busyActionId === jpgKey}
                      className={`py-2 px-2 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all ${
                        doneActionId === jpgKey
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                      }`}
                    >
                      {busyActionId === jpgKey ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : doneActionId === jpgKey ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5" />
                      )}
                      <span>{doneActionId === jpgKey ? 'Done!' : 'HD JPG'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: ALL 12 DESIGN & MANAGEMENT STUDIO MAKERS */}
      <section className="space-y-3.5">
        <div>
          <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white">
            {lang === 'hi'
              ? 'संपूर्ण क्रिकेट टूर्नामेंट डिज़ाइन एवं मैनेजमेंट टूल्स'
              : 'All Cricket Tournament Design & Management Workspaces'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'hi'
              ? 'नीचे किसी भी टूल पर टैप करके अपना कार्ड, पोस्टर, खिलाड़ी सूची या स्कोरकार्ड बनाएं।'
              : 'Tap any workspace below to create and manage tournament documents.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {studioTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.section}
                onClick={() => onNavigate(tool.section)}
                className="text-left bg-white dark:bg-slate-900 hover:border-amber-500 dark:hover:border-amber-500 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all flex items-start gap-3.5 cursor-pointer shadow-2xs active:bg-amber-50/40"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tool.accentClass}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white break-words">
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

      {/* SECTION 3: UPLOADED ORIGINAL REFERENCE BANNER — RESPONSIVE WITHOUT OVERFLOW */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {lang === 'hi'
                ? 'आपके मूल जाले क्रिकेट कप (Season-2) रेफरेंस डिज़ाइन'
                : 'Your Uploaded Jale Cricket Cup Reference Collage'}
            </h3>
            <p className="text-xs text-slate-500 break-words">
              {lang === 'hi'
                ? 'आमंत्रण कार्ड · 15-खिलाड़ी सूची व शपथ पत्र · मुख्य पोस्टर · प्रधानाचार्य अनुमति पत्र · थाना सूचना पत्र · मैन ऑफ द सीरीज वाउचर'
                : 'Invitation · 15-Player List & Undertaking · Tournament Poster · Principal Letter · Police SHO Letter · Prize Voucher'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('saved-designs')}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-extrabold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-1.5"
            >
              <FolderHeart className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {lang === 'hi'
                  ? `मेरे सेव डिज़ाइन (${savedDesigns.length})`
                  : `Saved Designs (${savedDesigns.length})`}
              </span>
            </button>
            <button
              onClick={() => onNavigate('backup-restore')}
              className="px-3 py-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-extrabold cursor-pointer"
            >
              {lang === 'hi' ? 'बैकअप व रीस्टोर' : 'Backup & Restore'}
            </button>
          </div>
        </div>
        <div className="w-full rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950">
          <img
            src="/assets/aistudio/IMG_20261111_234956_d4e6eb07.jpg"
            alt="Jale Cricket Cup Reference Collage"
            referrerPolicy="no-referrer"
            className="w-full max-w-full h-auto object-contain block"
          />
        </div>
      </section>
    </div>
  );
};
