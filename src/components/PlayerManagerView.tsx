import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Download,
  Edit3,
  FileSpreadsheet,
  FileText,
  Palette,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import {
  DesignDocument,
  Language,
  PlayerRecord,
  TournamentProfile,
} from '../types/studio';
import { exportPlayersPrintablePDF } from '../utils/exportEngine';

interface PlayerManagerViewProps {
  lang: Language;
  players: PlayerRecord[];
  activeProfile: TournamentProfile;
  playerListTemplate: DesignDocument;
  onSavePlayers: (players: PlayerRecord[]) => void;
  onOpenInEditor: (doc: DesignDocument) => void;
}

const EMPTY_PLAYER: Omit<PlayerRecord, 'id' | 'createdAt'> = {
  playerName: '',
  fatherName: '',
  mobileNumber: '',
  teamName: 'जाले रॉयल इलेवन (Jale Royal XI)',
  village: 'जाले, दरभंगा',
  jerseyNumber: '',
  role: 'All-Rounder',
  registrationStatus: 'Verified',
  entryFeePaid: '₹ 5,500 (जमा)',
};

export const PlayerManagerView: React.FC<PlayerManagerViewProps> = ({
  lang,
  players,
  activeProfile,
  playerListTemplate,
  onSavePlayers,
  onOpenInEditor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [editingPlayer, setEditingPlayer] = useState<PlayerRecord | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] =
    useState<Omit<PlayerRecord, 'id' | 'createdAt'>>(EMPTY_PLAYER);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const uniqueTeams = useMemo(() => {
    const set = new Set<string>();
    players.forEach((p) => {
      if (p.teamName) set.add(p.teamName);
    });
    return Array.from(set);
  }, [players]);

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      const matchesTeam = teamFilter === 'ALL' || p.teamName === teamFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        p.playerName.toLowerCase().includes(q) ||
        p.fatherName.toLowerCase().includes(q) ||
        p.mobileNumber.includes(q) ||
        p.teamName.toLowerCase().includes(q) ||
        p.jerseyNumber.toLowerCase().includes(q);
      return matchesTeam && matchesSearch;
    });
  }, [players, teamFilter, searchQuery]);

  const handleOpenAdd = () => {
    setEditingPlayer(null);
    setFormData(EMPTY_PLAYER);
    setShowFormModal(true);
  };

  const handleOpenEdit = (pl: PlayerRecord) => {
    setEditingPlayer(pl);
    setFormData({
      playerName: pl.playerName,
      fatherName: pl.fatherName,
      mobileNumber: pl.mobileNumber,
      teamName: pl.teamName,
      village: pl.village || '',
      jerseyNumber: pl.jerseyNumber,
      role: pl.role,
      registrationStatus: pl.registrationStatus,
      entryFeePaid: pl.entryFeePaid || '',
    });
    setShowFormModal(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.playerName.trim()) return;

    if (editingPlayer) {
      const next = players.map((p) =>
        p.id === editingPlayer.id ? { ...editingPlayer, ...formData } : p
      );
      onSavePlayers(next);
    } else {
      const created: PlayerRecord = {
        ...formData,
        id: `pl-${Date.now()}`,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      onSavePlayers([created, ...players]);
    }
    setShowFormModal(false);
  };

  const handleDeleteConfirmed = () => {
    if (!confirmDeleteId) return;
    onSavePlayers(players.filter((p) => p.id !== confirmDeleteId));
    setConfirmDeleteId(null);
  };

  const handleExportExcel = () => {
    const rows = filteredPlayers.map((p, i) => ({
      'S.No': i + 1,
      'Player Name': p.playerName,
      'Father Name': p.fatherName,
      'Mobile Number': p.mobileNumber,
      'Team Name': p.teamName,
      'Village/City': p.village,
      'Jersey Number': p.jerseyNumber,
      Role: p.role,
      'Registration Status': p.registrationStatus,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Players');
    XLSX.writeFile(wb, `Jale_Cricket_Players_${teamFilter}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);
        const imported: PlayerRecord[] = json.map((row, idx) => ({
          id: `pl-imp-${Date.now()}-${idx}`,
          playerName: String(row['Player Name'] || row['Name'] || row['खिलाड़ी का नाम'] || `Player ${idx + 1}`),
          fatherName: String(row['Father Name'] || row['पिता का नाम'] || ''),
          mobileNumber: String(row['Mobile Number'] || row['Mobile'] || row['मोबाइल'] || ''),
          teamName: String(row['Team Name'] || row['Team'] || row['टीम'] || 'जाले रॉयल इलेवन'),
          village: String(row['Village/City'] || row['जाले'] || ''),
          jerseyNumber: String(row['Jersey Number'] || row['Jersey'] || idx + 1),
          role: (row['Role'] as PlayerRecord['role']) || 'All-Rounder',
          registrationStatus:
            (row['Registration Status'] as PlayerRecord['registrationStatus']) ||
            'Verified',
          createdAt: new Date().toISOString().slice(0, 10),
        }));
        if (imported.length > 0) {
          onSavePlayers([...imported, ...players]);
        }
      } catch (err) {
        console.error('Excel import error:', err);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleOpenTeamUndertakingInEditor = () => {
    const listToFill = filteredPlayers.slice(0, 15);
    const rows: string[][] = [];
    for (let i = 0; i < 15; i++) {
      const pl = listToFill[i];
      const defaultRole =
        i === 0
          ? '(C) / (Batsman) / Bowler'
          : i === 1
          ? '(VC) / (Batsman) / Bowler'
          : i === 2
          ? '(WK) / (Batsman) / Bowler (All-rounder)'
          : '(Batsman) / (Bowler) (All-rounder)';
      rows.push([
        String(i + 1),
        pl ? `${pl.playerName} (#${pl.jerseyNumber})` : '',
        pl ? pl.role : defaultRole,
      ]);
    }

    const captain =
      listToFill.find((p) => p.role.includes('Captain')) || listToFill[0];
    const teamTitle =
      teamFilter !== 'ALL'
        ? teamFilter
        : captain?.teamName || 'जाले रॉयल इलेवन';

    const customizedDoc: DesignDocument = {
      ...playerListTemplate,
      id: `doc-playerlist-${Date.now()}`,
      name: `15-Player List — ${teamTitle}`,
      nameHi: `खिलाड़ियों की सूची एवं शपथ पत्र — ${teamTitle}`,
      elements: playerListTemplate.elements.map((el) => {
        if (el.id === 'plf-table') {
          return { ...el, tableRows: rows };
        }
        if (el.id === 'plf-left-team-details') {
          return {
            ...el,
            text: `• टीम का नाम: ${teamTitle}\n• गाँव/शहर: ${captain?.village || 'जाले, दरभंगा'}\n• कप्तान का नाम: ${captain?.playerName || '................................'}\n• मोबाईल नंबर: ${captain?.mobileNumber || activeProfile.contactNumber}\n\nएंट्री फीस (₹): ${activeProfile.entryFee}  स्थिति: [✓] जमा / बाकी\n(नोट: एंट्री फीस में कोई रियायत नहीं, मैच से पहले पूरा भुगतान अनिवार्य)\n\n| विशेष नोट: खेल के दौरान यदि किसी खिलाड़ी को बॉल या बल्ले से चोट लगती है, या खेल भावना के तहत कोई अन्य अनहोनी/दुर्घटना होती है, तो इसके लिए टूर्नामेंट कमिटी या आयोजक मंडल जिम्मेदार नहीं होंगे।`,
          };
        }
        return el;
      }),
    };

    onOpenInEditor(customizedDoc);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header & Action Buttons */}
      <div className="rounded-2xl bg-slate-900 text-white p-5 sm:p-6 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
            <Users className="w-4 h-4" />
            <span>
              {lang === 'hi'
                ? 'खिलाड़ी पंजीकरण एवं टीम शपथ पत्र प्रबंधन'
                : 'Player Registration & Team Undertaking Management'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold">
            {lang === 'hi'
              ? 'खिलाड़ियों की सूची (Player List & Team Roster)'
              : 'Tournament Player Roster & Undertaking Form'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            {lang === 'hi'
              ? 'खिलाड़ियों का रिकॉर्ड जोड़ें, टीम के अनुसार फिल्टर करें, Excel इम्पोर्ट/एक्सपोर्ट करें या सीधे 15-खिलाड़ियों वाला शपथ पत्र प्रिंट करें।'
              : 'Manage player registrations, filter by team, import/export Excel sheets, or generate the printable 15-player undertaking form.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'hi' ? 'नया खिलाड़ी जोड़ें' : 'Add Player'}</span>
          </button>

          <button
            onClick={handleOpenTeamUndertakingInEditor}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
          >
            <Palette className="w-4 h-4" />
            <span>
              {lang === 'hi'
                ? '15-खिलाड़ी शपथ पत्र डिज़ाइन खोलें'
                : 'Open 15-Player Form in Editor'}
            </span>
          </button>

          <button
            onClick={() =>
              exportPlayersPrintablePDF(filteredPlayers, activeProfile, teamFilter)
            }
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>{lang === 'hi' ? 'प्रिंटेबल PDF डाउनलोड' : 'Printable List PDF'}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Excel Export</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Excel Import</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportExcel}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Search & Team Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'hi'
                ? 'खिलाड़ी का नाम, पिता का नाम, मोबाइल या जर्सी नंबर खोजें...'
                : 'Search by player name, father name, mobile, or jersey number...'
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
            {lang === 'hi' ? 'टीम फिल्टर:' : 'Filter Team:'}
          </span>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
          >
            <option value="ALL">
              {lang === 'hi' ? `सभी टीमें (${players.length})` : `All Teams (${players.length})`}
            </option>
            {uniqueTeams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Players Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-xs uppercase">
                <th className="py-3.5 px-4 font-bold">#</th>
                <th className="py-3.5 px-4 font-bold">
                  {lang === 'hi' ? 'खिलाड़ी का नाम' : 'Player Name'}
                </th>
                <th className="py-3.5 px-4 font-bold">
                  {lang === 'hi' ? 'पिता का नाम' : 'Father Name'}
                </th>
                <th className="py-3.5 px-4 font-bold">
                  {lang === 'hi' ? 'टीम का नाम' : 'Team Name'}
                </th>
                <th className="py-3.5 px-4 font-bold">
                  {lang === 'hi' ? 'जर्सी / भूमिका' : 'Jersey & Role'}
                </th>
                <th className="py-3.5 px-4 font-bold">
                  {lang === 'hi' ? 'मोबाइल नंबर' : 'Mobile'}
                </th>
                <th className="py-3.5 px-4 font-bold">
                  {lang === 'hi' ? 'पंजीकरण स्थिति' : 'Status'}
                </th>
                <th className="py-3.5 px-4 font-bold text-right">
                  {lang === 'hi' ? 'एक्शन' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-slate-500 font-semibold"
                  >
                    {lang === 'hi'
                      ? 'कोई खिलाड़ी नहीं मिला। ऊपर "नया खिलाड़ी जोड़ें" बटन दबाएं।'
                      : 'No players found. Click "Add Player" above to add records.'}
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((pl, idx) => (
                  <tr
                    key={pl.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-xs text-slate-500 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {pl.playerName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {pl.fatherName}
                    </td>
                    <td className="py-3 px-4 font-semibold text-blue-700 dark:text-blue-400">
                      {pl.teamName}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                      #{pl.jerseyNumber} · {pl.role}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700 dark:text-slate-300 tabular-nums">
                      {pl.mobileNumber}
                    </td>
                    <td className="py-3 px-4 text-xs font-bold">
                      <span
                        className={
                          pl.registrationStatus === 'Verified' ||
                          pl.registrationStatus === 'Paid'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }
                      >
                        {pl.registrationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(pl)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Edit Player"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(pl.id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                          title="Delete Player"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Player Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {editingPlayer
                  ? lang === 'hi'
                    ? 'खिलाड़ी का विवरण बदलें'
                    : 'Edit Player Details'
                  : lang === 'hi'
                  ? 'नया खिलाड़ी पंजीकृत करें'
                  : 'Register New Player'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'hi' ? 'खिलाड़ी का नाम *' : 'Player Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.playerName}
                    onChange={(e) =>
                      setFormData({ ...formData, playerName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'hi' ? 'पिता का नाम' : 'Father Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) =>
                      setFormData({ ...formData, fatherName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}
                  </label>
                  <input
                    type="text"
                    value={formData.mobileNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, mobileNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'hi' ? 'टीम का नाम' : 'Team Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.teamName}
                    onChange={(e) =>
                      setFormData({ ...formData, teamName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'hi' ? 'जर्सी नंबर' : 'Jersey Number'}
                  </label>
                  <input
                    type="text"
                    value={formData.jerseyNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, jerseyNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'hi' ? 'भूमिका (Role)' : 'Playing Role'}
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as PlayerRecord['role'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                  >
                    <option value="Captain (C)">Captain (C)</option>
                    <option value="Vice-Captain (VC)">Vice-Captain (VC)</option>
                    <option value="Wicket-Keeper (WK)">Wicket-Keeper (WK)</option>
                    <option value="Batsman">Batsman</option>
                    <option value="Bowler">Bowler</option>
                    <option value="All-Rounder">All-Rounder</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'hi' ? 'गाँव / शहर' : 'Village / City'}
                  </label>
                  <input
                    type="text"
                    value={formData.village}
                    onChange={(e) =>
                      setFormData({ ...formData, village: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'hi' ? 'पंजीकरण स्थिति' : 'Registration Status'}
                  </label>
                  <select
                    value={formData.registrationStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registrationStatus: e.target
                          .value as PlayerRecord['registrationStatus'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                  >
                    <option value="Verified">Verified (सत्यापित)</option>
                    <option value="Paid">Paid (शुल्क जमा)</option>
                    <option value="Pending">Pending (बाकी)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-extrabold cursor-pointer"
                >
                  {lang === 'hi' ? 'सेव करें' : 'Save Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deleting Player */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
              {lang === 'hi'
                ? 'क्या आप इस खिलाड़ी को हटाना चाहते हैं?'
                : 'Delete this player record?'}
            </h4>
            <p className="text-xs text-slate-500">
              {lang === 'hi'
                ? 'यह रिकॉर्ड सूची से स्थायी रूप से हटा दिया जाएगा।'
                : 'This player will be removed from the tournament roster.'}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
              >
                {lang === 'hi' ? 'नहीं (Cancel)' : 'Cancel'}
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold cursor-pointer"
              >
                {lang === 'hi' ? 'हाँ, हटाएं (Delete)' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
