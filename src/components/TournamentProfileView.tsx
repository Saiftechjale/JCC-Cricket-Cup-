import React, { useEffect, useState } from 'react';
import {
  Camera,
  Check,
  Copy,
  PenTool,
  Plus,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  Trash2,
  Trophy,
  Upload,
} from 'lucide-react';
import { Language, TournamentProfile } from '../types/studio';
import { getStickerDataUrl } from '../utils/cricketGraphics';

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
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [clickedButtonId, setClickedButtonId] = useState<string | null>(null);

  useEffect(() => {
    setForm(currentProfile);
  }, [currentProfile.id, currentProfile.tournamentLogo, currentProfile.signatureImage]);

  const triggerClickFeedback = (btnId: string, message: string) => {
    setClickedButtonId(btnId);
    setSavedNotice(message);
    setTimeout(() => {
      setClickedButtonId((prev) => (prev === btnId ? null : prev));
    }, 1800);
    setTimeout(() => {
      setSavedNotice((prev) => (prev === message ? null : prev));
    }, 3500);
  };

  const handleSelect = (p: TournamentProfile) => {
    onSelectProfile(p.id);
    setForm(p);
    triggerClickFeedback(
      `select-${p.id}`,
      lang === 'hi'
        ? `✓ "${p.tournamentName}" (${p.seasonNumber}) सक्रिय हो गया!`
        : `✓ Activated "${p.tournamentName}" (${p.seasonNumber})!`
    );
  };

  const handleFieldChange = (key: keyof TournamentProfile, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSave = (e?: React.FormEvent, btnId = 'save-main') => {
    if (e) e.preventDefault();
    const updatedProfile: TournamentProfile = {
      ...form,
      updatedAt: new Date().toISOString(),
    };
    const updatedList = profiles.map((p) =>
      p.id === updatedProfile.id ? updatedProfile : p
    );
    onSaveProfiles(updatedList, updatedProfile.id);
    triggerClickFeedback(
      btnId,
      lang === 'hi'
        ? '✓ टूर्नामेंट प्रोफाइल सफलतापूर्वक अपडेट हो गई! सभी पोस्टर, कार्ड व टेम्पलेट्स में नई जानकारी लग गई है।'
        : '✓ Tournament Profile Updated! All templates now reflect your latest details.'
    );
  };

  const handleDuplicateSeason = () => {
    const newId = `profile-${Date.now()}`;
    const nextSeasonNum = form.seasonNumber.replace(/\d+/, (m) =>
      String(Number(m) + 1)
    );
    const cloned: TournamentProfile = {
      ...form,
      id: newId,
      seasonNumber:
        nextSeasonNum === form.seasonNumber
          ? `${form.seasonNumber} (New)`
          : nextSeasonNum,
      updatedAt: new Date().toISOString(),
    };
    const nextList = [...profiles, cloned];
    onSaveProfiles(nextList, newId);
    setForm(cloned);
    triggerClickFeedback(
      'dup-season',
      lang === 'hi'
        ? `✓ नया सीजन (${cloned.seasonNumber}) बनकर तैयार और सेव हो गया!`
        : `✓ Duplicated season (${cloned.seasonNumber}) created!`
    );
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
    triggerClickFeedback(
      'new-profile',
      lang === 'hi'
        ? '✓ नई टूर्नामेंट प्रोफाइल बन गई!'
        : '✓ New Tournament Profile created!'
    );
  };

  const handleDeleteProfile = (id: string) => {
    if (profiles.length <= 1) return;
    const remaining = profiles.filter((p) => p.id !== id);
    onSaveProfiles(remaining, remaining[0].id);
    setForm(remaining[0]);
  };

  // Immediate Auto-Save on Logo or Signature Upload so user sees instant confirmation
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'tournamentLogo' | 'signatureImage'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) return;
      const updatedProfile: TournamentProfile = {
        ...form,
        [field]: dataUrl,
        updatedAt: new Date().toISOString(),
      };
      setForm(updatedProfile);
      const updatedList = profiles.map((p) =>
        p.id === updatedProfile.id ? updatedProfile : p
      );
      onSaveProfiles(updatedList, updatedProfile.id);

      triggerClickFeedback(
        field,
        lang === 'hi'
          ? field === 'tournamentLogo'
            ? '✓ टूर्नामेंट लोगो सफलतापूर्वक अपलोड और सेव हो गया! सभी डिज़ाइन में नया लोगो अपडेट हो गया है।'
            : '✓ अध्यक्ष/आयोजक हस्ताक्षर (Signature) सफलतापूर्वक अपलोड और सेव हो गया!'
          : field === 'tournamentLogo'
          ? '✓ Tournament Logo uploaded and saved to all templates!'
          : '✓ Authorized Signature uploaded and saved to all templates!'
      );
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleResetDefaultImage = (field: 'tournamentLogo' | 'signatureImage') => {
    const defaultUrl =
      field === 'tournamentLogo'
        ? getStickerDataUrl('jale-logo')
        : getStickerDataUrl('signature-saif');
    const updatedProfile: TournamentProfile = {
      ...form,
      [field]: defaultUrl,
      updatedAt: new Date().toISOString(),
    };
    setForm(updatedProfile);
    const updatedList = profiles.map((p) =>
      p.id === updatedProfile.id ? updatedProfile : p
    );
    onSaveProfiles(updatedList, updatedProfile.id);
    triggerClickFeedback(
      `reset-${field}`,
      lang === 'hi'
        ? '✓ ओरिजिनल डिफ़ॉल्ट ग्राफिक रीसेट हो गया!'
        : '✓ Default graphic restored!'
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 overflow-x-hidden">
      {/* FLOATING TOAST CONFIRMATION */}
      {savedNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-lg flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-600 text-white shadow-2xl border border-emerald-300 text-xs font-extrabold">
          <Check className="w-4 h-4 shrink-0 stroke-[3]" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl bg-[#0B192C] text-white p-4 sm:p-6 border border-amber-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold">
            <Trophy className="w-4 h-4 shrink-0" />
            <span>
              {lang === 'hi'
                ? 'सेंट्रल टूर्नामेंट प्रोफाइल सिस्टम (Auto-Fill Engine)'
                : 'Central Tournament Profile System'}
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black tracking-tight">
            {lang === 'hi'
              ? 'टूर्नामेंट प्रोफाइल, लोगो एवं हस्ताक्षर सेटअप'
              : 'Tournament Profile, Logo & Signature Setup'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            {lang === 'hi'
              ? 'यहाँ टूर्नामेंट का नाम, लोगो, हस्ताक्षर व पुरस्कार बदलें। आपके सभी पोस्टर, कार्ड, सर्टिफिकेट और वाउचर में यह अपने-आप अपडेट हो जाएगा।'
              : 'Update your logo, signature, and tournament details once here. All templates update automatically.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSave(undefined, 'save-top')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer shadow-md ${
              clickedButtonId === 'save-top'
                ? 'bg-emerald-500 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            {clickedButtonId === 'save-top' ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {clickedButtonId === 'save-top'
                ? lang === 'hi'
                  ? '✓ अपडेट हो गया!'
                  : '✓ Updated!'
                : lang === 'hi'
                ? 'प्रोफाइल अपडेट करें'
                : 'Update Profile'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleDuplicateSeason}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
              clickedButtonId === 'dup-season'
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
            }`}
          >
            {clickedButtonId === 'dup-season' ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>
              {lang === 'hi' ? 'नया सीजन डुप्लीकेट करें' : 'Duplicate Season'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleCreateBlankProfile}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
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
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer shrink-0 max-w-[85vw] sm:max-w-xs ${
                isActive
                  ? 'bg-blue-950 text-white border-amber-500 shadow-md ring-2 ring-amber-500/30'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-400'
              }`}
            >
              <img
                src={prof.tournamentLogo}
                alt={prof.tournamentName}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-lg object-contain bg-slate-900 p-1 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-extrabold truncate">
                  {prof.tournamentName}
                </div>
                <div className="text-[11px] opacity-80 font-mono truncate">
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
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 shrink-0"
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
        onSubmit={(e) => handleSave(e, 'save-bottom')}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-6 shadow-xs"
      >
        {/* Interactive Logo & Signature Upload Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          {/* Card 1: Tournament Logo */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-2 border-amber-500/30">
            <label
              role="button"
              className="relative w-24 h-24 rounded-2xl bg-slate-900 p-2 shrink-0 border-2 border-amber-400 cursor-pointer overflow-hidden shadow-md"
              title={lang === 'hi' ? 'लोगो बदलने के लिए टैप करें' : 'Tap to upload logo'}
            >
              <img
                src={form.tournamentLogo}
                alt="Tournament Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-x-0 bottom-0 bg-amber-500 text-slate-950 text-[10px] font-black text-center py-0.5">
                {lang === 'hi' ? 'टैप करें' : 'TAP'}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'tournamentLogo')}
                className="hidden"
              />
            </label>

            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {lang === 'hi'
                  ? '1. टूर्नामेंट का आधिकारिक लोगो (Logo)'
                  : '1. Official Tournament Logo'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'hi'
                  ? 'अपलोड करते ही यह लोगो सभी पोस्टर, आमंत्रण कार्ड और सर्टिफिकेट पर ऑटोमैटिक लग जाएगा।'
                  : 'Auto-saves and updates across all posters, invitations & certificates.'}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <label
                  role="button"
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black cursor-pointer shadow-sm transition-all ${
                    clickedButtonId === 'tournamentLogo'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  {clickedButtonId === 'tournamentLogo' ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  <span>
                    {clickedButtonId === 'tournamentLogo'
                      ? lang === 'hi'
                        ? '✓ लोगो अपडेट हो गया!'
                        : '✓ Logo Updated!'
                      : lang === 'hi'
                      ? 'नया लोगो चुनें (Upload Logo)'
                      : 'Upload New Logo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'tournamentLogo')}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => handleResetDefaultImage('tournamentLogo')}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'डिफ़ॉल्ट लोगो' : 'Default'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Authorized Signature */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-2 border-blue-500/30">
            <label
              role="button"
              className="relative w-32 h-24 rounded-2xl bg-white p-2 shrink-0 border-2 border-blue-500 cursor-pointer overflow-hidden shadow-md"
              title={lang === 'hi' ? 'हस्ताक्षर बदलने के लिए टैप करें' : 'Tap to upload signature'}
            >
              <img
                src={form.signatureImage}
                alt="Organizer Signature"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-x-0 bottom-0 bg-blue-600 text-white text-[10px] font-black text-center py-0.5">
                {lang === 'hi' ? 'साइन बदलें' : 'SIGN'}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'signatureImage')}
                className="hidden"
              />
            </label>

            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {lang === 'hi'
                  ? '2. अध्यक्ष / आयोजक हस्ताक्षर (Signature)'
                  : '2. Authorized Signature (Sign)'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'hi'
                  ? 'प्राइज चेक वाउचर, सर्टिफिकेट, खिलाड़ी फॉर्म और आधिकारिक पत्रों पर हस्ताक्षर के लिए।'
                  : 'Auto-saves and places your signature on vouchers, letters & certificates.'}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <label
                  role="button"
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black cursor-pointer shadow-sm transition-all ${
                    clickedButtonId === 'signatureImage'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {clickedButtonId === 'signatureImage' ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <PenTool className="w-4 h-4" />
                  )}
                  <span>
                    {clickedButtonId === 'signatureImage'
                      ? lang === 'hi'
                        ? '✓ साइन अपडेट हो गया!'
                        : '✓ Sign Updated!'
                      : lang === 'hi'
                      ? 'हस्ताक्षर अपलोड करें (Upload Sign)'
                      : 'Upload Signature'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'signatureImage')}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => handleResetDefaultImage('signatureImage')}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'डिफ़ॉल्ट साइन' : 'Default'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Tournament Details */}
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {lang === 'hi'
                ? '3. मुख्य टूर्नामेंट एवं स्थान विवरण'
                : '3. Core Tournament & Venue Information'}
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'टूर्नामेंट का नाम (हिंदी में)' : 'Tournament Name (Hindi)'}
              </label>
              <input
                type="text"
                value={form.tournamentName}
                onChange={(e) => handleFieldChange('tournamentName', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Committee & Guests */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3">
            {lang === 'hi'
              ? '4. आयोजन समिति एवं अतिथि विवरण (Organizers & Guests)'
              : '4. Organizing Committee & Guests'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'आयोजक का नाम (Organizer Name)' : 'Organizer Name'}
              </label>
              <input
                type="text"
                value={form.organizerName}
                onChange={(e) => handleFieldChange('organizerName', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold font-mono"
              />
            </div>
          </div>
        </div>

        {/* Prizes Breakdown */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              {lang === 'hi'
                ? '5. पुरस्कार राशि एवं ट्रॉफी विवरण (Prize Structure)'
                : '5. Tournament Prizes & Awards'}
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'विजेता पुरस्कार (Winner Prize)' : 'Winner Prize'}
              </label>
              <input
                type="text"
                value={form.winnerPrize}
                onChange={(e) => handleFieldChange('winnerPrize', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="submit"
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-black text-sm shadow-lg transition-all cursor-pointer ${
              clickedButtonId === 'save-bottom'
                ? 'bg-emerald-600 text-white'
                : 'bg-[#0B192C] dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-amber-400 dark:text-slate-950'
            }`}
          >
            {clickedButtonId === 'save-bottom' ? (
              <Check className="w-5 h-5 stroke-[3]" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>
              {clickedButtonId === 'save-bottom'
                ? lang === 'hi'
                  ? '✓ प्रोफाइल अपडेट व सेव हो गई!'
                  : '✓ Profile Updated & Saved!'
                : lang === 'hi'
                ? 'प्रोफाइल सेव करें और सभी टेम्पलेट्स में लागू करें'
                : 'Save Profile & Apply to All Templates'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
