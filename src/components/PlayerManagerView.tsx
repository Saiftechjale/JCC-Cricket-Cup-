import React, { useMemo, useState } from 'react';
import {
  Check,
  Edit3,
  FileText,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  Palette,
  Save,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  DesignDocument,
  Language,
  PlayerRecord,
  TeamSquadRecord,
  TournamentProfile,
} from '../types/studio';
import {
  exportDesignDocument,
  shareDesignDocument,
} from '../utils/exportEngine';
import { DesignMiniPreview } from './DesignMiniPreview';

interface PlayerManagerViewProps {
  lang: Language;
  teams: TeamSquadRecord[];
  players?: PlayerRecord[];
  activeProfile: TournamentProfile;
  templates: DesignDocument[];
  onSaveTeams: (teams: TeamSquadRecord[]) => void;
  onSavePlayers?: (players: PlayerRecord[]) => void;
  onOpenInEditor: (doc: DesignDocument) => void;
}

type SquadTemplateStyleId =
  | 'tpl-fb-team-royal'
  | 'tpl-fb-team-neon'
  | 'tpl-fb-team-red'
  | 'tpl-doc-player-list-jale';

const SQUAD_TEMPLATE_STYLES: {
  id: SquadTemplateStyleId;
  titleHi: string;
  titleEn: string;
  badgeHi: string;
  colorClass: string;
}[] = [
  {
    id: 'tpl-fb-team-royal',
    titleHi: '1. फेसबुक टीम पोस्ट (रॉयल ब्लू & गोल्ड)',
    titleEn: '1. Facebook Squad Post (Royal Blue & Gold)',
    badgeHi: 'Daily Facebook Post',
    colorClass: 'from-blue-900 to-slate-900 border-amber-400 text-amber-300',
  },
  {
    id: 'tpl-fb-team-neon',
    titleHi: '2. फेसबुक टीम पोस्ट (स्टेडियम ग्रीन)',
    titleEn: '2. Facebook Squad Post (Stadium Green)',
    badgeHi: 'Daily Facebook Post',
    colorClass: 'from-emerald-900 to-teal-950 border-emerald-400 text-emerald-200',
  },
  {
    id: 'tpl-fb-team-red',
    titleHi: '3. फेसबुक टीम पोस्ट (रेड & ब्लैक एक्शन)',
    titleEn: '3. Facebook Squad Post (Red & Black)',
    badgeHi: 'Daily Facebook Post',
    colorClass: 'from-red-900 to-slate-950 border-red-400 text-amber-300',
  },
  {
    id: 'tpl-doc-player-list-jale',
    titleHi: '4. ऑफिशियल 15-खिलाड़ी शपथ पत्र (A4 प्रिंट फॉर्म)',
    titleEn: '4. Official 15-Player Undertaking Form (A4)',
    badgeHi: 'Official A4 Print',
    colorClass: 'from-slate-800 to-slate-900 border-slate-400 text-white',
  },
];

