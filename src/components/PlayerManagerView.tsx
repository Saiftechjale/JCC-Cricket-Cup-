import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Calendar,
  Camera,
  Check,
  FileText,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  Palette,
  RefreshCw,
  Save,
  Share2,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import {
  DesignDocument,
  Language,
  LiveBroadcastRoomState,
  MatchResultRecord,
  MatchScheduleRecord,
  PlayerRecord,
  TeamSquadRecord,
  TournamentProfile,
  t3,
} from '../types/studio';
import { getStickerDataUrl } from '../utils/cricketGraphics';
import {
  exportDesignDocument,
  shareDesignDocument,
} from '../utils/exportEngine';
import { DesignMiniPreview } from './DesignMiniPreview';
import {
  LATEST_LIVE_STATE_STORAGE_KEY,
  cleanBroadcastName,
  computeAutoAwards,
} from './FBLiveBroadcastStudioView';

interface PlayerManagerViewProps {
  lang: Language;
  teams: TeamSquadRecord[];
  schedules?: MatchScheduleRecord[];
  results?: MatchResultRecord[];
  players?: PlayerRecord[];
  activeProfile: TournamentProfile;
  templates: DesignDocument[];
  onSaveTeams: (teams: TeamSquadRecord[]) => void;
  onSaveSchedules?: (schedules: MatchScheduleRecord[]) => void;
  onSaveResults?: (results: MatchResultRecord[]) => void;
  onSavePlayers?: (players: PlayerRecord[]) => void;
  onOpenInEditor: (doc: DesignDocument) => void;
}

type SquadTemplateStyleId =
  | 'tpl-fb-daily-mom-award'
  | 'tpl-fb-daily-match-routine'
  | 'tpl-fb-team-royal'
  | 'tpl-fb-team-neon'
  | 'tpl-fb-team-red'
  | 'tpl-doc-player-list-jale';

const DAILY_MOM_STORAGE_KEY = 'jale_cricket_daily_mom_post_v1';

interface DailyMomPostData {
  matchNumber: number;
  matchStage: string;
  matchDate: string;
  teamA: string;
  teamAScore: string;
  teamB: string;
  teamBScore: string;
  winnerLine: string;
  momPlayerName: string;
  momPlayerTeam: string;
  momPlayerStats: string;
  prizeText: string;
  presentedByName: string;
  presentedByDesignation: string;
  awardPhotoDataUrl: string;
}

const SQUAD_TEMPLATE_STYLES: {
  id: SquadTemplateStyleId;
  titleHi: string;
  titleEn: string;
  titleMix: string;
  badgeHi: string;
  badgeEn: string;
}[] = [
  {
    id: 'tpl-fb-daily-mom-award',
    titleHi: '1. मैन ऑफ द मैच + रिज़ल्ट पोस्ट (फोटो व मुख्य अतिथि)',
    titleEn: '1. Man of the Match + Result Post (Photo & Guest)',
    titleMix: '1. Man of the Match + रिज़ल्ट पोस्ट (फोटो व अतिथि)',
    badgeHi: 'मैन ऑफ द मैच पोस्ट',
    badgeEn: 'Daily MoM Post',
  },
  {
    id: 'tpl-fb-daily-match-routine',
    titleHi: '2. डेली मैच रूटीन / आज का मुकाबला पोस्ट (Match 1, 2, 3...)',
    titleEn: '2. Daily Match Routine / Fixture Post (Match 1, 2, 3...)',
    titleMix: '2. डेली मैच रूटीन पोस्ट (Match 1, 2, 3...)',
    badgeHi: 'डेली मैच रूटीन',
    badgeEn: 'Match Routine',
  },
  {
    id: 'tpl-fb-team-royal',
    titleHi: '3. फेसबुक टीम 15-खिलाड़ी पोस्ट (रॉयल ब्लू & गोल्ड)',
    titleEn: '3. Facebook Squad Post (Royal Blue & Gold)',
    titleMix: '3. टीम 15-खिलाड़ी पोस्ट (Royal Blue & Gold)',
    badgeHi: 'टीम स्क्वाड पोस्ट',
    badgeEn: 'Team Squad',
  },
  {
    id: 'tpl-fb-team-neon',
    titleHi: '4. फेसबुक टीम 15-खिलाड़ी पोस्ट (स्टेडियम ग्रीन)',
    titleEn: '4. Facebook Squad Post (Stadium Green)',
    titleMix: '4. टीम 15-खिलाड़ी पोस्ट (Stadium Green)',
    badgeHi: 'टीम स्क्वाड पोस्ट',
    badgeEn: 'Team Squad',
  },
  {
    id: 'tpl-fb-team-red',
    titleHi: '5. फेसबुक टीम 15-खिलाड़ी पोस्ट (रेड & ब्लैक)',
    titleEn: '5. Facebook Squad Post (Red & Black)',
    titleMix: '5. टीम 15-खिलाड़ी पोस्ट (Red & Black)',
    badgeHi: 'टीम स्क्वाड पोस्ट',
    badgeEn: 'Team Squad',
  },
  {
    id: 'tpl-doc-player-list-jale',
    titleHi: '6. ऑफिशियल 15-खिलाड़ी शपथ पत्र (A4 प्रिंट फॉर्म)',
    titleEn: '6. Official 15-Player Undertaking Form (A4)',
    titleMix: '6. ऑफिशियल 15-खिलाड़ी फॉर्म (A4 Print)',
    badgeHi: 'A4 प्रिंट फॉर्म',
    badgeEn: 'Official A4 Print',
  },
];

function compressImageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 960;
        let w = img.width || 800;
        let h = img.height || 800;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.onerror = () => resolve(String(reader.result));
      img.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const PlayerManagerView: React.FC<PlayerManagerViewProps> = ({
  lang,
  teams,
  schedules = [],
  activeProfile,
  templates,
  onSaveTeams,
  onSaveSchedules,
  onOpenInEditor,
}) => {
  const [selectedTeamIdx, setSelectedTeamIdx] = useState<number>(0);
  const [selectedStyleId, setSelectedStyleId] = useState<SquadTemplateStyleId>(
    'tpl-fb-daily-mom-award'
  );
  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [busyExport, setBusyExport] = useState<'pdf' | 'jpg' | null>(null);
  const [doneExport, setDoneExport] = useState<'pdf' | 'jpg' | null>(null);

  // Daily Routine Sub-Mode: 'today-vs' (Single Match #1, #2, #3 VS Card) or 'full-routine' (All 7 Matches Table)
  const [routineSubMode, setRoutineSubMode] = useState<
    'today-vs' | 'full-routine'
  >('today-vs');
  const [selectedScheduleIdx, setSelectedScheduleIdx] = useState<number>(0);

  // Direct Post Text Editing State (edit any box inside the generated post)
  const [selectedPreviewElId, setSelectedPreviewElId] = useState<string | null>(
    null
  );
  const [customTextOverrides, setCustomTextOverrides] = useState<
    Record<string, string>
  >({});

  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // Build initial Daily Man of the Match & Result Data (Auto-synced from Live Match if available)
  const buildLiveMomDefault = (): DailyMomPostData => {
    try {
      const savedPostRaw = localStorage.getItem(DAILY_MOM_STORAGE_KEY);
      if (savedPostRaw) {
        const parsed = JSON.parse(savedPostRaw) as DailyMomPostData;
        if (parsed && parsed.momPlayerName) {
          return {
            ...parsed,
            prizeText:
              parsed.prizeText && !parsed.prizeText.includes('501')
                ? parsed.prizeText
                : '',
          };
        }
      }
    } catch {
      // ignore
    }

    try {
      const liveRaw = localStorage.getItem(LATEST_LIVE_STATE_STORAGE_KEY);
      if (liveRaw) {
        const live = JSON.parse(liveRaw) as LiveBroadcastRoomState;
        const awards = computeAutoAwards(
          live.batsmanRecords,
          live.bowlerRecords,
          live.fieldingRecords
        );
        const mom = awards.manOfTheMatch;
        const tA =
          live.firstInningsTeamName ||
          cleanBroadcastName(live.battingTeamName) ||
          'जाले रॉयल इलेवन';
        const tAScore =
          live.firstInningsTeamName !== undefined
            ? `${live.firstInningsRuns || 0}/${live.firstInningsWickets || 0} (${live.firstInningsOvers || '16.0'} Ov)`
            : `${live.runs}/${live.wickets} (${live.overs}.${live.balls} Ov)`;
        const tB =
          live.firstInningsTeamName !== undefined
            ? cleanBroadcastName(live.battingTeamName)
            : cleanBroadcastName(live.bowlingTeamName) || 'दरभंगा टाइगर्स';
        const tBScore =
          live.firstInningsTeamName !== undefined
            ? `${live.runs}/${live.wickets} (${live.overs}.${live.balls} Ov)`
            : `लक्ष्य: ${live.runs + 1} रन`;

        return {
          matchNumber: 1,
          matchStage: live.matchStage || 'Quarter Final 1',
          matchDate: new Date().toLocaleDateString('hi-IN'),
          teamA: tA,
          teamAScore: tAScore,
          teamB: tB,
          teamBScore: tBScore,
          winnerLine: `${tA} की शानदार जीत!`,
          momPlayerName: cleanBroadcastName(mom?.name) || 'मिर्ज़ा सैफ बेग',
          momPlayerTeam: mom?.team || tA,
          momPlayerStats:
            mom?.summary || '104 रन (50 गेंद) • शानदार प्रदर्शन',
          prizeText: '',
          presentedByName: activeProfile.chiefGuest || activeProfile.presidentName,
          presentedByDesignation: 'मुख्य अतिथि एवं समाजसेवी',
          awardPhotoDataUrl: '',
        };
      }
    } catch {
      // ignore
    }

    return {
      matchNumber: 1,
      matchStage: 'Quarter Final 1 (पहला मैच)',
      matchDate: activeProfile.startingDate,
      teamA: cleanBroadcastName(teams[0]?.teamName) || 'जाले रॉयल इलेवन',
      teamAScore: '227/3 (16.0 Ov)',
      teamB: cleanBroadcastName(teams[1]?.teamName) || 'दरभंगा टाइगर्स',
      teamBScore: '185/8 (16.0 Ov)',
      winnerLine: 'जाले रॉयल इलेवन 42 रनों से विजयी!',
      momPlayerName: 'मिर्ज़ा सैफ बेग',
      momPlayerTeam: cleanBroadcastName(teams[0]?.teamName) || 'जाले रॉयल इलेवन',
      momPlayerStats: '104 रन (50 गेंद, 4 चौके, 5 छक्के)',
      prizeText: '',
      presentedByName: activeProfile.chiefGuest || activeProfile.presidentName,
      presentedByDesignation: 'मुख्य अतिथि / समाजसेवी',
      awardPhotoDataUrl: '',
    };
  };

  const [momPost, setMomPost] = useState<DailyMomPostData>(buildLiveMomDefault);

  useEffect(() => {
    try {
      localStorage.setItem(DAILY_MOM_STORAGE_KEY, JSON.stringify(momPost));
    } catch {
      // ignore
    }
  }, [momPost]);

  // 1-Click Sync from Current Live Match Scorer
  const handleSyncFromLiveMatch = () => {
    try {
      const liveRaw = localStorage.getItem(LATEST_LIVE_STATE_STORAGE_KEY);
      if (!liveRaw) return;
      const live = JSON.parse(liveRaw) as LiveBroadcastRoomState;
      const awards = computeAutoAwards(
        live.batsmanRecords,
        live.bowlerRecords,
        live.fieldingRecords
      );
      const mom = awards.manOfTheMatch;

      const tA =
        live.firstInningsTeamName ||
        cleanBroadcastName(live.battingTeamName) ||
        momPost.teamA;
      const tAScore =
        live.firstInningsTeamName !== undefined
          ? `${live.firstInningsRuns || 0}/${live.firstInningsWickets || 0} (${live.firstInningsOvers || '16.0'} Ov)`
          : `${live.runs}/${live.wickets} (${live.overs}.${live.balls} Ov)`;
      const tB =
        live.firstInningsTeamName !== undefined
          ? cleanBroadcastName(live.battingTeamName)
          : cleanBroadcastName(live.bowlingTeamName) || momPost.teamB;
      const tBScore =
        live.firstInningsTeamName !== undefined
          ? `${live.runs}/${live.wickets} (${live.overs}.${live.balls} Ov)`
          : `${live.targetRuns > 0 ? `लक्ष्य ${live.targetRuns}` : 'बल्लेबाजी बाकी'}`;

      let winText = `${tA} vs ${tB}`;
      if (live.firstInningsTeamName !== undefined && live.targetRuns > 0) {
        if (live.runs >= live.targetRuns) {
          winText = `${tB} ने ${10 - live.wickets} विकेट से मैच जीता!`;
        } else if (
          live.overs >= live.totalMatchOvers ||
          live.wickets >= 10
        ) {
          const diff = (live.firstInningsRuns || 0) - live.runs;
          winText =
            diff > 0
              ? `${tA} ने ${diff} रनों से मैच जीता!`
              : 'रोमांचक मुकाबला टाई!';
        }
      } else {
        winText = `${tA} विजयी!`;
      }

      setMomPost((prev) => ({
        ...prev,
        matchStage: live.matchStage || prev.matchStage,
        teamA: tA,
        teamAScore: tAScore,
        teamB: tB,
        teamBScore: tBScore,
        winnerLine: winText,
        momPlayerName: cleanBroadcastName(mom?.name) || prev.momPlayerName,
        momPlayerTeam: mom?.team || tA,
        momPlayerStats: mom?.summary || prev.momPlayerStats,
      }));
    } catch {
      // ignore
    }
  };

  // Select Match #1, #2, #3... from schedules to populate teams & stage
  const handleSelectMatchNumberForMom = (matchIdx: number) => {
    const sch = schedules[matchIdx];
    if (!sch) return;
    setMomPost((prev) => ({
      ...prev,
      matchNumber: sch.matchNumber,
      matchStage: sch.stage,
      matchDate: sch.matchDate,
      teamA: cleanBroadcastName(sch.teamA),
      teamB: cleanBroadcastName(sch.teamB),
    }));
  };

  const currentTeam: TeamSquadRecord = teams[selectedTeamIdx] || teams[0];

  const fifteenPlayers = useMemo(() => {
    const arr = [...(currentTeam?.players || [])];
    while (arr.length < 15) {
      arr.push('');
    }
    return arr.slice(0, 15);
  }, [currentTeam]);

  const allTournamentPlayers = useMemo(() => {
    const set = new Set<string>();
    teams.forEach((t) => {
      (t.players || []).forEach((p) => {
        const cl = cleanBroadcastName(p);
        if (cl) set.add(cl);
      });
    });
    return Array.from(set);
  }, [teams]);

  const handleUpdateTeamField = (
    field: keyof Pick<
      TeamSquadRecord,
      'teamName' | 'village' | 'captainName' | 'mobileNumber'
    >,
    value: string
  ) => {
    const next = teams.map((t, idx) =>
      idx === selectedTeamIdx
        ? {
            ...t,
            [field]: value,
            updatedAt: new Date().toISOString().slice(0, 10),
          }
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

  const currentScheduleItem: MatchScheduleRecord =
    schedules[selectedScheduleIdx] ||
    schedules[0] || {
      id: 'sch-1',
      matchNumber: 1,
      stage: 'Quarter Final 1',
      teamA: teams[0]?.teamName || 'जाले रॉयल इलेवन',
      teamB: teams[1]?.teamName || 'दरभंगा टाइगर्स',
      matchDate: activeProfile.startingDate,
      matchTime: activeProfile.matchTime,
      venue: activeProfile.venue,
      status: 'Upcoming',
    };

  const handleUpdateSelectedSchedule = (patch: Partial<MatchScheduleRecord>) => {
    if (!onSaveSchedules || schedules.length === 0) return;
    const next = schedules.map((s, idx) =>
      idx === selectedScheduleIdx ? { ...s, ...patch } : s
    );
    onSaveSchedules(next);
  };

  // =========================================================================
  // DYNAMICALLY BUILD DESIGN DOCUMENT FOR ALL 6 TEMPLATE STYLES
  // =========================================================================
  const baseTeamDesignDoc: DesignDocument = useMemo(() => {
    // -----------------------------------------------------------------------
    // STYLE 1: DAILY MAN OF THE MATCH + MATCH RESULT + PHOTO + CHIEF GUEST
    // -----------------------------------------------------------------------
    if (selectedStyleId === 'tpl-fb-daily-mom-award') {
      const photoSrc =
        momPost.awardPhotoDataUrl || getStickerDataUrl('batsman-action');
      const cleanPrizeLine = (momPost.prizeText || '').trim();
      const momBoxText = cleanPrizeLine
        ? `🏅 MAN OF THE MATCH\n(मैन ऑफ द मैच)\n\n★ ${momPost.momPlayerName} ★\nटीम: ${momPost.momPlayerTeam}\n\n📊 शानदार प्रदर्शन:\n${momPost.momPlayerStats}\n\n🏆 पुरस्कार: ${cleanPrizeLine}`
        : `🏅 MAN OF THE MATCH\n(मैन ऑफ द मैच)\n\n★ ${momPost.momPlayerName} ★\nटीम: ${momPost.momPlayerTeam}\n\n📊 शानदार प्रदर्शन:\n${momPost.momPlayerStats}`;

      return {
        id: `daily-mom-match-${momPost.matchNumber}`,
        name: `Match_${momPost.matchNumber}_Man_Of_The_Match_${momPost.momPlayerName}`,
        nameHi: `मैच #${momPost.matchNumber} — मैन ऑफ द मैच (${momPost.momPlayerName})`,
        category: 'result',
        theme: 'blue-sports',
        width: 1080,
        height: 1350,
        backgroundColor: '#0B192C',
        backgroundGradient:
          'linear-gradient(180deg, #071120 0%, #1E3A8A 50%, #090D16 100%)',
        borderFrameColor: '#F59E0B',
        borderFrameWidth: 12,
        innerBorderColor: '#FDE047',
        updatedAt: new Date().toISOString(),
        version: 1,
        elements: [
          {
            id: 'mom-logo',
            type: 'sticker',
            label: 'Logo',
            x: 45,
            y: 35,
            width: 115,
            height: 115,
            rotation: 0,
            opacity: 1,
            locked: false,
            stickerId: 'jale-logo',
            imageUrl: activeProfile.tournamentLogo || undefined,
          },
          {
            id: 'mom-header',
            type: 'heading',
            label: '1. ऊपर की टूर्नामेंट हेडिंग',
            x: 175,
            y: 35,
            width: 860,
            height: 115,
            rotation: 0,
            opacity: 1,
            locked: false,
            text: `${activeProfile.tournamentName}\n(${activeProfile.seasonNumber}) • स्थान: ${activeProfile.venue}`,
            fontFamily: 'Noto Sans Devanagari',
            fontSize: 31,
            fontWeight: '900',
            textAlign: 'center',
            color: '#FDE047',
            lineHeight: 1.3,
          },
          {
            id: 'mom-match-badge',
            type: 'title',
            label: '2. मैच नंबर व तारीख पट्टी',
            x: 50,
            y: 165,
            width: 980,
            height: 68,
            rotation: 0,
            opacity: 1,
            locked: false,
            text: `🏏 MATCH #${momPost.matchNumber} (${momPost.matchStage}) • दिनांक: ${momPost.matchDate}`,
            fontFamily: 'Noto Sans Devanagari',
            fontSize: 27,
            fontWeight: '900',
            textAlign: 'center',
            color: '#0B192C',
            backgroundColor: '#FDE047',
            borderRadius: 14,
            padding: 12,
          },
          {
            id: 'mom-score-card',
            type: 'title',
            label: '3. टीम स्कोर, VS व विजेता बॉक्स',
            x: 50,
            y: 250,
            width: 980,
            height: 170,
            rotation: 0,
            opacity: 1,
            locked: false,
            text: `${momPost.teamA}: ${momPost.teamAScore}   VS   ${momPost.teamB}: ${momPost.teamBScore}\n🏆 ${momPost.winnerLine}`,
            fontFamily: 'Noto Sans Devanagari',
            fontSize: 28,
            fontWeight: '900',
            textAlign: 'center',
            color: '#FFFFFF',
            backgroundColor: '#0F172A',
            borderColor: '#38BDF8',
            borderWidth: 3,
            borderRadius: 18,
            padding: 20,
            lineHeight: 1.45,
          },
          // Large Framed Photo of Man of the Match Ceremony
          {
            id: 'mom-photo-frame',
            type: 'image',
            label: 'Man of the Match Photo',
            x: 50,
            y: 440,
            width: 470,
            height: 540,
            rotation: 0,
            opacity: 1,
            locked: false,
            imageUrl: photoSrc,
            backgroundColor: '#091326',
            borderColor: '#F59E0B',
            borderWidth: 6,
            borderRadius: 22,
          },
          // Right side: Man of the Match Details Box
          {
            id: 'mom-player-box',
            type: 'body',
            label: '4. मैन ऑफ द मैच खिलाड़ी बॉक्स',
            x: 540,
            y: 440,
            width: 490,
            height: 540,
            rotation: 0,
            opacity: 1,
            locked: false,
            text: momBoxText,
            fontFamily: 'Noto Sans Devanagari',
            fontSize: 29,
            fontWeight: '900',
            textAlign: 'center',
            color: '#FFFFFF',
            backgroundColor: '#7C2D12',
            borderColor: '#FDE047',
            borderWidth: 4,
            borderRadius: 22,
            padding: 28,
            lineHeight: 1.48,
          },
          // Presented By (किनके हाथों से मैन ऑफ द मैच दिया गया — नाम और पद)
          {
            id: 'mom-presented-by',
            type: 'title',
            label: '5. अतिथि (किनके हाथों दिया गया) बॉक्स',
            x: 50,
            y: 1005,
            width: 980,
            height: 195,
            rotation: 0,
            opacity: 1,
            locked: false,
            text: `🎖️ जिनके कर-कमलों (हाथों) से मैन ऑफ द मैच दिया गया:\nमाननीय ${momPost.presentedByName || activeProfile.chiefGuest}\nपद / सम्मान: ${momPost.presentedByDesignation || 'मुख्य अतिथि एवं समाजसेवी'}`,
            fontFamily: 'Noto Sans Devanagari',
            fontSize: 29,
            fontWeight: '900',
            textAlign: 'center',
            color: '#0F172A',
            backgroundColor: '#FEF08A',
            borderColor: '#DC2626',
            borderWidth: 4,
            borderRadius: 20,
            padding: 20,
            lineHeight: 1.4,
          },
          {
            id: 'mom-footer',
            type: 'subheading',
            label: '6. नीचे की आयोजक पट्टी',
            x: 50,
            y: 1225,
            width: 980,
            height: 80,
            rotation: 0,
            opacity: 1,
            locked: false,
            text: `आयोजन समिति अध्यक्ष: ${activeProfile.presidentName} | संपर्क: ${activeProfile.contactNumber}`,
            fontFamily: 'Noto Sans Devanagari',
            fontSize: 25,
            fontWeight: '900',
            textAlign: 'center',
            color: '#FFFFFF',
            backgroundColor: '#DC2626',
            borderRadius: 14,
            padding: 18,
          },
        ],
      };
    }

    // -----------------------------------------------------------------------
    // STYLE 2: DAILY MATCH ROUTINE (TODAY'S MATCH VS OR FULL 7-MATCH ROUTINE)
    // -----------------------------------------------------------------------
    if (selectedStyleId === 'tpl-fb-daily-match-routine') {
      if (routineSubMode === 'today-vs') {
        const cleanA = cleanBroadcastName(currentScheduleItem.teamA);
        const cleanB = cleanBroadcastName(currentScheduleItem.teamB);
        return {
          id: `daily-match-vs-${currentScheduleItem.matchNumber}`,
          name: `Match_${currentScheduleItem.matchNumber}_${cleanA}_vs_${cleanB}`,
          nameHi: `आज का मुकाबला — मैच #${currentScheduleItem.matchNumber} (${cleanA} vs ${cleanB})`,
          category: 'schedule',
          theme: 'blue-sports',
          width: 1080,
          height: 1350,
          backgroundColor: '#0B192C',
          backgroundGradient:
            'linear-gradient(180deg, #0B192C 0%, #1E3A8A 55%, #090D16 100%)',
          borderFrameColor: '#F59E0B',
          borderFrameWidth: 12,
          innerBorderColor: '#FDE047',
          updatedAt: new Date().toISOString(),
          version: 1,
          elements: [
            {
              id: 'vs-logo',
              type: 'sticker',
              x: 45,
              y: 40,
              width: 120,
              height: 120,
              rotation: 0,
              opacity: 1,
              locked: false,
              stickerId: 'jale-logo',
              imageUrl: activeProfile.tournamentLogo || undefined,
            },
            {
              id: 'vs-tour',
              type: 'heading',
              label: '1. ऊपर की टूर्नामेंट हेडिंग',
              x: 180,
              y: 40,
              width: 850,
              height: 120,
              rotation: 0,
              opacity: 1,
              locked: false,
              text: `${activeProfile.tournamentName}\n(${activeProfile.seasonNumber}) — डेली मैच रूटीन`,
              fontFamily: 'Noto Sans Devanagari',
              fontSize: 33,
              fontWeight: '900',
              textAlign: 'center',
              color: '#FDE047',
              lineHeight: 1.3,
            },
            {
              id: 'vs-badge',
              type: 'title',
              label: '2. आज का मुकाबला पट्टी',
              x: 60,
              y: 185,
              width: 960,
              height: 85,
              rotation: 0,
              opacity: 1,
              locked: false,
              text: `🏏 आज का मुकाबला • MATCH #${currentScheduleItem.matchNumber} (${currentScheduleItem.stage})`,
              fontFamily: 'Noto Sans Devanagari',
              fontSize: 31,
              fontWeight: '900',
              textAlign: 'center',
              color: '#FFFFFF',
              backgroundColor: '#DC2626',
              borderColor: '#FDE047',
              borderWidth: 3,
              borderRadius: 16,
              padding: 16,
            },
            {
              id: 'vs-team-a',
              type: 'heading',
              label: '3. टीम A का नाम बॉक्स',
              x: 60,
              y: 305,
              width: 960,
              height: 175,
              rotation: 0,
              opacity: 1,
              locked: false,
              text: `🏏 ${cleanA}`,
              fontFamily: 'Noto Sans Devanagari',
              fontSize: 46,
              fontWeight: '900',
              textAlign: 'center',
              color: '#0B192C',
              backgroundColor: '#FDE047',
              borderColor: '#FFFFFF',
              borderWidth: 4,
              borderRadius: 22,
              padding: 40,
            },
            {
              id: 'vs-circle',
              type: 'title',
              label: '4. बीच का VS बॉक्स',
              x: 420,
              y: 505,
              width: 240,
              height: 110,
              rotation: 0,
              opacity: 1,
              locked: false,
              text: 'VS',
              fontFamily: 'Noto Sans Devanagari',
              fontSize: 44,
              fontWeight: '900',
              textAlign: 'center',
              color: '#FFFFFF',
              backgroundColor: '#DC2626',
              borderColor: '#FDE047',
              borderWidth: 4,
              borderRadius: 30,
              padding: 20,
            },
            {
              id: 'vs-team-b',
              type: 'heading',
              label: '5. टीम B का नाम बॉक्स',
              x: 60,
              y: 640,
              width: 960,
              height: 175,
              rotation: 0,
              opacity: 1,
              locked: false,
              text: `🏏 ${cleanB}`,
              fontFamily: 'Noto Sans Devanagari',
              fontSize: 46,
              fontWeight: '900',
              textAlign: 'center',
              color: '#FFFFFF',
              backgroundColor: '#15803D',
              borderColor: '#FDE047',
              borderWidth: 4,
              borderRadius: 22,
              padding: 40,
            },
            {
              id: 'vs-time-venue',
              type: 'body',
              label: '6. दिनांक, समय व स्थान बॉक्स',
              x: 60,
              y: 855,
              width: 960,
              height: 320,
              rotation: 0,
              opacity: 1,
              locked: false,
              text: `📅 दिनांक: ${currentScheduleItem.matchDate}\n⏰ समय: ${currentScheduleItem.matchTime}\n📍 स्थान: ${currentScheduleItem.venue || activeProfile.venue}\n\n🔴 सीधा प्रसारण (Facebook Live) स्कोरिंग व विज्ञापनों के साथ!\nमुख्य अतिथि: ${activeProfile.chiefGuest}`,
              fontFamily: 'Noto Sans Devanagari',
              fontSize: 28,
              fontWeight: '800',
              textAlign: 'center',
              color: '#FDE047',
              backgroundColor: '#091326',
              borderColor: '#38BDF8',
              borderWidth: 3,
              borderRadius: 20,
              padding: 24,
              lineHeight: 1.48,
            },
            {
              id: 'vs-footer',
              type: 'subheading',
              label: '7. नीचे की आयोजक पट्टी',
              x: 60,
              y: 1215,
              width: 960,
              height: 80,
              rotation: 0,
              opacity: 1,
              locked: false,
              text: `आयोजन समिति अध्यक्ष: ${activeProfile.presidentName} | मोबाइल: ${activeProfile.contactNumber}`,
              fontFamily: 'Noto Sans Devanagari',
              fontSize: 25,
              fontWeight: '900',
              textAlign: 'center',
              color: '#0B192C',
              backgroundColor: '#FDE047',
              borderRadius: 14,
              padding: 18,
            },
          ],
        };
      }

      // Full 7-Match Tournament Routine Poster
      const scheduleRows = schedules.map((s) => [
        `मैच #${s.matchNumber}`,
        s.stage,
        cleanBroadcastName(s.teamA),
        cleanBroadcastName(s.teamB),
        `${s.matchDate} (${s.matchTime})`,
      ]);

      return {
        id: 'daily-full-7match-routine',
        name: `${activeProfile.tournamentNameEn}_Full_Match_Routine`,
        nameHi: `${activeProfile.tournamentName} — पूरा मैच रूटीन (Match 1 से Final)`,
        category: 'schedule',
        theme: 'blue-sports',
        width: 1080,
        height: 1350,
        backgroundColor: '#0B192C',
        backgroundGradient:
          'linear-gradient(180deg, #0B192C 0%, #1E3A8A 55%, #090D16 100%)',
        borderFrameColor: '#F59E0B',
        borderFrameWidth: 10,
        innerBorderColor: '#FDE047',
        updatedAt: new Date().toISOString(),
        version: 1,
        elements: [
          {
            id: 'rt-head',
            type: 'heading',
            label: '1. ऊपर की हेडिंग',
            x: 50,
            y: 40,
            width: 980,
            height: 115,
            rotation: 0,
            opacity: 1,
            locked: false,
            text: `${activeProfile.tournamentName} (${activeProfile.seasonNumber})\nपूरा मैच रूटीन (1st, 2nd, 3rd... से Final तक)`,
            fontFamily: 'Noto Sans Devanagari',
            fontSize: 33,
            fontWeight: '900',
            textAlign: 'center',
            color: '#FDE047',
            lineHeight: 1.3,
          },
          {
            id: 'rt-venue',
            type: 'title',
            label: '2. स्थान व समय पट्टी',
            x: 50,
            y: 170,
            width: 980,
            height: 75,
            rotation: 0,
            opacity: 1,
            locked: false,
            text: `📍 स्थान: ${activeProfile.venue} | ⏰ समय: ${activeProfile.matchTime}`,
            fontFamily: 'Noto Sans Devanagari',
            fontSize: 26,
            fontWeight: '900',
            textAlign: 'center',
            color: '#FFFFFF',
            backgroundColor: '#DC2626',
            borderRadius: 14,
            padding: 14,
          },
          {
            id: 'rt-table',
            type: 'table',
            x: 50,
            y: 270,
            width: 980,
            height: 910,
            rotation: 0,
            opacity: 1,
            locked: false,
            headerBgColor: '#F59E0B',
            headerTextColor: '#0B192C',
            borderColor: '#3B82F6',
            fontSize: 21,
            tableHeaders: [
              'मैच #',
              'राउंड (Stage)',
              'टीम A',
              'टीम B',
              'दिनांक व समय',
            ],
            tableRows: scheduleRows,
          },
          {
            id: 'rt-foot',
            type: 'subheading',
            label: '3. नीचे की फुटर पट्टी',
            x: 50,
            y: 1215,
            width: 980,
            height: 80,
            rotation: 0,
            opacity: 1,
            locked: false,
            text: `आयोजन समिति अध्यक्ष: ${activeProfile.presidentName} | मोबाइल: ${activeProfile.contactNumber}`,
            fontFamily: 'Noto Sans Devanagari',
            fontSize: 25,
            fontWeight: '900',
            textAlign: 'center',
            color: '#0B192C',
            backgroundColor: '#FDE047',
            borderRadius: 14,
            padding: 18,
          },
        ],
      };
    }

    // -----------------------------------------------------------------------
    // STYLES 3, 4, 5, 6: 15-PLAYER TEAM SQUAD POSTS & A4 UNDERTAKING FORM
    // -----------------------------------------------------------------------
    const baseTpl =
      templates.find((t) => t.id === selectedStyleId) ||
      templates.find((t) => t.category === 'player-list') ||
      templates[0];

    const tableRows: string[][] = fifteenPlayers.map((pName, idx) => [
      idx < 11 ? `${idx + 1} (Playing XI)` : `${idx + 1} (Extra)`,
      pName || `खिलाड़ी ${idx + 1}`,
    ]);

    const cleanUndertakingRows: string[][] = fifteenPlayers.map(
      (pName, idx) => [
        idx < 11 ? String(idx + 1) : `${idx + 1} (Extra)`,
        pName || '',
      ]
    );

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
    momPost,
    routineSubMode,
    currentScheduleItem,
    schedules,
  ]);

  // Apply any direct post-generation text overrides made by the user
  const liveTeamDesignDoc: DesignDocument = useMemo(() => {
    return {
      ...baseTeamDesignDoc,
      elements: baseTeamDesignDoc.elements.map((el) => {
        const key = `${baseTeamDesignDoc.id}__${el.id}`;
        if (customTextOverrides[key] !== undefined) {
          return {
            ...el,
            text: customTextOverrides[key],
          };
        }
        return el;
      }),
    };
  }, [baseTeamDesignDoc, customTextOverrides]);

  const editableTextElements = useMemo(
    () =>
      liveTeamDesignDoc.elements.filter(
        (el) =>
          el.type === 'heading' ||
          el.type === 'subheading' ||
          el.type === 'title' ||
          el.type === 'body'
      ),
    [liveTeamDesignDoc]
  );

  const activeEditableElement = useMemo(() => {
    if (!selectedPreviewElId) return null;
    return (
      editableTextElements.find((el) => el.id === selectedPreviewElId) || null
    );
  }, [editableTextElements, selectedPreviewElId]);

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
        filename: liveTeamDesignDoc.name.replace(/\s+/g, '_').slice(0, 40),
      });
      setDoneExport(format);
      setTimeout(() => setDoneExport(null), 2200);
    } finally {
      setBusyExport(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4 overflow-x-hidden">
      {/* Top Compact Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0B192C] via-[#1E3A8A] to-[#0B192C] text-white p-4 border border-amber-400/30 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase">
            <Users className="w-4 h-4 shrink-0" />
            <span>
              {t3(
                lang,
                'डेली फेसबुक पोस्ट • मैन ऑफ द मैच • मैच रूटीन • 8 टीमें',
                'Daily Facebook Posts • Man of the Match • Match Routine • 8 Teams',
                'Daily FB Post • Man of the Match • रूटीन • 8 टीमें'
              )}
            </span>
          </div>
          <h2 className="text-base sm:text-xl font-black mt-0.5">
            {t3(
              lang,
              'डेली फेसबुक पोस्टर (मैन ऑफ द मैच, मैच रूटीन व 8-टीम स्क्वाड)',
              'Daily Facebook Poster Studio (MoM Award, Match Routine & 8 Teams)',
              'डेली फेसबुक पोस्टर स्टूडियो (MoM, Match Routine & 8 Teams)'
            )}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => handleDownload('jpg')}
            disabled={busyExport !== null}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
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
                ? '✓ HD JPG'
                : t3(lang, 'HD JPG डाउनलोड', 'Download HD JPG', 'HD JPG डाउनलोड')}
            </span>
          </button>

          <button
            onClick={() => handleDownload('pdf')}
            disabled={busyExport !== null}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs cursor-pointer shadow-md"
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
                ? '✓ HD PDF'
                : t3(lang, 'HD PDF डाउनलोड', 'Download HD PDF', 'HD PDF डाउनलोड')}
            </span>
          </button>
        </div>
      </div>

      {/* 8-TEAM SELECTOR TABS (टीम 1 से टीम 8) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
            {t3(
              lang,
              '8 टीमें (टीम चुनें व खिलाड़ी एडिट करें):',
              'Select Team (1 to 8):',
              '8 टीमें (Select Team 1-8):'
            )}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {teams.map((t, idx) => {
            const active = idx === selectedTeamIdx;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTeamIdx(idx)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? 'bg-[#0B192C] dark:bg-amber-500 text-amber-400 dark:text-slate-950 border-amber-500 ring-2 ring-amber-400/40 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                }`}
              >
                <div className="text-[10px] font-black uppercase opacity-80">
                  {t3(lang, `टीम #${t.teamNumber}`, `TEAM #${t.teamNumber}`, `टीम #${t.teamNumber}`)}
                </div>
                <div className="text-xs font-extrabold truncate mt-0.5">
                  {t.teamName}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN 2-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (7 cols): Team 15 Players List */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-xs">
          {/* Editable Team Name Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                {t3(
                  lang,
                  `टीम #${currentTeam.teamNumber} का नाम:`,
                  `Team #${currentTeam.teamNumber} Name:`,
                  `टीम #${currentTeam.teamNumber} का नाम:`
                )}
              </label>
              <input
                type="text"
                value={currentTeam.teamName}
                onChange={(e) =>
                  handleUpdateTeamField('teamName', e.target.value)
                }
                className="w-full px-3.5 py-2 rounded-xl border-2 border-amber-400 dark:border-amber-500/70 bg-amber-50/40 dark:bg-slate-800 text-sm font-black text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                {t3(lang, 'गाँव / शहर:', 'Village / City:', 'गाँव / शहर:')}
              </label>
              <input
                type="text"
                value={currentTeam.village}
                onChange={(e) =>
                  handleUpdateTeamField('village', e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* 15 Player Names Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {t3(
                lang,
                '15 खिलाड़ियों के नाम (11 Playing + 4 Extra):',
                '15 Player Names (11 Playing + 4 Extra):',
                '15 खिलाड़ी (11 Playing + 4 Extra):'
              )}
            </h3>

            <button
              onClick={handleManualSaveConfirm}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                savedNotice
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#0B192C] dark:bg-amber-500 text-amber-400 dark:text-slate-950'
              }`}
            >
              {savedNotice ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{t3(lang, '✓ सेव', '✓ Saved', '✓ सेव')}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t3(lang, 'सेव करें', 'Save List', 'Save करें')}</span>
                </>
              )}
            </button>
          </div>

          {/* 1 to 11: Main Playing XI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  placeholder={`Player ${idx + 1}`}
                  className="w-full px-2 py-1 bg-transparent text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            ))}
          </div>

          {/* 12 to 15: 4 Extra Players */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
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
                    placeholder={`Extra ${actualIdx + 1}`}
                    className="w-full px-2 py-1 bg-transparent text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): DAILY FACEBOOK POST TEMPLATE SWITCHER + AUTO MOM & ROUTINE CONTROLS + PREVIEW */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-600 dark:text-amber-400">
              <LayoutTemplate className="w-4 h-4" />
              <span>
                {t3(
                  lang,
                  'फेसबुक पोस्ट टेम्पलेट चुनें (1-Click)',
                  'Choose Facebook Post Template (1-Click)',
                  'फेसबुक पोस्ट टेम्पलेट चुनें (1-Click)'
                )}
              </span>
            </div>
          </div>

          {/* 6 Template Style Buttons (MoM Award + Match Routine + 3 Squads + A4 Form) */}
          <div className="grid grid-cols-1 gap-1.5">
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
                      {t3(lang, st.titleHi, st.titleEn, st.titleMix)}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                      active
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {t3(lang, st.badgeHi, st.badgeEn, st.badgeHi)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* =================================================================
              DYNAMIC CONTROL BOX 1: WHEN "1. MAN OF THE MATCH + RESULT POST" IS SELECTED
          ================================================================= */}
          {selectedStyleId === 'tpl-fb-daily-mom-award' && (
            <div className="rounded-2xl bg-slate-900 text-white p-3.5 border-2 border-amber-400 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-2">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>
                    {t3(
                      lang,
                      '🏅 आज का मैन ऑफ द मैच व अतिथि विवरण:',
                      '🏅 Man of the Match & Chief Guest Details:',
                      '🏅 Man of the Match व अतिथि विवरण:'
                    )}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={handleSyncFromLiveMatch}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>
                    {t3(
                      lang,
                      '⚡ लाइव स्कोर से ऑटो-भरें',
                      '⚡ Auto-Fill from Live',
                      '⚡ Live से ऑटो-भरें'
                    )}
                  </span>
                </button>
              </div>

              {/* 1-Click Match Number Selector (1st, 2nd, 3rd... Total 7 Matches) */}
              {schedules.length > 0 && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-300">
                    {t3(
                      lang,
                      'मैच नंबर चुनें (1st, 2nd, 3rd...):',
                      'Select Match (1st, 2nd, 3rd...):',
                      'मैच चुनें (Match 1, 2, 3...):'
                    )}
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {schedules.map((s, idx) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectMatchNumberForMom(idx)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer border ${
                          momPost.matchNumber === s.matchNumber
                            ? 'bg-amber-400 text-slate-950 border-amber-300'
                            : 'bg-slate-800 text-slate-200 border-slate-700'
                        }`}
                      >
                        Match #{s.matchNumber}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Photo Upload Button (उस दिन की फोटो लगाएं) */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-amber-400/50 flex items-center justify-between gap-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const dataUrl = await compressImageFileToDataUrl(file);
                    setMomPost((prev) => ({
                      ...prev,
                      awardPhotoDataUrl: dataUrl,
                    }));
                  }}
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>
                    {momPost.awardPhotoDataUrl
                      ? t3(
                          lang,
                          '📷 फोटो बदलें (Change Photo)',
                          '📷 Change Match Photo',
                          '📷 फोटो बदलें'
                        )
                      : t3(
                          lang,
                          '📷 उस दिन की फोटो लगाएं (Upload Photo)',
                          '📷 Upload Match / Award Photo',
                          '📷 उस दिन की फोटो लगाएं'
                        )}
                  </span>
                </button>

                {momPost.awardPhotoDataUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setMomPost((prev) => ({ ...prev, awardPhotoDataUrl: '' }))
                    }
                    className="p-2 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white cursor-pointer"
                    title="फोटो हटाएं"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Man of the Match Player Name + Performance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-amber-300 mb-0.5">
                    {t3(
                      lang,
                      '🏅 मैन ऑफ द मैच खिलाड़ी:',
                      '🏅 Man of the Match Player:',
                      '🏅 Man of the Match खिलाड़ी:'
                    )}
                  </label>
                  <input
                    type="text"
                    list="all-tournament-players-list"
                    value={momPost.momPlayerName}
                    onChange={(e) =>
                      setMomPost({ ...momPost, momPlayerName: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-black text-amber-300"
                  />
                  <datalist id="all-tournament-players-list">
                    {allTournamentPlayers.map((p, i) => (
                      <option key={i} value={p} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-amber-300 mb-0.5">
                    {t3(
                      lang,
                      '📊 खिलाड़ी का प्रदर्शन (रन/विकेट):',
                      '📊 Player Performance:',
                      '📊 प्रदर्शन (Runs/Wkts):'
                    )}
                  </label>
                  <input
                    type="text"
                    value={momPost.momPlayerStats}
                    onChange={(e) =>
                      setMomPost({ ...momPost, momPlayerStats: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-white"
                  />
                </div>
              </div>

              {/* Optional Prize / Trophy Text (blank = hidden, no hardcoded 501) */}
              <div>
                <label className="block text-[10px] font-bold text-amber-200 mb-0.5">
                  {t3(
                    lang,
                    '🏆 पुरस्कार / इनाम (खाली छोड़ें तो पोस्ट में नहीं दिखेगा):',
                    '🏆 Prize / Award Text (Leave blank to hide):',
                    '🏆 पुरस्कार (खाली छोड़ें तो नहीं दिखेगा):'
                  )}
                </label>
                <input
                  type="text"
                  value={momPost.prizeText || ''}
                  onChange={(e) =>
                    setMomPost({ ...momPost, prizeText: e.target.value })
                  }
                  placeholder="जैसे: आकर्षक ट्रॉफी (खाली छोड़ने पर यह लाइन नहीं दिखेगी)"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-amber-200"
                />
              </div>

              {/* Presented By: Guest Name & Designation (जिनके हाथों से दिया गया — नाम व पद) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/10">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-300 mb-0.5">
                    {t3(
                      lang,
                      '🎖️ किनके हाथों दिया गया (नाम):',
                      '🎖️ Presented By (Guest Name):',
                      '🎖️ किनके हाथों दिया गया (Name):'
                    )}
                  </label>
                  <input
                    type="text"
                    value={momPost.presentedByName}
                    onChange={(e) =>
                      setMomPost({
                        ...momPost,
                        presentedByName: e.target.value,
                      })
                    }
                    placeholder="अतिथि का नाम..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-emerald-500/50 text-xs font-black text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-emerald-300 mb-0.5">
                    {t3(
                      lang,
                      '🏷️ अतिथि का पद / पहचान:',
                      '🏷️ Guest Designation / Role:',
                      '🏷️ पद / पहचान (Designation):'
                    )}
                  </label>
                  <input
                    type="text"
                    value={momPost.presentedByDesignation}
                    onChange={(e) =>
                      setMomPost({
                        ...momPost,
                        presentedByDesignation: e.target.value,
                      })
                    }
                    placeholder="मुख्य अतिथि / मुखिया / समाजसेवी..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-emerald-500/50 text-xs font-bold text-amber-200"
                  />
                </div>
              </div>

              {/* Match Teams, Scores & Winner */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400">
                    {t3(lang, 'टीम A और स्कोर:', 'Team A & Score:', 'टीम A & स्कोर:')}
                  </label>
                  <input
                    type="text"
                    value={momPost.teamA}
                    onChange={(e) =>
                      setMomPost({ ...momPost, teamA: e.target.value })
                    }
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-[11px] font-bold text-white mb-1"
                  />
                  <input
                    type="text"
                    value={momPost.teamAScore}
                    onChange={(e) =>
                      setMomPost({ ...momPost, teamAScore: e.target.value })
                    }
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-[11px] font-mono text-amber-300"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400">
                    {t3(lang, 'टीम B और स्कोर:', 'Team B & Score:', 'टीम B & स्कोर:')}
                  </label>
                  <input
                    type="text"
                    value={momPost.teamB}
                    onChange={(e) =>
                      setMomPost({ ...momPost, teamB: e.target.value })
                    }
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-[11px] font-bold text-white mb-1"
                  />
                  <input
                    type="text"
                    value={momPost.teamBScore}
                    onChange={(e) =>
                      setMomPost({ ...momPost, teamBScore: e.target.value })
                    }
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-[11px] font-mono text-amber-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                  {t3(lang, '🏆 विजेता / परिणाम लाइन:', '🏆 Winner / Result Line:', '🏆 विजेता लाइन:')}
                </label>
                <input
                  type="text"
                  value={momPost.winnerLine}
                  onChange={(e) =>
                    setMomPost({ ...momPost, winnerLine: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-emerald-400"
                />
              </div>
            </div>
          )}

          {/* =================================================================
              DYNAMIC CONTROL BOX 2: WHEN "2. DAILY MATCH ROUTINE" IS SELECTED
          ================================================================= */}
          {selectedStyleId === 'tpl-fb-daily-match-routine' && (
            <div className="rounded-2xl bg-slate-900 text-white p-3.5 border-2 border-amber-400 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {t3(
                      lang,
                      '📅 डेली मैच रूटीन पोस्टर:',
                      '📅 Daily Match Routine Poster:',
                      '📅 डेली मैच रूटीन पोस्टर:'
                    )}
                  </span>
                </span>
              </div>

              {/* Sub-mode Toggle: Today's Match VS vs Full 7-Match Schedule */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setRoutineSubMode('today-vs')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-black cursor-pointer border ${
                    routineSubMode === 'today-vs'
                      ? 'bg-amber-400 text-slate-950 border-amber-300'
                      : 'bg-slate-800 text-slate-200 border-slate-700'
                  }`}
                >
                  {t3(
                    lang,
                    '🏏 आज का मैच (VS पोस्टर)',
                    '🏏 Single Match (VS Post)',
                    '🏏 आज का मैच (VS Post)'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setRoutineSubMode('full-routine')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-black cursor-pointer border ${
                    routineSubMode === 'full-routine'
                      ? 'bg-amber-400 text-slate-950 border-amber-300'
                      : 'bg-slate-800 text-slate-200 border-slate-700'
                  }`}
                >
                  {t3(
                    lang,
                    '📋 पूरा 7-मैच रूटीन',
                    '📋 All 7 Matches Routine',
                    '📋 पूरा 7-मैच रूटीन'
                  )}
                </button>
              </div>

              {routineSubMode === 'today-vs' && (
                <div className="space-y-2 pt-1">
                  <div className="flex flex-wrap gap-1">
                    {schedules.map((s, idx) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedScheduleIdx(idx)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer border ${
                          selectedScheduleIdx === idx
                            ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        Match #{s.matchNumber}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400">
                        {t3(lang, 'टीम A:', 'Team A:', 'टीम A:')}
                      </label>
                      <input
                        type="text"
                        value={currentScheduleItem.teamA}
                        onChange={(e) =>
                          handleUpdateSelectedSchedule({
                            teamA: e.target.value,
                          })
                        }
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400">
                        {t3(lang, 'टीम B:', 'Team B:', 'टीम B:')}
                      </label>
                      <input
                        type="text"
                        value={currentScheduleItem.teamB}
                        onChange={(e) =>
                          handleUpdateSelectedSchedule({
                            teamB: e.target.value,
                          })
                        }
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400">
                        {t3(lang, 'दिनांक:', 'Date:', 'दिनांक:')}
                      </label>
                      <input
                        type="text"
                        value={currentScheduleItem.matchDate}
                        onChange={(e) =>
                          handleUpdateSelectedSchedule({
                            matchDate: e.target.value,
                          })
                        }
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-amber-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400">
                        {t3(lang, 'समय:', 'Time:', 'समय:')}
                      </label>
                      <input
                        type="text"
                        value={currentScheduleItem.matchTime}
                        onChange={(e) =>
                          handleUpdateSelectedSchedule({
                            matchTime: e.target.value,
                          })
                        }
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Live Miniature Canvas Preview (Interactive: Tap any box on the poster to edit its text!) */}
          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex flex-col items-center space-y-2.5">
            <DesignMiniPreview
              doc={liveTeamDesignDoc}
              maxHeight={320}
              selectedElementId={selectedPreviewElId}
              onSelectElement={(elId) => setSelectedPreviewElId(elId)}
            />

            <div className="w-full space-y-2 pt-1 border-t border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="text-[11px] font-extrabold text-amber-400">
                  ✏️ {t3(lang, 'पोस्ट के अंदर की कोई भी लाइन बदलें (पोस्टर पर टच करें):', 'Edit Any Line Inside Post (Tap Poster or Select):', 'पोस्ट की कोई भी लाइन बदलें:')}
                </span>
                {Object.keys(customTextOverrides).some((k) =>
                  k.startsWith(`${baseTeamDesignDoc.id}__`)
                ) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomTextOverrides((prev) => {
                        const next = { ...prev };
                        Object.keys(next).forEach((k) => {
                          if (k.startsWith(`${baseTeamDesignDoc.id}__`)) {
                            delete next[k];
                          }
                        });
                        return next;
                      });
                    }}
                    className="px-2 py-0.5 rounded bg-red-600/30 hover:bg-red-600 text-red-200 hover:text-white text-[10px] font-black cursor-pointer"
                  >
                    ↺ डिफ़ॉल्ट टेक्स्ट रीसेट
                  </button>
                )}
              </div>

              {/* Quick Selector Chips for every text box inside the generated post */}
              <div className="flex flex-wrap gap-1">
                {editableTextElements.map((el, idx) => {
                  const isSel = selectedPreviewElId === el.id;
                  const shortLabel =
                    el.label ||
                    `${idx + 1}. ${(el.text || '').split('\n')[0].slice(0, 18)}`;
                  return (
                    <button
                      key={el.id}
                      type="button"
                      onClick={() =>
                        setSelectedPreviewElId(isSel ? null : el.id)
                      }
                      className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer border transition-all ${
                        isSel
                          ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-400'
                      }`}
                    >
                      {shortLabel}
                    </button>
                  );
                })}
              </div>

              {/* Direct Live Textarea for the Selected Box Inside the Post */}
              {activeEditableElement && (
                <div className="bg-slate-900 p-2.5 rounded-xl border-2 border-emerald-500 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-emerald-400">
                      ✏️ {activeEditableElement.label || 'चयनित बॉक्स का टेक्स्ट बदलें'}:
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPreviewElId(null)}
                      className="text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer"
                    >
                      ✕ बंद करें
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={activeEditableElement.text || ''}
                    onChange={(e) => {
                      const key = `${baseTeamDesignDoc.id}__${activeEditableElement.id}`;
                      setCustomTextOverrides((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }));
                    }}
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons: HD JPG | HD PDF | Editor | Share */}
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
                    ? '✓ HD JPG'
                    : t3(lang, 'HD JPG डाउनलोड', 'Download HD JPG', 'HD JPG डाउनलोड')}
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
                    ? '✓ HD PDF'
                    : t3(lang, 'HD PDF डाउनलोड', 'Download HD PDF', 'HD PDF डाउनलोड')}
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
                  {t3(
                    lang,
                    'एडिटर में खोलें',
                    'Customize in Editor',
                    'Editor में खोलें'
                  )}
                </span>
              </button>

              <button
                onClick={() => shareDesignDocument(liveTeamDesignDoc)}
                className="py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>
                  {t3(lang, 'फेसबुक शेयर करें', 'Share Post', 'Share पोस्ट')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
