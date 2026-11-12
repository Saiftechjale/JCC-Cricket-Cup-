import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  ClipboardList,
  Copy,
  FileText,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Megaphone,
  Minimize2,
  Newspaper,
  Palette,
  Plus,
  Radio,
  Trash2,
  Trophy,
  Volume2,
} from 'lucide-react';
import {
  BatsmanScoreRow,
  BowlerScoreRow,
  DesignDocument,
  Language,
  LocalSponsorAd,
  MatchResultRecord,
  MatchScheduleRecord,
  ScorecardRecord,
  TeamSquadRecord,
  TournamentProfile,
} from '../types/studio';
import {
  exportDesignDocument,
  exportResultCardPDF,
  exportSchedulesPrintablePDF,
  exportScorecardPrintablePDF,
} from '../utils/exportEngine';
import { DesignMiniPreview } from './DesignMiniPreview';

interface MatchManagerViewProps {
  lang: Language;
  initialSubTab: 'schedule' | 'result' | 'scorecard' | 'live' | 'media-prachar';
  teams: TeamSquadRecord[];
  sponsors: LocalSponsorAd[];
  schedules: MatchScheduleRecord[];
  results: MatchResultRecord[];
  scorecards: ScorecardRecord[];
  activeProfile: TournamentProfile;
  templates: DesignDocument[];
  onSaveSchedules: (list: MatchScheduleRecord[]) => void;
  onSaveResults: (list: MatchResultRecord[]) => void;
  onSaveScorecards: (list: ScorecardRecord[]) => void;
  onSaveSponsors: (list: LocalSponsorAd[]) => void;
  onOpenInEditor: (doc: DesignDocument) => void;
}

