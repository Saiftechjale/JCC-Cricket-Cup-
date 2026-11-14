import { LiveBroadcastRoomState } from '../types/studio';

export function getSyncTopicName(roomId: string): string {
  const clean = (roomId || 'JALE-2026')
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '_');
  return `jale_cricket_sync_v2_${clean}`;
}

export function getPageTopicName(roomId: string): string {
  const clean = (roomId || 'JALE-2026')
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '_');
  return `jale_cricket_page_v2_${clean}`;
}

/**
 * Publishes the updated LiveBroadcastRoomState to the public ntfy.sh realtime channel
 * so PRISM Live Studio Web Widget, Android APK, and Laptop stay synced over 4G/5G/Wi-Fi.
 */
export async function pushStateToPublicCloud(
  roomId: string,
  state: LiveBroadcastRoomState
): Promise<void> {
  const topic = getSyncTopicName(roomId);
  try {
    await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      body: JSON.stringify(state),
    });
  } catch {
    // ignore network hiccups
  }
}

/**
 * Subscribes the controller / viewer to the public ntfy.sh channel via WebSocket + initial poll.
 */
export function subscribeToPublicCloud(
  roomId: string,
  onReceiveState: (state: LiveBroadcastRoomState) => void
): () => void {
  const topic = getSyncTopicName(roomId);
  let closed = false;
  let ws: WebSocket | null = null;

  // 1. Fetch most recent state from the last 12 hours
  fetch(`https://ntfy.sh/${topic}/json?poll=1&since=12h`)
    .then((r) => r.text())
    .then((text) => {
      if (closed || !text.trim()) return;
      const lines = text.trim().split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const env = JSON.parse(lines[i]);
          if (env.event === 'message' && env.message) {
            const parsed = JSON.parse(env.message);
            if (parsed && parsed.roomId && parsed.updatedAt) {
              onReceiveState(parsed as LiveBroadcastRoomState);
              break;
            }
          }
        } catch {
          // ignore
        }
      }
    })
    .catch(() => {});

  // 2. Connect live WebSocket
  try {
    ws = new WebSocket(`wss://ntfy.sh/${topic}/ws`);
    ws.onmessage = (ev) => {
      if (closed) return;
      try {
        const env = JSON.parse(String(ev.data));
        if (env.event === 'message' && env.message) {
          const parsed = JSON.parse(env.message);
          if (parsed && parsed.roomId && parsed.updatedAt) {
            onReceiveState(parsed as LiveBroadcastRoomState);
          }
        }
      } catch {
        // ignore
      }
    };
  } catch {
    // ignore
  }

  return () => {
    closed = true;
    try {
      ws?.close();
    } catch {
      // ignore
    }
  };
}

/**
 * Generates a 100% self-contained, transparent-background HTML document for PRISM Live Studio's Web Widget.
 * Uses pure inline CSS & vanilla JS (zero external dependencies) so htmlpreview.github.io renders it with HTTP 200.
 */
