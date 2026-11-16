import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Check,
  Copy,
  Eye,
  FileText,
  History,
  Image as ImageIcon,
  Maximize2,
  Megaphone,
  Minimize2,
  Minus,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  Trophy,
  Tv,
  Undo2,
  UserPlus,
} from 'lucide-react';
import {
  BatsmanLiveStat,
  BowlerLiveStat,
  BroadcastCelebrationType,
  BroadcastScreenMode,
  DesignDocument,
  FieldingLiveStat,
  Language,
  LiveBroadcastRoomState,
  LocalSponsorAd,
  OverSummaryRecord,
  TeamSquadRecord,
  TournamentProfile,
  t3,
} from '../types/studio';
import { exportDesignDocument } from '../utils/exportEngine';
import {
  cleanGitHubRepoSlug,
  generatePublicPrismWidgetUrl,
  getPermanentGitHubWidgetUrl,
  pushStateToPublicCloud,
  subscribeToPublicCloud,
} from '../utils/prismCloudOverlay';

const SHARED_CLOUD_ORIGIN =
  'https://ais-pre-jyr2zrqjzkpgapapyfwsme-967710688708.asia-southeast1.run.app';

export const SERIES_STORAGE_KEY = 'jale_cricket_8team_series_records_v1';
export const LATEST_LIVE_STATE_STORAGE_KEY =
  'jale_cricket_latest_live_state_v1';

interface SavedMatchSummaryForSeries {
  id: string;
  matchLabel: string;
  date: string;
  battingTeamName: string;
  bowlingTeamName: string;
  runs: number;
  wickets: number;
  overs: string;
  batsmanRecords: Record<string, BatsmanLiveStat>;
  bowlerRecords: Record<string, BowlerLiveStat>;
  fieldingRecords: Record<string, FieldingLiveStat>;
}

function getApiBaseOrigin(): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  if (
    origin.includes('localhost') &&
    !origin.includes(':3000') &&
    !origin.includes(':5173')
  ) {
    return SHARED_CLOUD_ORIGIN;
  }
  return origin;
}

function getPublicShareOrigin(): string {
  if (typeof window === 'undefined') return SHARED_CLOUD_ORIGIN;
  const origin = window.location.origin;
  if (origin.includes('localhost')) {
    return SHARED_CLOUD_ORIGIN;
  }
  return origin;
}

/**
 * Strips leading numbering ("1. ") and trailing English bracket text ("(Jale Royal XI)")
 * so names never clip or wrap awkwardly on the TV scoreboard.
 */
export function cleanBroadcastName(raw: string | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/^\d+\.\s*/, '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .trim();
}

export function formatBallsToOvers(balls: number): string {
  const o = Math.floor(balls / 6);
  const b = balls % 6;
  return `${o}.${b}`;
}

export function computeAutoAwards(
  batsmanRecords: Record<string, BatsmanLiveStat> = {},
  bowlerRecords: Record<string, BowlerLiveStat> = {},
  fieldingRecords: Record<string, FieldingLiveStat> = {}
) {
  const allPlayerNames = new Set<string>([
    ...Object.keys(batsmanRecords),
    ...Object.keys(bowlerRecords),
    ...Object.keys(fieldingRecords),
  ]);

  const impactList: {
    name: string;
    team: string;
    points: number;
    summary: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    wickets: number;
    ballsBowled: number;
    runsConceded: number;
    catches: number;
    keepings: number;
    runOuts: number;
    saves: number;
  }[] = [];

  allPlayerNames.forEach((name) => {
    if (!name.trim()) return;
    const bat = batsmanRecords[name];
    const bowl = bowlerRecords[name];
    const fld = fieldingRecords[name];

    const runs = bat?.runs || 0;
    const balls = bat?.balls || 0;
    const fours = bat?.fours || 0;
    const sixes = bat?.sixes || 0;
    const wickets = bowl?.wickets || 0;
    const ballsBowled = bowl?.ballsBowled || 0;
    const runsConceded = bowl?.runsConceded || 0;
    const dots = bowl?.dots || 0;
    const catches = fld?.catches || 0;
    const keepings = fld?.keepings || 0;
    const runOuts = fld?.runOuts || 0;
    const saves = fld?.saves || 0;

    // Impact Points Formula for Tennis Ball Tournament
    let points =
      runs * 1.2 +
      fours * 2 +
      sixes * 4 +
      (runs >= 50 ? 20 : runs >= 30 ? 10 : 0) +
      wickets * 25 +
      dots * 1.5 +
      (wickets >= 3 ? 15 : 0) +
      catches * 12 +
      keepings * 15 +
      runOuts * 14 +
      saves * 8;

    points = Math.round(points);

    const parts: string[] = [];
    if (runs > 0 || balls > 0) parts.push(`${runs}(${balls}) रन`);
    if (wickets > 0 || ballsBowled > 0)
      parts.push(`${wickets}/${runsConceded} (${formatBallsToOvers(ballsBowled)} Ov)`);
    if (catches > 0) parts.push(`${catches} कैच`);
    if (keepings > 0) parts.push(`${keepings} कीपिंग`);
    if (runOuts > 0) parts.push(`${runOuts} रन-आउट`);
    if (saves > 0) parts.push(`${saves} बाउंड्री सेव`);

    impactList.push({
      name,
      team: bat?.team || bowl?.team || fld?.team || '',
      points,
      summary: parts.join(' • ') || '0 पॉइंट्स',
      runs,
      balls,
      fours,
      sixes,
      wickets,
      ballsBowled,
      runsConceded,
      catches,
      keepings,
      runOuts,
      saves,
    });
  });

  const manOfTheMatch = [...impactList].sort((a, b) => b.points - a.points)[0] || null;

  const bestBatsman =
    [...impactList]
      .filter((p) => p.runs > 0 || p.balls > 0)
      .sort((a, b) => {
        if (b.runs !== a.runs) return b.runs - a.runs;
        const srA = a.balls > 0 ? a.runs / a.balls : 0;
        const srB = b.balls > 0 ? b.runs / b.balls : 0;
        return srB - srA;
      })[0] || null;

  const bestBowler =
    [...impactList]
      .filter((p) => p.wickets > 0 || p.ballsBowled > 0)
      .sort((a, b) => {
        if (b.wickets !== a.wickets) return b.wickets - a.wickets;
        const ecoA = a.ballsBowled > 0 ? a.runsConceded / (a.ballsBowled / 6) : 99;
        const ecoB = b.ballsBowled > 0 ? b.runsConceded / (b.ballsBowled / 6) : 99;
        return ecoA - ecoB;
      })[0] || null;

  const bestCatch =
    [...impactList]
      .filter((p) => p.catches > 0)
      .sort((a, b) => b.catches - a.catches)[0] || null;

  const bestKeeper =
    [...impactList]
      .filter((p) => p.keepings > 0)
      .sort((a, b) => b.keepings - a.keepings)[0] || null;

  const bestFielder =
    [...impactList]
      .filter((p) => p.catches + p.runOuts + p.saves > 0)
      .sort(
        (a, b) =>
          b.catches * 2 + b.runOuts * 2 + b.saves -
          (a.catches * 2 + a.runOuts * 2 + a.saves)
      )[0] || null;

  return {
    impactList: [...impactList].sort((a, b) => b.points - a.points),
    manOfTheMatch,
    bestBatsman,
    bestBowler,
    bestCatch,
    bestKeeper,
    bestFielder,
  };
}

interface FBLiveBroadcastStudioViewProps {
  lang: Language;
  activeProfile: TournamentProfile;
  teams: TeamSquadRecord[];
  sponsors: LocalSponsorAd[];
  templates: DesignDocument[];
  overlayOnly?: boolean;
  initialRoomId?: string;
  onSaveSponsors?: (list: LocalSponsorAd[]) => void;
}

