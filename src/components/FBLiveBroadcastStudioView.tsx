import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  FileText,
  Image as ImageIcon,
  Megaphone,
  Minimize2,
  Minus,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Smartphone,
  Tv,
  Undo2,
  Users,
} from 'lucide-react';
import {
  BroadcastCelebrationType,
  BroadcastScreenMode,
  DesignDocument,
  Language,
  LiveBroadcastRoomState,
  LocalSponsorAd,
  TeamSquadRecord,
  TournamentProfile,
} from '../types/studio';
import { exportDesignDocument } from '../utils/exportEngine';

const SHARED_CLOUD_ORIGIN =
  'https://ais-pre-jyr2zrqjzkpgapapyfwsme-967710688708.asia-southeast1.run.app';

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

  return (
    <div
      style={{
        backgroundColor: transparentBg ? 'transparent' : undefined,
      }}
      className={`relative w-full h-full flex flex-col justify-between select-none overflow-hidden ${
        transparentBg
          ? ''
          : 'bg-gradient-to-b from-emerald-950/90 via-slate-900/75 to-slate-950'
      } ${
        compactPreview
          ? 'aspect-video rounded-2xl border-2 border-slate-700 shadow-2xl'
          : 'min-h-screen'
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
          TOP CORNER BUGS
      ===================================================================== */}
      {isTopBadgeVisible ? (
        <div className="relative z-10 flex items-start justify-between gap-2 p-2.5 sm:p-4 pointer-events-none">
          <div className="flex items-center gap-2 bg-[#0B192C]/92 border border-amber-400/80 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl shadow-lg">
            <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-md animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white" />
              LIVE
            </span>
            <div className="leading-tight">
              <div className="text-[11px] sm:text-xs font-black text-amber-400 tracking-wide">
                {state.tournamentName}
              </div>
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-300">
                {state.matchStage} • {state.seasonNumber}
              </div>
            </div>
          </div>

          {state.showSponsorTicker && activeSponsor && (
            <div className="hidden sm:flex flex-col items-end bg-slate-950/90 border border-amber-400/60 px-3 py-1 rounded-xl shadow-lg max-w-xs">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-400">
                📢 प्रायोजक (SPONSOR)
              </span>
              <span className="text-xs font-black text-white truncate max-w-[220px]">
                {activeSponsor.shopName}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div />
      )}

      {/* =====================================================================
          CENTER DYNAMIC BROADCAST GRAPHICS (SQUAD / FULL AD / CELEBRATION)
      ===================================================================== */}
      <div className="relative z-20 flex-1 flex items-center justify-center px-3 sm:px-8 py-1 pointer-events-none">
        {/* 1. 4 / 6 / WICKET CELEBRATION POPUP */}
        {showCelebration && (
          <div className="w-full max-w-2xl rounded-3xl bg-gradient-to-r from-red-700 via-amber-500 to-red-700 p-1 shadow-2xl animate-bounce">
            <div className="bg-[#0B192C] rounded-[20px] px-5 py-4 sm:py-6 text-center space-y-2 border-2 border-amber-300">
              <div className="inline-block px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-widest">
                {state.celebration === 'SIX'
                  ? '🚀 MAXIMUM SIXER • 6 RUNS!'
                  : state.celebration === 'FOUR'
                  ? '🔥 SUPER BOUNDARY • 4 RUNS!'
                  : state.celebration === 'WICKET'
                  ? '🎯 BIG WICKET DOWN • OUT!'
                  : '⭐ MILESTONE CELEBRATION!'}
              </div>
              <div className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {state.celebrationText}
              </div>
              {activeSponsor && (
                <div className="pt-2 border-t border-white/15 text-xs sm:text-sm font-extrabold text-amber-300">
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
              <div className="bg-gradient-to-r from-red-700 via-amber-500 to-blue-900 px-4 py-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-950 bg-amber-300 px-2 py-0.5 rounded">
                    15-खिलाड़ी सूची (11 PLAYING XI + 4 EXTRA)
                  </span>
                  <h3 className="text-base sm:text-xl font-black text-white mt-0.5">
                    🏏{' '}
                    {state.screenMode === 'squad-team-a'
                      ? state.battingTeamName
                      : state.bowlingTeamName}
                  </h3>
                </div>
                <div className="text-right text-xs font-extrabold text-amber-200">
                  <div>{state.tournamentName}</div>
                  <div className="text-[10px] text-white">{state.venue}</div>
                </div>
              </div>

              <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
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
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-extrabold ${
                          isExtra
                            ? 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                            : 'bg-slate-900/90 border-white/15 text-white'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-black shrink-0 ${
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
                          {pName || `खिलाड़ी ${idx + 1}`}
                        </span>
                        {idx === 0 && (
                          <span className="ml-auto text-[9px] bg-amber-400 text-slate-950 px-1 rounded font-black">
                            C
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

        {/* 3. BOTH TEAMS SIDE-BY-SIDE SQUAD COMPARISON */}
        {!showCelebration && state.screenMode === 'squad-vs-both' && (
          <div className="w-full max-w-4xl rounded-2xl bg-[#0B192C]/96 border-2 border-amber-400 text-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-900 via-red-700 to-blue-900 px-4 py-2 text-center">
              <div className="text-[10px] font-black text-amber-300 uppercase tracking-widest">
                {state.tournamentName} • दोनों टीमों की खिलाड़ी सूची
              </div>
              <div className="text-sm sm:text-lg font-black text-white">
                {state.battingTeamName}{' '}
                <span className="text-amber-400 mx-2">VS</span>{' '}
                {state.bowlingTeamName}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4 p-3 sm:p-4">
              <div className="space-y-1">
                <div className="bg-blue-700 text-white px-2.5 py-1 rounded-lg text-xs font-black truncate">
                  🏏 {state.battingTeamName}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {state.teamAPlayers.slice(0, 15).map((p, idx) => (
                    <div
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-[11px] font-bold truncate"
                    >
                      <span className="text-amber-400 font-mono mr-1">
                        {idx + 1}.
                      </span>
                      {p}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="bg-red-700 text-white px-2.5 py-1 rounded-lg text-xs font-black truncate">
                  ⚾ {state.bowlingTeamName}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {state.teamBPlayers.slice(0, 15).map((p, idx) => (
                    <div
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-[11px] font-bold truncate"
                    >
                      <span className="text-amber-400 font-mono mr-1">
                        {idx + 1}.
                      </span>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. FULL-SCREEN BREAK SPONSOR AD */}
        {!showCelebration &&
          state.screenMode === 'full-sponsor-ad' &&
          activeSponsor && (
            <div className="w-full max-w-2xl rounded-3xl bg-gradient-to-br from-[#0B192C] via-[#1E3A8A] to-[#0B192C] border-4 border-amber-400 p-5 sm:p-8 text-center text-white shadow-2xl space-y-3">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase">
                📢 टूर्नामेंट प्रायोजक विज्ञापन (OFFICIAL SPONSOR)
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-amber-300 leading-tight">
                🏪 {activeSponsor.shopName}
              </h2>
              <p className="text-sm sm:text-lg font-extrabold text-white bg-red-600/90 py-2 px-4 rounded-xl">
                “{activeSponsor.tagline}”
              </p>
              <div className="text-xs sm:text-base font-bold text-sky-200 space-y-1 pt-1">
                <div>📍 पता: {activeSponsor.address}</div>
                <div className="text-amber-300 text-sm sm:text-lg font-black">
                  👤 प्रोप्राइटर: {activeSponsor.ownerName} • 📞 मोबाइल:{' '}
                  {activeSponsor.mobile}
                </div>
              </div>
            </div>
          )}
      </div>

      {/* =====================================================================
          BOTTOM TV LOWER-THIRD SCOREBOARD + AUTO SPONSOR AD (TOGGLEABLE ON/OFF)
      ===================================================================== */}
      <div className="relative z-20 w-full px-2 sm:px-4 pb-2 sm:pb-3 space-y-1.5 pointer-events-none">
        {/* Main TV Score Strip — Hides cleanly when showScoreboard is OFF */}
        {isScoreVisible && (
          <div className="w-full rounded-2xl bg-gradient-to-r from-[#091326]/96 via-[#1E3A8A]/96 to-[#091326]/96 border-2 border-amber-400 shadow-2xl px-3 sm:px-5 py-2 sm:py-2.5 text-white">
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-12 sm:col-span-5 flex items-center justify-between sm:justify-start gap-3 border-b sm:border-b-0 sm:border-r border-white/15 pb-1.5 sm:pb-0 sm:pr-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-amber-300 truncate">
                      {state.battingTeamName}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">
                      vs {state.bowlingTeamName}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white tabular-nums">
                      {state.runs}/{state.wickets}
                    </span>
                    <span className="text-xs sm:text-sm font-mono font-extrabold text-amber-400">
                      ({state.overs}.{state.balls}/{state.totalMatchOvers} Ov)
                    </span>
                  </div>
                </div>

                <div className="text-right sm:ml-auto shrink-0">
                  <div className="text-[10px] font-extrabold text-sky-300">
                    CRR: {crr}
                  </div>
                  {state.targetRuns > 0 ? (
                    <div className="text-[10px] sm:text-[11px] font-black bg-emerald-600 px-2 py-0.5 rounded text-white">
                      Target: {state.targetRuns} (Need {runsNeeded} in{' '}
                      {totalBallsRemaining}b)
                    </div>
                  ) : (
                    <div className="text-[10px] font-bold text-amber-200 max-w-[140px] truncate">
                      {state.tossOrStatusNote}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-7 sm:col-span-4 grid grid-cols-1 gap-0.5 border-r border-white/15 pr-2 text-xs">
                <div className="flex items-center justify-between font-black text-amber-300">
                  <span className="truncate">🏏 {state.strikerName}*</span>
                  <span className="font-mono tabular-nums ml-2">
                    {state.strikerRuns}{' '}
                    <span className="text-[10px] text-slate-300">
                      ({state.strikerBalls})
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between font-bold text-slate-200">
                  <span className="truncate">🏏 {state.nonStrikerName}</span>
                  <span className="font-mono tabular-nums ml-2">
                    {state.nonStrikerRuns}{' '}
                    <span className="text-[10px] text-slate-400">
                      ({state.nonStrikerBalls})
                    </span>
                  </span>
                </div>
              </div>

              <div className="col-span-5 sm:col-span-3 flex flex-col justify-between text-xs pl-1">
                <div className="flex items-center justify-between font-extrabold text-sky-300">
                  <span className="truncate">⚾ {state.bowlerName}</span>
                  <span className="font-mono text-white ml-1">
                    {state.bowlerWickets}-{state.bowlerRuns}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1 overflow-x-auto no-scrollbar">
                  <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">
                    Over:
                  </span>
                  {(state.thisOverBalls.length > 0
                    ? state.thisOverBalls
                    : ['•']
                  ).map((b, idx) => (
                    <span
                      key={idx}
                      className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-mono font-black shrink-0 ${
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
              </div>
            </div>
          </div>
        )}

        {/* Automatic Rotating Sponsor Ad Strip — Hides when showSponsorTicker is OFF */}
        {state.showSponsorTicker && activeSponsor && (
          <div className="w-full rounded-xl bg-amber-400 text-slate-950 px-3 sm:px-4 py-1.5 border-2 border-red-600 shadow-lg flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs font-black">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] uppercase shrink-0">
                विज्ञापन
              </span>
              <span className="truncate">
                🏪 {activeSponsor.shopName} ({activeSponsor.address}) —{' '}
                <span className="text-red-800">{activeSponsor.tagline}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 bg-slate-950 text-amber-300 px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px]">
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
  const [needsNextBatsman, setNeedsNextBatsman] = useState<boolean>(false);

  // Build initial default state
  const [liveState, setLiveState] = useState<LiveBroadcastRoomState>(() => {
    const teamA = teams[0];
    const teamB = teams[1];
    return {
      roomId: (initialRoomId || 'JALE-2026').toUpperCase(),
      tournamentName: activeProfile.tournamentName,
      seasonNumber: activeProfile.seasonNumber,
      venue: activeProfile.venue,
      matchStage: 'QUARTER FINAL #1',
      battingTeamId: teamA?.id || 'team-1',
      battingTeamName:
        teamA?.teamName.replace(/^\d+\.\s*/, '') || 'जाले रॉयल इलेवन',
      bowlingTeamId: teamB?.id || 'team-2',
      bowlingTeamName:
        teamB?.teamName.replace(/^\d+\.\s*/, '') || 'दरभंगा टाइगर्स',
      runs: 148,
      wickets: 3,
      overs: 11,
      balls: 4,
      totalMatchOvers: 16,
      targetRuns: 195,
      tossOrStatusNote: 'टॉस जीतकर पहले बल्लेबाजी',
      strikerName: teamA?.players[0] || 'मिर्ज़ा सैफ बेग',
      strikerRuns: 64,
      strikerBalls: 26,
      nonStrikerName: teamA?.players[1] || 'मो० अरमान खान',
      nonStrikerRuns: 32,
      nonStrikerBalls: 18,
      bowlerName: teamB?.players[0] || 'राहुल कुमार सिंह',
      bowlerWickets: 2,
      bowlerRuns: 28,
      bowlerOvers: '3.4',
      thisOverBalls: ['1', '4', '0', '6'],
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
    setTimeout(() => setToast(null), 2400);
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

    return () => {
      bcRef.current?.close();
      es?.close();
      ws?.close();
    };
  }, [roomId]);

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

  // Ball-by-Ball Scoring Handler (Automatically saves to Undo Stack!)
  const handleBallScore = (
    runsAdded: number,
    options?: {
      isWicket?: boolean;
      isExtra?: boolean;
      extraLabel?: string;
      celebration?: BroadcastCelebrationType;
    }
  ) => {
    const isWicket = options?.isWicket || false;
    const isExtra = options?.isExtra || false;

    let nextBalls = isExtra ? liveState.balls : liveState.balls + 1;
    let nextOvers = liveState.overs;
    let nextThisOver = [...liveState.thisOverBalls];
    let overCompleted = false;

    const ballBadge = isWicket
      ? 'W'
      : isExtra
      ? options?.extraLabel || 'WD'
      : String(runsAdded);

    if (nextBalls >= 6) {
      nextOvers += 1;
      nextBalls = 0;
      nextThisOver = [];
      overCompleted = true;
    } else {
      nextThisOver = [...nextThisOver.slice(-5), ballBadge];
    }

    const nextStrikerRuns = isExtra
      ? liveState.strikerRuns
      : liveState.strikerRuns + runsAdded;
    const nextStrikerBalls = isExtra
      ? liveState.strikerBalls
      : liveState.strikerBalls + 1;

    // Swap strike on odd runs (1, 3), or at end of over (flipped if odd runs on last ball)
    const oddRunSwap = !isExtra && (runsAdded === 1 || runsAdded === 3);
    const shouldSwapStrike = overCompleted ? !oddRunSwap : oddRunSwap;

    const celebrationType: BroadcastCelebrationType =
      options?.celebration ||
      (isWicket
        ? 'WICKET'
        : runsAdded === 6
        ? 'SIX'
        : runsAdded === 4
        ? 'FOUR'
        : 'none');

    const celebrationText =
      celebrationType === 'SIX'
        ? `${liveState.strikerName} — शानदार छक्का (6 RUNS)!`
        : celebrationType === 'FOUR'
        ? `${liveState.strikerName} — दर्शनीय चौका (4 RUNS)!`
        : celebrationType === 'WICKET'
        ? `OUT! विकेट गिरा (${liveState.strikerName})`
        : '';

    if (isWicket) {
      setNeedsNextBatsman(true);
    }

    const nextState: LiveBroadcastRoomState = {
      ...liveState,
      runs: Math.max(0, liveState.runs + runsAdded),
      wickets: isWicket
        ? Math.min(10, liveState.wickets + 1)
        : liveState.wickets,
      overs: nextOvers,
      balls: nextBalls,
      strikerName: shouldSwapStrike
        ? liveState.nonStrikerName
        : liveState.strikerName,
      strikerRuns: shouldSwapStrike
        ? liveState.nonStrikerRuns
        : nextStrikerRuns,
      strikerBalls: shouldSwapStrike
        ? liveState.nonStrikerBalls
        : nextStrikerBalls,
      nonStrikerName: shouldSwapStrike
        ? liveState.strikerName
        : liveState.nonStrikerName,
      nonStrikerRuns: shouldSwapStrike
        ? nextStrikerRuns
        : liveState.nonStrikerRuns,
      nonStrikerBalls: shouldSwapStrike
        ? nextStrikerBalls
        : liveState.nonStrikerBalls,
      bowlerRuns: Math.max(0, liveState.bowlerRuns + runsAdded),
      bowlerWickets: isWicket
        ? liveState.bowlerWickets + 1
        : liveState.bowlerWickets,
      thisOverBalls: nextThisOver,
      celebration: celebrationType,
      celebrationText,
      celebrationTimestamp: celebrationType !== 'none' ? Date.now() : 0,
    };

    pushLiveState(nextState, true);
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
    const cleanName = found.teamName.replace(/^\d+\.\s*/, '');
    pushLiveState(
      {
        ...liveState,
        battingTeamId: found.id,
        battingTeamName: cleanName,
        teamAPlayers: found.players,
        strikerName: found.players[0] || 'बल्लेबाज 1',
        strikerRuns: 0,
        strikerBalls: 0,
        nonStrikerName: found.players[1] || 'बल्लेबाज 2',
        nonStrikerRuns: 0,
        nonStrikerBalls: 0,
      },
      true
    );
  };

  const handleSelectTeamB = (teamId: string) => {
    const found = teams.find((t) => t.id === teamId);
    if (!found) return;
    const cleanName = found.teamName.replace(/^\d+\.\s*/, '');
    pushLiveState(
      {
        ...liveState,
        bowlingTeamId: found.id,
        bowlingTeamName: cleanName,
        teamBPlayers: found.players,
        bowlerName: found.players[0] || 'गेंदबाज 1',
        bowlerRuns: 0,
        bowlerWickets: 0,
      },
      true
    );
  };

  const overlayUrl = useMemo(() => {
    const base = getPublicShareOrigin();
    return `${base}/?liveOverlay=1&room=${encodeURIComponent(roomId)}`;
  }, [roomId]);

  if (overlayOnly) {
    return <BroadcastOverlayCanvas state={liveState} transparentBg={true} />;
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-5 space-y-5 overflow-x-hidden">
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-300 text-xs font-extrabold">
          <Check className="w-4 h-4 shrink-0 stroke-[3]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Fullscreen TV Overlay Monitor Modal */}
      {fullscreenMonitor && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-black/80 text-white border-b border-white/10">
            <span className="text-xs font-black text-amber-400">
              🔴 FULL-SCREEN LIVE OVERLAY PREVIEW (ROOM: {roomId})
            </span>
            <button
              onClick={() => setFullscreenMonitor(false)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-black cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>वापस कंट्रोलर पर जाएं</span>
            </button>
          </div>
          <div className="flex-1">
            <BroadcastOverlayCanvas state={liveState} transparentBg={false} />
          </div>
        </div>
      )}

      {/* =====================================================================
          TOP BAR: SIMPLE ROOM CODE + 1-CLICK OVERLAY LINK COPY
      ===================================================================== */}
      <div className="rounded-2xl bg-[#0B192C] text-white p-4 border-2 border-amber-500/60 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase">
              <Radio className="w-3 h-3 animate-pulse" />
              2-Mobile Live Control
            </span>
            <span className="text-xs font-bold text-emerald-400">
              {syncConnected ? '● दोनों मोबाइल कनेक्टेड हैं' : '● लाइव सिंक चालू है'}
            </span>
          </div>
          <h1 className="text-base sm:text-xl font-black text-amber-400">
            🔴 फेसबुक लाइव रिमोट स्कोरर, खिलाड़ी सूची & ऑटो-विज्ञापन कंट्रोलर
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="text-[11px] font-bold text-slate-400">कोड:</span>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="w-24 bg-transparent text-amber-300 font-mono font-black text-xs uppercase focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(overlayUrl);
              triggerToast(
                '✓ Live Overlay लिंक कॉपी हो गया! कैमरा फोन के PRISM Live में पेस्ट करें।'
              );
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-sm"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>कैमरा फोन (PRISM Live) लिंक कॉपी करें</span>
          </button>

          <button
            type="button"
            onClick={() => setFullscreenMonitor(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer border border-slate-700"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>फुल स्क्रीन देखें</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          STEP 1: 3 SIMPLE ON/OFF TOGGLE SWITCHES (SHOW / HIDE SCORE & ADS ANYTIME)
      ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Toggle 1: Live Scoreboard ON/OFF */}
        <button
          type="button"
          onClick={() => {
            const nextVal = !(liveState.showScoreboard !== false);
            pushLiveState({ ...liveState, showScoreboard: nextVal });
            triggerToast(
              nextVal
                ? '✓ लाइव स्कोरबोर्ड स्क्रीन पर चालू (ON) हो गया!'
                : '✓ लाइव स्कोरबोर्ड छुपा दिया गया (OFF) — स्क्रीन अब बिल्कुल साफ है!'
            );
          }}
          className={`p-3.5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${
            liveState.showScoreboard !== false
              ? 'bg-emerald-600 text-white border-emerald-300 shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800'
          }`}
        >
          <div className="text-left">
            <div className="text-xs font-black uppercase">
              1. लाइव स्कोर पट्टी (Scoreboard)
            </div>
            <div className="text-[11px] font-bold opacity-90 mt-0.5">
              {liveState.showScoreboard !== false
                ? 'अभी स्क्रीन पर दिख रहा है (ON)'
                : 'अभी बंद है / छुपा हुआ है (OFF)'}
            </div>
          </div>
          <div
            className={`w-14 h-7 rounded-full p-1 transition-colors flex items-center ${
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
            triggerToast(
              nextVal
                ? '✓ दुकान विज्ञापन पट्टी चालू (ON) हो गई!'
                : '✓ दुकान विज्ञापन पट्टी बंद (OFF) कर दी गई!'
            );
          }}
          className={`p-3.5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${
            liveState.showSponsorTicker
              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800'
          }`}
        >
          <div className="text-left">
            <div className="text-xs font-black uppercase">
              2. दुकान विज्ञापन पट्टी (Ads Bar)
            </div>
            <div className="text-[11px] font-bold opacity-90 mt-0.5">
              {liveState.showSponsorTicker
                ? 'विज्ञापन दिख रहा है (ON)'
                : 'विज्ञापन बंद है (OFF)'}
            </div>
          </div>
          <div
            className={`w-14 h-7 rounded-full p-1 transition-colors flex items-center ${
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
            triggerToast(
              nextVal
                ? '✓ ऑटोमैटिक विज्ञापन रोटेशन चालू (हर 20 सेकंड में दुकान बदलेगी)!'
                : '✓ ऑटोमैटिक विज्ञापन बदलना बंद किया गया।'
            );
          }}
          className={`p-3.5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${
            liveState.autoRotateAds
              ? 'bg-blue-600 text-white border-blue-300 shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800'
          }`}
        >
          <div className="text-left">
            <div className="text-xs font-black uppercase">
              3. ऑटोमैटिक विज्ञापन (Auto Ads)
            </div>
            <div className="text-[11px] font-bold opacity-90 mt-0.5">
              {liveState.autoRotateAds
                ? `हर ${liveState.autoRotateSeconds}s में अपने-आप बदलेगा (ON)`
                : 'मैनुअल मोड (OFF)'}
            </div>
          </div>
          <div
            className={`w-14 h-7 rounded-full p-1 transition-colors flex items-center ${
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
          MAIN WORKSPACE: SCORING + MISTAKE FIXER (LEFT) & LIVE PREVIEW (RIGHT)
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 space-y-5">
          {/* CARD A: SUPER-SIMPLE SCORING PAD + MISTAKE FIXER (UNDO & +/-) */}
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUndoLastMistake}
                  disabled={undoStack.length === 0}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs sm:text-sm cursor-pointer shadow-lg active:scale-95"
                >
                  <Undo2 className="w-4 h-4 stroke-[3]" />
                  <span>गलती सुधारें / पिछली गेंद हटाएं (UNDO)</span>
                </button>
              </div>
            </div>

            {/* IF WICKET FELL: AUTOMATIC PROMPT TO PICK NEXT BATSMAN IN 1 TAP */}
            {needsNextBatsman && (
              <div className="p-3.5 rounded-2xl bg-amber-500 text-slate-950 space-y-2 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase">
                    🎯 विकेट गिरा! अगला नया बल्लेबाज 1-क्लिक में चुनें:
                  </span>
                  <button
                    type="button"
                    onClick={() => setNeedsNextBatsman(false)}
                    className="text-xs font-black underline cursor-pointer"
                  >
                    बंद करें
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {liveState.teamAPlayers
                    .filter(
                      (p) =>
                        p &&
                        p !== liveState.strikerName &&
                        p !== liveState.nonStrikerName
                    )
                    .map((player, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          pushLiveState(
                            {
                              ...liveState,
                              strikerName: player,
                              strikerRuns: 0,
                              strikerBalls: 0,
                            },
                            true
                          );
                          setNeedsNextBatsman(false);
                          triggerToast(`✓ नया बल्लेबाज "${player}" क्रीज पर!`);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-950 text-white text-xs font-bold cursor-pointer hover:bg-slate-800"
                      >
                        + {player}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* 8 BIG 1-TAP BALL SCORING BUTTONS */}
            <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => handleBallScore(0)}
                className="py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 font-black text-sm border border-white/15 cursor-pointer active:scale-95"
              >
                0 (डॉट गेंद)
              </button>
              <button
                type="button"
                onClick={() => handleBallScore(1)}
                className="py-3.5 rounded-2xl bg-blue-700 hover:bg-blue-600 font-black text-sm cursor-pointer active:scale-95"
              >
                +1 रन
              </button>
              <button
                type="button"
                onClick={() => handleBallScore(2)}
                className="py-3.5 rounded-2xl bg-blue-700 hover:bg-blue-600 font-black text-sm cursor-pointer active:scale-95"
              >
                +2 रन
              </button>
              <button
                type="button"
                onClick={() => handleBallScore(3)}
                className="py-3.5 rounded-2xl bg-blue-700 hover:bg-blue-600 font-black text-sm cursor-pointer active:scale-95"
              >
                +3 रन
              </button>

              <button
                type="button"
                onClick={() => handleBallScore(4, { celebration: 'FOUR' })}
                className="py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm cursor-pointer shadow-md active:scale-95"
              >
                🔥 +4 चौका
              </button>
              <button
                type="button"
                onClick={() => handleBallScore(6, { celebration: 'SIX' })}
                className="py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm cursor-pointer shadow-md active:scale-95"
              >
                🚀 +6 छक्का
              </button>
              <button
                type="button"
                onClick={() =>
                  handleBallScore(0, { isWicket: true, celebration: 'WICKET' })
                }
                className="py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm cursor-pointer shadow-md active:scale-95"
              >
                🎯 OUT विकेट
              </button>
              <button
                type="button"
                onClick={() =>
                  handleBallScore(1, { isExtra: true, extraLabel: 'WD' })
                }
                className="py-4 rounded-2xl bg-purple-700 hover:bg-purple-600 text-white font-black text-sm cursor-pointer active:scale-95"
              >
                +1 वाइड / NB
              </button>
            </div>

            {/* INSTANT MISTAKE CORRECTION BAR (+/- RUNS, WICKETS, BALLS, OVERS) */}
            <div className="bg-slate-900/95 rounded-2xl p-3 border border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-amber-300">
                <span>
                  🛠️ तुरंत गलती सुधार बटन (अगर रन, विकेट या गेंद गलत दब जाए तो यहाँ से घटाएं/बढ़ाएं):
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
                        strikerRuns: 0,
                        strikerBalls: 0,
                        nonStrikerRuns: 0,
                        nonStrikerBalls: 0,
                        bowlerRuns: 0,
                        bowlerWickets: 0,
                        thisOverBalls: [],
                        celebration: 'none',
                      },
                      true
                    );
                    triggerToast('✓ स्कोर 0/0 पर रीसेट हो गया (UNDO से वापस भी ला सकते हैं)');
                  }}
                  className="text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>स्कोर 0/0 रीसेट</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-black">
                {/* Runs -/+ */}
                <div className="flex items-center justify-between bg-slate-800 rounded-xl p-1.5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => handleQuickAdjust('runs', -1)}
                    className="w-8 h-7 rounded-lg bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-slate-200">
                    रन ({liveState.runs})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickAdjust('runs', 1)}
                    className="w-8 h-7 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Wickets -/+ */}
                <div className="flex items-center justify-between bg-slate-800 rounded-xl p-1.5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => handleQuickAdjust('wickets', -1)}
                    className="w-8 h-7 rounded-lg bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-slate-200">
                    विकेट ({liveState.wickets})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickAdjust('wickets', 1)}
                    className="w-8 h-7 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Balls -/+ */}
                <div className="flex items-center justify-between bg-slate-800 rounded-xl p-1.5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => handleQuickAdjust('balls', -1)}
                    className="w-8 h-7 rounded-lg bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-slate-200">
                    गेंद (.{liveState.balls})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickAdjust('balls', 1)}
                    className="w-8 h-7 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Overs -/+ */}
                <div className="flex items-center justify-between bg-slate-800 rounded-xl p-1.5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => handleQuickAdjust('overs', -1)}
                    className="w-8 h-7 rounded-lg bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-slate-200">
                    ओवर ({liveState.overs})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickAdjust('overs', 1)}
                    className="w-8 h-7 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* SIMPLE TEAM & PLAYER DROPDOWNS RIGHT INSIDE THE PAD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-amber-300 mb-1">
                  🏏 बल्लेबाजी टीम (8 टीमों में से चुनें):
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
                  ⚾ गेंदबाजी टीम (8 टीमों में से चुनें):
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

              {/* Striker & Non-Striker with 1-Tap Swap */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-300">
                    बल्लेबाज 1 (Striker*)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      pushLiveState({
                        ...liveState,
                        strikerName: liveState.nonStrikerName,
                        strikerRuns: liveState.nonStrikerRuns,
                        strikerBalls: liveState.nonStrikerBalls,
                        nonStrikerName: liveState.strikerName,
                        nonStrikerRuns: liveState.strikerRuns,
                        nonStrikerBalls: liveState.strikerBalls,
                      })
                    }
                    className="text-[10px] font-black text-amber-400 flex items-center gap-0.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>स्ट्राइक बदलें</span>
                  </button>
                </div>
                <select
                  value={liveState.strikerName}
                  onChange={(e) =>
                    pushLiveState({
                      ...liveState,
                      strikerName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 text-xs font-bold"
                >
                  {liveState.teamAPlayers.map((p, i) => (
                    <option key={i} value={p}>
                      {i + 1}. {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  बल्लेबाज 2 (Non-Striker)
                </label>
                <select
                  value={liveState.nonStrikerName}
                  onChange={(e) =>
                    pushLiveState({
                      ...liveState,
                      nonStrikerName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                >
                  {liveState.teamAPlayers.map((p, i) => (
                    <option key={i} value={p}>
                      {i + 1}. {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  वर्तमान गेंदबाज (Current Bowler)
                </label>
                <select
                  value={liveState.bowlerName}
                  onChange={(e) =>
                    pushLiveState({
                      ...liveState,
                      bowlerName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sky-300 text-xs font-bold"
                >
                  {liveState.teamBPlayers.map((p, i) => (
                    <option key={i} value={p}>
                      {i + 1}. {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  टारगेट रन (पहली पारी में 0 रखें)
                </label>
                <input
                  type="number"
                  value={liveState.targetRuns}
                  onChange={(e) =>
                    pushLiveState({
                      ...liveState,
                      targetRuns: Number(e.target.value),
                    })
                  }
                  placeholder="0 = 1st Innings"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* CARD B: 1-TAP SCREEN DISPLAY BUTTONS (SHOW 15-PLAYER LIST OR FULL AD ON LIVE) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-xs">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Tv className="w-4 h-4 text-red-600" />
              <span>
                लाइव स्क्रीन पर 15-खिलाड़ी सूची या बड़ा विज्ञापन दिखाएं (1-Tap Screen Mode):
              </span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                {
                  mode: 'score-ticker' as BroadcastScreenMode,
                  label: '📺 नॉर्मल मैच मोड (सिर्फ नीचे पट्टी)',
                },
                {
                  mode: 'squad-team-a' as BroadcastScreenMode,
                  label: `👥 ${liveState.battingTeamName} (15 खिलाड़ी)`,
                },
                {
                  mode: 'squad-team-b' as BroadcastScreenMode,
                  label: `👥 ${liveState.bowlingTeamName} (15 खिलाड़ी)`,
                },
                {
                  mode: 'squad-vs-both' as BroadcastScreenMode,
                  label: '⚔️ दोनों टीमों की सूची एक साथ',
                },
                {
                  mode: 'full-sponsor-ad' as BroadcastScreenMode,
                  label: '📢 फुल-स्क्रीन दुकान विज्ञापन',
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
                    className={`p-2.5 rounded-xl text-xs font-black text-left cursor-pointer border transition-all ${
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

          {/* CARD C: SIMPLE LOCAL MARKET SPONSOR AD LIST */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-amber-500" />
                <span>लोकल मार्केट दुकान विज्ञापन (टैप करके तुरंत बदलें)</span>
              </h3>
              <span className="text-[11px] font-bold text-emerald-600">
                {liveState.autoRotateAds ? 'ऑटो रोटेशन चालू है' : 'मैनुअल'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                      triggerToast(`✓ "${sp.shopName}" का विज्ञापन चालू हो गया!`);
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
                      {isCurrent ? 'LIVE' : 'चलाएं'}
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
                triggerToast('✓ नई दुकान का विज्ञापन जुड़ गया!');
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800"
            >
              <input
                type="text"
                placeholder="नई दुकान का नाम..."
                value={quickShop.shopName}
                onChange={(e) =>
                  setQuickShop({ ...quickShop, shopName: e.target.value })
                }
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
              <input
                type="text"
                placeholder="ऑफर / प्रचार लाइन..."
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
                + दुकान जोड़ें
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT 5 COLUMNS: LIVE TV PREVIEW MONITOR & FB POST DOWNLOAD */}
        <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-red-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                <span>LIVE TV MONITOR (मोबाइल 1 पर ऐसा दिखेगा)</span>
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

            {/* Download HD JPG / PDF for Facebook Page */}
            <div className="grid grid-cols-2 gap-2 pt-1">
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
                          text: `🏏 ${liveState.strikerName}: ${liveState.strikerRuns}(${liveState.strikerBalls}) | 🏏 ${liveState.nonStrikerName}: ${liveState.nonStrikerRuns}(${liveState.nonStrikerBalls}) | ⚾ ${liveState.bowlerName}`,
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
                <span>स्कोर पोस्ट HD JPG</span>
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
                <span>स्कोर कार्ड HD PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