export function buildStandalonePrismOverlayHtml(
  roomId: string,
  initialState: LiveBroadcastRoomState
): string {
  const topic = getSyncTopicName(roomId);
  const safeInitialJson = JSON.stringify(initialState).replace(
    /<\/script>/gi,
    '<\\/script>'
  );

  return `<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<title>Jale Cricket Live Overlay (${roomId})</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: transparent !important;
    background-color: rgba(0,0,0,0) !important;
    font-family: system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif;
    color: #ffffff;
    user-select: none;
  }
  #overlay-root {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 10px 12px 14px 12px;
    background: transparent !important;
  }
  .top-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }
  .live-badge-box {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(11, 25, 44, 0.94);
    border: 2px solid #fbbf24;
    padding: 5px 12px;
    border-radius: 12px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.45);
  }
  .live-pill {
    background: #dc2626;
    color: #fff;
    font-size: 10px;
    font-weight: 900;
    padding: 2px 7px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #fff;
  }
  .tourn-title {
    font-size: 12px;
    font-weight: 900;
    color: #fbbf24;
    line-height: 1.15;
  }
  .tourn-sub {
    font-size: 10px;
    font-weight: 700;
    color: #cbd5e1;
  }
  .top-sponsor-box {
    background: rgba(9, 19, 38, 0.92);
    border: 1.5px solid rgba(251, 191, 36, 0.7);
    padding: 4px 10px;
    border-radius: 10px;
    text-align: right;
    max-width: 220px;
  }
  .center-stage {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    overflow: hidden;
  }
  .center-card {
    width: 100%;
    max-width: 720px;
    background: rgba(11, 25, 44, 0.96);
    border: 2.5px solid #fbbf24;
    border-radius: 18px;
    box-shadow: 0 12px 32px rgba(0,0,0,0.65);
    overflow: hidden;
    color: #fff;
  }
  .center-header {
    background: linear-gradient(90deg, #b91c1c, #d97706, #1e3a8a);
    padding: 8px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .squad-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 5px;
    padding: 10px;
  }
  @media (max-width: 540px) {
    .squad-grid { grid-template-columns: repeat(2, 1fr); }
  }
  .squad-item {
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 8px;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .squad-num {
    background: #1d4ed8;
    color: #fff;
    font-size: 9px;
    font-weight: 900;
    width: 18px;
    height: 18px;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .celebration-box {
    width: 100%;
    max-width: 560px;
    background: linear-gradient(135deg, #0b192c, #1e3a8a);
    border: 3px solid #fbbf24;
    border-radius: 22px;
    padding: 16px;
    text-align: center;
    box-shadow: 0 15px 40px rgba(0,0,0,0.75);
  }
  .bottom-stack {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
  }
  .score-card {
    width: 100%;
    background: linear-gradient(90deg, rgba(9,19,38,0.97), rgba(30,58,138,0.97), rgba(9,19,38,0.97));
    border: 2px solid #fbbf24;
    border-radius: 16px;
    padding: 8px 12px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.6);
  }
  .score-row-1 {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px;
    border-bottom: 1px solid rgba(255,255,255,0.16);
    padding-bottom: 5px;
    margin-bottom: 5px;
  }
  .team-title {
    font-size: 13px;
    font-weight: 900;
    color: #fcd34d;
  }
  .vs-text {
    font-size: 11px;
    font-weight: 700;
    color: #cbd5e1;
    margin: 0 4px;
  }
  .big-runs {
    font-size: 22px;
    font-weight: 900;
    font-family: monospace;
    color: #ffffff;
    margin-left: 6px;
  }
  .overs-text {
    font-size: 12px;
    font-weight: 800;
    font-family: monospace;
    color: #fbbf24;
    margin-left: 4px;
  }
  .target-pill {
    background: #059669;
    color: #fff;
    font-size: 10px;
    font-weight: 900;
    padding: 2px 8px;
    border-radius: 6px;
  }
  .score-row-2 {
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    gap: 8px;
    align-items: center;
    font-size: 11px;
  }
  .bat-box {
    border-right: 1px solid rgba(255,255,255,0.16);
    padding-right: 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .bat-line {
    display: flex;
    justify-content: space-between;
    font-weight: 800;
  }
  .striker { color: #fcd34d; font-weight: 900; }
  .non-striker { color: #e2e8f0; }
  .bowl-box {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .bowl-line {
    display: flex;
    justify-content: space-between;
    color: #7dd3fc;
    font-weight: 800;
  }
  .balls-row {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }
  .ball-chip {
    width: 17px;
    height: 17px;
    border-radius: 50%;
    font-size: 9px;
    font-weight: 900;
    font-family: monospace;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #1e293b;
    color: #fff;
    border: 1px solid rgba(255,255,255,0.25);
  }
  .ball-4 { background: #10b981; color: #fff; border: none; }
  .ball-6 { background: #fbbf24; color: #0f172a; border: none; }
  .ball-W { background: #dc2626; color: #fff; border: none; }
  .ad-bar {
    width: 100%;
    background: #fbbf24;
    color: #0f172a;
    border: 2px solid #dc2626;
    border-radius: 12px;
    padding: 5px 10px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    font-size: 11px;
    font-weight: 900;
    box-shadow: 0 6px 18px rgba(0,0,0,0.45);
  }
  .ad-tag {
    background: #dc2626;
    color: #fff;
    font-size: 9px;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    margin-right: 5px;
  }
  .ad-contact {
    background: #0f172a;
    color: #fcd34d;
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 6px;
  }
</style>
</head>
<body>
<div id="overlay-root"></div>
<script>
(function() {
  var state = ${safeInitialJson};
  var TOPIC = "${topic}";

  function cleanName(raw) {
    if (!raw) return "";
    return String(raw).replace(/^\\d+\\.\\s*/, "").replace(/\\s*\\([^)]*\\)\\s*/g, " ").trim();
  }

  function render() {
    var root = document.getElementById("overlay-root");
    if (!root || !state) return;

    var now = Date.now();
    var showCel = state.celebration && state.celebration !== "none" && (now - (state.celebrationTimestamp || 0) < 5500);
    var sponsors = state.sponsorsList || [];
    var sp = sponsors.length > 0 ? sponsors[(state.activeSponsorIndex || 0) % sponsors.length] : null;

    var oversDec = (state.overs || 0) + ((state.balls || 0) / 6);
    var crr = oversDec > 0 ? ((state.runs || 0) / oversDec).toFixed(2) : "0.00";
    var ballsRem = (state.totalMatchOvers || 16) * 6 - ((state.overs || 0) * 6 + (state.balls || 0));
    var runsNeed = (state.targetRuns || 0) > 0 ? Math.max(0, state.targetRuns - (state.runs || 0)) : 0;

    var teamA = cleanName(state.battingTeamName) || "टीम A";
    var teamB = cleanName(state.bowlingTeamName) || "टीम B";
    var striker = cleanName(state.strikerName) || "बल्लेबाज 1";
    var nonStriker = cleanName(state.nonStrikerName) || "बल्लेबाज 2";
    var bowler = cleanName(state.bowlerName) || "गेंदबाज";

    // TOP ROW
    var topHtml = '<div></div>';
    if (state.showTopBadge !== false) {
      topHtml = '<div class="top-row">' +
        '<div class="live-badge-box">' +
          '<span class="live-pill"><span class="live-dot"></span>LIVE</span>' +
          '<div>' +
            '<div class="tourn-title">' + (state.tournamentName || "JALE CRICKET CUP") + '</div>' +
            '<div class="tourn-sub">' + (state.matchStage || "LIVE MATCH") + ' • ' + (state.seasonNumber || "") + '</div>' +
          '</div>' +
        '</div>' +
        (state.showSponsorTicker && sp ? (
          '<div class="top-sponsor-box">' +
            '<div style="font-size:8px;color:#fbbf24;font-weight:900;">📢 प्रायोजक (SPONSOR)</div>' +
            '<div style="font-size:11px;color:#fff;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + sp.shopName + '</div>' +
          '</div>'
        ) : '') +
      '</div>';
    }

    // CENTER GRAPHICS
    var centerHtml = '';
    if (showCel) {
      var badge = state.celebration === "SIX" ? "🚀 MAXIMUM SIXER • 6 RUNS!" :
                  state.celebration === "FOUR" ? "🔥 SUPER BOUNDARY • 4 RUNS!" :
                  "🎯 BIG WICKET DOWN • OUT!";
      centerHtml = '<div class="celebration-box">' +
        '<div style="display:inline-block;background:#fbbf24;color:#0f172a;font-size:11px;font-weight:900;padding:3px 10px;border-radius:99px;margin-bottom:6px;">' + badge + '</div>' +
        '<div style="font-size:24px;font-weight:900;color:#fff;">' + (state.celebrationText || "") + '</div>' +
        (sp ? '<div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.2);font-size:11px;color:#fcd34d;font-weight:800;">📢 प्रायोजक: ' + sp.shopName + ' — ' + sp.tagline + '</div>' : '') +
      '</div>';
    } else if (state.screenMode === "squad-team-a" || state.screenMode === "squad-team-b") {
      var isA = state.screenMode === "squad-team-a";
      var list = (isA ? state.teamAPlayers : state.teamBPlayers) || [];
      var items = "";
      for (var i = 0; i < Math.min(15, list.length); i++) {
        items += '<div class="squad-item"><span class="squad-num">' + (i + 1) + '</span><span>' + cleanName(list[i]) + '</span></div>';
      }
      centerHtml = '<div class="center-card">' +
        '<div class="center-header">' +
          '<div><div style="font-size:10px;font-weight:900;color:#fde68a;">15-खिलाड़ी सूची (PLAYING XI + EXTRA)</div>' +
          '<div style="font-size:16px;font-weight:900;">🏏 ' + (isA ? teamA : teamB) + '</div></div>' +
          '<div style="font-size:10px;font-weight:800;text-align:right;">' + (state.tournamentName || "") + '</div>' +
        '</div>' +
        '<div class="squad-grid">' + items + '</div>' +
      '</div>';
    } else if (state.screenMode === "full-sponsor-ad" && sp) {
      centerHtml = '<div class="celebration-box">' +
        '<div style="display:inline-block;background:#fbbf24;color:#0f172a;font-size:10px;font-weight:900;padding:3px 10px;border-radius:99px;margin-bottom:6px;">📢 टूर्नामेंट प्रायोजक विज्ञापन</div>' +
        '<div style="font-size:24px;font-weight:900;color:#fcd34d;margin-bottom:6px;">🏪 ' + sp.shopName + '</div>' +
        '<div style="font-size:14px;font-weight:800;background:#dc2626;color:#fff;padding:6px 12px;border-radius:10px;margin-bottom:6px;">“' + sp.tagline + '”</div>' +
        '<div style="font-size:12px;color:#bae6fd;font-weight:800;">📍 ' + sp.address + ' • 👤 ' + sp.ownerName + ' • 📞 ' + sp.mobile + '</div>' +
      '</div>';
    }

    // BOTTOM SCOREBOARD + AD BAR
    var scoreHtml = '';
    if (state.showScoreboard !== false) {
      var ballsArr = (state.thisOverBalls && state.thisOverBalls.length > 0) ? state.thisOverBalls : ["•"];
      var ballsChips = "";
      for (var j = 0; j < ballsArr.length; j++) {
        var b = ballsArr[j];
        var cls = b === "6" ? "ball-chip ball-6" : b === "4" ? "ball-chip ball-4" : b === "W" ? "ball-chip ball-W" : "ball-chip";
        ballsChips += '<span class="' + cls + '">' + b + '</span>';
      }

      scoreHtml = '<div class="score-card">' +
        '<div class="score-row-1">' +
          '<div style="display:flex;align-items:baseline;flex-wrap:wrap;">' +
            '<span class="team-title">' + teamA + '</span>' +
            '<span class="vs-text">vs ' + teamB + '</span>' +
            '<span class="big-runs">' + (state.runs || 0) + '/' + (state.wickets || 0) + '</span>' +
            '<span class="overs-text">(' + (state.overs || 0) + '.' + (state.balls || 0) + '/' + (state.totalMatchOvers || 16) + ' Ov)</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<span style="font-size:10px;font-weight:800;color:#7dd3fc;">CRR: ' + crr + '</span>' +
            ((state.targetRuns || 0) > 0
              ? '<span class="target-pill">Target: ' + state.targetRuns + ' (Need ' + runsNeed + ' in ' + ballsRem + 'b)</span>'
              : '<span style="font-size:10px;color:#fde68a;font-weight:700;">' + (state.tossOrStatusNote || "") + '</span>') +
          '</div>' +
        '</div>' +
        '<div class="score-row-2">' +
          '<div class="bat-box">' +
            '<div class="bat-line striker"><span>🏏 ' + striker + '*</span><span>' + (state.strikerRuns || 0) + '(' + (state.strikerBalls || 0) + ')</span></div>' +
            '<div class="bat-line non-striker"><span>🏏 ' + nonStriker + '</span><span>' + (state.nonStrikerRuns || 0) + '(' + (state.nonStrikerBalls || 0) + ')</span></div>' +
          '</div>' +
          '<div class="bowl-box">' +
            '<div class="bowl-line"><span>⚾ ' + bowler + '</span><span style="color:#fff;">' + (state.bowlerWickets || 0) + '-' + (state.bowlerRuns || 0) + ' (' + (state.bowlerOvers || "0.0") + ')</span></div>' +
            '<div class="balls-row"><span style="font-size:9px;color:#94a3b8;font-weight:800;">OVER:</span>' + ballsChips + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    var adBarHtml = '';
    if (state.showSponsorTicker && sp) {
      adBarHtml = '<div class="ad-bar">' +
        '<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">' +
          '<span class="ad-tag">विज्ञापन</span>' +
          '<span>🏪 ' + sp.shopName + ' (' + sp.address + ') — <span style="color:#991b1b;">' + sp.tagline + '</span></span>' +
        '</div>' +
        '<div class="ad-contact">प्रो०: ' + sp.ownerName + ' • 📞 ' + sp.mobile + '</div>' +
      '</div>';
    }

    root.innerHTML = topHtml +
      '<div class="center-stage">' + centerHtml + '</div>' +
      '<div class="bottom-stack">' + scoreHtml + adBarHtml + '</div>';
  }

  function applyState(next) {
    if (next && typeof next.runs === "number") {
      state = next;
      render();
    }
  }

  function pollLatest() {
    fetch("https://ntfy.sh/" + TOPIC + "/json?poll=1&since=12h")
      .then(function(r) { return r.text(); })
      .then(function(txt) {
        if (!txt) return;
        var lines = txt.trim().split("\\n");
        for (var i = lines.length - 1; i >= 0; i--) {
          try {
            var env = JSON.parse(lines[i]);
            if (env.event === "message" && env.message) {
              var p = JSON.parse(env.message);
              if (p && typeof p.runs === "number") {
                applyState(p);
                break;
              }
            }
          } catch (e) {}
        }
      })
      .catch(function() {});
  }

  function connectRealtime() {
    try {
      var ws = new WebSocket("wss://ntfy.sh/" + TOPIC + "/ws");
      ws.onmessage = function(ev) {
        try {
          var env = JSON.parse(ev.data);
          if (env.event === "message" && env.message) {
            var p = JSON.parse(env.message);
            applyState(p);
          }
        } catch (e) {}
      };
      ws.onclose = function() {
        setTimeout(connectRealtime, 3000);
      };
    } catch (e) {}
  }

  render();
  pollLatest();
  connectRealtime();
  setInterval(pollLatest, 2500);
  setInterval(render, 1000);
})();
</script>
</body>
</html>`;
}