export const BroadcastOverlayCanvas: React.FC<{
  state: LiveBroadcastRoomState;
  transparentBg?: boolean;
  compactPreview?: boolean;
}> = ({ state, transparentBg = false, compactPreview = false }) => {
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  const showCelebration =
    state.celebration !== 'none' &&
    nowTs - (state.celebrationTimestamp || 0) < 5500;

  const activeSponsor =
    state.sponsorsList[
      state.activeSponsorIndex % Math.max(1, state.sponsorsList.length)
    ] || state.sponsorsList[0];

  const oversDecimal = state.overs + state.balls / 6;
  const crr =
    oversDecimal > 0 ? (state.runs / oversDecimal).toFixed(2) : '0.00';

  const totalBallsRemaining =
    state.totalMatchOvers * 6 - (state.overs * 6 + state.balls);
  const runsNeeded =
    state.targetRuns > 0 ? Math.max(0, state.targetRuns - state.runs) : 0;

  const isScoreVisible = state.showScoreboard !== false;
  const isTopBadgeVisible = state.showTopBadge !== false;

  const cleanTeamA = cleanBroadcastName(state.battingTeamName) || 'टीम A';
  const cleanTeamB = cleanBroadcastName(state.bowlingTeamName) || 'टीम B';
  const cleanStriker = cleanBroadcastName(state.strikerName) || 'बल्लेबाज 1';
  const cleanNonStriker = cleanBroadcastName(state.nonStrikerName) || 'बल्लेबाज 2';
  const cleanBowler = cleanBroadcastName(state.bowlerName) || 'गेंदबाज';

  const lastOverObj =
    state.overHistory && state.overHistory.length > 0
      ? state.overHistory[state.overHistory.length - 1]
      : null;

  const autoAwards = useMemo(
    () =>
      computeAutoAwards(
        state.batsmanRecords,
        state.bowlerRecords,
        state.fieldingRecords
      ),
    [state.batsmanRecords, state.bowlerRecords, state.fieldingRecords]
  );

  return (
    <div
      style={{
        backgroundColor: transparentBg ? 'transparent' : undefined,
      }}
      className={`relative w-full flex flex-col justify-between select-none overflow-hidden ${
        transparentBg
          ? 'min-h-screen h-screen'
          : 'bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950'
      } ${
        compactPreview
          ? 'min-h-[300px] sm:min-h-[350px] rounded-2xl border-2 border-slate-700 shadow-2xl'
          : 'h-full min-h-0'
      }`}
    >
      {/* Simulated Camera Area label only in studio preview */}
      {!transparentBg && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
          <div className="text-center px-4">
            <div className="text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-300">
              📷 LIVE CAMERA VIDEO (85% CLEAR — NO OVERLAP)
            </div>
            {!isScoreVisible && (
              <div className="mt-1 inline-block bg-red-600/80 text-white text-[10px] font-black px-2.5 py-0.5 rounded">
                स्कोरबोर्ड अभी बंद (OFF) है — स्क्रीन पूरी साफ है
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TOP CORNER BUGS (COMPACT & NON-INTRUSIVE)
      ===================================================================== */}
      {isTopBadgeVisible ? (
        <div className="relative z-10 flex items-start justify-between gap-2 px-2.5 pt-2 sm:px-4 sm:pt-3 pointer-events-none shrink-0">
          <div className="flex items-center gap-2 bg-[#0B192C]/95 border border-amber-400/80 px-2.5 py-1 rounded-xl shadow-lg max-w-full">
            <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[9px] sm:text-[11px] font-black px-1.5 py-0.5 rounded animate-pulse shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              LIVE
            </span>
            <div className="leading-tight min-w-0">
              <div className="text-[10px] sm:text-xs font-black text-amber-400 truncate">
                {state.tournamentName}
              </div>
              <div className="text-[8px] sm:text-[10px] font-bold text-slate-300 truncate">
                {state.matchStage} • {state.seasonNumber}
              </div>
            </div>
          </div>

          {state.showSponsorTicker && activeSponsor && (
            <div className="hidden sm:flex flex-col items-end bg-slate-950/90 border border-amber-400/60 px-2.5 py-1 rounded-xl shadow-lg max-w-xs shrink-0">
              <span className="text-[8px] font-black uppercase tracking-wider text-amber-400">
                📢 प्रायोजक (SPONSOR)
              </span>
              <span className="text-[11px] font-black text-white truncate max-w-[200px]">
                {activeSponsor.shopName}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="shrink-0" />
      )}

      {/* =====================================================================
          CENTER DYNAMIC BROADCAST GRAPHICS (SQUAD / SCORECARD / AWARDS / AD / CELEBRATION)
      ===================================================================== */}
      <div className="relative z-20 flex-1 min-h-0 flex items-center justify-center px-2.5 sm:px-6 py-1 pointer-events-none overflow-y-auto">
        {/* 1. 4 / 6 / WICKET CELEBRATION POPUP */}
        {showCelebration && (
          <div className="w-full max-w-2xl rounded-3xl bg-gradient-to-r from-red-700 via-amber-500 to-red-700 p-1 shadow-2xl animate-bounce">
            <div className="bg-[#0B192C] rounded-[20px] px-4 py-3 sm:py-5 text-center space-y-1.5 border-2 border-amber-300">
              <div className="inline-block px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black uppercase tracking-widest">
                {state.celebration === 'SIX'
                  ? '🚀 MAXIMUM SIXER • 6 RUNS!'
                  : state.celebration === 'FOUR'
                  ? '🔥 SUPER BOUNDARY • 4 RUNS!'
                  : state.celebration === 'WICKET'
                  ? '🎯 BIG WICKET DOWN • OUT!'
                  : '⭐ MILESTONE CELEBRATION!'}
              </div>
              <div className="text-xl sm:text-3xl font-black text-white tracking-tight">
                {state.celebrationText}
              </div>
              {activeSponsor && (
                <div className="pt-1.5 border-t border-white/15 text-[11px] sm:text-xs font-extrabold text-amber-300">
                  📢 प्रायोजक:{' '}
                  <span className="text-white">{activeSponsor.shopName}</span> (
                  {activeSponsor.address}) — {activeSponsor.tagline}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. TEAM A OR TEAM B 15-PLAYER SQUAD ON-SCREEN GRAPHIC */}
        {!showCelebration &&
          (state.screenMode === 'squad-team-a' ||
            state.screenMode === 'squad-team-b') && (
            <div className="w-full max-w-3xl rounded-2xl bg-[#0B192C]/96 border-2 border-amber-400 text-white shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-red-700 via-amber-500 to-blue-900 px-3 sm:px-4 py-2 flex items-center justify-between">
                <div>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-950 bg-amber-300 px-2 py-0.5 rounded">
                    15-खिलाड़ी सूची (11 PLAYING XI + 4 EXTRA)
                  </span>
                  <h3 className="text-sm sm:text-lg font-black text-white mt-0.5">
                    🏏{' '}
                    {state.screenMode === 'squad-team-a'
                      ? cleanTeamA
                      : cleanTeamB}
                  </h3>
                </div>
                <div className="text-right text-[10px] font-extrabold text-amber-200">
                  <div>{state.tournamentName}</div>
                  <div className="text-white">{state.venue}</div>
                </div>
              </div>

              <div className="p-2.5 sm:p-3 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {(state.screenMode === 'squad-team-a'
                  ? state.teamAPlayers
                  : state.teamBPlayers
                )
                  .slice(0, 15)
                  .map((pName, idx) => {
                    const isExtra = idx >= 11;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-extrabold ${
                          isExtra
                            ? 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                            : 'bg-slate-900/90 border-white/15 text-white'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-mono font-black shrink-0 ${
                            idx === 0
                              ? 'bg-red-600 text-white'
                              : isExtra
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-blue-700 text-white'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="truncate">
                          {cleanBroadcastName(pName) || `खिलाड़ी ${idx + 1}`}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

        {/* 3. BOTH TEAMS SIDE-BY-SIDE SQUAD COMPARISON */}
        {!showCelebration && state.screenMode === 'squad-vs-both' && (
          <div className="w-full max-w-4xl rounded-2xl bg-[#0B192C]/96 border-2 border-amber-400 text-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-900 via-red-700 to-blue-900 px-3 py-1.5 text-center">
              <div className="text-[9px] font-black text-amber-300 uppercase tracking-widest">
                {state.tournamentName} • दोनों टीमों की 15-खिलाड़ी सूची
              </div>
              <div className="text-xs sm:text-base font-black text-white">
                {cleanTeamA} <span className="text-amber-400 mx-1.5">VS</span>{' '}
                {cleanTeamB}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2.5 sm:p-3">
              <div className="space-y-1">
                <div className="bg-blue-700 text-white px-2 py-1 rounded-lg text-[11px] font-black truncate">
                  🏏 {cleanTeamA}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {state.teamAPlayers.slice(0, 15).map((p, idx) => (
                    <div
                      key={idx}
                      className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-[10px] font-bold truncate"
                    >
                      <span className="text-amber-400 font-mono mr-1">
                        {idx + 1}.
                      </span>
                      {cleanBroadcastName(p)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="bg-red-700 text-white px-2 py-1 rounded-lg text-[11px] font-black truncate">
                  ⚾ {cleanTeamB}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {state.teamBPlayers.slice(0, 15).map((p, idx) => (
                    <div
                      key={idx}
                      className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-[10px] font-bold truncate"
                    >
                      <span className="text-amber-400 font-mono mr-1">
                        {idx + 1}.
                      </span>
                      {cleanBroadcastName(p)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. FULL MATCH SCORECARD ON-SCREEN GRAPHIC */}
        {!showCelebration && state.screenMode === 'full-scorecard' && (
          <div className="w-full max-w-4xl rounded-2xl bg-[#0B192C]/96 border-2 border-amber-400 text-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#091326] via-blue-900 to-[#091326] px-4 py-2 flex items-center justify-between border-b border-amber-400/40">
              <div>
                <div className="text-[10px] font-black text-amber-300 uppercase">
                  📊 पूरा मैच स्कोरकार्ड ({state.tournamentName})
                </div>
                <div className="text-sm sm:text-lg font-black text-white">
                  {cleanTeamA}: {state.runs}/{state.wickets} ({state.overs}.
                  {state.balls} Ov) vs {cleanTeamB}
                </div>
              </div>
              <div className="text-right text-xs font-mono font-black text-amber-400">
                CRR: {crr}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 text-[11px]">
              {/* Batsmen Table */}
              <div className="bg-slate-900/90 rounded-xl p-2 border border-white/10">
                <div className="text-amber-300 font-black mb-1 border-b border-white/10 pb-1 flex justify-between">
                  <span>🏏 बल्लेबाज (Batsmen)</span>
                  <span>R (B) • 4s/6s</span>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {Object.values(state.batsmanRecords || {}).map((b, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-0.5 border-b border-white/5"
                    >
                      <span className="font-bold truncate max-w-[140px]">
                        {cleanBroadcastName(b.name)}{' '}
                        {b.isOut ? (
                          <span className="text-red-400 text-[9px]">
                            ({b.dismissalText || 'OUT'})
                          </span>
                        ) : (
                          <span className="text-emerald-400">*</span>
                        )}
                      </span>
                      <span className="font-mono font-black text-white">
                        {b.runs}({b.balls}){' '}
                        <span className="text-[9px] text-amber-300">
                          [{b.fours}×4, {b.sixes}×6]
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bowlers + Previous Overs */}
              <div className="bg-slate-900/90 rounded-xl p-2 border border-white/10 space-y-2">
                <div>
                  <div className="text-sky-300 font-black mb-1 border-b border-white/10 pb-1 flex justify-between">
                    <span>⚾ गेंदबाज (Bowlers)</span>
                    <span>O - R - W</span>
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {Object.values(state.bowlerRecords || {}).map((bw, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-0.5 border-b border-white/5"
                      >
                        <span className="font-bold truncate max-w-[140px]">
                          {cleanBroadcastName(bw.name)}
                        </span>
                        <span className="font-mono font-black text-white">
                          {formatBallsToOvers(bw.ballsBowled)} -{' '}
                          {bw.runsConceded} -{' '}
                          <span className="text-amber-400">{bw.wickets}W</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. AUTOMATIC AWARDS CEREMONY ON-SCREEN GRAPHIC */}
        {!showCelebration && state.screenMode === 'awards-ceremony' && (
          <div className="w-full max-w-3xl rounded-2xl bg-gradient-to-br from-[#0B192C] via-slate-900 to-[#0B192C] border-2 border-amber-400 text-white shadow-2xl p-3 sm:p-4 space-y-2.5">
            <div className="text-center border-b border-amber-400/30 pb-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                🏆 ऑटोमैटिक मैच अवार्ड्स लीडरबोर्ड ({state.tournamentName})
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-amber-500/20 border border-amber-400 rounded-xl p-2">
                <div className="text-[10px] font-black text-amber-300">
                  🏅 MAN OF THE MATCH
                </div>
                <div className="font-black text-white truncate mt-0.5">
                  {cleanBroadcastName(autoAwards.manOfTheMatch?.name) || '—'}
                </div>
                <div className="text-[10px] text-amber-200 truncate">
                  {autoAwards.manOfTheMatch?.summary || ''}
                </div>
              </div>
              <div className="bg-blue-500/20 border border-blue-400 rounded-xl p-2">
                <div className="text-[10px] font-black text-sky-300">
                  🏏 BEST BATSMAN
                </div>
                <div className="font-black text-white truncate mt-0.5">
                  {cleanBroadcastName(autoAwards.bestBatsman?.name) || '—'}
                </div>
                <div className="text-[10px] text-sky-200 truncate">
                  {autoAwards.bestBatsman
                    ? `${autoAwards.bestBatsman.runs} रन (${autoAwards.bestBatsman.balls} गेंद)`
                    : ''}
                </div>
              </div>
              <div className="bg-emerald-500/20 border border-emerald-400 rounded-xl p-2">
                <div className="text-[10px] font-black text-emerald-300">
                  ⚾ BEST BOWLER
                </div>
                <div className="font-black text-white truncate mt-0.5">
                  {cleanBroadcastName(autoAwards.bestBowler?.name) || '—'}
                </div>
                <div className="text-[10px] text-emerald-200 truncate">
                  {autoAwards.bestBowler
                    ? `${autoAwards.bestBowler.wickets} विकेट (${autoAwards.bestBowler.runsConceded} रन)`
                    : ''}
                </div>
              </div>
              <div className="bg-purple-500/20 border border-purple-400 rounded-xl p-2">
                <div className="text-[10px] font-black text-purple-300">
                  🙌 BEST CATCH
                </div>
                <div className="font-black text-white truncate mt-0.5">
                  {cleanBroadcastName(autoAwards.bestCatch?.name) || '—'}
                </div>
                <div className="text-[10px] text-purple-200">
                  {autoAwards.bestCatch
                    ? `${autoAwards.bestCatch.catches} कैच`
                    : 'कोई कैच दर्ज नहीं'}
                </div>
              </div>
              <div className="bg-rose-500/20 border border-rose-400 rounded-xl p-2">
                <div className="text-[10px] font-black text-rose-300">
                  🧤 BEST KEEPING
                </div>
                <div className="font-black text-white truncate mt-0.5">
                  {cleanBroadcastName(autoAwards.bestKeeper?.name) || '—'}
                </div>
                <div className="text-[10px] text-rose-200">
                  {autoAwards.bestKeeper
                    ? `${autoAwards.bestKeeper.keepings} स्टंप/कैच`
                    : 'कोई कीपिंग दर्ज नहीं'}
                </div>
              </div>
              <div className="bg-teal-500/20 border border-teal-400 rounded-xl p-2">
                <div className="text-[10px] font-black text-teal-300">
                  ⚡ BEST FIELDER
                </div>
                <div className="font-black text-white truncate mt-0.5">
                  {cleanBroadcastName(autoAwards.bestFielder?.name) || '—'}
                </div>
                <div className="text-[10px] text-teal-200">
                  {autoAwards.bestFielder
                    ? `${
                        autoAwards.bestFielder.catches +
                        autoAwards.bestFielder.runOuts +
                        autoAwards.bestFielder.saves
                      } फील्डिंग पॉइंट्स`
                    : 'कोई फील्डिंग दर्ज नहीं'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. FULL-SCREEN BREAK SPONSOR AD */}
        {!showCelebration &&
          state.screenMode === 'full-sponsor-ad' &&
          activeSponsor && (
            <div className="w-full max-w-2xl rounded-3xl bg-gradient-to-br from-[#0B192C] via-[#1E3A8A] to-[#0B192C] border-4 border-amber-400 p-4 sm:p-6 text-center text-white shadow-2xl space-y-2">
              <span className="inline-block px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black uppercase">
                📢 टूर्नामेंट प्रायोजक विज्ञापन (OFFICIAL SPONSOR)
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-amber-300 leading-tight">
                🏪 {activeSponsor.shopName}
              </h2>
              <p className="text-xs sm:text-base font-extrabold text-white bg-red-600/90 py-1.5 px-3 rounded-xl">
                “{activeSponsor.tagline}”
              </p>
              <div className="text-xs sm:text-sm font-bold text-sky-200 space-y-0.5 pt-0.5">
                <div>📍 पता: {activeSponsor.address}</div>
                <div className="text-amber-300 text-xs sm:text-base font-black">
                  👤 प्रोप्राइटर: {activeSponsor.ownerName} • 📞 मोबाइल:{' '}
                  {activeSponsor.mobile}
                </div>
              </div>
            </div>
          )}
      </div>

      {/* =====================================================================
          BOTTOM TV LOWER-THIRD SCOREBOARD + AUTO SPONSOR AD (ZERO CLIPPING!)
      ===================================================================== */}
      <div className="relative z-20 w-full px-2 sm:px-3.5 pb-2.5 sm:pb-3.5 space-y-1.5 pointer-events-none shrink-0">
        {/* Main TV Score Strip — Redesigned so NOTHING ever gets cut off or wrapped awkwardly */}
        {isScoreVisible && (
          <div className="w-full rounded-2xl bg-gradient-to-r from-[#091326]/98 via-[#1E3A8A]/98 to-[#091326]/98 border-2 border-amber-400 shadow-2xl px-2.5 sm:px-4 py-1.5 sm:py-2 text-white space-y-1">
            {/* ROW 1: FULL-WIDTH TEAMS + TOTAL SCORE + TARGET/CRR (NO TRUNCATION!) */}
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-white/15 pb-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
                <span className="text-xs sm:text-sm font-black text-amber-300">
                  {cleanTeamA}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-300">
                  vs {cleanTeamB}
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white tabular-nums ml-1">
                  {state.runs}/{state.wickets}
                </span>
                <span className="text-[11px] sm:text-xs font-mono font-extrabold text-amber-400">
                  ({state.overs}.{state.balls}/{state.totalMatchOvers} Ov)
                </span>
              </div>

              <div className="flex items-center gap-2 ml-auto shrink-0">
                <span className="text-[10px] font-extrabold text-sky-300">
                  CRR: {crr}
                </span>
                {state.targetRuns > 0 ? (
                  runsNeeded <= 0 ? (
                    <span className="text-[10px] sm:text-[11px] font-black bg-amber-400 px-2 py-0.5 rounded text-slate-950">
                      🏆 {cleanTeamA} विजयी! (Target {state.targetRuns} पूरा)
                    </span>
                  ) : (
                    <span className="text-[10px] sm:text-[11px] font-black bg-emerald-600 px-2 py-0.5 rounded text-white">
                      Target: {state.targetRuns} (Need {runsNeeded} in{' '}
                      {Math.max(0, totalBallsRemaining)}b)
                    </span>
                  )
                ) : (
                  <span className="text-[10px] font-bold text-amber-200">
                    {state.tossOrStatusNote}
                  </span>
                )}
              </div>
            </div>

            {/* ROW 2: BOTH BATSMEN + CURRENT BOWLER + THIS OVER & LAST OVER */}
            <div className="grid grid-cols-12 gap-1.5 sm:gap-2 items-center text-[11px] sm:text-xs">
              {/* Both Batsmen */}
              <div className="col-span-7 sm:col-span-5 grid grid-cols-1 gap-0.5 border-r border-white/15 pr-1.5">
                <div className="flex items-center justify-between font-black text-amber-300">
                  <span className="truncate">🏏 {cleanStriker}*</span>
                  <span className="font-mono tabular-nums ml-1 shrink-0">
                    {state.strikerRuns}
                    <span className="text-[10px] text-slate-300">
                      ({state.strikerBalls})
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between font-bold text-slate-200">
                  <span className="truncate">🏏 {cleanNonStriker}</span>
                  <span className="font-mono tabular-nums ml-1 shrink-0">
                    {state.nonStrikerRuns}
                    <span className="text-[10px] text-slate-400">
                      ({state.nonStrikerBalls})
                    </span>
                  </span>
                </div>
              </div>

              {/* Current Bowler + This Over & Last Over */}
              <div className="col-span-5 sm:col-span-7 flex flex-col justify-between pl-0.5 gap-0.5">
                <div className="flex items-center justify-between font-extrabold text-sky-300">
                  <span className="truncate">⚾ {cleanBowler}</span>
                  <span className="font-mono text-white ml-1 shrink-0">
                    {state.bowlerWickets}-{state.bowlerRuns}{' '}
                    <span className="text-[10px] text-amber-300">
                      ({state.bowlerOvers || '0.0'})
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">
                      Over:
                    </span>
                    {(state.thisOverBalls.length > 0
                      ? state.thisOverBalls
                      : ['•']
                    ).map((b, idx) => (
                      <span
                        key={idx}
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono font-black shrink-0 ${
                          b === '6'
                            ? 'bg-amber-400 text-slate-950'
                            : b === '4'
                            ? 'bg-emerald-500 text-white'
                            : b === 'W'
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-800 text-slate-200 border border-white/20'
                        }`}
                      >
                        {b}
                      </span>
                    ))}
                  </div>

                  {lastOverObj && (
                    <span className="hidden sm:inline-block text-[9px] font-bold text-amber-200 bg-slate-900/90 px-1.5 py-0.5 rounded border border-white/10 truncate">
                      पिछला ओवर ({cleanBroadcastName(lastOverObj.bowlerName)}):{' '}
                      {lastOverObj.runs} रन, {lastOverObj.wickets}W
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Automatic Rotating Sponsor Ad Strip — Hides when showSponsorTicker is OFF */}
        {state.showSponsorTicker && activeSponsor && (
          <div className="w-full rounded-xl bg-amber-400 text-slate-950 px-2.5 sm:px-3.5 py-1 border-2 border-red-600 shadow-lg flex flex-wrap items-center justify-between gap-1.5 text-[10px] sm:text-xs font-black">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[9px] uppercase shrink-0">
                विज्ञापन
              </span>
              <span className="truncate">
                🏪 {activeSponsor.shopName} ({activeSponsor.address}) —{' '}
                <span className="text-red-800">{activeSponsor.tagline}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 bg-slate-950 text-amber-300 px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px]">
              <span>प्रो०: {activeSponsor.ownerName}</span>
              <span>•</span>
              <span>📞 {activeSponsor.mobile}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const FBLiveBroadcastStudioView: React.FC<
  FBLiveBroadcastStudioViewProps
> = ({
  lang,
  activeProfile,
  teams,
  sponsors,
  templates,
  overlayOnly = false,
  initialRoomId,
  onSaveSponsors,
}) => {
  const [roomId, setRoomId] = useState<string>(() =>
    (initialRoomId || 'JALE-2026').toUpperCase()
  );
  const [syncConnected, setSyncConnected] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const [fullscreenMonitor, setFullscreenMonitor] = useState<boolean>(false);
  const [laptopFullControl, setLaptopFullControl] = useState<boolean>(false);
  const [prismWidgetUrl, setPrismWidgetUrl] = useState<string>(() =>
    getPermanentGitHubWidgetUrl()
  );
  const [showNoBallSubMenu, setShowNoBallSubMenu] = useState<boolean>(false);

  // Automatic Wicket -> Next Batsman & Fielding Credit prompt
  const [needsNextBatsman, setNeedsNextBatsman] = useState<boolean>(false);
  const [customNextBatsman, setCustomNextBatsman] = useState<string>('');
  const [outDismissalType, setOutDismissalType] = useState<
    'Catch' | 'Keeping' | 'RunOut' | 'Bowled'
  >('Catch');
  const [outFielderCredited, setOutFielderCredited] = useState<string>('');

  // Automatic Over Complete -> Next Bowler prompt
  const [needsNextBowler, setNeedsNextBowler] = useState<boolean>(false);
  const [customNextBowler, setCustomNextBowler] = useState<string>('');

  // Quick Fielding / Catch / Keeping Credit selector
  const [selectedFielderForCredit, setSelectedFielderForCredit] =
    useState<string>('');

  // Saved 8-Team Tournament Series Matches in localStorage
  const [seriesMatches, setSeriesMatches] = useState<
    SavedMatchSummaryForSeries[]
  >(() => {
    try {
      const raw = localStorage.getItem(SERIES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Build initial default state (or restore from localStorage so switching tabs keeps live match)
  const [liveState, setLiveState] = useState<LiveBroadcastRoomState>(() => {
    try {
      const savedRaw = localStorage.getItem(LATEST_LIVE_STATE_STORAGE_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw) as LiveBroadcastRoomState;
        if (parsed && typeof parsed.runs === 'number') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    const teamA = teams[0];
    const teamB = teams[1];
    const cleanA = cleanBroadcastName(teamA?.teamName) || 'जाले रॉयल इलेवन';
    const cleanB = cleanBroadcastName(teamB?.teamName) || 'दरभंगा टाइगर्स';
    const striker = teamA?.players[0] || '1. मिर्ज़ा सैफ बेग (कप्तान)';
    const nonStriker = teamA?.players[1] || '2. मो० अरमान खान (उपकप्तान)';
    const bowler = teamB?.players[0] || '1. अमित कुमार झा (कप्तान)';

    return {
      roomId: (initialRoomId || 'JALE-2026').toUpperCase(),
      tournamentName: activeProfile.tournamentName,
      seasonNumber: activeProfile.seasonNumber,
      venue: activeProfile.venue,
      matchStage: 'QUARTER FINAL #1',
      battingTeamId: teamA?.id || 'team-1',
      battingTeamName: cleanA,
      bowlingTeamId: teamB?.id || 'team-2',
      bowlingTeamName: cleanB,
      runs: 0,
      wickets: 0,
      overs: 0,
      balls: 0,
      totalMatchOvers: 16,
      targetRuns: 0,
      tossOrStatusNote: 'टॉस जीतकर पहले बल्लेबाजी',
      strikerName: striker,
      strikerRuns: 0,
      strikerBalls: 0,
      strikerFours: 0,
      strikerSixes: 0,
      nonStrikerName: nonStriker,
      nonStrikerRuns: 0,
      nonStrikerBalls: 0,
      nonStrikerFours: 0,
      nonStrikerSixes: 0,
      bowlerName: bowler,
      bowlerWickets: 0,
      bowlerRuns: 0,
      bowlerOvers: '0.0',
      bowlerBalls: 0,
      thisOverBalls: [],
      overHistory: [],
      batsmanRecords: {
        [striker]: {
          name: striker,
          team: cleanA,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          dismissalText: 'Not Out',
        },
        [nonStriker]: {
          name: nonStriker,
          team: cleanA,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          dismissalText: 'Not Out',
        },
      },
      bowlerRecords: {
        [bowler]: {
          name: bowler,
          team: cleanB,
          ballsBowled: 0,
          runsConceded: 0,
          wickets: 0,
          dots: 0,
          foursConceded: 0,
          sixesConceded: 0,
        },
      },
      fieldingRecords: {},
      screenMode: 'score-ticker',
      celebration: 'none',
      celebrationText: '',
      celebrationTimestamp: 0,
      activeSponsorIndex: 0,
      autoRotateAds: true,
      autoRotateSeconds: 20,
      showScoreboard: true,
      showSponsorTicker: true,
      showTopBadge: true,
      customTickerMessage: '',
      teamAPlayers: teamA?.players || [],
      teamBPlayers: teamB?.players || [],
      sponsorsList: sponsors.map((s) => ({
        id: s.id,
        shopName: s.shopName,
        ownerName: s.ownerName,
        address: s.address,
        mobile: s.mobile,
        tagline: s.tagline,
      })),
      extras: 0,
      wides: 0,
      noBalls: 0,
      byes: 0,
      legByes: 0,
      updatedAt: Date.now(),
    };
  });

  // 30-Step Score History Stack for 1-Tap UNDO when scoring mistakes happen!
  const [undoStack, setUndoStack] = useState<LiveBroadcastRoomState[]>([]);

  // Quick Add Sponsor Form
  const [quickShop, setQuickShop] = useState({
    shopName: '',
    ownerName: '',
    address: 'मेन मार्केट, जाले',
    mobile: activeProfile.contactNumber,
    tagline: 'सभी ग्राहकों के लिए विशेष छूट!',
  });

  const wsRef = useRef<WebSocket | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const isApplyingRemoteRef = useRef<boolean>(false);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  // Push state to Server + BroadcastChannel (and optionally record in undoStack)
  const pushLiveState = useCallback(
    (nextState: LiveBroadcastRoomState, saveHistory = false) => {
      if (saveHistory) {
        setUndoStack((prev) => [...prev.slice(-29), liveState]);
      }

      const stamped: LiveBroadcastRoomState = {
        ...nextState,
        roomId,
        updatedAt: Date.now(),
      };
      setLiveState(stamped);

      try {
        localStorage.setItem(
          LATEST_LIVE_STATE_STORAGE_KEY,
          JSON.stringify(stamped)
        );
      } catch {
        // ignore
      }

      if (isApplyingRemoteRef.current) return;

      try {
        bcRef.current?.postMessage(stamped);
      } catch {
        // ignore
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'room:push',
            roomId,
            state: stamped,
          })
        );
      }

      const apiBase = getApiBaseOrigin();
      fetch(`${apiBase}/api/live-room/${encodeURIComponent(roomId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: stamped }),
      }).catch(() => {});

      // Also push to 100% public cloud sync (works across Android APK, PRISM Live & Laptop anywhere!)
      pushStateToPublicCloud(roomId, stamped).catch(() => {});
    },
    [roomId, liveState]
  );

  // 1-Tap UNDO Last Ball / Mistake Handler
  const handleUndoLastMistake = () => {
    if (undoStack.length === 0) {
      triggerToast('कोई पिछला रिकॉर्ड नहीं है');
      return;
    }
    const previousState = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setNeedsNextBatsman(false);
    setNeedsNextBowler(false);
    pushLiveState(
      {
        ...previousState,
        celebration: 'none',
      },
      false
    );
    triggerToast('↩️ पिछली गेंद / गलती वापस सुधार दी गई!');
  };

  // Connect to Real-Time Room
  useEffect(() => {
    const cleanRoom = roomId.toUpperCase();

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(`jale-live-${cleanRoom}`);
      bc.onmessage = (ev) => {
        if (ev.data && ev.data.updatedAt) {
          isApplyingRemoteRef.current = true;
          setLiveState(ev.data);
          setTimeout(() => {
            isApplyingRemoteRef.current = false;
          }, 40);
        }
      };
      bcRef.current = bc;
    }

    const apiBase = getApiBaseOrigin();
    fetch(`${apiBase}/api/live-room/${encodeURIComponent(cleanRoom)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.state && data.updatedAt) {
          isApplyingRemoteRef.current = true;
          setLiveState(data.state as LiveBroadcastRoomState);
          setSyncConnected(true);
          setTimeout(() => {
            isApplyingRemoteRef.current = false;
          }, 40);
        }
      })
      .catch(() => {});

    let es: EventSource | null = null;
    try {
      es = new EventSource(
        `${apiBase}/api/live-room/${encodeURIComponent(cleanRoom)}/stream`
      );
      es.onopen = () => setSyncConnected(true);
      es.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(ev.data);
          if (parsed?.state) {
            isApplyingRemoteRef.current = true;
            setLiveState(parsed.state as LiveBroadcastRoomState);
            setSyncConnected(true);
            setTimeout(() => {
              isApplyingRemoteRef.current = false;
            }, 40);
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }

    let ws: WebSocket | null = null;
    try {
      const wsProto = apiBase.startsWith('https') ? 'wss' : 'ws';
      const hostPart = apiBase.replace(/^https?:\/\//, '');
      ws = new WebSocket(`${wsProto}://${hostPart}/ws-live`);
      ws.onopen = () => {
        setSyncConnected(true);
        ws?.send(JSON.stringify({ type: 'room:join', roomId: cleanRoom }));
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data));
          if (msg.type === 'room:update' && msg.payload?.state) {
            isApplyingRemoteRef.current = true;
            setLiveState(msg.payload.state as LiveBroadcastRoomState);
            setTimeout(() => {
              isApplyingRemoteRef.current = false;
            }, 40);
          }
        } catch {
          // ignore
        }
      };
      ws.onclose = () => setSyncConnected(false);
      wsRef.current = ws;
    } catch {
      // ignore
    }

    // Subscribe to public internet cloud sync (ntfy.sh WebSocket + Poll)
    const unsubPublic = subscribeToPublicCloud(cleanRoom, (remoteState) => {
      isApplyingRemoteRef.current = true;
      setLiveState(remoteState);
      setSyncConnected(true);
      setTimeout(() => {
        isApplyingRemoteRef.current = false;
      }, 40);
    });

    return () => {
      bcRef.current?.close();
      es?.close();
      ws?.close();
      unsubPublic();
    };
  }, [roomId]);

  // Always set the 100% Permanent GitHub PRISM Live URL and sync state
  useEffect(() => {
    if (overlayOnly) return;
    const permUrl = getPermanentGitHubWidgetUrl();
    setPrismWidgetUrl(permUrl);
    generatePublicPrismWidgetUrl(roomId, liveState)
      .then(() => setSyncConnected(true))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, overlayOnly]);

  // Automatic Sponsor Ad Rotation Timer
  useEffect(() => {
    if (overlayOnly) return;
    if (!liveState.autoRotateAds || liveState.sponsorsList.length <= 1) return;

    const intervalMs = Math.max(8, liveState.autoRotateSeconds || 20) * 1000;
    const timer = setInterval(() => {
      setLiveState((prev) => {
        const nextIdx =
          (prev.activeSponsorIndex + 1) %
          Math.max(1, prev.sponsorsList.length);
        const updated: LiveBroadcastRoomState = {
          ...prev,
          activeSponsorIndex: nextIdx,
          updatedAt: Date.now(),
        };
        const apiBase = getApiBaseOrigin();
        fetch(`${apiBase}/api/live-room/${encodeURIComponent(roomId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: updated }),
        }).catch(() => {});
        pushStateToPublicCloud(roomId, updated).catch(() => {});
        return updated;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [
    overlayOnly,
    liveState.autoRotateAds,
    liveState.autoRotateSeconds,
    liveState.sponsorsList.length,
    roomId,
  ]);

  useEffect(() => {
    if (overlayOnly) return;
    setLiveState((prev) => ({
      ...prev,
      sponsorsList: sponsors.map((s) => ({
        id: s.id,
        shopName: s.shopName,
        ownerName: s.ownerName,
        address: s.address,
        mobile: s.mobile,
        tagline: s.tagline,
      })),
    }));
  }, [sponsors, overlayOnly]);

  // =====================================================================
  // BALL-BY-BALL SCORING HANDLER (WITH WIDE, NO-BALL, BYE, LEG-BYE & RECORDS)
  // =====================================================================
  const handleBallScore = (
    runsAdded: number,
    options?: {
      isWicket?: boolean;
      extraType?: 'WD' | 'NB' | 'B' | 'LB';
      batRunsOnNoBall?: number;
      celebration?: BroadcastCelebrationType;
    }
  ) => {
    const isWicket = options?.isWicket || false;
    const extraType = options?.extraType;
    const batRunsOnNoBall = options?.batRunsOnNoBall || 0;

    // Wide (WD) and No-Ball (NB) do NOT count as a legal ball in the over.
    // Bye (B) and Leg-Bye (LB) DO count as a legal ball in the over.
    const isIllegalDelivery = extraType === 'WD' || extraType === 'NB';

    const totalRunsOnDelivery =
      extraType === 'NB' ? 1 + batRunsOnNoBall : runsAdded;

    let nextBalls = isIllegalDelivery ? liveState.balls : liveState.balls + 1;
    let nextOvers = liveState.overs;

    const ballBadge = isWicket
      ? 'W'
      : extraType === 'WD'
      ? runsAdded > 1
        ? `WD+${runsAdded - 1}`
        : 'WD'
      : extraType === 'NB'
      ? batRunsOnNoBall > 0
        ? `NB+${batRunsOnNoBall}`
        : 'NB'
      : extraType === 'B'
      ? `B${runsAdded}`
      : extraType === 'LB'
      ? `LB${runsAdded}`
      : String(runsAdded);

    const fullOverBalls = [...liveState.thisOverBalls, ballBadge];
    let nextThisOver = fullOverBalls.slice(-8);
    let overCompleted = false;
    const nextOverHistory: OverSummaryRecord[] = [
      ...(liveState.overHistory || []),
    ];

    if (nextBalls >= 6) {
      nextOvers += 1;
      nextBalls = 0;
      overCompleted = true;

      // Calculate runs and wickets in this completed over
      const overRuns = fullOverBalls.reduce((sum, b) => {
        if (b === 'W') return sum;
        if (b === 'WD' || b === 'NB') return sum + 1;
        if (b.startsWith('WD+') || b.startsWith('NB+')) {
          const extraNum = parseInt(b.split('+')[1] || '0', 10);
          return sum + 1 + (isNaN(extraNum) ? 0 : extraNum);
        }
        if (b.startsWith('B') || b.startsWith('LB')) {
          const num = parseInt(b.replace(/^LB|^B/, ''), 10);
          return sum + (isNaN(num) ? 1 : num);
        }
        const parsed = parseInt(b, 10);
        return sum + (isNaN(parsed) ? 0 : parsed);
      }, 0);
      const overWickets = fullOverBalls.filter((b) => b === 'W').length;

      nextOverHistory.push({
        overNumber: nextOvers,
        bowlerName: liveState.bowlerName,
        balls: fullOverBalls,
        runs: overRuns,
        wickets: overWickets,
      });

      nextThisOver = [];
    }

    // Update Batsman Record:
    // - Normal legal ball: +runsAdded to batsman, +1 ball faced
    // - No-Ball (NB): +batRunsOnNoBall to batsman, +1 ball faced
    // - Wide (WD): +0 runs to batsman, +0 balls faced
    // - Bye (B) / Leg-Bye (LB): +0 runs to batsman, +1 ball faced
    const currentBatsmanRecords: Record<string, BatsmanLiveStat> = {
      ...(liveState.batsmanRecords || {}),
    };
    const prevStrikerRec = currentBatsmanRecords[liveState.strikerName] || {
      name: liveState.strikerName,
      team: liveState.battingTeamName,
      runs: liveState.strikerRuns,
      balls: liveState.strikerBalls,
      fours: liveState.strikerFours || 0,
      sixes: liveState.strikerSixes || 0,
      isOut: false,
      dismissalText: 'Not Out',
    };

    const batsmanRunsEarned = !extraType
      ? runsAdded
      : extraType === 'NB'
      ? batRunsOnNoBall
      : 0;
    const batsmanBallCounted = extraType === 'WD' ? 0 : 1;

    const nextStrikerRuns = prevStrikerRec.runs + batsmanRunsEarned;
    const nextStrikerBalls = prevStrikerRec.balls + batsmanBallCounted;
    const nextStrikerFours =
      batsmanRunsEarned === 4 ? prevStrikerRec.fours + 1 : prevStrikerRec.fours;
    const nextStrikerSixes =
      batsmanRunsEarned === 6 ? prevStrikerRec.sixes + 1 : prevStrikerRec.sixes;

    currentBatsmanRecords[liveState.strikerName] = {
      ...prevStrikerRec,
      runs: nextStrikerRuns,
      balls: nextStrikerBalls,
      fours: nextStrikerFours,
      sixes: nextStrikerSixes,
      isOut: isWicket ? true : prevStrikerRec.isOut,
      dismissalText: isWicket
        ? `b ${cleanBroadcastName(liveState.bowlerName)}`
        : prevStrikerRec.dismissalText,
    };

    if (!currentBatsmanRecords[liveState.nonStrikerName]) {
      currentBatsmanRecords[liveState.nonStrikerName] = {
        name: liveState.nonStrikerName,
        team: liveState.battingTeamName,
        runs: liveState.nonStrikerRuns,
        balls: liveState.nonStrikerBalls,
        fours: liveState.nonStrikerFours || 0,
        sixes: liveState.nonStrikerSixes || 0,
        isOut: false,
        dismissalText: 'Not Out',
      };
    }

    // Update Bowler Record:
    // - Byes (B) & Leg-Byes (LB) count as legal balls bowled, but runs do NOT go against bowler's runsConceded
    // - Wides (WD) & No-Balls (NB) do NOT count as legal balls bowled, and runs DO go against bowler's runsConceded
    const currentBowlerRecords: Record<string, BowlerLiveStat> = {
      ...(liveState.bowlerRecords || {}),
    };
    const prevBowlerRec = currentBowlerRecords[liveState.bowlerName] || {
      name: liveState.bowlerName,
      team: liveState.bowlingTeamName,
      ballsBowled: liveState.bowlerBalls || 0,
      runsConceded: liveState.bowlerRuns,
      wickets: liveState.bowlerWickets,
      dots: 0,
      foursConceded: 0,
      sixesConceded: 0,
    };

    const nextBowlerBalls = isIllegalDelivery
      ? prevBowlerRec.ballsBowled
      : prevBowlerRec.ballsBowled + 1;
    const bowlerRunsCharged =
      extraType === 'B' || extraType === 'LB' ? 0 : totalRunsOnDelivery;
    const nextBowlerRuns = Math.max(
      0,
      prevBowlerRec.runsConceded + bowlerRunsCharged
    );
    const nextBowlerWickets = isWicket
      ? prevBowlerRec.wickets + 1
      : prevBowlerRec.wickets;
    const nextBowlerDots =
      !isIllegalDelivery && totalRunsOnDelivery === 0
        ? prevBowlerRec.dots + 1
        : prevBowlerRec.dots;

    currentBowlerRecords[liveState.bowlerName] = {
      ...prevBowlerRec,
      ballsBowled: nextBowlerBalls,
      runsConceded: nextBowlerRuns,
      wickets: nextBowlerWickets,
      dots: nextBowlerDots,
      foursConceded:
        batsmanRunsEarned === 4
          ? prevBowlerRec.foursConceded + 1
          : prevBowlerRec.foursConceded,
      sixesConceded:
        batsmanRunsEarned === 6
          ? prevBowlerRec.sixesConceded + 1
          : prevBowlerRec.sixesConceded,
    };

    // Swap strike on odd physical runs (1, 3) on legal balls, Byes, Leg-Byes, or No-Ball bat runs
    const physicalRunsCrossed =
      extraType === 'WD'
        ? Math.max(0, runsAdded - 1)
        : extraType === 'NB'
        ? batRunsOnNoBall
        : runsAdded;
    const oddRunSwap =
      physicalRunsCrossed === 1 || physicalRunsCrossed === 3;
    const shouldSwapStrike = overCompleted ? !oddRunSwap : oddRunSwap;

    const celebrationType: BroadcastCelebrationType =
      options?.celebration ||
      (isWicket
        ? 'WICKET'
        : batsmanRunsEarned === 6
        ? 'SIX'
        : batsmanRunsEarned === 4
        ? 'FOUR'
        : 'none');

    const celebrationText =
      celebrationType === 'SIX'
        ? `${cleanBroadcastName(liveState.strikerName)} — शानदार छक्का (6 RUNS)!`
        : celebrationType === 'FOUR'
        ? `${cleanBroadcastName(liveState.strikerName)} — दर्शनीय चौका (4 RUNS)!`
        : celebrationType === 'WICKET'
        ? `OUT! विकेट गिरा (${cleanBroadcastName(liveState.strikerName)})`
        : '';

    if (isWicket) {
      setNeedsNextBatsman(true);
      setOutFielderCredited('');
      setCustomNextBatsman('');
    }

    if (overCompleted) {
      setNeedsNextBowler(true);
      setCustomNextBowler('');
    }

    const extraRunsAdded =
      extraType === 'WD'
        ? runsAdded
        : extraType === 'NB'
        ? 1
        : extraType === 'B' || extraType === 'LB'
        ? runsAdded
        : 0;

    setShowNoBallSubMenu(false);

    const nextState: LiveBroadcastRoomState = {
      ...liveState,
      runs: Math.max(0, liveState.runs + totalRunsOnDelivery),
      wickets: isWicket
        ? Math.min(10, liveState.wickets + 1)
        : liveState.wickets,
      overs: nextOvers,
      balls: nextBalls,
      extras: (liveState.extras || 0) + extraRunsAdded,
      wides:
        (liveState.wides || 0) + (extraType === 'WD' ? runsAdded : 0),
      noBalls:
        (liveState.noBalls || 0) + (extraType === 'NB' ? 1 : 0),
      byes:
        (liveState.byes || 0) + (extraType === 'B' ? runsAdded : 0),
      legByes:
        (liveState.legByes || 0) + (extraType === 'LB' ? runsAdded : 0),
      strikerName: shouldSwapStrike
        ? liveState.nonStrikerName
        : liveState.strikerName,
      strikerRuns: shouldSwapStrike
        ? liveState.nonStrikerRuns
        : nextStrikerRuns,
      strikerBalls: shouldSwapStrike
        ? liveState.nonStrikerBalls
        : nextStrikerBalls,
      strikerFours: shouldSwapStrike
        ? liveState.nonStrikerFours
        : nextStrikerFours,
      strikerSixes: shouldSwapStrike
        ? liveState.nonStrikerSixes
        : nextStrikerSixes,
      nonStrikerName: shouldSwapStrike
        ? liveState.strikerName
        : liveState.nonStrikerName,
      nonStrikerRuns: shouldSwapStrike
        ? nextStrikerRuns
        : liveState.nonStrikerRuns,
      nonStrikerBalls: shouldSwapStrike
        ? nextStrikerBalls
        : liveState.nonStrikerBalls,
      nonStrikerFours: shouldSwapStrike
        ? nextStrikerFours
        : liveState.nonStrikerFours,
      nonStrikerSixes: shouldSwapStrike
        ? nextStrikerSixes
        : liveState.nonStrikerSixes,
      bowlerRuns: nextBowlerRuns,
      bowlerWickets: nextBowlerWickets,
      bowlerBalls: nextBowlerBalls,
      bowlerOvers: formatBallsToOvers(nextBowlerBalls),
      thisOverBalls: nextThisOver,
      overHistory: nextOverHistory,
      batsmanRecords: currentBatsmanRecords,
      bowlerRecords: currentBowlerRecords,
      celebration: celebrationType,
      celebrationText,
      celebrationTimestamp: celebrationType !== 'none' ? Date.now() : 0,
    };

    pushLiveState(nextState, true);
  };

  // Switch Batsman (either from 15-player list or custom typed name)
  const handleConfirmNextBatsman = (playerName: string) => {
    const cleanInput = playerName.trim();
    if (!cleanInput) return;

    const currentBatsmanRecords: Record<string, BatsmanLiveStat> = {
      ...(liveState.batsmanRecords || {}),
    };
    const existing = currentBatsmanRecords[cleanInput] || {
      name: cleanInput,
      team: liveState.battingTeamName,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      dismissalText: 'Not Out',
    };
    currentBatsmanRecords[cleanInput] = {
      ...existing,
      isOut: false,
      dismissalText: 'Not Out',
    };

    // If striker was the one who got out (or swapped on over end), put new batsman on the out slot
    const strikerRec = currentBatsmanRecords[liveState.strikerName];
    const replaceNonStriker =
      strikerRec && !strikerRec.isOut && currentBatsmanRecords[liveState.nonStrikerName]?.isOut;

    if (replaceNonStriker) {
      pushLiveState(
        {
          ...liveState,
          nonStrikerName: cleanInput,
          nonStrikerRuns: existing.runs,
          nonStrikerBalls: existing.balls,
          nonStrikerFours: existing.fours,
          nonStrikerSixes: existing.sixes,
          batsmanRecords: currentBatsmanRecords,
        },
        true
      );
    } else {
      pushLiveState(
        {
          ...liveState,
          strikerName: cleanInput,
          strikerRuns: existing.runs,
          strikerBalls: existing.balls,
          strikerFours: existing.fours,
          strikerSixes: existing.sixes,
          batsmanRecords: currentBatsmanRecords,
        },
        true
      );
    }

    setNeedsNextBatsman(false);
    setCustomNextBatsman('');
    triggerToast(`✓ नया बल्लेबाज "${cleanBroadcastName(cleanInput)}" क्रीज पर!`);
  };

  // Switch Bowler (either on Over completion or manually, restoring their previous match spell!)
  const handleSelectBowlerWithRecord = (bowlerName: string) => {
    const cleanInput = bowlerName.trim();
    if (!cleanInput) return;

    const currentBowlerRecords: Record<string, BowlerLiveStat> = {
      ...(liveState.bowlerRecords || {}),
    };
    const existing = currentBowlerRecords[cleanInput] || {
      name: cleanInput,
      team: liveState.bowlingTeamName,
      ballsBowled: 0,
      runsConceded: 0,
      wickets: 0,
      dots: 0,
      foursConceded: 0,
      sixesConceded: 0,
    };
    currentBowlerRecords[cleanInput] = existing;

    pushLiveState(
      {
        ...liveState,
        bowlerName: cleanInput,
        bowlerRuns: existing.runsConceded,
        bowlerWickets: existing.wickets,
        bowlerBalls: existing.ballsBowled,
        bowlerOvers: formatBallsToOvers(existing.ballsBowled),
        bowlerRecords: currentBowlerRecords,
      },
      true
    );

    setNeedsNextBowler(false);
    setCustomNextBowler('');
    triggerToast(
      `⚾ नया गेंदबाज "${cleanBroadcastName(cleanInput)}" (${formatBallsToOvers(
        existing.ballsBowled
      )} Ov, ${existing.runsConceded}R, ${existing.wickets}W) तैयार!`
    );
  };

  // Record Fielding / Catch / Keeping Credit for Best Catch, Best Keeper, Best Fielder Awards
  const handleAddFieldingCredit = (
    playerName: string,
    type: 'Catch' | 'Keeping' | 'RunOut' | 'Save'
  ) => {
    if (!playerName.trim()) return;
    const nextFielding: Record<string, FieldingLiveStat> = {
      ...(liveState.fieldingRecords || {}),
    };
    const prev = nextFielding[playerName] || {
      name: playerName,
      team: liveState.bowlingTeamName,
      catches: 0,
      keepings: 0,
      runOuts: 0,
      saves: 0,
    };

    nextFielding[playerName] = {
      ...prev,
      catches: type === 'Catch' ? prev.catches + 1 : prev.catches,
      keepings: type === 'Keeping' ? prev.keepings + 1 : prev.keepings,
      runOuts: type === 'RunOut' ? prev.runOuts + 1 : prev.runOuts,
      saves: type === 'Save' ? prev.saves + 1 : prev.saves,
    };

    pushLiveState(
      {
        ...liveState,
        fieldingRecords: nextFielding,
      },
      true
    );
    setOutFielderCredited(playerName);
    const labelMap = {
      Catch: '🙌 +1 कैच (Catch)',
      Keeping: '🧤 +1 कीपिंग / स्टंपिंग',
      RunOut: '🎯 +1 रन-आउट',
      Save: '⚡ +1 शानदार फील्डिंग सेव',
    };
    triggerToast(
      `✓ ${cleanBroadcastName(playerName)} के नाम ${labelMap[type]} जुड़ गया!`
    );
  };

  // Quick Manual +/- Mistake Fixer Handler
  const handleQuickAdjust = (
    field: 'runs' | 'wickets' | 'balls' | 'overs',
    delta: number
  ) => {
    const next = { ...liveState };
    if (field === 'runs') {
      next.runs = Math.max(0, liveState.runs + delta);
      next.strikerRuns = Math.max(0, liveState.strikerRuns + delta);
    } else if (field === 'wickets') {
      next.wickets = Math.max(0, Math.min(10, liveState.wickets + delta));
    } else if (field === 'balls') {
      let b = liveState.balls + delta;
      let o = liveState.overs;
      if (b >= 6) {
        o += 1;
        b = 0;
      } else if (b < 0) {
        if (o > 0) {
          o -= 1;
          b = 5;
        } else {
          b = 0;
        }
      }
      next.overs = o;
      next.balls = b;
    } else if (field === 'overs') {
      next.overs = Math.max(0, liveState.overs + delta);
    }
    pushLiveState(next, true);
  };

  const handleSelectTeamA = (teamId: string) => {
    const found = teams.find((t) => t.id === teamId);
    if (!found) return;
    const cleanName = cleanBroadcastName(found.teamName);
    const p1 = found.players[0] || 'बल्लेबाज 1';
    const p2 = found.players[1] || 'बल्लेबाज 2';
    const nextBatsmen: Record<string, BatsmanLiveStat> = {
      ...(liveState.batsmanRecords || {}),
      [p1]: liveState.batsmanRecords?.[p1] || {
        name: p1,
        team: cleanName,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        dismissalText: 'Not Out',
      },
      [p2]: liveState.batsmanRecords?.[p2] || {
        name: p2,
        team: cleanName,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        dismissalText: 'Not Out',
      },
    };
    pushLiveState(
      {
        ...liveState,
        battingTeamId: found.id,
        battingTeamName: cleanName,
        teamAPlayers: found.players,
        strikerName: p1,
        strikerRuns: nextBatsmen[p1].runs,
        strikerBalls: nextBatsmen[p1].balls,
        nonStrikerName: p2,
        nonStrikerRuns: nextBatsmen[p2].runs,
        nonStrikerBalls: nextBatsmen[p2].balls,
        batsmanRecords: nextBatsmen,
      },
      true
    );
  };

  const handleSelectTeamB = (teamId: string) => {
    const found = teams.find((t) => t.id === teamId);
    if (!found) return;
    const cleanName = cleanBroadcastName(found.teamName);
    const b1 = found.players[0] || 'गेंदबाज 1';
    const nextBowlers: Record<string, BowlerLiveStat> = {
      ...(liveState.bowlerRecords || {}),
      [b1]: liveState.bowlerRecords?.[b1] || {
        name: b1,
        team: cleanName,
        ballsBowled: 0,
        runsConceded: 0,
        wickets: 0,
        dots: 0,
        foursConceded: 0,
        sixesConceded: 0,
      },
    };
    pushLiveState(
      {
        ...liveState,
        bowlingTeamId: found.id,
        bowlingTeamName: cleanName,
        teamBPlayers: found.players,
        bowlerName: b1,
        bowlerRuns: nextBowlers[b1].runsConceded,
        bowlerWickets: nextBowlers[b1].wickets,
        bowlerBalls: nextBowlers[b1].ballsBowled,
        bowlerOvers: formatBallsToOvers(nextBowlers[b1].ballsBowled),
        bowlerRecords: nextBowlers,
      },
      true
    );
  };

  // Automatic 2nd Innings Starter: Sets Target = (1st Innings Runs + 1), swaps Batting & Bowling teams, and resets 2nd Innings score to 0/0 while keeping full player records
  const handleStartSecondInnings = () => {
    const autoTarget = Math.max(1, liveState.runs + 1);
    const prevBattingTeamId = liveState.battingTeamId;
    const prevBattingTeamName = liveState.battingTeamName;
    const prevTeamAPlayers = [...(liveState.teamAPlayers || [])];

    const nextBattingTeamId = liveState.bowlingTeamId;
    const nextBattingTeamName = liveState.bowlingTeamName;
    const nextTeamAPlayers = [...(liveState.teamBPlayers || [])];

    const nextBowlingTeamId = prevBattingTeamId;
    const nextBowlingTeamName = prevBattingTeamName;
    const nextTeamBPlayers = prevTeamAPlayers;

    const newStriker = nextTeamAPlayers[0] || 'बल्लेबाज 1';
    const newNonStriker = nextTeamAPlayers[1] || 'बल्लेबाज 2';
    const newBowler = nextTeamBPlayers[0] || 'गेंदबाज 1';

    const nextBatsmen: Record<string, BatsmanLiveStat> = {
      ...(liveState.batsmanRecords || {}),
      [newStriker]: liveState.batsmanRecords?.[newStriker] || {
        name: newStriker,
        team: nextBattingTeamName,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        dismissalText: 'Not Out',
      },
      [newNonStriker]: liveState.batsmanRecords?.[newNonStriker] || {
        name: newNonStriker,
        team: nextBattingTeamName,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        dismissalText: 'Not Out',
      },
    };

    const nextBowlers: Record<string, BowlerLiveStat> = {
      ...(liveState.bowlerRecords || {}),
      [newBowler]: liveState.bowlerRecords?.[newBowler] || {
        name: newBowler,
        team: nextBowlingTeamName,
        ballsBowled: 0,
        runsConceded: 0,
        wickets: 0,
        dots: 0,
        foursConceded: 0,
        sixesConceded: 0,
      },
    };

    setNeedsNextBatsman(false);
    setNeedsNextBowler(false);

    pushLiveState(
      {
        ...liveState,
        firstInningsTeamName: prevBattingTeamName,
        firstInningsRuns: liveState.runs,
        firstInningsWickets: liveState.wickets,
        firstInningsOvers: `${liveState.overs}.${liveState.balls}`,
        targetRuns: autoTarget,
        battingTeamId: nextBattingTeamId,
        battingTeamName: nextBattingTeamName,
        bowlingTeamId: nextBowlingTeamId,
        bowlingTeamName: nextBowlingTeamName,
        teamAPlayers: nextTeamAPlayers,
        teamBPlayers: nextTeamBPlayers,
        runs: 0,
        wickets: 0,
        overs: 0,
        balls: 0,
        extras: 0,
        wides: 0,
        noBalls: 0,
        byes: 0,
        legByes: 0,
        strikerName: newStriker,
        strikerRuns: nextBatsmen[newStriker].runs,
        strikerBalls: nextBatsmen[newStriker].balls,
        strikerFours: nextBatsmen[newStriker].fours,
        strikerSixes: nextBatsmen[newStriker].sixes,
        nonStrikerName: newNonStriker,
        nonStrikerRuns: nextBatsmen[newNonStriker].runs,
        nonStrikerBalls: nextBatsmen[newNonStriker].balls,
        nonStrikerFours: nextBatsmen[newNonStriker].fours,
        nonStrikerSixes: nextBatsmen[newNonStriker].sixes,
        bowlerName: newBowler,
        bowlerRuns: nextBowlers[newBowler].runsConceded,
        bowlerWickets: nextBowlers[newBowler].wickets,
        bowlerBalls: nextBowlers[newBowler].ballsBowled,
        bowlerOvers: formatBallsToOvers(nextBowlers[newBowler].ballsBowled),
        thisOverBalls: [],
        batsmanRecords: nextBatsmen,
        bowlerRecords: nextBowlers,
        tossOrStatusNote: `${nextBattingTeamName} को जीत के लिए ${liveState.totalMatchOvers} ओवर में ${autoTarget} रन चाहिए`,
        celebration: 'none',
      },
      true
    );

    triggerToast(
      t3(
        lang,
        `🎯 दूसरी पारी शुरू! ${nextBattingTeamName} के लिए टारगेट: ${autoTarget} रन`,
        `🎯 2nd Innings Started! Target for ${nextBattingTeamName}: ${autoTarget} Runs`,
        `🎯 2nd Innings शुरू! Target: ${autoTarget} रन`
      )
    );
  };

  // Save current match into 8-Team Tournament Series History for Man of the Series
  const handleSaveMatchToSeries = () => {
    const entry: SavedMatchSummaryForSeries = {
      id: `match-${Date.now()}`,
      matchLabel: `${liveState.battingTeamName} vs ${liveState.bowlingTeamName}`,
      date: new Date().toLocaleDateString('hi-IN'),
      battingTeamName: liveState.battingTeamName,
      bowlingTeamName: liveState.bowlingTeamName,
      runs: liveState.runs,
      wickets: liveState.wickets,
      overs: `${liveState.overs}.${liveState.balls}`,
      batsmanRecords: liveState.batsmanRecords || {},
      bowlerRecords: liveState.bowlerRecords || {},
      fieldingRecords: liveState.fieldingRecords || {},
    };
    const updated = [entry, ...seriesMatches];
    setSeriesMatches(updated);
    try {
      localStorage.setItem(SERIES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    triggerToast(
      '🏆 यह मैच 8-टीम टूर्नामेंट सीरीज़ रिकॉर्ड में जुड़ गया! (Man of the Series अपडेटेड)'
    );
  };

  // Compute Current Match Automatic Awards
  const currentMatchAwards = useMemo(
    () =>
      computeAutoAwards(
        liveState.batsmanRecords,
        liveState.bowlerRecords,
        liveState.fieldingRecords
      ),
    [
      liveState.batsmanRecords,
      liveState.bowlerRecords,
      liveState.fieldingRecords,
    ]
  );

  // Compute Cumulative 8-Team Series Awards (All Saved Matches + Current Match)
  const seriesCumulativeAwards = useMemo(() => {
    const mergedBat: Record<string, BatsmanLiveStat> = {};
    const mergedBowl: Record<string, BowlerLiveStat> = {};
    const mergedFld: Record<string, FieldingLiveStat> = {};

    const allSources = [
      ...seriesMatches,
      {
        batsmanRecords: liveState.batsmanRecords || {},
        bowlerRecords: liveState.bowlerRecords || {},
        fieldingRecords: liveState.fieldingRecords || {},
      },
    ];

    allSources.forEach((src) => {
      Object.values(src.batsmanRecords || {}).forEach((b) => {
        const prev = mergedBat[b.name];
        mergedBat[b.name] = {
          name: b.name,
          team: b.team,
          runs: (prev?.runs || 0) + b.runs,
          balls: (prev?.balls || 0) + b.balls,
          fours: (prev?.fours || 0) + b.fours,
          sixes: (prev?.sixes || 0) + b.sixes,
          isOut: b.isOut,
          dismissalText: b.dismissalText,
        };
      });
      Object.values(src.bowlerRecords || {}).forEach((bw) => {
        const prev = mergedBowl[bw.name];
        mergedBowl[bw.name] = {
          name: bw.name,
          team: bw.team,
          ballsBowled: (prev?.ballsBowled || 0) + bw.ballsBowled,
          runsConceded: (prev?.runsConceded || 0) + bw.runsConceded,
          wickets: (prev?.wickets || 0) + bw.wickets,
          dots: (prev?.dots || 0) + bw.dots,
          foursConceded: (prev?.foursConceded || 0) + bw.foursConceded,
          sixesConceded: (prev?.sixesConceded || 0) + bw.sixesConceded,
        };
      });
      Object.values(src.fieldingRecords || {}).forEach((fl) => {
        const prev = mergedFld[fl.name];
        mergedFld[fl.name] = {
          name: fl.name,
          team: fl.team,
          catches: (prev?.catches || 0) + fl.catches,
          keepings: (prev?.keepings || 0) + fl.keepings,
          runOuts: (prev?.runOuts || 0) + fl.runOuts,
          saves: (prev?.saves || 0) + fl.saves,
        };
      });
    });

    return computeAutoAwards(mergedBat, mergedBowl, mergedFld);
  }, [
    seriesMatches,
    liveState.batsmanRecords,
    liveState.bowlerRecords,
    liveState.fieldingRecords,
  ]);

  const overlayUrl = useMemo(() => {
    return prismWidgetUrl || getPermanentGitHubWidgetUrl();
  }, [prismWidgetUrl]);

  const handleCopyPrismLink = async () => {
    const permUrl = getPermanentGitHubWidgetUrl();
    setPrismWidgetUrl(permUrl);
    try {
      await pushStateToPublicCloud(roomId, liveState);
      await navigator.clipboard?.writeText(permUrl);
      triggerToast(
        t3(
          lang,
          '✓ परमानेंट PRISM Live लिंक कॉपी हो गया!',
          '✓ Permanent PRISM Live Link Copied!',
          '✓ Permanent PRISM Live लिंक कॉपी हो गया!'
        )
      );
    } catch {
      navigator.clipboard?.writeText(permUrl);
      triggerToast('✓ PRISM Live Link Copied!');
    }
  };

  if (overlayOnly) {
    return <BroadcastOverlayCanvas state={liveState} transparentBg={true} />;
  }

  return (
    <div
      className={`${
        laptopFullControl
          ? 'fixed inset-0 z-50 bg-slate-950 overflow-y-auto p-3 sm:p-5'
          : 'w-full max-w-[1600px] mx-auto p-3 sm:p-5'
      } space-y-4 overflow-x-hidden`}
    >
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-300 text-xs font-extrabold">
          <Check className="w-4 h-4 shrink-0 stroke-[3]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Fullscreen TV Overlay Monitor Modal (Zero Bottom Clipping!) */}
      {fullscreenMonitor && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-black/90 text-white border-b border-white/10 shrink-0">
            <span className="text-xs font-black text-amber-400">
              🔴 FULL-SCREEN LIVE OVERLAY PREVIEW (ROOM: {roomId})
            </span>
            <button
              onClick={() => setFullscreenMonitor(false)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-black cursor-pointer shrink-0"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>वापस कंट्रोलर पर जाएं</span>
            </button>
          </div>
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            <BroadcastOverlayCanvas state={liveState} transparentBg={false} />
          </div>
        </div>
      )}

      {/* =====================================================================
          TOP BAR: CLEAN SINGLE PERMANENT PRISM LINK + ROOM CODE + FULLSCREEN
      ===================================================================== */}
      <div className="rounded-2xl bg-[#0B192C] text-white p-3.5 border-2 border-amber-500/60 shadow-lg space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase">
              <Radio className="w-3 h-3 animate-pulse" />
              LIVE STUDIO
            </span>
            <h1 className="text-sm sm:text-base font-black text-amber-400">
              {t3(
                lang,
                'फेसबुक लाइव स्कोरर व कंट्रोल रूम',
                'FB Live Scorer & Control Room',
                'FB Live स्कोरर & कंट्रोल रूम'
              )}
            </h1>
            <span className="text-[11px] font-bold text-emerald-400">
              {syncConnected ? '● Connected' : '● Syncing...'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-700">
              <span className="text-[11px] font-bold text-slate-400">
                {t3(lang, 'कोड:', 'Room:', 'कोड:')}
              </span>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="w-20 bg-transparent text-amber-300 font-mono font-black text-xs uppercase focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setFullscreenMonitor(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer border border-slate-700"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t3(lang, 'टीवी प्रिव्यू', 'TV Preview', 'TV प्रिव्यू')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextMode = !laptopFullControl;
                setLaptopFullControl(nextMode);
                if (nextMode && !document.fullscreenElement) {
                  document.documentElement
                    .requestFullscreen?.()
                    .catch(() => {});
                } else if (!nextMode && document.fullscreenElement) {
                  document.exitFullscreen?.().catch(() => {});
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs cursor-pointer border transition-colors ${
                laptopFullControl
                  ? 'bg-red-600 text-white border-red-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
              }`}
            >
              {laptopFullControl ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>{t3(lang, 'फुल-स्क्रीन बंद', 'Exit Fullscreen', 'Full Screen बंद')}</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>{t3(lang, 'लैपटॉप फुल स्क्रीन', 'Full Screen', 'लैपटॉप Full Screen')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* SINGLE PERMANENT PRISM LIVE LINK BAR (ONLY ONE LINK & ONE COPY BUTTON!) */}
        <div className="flex items-center gap-2 bg-slate-950/90 p-2 rounded-xl border border-emerald-500/40">
          <span className="text-[11px] font-black text-emerald-400 shrink-0 hidden sm:inline">
            {t3(lang, '♾️ PRISM लिंक:', '♾️ PRISM Link:', '♾️ PRISM लिंक:')}
          </span>
          <input
            type="text"
            readOnly
            value={overlayUrl}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-mono text-xs"
          />
          <button
            type="button"
            onClick={handleCopyPrismLink}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shrink-0 shadow-xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{t3(lang, 'लिंक कॉपी करें', 'Copy Link', 'Copy लिंक')}</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          3 SIMPLE ON/OFF TOGGLE SWITCHES
      ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Toggle 1: Live Scoreboard ON/OFF */}
        <button
          type="button"
          onClick={() => {
            const nextVal = !(liveState.showScoreboard !== false);
            pushLiveState({ ...liveState, showScoreboard: nextVal });
          }}
          className={`p-2.5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${
            liveState.showScoreboard !== false
              ? 'bg-emerald-600 text-white border-emerald-300 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800'
          }`}
        >
          <div className="text-left">
            <div className="text-xs font-black uppercase">
              {t3(lang, '1. स्कोरबोर्ड', '1. Scoreboard', '1. स्कोरबोर्ड (Scoreboard)')}
            </div>
            <div className="text-[10px] font-bold opacity-90">
              {liveState.showScoreboard !== false
                ? t3(lang, 'चालू (ON)', 'Visible (ON)', 'चालू (ON)')
                : t3(lang, 'बंद (OFF)', 'Hidden (OFF)', 'बंद (OFF)')}
            </div>
          </div>
          <div
            className={`w-12 h-6 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
              liveState.showScoreboard !== false
                ? 'bg-slate-950/40 justify-end'
                : 'bg-slate-300 dark:bg-slate-700 justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-md" />
          </div>
        </button>

        {/* Toggle 2: Bottom Sponsor Ad Strip ON/OFF */}
        <button
          type="button"
          onClick={() => {
            const nextVal = !liveState.showSponsorTicker;
            pushLiveState({ ...liveState, showSponsorTicker: nextVal });
          }}
          className={`p-2.5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${
            liveState.showSponsorTicker
              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800'
          }`}
        >
          <div className="text-left">
            <div className="text-xs font-black uppercase">
              {t3(lang, '2. विज्ञापन पट्टी', '2. Sponsor Ads Bar', '2. विज्ञापन पट्टी (Ads)')}
            </div>
            <div className="text-[10px] font-bold opacity-90">
              {liveState.showSponsorTicker
                ? t3(lang, 'चालू (ON)', 'Visible (ON)', 'चालू (ON)')
                : t3(lang, 'बंद (OFF)', 'Hidden (OFF)', 'बंद (OFF)')}
            </div>
          </div>
          <div
            className={`w-12 h-6 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
              liveState.showSponsorTicker
                ? 'bg-slate-950/40 justify-end'
                : 'bg-slate-300 dark:bg-slate-700 justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-md" />
          </div>
        </button>

        {/* Toggle 3: Automatic Ad Rotation Every 20s ON/OFF */}
        <button
          type="button"
          onClick={() => {
            const nextVal = !liveState.autoRotateAds;
            pushLiveState({ ...liveState, autoRotateAds: nextVal });
          }}
          className={`p-2.5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${
            liveState.autoRotateAds
              ? 'bg-blue-600 text-white border-blue-300 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800'
          }`}
        >
          <div className="text-left">
            <div className="text-xs font-black uppercase">
              {t3(lang, '3. ऑटो विज्ञापन', '3. Auto Rotate Ads', '3. ऑटो विज्ञापन (Auto Ads)')}
            </div>
            <div className="text-[10px] font-bold opacity-90">
              {liveState.autoRotateAds
                ? t3(lang, `हर ${liveState.autoRotateSeconds}s में (ON)`, `Every ${liveState.autoRotateSeconds}s (ON)`, `हर ${liveState.autoRotateSeconds}s में (ON)`)
                : t3(lang, 'बंद (OFF)', 'Manual (OFF)', 'बंद (OFF)')}
            </div>
          </div>
          <div
            className={`w-12 h-6 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
              liveState.autoRotateAds
                ? 'bg-slate-950/40 justify-end'
                : 'bg-slate-300 dark:bg-slate-700 justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-md" />
          </div>
        </button>
      </div>

      {/* =====================================================================
          MAIN WORKSPACE: WIDESCREEN LAPTOP & MOBILE GRID
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT 7 COLUMNS: SCORING PAD + AUTO PLAYER SELECTORS + LIVE MATCH RECORDS + AUTO AWARDS */}
        <div className="lg:col-span-7 space-y-5">
          {/* CARD A: SUPER-SIMPLE SCORING PAD + MISTAKE FIXER + AUTO NEXT BATSMAN & NEXT BOWLER */}
          <div className="bg-[#0B192C] text-white rounded-3xl border-2 border-amber-500/60 p-4 sm:p-5 space-y-4 shadow-xl">
            {/* Score Display + BIG UNDO LAST MISTAKE BUTTON */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/90 p-3.5 rounded-2xl border border-white/10">
              <div>
                <div className="text-xs font-extrabold text-amber-400">
                  🏏 {liveState.battingTeamName}{' '}
                  <span className="text-slate-400">
                    vs {liveState.bowlingTeamName}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-white tabular-nums">
                    {liveState.runs}/{liveState.wickets}
                  </span>
                  <span className="text-sm sm:text-base font-mono font-bold text-amber-400">
                    ({liveState.overs}.{liveState.balls} Overs)
                  </span>
                </div>
              </div>

              {/* BIG MISTAKE UNDO BUTTON */}
              <button
                type="button"
                onClick={handleUndoLastMistake}
                disabled={undoStack.length === 0}
                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs sm:text-sm cursor-pointer shadow-lg active:scale-95"
              >
                <Undo2 className="w-4 h-4 stroke-[3]" />
                <span>
                  {t3(lang, 'पिछली गेंद हटाएं', 'Undo Ball', 'गलती सुधारें (UNDO)')}
                </span>
              </button>
            </div>

            {/* AUTOMATIC 1ST INNINGS COMPLETE BANNER -> 1-CLICK START 2ND INNINGS & SET TARGET */}
            {liveState.targetRuns === 0 &&
              (liveState.overs >= liveState.totalMatchOvers ||
                liveState.wickets >= 10) && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white border-2 border-amber-300 shadow-xl flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs sm:text-sm font-black text-amber-300">
                      🏁{' '}
                      {t3(
                        lang,
                        `पहली पारी पूरी! (${liveState.battingTeamName}: ${liveState.runs}/${liveState.wickets} — ${liveState.overs}.${liveState.balls} Ov)`,
                        `1st Innings Complete! (${liveState.battingTeamName}: ${liveState.runs}/${liveState.wickets})`,
                        `1st Innings पूरी! (${liveState.battingTeamName}: ${liveState.runs}/${liveState.wickets})`
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-emerald-100 mt-0.5">
                      {t3(
                        lang,
                        `${liveState.bowlingTeamName} के लिए ऑटोमैटिक टारगेट: ${liveState.runs + 1} रन (${liveState.totalMatchOvers} ओवर)`,
                        `Auto Target for ${liveState.bowlingTeamName}: ${liveState.runs + 1} Runs (${liveState.totalMatchOvers} Overs)`,
                        `${liveState.bowlingTeamName} के लिए Target: ${liveState.runs + 1} रन`
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartSecondInnings}
                    className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-md shrink-0"
                  >
                    🔄{' '}
                    {t3(
                      lang,
                      `दूसरी पारी शुरू करें (Target: ${liveState.runs + 1})`,
                      `Start 2nd Innings (Target: ${liveState.runs + 1})`,
                      `2nd Innings शुरू करें (Target: ${liveState.runs + 1})`
                    )}
                  </button>
                </div>
              )}

            {/* LIVE TARGET CHASE STATUS BAR WHEN 2ND INNINGS IS ACTIVE */}
            {liveState.targetRuns > 0 && (
              <div className="px-3.5 py-2.5 rounded-2xl bg-emerald-950/90 border border-emerald-400/60 flex flex-wrap items-center justify-between gap-2 text-xs font-black">
                {liveState.runs >= liveState.targetRuns ? (
                  <span className="text-amber-300 text-sm">
                    🏆 {liveState.battingTeamName}{' '}
                    {t3(
                      lang,
                      `विजयी! (Target ${liveState.targetRuns} पूरा किया)`,
                      `Won the Match! (Chased ${liveState.targetRuns})`,
                      `विजयी! (Target ${liveState.targetRuns} पूरा)`
                    )}
                  </span>
                ) : (
                  <span className="text-emerald-300">
                    🎯{' '}
                    {t3(
                      lang,
                      `टारगेट: ${liveState.targetRuns} रन • जीत के लिए ${Math.max(
                        0,
                        liveState.totalMatchOvers * 6 -
                          (liveState.overs * 6 + liveState.balls)
                      )} गेंदों में ${Math.max(
                        0,
                        liveState.targetRuns - liveState.runs
                      )} रन चाहिए`,
                      `Target: ${liveState.targetRuns} • Need ${Math.max(
                        0,
                        liveState.targetRuns - liveState.runs
                      )} runs in ${Math.max(
                        0,
                        liveState.totalMatchOvers * 6 -
                          (liveState.overs * 6 + liveState.balls)
                      )} balls`,
                      `Target: ${liveState.targetRuns} • ${Math.max(
                        0,
                        liveState.totalMatchOvers * 6 -
                          (liveState.overs * 6 + liveState.balls)
                      )} गेंदों में ${Math.max(
                        0,
                        liveState.targetRuns - liveState.runs
                      )} रन चाहिए`
                    )}
                  </span>
                )}
                {liveState.firstInningsTeamName && (
                  <span className="text-[11px] font-mono text-amber-300">
                    1st Inn: {liveState.firstInningsTeamName}{' '}
                    {liveState.firstInningsRuns}/{liveState.firstInningsWickets}{' '}
                    ({liveState.firstInningsOvers} Ov)
                  </span>
                )}
              </div>
            )}

            {/* ==============================================================
                AUTOMATIC POPUP 1: WHEN WICKET FALLS -> PICK FIELDER/KEEPER + NEXT BATSMAN
            ============================================================== */}
            {needsNextBatsman && (
              <div className="p-3.5 rounded-2xl bg-amber-400 text-slate-950 space-y-3 shadow-xl border-2 border-white">
                <div className="flex items-center justify-between border-b border-slate-950/15 pb-1.5">
                  <span className="text-xs sm:text-sm font-black uppercase">
                    {t3(
                      lang,
                      '🎯 विकेट गिरा! अगला बल्लेबाज चुनें:',
                      '🎯 Wicket! Select Next Batsman:',
                      '🎯 Wicket! अगला बल्लेबाज चुनें:'
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNeedsNextBatsman(false)}
                    className="text-xs font-black bg-slate-950 text-white px-2.5 py-0.5 rounded-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Step 1: Dismissal Type + Fielder */}
                <div className="bg-amber-300/70 rounded-xl p-2.5 space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { id: 'Catch', label: t3(lang, '🙌 कैच आउट', '🙌 Catch Out', '🙌 कैच (Catch)') },
                      { id: 'Keeping', label: t3(lang, '🧤 स्टंप/कीपर', '🧤 Stumped/Keeper', '🧤 कीपर (Keeping)') },
                      { id: 'RunOut', label: t3(lang, '🎯 रन आउट', '🎯 Run Out', '🎯 रन आउट (RunOut)') },
                      { id: 'Bowled', label: t3(lang, '🎳 बोल्ड / पगबाधा', '🎳 Bowled / LBW', '🎳 बोल्ड / LBW') },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() =>
                          setOutDismissalType(
                            d.id as 'Catch' | 'Keeping' | 'RunOut' | 'Bowled'
                          )
                        }
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-black cursor-pointer ${
                          outDismissalType === d.id
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-white/80 text-slate-900'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>

                  {outDismissalType !== 'Bowled' && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {liveState.teamBPlayers.map((fielder, fIdx) => (
                        <button
                          key={fIdx}
                          type="button"
                          onClick={() =>
                            handleAddFieldingCredit(fielder, outDismissalType)
                          }
                          className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer ${
                            outFielderCredited === fielder
                              ? 'bg-emerald-700 text-white'
                              : 'bg-slate-900/90 text-amber-300 hover:bg-slate-800'
                          }`}
                        >
                          {outFielderCredited === fielder ? '✓ ' : '+ '}
                          {cleanBroadcastName(fielder)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Step 2: Select Next Batsman */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {liveState.teamAPlayers
                      .filter(
                        (p) =>
                          p &&
                          p !== liveState.strikerName &&
                          p !== liveState.nonStrikerName
                      )
                      .map((player, idx) => {
                        const alreadyOut =
                          liveState.batsmanRecords?.[player]?.isOut;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleConfirmNextBatsman(player)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                              alreadyOut
                                ? 'bg-slate-700/60 text-slate-300 line-through'
                                : 'bg-slate-950 text-white hover:bg-slate-800 shadow-xs'
                            }`}
                          >
                            🏏 {cleanBroadcastName(player)}
                          </button>
                        );
                      })}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={customNextBatsman}
                      onChange={(e) => setCustomNextBatsman(e.target.value)}
                      placeholder={t3(lang, 'नया बल्लेबाज नाम...', 'New batsman name...', 'नया बल्लेबाज नाम...')}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white text-slate-950 text-xs font-bold border border-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleConfirmNextBatsman(customNextBatsman)
                      }
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-black cursor-pointer shrink-0"
                    >
                      {t3(lang, '✓ चुनें', '✓ Select', '✓ चुनें')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==============================================================
                AUTOMATIC POPUP 2: WHEN OVER COMPLETES (6 BALLS) -> PICK NEXT BOWLER!
            ============================================================== */}
            {needsNextBowler && (
              <div className="p-3.5 rounded-2xl bg-sky-400 text-slate-950 space-y-2.5 shadow-xl border-2 border-white">
                <div className="flex items-center justify-between border-b border-slate-950/15 pb-1.5">
                  <span className="text-xs sm:text-sm font-black uppercase">
                    {t3(
                      lang,
                      `⚾ ओवर #${liveState.overs} समाप्त! अगला गेंदबाज चुनें:`,
                      `⚾ Over #${liveState.overs} Complete! Select Next Bowler:`,
                      `⚾ Over #${liveState.overs} समाप्त! अगला Bowler चुनें:`
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNeedsNextBowler(false)}
                    className="text-xs font-black bg-slate-950 text-white px-2.5 py-0.5 rounded-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {liveState.teamBPlayers.map((bowler, idx) => {
                    const bRec = liveState.bowlerRecords?.[bowler];
                    const isSameBowler = bowler === liveState.bowlerName;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectBowlerWithRecord(bowler)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1 ${
                          isSameBowler
                            ? 'bg-slate-700 text-amber-300 border border-amber-400'
                            : 'bg-slate-950 text-white hover:bg-slate-800 shadow-xs'
                        }`}
                      >
                        <span>⚾ {cleanBroadcastName(bowler)}</span>
                        {bRec && bRec.ballsBowled > 0 && (
                          <span className="text-[10px] text-sky-300 font-mono">
                            ({formatBallsToOvers(bRec.ballsBowled)}-
                            {bRec.runsConceded}-{bRec.wickets}W)
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customNextBowler}
                    onChange={(e) => setCustomNextBowler(e.target.value)}
                    placeholder={t3(lang, 'नया गेंदबाज नाम...', 'New bowler name...', 'नया गेंदबाज नाम...')}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white text-slate-950 text-xs font-bold border border-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectBowlerWithRecord(customNextBowler)
                    }
                    className="px-3 py-1.5 rounded-xl bg-blue-900 text-white text-xs font-black cursor-pointer shrink-0"
                  >
                    {t3(lang, '✓ चुनें', '✓ Select', '✓ चुनें')}
                  </button>
                </div>
              </div>
            )}

            {/* MAIN 1-TAP BALL SCORING BUTTONS (CLEAN & SIMPLE) */}
            <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => handleBallScore(0)}
                className="py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 font-black text-sm border border-white/15 cursor-pointer active:scale-95"
              >
                {t3(lang, '0 (डॉट)', '0 (Dot)', '0 (डॉट)')}
              </button>
              <button
                type="button"
                onClick={() => handleBallScore(1)}
                className="py-3.5 rounded-2xl bg-blue-700 hover:bg-blue-600 font-black text-sm cursor-pointer active:scale-95"
              >
                {t3(lang, '+1 रन', '+1 Run', '+1 रन')}
              </button>
              <button
                type="button"
                onClick={() => handleBallScore(2)}
                className="py-3.5 rounded-2xl bg-blue-700 hover:bg-blue-600 font-black text-sm cursor-pointer active:scale-95"
              >
                {t3(lang, '+2 रन', '+2 Runs', '+2 रन')}
              </button>
              <button
                type="button"
                onClick={() => handleBallScore(3)}
                className="py-3.5 rounded-2xl bg-blue-700 hover:bg-blue-600 font-black text-sm cursor-pointer active:scale-95"
              >
                {t3(lang, '+3 रन', '+3 Runs', '+3 रन')}
              </button>

              <button
                type="button"
                onClick={() => handleBallScore(4, { celebration: 'FOUR' })}
                className="py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm cursor-pointer shadow-md active:scale-95"
              >
                {t3(lang, '🔥 +4 चौका', '🔥 +4 FOUR', '🔥 +4 चौका')}
              </button>
              <button
                type="button"
                onClick={() => handleBallScore(6, { celebration: 'SIX' })}
                className="py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm cursor-pointer shadow-md active:scale-95"
              >
                {t3(lang, '🚀 +6 छक्का', '🚀 +6 SIX', '🚀 +6 छक्का')}
              </button>
              <button
                type="button"
                onClick={() =>
                  handleBallScore(0, { isWicket: true, celebration: 'WICKET' })
                }
                className="py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm cursor-pointer shadow-md active:scale-95 col-span-2"
              >
                {t3(lang, '🎯 आउट / विकेट', '🎯 OUT / WICKET', '🎯 OUT विकेट')}
              </button>
            </div>

            {/* DEDICATED EXTRAS ROW: WIDE (WD), NO BALL (NB), BYE (B), LEG BYE (LB) */}
            <div className="bg-slate-900/90 rounded-2xl p-2.5 border border-purple-500/30 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-black text-purple-300">
                <span>
                  {t3(lang, '➕ अतिरिक्त रन:', '➕ Extras:', '➕ Extras:')}
                </span>
                <span className="font-mono text-amber-300">
                  {t3(lang, 'कुल', 'Total', 'Total')}: {liveState.extras || 0}{' '}
                  (WD:{liveState.wides || 0}, NB:{liveState.noBalls || 0}, B:
                  {liveState.byes || 0}, LB:{liveState.legByes || 0})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1. WIDE BALL */}
                <button
                  type="button"
                  onClick={() => handleBallScore(1, { extraType: 'WD' })}
                  className="py-2.5 px-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-black text-xs cursor-pointer active:scale-95"
                >
                  {t3(lang, '+1 वाइड', '+1 Wide (WD)', '+1 वाइड (WD)')}
                </button>

                {/* 2. NO BALL */}
                <div className="flex items-stretch gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleBallScore(1, {
                        extraType: 'NB',
                        batRunsOnNoBall: 0,
                      })
                    }
                    className="flex-1 py-2.5 px-2 rounded-xl bg-fuchsia-700 hover:bg-fuchsia-600 text-white font-black text-xs cursor-pointer active:scale-95"
                  >
                    {t3(lang, '+1 नो-बॉल', '+1 No-Ball (NB)', '+1 नो-बॉल (NB)')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNoBallSubMenu((v) => !v)}
                    className="px-2 rounded-xl bg-fuchsia-900 hover:bg-fuchsia-800 text-amber-300 font-black text-[11px] border border-fuchsia-400/40 cursor-pointer"
                  >
                    {t3(lang, '+रन', '+Runs', '+रन')}
                  </button>
                </div>

                {/* 3. BYE (B) */}
                <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => handleBallScore(1, { extraType: 'B' })}
                    className="py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white font-black text-[11px] cursor-pointer"
                  >
                    {t3(lang, '+1 बाई', '+1 Bye', '+1 बाई')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBallScore(2, { extraType: 'B' })}
                    className="py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white font-black text-[11px] cursor-pointer"
                  >
                    +2B
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBallScore(4, { extraType: 'B' })}
                    className="py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white font-black text-[11px] cursor-pointer"
                  >
                    +4B
                  </button>
                </div>

                {/* 4. LEG BYE (LB) */}
                <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => handleBallScore(1, { extraType: 'LB' })}
                    className="py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white font-black text-[11px] cursor-pointer"
                  >
                    {t3(lang, '+1 लेग-बाई', '+1 LegBye', '+1 लेग-बाई')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBallScore(2, { extraType: 'LB' })}
                    className="py-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-white font-black text-[11px] cursor-pointer"
                  >
                    +2LB
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBallScore(4, { extraType: 'LB' })}
                    className="py-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-white font-black text-[11px] cursor-pointer"
                  >
                    +4LB
                  </button>
                </div>
              </div>

              {showNoBallSubMenu && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/10">
                  {[1, 2, 3, 4, 6].map((batR) => (
                    <button
                      key={batR}
                      type="button"
                      onClick={() =>
                        handleBallScore(1 + batR, {
                          extraType: 'NB',
                          batRunsOnNoBall: batR,
                          celebration:
                            batR === 6 ? 'SIX' : batR === 4 ? 'FOUR' : 'none',
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black text-xs cursor-pointer"
                    >
                      NB+{batR}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* INSTANT +/- CORRECTION BAR */}
            <div className="bg-slate-900/95 rounded-2xl p-2.5 border border-slate-700 space-y-2">
              <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold text-amber-300">
                <span>
                  {t3(lang, '🛠️ सुधार बटन:', '🛠️ Quick Adjust:', '🛠️ सुधार बटन:')}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    pushLiveState(
                      {
                        ...liveState,
                        runs: 0,
                        wickets: 0,
                        overs: 0,
                        balls: 0,
                        extras: 0,
                        wides: 0,
                        noBalls: 0,
                        byes: 0,
                        legByes: 0,
                        strikerRuns: 0,
                        strikerBalls: 0,
                        strikerFours: 0,
                        strikerSixes: 0,
                        nonStrikerRuns: 0,
                        nonStrikerBalls: 0,
                        nonStrikerFours: 0,
                        nonStrikerSixes: 0,
                        bowlerRuns: 0,
                        bowlerWickets: 0,
                        bowlerBalls: 0,
                        bowlerOvers: '0.0',
                        thisOverBalls: [],
                        overHistory: [],
                        batsmanRecords: {},
                        bowlerRecords: {},
                        fieldingRecords: {},
                        celebration: 'none',
                      },
                      true
                    );
                    triggerToast(
                      t3(
                        lang,
                        '✓ नया मैच रीसेट हो गया',
                        '✓ Match Reset to 0/0',
                        '✓ नया मैच 0/0 रीसेट'
                      )
                    );
                  }}
                  className="px-2.5 py-1 rounded-lg bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600 hover:text-white flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>
                    {t3(lang, '0/0 रीसेट', 'Reset 0/0', '0/0 रीसेट')}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-black">
                {/* Runs -/+ */}
                <div className="flex items-center justify-between bg-slate-800 rounded-xl p-1.5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => handleQuickAdjust('runs', -1)}
                    className="w-8 h-7 rounded-lg bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-slate-200 truncate px-1">
                    {t3(lang, 'रन', 'Runs', 'रन')} ({liveState.runs})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickAdjust('runs', 1)}
                    className="w-8 h-7 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Wickets -/+ */}
                <div className="flex items-center justify-between bg-slate-800 rounded-xl p-1.5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => handleQuickAdjust('wickets', -1)}
                    className="w-8 h-7 rounded-lg bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-slate-200 truncate px-1">
                    {t3(lang, 'विकेट', 'Wkts', 'विकेट')} ({liveState.wickets})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickAdjust('wickets', 1)}
                    className="w-8 h-7 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Balls -/+ */}
                <div className="flex items-center justify-between bg-slate-800 rounded-xl p-1.5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => handleQuickAdjust('balls', -1)}
                    className="w-8 h-7 rounded-lg bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-slate-200 truncate px-1">
                    {t3(lang, 'गेंद', 'Balls', 'गेंद')} (.{liveState.balls})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickAdjust('balls', 1)}
                    className="w-8 h-7 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Overs -/+ */}
                <div className="flex items-center justify-between bg-slate-800 rounded-xl p-1.5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => handleQuickAdjust('overs', -1)}
                    className="w-8 h-7 rounded-lg bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-slate-200 truncate px-1">
                    {t3(lang, 'ओवर', 'Overs', 'ओवर')} ({liveState.overs})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickAdjust('overs', 1)}
                    className="w-8 h-7 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* SIMPLE TEAM & PLAYER DROPDOWNS + EDITABLE NAMES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-amber-300 mb-1">
                  {t3(lang, '🏏 बल्लेबाजी टीम:', '🏏 Batting Team:', '🏏 बल्लेबाजी टीम:')}
                </label>
                <select
                  value={liveState.battingTeamId}
                  onChange={(e) => handleSelectTeamA(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-extrabold"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.teamName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sky-300 mb-1">
                  {t3(lang, '⚾ गेंदबाजी टीम:', '⚾ Bowling Team:', '⚾ गेंदबाजी टीम:')}
                </label>
                <select
                  value={liveState.bowlingTeamId}
                  onChange={(e) => handleSelectTeamB(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-extrabold"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.teamName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Striker & Non-Striker */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-amber-300">
                    {t3(lang, 'बल्लेबाज 1', 'Striker*', 'बल्लेबाज 1 (Striker*)')} —{' '}
                    {liveState.strikerRuns}({liveState.strikerBalls})
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      pushLiveState({
                        ...liveState,
                        strikerName: liveState.nonStrikerName,
                        strikerRuns: liveState.nonStrikerRuns,
                        strikerBalls: liveState.nonStrikerBalls,
                        strikerFours: liveState.nonStrikerFours,
                        strikerSixes: liveState.nonStrikerSixes,
                        nonStrikerName: liveState.strikerName,
                        nonStrikerRuns: liveState.strikerRuns,
                        nonStrikerBalls: liveState.strikerBalls,
                        nonStrikerFours: liveState.strikerFours,
                        nonStrikerSixes: liveState.strikerSixes,
                      })
                    }
                    className="text-[10px] font-black text-amber-400 flex items-center gap-0.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{t3(lang, 'स्ट्राइक बदलें', 'Swap', 'स्ट्राइक बदलें')}</span>
                  </button>
                </div>
                <select
                  value={liveState.strikerName}
                  onChange={(e) => handleConfirmNextBatsman(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 text-xs font-bold"
                >
                  {liveState.teamAPlayers.map((p, i) => (
                    <option key={i} value={p}>
                      {i + 1}. {p}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={liveState.strikerName}
                  onChange={(e) =>
                    pushLiveState({ ...liveState, strikerName: e.target.value })
                  }
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-[11px] font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">
                  {t3(lang, 'बल्लेबाज 2', 'Non-Striker', 'बल्लेबाज 2 (Non-Striker)')} —{' '}
                  {liveState.nonStrikerRuns}({liveState.nonStrikerBalls})
                </label>
                <select
                  value={liveState.nonStrikerName}
                  onChange={(e) => {
                    const chosen = e.target.value;
                    const rec = liveState.batsmanRecords?.[chosen];
                    pushLiveState({
                      ...liveState,
                      nonStrikerName: chosen,
                      nonStrikerRuns: rec?.runs || 0,
                      nonStrikerBalls: rec?.balls || 0,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                >
                  {liveState.teamAPlayers.map((p, i) => (
                    <option key={i} value={p}>
                      {i + 1}. {p}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={liveState.nonStrikerName}
                  onChange={(e) =>
                    pushLiveState({
                      ...liveState,
                      nonStrikerName: e.target.value,
                    })
                  }
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-[11px] font-bold"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-sky-300">
                    {t3(lang, 'गेंदबाज', 'Bowler', 'गेंदबाज')} (
                    {liveState.bowlerOvers || '0.0'} Ov, {liveState.bowlerRuns}
                    R, {liveState.bowlerWickets}W)
                  </label>
                  <button
                    type="button"
                    onClick={() => setNeedsNextBowler(true)}
                    className="text-[10px] font-black text-sky-400 underline cursor-pointer"
                  >
                    {t3(lang, 'बदलें', 'Change', 'बदलें')}
                  </button>
                </div>
                <select
                  value={liveState.bowlerName}
                  onChange={(e) => handleSelectBowlerWithRecord(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sky-300 text-xs font-bold"
                >
                  {liveState.teamBPlayers.map((p, i) => (
                    <option key={i} value={p}>
                      {i + 1}. {p}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={liveState.bowlerName}
                  onChange={(e) =>
                    pushLiveState({ ...liveState, bowlerName: e.target.value })
                  }
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-[11px] font-bold"
                />
              </div>

              {/* FULL-WIDTH DYNAMIC TOTAL OVERS & AUTOMATIC TARGET CONTROL BOX */}
              <div className="sm:col-span-2 bg-slate-900/95 rounded-2xl p-3 border border-amber-500/40 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. TOTAL MATCH OVERS (WITH +/- BUTTONS, DIRECT INPUT & 1-TAP PRESETS) */}
                  <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black text-amber-300">
                        ⏱️{' '}
                        {t3(
                          lang,
                          'कुल ओवर सेट करें (Total Overs):',
                          'Total Match Overs:',
                          'कुल ओवर (Total Overs):'
                        )}
                      </label>
                      <span className="text-xs font-mono font-black text-white bg-amber-500/20 border border-amber-400/50 px-2 py-0.5 rounded">
                        {liveState.totalMatchOvers} Overs
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          pushLiveState(
                            {
                              ...liveState,
                              totalMatchOvers: Math.max(
                                1,
                                (liveState.totalMatchOvers || 16) - 1
                              ),
                            },
                            true
                          )
                        }
                        className="w-10 h-9 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black flex items-center justify-center cursor-pointer shrink-0 active:scale-95"
                      >
                        <Minus className="w-4 h-4 stroke-[3]" />
                      </button>

                      <input
                        type="text"
                        inputMode="numeric"
                        value={
                          liveState.totalMatchOvers === 0
                            ? ''
                            : String(liveState.totalMatchOvers)
                        }
                        onChange={(e) => {
                          const rawDigits = e.target.value.replace(/\D/g, '');
                          const numVal =
                            rawDigits === '' ? 0 : parseInt(rawDigits, 10);
                          pushLiveState({
                            ...liveState,
                            totalMatchOvers: Math.min(99, numVal),
                          });
                        }}
                        onBlur={() => {
                          if (!liveState.totalMatchOvers || liveState.totalMatchOvers < 1) {
                            pushLiveState({
                              ...liveState,
                              totalMatchOvers: 16,
                            });
                          }
                        }}
                        placeholder="16"
                        className="flex-1 h-9 px-3 rounded-xl bg-slate-900 border-2 border-amber-400/70 text-center text-amber-300 text-sm font-mono font-black focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          pushLiveState(
                            {
                              ...liveState,
                              totalMatchOvers: Math.min(
                                99,
                                (liveState.totalMatchOvers || 16) + 1
                              ),
                            },
                            true
                          )
                        }
                        className="w-10 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center justify-center cursor-pointer shrink-0 active:scale-95"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>

                    {/* 1-Tap Over Presets */}
                    <div className="grid grid-cols-6 gap-1">
                      {[6, 8, 10, 12, 16, 20].map((ovPreset) => (
                        <button
                          key={ovPreset}
                          type="button"
                          onClick={() =>
                            pushLiveState(
                              {
                                ...liveState,
                                totalMatchOvers: ovPreset,
                              },
                              true
                            )
                          }
                          className={`py-1 rounded-lg text-[10px] font-mono font-black cursor-pointer border ${
                            liveState.totalMatchOvers === ovPreset
                              ? 'bg-amber-500 text-slate-950 border-amber-300'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-400'
                          }`}
                        >
                          {ovPreset} Ov
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. AUTOMATIC & MANUAL TARGET RUNS (WITH 1-CLICK 2ND INNINGS SWITCH) */}
                  <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black text-emerald-400">
                        🎯{' '}
                        {t3(
                          lang,
                          'टारगेट रन (Target Runs):',
                          'Target Runs (2nd Inn):',
                          'टारगेट रन (Target):'
                        )}
                      </label>
                      {liveState.targetRuns > 0 ? (
                        <button
                          type="button"
                          onClick={() =>
                            pushLiveState({ ...liveState, targetRuns: 0 }, true)
                          }
                          className="text-[10px] font-black text-red-400 hover:underline cursor-pointer"
                        >
                          ✕ {t3(lang, 'हटाएं (1st Inn)', 'Clear (1st Inn)', 'हटाएं')}
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">
                          {t3(lang, 'पहली पारी जारी', '1st Innings', '1st Innings')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          pushLiveState(
                            {
                              ...liveState,
                              targetRuns: Math.max(
                                0,
                                (liveState.targetRuns || 0) - 1
                              ),
                            },
                            true
                          )
                        }
                        className="w-10 h-9 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black flex items-center justify-center cursor-pointer shrink-0 active:scale-95"
                      >
                        <Minus className="w-4 h-4 stroke-[3]" />
                      </button>

                      <input
                        type="text"
                        inputMode="numeric"
                        value={
                          liveState.targetRuns === 0
                            ? ''
                            : String(liveState.targetRuns)
                        }
                        onChange={(e) => {
                          const rawDigits = e.target.value.replace(/\D/g, '');
                          const numVal =
                            rawDigits === '' ? 0 : parseInt(rawDigits, 10);
                          pushLiveState({
                            ...liveState,
                            targetRuns: Math.min(999, numVal),
                          });
                        }}
                        placeholder={t3(
                          lang,
                          '0 (पहली पारी)',
                          '0 (1st Innings)',
                          '0 (1st Innings)'
                        )}
                        className="flex-1 h-9 px-3 rounded-xl bg-slate-900 border-2 border-emerald-400/70 text-center text-white text-sm font-mono font-black focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          pushLiveState(
                            {
                              ...liveState,
                              targetRuns: (liveState.targetRuns || 0) + 1,
                            },
                            true
                          )
                        }
                        className="w-10 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center justify-center cursor-pointer shrink-0 active:scale-95"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>

                    {/* 1-Click Auto Target & 2nd Innings Button */}
                    <button
                      type="button"
                      onClick={handleStartSecondInnings}
                      className="w-full py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[11px] cursor-pointer shadow-xs flex items-center justify-center gap-1 active:scale-95"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>
                        {t3(
                          lang,
                          `दूसरी पारी शुरू करें (Auto Target: ${liveState.runs + 1})`,
                          `Start 2nd Innings (Auto Target: ${liveState.runs + 1})`,
                          `2nd Innings शुरू करें (Auto Target: ${liveState.runs + 1})`
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================================
              CARD B: DYNAMIC MATCH RECORD (BATSMEN, BOWLERS, PREVIOUS OVERS, FIELDING)
          ================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-600" />
                <span>
                  {t3(
                    lang,
                    '📊 मैच रिकॉर्ड (बल्लेबाज, गेंदबाज व पिछले ओवर)',
                    '📊 Live Match Records (Batsmen, Bowlers & Overs)',
                    '📊 मैच रिकॉर्ड (Batsmen, Bowlers & Overs)'
                  )}
                </span>
              </h3>

              <button
                type="button"
                onClick={handleSaveMatchToSeries}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {t3(
                    lang,
                    '💾 सीरीज़ में सेव करें',
                    '💾 Save Match to Series',
                    '💾 सीरीज़ में Save करें'
                  )}
                </span>
              </button>
            </div>

            {/* 1. PREVIOUS OVERS RECORD */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="text-xs font-black text-slate-800 dark:text-amber-300 flex items-center justify-between">
                <span>
                  {t3(lang, '⏮️ पिछले ओवर:', '⏮️ Previous Overs:', '⏮️ पिछले ओवर:')}
                </span>
                <span className="text-[11px] text-slate-500">
                  {liveState.overHistory?.length || 0} Overs
                </span>
              </div>

              {liveState.overHistory && liveState.overHistory.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {[...liveState.overHistory].reverse().map((ov, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-black text-slate-900 dark:text-white truncate">
                          Ov #{ov.overNumber} •{' '}
                          <span className="text-blue-600 dark:text-sky-400">
                            {cleanBroadcastName(ov.bowlerName)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ov.balls.map((b, bIdx) => (
                            <span
                              key={bIdx}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black ${
                                b === '6'
                                  ? 'bg-amber-400 text-slate-950'
                                  : b === '4'
                                  ? 'bg-emerald-600 text-white'
                                  : b === 'W'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right font-mono font-black shrink-0">
                        <div className="text-slate-900 dark:text-white">
                          {ov.runs} R
                        </div>
                        <div className="text-[10px] text-red-600">
                          {ov.wickets} W
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs font-bold text-slate-500 py-1">
                  {t3(lang, 'पहला ओवर जारी है...', 'First over in progress...', 'पहला ओवर जारी है...')}
                </div>
              )}
            </div>

            {/* 2. BATSMEN & BOWLERS LIVE TABLES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Batsmen Record Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-amber-500 text-slate-950 px-3 py-2 text-xs font-black flex justify-between">
                  <span>
                    🏏 {t3(lang, 'बल्लेबाज', 'Batsmen', 'बल्लेबाज')} (
                    {liveState.battingTeamName})
                  </span>
                  <span>R (B) • 4s/6s • SR</span>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-56 overflow-y-auto bg-white dark:bg-slate-900">
                  {Object.values(liveState.batsmanRecords || {}).map(
                    (bat, idx) => {
                      const sr =
                        bat.balls > 0
                          ? Math.round((bat.runs / bat.balls) * 100)
                          : 0;
                      const isStriker = bat.name === liveState.strikerName;
                      const isNonStriker =
                        bat.name === liveState.nonStrikerName;
                      return (
                        <div
                          key={idx}
                          className={`px-3 py-2 flex items-center justify-between text-xs ${
                            isStriker || isNonStriker
                              ? 'bg-amber-50/70 dark:bg-amber-950/20'
                              : ''
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-black text-slate-900 dark:text-white truncate">
                              {cleanBroadcastName(bat.name)}{' '}
                              {isStriker && (
                                <span className="text-amber-600 dark:text-amber-400">
                                  *
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-bold text-slate-500">
                              {bat.isOut ? (
                                <span className="text-red-600">
                                  OUT ({bat.dismissalText})
                                </span>
                              ) : (
                                <span className="text-emerald-600">
                                  Not Out
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="font-mono font-black text-right shrink-0">
                            <span className="text-sm text-slate-900 dark:text-white">
                              {bat.runs}
                            </span>
                            <span className="text-slate-500 text-[11px]">
                              ({bat.balls})
                            </span>
                            <div className="text-[10px] text-slate-500">
                              4s:{bat.fours} • 6s:{bat.sixes} • SR:{sr}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Bowlers Record Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-blue-700 text-white px-3 py-2 text-xs font-black flex justify-between">
                  <span>
                    ⚾ {t3(lang, 'गेंदबाज', 'Bowlers', 'गेंदबाज')} (
                    {liveState.bowlingTeamName})
                  </span>
                  <span>O • R • W • ECO</span>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-56 overflow-y-auto bg-white dark:bg-slate-900">
                  {Object.values(liveState.bowlerRecords || {}).map(
                    (bw, idx) => {
                      const oversNum = bw.ballsBowled / 6;
                      const eco =
                        oversNum > 0
                          ? (bw.runsConceded / oversNum).toFixed(1)
                          : '0.0';
                      const isCurrent = bw.name === liveState.bowlerName;
                      return (
                        <div
                          key={idx}
                          className={`px-3 py-2 flex items-center justify-between text-xs ${
                            isCurrent
                              ? 'bg-sky-50/70 dark:bg-sky-950/30'
                              : ''
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-black text-slate-900 dark:text-white truncate">
                              {cleanBroadcastName(bw.name)}{' '}
                              {isCurrent && (
                                <span className="text-blue-600 dark:text-sky-400">
                                  *
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-bold text-slate-500">
                              0s:{bw.dots} • 4s:{bw.foursConceded} • 6s:
                              {bw.sixesConceded}
                            </div>
                          </div>
                          <div className="font-mono font-black text-right shrink-0">
                            <span className="text-sm text-blue-700 dark:text-sky-400">
                              {bw.wickets}W
                            </span>{' '}
                            - {bw.runsConceded}R
                            <div className="text-[10px] text-slate-500">
                              {formatBallsToOvers(bw.ballsBowled)} Ov • Eco:{' '}
                              {eco}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            {/* 3. QUICK 1-TAP CATCH / KEEPING / FIELDING CREDIT BAR */}
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-3 border border-emerald-300 dark:border-emerald-800/60 space-y-2">
              <div className="text-xs font-black text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" />
                <span>
                  {t3(
                    lang,
                    '🧤 फील्डिंग / कैच / कीपिंग पॉइंट:',
                    '🧤 Fielding / Catch / Keeping Credit:',
                    '🧤 कैच / कीपिंग / फील्डिंग पॉइंट:'
                  )}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <select
                  value={
                    selectedFielderForCredit ||
                    liveState.teamBPlayers[0] ||
                    ''
                  }
                  onChange={(e) => setSelectedFielderForCredit(e.target.value)}
                  className="sm:col-span-5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-400 text-xs font-extrabold text-slate-900 dark:text-white"
                >
                  {[...liveState.teamBPlayers, ...liveState.teamAPlayers].map(
                    (p, idx) => (
                      <option key={idx} value={p}>
                        {cleanBroadcastName(p)}
                      </option>
                    )
                  )}
                </select>

                <div className="sm:col-span-7 grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleAddFieldingCredit(
                        selectedFielderForCredit ||
                          liveState.teamBPlayers[0] ||
                          'Fielder',
                        'Catch'
                      )
                    }
                    className="py-2 px-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-black cursor-pointer"
                  >
                    {t3(lang, '🙌 +1 कैच', '🙌 +1 Catch', '🙌 +1 कैच')}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleAddFieldingCredit(
                        selectedFielderForCredit ||
                          liveState.teamBPlayers[0] ||
                          'Keeper',
                        'Keeping'
                      )
                    }
                    className="py-2 px-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black cursor-pointer"
                  >
                    {t3(lang, '🧤 +1 कीपिंग', '🧤 +1 Keeping', '🧤 +1 कीपिंग')}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleAddFieldingCredit(
                        selectedFielderForCredit ||
                          liveState.teamBPlayers[0] ||
                          'Fielder',
                        'Save'
                      )
                    }
                    className="py-2 px-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-black cursor-pointer"
                  >
                    {t3(lang, '⚡ +1 फील्डिंग', '⚡ +1 Fielding', '⚡ +1 फील्डिंग')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================================
              CARD C: AUTOMATIC 8-TEAM TOURNAMENT & MATCH AWARDS CALCULATOR
          ================================================================= */}
          <div className="bg-gradient-to-br from-[#0B192C] via-slate-900 to-[#0B192C] text-white rounded-3xl border-2 border-amber-400 p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3">
              <h3 className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                <span>
                  {t3(
                    lang,
                    '🏆 ऑटोमैटिक अवार्ड्स (मैच व 8-टीम सीरीज़)',
                    '🏆 Automatic Awards (Match & 8-Team Series)',
                    '🏆 ऑटोमैटिक अवार्ड्स (Match & Series)'
                  )}
                </span>
              </h3>

              <button
                type="button"
                onClick={() => {
                  pushLiveState({
                    ...liveState,
                    screenMode:
                      liveState.screenMode === 'awards-ceremony'
                        ? 'score-ticker'
                        : 'awards-ceremony',
                  });
                }}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <Award className="w-4 h-4" />
                <span>
                  {liveState.screenMode === 'awards-ceremony'
                    ? t3(lang, '📺 स्कोरबोर्ड दिखाएं', '📺 Show Scoreboard', '📺 स्कोरबोर्ड दिखाएं')
                    : t3(lang, '📺 टीवी पर अवार्ड्स दिखाएं', '📺 Show Awards on TV', '📺 TV पर अवार्ड्स दिखाएं')}
                </span>
              </button>
            </div>

            {/* AUTOMATIC AWARD CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {/* 1. Man of the Match */}
              <div className="bg-amber-500/20 border-2 border-amber-400 rounded-2xl p-3 space-y-1">
                <div className="text-[10px] font-black uppercase text-amber-300">
                  🏅 {t3(lang, '1. मैन ऑफ द मैच', '1. Man of the Match', '1. Man of the Match')}
                </div>
                <div className="text-sm font-black text-white truncate">
                  {cleanBroadcastName(
                    currentMatchAwards.manOfTheMatch?.name
                  ) || '—'}
                </div>
                <div className="text-[11px] font-bold text-amber-200">
                  {currentMatchAwards.manOfTheMatch
                    ? `${currentMatchAwards.manOfTheMatch.summary} (${currentMatchAwards.manOfTheMatch.points} Pts)`
                    : '—'}
                </div>
              </div>

              {/* 2. Man of the Series */}
              <div className="bg-gradient-to-r from-red-600/30 to-amber-500/30 border-2 border-amber-300 rounded-2xl p-3 space-y-1">
                <div className="text-[10px] font-black uppercase text-amber-200">
                  🏆 {t3(lang, '2. मैन ऑफ द सीरीज़', '2. Man of the Series', '2. Man of the Series')}
                </div>
                <div className="text-sm font-black text-white truncate">
                  {cleanBroadcastName(
                    seriesCumulativeAwards.manOfTheMatch?.name
                  ) || '—'}
                </div>
                <div className="text-[11px] font-bold text-amber-100">
                  {seriesCumulativeAwards.manOfTheMatch
                    ? `${seriesCumulativeAwards.manOfTheMatch.summary} (${seriesCumulativeAwards.manOfTheMatch.points} Pts)`
                    : '—'}
                </div>
              </div>

              {/* 3. Best Batsman */}
              <div className="bg-blue-600/20 border border-blue-400 rounded-2xl p-3 space-y-1">
                <div className="text-[10px] font-black uppercase text-sky-300">
                  🏏 {t3(lang, '3. सर्वश्रेष्ठ बल्लेबाज', '3. Best Batsman', '3. Best Batsman')}
                </div>
                <div className="text-sm font-black text-white truncate">
                  {cleanBroadcastName(
                    seriesCumulativeAwards.bestBatsman?.name
                  ) || '—'}
                </div>
                <div className="text-[11px] font-bold text-sky-200">
                  {seriesCumulativeAwards.bestBatsman
                    ? `${seriesCumulativeAwards.bestBatsman.runs} R (${seriesCumulativeAwards.bestBatsman.balls} B)`
                    : '—'}
                </div>
              </div>

              {/* 4. Best Bowler */}
              <div className="bg-emerald-600/20 border border-emerald-400 rounded-2xl p-3 space-y-1">
                <div className="text-[10px] font-black uppercase text-emerald-300">
                  ⚾ {t3(lang, '4. सर्वश्रेष्ठ गेंदबाज', '4. Best Bowler', '4. Best Bowler')}
                </div>
                <div className="text-sm font-black text-white truncate">
                  {cleanBroadcastName(
                    seriesCumulativeAwards.bestBowler?.name
                  ) || '—'}
                </div>
                <div className="text-[11px] font-bold text-emerald-200">
                  {seriesCumulativeAwards.bestBowler
                    ? `${seriesCumulativeAwards.bestBowler.wickets} W (${seriesCumulativeAwards.bestBowler.runsConceded} R)`
                    : '—'}
                </div>
              </div>

              {/* 5. Best Catch */}
              <div className="bg-purple-600/20 border border-purple-400 rounded-2xl p-3 space-y-1">
                <div className="text-[10px] font-black uppercase text-purple-300">
                  🙌 {t3(lang, '5. सर्वश्रेष्ठ कैच', '5. Best Catch', '5. Best Catch')}
                </div>
                <div className="text-sm font-black text-white truncate">
                  {cleanBroadcastName(seriesCumulativeAwards.bestCatch?.name) ||
                    '—'}
                </div>
                <div className="text-[11px] font-bold text-purple-200">
                  {seriesCumulativeAwards.bestCatch
                    ? `${seriesCumulativeAwards.bestCatch.catches} Catches`
                    : '—'}
                </div>
              </div>

              {/* 6. Best Keeper & 7. Best Fielder */}
              <div className="bg-rose-600/20 border border-rose-400 rounded-2xl p-3 space-y-1">
                <div className="text-[10px] font-black uppercase text-rose-300">
                  🧤 {t3(lang, '6. कीपर व फील्डर', '6. Best Keeper & Fielder', '6. Best Keeper & Fielder')}
                </div>
                <div className="text-xs font-black text-white truncate">
                  🧤{' '}
                  {cleanBroadcastName(
                    seriesCumulativeAwards.bestKeeper?.name
                  ) || '—'}{' '}
                  {seriesCumulativeAwards.bestKeeper
                    ? `(${seriesCumulativeAwards.bestKeeper.keepings})`
                    : ''}
                </div>
                <div className="text-xs font-black text-teal-300 truncate">
                  ⚡{' '}
                  {cleanBroadcastName(
                    seriesCumulativeAwards.bestFielder?.name
                  ) || '—'}{' '}
                  {seriesCumulativeAwards.bestFielder
                    ? `(${
                        seriesCumulativeAwards.bestFielder.catches +
                        seriesCumulativeAwards.bestFielder.runOuts +
                        seriesCumulativeAwards.bestFielder.saves
                      })`
                    : ''}
                </div>
              </div>
            </div>

            {seriesMatches.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-slate-300">
                <span>
                  {t3(lang, 'सेव मैच:', 'Saved Matches:', 'सेव मैच:')} {seriesMatches.length}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSeriesMatches([]);
                    localStorage.removeItem(SERIES_STORAGE_KEY);
                  }}
                  className="text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{t3(lang, 'रीसेट', 'Reset', 'रीसेट')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT 5 COLUMNS: LIVE TV PREVIEW MONITOR + SCREEN MODES + SPONSOR ADS */}
        <div className="lg:col-span-5 lg:sticky lg:top-16 space-y-4">
          {/* LIVE TV MONITOR */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-red-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                <span>
                  {t3(lang, 'लाइव टीवी प्रिव्यू', 'LIVE TV MONITOR', 'LIVE TV प्रिव्यू')}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setFullscreenMonitor(true)}
                className="text-xs font-extrabold text-blue-600 hover:underline cursor-pointer"
              >
                Full Screen ↗
              </button>
            </div>

            <div className="w-full overflow-hidden rounded-2xl">
              <BroadcastOverlayCanvas
                state={liveState}
                transparentBg={false}
                compactPreview={true}
              />
            </div>

            {/* 1-TAP SCREEN DISPLAY BUTTONS */}
            <div className="space-y-1.5 pt-1">
              <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Tv className="w-4 h-4 text-red-600" />
                <span>
                  {t3(lang, 'स्क्रीन मोड चुनें:', 'Screen Display Mode:', 'स्क्रीन मोड (Screen Mode):')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  {
                    mode: 'score-ticker' as BroadcastScreenMode,
                    label: t3(lang, '📺 स्कोरबोर्ड पट्टी', '📺 Scoreboard Bar', '📺 स्कोरबोर्ड पट्टी'),
                  },
                  {
                    mode: 'full-scorecard' as BroadcastScreenMode,
                    label: t3(lang, '📊 पूरा स्कोरकार्ड', '📊 Full Scorecard', '📊 पूरा स्कोरकार्ड'),
                  },
                  {
                    mode: 'awards-ceremony' as BroadcastScreenMode,
                    label: t3(lang, '🏆 अवार्ड्स कार्ड', '🏆 Awards Card', '🏆 अवार्ड्स कार्ड'),
                  },
                  {
                    mode: 'squad-team-a' as BroadcastScreenMode,
                    label: `👥 ${liveState.battingTeamName}`,
                  },
                  {
                    mode: 'squad-team-b' as BroadcastScreenMode,
                    label: `👥 ${liveState.bowlingTeamName}`,
                  },
                  {
                    mode: 'squad-vs-both' as BroadcastScreenMode,
                    label: t3(lang, '⚔️ दोनों टीमें (VS)', '⚔️ Both Squads (VS)', '⚔️ दोनों टीमें (VS)'),
                  },
                  {
                    mode: 'full-sponsor-ad' as BroadcastScreenMode,
                    label: t3(lang, '📢 फुल विज्ञापन', '📢 Full Sponsor Ad', '📢 फुल विज्ञापन (Ad)'),
                  },
                ].map((b) => {
                  const active = liveState.screenMode === b.mode;
                  return (
                    <button
                      key={b.mode}
                      type="button"
                      onClick={() =>
                        pushLiveState({
                          ...liveState,
                          screenMode: b.mode,
                          celebration: 'none',
                        })
                      }
                      className={`p-2 rounded-xl text-[11px] font-black text-left cursor-pointer border transition-all ${
                        active
                          ? 'bg-[#0B192C] dark:bg-amber-500 text-amber-400 dark:text-slate-950 border-amber-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Download HD JPG / PDF */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={async () => {
                  const baseTpl =
                    templates.find((t) => t.id === 'tpl-fb-live-score-ad') ||
                    templates[0];
                  const sp =
                    liveState.sponsorsList[
                      liveState.activeSponsorIndex %
                        Math.max(1, liveState.sponsorsList.length)
                    ];
                  const customDoc: DesignDocument = {
                    ...baseTpl,
                    name: `${liveState.battingTeamName}_vs_${liveState.bowlingTeamName}_Score`,
                    elements: baseTpl.elements.map((el) => {
                      if (el.id === 'fbl-score-main') {
                        return {
                          ...el,
                          text: `${liveState.battingTeamName}: ${liveState.runs}/${liveState.wickets} (${liveState.overs}.${liveState.balls} OV) | VS ${liveState.bowlingTeamName}`,
                        };
                      }
                      if (el.id === 'fbl-batsmen') {
                        return {
                          ...el,
                          text: `🏏 ${cleanBroadcastName(
                            liveState.strikerName
                          )}: ${liveState.strikerRuns}(${
                            liveState.strikerBalls
                          }) | 🏏 ${cleanBroadcastName(
                            liveState.nonStrikerName
                          )}: ${liveState.nonStrikerRuns}(${
                            liveState.nonStrikerBalls
                          }) | ⚾ ${cleanBroadcastName(liveState.bowlerName)}`,
                        };
                      }
                      if (el.id === 'fbl-ad-banner' && sp) {
                        return {
                          ...el,
                          text: `📢 प्रायोजक: ${sp.shopName} (${sp.address}) — ${sp.tagline} | 📞 ${sp.mobile}`,
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
                }}
                className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                <span>HD JPG</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const baseTpl =
                    templates.find((t) => t.id === 'tpl-fb-live-score-ad') ||
                    templates[0];
                  await exportDesignDocument(baseTpl, {
                    format: 'pdf',
                    preset: 'original',
                    scale: 3,
                    filename: `${liveState.battingTeamName}_Live_Score`,
                  });
                }}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>HD PDF</span>
              </button>
            </div>
          </div>

          {/* LOCAL MARKET SPONSOR AD CONTROLLER */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-amber-500" />
                <span>
                  {t3(lang, 'दुकान विज्ञापन', 'Sponsor Ads', 'दुकान विज्ञापन (Sponsor Ads)')}
                </span>
              </h3>
              <span className="text-[11px] font-bold text-emerald-600">
                {liveState.autoRotateAds ? 'Auto ON' : 'Manual'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {liveState.sponsorsList.map((sp, idx) => {
                const isCurrent =
                  liveState.activeSponsorIndex %
                    Math.max(1, liveState.sponsorsList.length) ===
                  idx;
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => {
                      pushLiveState({
                        ...liveState,
                        activeSponsorIndex: idx,
                        showSponsorTicker: true,
                      });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isCurrent
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-2 ring-amber-400/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                        🏪 {sp.shopName}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 truncate">
                        {sp.tagline}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded shrink-0 ${
                        isCurrent
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isCurrent ? 'LIVE' : t3(lang, 'चलाएं', 'Show', 'चलाएं')}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Add Shop */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!quickShop.shopName.trim()) return;
                const newAd: LocalSponsorAd = {
                  id: `sp-${Date.now()}`,
                  shopName: quickShop.shopName,
                  ownerName: quickShop.ownerName || activeProfile.presidentName,
                  category: 'Local Market',
                  address: quickShop.address,
                  mobile: quickShop.mobile,
                  tagline: quickShop.tagline,
                  micScript: `🎤 "${quickShop.shopName} (${quickShop.address}) — ${quickShop.tagline}"`,
                };
                const updatedSponsors = [newAd, ...sponsors];
                onSaveSponsors?.(updatedSponsors);
                setQuickShop({ ...quickShop, shopName: '', ownerName: '' });
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800"
            >
              <input
                type="text"
                placeholder={t3(lang, 'दुकान का नाम...', 'Shop name...', 'दुकान का नाम...')}
                value={quickShop.shopName}
                onChange={(e) =>
                  setQuickShop({ ...quickShop, shopName: e.target.value })
                }
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
              <input
                type="text"
                placeholder={t3(lang, 'प्रचार लाइन...', 'Tagline / Offer...', 'प्रचार लाइन...')}
                value={quickShop.tagline}
                onChange={(e) =>
                  setQuickShop({ ...quickShop, tagline: e.target.value })
                }
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
              <button
                type="submit"
                className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
              >
                {t3(lang, '+ जोड़ें', '+ Add Shop', '+ जोड़ें')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
