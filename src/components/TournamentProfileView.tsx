import React, { useState } from 'react';
import {
  Check,
  Copy,
  Plus,
  Save,
  Shield,
  Sparkles,
  Trash2,
  Trophy,
  Upload,
} from 'lucide-react';
import { Language, TournamentProfile } from '../types/studio';

interface TournamentProfileViewProps {
  lang: Language;
  profiles: TournamentProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onSaveProfiles: (profiles: TournamentProfile[], activeId: string) => void;
}

export const TournamentProfileView: React.FC<TournamentProfileViewProps> = ({
  lang,
  profiles,
  activeProfileId,
  onSelectProfile,
  onSaveProfiles,
}) => {
  const currentProfile =
    profiles.find((p) => p.id === activeProfileId) || profiles[0];
  const [form, setForm] = useState<TournamentProfile>(currentProfile);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSelect = (p: TournamentProfile) => {
    onSelectProfile(p.id);
    setForm(p);
  };

  const handleFieldChange = (key: keyof TournamentProfile, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedList = profiles.map((p) => (p.id === form.id ? form : p));
    onSaveProfiles(updatedList, form.id);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleDuplicateSeason = () => {
    const newId = `profile-${Date.now()}`;
    const nextSeasonNum = form.seasonNumber.replace(/\d+/, (m) =>
      String(Number(m) + 1)
    );
    const cloned: TournamentProfile = {
      ...form,
      id: newId,
      seasonNumber: nextSeasonNum === form.seasonNumber ? `${form.seasonNumber} (New)` : nextSeasonNum,
      updatedAt: new Date().toISOString(),
    };
    const nextList = [...profiles, cloned];
    onSaveProfiles(nextList, newId);
    setForm(cloned);
  };

  const handleCreateBlankProfile = () => {
    const newId = `profile-${Date.now()}`;
    const fresh: TournamentProfile = {
      ...currentProfile,
      id: newId,
      tournamentName: 'नया क्रिकेट कप टूर्नामेंट - 2026',
      tournamentNameEn: 'NEW CRICKET CUP 2026',
      seasonNumber: 'SEASON-1',
      updatedAt: new Date().toISOString(),
    };
    const nextList = [...profiles, fresh];
    onSaveProfiles(nextList, newId);
    setForm(fresh);
  };

  const handleDeleteProfile = (id: string) => {
    if (profiles.length <= 1) return;
    const remaining = profiles.filter((p) => p.id !== id);
    onSaveProfiles(remaining, remaining[0].id);
    setForm(remaining[0]);
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'tournamentLogo' | 'signatureImage'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      handleFieldChange(field, String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-slate-900 text-white p-5 sm:p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
            <Trophy className="w-4 h-4" />
            <span>
              {lang === 'hi'
                ? 'सेंट्रल टूर्नामेंट प्रोफाइल सिस्टम (Auto-Fill Engine)'
                : 'Central Tournament Profile System'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {lang === 'hi'
              ? 'टूर्नामेंट प्रोफाइल एवं सीजन सेटअप'
              : 'Tournament Profile & Season Configuration'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            {lang === 'hi'
              ? 'यहाँ टूर्नामेंट की जानकारी एक बार भरें। आपके सभी पोस्टर, आमंत्रण कार्ड, सर्टिफिकेट, वाउचर और आवेदन पत्रों में यह जानकारी अपने-आप भर जाएगी।'
              : 'Enter your tournament details once here. All templates, posters, invitations, certificates, and letters will automatically populate with these details.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDuplicateSeason}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            <span>
              {lang === 'hi'
                ? 'नया सीजन डुप्लीकेट करें (Duplicate Season)'
                : 'Duplicate for New Season'}
            </span>
          </button>
          <button
            type="button"
            onClick={handleCreateBlankProfile}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'hi' ? 'नई प्रोफाइल' : 'New Profile'}</span>
          </button>
        </div>
      </div>

      {/* Saved Profiles Selector Strip */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
        {profiles.map((prof) => {
          const isActive = prof.id === form.id;
          return (
            <div
              key={prof.id}
              onClick={() => handleSelect(prof)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-blue-950 text-white border-amber-500 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-400'
              }`}
            >
              <img
                src={prof.tournamentLogo}
                alt={prof.tournamentName}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-lg object-contain bg-slate-900 p-1"
              />
              <div>
                <div className="text-xs font-extrabold">{prof.tournamentName}</div>
                <div className="text-[11px] opacity-80 font-mono">
                  {prof.seasonNumber} · {prof.startingDate}
                </div>
              </div>
              {profiles.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProfile(prof.id);
                  }}
                  className="p-1 rounded hover:bg-red-500/20 text-red-400"
                  title="Delete Profile"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Profile Form */}
      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-6"
      >
        {savedNotice && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
            <Check className="w-4 h-4 shrink-0" />
            <span>
              {lang === 'hi'
                ? 'टूर्नामेंट प्रोफाइल सफलतापूर्वक सेव हो गई! सभी टेम्पलेट्स में नई जानकारी अपडेट कर दी गई है।'
                : 'Tournament Profile saved! All templates have been updated with your latest tournament details.'}
            </span>
          </div>
        )}

        {/* Logo & Signature Upload Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <img
              src={form.tournamentLogo}
              alt="Tournament Logo"
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-xl object-contain bg-slate-900 p-2 shrink-0 border border-amber-500/40"
            />
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {lang === 'hi' ? 'टूर्नामेंट का आधिकारिक लोगो' : 'Official Tournament Logo'}
              </h4>
              <p className="text-xs text-slate-500">
                {lang === 'hi'
                  ? 'यह लोगो पोस्टर, आमंत्रण कार्ड और सर्टिफिकेट पर दिखेगा।'
                  : 'Used across posters, invitations, and certificates.'}
              </p>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-bold cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'लोगो बदलें' : 'Upload Logo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'tournamentLogo')}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <img
              src={form.signatureImage}
              alt="Organizer Signature"
              referrerPolicy="no-referrer"
              className="w-28 h-20 rounded-xl object-contain bg-white p-2 shrink-0 border border-slate-200"
            />
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {lang === 'hi' ? 'अध्यक्ष / आयोजक हस्ताक्षर (Signature)' : 'Authorized Signature Image'}
              </h4>
              <p className="text-xs text-slate-500">
                {lang === 'hi'
                  ? 'प्राइज वाउचर, सर्टिफिकेट और आधिकारिक पत्रों पर हस्ताक्षर के लिए।'
                  : 'Automatically placed on prize vouchers, letters, and certificates.'}
              </p>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-bold cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'हस्ताक्षर अपलोड करें' : 'Upload Signature'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'signatureImage')}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Basic Tournament Details */}
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>
              {lang === 'hi'
                ? '1. मुख्य टूर्नामेंट एवं स्थान विवरण'
                : '1. Core Tournament & Venue Information'}
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'टूर्नामेंट का नाम (हिंदी में)' : 'Tournament Name (Hindi)'}
              </label>
              <input
                type="text"
                value={form.tournamentName}
                onChange={(e) => handleFieldChange('tournamentName', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'टूर्नामेंट का नाम (अंग्रेजी में)' : 'Tournament Name (English)'}
              </label>
              <input
                type="text"
                value={form.tournamentNameEn}
                onChange={(e) => handleFieldChange('tournamentNameEn', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'सीजन नंबर (Season Number)' : 'Season Number'}
              </label>
              <input
                type="text"
                value={form.seasonNumber}
                onChange={(e) => handleFieldChange('seasonNumber', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'शुभारंभ दिनांक (Starting Date)' : 'Starting Date'}
              </label>
              <input
                type="text"
                value={form.startingDate}
                onChange={(e) => handleFieldChange('startingDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'फाइनल मैच दिनांक (Final Date)' : 'Final Match Date'}
              </label>
              <input
                type="text"
                value={form.finalDate}
                onChange={(e) => handleFieldChange('finalDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'मैच का समय (Match Time)' : 'Match Time'}
              </label>
              <input
                type="text"
                value={form.matchTime}
                onChange={(e) => handleFieldChange('matchTime', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'खेल मैदान / स्थान (Venue)' : 'Ground / Venue'}
              </label>
              <input
                type="text"
                value={form.venue}
                onChange={(e) => handleFieldChange('venue', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'एंट्री फीस (Entry Fee)' : 'Team Entry Fee'}
              </label>
              <input
                type="text"
                value={form.entryFee}
                onChange={(e) => handleFieldChange('entryFee', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Committee & Guests */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3">
            {lang === 'hi'
              ? '2. आयोजन समिति एवं अतिथि विवरण (Organizers & Guests)'
              : '2. Organizing Committee & Guests'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'आयोजक का नाम (Organizer Name)' : 'Organizer Name'}
              </label>
              <input
                type="text"
                value={form.organizerName}
                onChange={(e) => handleFieldChange('organizerName', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'अध्यक्ष का नाम (President Name)' : 'President Name'}
              </label>
              <input
                type="text"
                value={form.presidentName}
                onChange={(e) => handleFieldChange('presidentName', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'सचिव / कमिटी का नाम (Secretary Name)' : 'Secretary / Committee'}
              </label>
              <input
                type="text"
                value={form.secretaryName}
                onChange={(e) => handleFieldChange('secretaryName', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'मुख्य अतिथि (Chief Guest)' : 'Chief Guest'}
              </label>
              <input
                type="text"
                value={form.chiefGuest}
                onChange={(e) => handleFieldChange('chiefGuest', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'विशिष्ट अतिथि (Special Guest)' : 'Special Guest'}
              </label>
              <input
                type="text"
                value={form.specialGuest}
                onChange={(e) => handleFieldChange('specialGuest', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'संपर्क मोबाइल नंबर (Contact Number)' : 'Contact Mobile Number'}
              </label>
              <input
                type="text"
                value={form.contactNumber}
                onChange={(e) => handleFieldChange('contactNumber', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold font-mono"
              />
            </div>
          </div>
        </div>

        {/* Prizes Breakdown */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>
              {lang === 'hi'
                ? '3. पुरस्कार राशि एवं ट्रॉफी विवरण (Prize Structure)'
                : '3. Tournament Prizes & Awards'}
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'विजेता पुरस्कार (Winner Prize)' : 'Winner Prize'}
              </label>
              <input
                type="text"
                value={form.winnerPrize}
                onChange={(e) => handleFieldChange('winnerPrize', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'उप-विजेता पुरस्कार (Runner-up Prize)' : 'Runner-up Prize'}
              </label>
              <input
                type="text"
                value={form.runnerUpPrize}
                onChange={(e) => handleFieldChange('runnerUpPrize', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'तृतीय पुरस्कार (Third Place Prize)' : 'Third Place Prize'}
              </label>
              <input
                type="text"
                value={form.thirdPlacePrize}
                onChange={(e) => handleFieldChange('thirdPlacePrize', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'मैन ऑफ द सीरीज (Man of the Series)' : 'Man of the Series Prize'}
              </label>
              <input
                type="text"
                value={form.manOfTheSeriesPrize}
                onChange={(e) => handleFieldChange('manOfTheSeriesPrize', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'मैन ऑफ द मैच (Man of the Match)' : 'Man of the Match Prize'}
              </label>
              <input
                type="text"
                value={form.manOfTheMatchPrize}
                onChange={(e) => handleFieldChange('manOfTheMatchPrize', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'सर्वश्रेष्ठ बल्लेबाज (Best Batsman)' : 'Best Batsman Prize'}
              </label>
              <input
                type="text"
                value={form.bestBatsmanPrize}
                onChange={(e) => handleFieldChange('bestBatsmanPrize', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'सर्वश्रेष्ठ गेंदबाज (Best Bowler)' : 'Best Bowler Prize'}
              </label>
              <input
                type="text"
                value={form.bestBowlerPrize}
                onChange={(e) => handleFieldChange('bestBowlerPrize', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'शतक लगाने पर इनाम (Century Prize)' : 'Century Special Prize'}
              </label>
              <input
                type="text"
                value={form.centuryPrize}
                onChange={(e) => handleFieldChange('centuryPrize', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-extrabold text-sm shadow-md transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>
              {lang === 'hi'
                ? 'प्रोफाइल सेव करें और सभी टेम्पलेट्स में लागू करें'
                : 'Save Profile & Apply to All Templates'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