/**
 * Cleans any GitHub URL or "user/repo" string into a clean "username/reponame" slug.
 */
export function cleanGitHubRepoSlug(input?: string): string {
  if (!input) return '';
  let s = input.trim();
  s = s.replace(/^https?:\/\/(www\.)?github\.com\//i, '');
  s = s.replace(/\.git$/i, '');
  const parts = s.split('/').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`;
  }
  return '';
}

/**
 * Builds the 100% Lifetime Permanent (Non-Expiring) PRISM Live URL hosted directly
 * from the user's GitHub repository (/public/live-overlay.html).
 */
export function getPermanentGitHubWidgetUrl(
  repoSlugInput?: string,
  branch = 'main'
): string | null {
  const envRepo =
    (typeof import.meta !== 'undefined' &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_GITHUB_REPO) ||
    '';
  const envBranch =
    (typeof import.meta !== 'undefined' &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_GITHUB_BRANCH) ||
    branch;

  const savedRepo =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('jale_github_repo_slug') || ''
      : '';

  const slug = cleanGitHubRepoSlug(repoSlugInput || savedRepo || envRepo);
  if (!slug) return null;

  return `https://htmlpreview.github.io/?https://raw.githubusercontent.com/${slug}/${envBranch}/public/live-overlay.html`;
}

/**
 * Uploads the standalone PRISM Live HTML overlay to ntfy.sh and returns a 100% public,
 * zero-auth HTTP 200 URL via htmlpreview.github.io that works inside PRISM Live Studio's Web Widget.
 * If a valid public GitHub repository slug is available and reachable, returns the Lifetime Permanent GitHub URL!
 */
export async function generatePublicPrismWidgetUrl(
  roomId: string,
  state: LiveBroadcastRoomState,
  customRepoSlug?: string
): Promise<string> {
  // First push the latest state to the sync topic
  await pushStateToPublicCloud(roomId, state);

  // Check if Permanent GitHub URL is configured & reachable
  const permUrl = getPermanentGitHubWidgetUrl(customRepoSlug);
  if (permUrl) {
    const rawTarget = permUrl.replace('https://htmlpreview.github.io/?', '');
    try {
      const checkRes = await fetch(rawTarget, { method: 'HEAD' });
      if (checkRes.ok) {
        return permUrl;
      }
      // Try master branch fallback
      const masterRaw = rawTarget.replace('/main/public/', '/master/public/');
      const checkMaster = await fetch(masterRaw, { method: 'HEAD' });
      if (checkMaster.ok) {
        return `https://htmlpreview.github.io/?${masterRaw}`;
      }
    } catch {
      // fall through to instant cloud upload
    }
  }

  const pageTopic = getPageTopicName(roomId);
  const htmlContent = buildStandalonePrismOverlayHtml(roomId, state);

  const response = await fetch(`https://ntfy.sh/${pageTopic}`, {
    method: 'POST',
    headers: {
      Filename: 'jale-live-overlay.html',
    },
    body: htmlContent,
  });

  if (!response.ok) {
    throw new Error('Failed to publish public overlay page');
  }

  const data = await response.json();
  const fileUrl = data?.attachment?.url;
  if (!fileUrl) {
    throw new Error('No attachment URL returned');
  }

  return `https://htmlpreview.github.io/?${fileUrl}`;
}