export const PlayerManagerView: React.FC<PlayerManagerViewProps> = ({
  lang,
  teams,
  activeProfile,
  templates,
  onSaveTeams,
  onOpenInEditor,
}) => {
  const [selectedTeamIdx, setSelectedTeamIdx] = useState<number>(0);
  const [selectedStyleId, setSelectedStyleId] = useState<SquadTemplateStyleId>(
    'tpl-fb-team-royal'
  );
  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [busyExport, setBusyExport] = useState<'pdf' | 'jpg' | null>(null);
  const [doneExport, setDoneExport] = useState<'pdf' | 'jpg' | null>(null);

  const currentTeam: TeamSquadRecord = teams[selectedTeamIdx] || teams[0];

  // Ensure exactly 15 slots are always shown
  const fifteenPlayers = useMemo(() => {
    const arr = [...(currentTeam?.players || [])];
    while (arr.length < 15) {
      arr.push('');
    }
    return arr.slice(0, 15);
  }, [currentTeam]);

  const handleUpdateTeamField = (
    field: keyof Pick<
      TeamSquadRecord,
      'teamName' | 'village' | 'captainName' | 'mobileNumber'
    >,
    value: string
  ) => {
    const next = teams.map((t, idx) =>
      idx === selectedTeamIdx
        ? { ...t, [field]: value, updatedAt: new Date().toISOString().slice(0, 10) }
        : t
    );
    onSaveTeams(next);
  };

  const handleUpdatePlayerName = (playerIndex: number, name: string) => {
    const updatedPlayers = [...fifteenPlayers];
    updatedPlayers[playerIndex] = name;
    const next = teams.map((t, idx) =>
      idx === selectedTeamIdx
        ? {
            ...t,
            players: updatedPlayers,
            updatedAt: new Date().toISOString().slice(0, 10),
          }
        : t
    );
    onSaveTeams(next);
  };

  const handleManualSaveConfirm = () => {
    onSaveTeams([...teams]);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  // Dynamically build the selected template with this team's 15 players
  const liveTeamDesignDoc: DesignDocument = useMemo(() => {
    const baseTpl =
      templates.find((t) => t.id === selectedStyleId) ||
      templates.find((t) => t.category === 'player-list') ||
      templates[0];

    const tableRows: string[][] = fifteenPlayers.map((pName, idx) => [
      idx < 11 ? `${idx + 1} (Playing XI)` : `${idx + 1} (Extra)`,
      pName || `खिलाड़ी ${idx + 1}`,
    ]);

    const cleanUndertakingRows: string[][] = fifteenPlayers.map((pName, idx) => [
      idx < 11 ? String(idx + 1) : `${idx + 1} (Extra)`,
      pName || '',
    ]);

    return {
      ...baseTpl,
      id: `${baseTpl.id}-team-${currentTeam.teamNumber}`,
      name: `${currentTeam.teamName} — 15 Player List`,
      nameHi: `${currentTeam.teamName} — 15 खिलाड़ियों की सूची`,
      elements: baseTpl.elements.map((el) => {
        if (el.id === 'fbt-team-banner') {
          return {
            ...el,
            text: `टीम #${currentTeam.teamNumber}: ${currentTeam.teamName}`,
          };
        }
        if (el.id === 'fbt-table') {
          return {
            ...el,
            tableHeaders: [
              'क्रम सं० (1-15)',
              'खिलाड़ी का नाम (11 Playing XI + 4 Extra)',
            ],
            tableRows,
          };
        }
        if (el.id === 'plf-table') {
          return {
            ...el,
            tableHeaders: [
              'क्रम सं० (1-15)',
              'खिलाड़ी का नाम (Player Name — 11 Playing + 4 Extra)',
            ],
            tableRows: cleanUndertakingRows,
          };
        }
        if (el.id === 'plf-left-team-details') {
          return {
            ...el,
            text: `• टीम का नाम: ${currentTeam.teamName}\n• गाँव/शहर: ${currentTeam.village || 'जाले, दरभंगा'}\n• कप्तान का नाम: ${fifteenPlayers[0] || currentTeam.captainName || '................................'}\n• मोबाईल नंबर: ${currentTeam.mobileNumber || activeProfile.contactNumber}\n\nएंट्री फीस (₹): ${activeProfile.entryFee}  स्थिति: [✓] जमा / बाकी\n(नोट: एंट्री फीस में कोई रियायत नहीं, मैच से पहले पूरा भुगतान अनिवार्य)\n\n| विशेष नोट: खेल के दौरान यदि किसी खिलाड़ी को बॉल या बल्ले से चोट लगती है, या खेल भावना के तहत कोई अन्य अनहोनी/दुर्घटना होती है, तो इसके लिए टूर्नामेंट कमिटी या आयोजक मंडल जिम्मेदार नहीं होंगे।`,
          };
        }
        return el;
      }),
    };
  }, [
    templates,
    selectedStyleId,
    fifteenPlayers,
    currentTeam,
    activeProfile,
  ]);

  const handleDownload = async (format: 'pdf' | 'jpg') => {
    setBusyExport(format);
    try {
      await exportDesignDocument(liveTeamDesignDoc, {
        format,
        preset:
          format === 'pdf' && selectedStyleId === 'tpl-doc-player-list-jale'
            ? 'A4-Portrait'
            : 'original',
        scale: 3,
        filename: `Team_${currentTeam.teamNumber}_${currentTeam.teamName.slice(0, 18)}_15_Players`,
      });
      setDoneExport(format);
      setTimeout(() => setDoneExport(null), 2200);
    } finally {
      setBusyExport(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 overflow-x-hidden">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0B192C] via-[#1E3A8A] to-[#0B192C] text-white p-4 sm:p-6 border border-amber-400/30 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase tracking-wider">
            <Users className="w-4 h-4 shrink-0" />
            <span>
              {lang === 'hi'
                ? '8 टीमें · 11 प्लेइंग + 4 एक्स्ट्रा (15 खिलाड़ी) · डेली फेसबुक पोस्ट'
                : '8 Teams · 11 Playing + 4 Extra (15 Squad) · Daily Facebook Post'}
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black">
            {lang === 'hi'
              ? '8 टीमों की खिलाड़ी सूची एवं डेली फेसबुक पोस्ट मेकर'
              : '8-Team Player List & Daily Facebook Squad Poster Maker'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            {lang === 'hi'
              ? 'किसी भी टीम (1 से 8) को चुनें, सिर्फ 15 खिलाड़ियों के नाम लिखें और नीचे अलग-अलग डिज़ाइन टेम्पलेट चुनकर सीधे HD JPG (Facebook Post) या HD PDF डाउनलोड करें।'
              : 'Select any of the 8 teams, enter the 15 player names, switch ready-made templates in 1 click, and download HD JPG or PDF.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => handleDownload('jpg')}
            disabled={busyExport !== null}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
          >
            {busyExport === 'jpg' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : doneExport === 'jpg' ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
            <span>
              {doneExport === 'jpg'
                ? '✓ JPG तैयार!'
                : lang === 'hi'
                ? 'फेसबुक पोस्ट (HD JPG)'
                : 'Facebook Post (HD JPG)'}
            </span>
          </button>

          <button
            onClick={() => handleDownload('pdf')}
            disabled={busyExport !== null}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs cursor-pointer shadow-md"
          >
            {busyExport === 'pdf' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : doneExport === 'pdf' ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>
              {doneExport === 'pdf'
                ? '✓ PDF तैयार!'
                : lang === 'hi'
                ? 'प्रिंट फॉर्म (HD PDF)'
                : 'Print Form (HD PDF)'}
            </span>
          </button>
        </div>
      </div>

      {/* 8-TEAM SELECTOR TABS (टीम 1 से टीम 8) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
            {lang === 'hi'
              ? 'टूर्नामेंट की 8 टीमें (किसी भी टीम पर क्लिक करके नाम व 15 खिलाड़ी एडिट करें):'
              : 'Select Tournament Team (1 to 8):'}
          </span>
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
            {lang === 'hi' ? 'कुल 8 टीमें (Editable)' : '8 Teams Editable'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {teams.map((t, idx) => {
            const active = idx === selectedTeamIdx;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTeamIdx(idx)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? 'bg-[#0B192C] dark:bg-amber-500 text-amber-400 dark:text-slate-950 border-amber-500 ring-2 ring-amber-400/40 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                }`}
              >
                <div className="text-[10px] font-black uppercase opacity-80">
                  {lang === 'hi' ? `टीम #${t.teamNumber}` : `TEAM #${t.teamNumber}`}
                </div>
                <div className="text-xs font-extrabold truncate mt-0.5">
                  {t.teamName}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN 2-COLUMN WORKSPACE: LEFT = SIMPLE 15 PLAYER NAMES | RIGHT = TEMPLATE SWITCHER & LIVE PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (7 cols): Editable Team Name + Simple 15 Player Names */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4 shadow-xs">
          {/* Editable Team Name Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi'
                  ? `टीम #${currentTeam.teamNumber} का नाम (Editable Team Name):`
                  : `Team #${currentTeam.teamNumber} Name:`}
              </label>
              <input
                type="text"
                value={currentTeam.teamName}
                onChange={(e) => handleUpdateTeamField('teamName', e.target.value)}
                placeholder="टीम का नाम लिखें..."
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-400 dark:border-amber-500/70 bg-amber-50/40 dark:bg-slate-800 text-sm sm:text-base font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                {lang === 'hi' ? 'गाँव / शहर (Optional):' : 'Village / City:'}
              </label>
              <input
                type="text"
                value={currentTeam.village}
                onChange={(e) => handleUpdateTeamField('village', e.target.value)}
                placeholder="जाले, दरभंगा"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* 15 Player Names Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {lang === 'hi'
                  ? 'खिलाड़ी का नाम (1 से 15 तक — 11 Playing + 4 Extra)'
                  : 'Player Names (1 to 15 — 11 Playing + 4 Extra)'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === 'hi'
                  ? 'सिर्फ खिलाड़ी का नाम लिखें — यह अपने आप सभी टेम्पलेट और फेसबुक पोस्ट में सेट हो जाएगा।'
                  : 'Simply type the player names below — automatically syncs into all templates.'}
              </p>
            </div>

            <button
              onClick={handleManualSaveConfirm}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                savedNotice
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                  : 'bg-[#0B192C] dark:bg-amber-500 text-amber-400 dark:text-slate-950 hover:opacity-95'
              }`}
            >
              {savedNotice ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {lang === 'hi' ? '✓ सेव हो गया!' : '✓ Roster Saved!'}
                  </span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>
                    {lang === 'hi' ? 'सूची सेव करें (Save)' : 'Save List'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* 1 to 11: Main Playing XI */}
          <div className="space-y-2">
            <div className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
              {lang === 'hi'
                ? '🏏 मुख्य 11 खिलाड़ी (Playing XI — 1 से 11):'
                : '🏏 Main Playing XI (Players 1 to 11):'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {fifteenPlayers.slice(0, 11).map((pName, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/70 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <span className="w-7 h-7 rounded-lg bg-[#0B192C] text-amber-400 font-mono font-black text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={pName}
                    onChange={(e) => handleUpdatePlayerName(idx, e.target.value)}
                    placeholder={
                      idx === 0
                        ? 'खिलाड़ी 1 (कप्तान का नाम)...'
                        : `खिलाड़ी ${idx + 1} का नाम...`
                    }
                    className="w-full px-2 py-1 bg-transparent text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 12 to 15: 4 Extra Players */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-extrabold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/60">
              {lang === 'hi'
                ? '➕ अतिरिक्त खिलाड़ी (4 Extra Players — 12 से 15):'
                : '➕ Extra / Reserve Players (12 to 15):'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {fifteenPlayers.slice(11, 15).map((pName, idx) => {
                const actualIdx = idx + 11;
                return (
                  <div
                    key={actualIdx}
                    className="flex items-center gap-2 bg-amber-50/40 dark:bg-slate-800/50 p-1.5 rounded-xl border border-amber-300/70 dark:border-slate-700"
                  >
                    <span className="px-2 h-7 rounded-lg bg-amber-500 text-slate-950 font-mono font-black text-xs flex items-center justify-center shrink-0">
                      {actualIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={pName}
                      onChange={(e) =>
                        handleUpdatePlayerName(actualIdx, e.target.value)
                      }
                      placeholder={`अतिरिक्त खिलाड़ी ${actualIdx + 1} का नाम...`}
                      className="w-full px-2 py-1 bg-transparent text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): 1-Click Template Switcher & Live Design Preview */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4 shadow-xs sticky top-16">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-600 dark:text-amber-400">
              <LayoutTemplate className="w-4 h-4" />
              <span>
                {lang === 'hi'
                  ? 'टेम्पलेट डिज़ाइन बदलें (1-Click Design Switcher)'
                  : 'Switch Template Design (1-Click)'}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              {lang === 'hi'
                ? 'अलग-अलग टेम्पलेट चुनें (पूरा डिज़ाइन अपने आप बदलेगा):'
                : 'Choose Template Style (Changes Entire Design):'}
            </h3>
          </div>

          {/* 4 Template Style Buttons */}
          <div className="grid grid-cols-1 gap-2">
            {SQUAD_TEMPLATE_STYLES.map((st) => {
              const active = selectedStyleId === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedStyleId(st.id)}
                  className={`w-full p-2.5 rounded-xl border-2 text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    active
                      ? 'bg-[#0B192C] text-amber-400 border-amber-500 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold truncate">
                      {lang === 'hi' ? st.titleHi : st.titleEn}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                      active
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {st.badgeHi}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Live Miniature Canvas Preview */}
          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex flex-col items-center space-y-2">
            <DesignMiniPreview doc={liveTeamDesignDoc} maxHeight={290} />
            <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {currentTeam.teamName} — Live Preview
              </span>
            </span>
          </div>

          {/* Action Buttons: Open in Editor | HD PDF | HD JPG (No PNG!) */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDownload('jpg')}
                disabled={busyExport !== null}
                className="py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                {busyExport === 'jpg' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : doneExport === 'jpg' ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
                <span>
                  {doneExport === 'jpg'
                    ? '✓ HD JPG Ready'
                    : lang === 'hi'
                    ? 'HD JPG डाउनलोड'
                    : 'Download HD JPG'}
                </span>
              </button>

              <button
                onClick={() => handleDownload('pdf')}
                disabled={busyExport !== null}
                className="py-3 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                {busyExport === 'pdf' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : doneExport === 'pdf' ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>
                  {doneExport === 'pdf'
                    ? '✓ HD PDF Ready'
                    : lang === 'hi'
                    ? 'HD PDF डाउनलोड'
                    : 'Download HD PDF'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onOpenInEditor(liveTeamDesignDoc)}
                className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Palette className="w-4 h-4" />
                <span>
                  {lang === 'hi'
                    ? 'फुल एडिटर में खोलें'
                    : 'Customize in Editor'}
                </span>
              </button>

              <button
                onClick={() => shareDesignDocument(liveTeamDesignDoc)}
                className="py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>
                  {lang === 'hi'
                    ? 'फेसबुक/व्हाट्सएप शेयर'
                    : 'Share Squad Post'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
