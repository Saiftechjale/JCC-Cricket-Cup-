import React, { useState } from 'react';
import {
  Award,
  Calendar,
  ClipboardList,
  FileText,
  Palette,
  Plus,
  Save,
  Trash2,
  Trophy,
} from 'lucide-react';
import {
  BatsmanScoreRow,
  BowlerScoreRow,
  DesignDocument,
  Language,
  MatchResultRecord,
  MatchScheduleRecord,
  ScorecardRecord,
  TournamentProfile,
} from '../types/studio';
import {
  exportResultCardPDF,
  exportSchedulesPrintablePDF,
  exportScorecardPrintablePDF,
} from '../utils/exportEngine';

interface MatchManagerViewProps {
  lang: Language;
  initialSubTab: 'schedule' | 'result' | 'scorecard';
  schedules: MatchScheduleRecord[];
  results: MatchResultRecord[];
  scorecards: ScorecardRecord[];
  activeProfile: TournamentProfile;
  templates: DesignDocument[];
  onSaveSchedules: (list: MatchScheduleRecord[]) => void;
  onSaveResults: (list: MatchResultRecord[]) => void;
  onSaveScorecards: (list: ScorecardRecord[]) => void;
  onOpenInEditor: (doc: DesignDocument) => void;
}

export const MatchManagerView: React.FC<MatchManagerViewProps> = ({
  lang,
  initialSubTab,
  schedules,
  results,
  scorecards,
  activeProfile,
  templates,
  onSaveSchedules,
  onSaveResults,
  onSaveScorecards,
  onOpenInEditor,
}) => {
  const [subTab, setSubTab] = useState<'schedule' | 'result' | 'scorecard'>(
    initialSubTab
  );

  // Schedule form state
  const [newSch, setNewSch] = useState<Omit<MatchScheduleRecord, 'id'>>({
    matchNumber: schedules.length + 1,
    stage: 'League Match',
    teamA: 'जाले रॉयल इलेवन',
    teamB: 'दरभंगा टाइगर्स',
    matchDate: activeProfile.startingDate,
    matchTime: activeProfile.matchTime,
    venue: activeProfile.venue,
    status: 'Upcoming',
  });

  // Result form state
  const [newRes, setNewRes] = useState<Omit<MatchResultRecord, 'id'>>({
    matchNumber: results.length + 1,
    stage: 'लीग मुकाबला',
    matchDate: activeProfile.startingDate,
    teamA: 'जाले रॉयल इलेवन',
    teamAScore: '210',
    teamAWickets: '5',
    teamAOvers: '16.0',
    teamB: 'दरभंगा टाइगर्स',
    teamBScore: '184',
    teamBWickets: '8',
    teamBOvers: '16.0',
    winner: 'जाले रॉयल इलेवन',
    winMargin: '26 रनों से विजयी',
    playerOfTheMatch: 'मिर्ज़ा सैफ बेग',
    playerOfTheMatchStats: '72* (30 गेंद) एवं 2 विकेट',
    venue: activeProfile.venue,
  });

  // Active Scorecard state
  const [activeScorecardId, setActiveScorecardId] = useState<string>(
    scorecards[0]?.id || ''
  );
  const currentSc =
    scorecards.find((s) => s.id === activeScorecardId) || scorecards[0];

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const item: MatchScheduleRecord = {
      ...newSch,
      id: `sch-${Date.now()}`,
    };
    const next = [...schedules, item];
    onSaveSchedules(next);
    setNewSch({ ...newSch, matchNumber: next.length + 1 });
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
      battingTeam: 'टीम A (Team A)',
      bowlingTeam: 'टीम B (Team B)',
      batsmen: [
        { id: `b-${Date.now()}-1`, name: 'बल्लेबाज 1', dismissal: 'नाबाद', runs: 45, balls: 22, fours: 4, sixes: 3 },
        { id: `b-${Date.now()}-2`, name: 'बल्लेबाज 2', dismissal: 'बोल्ड', runs: 32, balls: 18, fours: 3, sixes: 2 },
      ],
      bowlers: [
        { id: `bw-${Date.now()}-1`, name: 'गेंदबाज 1', overs: '4.0', maidens: 0, runsConceded: 34, wickets: 2 },
      ],
      extras: 8,
      totalWickets: 4,
      totalOvers: '16.0',
      resultNote: 'टीम A विजयी रही।',
      manOfTheMatch: 'मिर्ज़ा सैफ बेग',
    };
    const next = [created, ...scorecards];
    onSaveScorecards(next);
    setActiveScorecardId(created.id);
  };

  const openScheduleInCanvasEditor = () => {
    const tpl =
      templates.find((t) => t.id === 'tpl-doc-match-schedule') || templates[0];
    const rows = schedules.map((s) => [
      `मैच #${s.matchNumber}`,
      s.stage,
      s.teamA,
      s.teamB,
      `${s.matchDate} (${s.matchTime})`,
    ]);
    const customDoc: DesignDocument = {
      ...tpl,
      id: `doc-sch-${Date.now()}`,
      elements: tpl.elements.map((el) =>
        el.type === 'table' ? { ...el, tableRows: rows } : el
      ),
    };
    onOpenInEditor(customDoc);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold">
            {lang === 'hi'
              ? 'मैच शेड्यूल, परिणाम एवं स्कोरकार्ड प्रबंधन'
              : 'Match Schedule, Result & Full Scorecard Studio'}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            {activeProfile.tournamentName} ({activeProfile.seasonNumber})
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setSubTab('schedule')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              subTab === 'schedule'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{lang === 'hi' ? '1. मैच शेड्यूल' : '1. Match Schedule'}</span>
          </button>
          <button
            onClick={() => setSubTab('result')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              subTab === 'result'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>{lang === 'hi' ? '2. मैच रिजल्ट' : '2. Match Results'}</span>
          </button>
          <button
            onClick={() => setSubTab('scorecard')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              subTab === 'scorecard'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>{lang === 'hi' ? '3. फुल स्कोरकार्ड' : '3. Full Scorecard'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MATCH SCHEDULE */}
      {subTab === 'schedule' && (
        <div className="space-y-6">
          <form
            onSubmit={handleAddSchedule}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {lang === 'hi' ? 'नया मैच शेड्यूल जोड़ें' : 'Add New Match Fixture'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openScheduleInCanvasEditor}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'hi'
                      ? 'शेड्यूल पोस्टर एडिटर में खोलें'
                      : 'Open Schedule in Canvas Editor'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    exportSchedulesPrintablePDF(schedules, activeProfile)
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'शेड्यूल PDF डाउनलोड' : 'Export Schedule PDF'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'hi' ? 'मैच नं०' : 'Match #'}
                </label>
                <input
                  type="number"
                  value={newSch.matchNumber}
                  onChange={(e) =>
                    setNewSch({ ...newSch, matchNumber: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'hi' ? 'चरण (Stage)' : 'Stage'}
                </label>
                <select
                  value={newSch.stage}
                  onChange={(e) =>
                    setNewSch({
                      ...newSch,
                      stage: e.target.value as MatchScheduleRecord['stage'],
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                >
                  <option value="League Match">League Match (लीग)</option>
                  <option value="Quarter Final">Quarter Final (क्वार्टर)</option>
                  <option value="Semi Final">Semi Final (सेमीफाइनल)</option>
                  <option value="Grand Final">Grand Final (फाइनल)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'hi' ? 'टीम A (Team A)' : 'Team A'}
                </label>
                <input
                  type="text"
                  required
                  value={newSch.teamA}
                  onChange={(e) => setNewSch({ ...newSch, teamA: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'hi' ? 'टीम B (Team B)' : 'Team B'}
                </label>
                <input
                  type="text"
                  required
                  value={newSch.teamB}
                  onChange={(e) => setNewSch({ ...newSch, teamB: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'hi' ? 'दिनांक (Date)' : 'Match Date'}
                </label>
                <input
                  type="text"
                  value={newSch.matchDate}
                  onChange={(e) =>
                    setNewSch({ ...newSch, matchDate: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-4 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'शेड्यूल जोड़ें' : 'Add Match'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Schedule Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-xs uppercase">
                  <th className="py-3.5 px-4">मैच #</th>
                  <th className="py-3.5 px-4">चरण (Stage)</th>
                  <th className="py-3.5 px-4">मुकाबला (Team A vs Team B)</th>
                  <th className="py-3.5 px-4">दिनांक एवं समय</th>
                  <th className="py-3.5 px-4">स्थान (Venue)</th>
                  <th className="py-3.5 px-4 text-right">एक्शन</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold tabular-nums">
                      #{s.matchNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-600 dark:text-amber-400">
                      {s.stage}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
                      {s.teamA} <span className="text-red-600 mx-1">VS</span> {s.teamB}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                      {s.matchDate} · {s.matchTime}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{s.venue}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() =>
                          onSaveSchedules(schedules.filter((item) => item.id !== s.id))
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
      )}

      {/* TAB 2: MATCH RESULTS */}
      {subTab === 'result' && (
        <div className="space-y-6">
          <form
            onSubmit={handleAddResult}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {lang === 'hi'
                ? 'नया मैच परिणाम (Match Result) दर्ज करें'
                : 'Record Match Result & Man of the Match'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {lang === 'hi' ? 'टीम A का नाम' : 'Team A Name'}
                </label>
                <input
                  type="text"
                  value={newRes.teamA}
                  onChange={(e) => setNewRes({ ...newRes, teamA: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {lang === 'hi' ? 'टीम A (रन / विकेट / ओवर)' : 'Team A Score / Wkts / Overs'}
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
                  value={newRes.teamB}
                  onChange={(e) => setNewRes({ ...newRes, teamB: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {lang === 'hi' ? 'टीम B (रन / विकेट / ओवर)' : 'Team B Score / Wkts / Overs'}
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
                  {lang === 'hi' ? 'मैन ऑफ द मैच (Player of Match)' : 'Player of the Match'}
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
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4"
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
                      onClick={() => exportResultCardPDF(res, activeProfile)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>PDF</span>
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

      {/* TAB 3: FULL SCORECARD MAKER */}
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
                <span>
                  {lang === 'hi' ? 'स्कोरकार्ड PDF डाउनलोड' : 'Download Scorecard PDF'}
                </span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-6">
            {/* Match Metadata */}
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
                  {lang === 'hi' ? 'बल्लेबाजी विवरण (Batsmen Scorecard)' : 'Batting Innings'}
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
                              handleUpdateScorecard({ ...currentSc, batsmen: next });
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
                              handleUpdateScorecard({ ...currentSc, batsmen: next });
                            }}
                            className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                          />
                        </td>
                        {(['runs', 'balls', 'fours', 'sixes'] as const).map((field) => (
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
                        ))}
                        <td className="p-2 text-right font-mono text-xs font-bold tabular-nums">
                          {b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0'}
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
                  {lang === 'hi' ? 'गेंदबाजी विवरण (Bowlers Scorecard)' : 'Bowling Figures'}
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
                              handleUpdateScorecard({ ...currentSc, bowlers: next });
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
                              handleUpdateScorecard({ ...currentSc, bowlers: next });
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
    </div>
  );
};
