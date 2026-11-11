import React, { useState } from 'react';
import {
  Check,
  Copy,
  Database,
  Download,
  Edit3,
  FileText,
  FolderHeart,
  Image as ImageIcon,
  LayoutTemplate,
  Moon,
  Palette,
  Search,
  Settings as SettingsIcon,
  Smartphone,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  DesignDocument,
  FullStudioBackup,
  Language,
  MediaAsset,
  MediaCategory,
  StudioSettings,
  TemplateCategory,
  TournamentProfile,
} from '../types/studio';
import { exportDesignDocument } from '../utils/exportEngine';

// ============================================================================
// 1. TEMPLATE LIBRARY VIEW
// ============================================================================
export const TemplateLibraryView: React.FC<{
  lang: Language;
  templates: DesignDocument[];
  customTemplates: DesignDocument[];
  activeProfile: TournamentProfile;
  onOpenTemplate: (tpl: DesignDocument) => void;
  onDeleteCustomTemplate: (id: string) => void;
}> = ({
  lang,
  templates,
  customTemplates,
  activeProfile,
  onOpenTemplate,
  onDeleteCustomTemplate,
}) => {
  const [catFilter, setCatFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [showRefImage, setShowRefImage] = useState(false);

  const allTemplates = [...customTemplates, ...templates];

  const categories: { id: string; labelHi: string; labelEn: string }[] = [
    { id: 'ALL', labelHi: 'सभी टेम्पलेट्स', labelEn: 'All Templates' },
    { id: 'poster', labelHi: 'पोस्टर व बैनर', labelEn: 'Posters & Banners' },
    { id: 'invitation', labelHi: 'आमंत्रण कार्ड', labelEn: 'Invitation Cards' },
    { id: 'player-list', labelHi: 'खिलाड़ी सूची व फॉर्म', labelEn: 'Player List & Form' },
    { id: 'rules', labelHi: 'नियम व शर्तें', labelEn: 'Rules & Regulations' },
    { id: 'prize', labelHi: 'पुरस्कार विवरण', labelEn: 'Prize Sheets' },
    { id: 'certificate', labelHi: 'सर्टिफिकेट (Awards)', labelEn: 'Certificates' },
    { id: 'voucher', labelHi: 'प्राइज वाउचर / चेक', labelEn: 'Prize Vouchers' },
    { id: 'schedule', labelHi: 'मैच शेड्यूल', labelEn: 'Match Schedule' },
    { id: 'result', labelHi: 'मैच रिजल्ट', labelEn: 'Match Results' },
    { id: 'scorecard', labelHi: 'स्कोरकार्ड', labelEn: 'Scorecard' },
    { id: 'letter', labelHi: 'आधिकारिक पत्र (Letters)', labelEn: 'Official Letters' },
  ];

  const filtered = allTemplates.filter((t) => {
    const matchCat = catFilter === 'ALL' || t.category === catFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      (t.nameHi && t.nameHi.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="rounded-2xl bg-slate-900 text-white p-5 sm:p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
            <LayoutTemplate className="w-4 h-4" />
            <span>
              {lang === 'hi'
                ? 'प्रोफेशनल क्रिकेट टूर्नामेंट टेम्पलेट लाइब्रेरी'
                : 'Reusable Cricket Tournament Template Library'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold">
            {lang === 'hi'
              ? 'टेम्पलेट लाइब्रेरी (Template Library)'
              : 'Master Template Library'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {lang === 'hi'
              ? `सभी टेम्पलेट्स में "${activeProfile.tournamentName}" (${activeProfile.seasonNumber}) की जानकारी ऑटोमैटिक भरी हुई है।`
              : `All templates automatically populate "${activeProfile.tournamentName}" (${activeProfile.seasonNumber}) details.`}
          </p>
        </div>

        <button
          onClick={() => setShowRefImage(!showRefImage)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs cursor-pointer shrink-0"
        >
          {showRefImage
            ? lang === 'hi'
              ? 'ओरिजिनल रेफरेंस छुपाएं'
              : 'Hide Original Reference'
            : lang === 'hi'
            ? 'आपके ओरिजिनल जाले कप डिज़ाइन देखें'
            : 'View Original Jale Cup Reference'}
        </button>
      </div>

      {/* Uploaded Reference Collage Preview */}
      {showRefImage && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-500/50 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
              {lang === 'hi'
                ? 'आपके द्वारा अपलोड किए गए जाले क्रिकेट कप (सीजन-2) के मूल दस्तावेज़ और डिज़ाइन:'
                : 'Your Uploaded Jale Cricket Cup (Season-2) Original Reference Designs:'}
            </h4>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <img
              src="/assets/aistudio/IMG_20261111_234956_d4e6eb07.jpg"
              alt="Jale Cricket Cup Original Reference Designs"
              referrerPolicy="no-referrer"
              className="min-w-[1100px] w-full h-auto object-contain"
            />
          </div>
        </div>
      )}

      {/* Category Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCatFilter(c.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              catFilter === c.id
                ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            {lang === 'hi' ? c.labelHi : c.labelEn}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            lang === 'hi'
              ? 'टेम्पलेट खोजें (जैसे: आमंत्रण, पोस्टर, वाउचर, थाना आवेदन, प्रधानाचार्य)...'
              : 'Search templates (Poster, Invitation, Voucher, Letter, Certificate)...'
          }
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium"
        />
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between hover:border-amber-500 transition-all shadow-xs"
          >
            {/* Visual Mini Preview */}
            <div
              onClick={() => onOpenTemplate(tpl)}
              style={{
                backgroundColor: tpl.backgroundColor,
                backgroundImage: tpl.backgroundGradient || 'none',
              }}
              className="h-52 p-4 flex flex-col items-center justify-center text-center relative cursor-pointer border-b border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div
                className="w-full h-full rounded-lg border-2 flex flex-col items-center justify-center p-3"
                style={{ borderColor: tpl.borderFrameColor || '#0B192C' }}
              >
                <span
                  className="text-sm font-black line-clamp-2"
                  style={{
                    color:
                      tpl.elements.find((e) => e.type === 'heading')?.color ||
                      '#0F172A',
                  }}
                >
                  {tpl.elements.find((e) => e.type === 'heading')?.text ||
                    tpl.nameHi}
                </span>
                <span className="text-xs font-bold mt-1.5 opacity-80 text-slate-700 dark:text-slate-300 line-clamp-2">
                  {tpl.elements.find((e) => e.type === 'subheading' || e.type === 'title')?.text ||
                    activeProfile.venue}
                </span>
                <span className="mt-3 text-[11px] font-mono text-slate-500">
                  {tpl.width} × {tpl.height} px · {tpl.elements.length} Editable Layers
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {lang === 'hi' ? tpl.nameHi || tpl.name : tpl.name}
                </h4>
                {tpl.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {tpl.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onOpenTemplate(tpl)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'hi'
                      ? 'डिज़ाइन कस्टमाइज़ करें (Open in Editor)'
                      : 'Customize in Studio Editor'}
                  </span>
                </button>

                {tpl.isCustomTemplate && (
                  <button
                    onClick={() => onDeleteCustomTemplate(tpl.id)}
                    className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                    title="Delete Custom Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 2. MY SAVED DESIGNS VIEW
// ============================================================================
export const SavedDesignsView: React.FC<{
  lang: Language;
  savedDesigns: DesignDocument[];
  onOpenDesign: (doc: DesignDocument) => void;
  onUpdateDesigns: (list: DesignDocument[]) => void;
}> = ({ lang, savedDesigns, onOpenDesign, onUpdateDesigns }) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const filtered = savedDesigns.filter((d) => {
    const matchCat = catFilter === 'ALL' || d.category === catFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      (d.nameHi && d.nameHi.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  const handleDuplicate = (doc: DesignDocument) => {
    const copy: DesignDocument = {
      ...doc,
      id: `saved-${Date.now()}`,
      name: `${doc.name} (Copy)`,
      nameHi: `${doc.nameHi || doc.name} (कॉपी)`,
      version: (doc.version || 1) + 1,
      updatedAt: new Date().toISOString(),
    };
    onUpdateDesigns([copy, ...savedDesigns]);
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteId) return;
    onUpdateDesigns(savedDesigns.filter((d) => d.id !== confirmDeleteId));
    setConfirmDeleteId(null);
  };

  const handleSaveRename = (id: string) => {
    if (!renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    onUpdateDesigns(
      savedDesigns.map((d) =>
        d.id === id ? { ...d, name: renameValue, nameHi: renameValue } : d
      )
    );
    setRenamingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="rounded-2xl bg-slate-900 text-white p-5 sm:p-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
            <FolderHeart className="w-4 h-4" />
            <span>
              {lang === 'hi'
                ? 'लोकल परमानेंट डिज़ाइन लाइब्रेरी (IndexedDB)'
                : 'Permanent Local Design Library'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold">
            {lang === 'hi'
              ? `मेरे सेव किए गए डिज़ाइन (${savedDesigns.length})`
              : `My Saved Designs (${savedDesigns.length})`}
          </h2>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              lang === 'hi' ? 'सेव किए गए डिज़ाइन खोजें...' : 'Search saved designs...'
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
        >
          <option value="ALL">{lang === 'hi' ? 'सभी श्रेणियाँ' : 'All Categories'}</option>
          <option value="poster">Poster</option>
          <option value="invitation">Invitation</option>
          <option value="player-list">Player List</option>
          <option value="certificate">Certificate</option>
          <option value="voucher">Prize Voucher</option>
          <option value="letter">Official Letter</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <FolderHeart className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {lang === 'hi'
              ? 'अभी कोई सेव किया गया डिज़ाइन नहीं है'
              : 'No Saved Designs Yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {lang === 'hi'
              ? 'किसी भी मेकर या टेम्पलेट लाइब्रेरी में जाकर डिज़ाइन एडिट करें और "सेव करें" बटन दबाएं।'
              : 'Open any template in the editor and click "Save" to store versions here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between"
            >
              <div
                onClick={() => onOpenDesign(doc)}
                style={{
                  backgroundColor: doc.backgroundColor,
                  backgroundImage: doc.backgroundGradient || 'none',
                }}
                className="h-44 p-4 flex flex-col items-center justify-center text-center cursor-pointer border-b border-slate-200 dark:border-slate-800"
              >
                <span className="text-sm font-black text-slate-900 bg-white/90 px-3 py-1.5 rounded-lg shadow-xs">
                  {doc.nameHi || doc.name}
                </span>
                <span className="text-[11px] font-mono text-slate-700 bg-white/80 px-2 py-0.5 rounded mt-2">
                  v{doc.version || 1} · {new Date(doc.updatedAt).toLocaleDateString()}
                </span>
              </div>

              <div className="p-4 space-y-3">
                {renamingId === doc.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-amber-500 text-xs font-bold"
                    />
                    <button
                      onClick={() => handleSaveRename(doc.id)}
                      className="p-1.5 rounded-lg bg-emerald-600 text-white"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {doc.nameHi || doc.name}
                    </h4>
                    <button
                      onClick={() => {
                        setRenamingId(doc.id);
                        setRenameValue(doc.nameHi || doc.name);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Rename Design"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenDesign(doc)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-extrabold text-xs cursor-pointer"
                  >
                    {lang === 'hi' ? 'एडिट करें (Edit)' : 'Edit Design'}
                  </button>
                  <button
                    onClick={() =>
                      exportDesignDocument(doc, {
                        format: 'pdf',
                        preset: 'original',
                        scale: 2,
                      })
                    }
                    className="p-2 rounded-xl bg-red-600 text-white hover:bg-red-500 cursor-pointer"
                    title="Download PDF"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(doc)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(doc.id)}
                    className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
              {lang === 'hi'
                ? 'क्या आप वाकई यह डिज़ाइन हटाना चाहते हैं?'
                : 'Confirm Delete Design?'}
            </h4>
            <p className="text-xs text-slate-500">
              {lang === 'hi'
                ? 'हटाने के बाद इस डिज़ाइन को वापस नहीं लाया जा सकेगा।'
                : 'This action will permanently remove the saved design.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold cursor-pointer"
              >
                {lang === 'hi' ? 'हाँ, हटाएं' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. MEDIA & LOGO LIBRARY VIEW
// ============================================================================
export const MediaLibraryView: React.FC<{
  lang: Language;
  mediaLibrary: MediaAsset[];
  onSaveMedia: (list: MediaAsset[]) => void;
}> = ({ lang, mediaLibrary, onSaveMedia }) => {
  const [selectedCat, setSelectedCat] = useState<MediaCategory>('Tournament Logo');

  const categories: MediaCategory[] = [
    'Tournament Logo',
    'Sponsor Logo',
    'Organizer Photo',
    'Guest Photo',
    'Player Photo',
    'Cricket Images',
    'Background Images',
    'Signature Images',
  ];

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const asset: MediaAsset = {
        id: `media-${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, ''),
        category: selectedCat,
        dataUrl: String(reader.result || ''),
        createdAt: new Date().toISOString().slice(0, 10),
      };
      onSaveMedia([asset, ...mediaLibrary]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="rounded-2xl bg-slate-900 text-white p-5 sm:p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold">
            {lang === 'hi'
              ? 'मीडिया एवं लोगो लाइब्रेरी (Permanent Media Library)'
              : 'Permanent Media & Logo Library'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {lang === 'hi'
              ? 'टूर्नामेंट लोगो, स्पॉन्सर लोगो, अध्यक्ष फोटो, मुख्य अतिथि फोटो, खिलाड़ी फोटो और हस्ताक्षर यहाँ सुरक्षित रखें।'
              : 'Upload and reuse Tournament Logos, Sponsor Logos, Guest Photos, Player Photos, and Signatures across all templates.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value as MediaCategory)}
            className="px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{lang === 'hi' ? 'फाइल अपलोड करें' : 'Upload Media'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {mediaLibrary.map((asset) => (
          <div
            key={asset.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col items-center justify-between gap-3"
          >
            <div className="w-full h-28 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl p-2">
              <img
                src={asset.dataUrl}
                alt={asset.name}
                referrerPolicy="no-referrer"
                className="max-h-24 max-w-full object-contain"
              />
            </div>
            <div className="w-full text-center">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {asset.name}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {asset.category}
              </div>
            </div>
            <button
              onClick={() =>
                onSaveMedia(mediaLibrary.filter((m) => m.id !== asset.id))
              }
              className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'हटाएं' : 'Remove'}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 4. BACKUP & RESTORE VIEW
// ============================================================================
export const BackupRestoreView: React.FC<{
  lang: Language;
  fullState: FullStudioBackup;
  onRestoreBackup: (backup: FullStudioBackup) => Promise<void>;
}> = ({ lang, fullState, onRestoreBackup }) => {
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(fullState, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Jale_Cricket_Studio_Backup_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusMsg(
      lang === 'hi'
        ? 'संपूर्ण स्टूडियो डेटा बैकअप (.json) सफलतापूर्वक डाउनलोड हो गया!'
        : 'Complete Studio JSON backup downloaded successfully!'
    );
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}')) as FullStudioBackup;
        await onRestoreBackup(parsed);
        setStatusMsg(
          lang === 'hi'
            ? 'बैकअप सफलतापूर्वक रीस्टोर हो गया! आपके सभी प्रोफाइल, डिज़ाइन और रिकॉर्ड्स वापस आ गए हैं।'
            : 'Backup restored successfully! All profiles, designs, and records have been recovered.'
        );
      } catch (err) {
        console.error('Invalid backup file:', err);
        setStatusMsg(
          lang === 'hi'
            ? 'त्रुटि: अमान्य बैकअप JSON फाइल।'
            : 'Error: Invalid JSON backup file.'
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="rounded-2xl bg-slate-900 text-white p-6 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
          <Database className="w-4 h-4" />
          <span>
            {lang === 'hi'
              ? '100% सुरक्षित ऑफलाइन डेटा बैकअप एवं रीस्टोर'
              : 'Complete Local Data Backup & Restore'}
          </span>
        </div>
        <h2 className="text-2xl font-extrabold">
          {lang === 'hi'
            ? 'बैकअप और रीस्टोर (Backup & Restore)'
            : 'Studio Data Backup & Restore'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300">
          {lang === 'hi'
            ? 'अपने सभी टूर्नामेंट प्रोफाइल, सेव किए गए डिज़ाइन, खिलाड़ी सूची, मैच शेड्यूल, स्कोरकार्ड और मीडिया लाइब्रेरी का एक क्लिक में JSON बैकअप डाउनलोड करें।'
            : 'Export or restore all Tournament Profiles, Saved Designs, Templates, Player Records, Match Schedules, Scorecards, and Settings.'}
        </p>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {lang === 'hi'
              ? '1. संपूर्ण बैकअप डाउनलोड करें (Export JSON)'
              : '1. Export Complete Backup (JSON)'}
          </h3>
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 font-medium">
            <div>• टूर्नामेंट प्रोफाइल्स: {fullState.profiles.length}</div>
            <div>• सेव किए गए डिज़ाइन: {fullState.savedDesigns.length}</div>
            <div>• खिलाड़ी रिकॉर्ड्स: {fullState.players.length}</div>
            <div>• मैच शेड्यूल व रिजल्ट्स: {fullState.schedules.length + fullState.results.length}</div>
            <div>• मीडिया व लोगो एसेट्स: {fullState.mediaLibrary.length}</div>
          </div>
          <button
            onClick={handleExportJSON}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              {lang === 'hi'
                ? 'JSON बैकअप फाइल डाउनलोड करें'
                : 'Download Full JSON Backup'}
            </span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {lang === 'hi'
                ? '2. पुराना बैकअप रीस्टोर करें (Restore JSON)'
                : '2. Restore Data from Backup File'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {lang === 'hi'
                ? 'पहले से डाउनलोड की गई .json बैकअप फाइल चुनें। आपका सारा डेटा तुरंत रीस्टोर हो जाएगा।'
                : 'Select a previously exported Jale Cricket Studio .json backup file to restore all your work.'}
            </p>
          </div>
          <label className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>
              {lang === 'hi'
                ? 'बैकअप JSON फाइल अपलोड व रीस्टोर करें'
                : 'Select JSON File to Restore'}
            </span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 5. SETTINGS & ANDROID APK GUIDE VIEW
// ============================================================================
export const SettingsView: React.FC<{
  lang: Language;
  settings: StudioSettings;
  onUpdateSettings: (next: StudioSettings) => void;
}> = ({ lang, settings, onUpdateSettings }) => {
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="rounded-2xl bg-slate-900 text-white p-6 border border-slate-800 space-y-1">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
          <SettingsIcon className="w-4 h-4" />
          <span>
            {lang === 'hi'
              ? 'ऐप सेटिंग्स एवं एंड्रॉइड APK कॉन्फ़िगरेशन'
              : 'Application Settings & Capacitor Android APK'}
          </span>
        </div>
        <h2 className="text-2xl font-extrabold">
          {lang === 'hi' ? 'सेटिंग्स (Studio Settings)' : 'Studio Preferences & Android APK'}
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {lang === 'hi' ? 'इंटरफ़ेस भाषा (Interface Language)' : 'Interface Language'}
            </h4>
            <p className="text-xs text-slate-500">
              {lang === 'hi'
                ? 'डिफ़ॉल्ट भाषा हिंदी है। आप कभी भी हिंदी और अंग्रेजी के बीच बदल सकते हैं।'
                : 'Switch between Hindi (Default) and English interface labels.'}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => onUpdateSettings({ ...settings, language: 'hi' })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                settings.language === 'hi'
                  ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              हिंदी (Hindi)
            </button>
            <button
              onClick={() => onUpdateSettings({ ...settings, language: 'en' })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                settings.language === 'en'
                  ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              English
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {lang === 'hi' ? 'डार्क / लाइट थीम मोड' : 'Dark / Light Workspace Theme'}
            </h4>
            <p className="text-xs text-slate-500">
              {lang === 'hi'
                ? 'रात में डिज़ाइन बनाते समय आँखों के आराम के लिए डार्क मोड चुनें।'
                : 'Toggle between Light and Dark studio interface.'}
            </p>
          </div>
          <button
            onClick={() =>
              onUpdateSettings({ ...settings, darkMode: !settings.darkMode })
            }
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs cursor-pointer"
          >
            {settings.darkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-700" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {lang === 'hi'
                ? 'हाई-रेज़ोल्यूशन एक्सपोर्ट क्वालिटी (Export DPI)'
                : 'High-Resolution Print Quality'}
            </h4>
            <p className="text-xs text-slate-500">
              {lang === 'hi'
                ? 'बैनर और पोस्टर प्रिंटिंग के लिए 2x या 3x अल्ट्रा HD रिज़ॉल्यूशन चुनें।'
                : 'Select 2x HD or 3x Ultra-HD canvas supersampling for print.'}
            </p>
          </div>
          <select
            value={settings.highResExportScale}
            onChange={(e) =>
              onUpdateSettings({
                ...settings,
                highResExportScale: Number(e.target.value) as 2 | 3,
              })
            }
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
          >
            <option value={2}>2x High Definition (Fast)</option>
            <option value={3}>3x Ultra Print HD (300 DPI)</option>
          </select>
        </div>
      </div>

      {/* Capacitor Android APK Instructions Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center gap-2 text-blue-600 dark:text-amber-400 font-extrabold text-sm">
          <Smartphone className="w-5 h-5" />
          <h3>
            {lang === 'hi'
              ? 'Android Studio और Capacitor से Signed APK बनाने की विधि'
              : 'How to Generate Signed Android APK with Capacitor & Android Studio'}
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {lang === 'hi'
            ? 'इस प्रोजेक्ट में Capacitor Android कॉन्फ़िगरेशन (capacitor.config.json, App ID: com.mirzasaif.jalecricketstudio) और PWA ऑफलाइन सर्विस वर्कर पहले से तैयार हैं। अपने कंप्यूटर पर Signed APK बनाने के लिए नीचे दिए गए कमांड्स चलाएं:'
            : 'This project includes complete Capacitor configuration (capacitor.config.json, App ID: com.mirzasaif.jalecricketstudio) and offline Service Worker caching. Follow these exact steps to build a signed Android APK:'}
        </p>
        <pre className="p-4 rounded-xl bg-slate-950 text-amber-300 font-mono text-xs overflow-x-auto leading-relaxed">
{`# 1. Install dependencies & build production web bundle
npm install
npm run build

# 2. Add Capacitor Android platform (first time only)
npm install @capacitor/android
npx cap add android

# 3. Sync dist/ offline bundle into Android project
npx cap sync android

# 4. Open in Android Studio to generate Signed APK
npx cap open android
# In Android Studio: Build -> Generate Signed Bundle / APK -> Select APK -> Keystore -> Release`}
        </pre>
      </div>
    </div>
  );
};