export const MatchManagerView: React.FC<MatchManagerViewProps> = ({
  lang,
  initialSubTab,
  teams,
  sponsors,
  schedules,
  results,
  scorecards,
  activeProfile,
  templates,
  onSaveSchedules,
  onSaveResults,
  onSaveScorecards,
  onSaveSponsors,
  onOpenInEditor,
}) => {
  const [subTab, setSubTab] = useState<
    'schedule' | 'result' | 'scorecard' | 'live' | 'media-prachar'
  >(initialSubTab);

  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  // ==========================================================================
  // 1. 8-TEAM SCHEDULE STATE
  // ==========================================================================
  const [newSch, setNewSch] = useState<Omit<MatchScheduleRecord, 'id'>>({
    matchNumber: schedules.length + 1,
    stage: 'Quarter Final 1',
    teamA: teams[0]?.teamName || '1. जाले रॉयल इलेवन',
    teamB: teams[1]?.teamName || '2. दरभंगा टाइगर्स',
    matchDate: activeProfile.startingDate,
    matchTime: activeProfile.matchTime,
    venue: activeProfile.venue,
    status: 'Upcoming',
  });

  // ==========================================================================
  // 2. MATCH RESULT STATE
  // ==========================================================================
  const [newRes, setNewRes] = useState<Omit<MatchResultRecord, 'id'>>({
    matchNumber: results.length + 1,
    stage: 'क्वार्टर फाइनल मुकाबला',
    matchDate: activeProfile.startingDate,
    teamA: teams[0]?.teamName || 'जाले रॉयल इलेवन',
    teamAScore: '214',
    teamAWickets: '5',
    teamAOvers: '16.0',
    teamB: teams[1]?.teamName || 'दरभंगा टाइगर्स',
    teamBScore: '186',
    teamBWickets: '8',
    teamBOvers: '16.0',
    winner: teams[0]?.teamName || 'जाले रॉयल इलेवन',
    winMargin: '28 रनों से शानदार जीत',
    playerOfTheMatch: 'मिर्ज़ा सैफ बेग',
    playerOfTheMatchStats: '76* (32 गेंद) एवं 2 विकेट',
    venue: activeProfile.venue,
  });

  // ==========================================================================
  // 3. SCORECARD STATE
  // ==========================================================================
  const [activeScorecardId, setActiveScorecardId] = useState<string>(
    scorecards[0]?.id || ''
  );
  const currentSc =
    scorecards.find((s) => s.id === activeScorecardId) || scorecards[0];

  // ==========================================================================
  // 4. FACEBOOK LIVE SCORING & ADS STATE
  // ==========================================================================
  const [liveState, setLiveState] = useState({
    matchStage: 'LIVE • QUARTER FINAL #1',
    battingTeam: teams[0]?.teamName.replace(/^\d+\.\s*/, '') || 'जाले रॉयल इलेवन',
    bowlingTeam: teams[1]?.teamName.replace(/^\d+\.\s*/, '') || 'दरभंगा टाइगर्स',
    runs: 148,
    wickets: 3,
    overs: 11,
    balls: 4,
    target: '195 (16 Overs)',
    strikerName: 'मिर्ज़ा सैफ बेग*',
    strikerRuns: 64,
    strikerBalls: 26,
    nonStrikerName: 'मो० अरमान खान',
    nonStrikerRuns: 32,
    nonStrikerBalls: 18,
    bowlerName: 'राहुल कुमार सिंह',
    bowlerFigures: '2-28 (3.4 Ov)',
    statusLine: 'जाले रॉयल इलेवन को जीत के लिए 26 गेंदों में 47 रनों की जरूरत',
    selectedSponsorId: sponsors[0]?.id || '',
    fullscreenOverlay: false,
  });

  const activeSponsor =
    sponsors.find((s) => s.id === liveState.selectedSponsorId) || sponsors[0];

  const handleLiveBallScore = (addRuns: number, isWicket = false, isExtra = false) => {
    setLiveState((prev) => {
      let nextBalls = isExtra ? prev.balls : prev.balls + 1;
      let nextOvers = prev.overs;
      if (nextBalls >= 6) {
        nextOvers += 1;
        nextBalls = 0;
      }
      return {
        ...prev,
        runs: prev.runs + addRuns,
        wickets: isWicket ? Math.min(10, prev.wickets + 1) : prev.wickets,
        overs: nextOvers,
        balls: nextBalls,
        strikerRuns: isExtra ? prev.strikerRuns : prev.strikerRuns + addRuns,
        strikerBalls: isExtra ? prev.strikerBalls : prev.strikerBalls + 1,
      };
    });
  };

  // Build Dynamic Facebook Live Score + Sponsor Ad Document
  const liveScoreDoc: DesignDocument = useMemo(() => {
    const baseTpl =
      templates.find((t) => t.id === 'tpl-fb-live-score-ad') || templates[0];
    const oversText = `${liveState.overs}.${liveState.balls}`;
    const crr =
      liveState.overs + liveState.balls / 6 > 0
        ? (liveState.runs / (liveState.overs + liveState.balls / 6)).toFixed(2)
        : '0.00';

    return {
      ...baseTpl,
      id: 'live-fb-score-doc',
      name: `${liveState.battingTeam}_vs_${liveState.bowlingTeam}_Live_Score`,
      nameHi: `फेसबुक लाइव स्कोर — ${liveState.battingTeam} vs ${liveState.bowlingTeam}`,
      elements: baseTpl.elements.map((el) => {
        if (el.id === 'fbl-badge') {
          return { ...el, text: `🔴 FACEBOOK LIVE • ${liveState.matchStage}` };
        }
        if (el.id === 'fbl-score-main') {
          return {
            ...el,
            text: `${liveState.battingTeam}: ${liveState.runs}/${liveState.wickets} (${oversText} OV)  |  VS ${liveState.bowlingTeam}\n🎯 TARGET: ${liveState.target}  •  CRR: ${crr}`,
          };
        }
        if (el.id === 'fbl-batsmen') {
          return {
            ...el,
            text: `🏏 ${liveState.strikerName}: ${liveState.strikerRuns} (${liveState.strikerBalls})   |   🏏 ${liveState.nonStrikerName}: ${liveState.nonStrikerRuns} (${liveState.nonStrikerBalls})   |   ⚾ ${liveState.bowlerName}: ${liveState.bowlerFigures}`,
          };
        }
        if (el.id === 'fbl-ad-banner' && activeSponsor) {
          return {
            ...el,
            text: `📢 प्रायोजक (SPONSOR): ${activeSponsor.shopName} (${activeSponsor.address}) — ${activeSponsor.tagline} | प्रो०: ${activeSponsor.ownerName} 📞 ${activeSponsor.mobile}`,
          };
        }
        return el;
      }),
    };
  }, [templates, liveState, activeSponsor]);

  // ==========================================================================
  // 5. NEWSPAPER REPORT (OPENING / FINAL) & LOCAL MARKET MIC PRACHAR STATE
  // ==========================================================================
  const [newsType, setNewsType] = useState<'opening' | 'final'>('opening');
  const [newsData, setNewsData] = useState({
    openingHeadline: `${activeProfile.tournamentName} (${activeProfile.seasonNumber}) का भव्य शुभारंभ — उद्घाटन मुकाबले में रोमांचक भिड़ंत`,
    finalHeadline: `${activeProfile.tournamentName} का भव्य फाइनल संपन्न — विजेता टीम को ₹${activeProfile.winnerPrize} व विशाल कप से किया गया सम्मानित`,
    dateline: `जाले (दरभंगा) | खेल संवाददाता | दिनांक: ${activeProfile.startingDate}`,
    openingBody: `जाले प्रखंड के ऐतिहासिक ${activeProfile.venue} में "${activeProfile.tournamentName} (${activeProfile.seasonNumber})" का भव्य उद्घाटन मुख्य अतिथि ${activeProfile.chiefGuest} एवं विशिष्ट अतिथि ${activeProfile.specialGuest} द्वारा फीता काटकर एवं खिलाड़ियों से परिचय प्राप्त कर किया गया।\n\nउद्घाटन समारोह की अध्यक्षता आयोजन समिति अध्यक्ष ${activeProfile.presidentName} ने की। इस 8-टीमों के प्रतिष्ठित टूर्नामेंट का सीधा प्रसारण (Live Telecast) फेसबुक चैनल पर स्कोरिंग व स्थानीय बाजार के विज्ञापनों के साथ किया जा रहा है। मैदान में हजारों खेल प्रेमियों की उपस्थिति ने खिलाड़ियों का उत्साह दोगुना कर दिया।`,
    finalBody: `${activeProfile.venue} में खेले गए "${activeProfile.tournamentName} (${activeProfile.seasonNumber})" के ऐतिहासिक ग्रैंड फाइनल मुकाबले में हजारों दर्शकों की उपस्थिति के बीच विजेता टीम ने शानदार प्रदर्शन करते हुए खिताब अपने नाम किया।\n\nमुख्य अतिथि ${activeProfile.chiefGuest} एवं अध्यक्ष ${activeProfile.presidentName} ने विजेता टीम को ₹${activeProfile.winnerPrize} नकद व विशाल ट्रॉफी तथा उप-विजेता टीम को ₹${activeProfile.runnerUpPrize} व कप प्रदान कर सम्मानित किया। मैन ऑफ द सीरीज को "${activeProfile.manOfTheSeriesPrize}" प्रदान किया गया।`,
  });

  const [newSponsor, setNewSponsor] = useState<Omit<LocalSponsorAd, 'id'>>({
    shopName: '',
    ownerName: '',
    category: 'Local Market Shop',
    address: 'मेन मार्केट, जाले (दरभंगा)',
    mobile: activeProfile.contactNumber,
    tagline: 'सभी ग्राहकों के लिए विशेष छूट उपलब्ध!',
    micScript: '',
  });

  const newspaperDoc: DesignDocument = useMemo(() => {
    const tplId =
      newsType === 'opening' ? 'tpl-news-opening-match' : 'tpl-news-final-match';
    const baseTpl = templates.find((t) => t.id === tplId) || templates[0];
    return {
      ...baseTpl,
      elements: baseTpl.elements.map((el) => {
        if (el.id === 'news-headline' || el.id === 'newsf-headline') {
          return {
            ...el,
            text:
              newsType === 'opening'
                ? newsData.openingHeadline
                : newsData.finalHeadline,
          };
        }
        if (el.id === 'news-sub') {
          return { ...el, text: newsData.dateline };
        }
        if (el.id === 'news-body' || el.id === 'newsf-body') {
          return {
            ...el,
            text:
              newsType === 'opening' ? newsData.openingBody : newsData.finalBody,
          };
        }
        return el;
      }),
    };
  }, [templates, newsType, newsData]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const item: MatchScheduleRecord = {
      ...newSch,
      id: `sch-${Date.now()}`,
    };
    const next = [...schedules, item];
    onSaveSchedules(next);
    setNewSch({ ...newSch, matchNumber: next.length + 1 });
    showToast(lang === 'hi' ? '✓ नया मैच शेड्यूल जुड़ गया!' : '✓ Match added!');
  };

  const handleUpdateScheduleItem = (
    id: string,
    patch: Partial<MatchScheduleRecord>
  ) => {
    const next = schedules.map((s) => (s.id === id ? { ...s, ...patch } : s));
    onSaveSchedules(next);
  };

  const buildScheduleCanvasDoc = (): DesignDocument => {
    const tpl =
      templates.find((t) => t.id === 'tpl-doc-match-schedule') || templates[0];
    const rows = schedules.map((s) => [
      `मैच #${s.matchNumber}`,
      s.stage,
      s.teamA.replace(/^\d+\.\s*/, ''),
      s.teamB.replace(/^\d+\.\s*/, ''),
      `${s.matchDate} (${s.matchTime})`,
    ]);
    return {
      ...tpl,
      id: 'tpl-doc-match-schedule',
      elements: tpl.elements.map((el) =>
        el.type === 'table' ? { ...el, tableRows: rows } : el
      ),
    };
  };

  const handleExportScheduleDoc = async (format: 'pdf' | 'jpg') => {
    setBusyKey(`sch-${format}`);
    try {
      if (format === 'pdf') {
        await exportSchedulesPrintablePDF(schedules, activeProfile);
      } else {
        const doc = buildScheduleCanvasDoc();
        await exportDesignDocument(doc, {
          format: 'jpg',
          preset: 'original',
          scale: 3,
          filename: `${activeProfile.tournamentNameEn}_8_Team_Schedule`,
        });
      }
    } finally {
      setBusyKey(null);
    }
  };

  const handleAddResult = (e: React.FormEvent) => {
    e.preventDefault();
    const item: MatchResultRecord = {
      ...newRes,
      id: `res-${Date.now()}`,
    };
    const next = [item, ...results];
    onSaveResults(next);
    setNewRes({ ...newRes, matchNumber: next.length + 1 });
    showToast(lang === 'hi' ? '✓ मैच रिजल्ट सेव हो गया!' : '✓ Result saved!');
  };

  const handleExportResultDoc = async (
    res: MatchResultRecord,
    format: 'pdf' | 'jpg'
  ) => {
    const key = `${res.id}-${format}`;
    setBusyKey(key);
    try {
      if (format === 'pdf') {
        await exportResultCardPDF(res, activeProfile);
      } else {
        const baseTpl =
          templates.find((t) => t.id === 'tpl-poster-match-result') ||
          templates[0];
        const customDoc: DesignDocument = {
          ...baseTpl,
          name: `Match_${res.matchNumber}_Result_${res.teamA}_vs_${res.teamB}`,
          elements: baseTpl.elements.map((el) => {
            if (el.id === 'res-badge') {
              return { ...el, text: `MATCH #${res.matchNumber} • ${res.stage}` };
            }
            if (el.id === 'res-score-a') {
              return {
                ...el,
                text: `${res.teamA}\n${res.teamAScore}/${res.teamAWickets} (${res.teamAOvers} OV)`,
              };
            }
            if (el.id === 'res-score-b') {
              return {
                ...el,
                text: `${res.teamB}\n${res.teamBScore}/${res.teamBWickets} (${res.teamBOvers} OV)`,
              };
            }
            if (el.id === 'res-winner-banner') {
              return {
                ...el,
                text: `🏆 ${res.winner} — ${res.winMargin}`,
              };
            }
            if (el.id === 'res-mom') {
              return {
                ...el,
                text: `★ MAN OF THE MATCH: ${res.playerOfTheMatch} (${res.playerOfTheMatchStats})`,
              };
            }
            return el;
          }),
        };
        await exportDesignDocument(customDoc, {
          format: 'jpg',
          preset: 'original',
          scale: 3,
          filename: customDoc.name,
        });
      }
    } finally {
      setBusyKey(null);
    }
  };

  const handleUpdateScorecard = (updated: ScorecardRecord) => {
    const next = scorecards.map((s) => (s.id === updated.id ? updated : s));
    onSaveScorecards(next);
  };

  const handleCreateNewScorecard = () => {
    const created: ScorecardRecord = {
      id: `sc-${Date.now()}`,
      matchNumber: scorecards.length + 1,
      matchTitle: `${activeProfile.tournamentName} — मैच नं० ${scorecards.length + 1}`,
      matchDate: activeProfile.startingDate,
      venue: activeProfile.venue,
      battingTeam: teams[0]?.teamName || 'जाले रॉयल इलेवन',
      bowlingTeam: teams[1]?.teamName || 'दरभंगा टाइगर्स',
      batsmen: [
        {
          id: `b-${Date.now()}-1`,
          name: 'मिर्ज़ा सैफ बेग',
          dismissal: 'नाबाद',
          runs: 68,
          balls: 28,
          fours: 6,
          sixes: 5,
        },
        {
          id: `b-${Date.now()}-2`,
          name: 'मो० अरमान खान',
          dismissal: 'कैच',
          runs: 42,
          balls: 21,
          fours: 4,
          sixes: 3,
        },
      ],
      bowlers: [
        {
          id: `bw-${Date.now()}-1`,
          name: 'राहुल कुमार सिंह',
          overs: '4.0',
          maidens: 0,
          runsConceded: 34,
          wickets: 2,
        },
      ],
      extras: 8,
      totalWickets: 4,
      totalOvers: '16.0',
      resultNote: 'जाले रॉयल इलेवन विजयी रही।',
      manOfTheMatch: 'मिर्ज़ा सैफ बेग',
    };
    const next = [created, ...scorecards];
    onSaveScorecards(next);
    setActiveScorecardId(created.id);
  };

  const handleAddSponsor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSponsor.shopName.trim()) return;
    const autoScript =
      newSponsor.micScript.trim() ||
      `🎤 "हेलो-हेलो! ध्यान दें... ${newSponsor.address} में स्थित '${newSponsor.shopName}' (प्रोप्राइटर: ${newSponsor.ownerName}) की ओर से जाले क्रिकेट कप के सभी दर्शकों व खिलाड़ियों का हार्दिक स्वागत है! ${newSponsor.tagline} संपर्क करें: ${newSponsor.mobile}"`;

    const created: LocalSponsorAd = {
      ...newSponsor,
      id: `sp-${Date.now()}`,
      micScript: autoScript,
    };
    onSaveSponsors([created, ...sponsors]);
    setNewSponsor({
      shopName: '',
      ownerName: '',
      category: 'Local Market Shop',
      address: 'मेन मार्केट, जाले (दरभंगा)',
      mobile: activeProfile.contactNumber,
      tagline: 'सभी ग्राहकों के लिए विशेष छूट उपलब्ध!',
      micScript: '',
    });
    showToast(
      lang === 'hi'
        ? '✓ लोकल मार्केट प्रचार व विज्ञापन जुड़ गया!'
        : '✓ Local sponsor & mic script added!'
    );
  };

  const handleSpeakHindi = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'hi-IN';
      utter.rate = 0.95;
      window.speechSynthesis.speak(utter);
      showToast('🔊 माइक अनाउंसमेंट ऑडियो चालू है...');
    } else {
      navigator.clipboard?.writeText(text);
      showToast('✓ माइक स्क्रिप्ट कॉपी हो गई!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6 overflow-x-hidden">
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-300 text-xs font-extrabold">
          <Check className="w-4 h-4 shrink-0 stroke-[3]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP NAVIGATION TABS FOR ALL 5 MATCH, FACEBOOK LIVE, NEWSPAPER & MIC PRACHAR WORKSPACES */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#1E3A8A] to-[#0B192C] text-white p-4 sm:p-5 rounded-2xl border border-amber-500/40 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
              8-TEAM TOURNAMENT • FACEBOOK LIVE • NEWSPAPER • MIC PRACHAR
            </span>
            <h2 className="text-lg sm:text-xl font-black">
              {lang === 'hi'
                ? '8-टीम मैच शेड्यूल, फेसबुक लाइव स्कोरिंग, अखबार खबर एवं माइक प्रचार स्टूडियो'
                : '8-Team Schedule, Facebook Live Score, Newspaper & Mic Prachar Studio'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            {
              id: 'schedule',
              icon: Calendar,
              labelHi: '1. 8-टीम शेड्यूल (8 Teams)',
              labelEn: '1. 8-Team Schedule',
            },
            {
              id: 'result',
              icon: Trophy,
              labelHi: '2. मैच रिजल्ट (FB Post)',
              labelEn: '2. Match Results',
            },
            {
              id: 'scorecard',
              icon: ClipboardList,
              labelHi: '3. फुल स्कोरकार्ड',
              labelEn: '3. Full Scorecard',
            },
            {
              id: 'live',
              icon: Radio,
              labelHi: '4. 🔴 फेसबुक लाइव स्कोर + Ads',
              labelEn: '4. 🔴 FB Live Score + Ads',
            },
            {
              id: 'media-prachar',
              icon: Newspaper,
              labelHi: '5. 📰 अखबार खबर & 📢 माइक प्रचार',
              labelEn: '5. 📰 Newspaper & 📢 Mic Prachar',
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as typeof subTab)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-900/80 text-slate-200 hover:bg-slate-800 border border-white/10'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{lang === 'hi' ? tab.labelHi : tab.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          TAB 1: 8-TEAM MATCH SCHEDULE (EDITABLE + ONLY PDF & JPG)
      ===================================================================== */}
      {subTab === 'schedule' && (
        <div className="space-y-5">
          <form
            onSubmit={handleAddSchedule}
            className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {lang === 'hi'
                    ? '8-टीम नॉकआउट / लीग मैच शेड्यूल (4 क्वार्टर + 2 सेमीफाइनल + 1 फाइनल)'
                    : '8-Team Tournament Match Schedule'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'hi'
                    ? 'नीचे किसी भी मैच के नाम, तारीख या समय को सीधे बदलें और HD PDF या HD JPG डाउनलोड करें।'
                    : 'Edit any match fixture below and download in HD PDF or HD JPG.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenInEditor(buildScheduleCanvasDoc())}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B192C] dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-black cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'hi' ? 'एडिटर में डिज़ाइन बदलें' : 'Customize in Editor'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportScheduleDoc('pdf')}
                  disabled={busyKey !== null}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black cursor-pointer"
                >
                  {busyKey === 'sch-pdf' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span>HD PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportScheduleDoc('jpg')}
                  disabled={busyKey !== null}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black cursor-pointer"
                >
                  {busyKey === 'sch-jpg' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5" />
                  )}
                  <span>HD JPG</span>
                </button>
              </div>
            </div>

            {/* Add New Match Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {lang === 'hi' ? 'मैच नं०' : 'Match #'}
                </label>
                <input
                  type="number"
                  value={newSch.matchNumber}
                  onChange={(e) =>
                    setNewSch({ ...newSch, matchNumber: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {lang === 'hi' ? 'राउंड / चरण' : 'Stage'}
                </label>
                <select
                  value={newSch.stage}
                  onChange={(e) =>
                    setNewSch({
                      ...newSch,
                      stage: e.target.value as MatchScheduleRecord['stage'],
                    })
                  }
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="Quarter Final 1">Quarter Final 1 (क्वार्टर 1)</option>
                  <option value="Quarter Final 2">Quarter Final 2 (क्वार्टर 2)</option>
                  <option value="Quarter Final 3">Quarter Final 3 (क्वार्टर 3)</option>
                  <option value="Quarter Final 4">Quarter Final 4 (क्वार्टर 4)</option>
                  <option value="Semi Final 1">Semi Final 1 (सेमीफाइनल 1)</option>
                  <option value="Semi Final 2">Semi Final 2 (सेमीफाइनल 2)</option>
                  <option value="Grand Final">Grand Final (ग्रैंड फाइनल)</option>
                  <option value="League Match">League Match (लीग मैच)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {lang === 'hi' ? 'टीम A चुनें या लिखें' : 'Team A'}
                </label>
                <input
                  type="text"
                  list="eight-teams-list"
                  value={newSch.teamA}
                  onChange={(e) => setNewSch({ ...newSch, teamA: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {lang === 'hi' ? 'टीम B चुनें या लिखें' : 'Team B'}
                </label>
                <input
                  type="text"
                  list="eight-teams-list"
                  value={newSch.teamB}
                  onChange={(e) => setNewSch({ ...newSch, teamB: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {lang === 'hi' ? 'दिनांक (Date)' : 'Date'}
                </label>
                <input
                  type="text"
                  value={newSch.matchDate}
                  onChange={(e) =>
                    setNewSch({ ...newSch, matchDate: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'मैच जोड़ें' : 'Add Match'}</span>
                </button>
              </div>
            </div>

            <datalist id="eight-teams-list">
              {teams.map((t) => (
                <option key={t.id} value={t.teamName} />
              ))}
            </datalist>
          </form>

          {/* Editable 8-Team Match List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[680px]">
                <thead>
                  <tr className="bg-[#0B192C] text-amber-400 text-xs font-black">
                    <th className="py-3 px-3 w-16">मैच #</th>
                    <th className="py-3 px-3 w-44">राउंड / चरण (Stage)</th>
                    <th className="py-3 px-3">टीम A (सीधे एडिट करें)</th>
                    <th className="py-3 px-3">टीम B (सीधे एडिट करें)</th>
                    <th className="py-3 px-3 w-36">दिनांक</th>
                    <th className="py-3 px-3 w-32">समय</th>
                    <th className="py-3 px-3 w-14 text-right">हटाएं</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {schedules.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-amber-50/30 dark:hover:bg-slate-800/40"
                    >
                      <td className="p-2 font-mono font-black text-slate-900 dark:text-white">
                        #{s.matchNumber}
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={s.stage}
                          onChange={(e) =>
                            handleUpdateScheduleItem(s.id, {
                              stage: e.target.value as MatchScheduleRecord['stage'],
                            })
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-amber-700 dark:text-amber-400"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          list="eight-teams-list"
                          value={s.teamA}
                          onChange={(e) =>
                            handleUpdateScheduleItem(s.id, { teamA: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          list="eight-teams-list"
                          value={s.teamB}
                          onChange={(e) =>
                            handleUpdateScheduleItem(s.id, { teamB: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={s.matchDate}
                          onChange={(e) =>
                            handleUpdateScheduleItem(s.id, {
                              matchDate: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={s.matchTime}
                          onChange={(e) =>
                            handleUpdateScheduleItem(s.id, {
                              matchTime: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() =>
                            onSaveSchedules(
                              schedules.filter((item) => item.id !== s.id)
                            )
                          }
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: MATCH RESULTS (ONLY PDF & JPG FOR FACEBOOK POSTING)
      ===================================================================== */}
      {subTab === 'result' && (
        <div className="space-y-6">
          <form
            onSubmit={handleAddResult}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {lang === 'hi'
                ? 'नया मैच परिणाम (Match Result) दर्ज करें — डेली फेसबुक पोस्ट के लिए'
                : 'Record Match Result for Daily Facebook Post'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {lang === 'hi' ? 'टीम A का नाम' : 'Team A Name'}
                </label>
                <input
                  type="text"
                  list="eight-teams-list"
                  value={newRes.teamA}
                  onChange={(e) => setNewRes({ ...newRes, teamA: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {lang === 'hi'
                    ? 'टीम A (रन / विकेट / ओवर)'
                    : 'Team A Score / Wkts / Overs'}
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="text"
                    placeholder="Runs"
                    value={newRes.teamAScore}
                    onChange={(e) =>
                      setNewRes({ ...newRes, teamAScore: e.target.value })
                    }
                    className="px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Wkts"
                    value={newRes.teamAWickets}
                    onChange={(e) =>
                      setNewRes({ ...newRes, teamAWickets: e.target.value })
                    }
                    className="px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Overs"
                    value={newRes.teamAOvers}
                    onChange={(e) =>
                      setNewRes({ ...newRes, teamAOvers: e.target.value })
                    }
                    className="px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {lang === 'hi' ? 'टीम B का नाम' : 'Team B Name'}
                </label>
                <input
                  type="text"
                  list="eight-teams-list"
                  value={newRes.teamB}
                  onChange={(e) => setNewRes({ ...newRes, teamB: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {lang === 'hi'
                    ? 'टीम B (रन / विकेट / ओवर)'
                    : 'Team B Score / Wkts / Overs'}
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="text"
                    placeholder="Runs"
                    value={newRes.teamBScore}
                    onChange={(e) =>
                      setNewRes({ ...newRes, teamBScore: e.target.value })
                    }
                    className="px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Wkts"
                    value={newRes.teamBWickets}
                    onChange={(e) =>
                      setNewRes({ ...newRes, teamBWickets: e.target.value })
                    }
                    className="px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Overs"
                    value={newRes.teamBOvers}
                    onChange={(e) =>
                      setNewRes({ ...newRes, teamBOvers: e.target.value })
                    }
                    className="px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {lang === 'hi' ? 'विजेता टीम (Winner)' : 'Winning Team'}
                </label>
                <input
                  type="text"
                  value={newRes.winner}
                  onChange={(e) => setNewRes({ ...newRes, winner: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {lang === 'hi' ? 'जीत का अंतर (Margin)' : 'Win Margin'}
                </label>
                <input
                  type="text"
                  value={newRes.winMargin}
                  onChange={(e) =>
                    setNewRes({ ...newRes, winMargin: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {lang === 'hi'
                    ? 'मैन ऑफ द मैच (Player of Match)'
                    : 'Player of the Match'}
                </label>
                <input
                  type="text"
                  value={newRes.playerOfTheMatch}
                  onChange={(e) =>
                    setNewRes({ ...newRes, playerOfTheMatch: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-extrabold text-xs cursor-pointer"
                >
                  + {lang === 'hi' ? 'रिजल्ट सेव करें' : 'Save Match Result'}
                </button>
              </div>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((res) => (
              <div
                key={res.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-600">
                      MATCH #{res.matchNumber} · {res.stage}
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {res.teamA} vs {res.teamB}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleExportResultDoc(res, 'jpg')}
                      disabled={busyKey !== null}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-black cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>HD JPG</span>
                    </button>
                    <button
                      onClick={() => handleExportResultDoc(res, 'pdf')}
                      disabled={busyKey !== null}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-black cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>HD PDF</span>
                    </button>
                    <button
                      onClick={() =>
                        onSaveResults(results.filter((r) => r.id !== res.id))
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl text-center">
                  <div>
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {res.teamA}
                    </div>
                    <div className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                      {res.teamAScore}/{res.teamAWickets}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ({res.teamAOvers} Overs)
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {res.teamB}
                    </div>
                    <div className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                      {res.teamBScore}/{res.teamBWickets}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ({res.teamBOvers} Overs)
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <span>
                    🏆 {res.winner} ({res.winMargin})
                  </span>
                  <span className="text-amber-600 dark:text-amber-400">
                    ★ MOM: {res.playerOfTheMatch}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: FULL SCORECARD MAKER (ONLY PDF & JPG)
      ===================================================================== */}
      {subTab === 'scorecard' && currentSc && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <select
                value={currentSc.id}
                onChange={(e) => setActiveScorecardId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                {scorecards.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.matchTitle} ({s.matchDate})
                  </option>
                ))}
              </select>
              <button
                onClick={handleCreateNewScorecard}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'नया स्कोरकार्ड' : 'New Scorecard'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  exportScorecardPrintablePDF(currentSc, activeProfile)
                }
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>{lang === 'hi' ? 'HD PDF डाउनलोड' : 'HD PDF'}</span>
              </button>
              <button
                onClick={async () => {
                  const baseTpl =
                    templates.find((t) => t.id === 'tpl-doc-scorecard') ||
                    templates[0];
                  await exportDesignDocument(baseTpl, {
                    format: 'jpg',
                    preset: 'original',
                    scale: 3,
                    filename: currentSc.matchTitle,
                  });
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                <span>{lang === 'hi' ? 'HD JPG डाउनलोड' : 'HD JPG'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {lang === 'hi' ? 'मैच शीर्षक (Match Title)' : 'Match Title'}
                </label>
                <input
                  type="text"
                  value={currentSc.matchTitle}
                  onChange={(e) =>
                    handleUpdateScorecard({
                      ...currentSc,
                      matchTitle: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {lang === 'hi' ? 'बल्लेबाजी टीम (Batting Team)' : 'Batting Team'}
                </label>
                <input
                  type="text"
                  list="eight-teams-list"
                  value={currentSc.battingTeam}
                  onChange={(e) =>
                    handleUpdateScorecard({
                      ...currentSc,
                      battingTeam: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {lang === 'hi' ? 'गेंदबाजी टीम (Bowling Team)' : 'Bowling Team'}
                </label>
                <input
                  type="text"
                  list="eight-teams-list"
                  value={currentSc.bowlingTeam}
                  onChange={(e) =>
                    handleUpdateScorecard({
                      ...currentSc,
                      bowlingTeam: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                />
              </div>
            </div>

            {/* Batsmen Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {lang === 'hi'
                    ? 'बल्लेबाजी विवरण (Batsmen Scorecard)'
                    : 'Batting Innings'}
                </h4>
                <button
                  onClick={() => {
                    const row: BatsmanScoreRow = {
                      id: `bat-${Date.now()}`,
                      name: 'नया बल्लेबाज',
                      dismissal: 'नाबाद',
                      runs: 0,
                      balls: 0,
                      fours: 0,
                      sixes: 0,
                    };
                    handleUpdateScorecard({
                      ...currentSc,
                      batsmen: [...currentSc.batsmen, row],
                    });
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  + {lang === 'hi' ? 'बल्लेबाज जोड़ें' : 'Add Batsman'}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-xs">
                      <th className="py-2.5 px-3">बल्लेबाज (Batsman)</th>
                      <th className="py-2.5 px-3">आउट विवरण (Dismissal)</th>
                      <th className="py-2.5 px-3 text-right">रन (R)</th>
                      <th className="py-2.5 px-3 text-right">गेंद (B)</th>
                      <th className="py-2.5 px-3 text-right">चौके (4s)</th>
                      <th className="py-2.5 px-3 text-right">छक्के (6s)</th>
                      <th className="py-2.5 px-3 text-right">SR</th>
                      <th className="py-2.5 px-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                    {currentSc.batsmen.map((b, idx) => (
                      <tr key={b.id}>
                        <td className="p-2">
                          <input
                            type="text"
                            value={b.name}
                            onChange={(e) => {
                              const next = [...currentSc.batsmen];
                              next[idx] = { ...b, name: e.target.value };
                              handleUpdateScorecard({
                                ...currentSc,
                                batsmen: next,
                              });
                            }}
                            className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={b.dismissal}
                            onChange={(e) => {
                              const next = [...currentSc.batsmen];
                              next[idx] = { ...b, dismissal: e.target.value };
                              handleUpdateScorecard({
                                ...currentSc,
                                batsmen: next,
                              });
                            }}
                            className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                          />
                        </td>
                        {(['runs', 'balls', 'fours', 'sixes'] as const).map(
                          (field) => (
                            <td key={field} className="p-2 w-20">
                              <input
                                type="number"
                                value={b[field]}
                                onChange={(e) => {
                                  const next = [...currentSc.batsmen];
                                  next[idx] = {
                                    ...b,
                                    [field]: Number(e.target.value),
                                  };
                                  handleUpdateScorecard({
                                    ...currentSc,
                                    batsmen: next,
                                  });
                                }}
                                className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-right font-mono font-bold tabular-nums"
                              />
                            </td>
                          )
                        )}
                        <td className="p-2 text-right font-mono text-xs font-bold tabular-nums">
                          {b.balls > 0
                            ? ((b.runs / b.balls) * 100).toFixed(1)
                            : '0.0'}
                        </td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() =>
                              handleUpdateScorecard({
                                ...currentSc,
                                batsmen: currentSc.batsmen.filter(
                                  (item) => item.id !== b.id
                                ),
                              })
                            }
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bowlers Table */}
            <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {lang === 'hi'
                    ? 'गेंदबाजी विवरण (Bowlers Scorecard)'
                    : 'Bowling Figures'}
                </h4>
                <button
                  onClick={() => {
                    const bw: BowlerScoreRow = {
                      id: `bw-${Date.now()}`,
                      name: 'नया गेंदबाज',
                      overs: '4.0',
                      maidens: 0,
                      runsConceded: 30,
                      wickets: 1,
                    };
                    handleUpdateScorecard({
                      ...currentSc,
                      bowlers: [...currentSc.bowlers, bw],
                    });
                  }}
                  className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                >
                  + {lang === 'hi' ? 'गेंदबाज जोड़ें' : 'Add Bowler'}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-xs">
                      <th className="py-2.5 px-3">गेंदबाज (Bowler)</th>
                      <th className="py-2.5 px-3 text-right">ओवर (O)</th>
                      <th className="py-2.5 px-3 text-right">मेडन (M)</th>
                      <th className="py-2.5 px-3 text-right">रन दिए (R)</th>
                      <th className="py-2.5 px-3 text-right">विकेट (W)</th>
                      <th className="py-2.5 px-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                    {currentSc.bowlers.map((bw, idx) => (
                      <tr key={bw.id}>
                        <td className="p-2">
                          <input
                            type="text"
                            value={bw.name}
                            onChange={(e) => {
                              const next = [...currentSc.bowlers];
                              next[idx] = { ...bw, name: e.target.value };
                              handleUpdateScorecard({
                                ...currentSc,
                                bowlers: next,
                              });
                            }}
                            className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                          />
                        </td>
                        <td className="p-2 w-24">
                          <input
                            type="text"
                            value={bw.overs}
                            onChange={(e) => {
                              const next = [...currentSc.bowlers];
                              next[idx] = { ...bw, overs: e.target.value };
                              handleUpdateScorecard({
                                ...currentSc,
                                bowlers: next,
                              });
                            }}
                            className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-right font-mono font-bold"
                          />
                        </td>
                        {(['maidens', 'runsConceded', 'wickets'] as const).map(
                          (f) => (
                            <td key={f} className="p-2 w-24">
                              <input
                                type="number"
                                value={bw[f]}
                                onChange={(e) => {
                                  const next = [...currentSc.bowlers];
                                  next[idx] = {
                                    ...bw,
                                    [f]: Number(e.target.value),
                                  };
                                  handleUpdateScorecard({
                                    ...currentSc,
                                    bowlers: next,
                                  });
                                }}
                                className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-right font-mono font-bold"
                              />
                            </td>
                          )
                        )}
                        <td className="p-2 text-right">
                          <button
                            onClick={() =>
                              handleUpdateScorecard({
                                ...currentSc,
                                bowlers: currentSc.bowlers.filter(
                                  (item) => item.id !== bw.id
                                ),
                              })
                            }
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: 🔴 FACEBOOK LIVE SCORING & LOCAL MARKET ADS STUDIO
      ===================================================================== */}
      {subTab === 'live' && (
        <div className="space-y-6">
          {/* Fullscreen Broadcast Overlay Mode for Facebook Live */}
          {liveState.fullscreenOverlay && (
            <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-4 sm:p-8 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 bg-red-600 px-4 py-2 rounded-xl font-black text-sm animate-pulse">
                  <Radio className="w-4 h-4" />
                  <span>FACEBOOK LIVE • {activeProfile.tournamentName}</span>
                </div>
                <button
                  onClick={() =>
                    setLiveState({ ...liveState, fullscreenOverlay: false })
                  }
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold cursor-pointer"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>कंट्रोल पैनल पर वापस जाएं</span>
                </button>
              </div>

              {/* Lower-Third TV Broadcast Score Bar + Sponsor Ad Ticker */}
              <div className="space-y-3">
                <div className="rounded-2xl bg-gradient-to-r from-[#0B192C] via-[#1E3A8A] to-[#0B192C] border-2 border-amber-400 p-4 sm:p-5 shadow-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div>
                      <div className="text-xs font-bold text-amber-300 uppercase">
                        {liveState.matchStage} • VS {liveState.bowlingTeam}
                      </div>
                      <div className="text-2xl sm:text-4xl font-black text-white font-mono">
                        {liveState.battingTeam}: {liveState.runs}/
                        {liveState.wickets}{' '}
                        <span className="text-lg text-amber-400">
                          ({liveState.overs}.{liveState.balls} Ov)
                        </span>
                      </div>
                      <div className="text-xs font-bold text-emerald-300 mt-1">
                        🎯 Target: {liveState.target} | {liveState.statusLine}
                      </div>
                    </div>

                    <div className="bg-slate-950/70 rounded-xl p-3 border border-white/10 space-y-1 text-xs sm:text-sm font-bold">
                      <div className="flex justify-between text-amber-300">
                        <span>🏏 {liveState.strikerName}</span>
                        <span className="font-mono">
                          {liveState.strikerRuns} ({liveState.strikerBalls})
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-200">
                        <span>🏏 {liveState.nonStrikerName}</span>
                        <span className="font-mono">
                          {liveState.nonStrikerRuns} ({liveState.nonStrikerBalls})
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950/70 rounded-xl p-3 border border-white/10 space-y-1 text-xs sm:text-sm font-bold">
                      <div className="text-sky-300">
                        ⚾ गेंदबाज: {liveState.bowlerName}
                      </div>
                      <div className="font-mono text-base text-white">
                        {liveState.bowlerFigures}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Local Market Ad Banner on Facebook Live */}
                {activeSponsor && (
                  <div className="rounded-xl bg-amber-400 text-slate-950 px-4 py-3 font-black text-xs sm:text-sm flex flex-wrap items-center justify-between gap-2 shadow-xl border-2 border-red-600">
                    <span>
                      📢 प्रायोजक (SPONSOR AD): {activeSponsor.shopName} (
                      {activeSponsor.address}) — {activeSponsor.tagline}
                    </span>
                    <span className="bg-red-600 text-white px-3 py-1 rounded-lg">
                      प्रो०: {activeSponsor.ownerName} • 📞 {activeSponsor.mobile}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Live Score Controller & Sponsor Selector */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[11px] font-black text-red-600 uppercase">
                    🔴 FACEBOOK LIVE SCORING & SPONSOR AD CONTROLLER
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {lang === 'hi'
                      ? 'फेसबुक लाइव स्कोरबोर्ड एवं लोकल मार्केट विज्ञापन पैनल'
                      : 'Facebook Live Scoreboard & Sponsor Ad Controller'}
                  </h3>
                </div>
                <button
                  onClick={() =>
                    setLiveState({ ...liveState, fullscreenOverlay: true })
                  }
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black cursor-pointer shadow-xs"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>फुल-स्क्रीन लाइव ओवरले (TV Mode)</span>
                </button>
              </div>

              {/* Quick 1-Tap Ball Scoring Buttons */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">
                    ⚡ 1-क्लिक लाइव गेंद स्कोर अपडेट (Quick Ball Score):
                  </span>
                  <span className="text-lg font-mono font-black text-white">
                    {liveState.runs}/{liveState.wickets} ({liveState.overs}.
                    {liveState.balls} Ov)
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLiveBallScore(0)}
                    className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-black text-xs cursor-pointer"
                  >
                    0 (Dot)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLiveBallScore(1)}
                    className="py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 font-black text-xs cursor-pointer"
                  >
                    +1 Run
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLiveBallScore(2)}
                    className="py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 font-black text-xs cursor-pointer"
                  >
                    +2 Runs
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLiveBallScore(3)}
                    className="py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 font-black text-xs cursor-pointer"
                  >
                    +3 Runs
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLiveBallScore(4)}
                    className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black text-xs cursor-pointer"
                  >
                    +4 चौका
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLiveBallScore(6)}
                    className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
                  >
                    +6 छक्का
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLiveBallScore(1, false, true)}
                    className="py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 font-black text-xs cursor-pointer"
                  >
                    Wide/NB
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLiveBallScore(0, true)}
                    className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 font-black text-xs cursor-pointer"
                  >
                    OUT (W)
                  </button>
                </div>
              </div>

              {/* Match & Players Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    बल्लेबाजी टीम (Batting Team)
                  </label>
                  <input
                    type="text"
                    list="eight-teams-list"
                    value={liveState.battingTeam}
                    onChange={(e) =>
                      setLiveState({ ...liveState, battingTeam: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-extrabold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    गेंदबाजी टीम (Bowling Team)
                  </label>
                  <input
                    type="text"
                    list="eight-teams-list"
                    value={liveState.bowlingTeam}
                    onChange={(e) =>
                      setLiveState({ ...liveState, bowlingTeam: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-extrabold"
                  />
                </div>

                <div className="grid grid-cols-4 gap-1.5 sm:col-span-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500">
                      रन (Runs)
                    </label>
                    <input
                      type="number"
                      value={liveState.runs}
                      onChange={(e) =>
                        setLiveState({
                          ...liveState,
                          runs: Number(e.target.value),
                        })
                      }
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500">
                      विकेट (Wkts)
                    </label>
                    <input
                      type="number"
                      value={liveState.wickets}
                      onChange={(e) =>
                        setLiveState({
                          ...liveState,
                          wickets: Number(e.target.value),
                        })
                      }
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500">
                      ओवर (Overs)
                    </label>
                    <input
                      type="number"
                      value={liveState.overs}
                      onChange={(e) =>
                        setLiveState({
                          ...liveState,
                          overs: Number(e.target.value),
                        })
                      }
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500">
                      टारगेट (Target)
                    </label>
                    <input
                      type="text"
                      value={liveState.target}
                      onChange={(e) =>
                        setLiveState({ ...liveState, target: e.target.value })
                      }
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    बल्लेबाज 1 (Striker)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={liveState.strikerName}
                      onChange={(e) =>
                        setLiveState({
                          ...liveState,
                          strikerName: e.target.value,
                        })
                      }
                      className="flex-1 px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                    />
                    <input
                      type="number"
                      value={liveState.strikerRuns}
                      onChange={(e) =>
                        setLiveState({
                          ...liveState,
                          strikerRuns: Number(e.target.value),
                        })
                      }
                      className="w-16 px-2 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold"
                      title="Runs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    बल्लेबाज 2 (Non-Striker)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={liveState.nonStrikerName}
                      onChange={(e) =>
                        setLiveState({
                          ...liveState,
                          nonStrikerName: e.target.value,
                        })
                      }
                      className="flex-1 px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                    />
                    <input
                      type="number"
                      value={liveState.nonStrikerRuns}
                      onChange={(e) =>
                        setLiveState({
                          ...liveState,
                          nonStrikerRuns: Number(e.target.value),
                        })
                      }
                      className="w-16 px-2 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold"
                      title="Runs"
                    />
                  </div>
                </div>

                {/* Local Market Sponsor Ad Selector for Facebook Live */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-black text-amber-700 dark:text-amber-400 mb-1">
                    📢 फेसबुक लाइव पर चलने वाला लोकल मार्केट विज्ञापन चुनें (Active Sponsor Ad):
                  </label>
                  <select
                    value={liveState.selectedSponsorId}
                    onChange={(e) =>
                      setLiveState({
                        ...liveState,
                        selectedSponsorId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-amber-500 bg-amber-50/60 dark:bg-slate-800 text-xs font-extrabold text-slate-900 dark:text-white"
                  >
                    {sponsors.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.shopName} ({sp.ownerName}) — {sp.tagline}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Live Preview & HD JPG / PDF Download */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4 shadow-xs">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                {lang === 'hi'
                  ? 'फेसबुक लाइव स्कोर + विज्ञापन पोस्ट प्रीव्यू'
                  : 'Facebook Live Score + Ad Card Preview'}
              </h4>

              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <DesignMiniPreview doc={liveScoreDoc} maxHeight={260} />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={async () => {
                    setBusyKey('live-jpg');
                    try {
                      await exportDesignDocument(liveScoreDoc, {
                        format: 'jpg',
                        preset: 'original',
                        scale: 3,
                        filename: liveScoreDoc.name,
                      });
                    } finally {
                      setBusyKey(null);
                    }
                  }}
                  disabled={busyKey !== null}
                  className="py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>HD JPG डाउनलोड</span>
                </button>

                <button
                  onClick={async () => {
                    setBusyKey('live-pdf');
                    try {
                      await exportDesignDocument(liveScoreDoc, {
                        format: 'pdf',
                        preset: 'original',
                        scale: 3,
                        filename: liveScoreDoc.name,
                      });
                    } finally {
                      setBusyKey(null);
                    }
                  }}
                  disabled={busyKey !== null}
                  className="py-3 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <FileText className="w-4 h-4" />
                  <span>HD PDF डाउनलोड</span>
                </button>
              </div>

              <button
                onClick={() => onOpenInEditor(liveScoreDoc)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#0B192C] dark:bg-amber-500 text-white dark:text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Palette className="w-4 h-4" />
                <span>कैनवास एडिटर में खोलें (Full Customize)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: 📰 NEWSPAPER PRESS RELEASE (OPENING & FINAL) + 📢 MIC PRACHAR
      ===================================================================== */}
      {subTab === 'media-prachar' && (
        <div className="space-y-6">
          {/* PART A: OPENING & FINAL MATCH NEWSPAPER PRESS RELEASE MAKER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-black text-red-600 uppercase">
                    📰 दैनिक अखबार प्रेस विज्ञप्ति (NEWSPAPER PRESS RELEASE)
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {lang === 'hi'
                      ? 'उद्घाटन मैच (Opening) एवं फाइनल मैच (Final) अखबार खबर मेकर'
                      : 'Opening Match & Final Match Newspaper Report Maker'}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setNewsType('opening')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer ${
                      newsType === 'opening'
                        ? 'bg-red-600 text-white'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    1. उद्घाटन मैच खबर
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewsType('final')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer ${
                      newsType === 'final'
                        ? 'bg-red-600 text-white'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    2. फाइनल मैच खबर
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  अखबार की मुख्य हेडिंग (Main Newspaper Headline)
                </label>
                <input
                  type="text"
                  value={
                    newsType === 'opening'
                      ? newsData.openingHeadline
                      : newsData.finalHeadline
                  }
                  onChange={(e) =>
                    setNewsData({
                      ...newsData,
                      [newsType === 'opening'
                        ? 'openingHeadline'
                        : 'finalHeadline']: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-black text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  प्रेस खबर का पूरा विवरण (Newspaper Article Text — WhatsApp या प्रिंट के लिए)
                </label>
                <textarea
                  rows={6}
                  value={
                    newsType === 'opening'
                      ? newsData.openingBody
                      : newsData.finalBody
                  }
                  onChange={(e) =>
                    setNewsData({
                      ...newsData,
                      [newsType === 'opening' ? 'openingBody' : 'finalBody']:
                        e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-relaxed"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const fullNews = `*${
                      newsType === 'opening'
                        ? newsData.openingHeadline
                        : newsData.finalHeadline
                    }*\n${newsData.dateline}\n\n${
                      newsType === 'opening'
                        ? newsData.openingBody
                        : newsData.finalBody
                    }\n\nभवदीय: ${activeProfile.presidentName} (${
                      activeProfile.organizerName
                    }) | संपर्क: ${activeProfile.contactNumber}`;
                    navigator.clipboard?.writeText(fullNews);
                    showToast(
                      '✓ अखबार के पत्रकार को WhatsApp करने के लिए पूरी खबर कॉपी हो गई!'
                    );
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>अखबार/पत्रकार के लिए खबर टेक्स्ट कॉपी करें</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenInEditor(newspaperDoc)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B192C] dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-black cursor-pointer"
                >
                  <Palette className="w-4 h-4" />
                  <span>कैनवास एडिटर में फोटो/टेक्स्ट बदलें</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-3">
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <DesignMiniPreview doc={newspaperDoc} maxHeight={260} />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={async () => {
                    setBusyKey('news-jpg');
                    try {
                      await exportDesignDocument(newspaperDoc, {
                        format: 'jpg',
                        preset: 'original',
                        scale: 3,
                        filename: `${activeProfile.tournamentNameEn}_${newsType}_News`,
                      });
                    } finally {
                      setBusyKey(null);
                    }
                  }}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>अखबार कटिंग HD JPG</span>
                </button>
                <button
                  onClick={async () => {
                    setBusyKey('news-pdf');
                    try {
                      await exportDesignDocument(newspaperDoc, {
                        format: 'pdf',
                        preset: 'original',
                        scale: 3,
                        filename: `${activeProfile.tournamentNameEn}_${newsType}_News`,
                      });
                    } finally {
                      setBusyKey(null);
                    }
                  }}
                  className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>प्रेस विज्ञप्ति HD PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* PART B: LOCAL MARKET MIC PRACHAR & SPONSOR ADS MANAGER */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-black text-amber-600 uppercase flex items-center gap-1">
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>LOCAL MARKET MIC PRACHAR & FACEBOOK LIVE ADS</span>
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {lang === 'hi'
                    ? '📢 लोकल मार्केट माइक प्रचार (Mic Announcement) एवं दुकानदार विज्ञापन स्टूडियो'
                    : 'Local Market Mic Prachar & Shop Sponsor Studio'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'hi'
                    ? 'अपने लोकल मार्केट की दुकानों का नाम जोड़ें — माइक से प्रचार बोलने की स्क्रिप्ट और फेसबुक लाइव विज्ञापन अपने-आप तैयार हो जाएगा।'
                    : 'Add local market shops to generate ready-to-read Mic Prachar scripts and Facebook Live ads.'}
                </p>
              </div>
            </div>

            {/* Add New Local Shop / Sponsor Form */}
            <form
              onSubmit={handleAddSponsor}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-amber-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-amber-200 dark:border-slate-700"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  दुकान / शोरूम का नाम (Shop Name)
                </label>
                <input
                  type="text"
                  required
                  placeholder="जैसे: बेग स्पोर्ट्स & गारमेंट्स"
                  value={newSponsor.shopName}
                  onChange={(e) =>
                    setNewSponsor({ ...newSponsor, shopName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  प्रोप्राइटर का नाम (Owner)
                </label>
                <input
                  type="text"
                  placeholder="जैसे: मिर्ज़ा सैफ बेग"
                  value={newSponsor.ownerName}
                  onChange={(e) =>
                    setNewSponsor({ ...newSponsor, ownerName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  पता / बाजार (Market Address)
                </label>
                <input
                  type="text"
                  value={newSponsor.address}
                  onChange={(e) =>
                    setNewSponsor({ ...newSponsor, address: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  प्रचार ऑफर / टैगलाइन (Offer/Tagline)
                </label>
                <input
                  type="text"
                  value={newSponsor.tagline}
                  onChange={(e) =>
                    setNewSponsor({ ...newSponsor, tagline: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>दुकान प्रचार जोड़ें</span>
                </button>
              </div>
            </form>

            {/* Saved Local Market Shops & Mic Prachar Scripts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sponsors.map((sp) => (
                <div
                  key={sp.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-black">
                        {sp.category} • {sp.address}
                      </span>
                      <h4 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                        🏪 {sp.shopName}
                      </h4>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        प्रो०: {sp.ownerName} • 📞 {sp.mobile}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        onSaveSponsors(sponsors.filter((item) => item.id !== sp.id))
                      }
                      className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Editable Mic Prachar Script */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 mb-1">
                      🎤 माइक से बोलने की प्रचार स्क्रिप्ट (Mic Prachar Script):
                    </label>
                    <textarea
                      rows={3}
                      value={sp.micScript}
                      onChange={(e) => {
                        const next = sponsors.map((item) =>
                          item.id === sp.id
                            ? { ...item, micScript: e.target.value }
                            : item
                        );
                        onSaveSponsors(next);
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 leading-relaxed"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSpeakHindi(sp.micScript)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>🔊 माइक आवाज सुनें</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(sp.micScript);
                        showToast('✓ माइक प्रचार स्क्रिप्ट कॉपी हो गई!');
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>स्क्रिप्ट कॉपी करें</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLiveState({
                          ...liveState,
                          selectedSponsorId: sp.id,
                        });
                        setSubTab('live');
                        showToast(
                          `✓ "${sp.shopName}" अब फेसबुक लाइव स्कोरबोर्ड पर सेट हो गया!`
                        );
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>फेसबुक लाइव में चलाएं</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
