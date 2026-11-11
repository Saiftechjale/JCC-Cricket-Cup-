import React, { useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bold,
  Check,
  Copy,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Italic,
  Layers,
  LayoutTemplate,
  Lock,
  Maximize2,
  Minus,
  Move,
  Palette,
  Plus,
  Redo2,
  RefreshCw,
  RotateCw,
  Save,
  Share2,
  Sparkles,
  Square,
  Table as TableIcon,
  Trash2,
  Type,
  Underline,
  Undo2,
  Unlock,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { VISUAL_THEMES, syncProfileToDesign } from '../data/defaultTemplates';
import {
  CanvasElement,
  DesignDocument,
  Language,
  MediaAsset,
  StickerGraphicId,
  TemplateCategory,
  TournamentProfile,
  VisualThemeId,
} from '../types/studio';
import { CRICKET_STICKERS, getStickerDataUrl } from '../utils/cricketGraphics';
import {
  ExportPagePreset,
  exportDesignDocument,
  shareDesignDocument,
} from '../utils/exportEngine';

interface CanvasEditorProps {
  lang: Language;
  initialDoc: DesignDocument;
  activeProfile: TournamentProfile;
  templates: DesignDocument[];
  mediaLibrary: MediaAsset[];
  categoryFilter?: TemplateCategory;
  onSaveDesign: (doc: DesignDocument, asTemplate?: boolean) => void;
  onUploadMedia: (asset: Omit<MediaAsset, 'id' | 'createdAt'>) => void;
}

const AVAILABLE_FONTS = [
  { label: 'Noto Sans Devanagari (हिंदी मानक)', value: 'Noto Sans Devanagari' },
  { label: 'Mukta (मुक्ता बोल्ड हिंदी)', value: 'Mukta' },
  { label: 'Hind (हिन्द क्लीन)', value: 'Hind' },
  { label: 'Rozha One (रोझा क्लासिक हिंदी)', value: 'Rozha One' },
  { label: 'Oswald (स्पोर्ट्स पोस्टर डिस्प्ले)', value: 'Oswald' },
  { label: 'Plus Jakarta Sans (मॉडर्न इंग्लिश)', value: 'Plus Jakarta Sans' },
  { label: 'Cinzel (सर्टिफिकेट रॉयल सेरिफ)', value: 'Cinzel' },
  { label: 'Arial (एरियल)', value: 'Arial' },
  { label: 'JetBrains Mono (स्कोरकार्ड मोनो)', value: 'JetBrains Mono' },
];

const PROFILE_BIND_FIELDS: { key: keyof TournamentProfile; labelHi: string; labelEn: string }[] = [
  { key: 'tournamentName', labelHi: 'टूर्नामेंट का नाम (हिंदी)', labelEn: 'Tournament Name (Hindi)' },
  { key: 'tournamentNameEn', labelHi: 'टूर्नामेंट का नाम (English)', labelEn: 'Tournament Name (English)' },
  { key: 'seasonNumber', labelHi: 'सीजन नंबर (Season)', labelEn: 'Season Number' },
  { key: 'venue', labelHi: 'खेल मैदान / स्थान (Venue)', labelEn: 'Venue' },
  { key: 'startingDate', labelHi: 'शुभारंभ तिथि (Start Date)', labelEn: 'Starting Date' },
  { key: 'finalDate', labelHi: 'फाइनल तिथि (Final Date)', labelEn: 'Final Date' },
  { key: 'matchTime', labelHi: 'मैच का समय (Match Time)', labelEn: 'Match Time' },
  { key: 'organizerName', labelHi: 'आयोजक का नाम (Organizer)', labelEn: 'Organizer Name' },
  { key: 'presidentName', labelHi: 'अध्यक्ष का नाम (President)', labelEn: 'President Name' },
  { key: 'chiefGuest', labelHi: 'मुख्य अतिथि (Chief Guest)', labelEn: 'Chief Guest' },
  { key: 'specialGuest', labelHi: 'विशिष्ट अतिथि (Special Guest)', labelEn: 'Special Guest' },
  { key: 'contactNumber', labelHi: 'मोबाइल नंबर (Contact)', labelEn: 'Contact Number' },
  { key: 'entryFee', labelHi: 'एंट्री फीस (Entry Fee)', labelEn: 'Entry Fee' },
  { key: 'winnerPrize', labelHi: 'विजेता पुरस्कार (Winner Prize)', labelEn: 'Winner Prize' },
  { key: 'runnerUpPrize', labelHi: 'उप-विजेता पुरस्कार (Runner-Up)', labelEn: 'Runner-Up Prize' },
  { key: 'manOfTheSeriesPrize', labelHi: 'मैन ऑफ द सीरीज पुरस्कार', labelEn: 'Man of the Series Prize' },
  { key: 'manOfTheMatchPrize', labelHi: 'मैन ऑफ द मैच पुरस्कार', labelEn: 'Man of the Match Prize' },
];

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  lang,
  initialDoc,
  activeProfile,
  templates,
  mediaLibrary,
  categoryFilter,
  onSaveDesign,
  onUploadMedia,
}) => {
  const [doc, setDoc] = useState<DesignDocument>(() =>
    syncProfileToDesign(initialDoc, activeProfile)
  );
  const [history, setHistory] = useState<DesignDocument[]>([
    syncProfileToDesign(initialDoc, activeProfile),
  ]);
  const [historyIdx, setHistoryIdx] = useState<number>(0);

  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialDoc.elements.length > 0 ? [initialDoc.elements[0].id] : []
  );
  const [leftTab, setLeftTab] = useState<
    'templates' | 'text' | 'shapes' | 'stickers' | 'media' | 'background'
  >('templates');
  const [zoom, setZoom] = useState<number>(0.62);
  const [exportPreset, setExportPreset] = useState<ExportPagePreset>('original');
  const [customWidth, setCustomWidth] = useState<number>(1080);
  const [customHeight, setCustomHeight] = useState<number>(1350);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<'none' | 'left' | 'right'>('none');

  // Drag / Resize interaction state
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    mode: 'move' | 'resize-br' | 'resize-r' | 'resize-b' | null;
    startX: number;
    startY: number;
    initialElements: Record<
      string,
      { x: number; y: number; width: number; height: number }
    >;
  }>({
    mode: null,
    startX: 0,
    startY: 0,
    initialElements: {},
  });

  // Update when initialDoc changes from outside
  useEffect(() => {
    const synced = syncProfileToDesign(initialDoc, activeProfile);
    setDoc(synced);
    setHistory([synced]);
    setHistoryIdx(0);
    setSelectedIds(synced.elements.length > 0 ? [synced.elements[0].id] : []);
    // Auto-calculate comfortable zoom
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    if (vw < 640) {
      setZoom(Math.min(0.42, (vw - 36) / synced.width));
    } else if (vw < 1024) {
      setZoom(0.52);
    } else {
      setZoom(synced.height > 1000 ? 0.58 : 0.68);
    }
  }, [initialDoc.id]);

  const commitDocChange = (nextDoc: DesignDocument) => {
    setDoc(nextDoc);
    const sliced = history.slice(0, historyIdx + 1);
    const updatedHistory = [...sliced.slice(-24), nextDoc];
    setHistory(updatedHistory);
    setHistoryIdx(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      const nextIdx = historyIdx - 1;
      setHistoryIdx(nextIdx);
      setDoc(history[nextIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1;
      setHistoryIdx(nextIdx);
      setDoc(history[nextIdx]);
    }
  };

  const selectedElement =
    doc.elements.find((el) => el.id === selectedIds[0]) || null;

  const updateSelectedElements = (updater: (el: CanvasElement) => CanvasElement) => {
    if (selectedIds.length === 0) return;
    const nextElements = doc.elements.map((el) =>
      selectedIds.includes(el.id) ? updater(el) : el
    );
    commitDocChange({
      ...doc,
      elements: nextElements,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddElement = (partial: Partial<CanvasElement> & { type: CanvasElement['type'] }) => {
    const id = `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newEl: CanvasElement = {
      id,
      type: partial.type,
      label: partial.label || partial.type,
      x: partial.x ?? Math.round(doc.width / 2 - (partial.width || 360) / 2),
      y: partial.y ?? Math.round(doc.height / 2 - (partial.height || 80) / 2),
      width: partial.width ?? 400,
      height: partial.height ?? 80,
      rotation: 0,
      opacity: 1,
      locked: false,
      text: partial.text,
      bindField: partial.bindField,
      fontFamily: partial.fontFamily || 'Noto Sans Devanagari',
      fontSize: partial.fontSize || 28,
      fontWeight: partial.fontWeight || '800',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: partial.textAlign || 'center',
      color: partial.color || '#0F172A',
      backgroundColor: partial.backgroundColor,
      borderColor: partial.borderColor,
      borderWidth: partial.borderWidth,
      borderRadius: partial.borderRadius,
      padding: partial.padding ?? 10,
      lineHeight: partial.lineHeight ?? 1.35,
      letterSpacing: partial.letterSpacing ?? 0,
      stickerId: partial.stickerId,
      imageUrl: partial.imageUrl,
      tableHeaders: partial.tableHeaders,
      tableRows: partial.tableRows,
      headerBgColor: partial.headerBgColor,
      headerTextColor: partial.headerTextColor,
    };

    const nextDoc = {
      ...doc,
      elements: [...doc.elements, newEl],
      updatedAt: new Date().toISOString(),
    };
    commitDocChange(nextDoc);
    setSelectedIds([id]);
    setMobilePanel('none');
  };

  const handleDuplicateSelected = () => {
    if (selectedIds.length === 0) return;
    const clones: CanvasElement[] = [];
    doc.elements.forEach((el) => {
      if (selectedIds.includes(el.id)) {
        clones.push({
          ...el,
          id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          x: el.x + 24,
          y: el.y + 24,
          locked: false,
        });
      }
    });
    commitDocChange({
      ...doc,
      elements: [...doc.elements, ...clones],
      updatedAt: new Date().toISOString(),
    });
    setSelectedIds(clones.map((c) => c.id));
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    const remaining = doc.elements.filter(
      (el) => !selectedIds.includes(el.id) || el.locked
    );
    commitDocChange({
      ...doc,
      elements: remaining,
      updatedAt: new Date().toISOString(),
    });
    setSelectedIds([]);
  };

  const handleLayerMove = (direction: 'up' | 'down' | 'front' | 'back') => {
    if (!selectedElement) return;
    const idx = doc.elements.findIndex((e) => e.id === selectedElement.id);
    if (idx === -1) return;
    const arr = [...doc.elements];
    const [item] = arr.splice(idx, 1);
    if (direction === 'up') arr.splice(Math.min(arr.length, idx + 1), 0, item);
    if (direction === 'down') arr.splice(Math.max(0, idx - 1), 0, item);
    if (direction === 'front') arr.push(item);
    if (direction === 'back') arr.unshift(item);
    commitDocChange({ ...doc, elements: arr });
  };

  const handleApplyVisualTheme = (themeId: VisualThemeId) => {
    const theme = VISUAL_THEMES.find((t) => t.id === themeId);
    if (!theme) return;
    const nextElements = doc.elements.map((el) => {
      if (el.type === 'heading') {
        return { ...el, color: theme.primary };
      }
      if (el.type === 'subheading' && el.backgroundColor) {
        return { ...el, backgroundColor: theme.secondary, color: '#FFFFFF' };
      }
      return el;
    });
    commitDocChange({
      ...doc,
      theme: themeId,
      backgroundColor: theme.bg,
      backgroundGradient: theme.gradient,
      borderFrameColor: theme.borderColor,
      elements: nextElements,
    });
  };

  const handlePointerDownElement = (
    e: React.PointerEvent,
    el: CanvasElement,
    mode: 'move' | 'resize-br' | 'resize-r' | 'resize-b'
  ) => {
    e.stopPropagation();
    let nextSelected = selectedIds;
    if (e.shiftKey) {
      nextSelected = selectedIds.includes(el.id)
        ? selectedIds.filter((id) => id !== el.id)
        : [...selectedIds, el.id];
      setSelectedIds(nextSelected);
    } else if (!selectedIds.includes(el.id)) {
      nextSelected = [el.id];
      setSelectedIds(nextSelected);
    }

    if (el.locked) return;

    const initMap: Record<
      string,
      { x: number; y: number; width: number; height: number }
    > = {};
    doc.elements.forEach((item) => {
      if (nextSelected.includes(item.id) && !item.locked) {
        initMap[item.id] = {
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
        };
      }
    });

    dragStateRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      initialElements: initMap,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state.mode) return;
      const dx = (moveEvent.clientX - state.startX) / zoom;
      const dy = (moveEvent.clientY - state.startY) / zoom;

      setDoc((prev) => ({
        ...prev,
        elements: prev.elements.map((item) => {
          const init = state.initialElements[item.id];
          if (!init) return item;
          if (state.mode === 'move') {
            return {
              ...item,
              x: Math.round(init.x + dx),
              y: Math.round(init.y + dy),
            };
          }
          if (state.mode === 'resize-br') {
            return {
              ...item,
              width: Math.max(36, Math.round(init.width + dx)),
              height: Math.max(24, Math.round(init.height + dy)),
            };
          }
          if (state.mode === 'resize-r') {
            return {
              ...item,
              width: Math.max(36, Math.round(init.width + dx)),
            };
          }
          if (state.mode === 'resize-b') {
            return {
              ...item,
              height: Math.max(24, Math.round(init.height + dy)),
            };
          }
          return item;
        }),
      }));
    };

    const handlePointerUp = () => {
      if (dragStateRef.current.mode) {
        dragStateRef.current.mode = null;
        setDoc((latest) => {
          setHistory((h) => {
            const next = [...h.slice(0, historyIdx + 1).slice(-24), latest];
            setHistoryIdx(next.length - 1);
            return next;
          });
          return latest;
        });
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleExport = async (format: 'pdf' | 'png' | 'jpg') => {
    setIsExporting(true);
    try {
      await exportDesignDocument(doc, {
        format,
        preset: exportPreset,
        scale: 2,
        customWidth: exportPreset === 'Custom' ? customWidth : undefined,
        customHeight: exportPreset === 'Custom' ? customHeight : undefined,
        filename: doc.name || 'Jale_Cricket_Cup_Design',
      });
      triggerToast(
        lang === 'hi'
          ? `${format.toUpperCase()} फाइल सफलतापूर्वक डाउनलोड हो गई!`
          : `${format.toUpperCase()} downloaded successfully!`
      );
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    mediaCategory: MediaAsset['category']
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      onUploadMedia({
        name: file.name.replace(/\.[^.]+$/, ''),
        category: mediaCategory,
        dataUrl,
      });
      handleAddElement({
        type: 'image',
        label: file.name,
        width: 220,
        height: 220,
        imageUrl: dataUrl,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2800);
  };

  const filteredTemplates = categoryFilter
    ? templates.filter((t) => t.category === categoryFilter)
    : templates;

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] bg-slate-100 dark:bg-slate-950 overflow-hidden select-none">
      {/* TOP EDITOR TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-20">
        {/* Left: Document Title & History */}
        <div className="flex items-center gap-2 min-w-0">
          <input
            type="text"
            value={lang === 'hi' ? doc.nameHi || doc.name : doc.name}
            onChange={(e) =>
              setDoc({
                ...doc,
                name: e.target.value,
                nameHi: e.target.value,
              })
            }
            className="px-2.5 py-1.5 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white w-44 sm:w-60 truncate focus:outline-none focus:ring-2 focus:ring-amber-500"
            title="Design Name"
          />

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            <button
              onClick={handleUndo}
              disabled={historyIdx <= 0}
              className="p-1.5 rounded-md text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-35 cursor-pointer"
              title={lang === 'hi' ? 'पीछे जाएं (Undo)' : 'Undo'}
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIdx >= history.length - 1}
              className="p-1.5 rounded-md text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-35 cursor-pointer"
              title={lang === 'hi' ? 'आगे जाएं (Redo)' : 'Redo'}
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              const synced = syncProfileToDesign(doc, activeProfile);
              commitDocChange(synced);
              triggerToast(
                lang === 'hi'
                  ? 'टूर्नामेंट प्रोफाइल की जानकारी अपडेट हो गई!'
                  : 'Tournament Profile synced to design!'
              );
            }}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:bg-blue-100 cursor-pointer whitespace-nowrap"
            title="Auto-fill active Tournament Profile values"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'प्रोफाइल सिंक करें' : 'Sync Profile'}</span>
          </button>
        </div>

        {/* Center: Save, Duplicate, Preview & Page Preset */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => {
              onSaveDesign(doc, false);
              triggerToast(
                lang === 'hi'
                  ? 'डिज़ाइन सफलतापूर्वक सेव हो गया!'
                  : 'Design saved to My Saved Designs!'
              );
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'सेव करें' : 'Save'}</span>
          </button>

          <button
            onClick={handleDuplicateSelected}
            disabled={selectedIds.length === 0}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 cursor-pointer whitespace-nowrap"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'डुप्लीकेट' : 'Duplicate'}</span>
          </button>

          <button
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 cursor-pointer whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{lang === 'hi' ? 'प्रीव्यू' : 'Preview'}</span>
          </button>

          <select
            value={exportPreset}
            onChange={(e) => setExportPreset(e.target.value as ExportPagePreset)}
            className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none"
            title="Export Page / Social Media Size"
          >
            <option value="original">
              {lang === 'hi' ? `मूल आकार (${doc.width}x${doc.height})` : `Original (${doc.width}x${doc.height})`}
            </option>
            <option value="A4-Portrait">A4 Portrait (प्रिंट)</option>
            <option value="A4-Landscape">A4 Landscape (प्रमाण-पत्र/वाउचर)</option>
            <option value="A5-Portrait">A5 Size (आमंत्रण/हैंडबिल)</option>
            <option value="Facebook-Portrait">Facebook Portrait (1080x1350)</option>
            <option value="Instagram-Square">Instagram Square (1080x1080)</option>
            <option value="Instagram-Story">Instagram Story (1080x1920)</option>
            <option value="Custom">Custom Size (कस्टम आकार)</option>
          </select>
        </div>

        {/* Right: Download PDF, PNG, JPG & Share */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => handleExport('png')}
            disabled={isExporting}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>
          <button
            onClick={() => handleExport('jpg')}
            disabled={isExporting}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JPG</span>
          </button>
          <button
            onClick={() => shareDesignDocument(doc)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title={lang === 'hi' ? 'शेयर करें (WhatsApp/Share)' : 'Share Design'}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {saveToast && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold">
          <Check className="w-4 h-4" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* MAIN 3-COLUMN EDITOR WORKSPACE */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* LEFT PANEL: TOOLS & ASSETS */}
        <aside
          className={`${
            mobilePanel === 'left'
              ? 'fixed inset-y-0 left-0 z-40 flex w-80'
              : 'hidden lg:flex w-80'
          } flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0`}
        >
          {/* Tool Category Tabs */}
          <div className="grid grid-cols-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1 gap-0.5">
            {[
              { id: 'templates', icon: LayoutTemplate, labelHi: 'टेम्पलेट', labelEn: 'Templates' },
              { id: 'text', icon: Type, labelHi: 'टेक्स्ट', labelEn: 'Text' },
              { id: 'stickers', icon: Sparkles, labelHi: 'स्टीकर', labelEn: 'Stickers' },
              { id: 'shapes', icon: Square, labelHi: 'शेप/टेबल', labelEn: 'Shapes' },
              { id: 'media', icon: Upload, labelHi: 'फोटो/लोगो', labelEn: 'Upload' },
              { id: 'background', icon: Palette, labelHi: 'बैकग्राउंड', labelEn: 'Theme' },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = leftTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setLeftTab(tab.id as typeof leftTab)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                    active
                      ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-0.5" />
                  <span className="truncate w-full text-center">
                    {lang === 'hi' ? tab.labelHi : tab.labelEn}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Left Tab Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {leftTab === 'templates' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {lang === 'hi' ? 'रेडीमेड क्रिकेट टेम्पलेट्स' : 'Ready-Made Cricket Templates'}
                  </h4>
                  <button
                    onClick={() => {
                      onSaveDesign(doc, true);
                      triggerToast(
                        lang === 'hi'
                          ? 'नए टेम्पलेट के रूप में सेव किया गया!'
                          : 'Saved as Reusable Template!'
                      );
                    }}
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    + {lang === 'hi' ? 'टेम्पलेट सेव करें' : 'Save as Template'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {filteredTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        const synced = syncProfileToDesign(tpl, activeProfile);
                        commitDocChange(synced);
                        setSelectedIds(
                          synced.elements.length > 0 ? [synced.elements[0].id] : []
                        );
                        setMobilePanel('none');
                      }}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        doc.id === tpl.id
                          ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-slate-50/60 dark:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {lang === 'hi' ? tpl.nameHi : tpl.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {tpl.width}×{tpl.height}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {tpl.description || tpl.name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {leftTab === 'text' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {lang === 'hi' ? 'नया टेक्स्ट जोड़ें (Add Text)' : 'Add Text Layers'}
                  </h4>
                  <button
                    onClick={() =>
                      handleAddElement({
                        type: 'heading',
                        label: 'Main Heading',
                        text: 'जाले क्रिकेट कप 2026',
                        fontSize: 44,
                        fontWeight: '900',
                        color: '#DC2626',
                        width: 650,
                        height: 75,
                      })
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-black text-base text-left cursor-pointer hover:opacity-90"
                  >
                    + {lang === 'hi' ? 'मुख्य हेडिंग (Add Heading)' : 'Add Heading'}
                  </button>
                  <button
                    onClick={() =>
                      handleAddElement({
                        type: 'subheading',
                        label: 'Subheading',
                        text: 'स्थान: काजी अहमद कॉलेज खेल मैदान, जाले',
                        fontSize: 28,
                        fontWeight: '800',
                        color: '#1E3A8A',
                        width: 580,
                        height: 55,
                      })
                    }
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm text-left cursor-pointer hover:bg-slate-200"
                  >
                    + {lang === 'hi' ? 'सब-हेडिंग जोड़ें (Subheading)' : 'Add Subheading'}
                  </button>
                  <button
                    onClick={() =>
                      handleAddElement({
                        type: 'title',
                        label: 'Title Box',
                        text: 'WINNER PRIZE: ₹ 19,100/-',
                        fontSize: 26,
                        fontWeight: '800',
                        color: '#FFFFFF',
                        backgroundColor: '#DC2626',
                        borderRadius: 12,
                        width: 420,
                        height: 64,
                      })
                    }
                    className="w-full py-2 px-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 font-bold text-xs text-left cursor-pointer"
                  >
                    + {lang === 'hi' ? 'हाईलाइट टाइटल बॉक्स (Title Banner)' : 'Add Highlight Title Box'}
                  </button>
                  <button
                    onClick={() =>
                      handleAddElement({
                        type: 'body',
                        label: 'Body Paragraph',
                        text: 'यहाँ अपना विवरण या नियम लिखें...',
                        fontSize: 20,
                        fontWeight: '600',
                        color: '#0F172A',
                        width: 520,
                        height: 110,
                      })
                    }
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs text-left cursor-pointer"
                  >
                    + {lang === 'hi' ? 'सामान्य पैराग्राफ टेक्स्ट (Body Text)' : 'Add Body Text'}
                  </button>
                </div>

                {/* Quick Auto-Bound Tournament Fields */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {lang === 'hi'
                      ? 'टूर्नामेंट प्रोफाइल स्मार्ट फील्ड्स (1-Click Insert)'
                      : 'Smart Tournament Profile Fields'}
                  </h4>
                  <div className="grid grid-cols-1 gap-1.5">
                    {PROFILE_BIND_FIELDS.map((bf) => (
                      <button
                        key={bf.key}
                        onClick={() =>
                          handleAddElement({
                            type: 'subheading',
                            label: bf.labelEn,
                            text: String(activeProfile[bf.key] || ''),
                            bindField: bf.key,
                            fontSize: 24,
                            fontWeight: '800',
                            color: '#0F172A',
                            width: 480,
                            height: 50,
                          })
                        }
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 hover:bg-amber-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-left text-xs cursor-pointer"
                      >
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {lang === 'hi' ? bf.labelHi : bf.labelEn}
                        </span>
                        <Plus className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {leftTab === 'stickers' && (
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {lang === 'hi'
                    ? 'क्रिकेट ग्राफिक्स, ट्रॉफी व हस्ताक्षर (Stickers)'
                    : 'Cricket Graphics, Trophies & Signatures'}
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {CRICKET_STICKERS.map((st) => (
                    <button
                      key={st.id}
                      onClick={() =>
                        handleAddElement({
                          type: 'sticker',
                          label: st.nameEn,
                          stickerId: st.id as StickerGraphicId,
                          width: st.id === 'ribbon-orange' ? 340 : 180,
                          height: st.id === 'ribbon-orange' ? 90 : 180,
                        })
                      }
                      className="flex flex-col items-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-amber-500 transition-all cursor-pointer"
                    >
                      <img
                        src={st.dataUrl}
                        alt={st.nameEn}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 object-contain mb-1.5"
                      />
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 text-center line-clamp-1">
                        {lang === 'hi' ? st.nameHi : st.nameEn}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {leftTab === 'shapes' && (
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {lang === 'hi' ? 'बॉक्स, शेप्स और टेबल जोड़ें' : 'Add Shapes, Banners & Tables'}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      handleAddElement({
                        type: 'rect',
                        label: 'Banner Box',
                        width: 500,
                        height: 90,
                        backgroundColor: '#1E3A8A',
                        borderColor: '#F59E0B',
                        borderWidth: 3,
                        borderRadius: 12,
                      })
                    }
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white flex flex-col items-center gap-1.5 cursor-pointer hover:border-amber-500"
                  >
                    <Square className="w-6 h-6 text-blue-600" />
                    <span>{lang === 'hi' ? 'आयताकार बैनर बॉक्स' : 'Rectangle Banner'}</span>
                  </button>

                  <button
                    onClick={() =>
                      handleAddElement({
                        type: 'circle',
                        label: 'Circle Badge',
                        width: 180,
                        height: 180,
                        backgroundColor: '#0284C7',
                        borderColor: '#FDE047',
                        borderWidth: 4,
                        borderRadius: 90,
                      })
                    }
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white flex flex-col items-center gap-1.5 cursor-pointer hover:border-amber-500"
                  >
                    <div className="w-6 h-6 rounded-full bg-sky-500 border-2 border-amber-400" />
                    <span>{lang === 'hi' ? 'गोल बैज (Circle)' : 'Circle Badge'}</span>
                  </button>

                  <button
                    onClick={() =>
                      handleAddElement({
                        type: 'line',
                        label: 'Divider Line',
                        width: 600,
                        height: 12,
                        color: '#DC2626',
                        borderWidth: 4,
                      })
                    }
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white flex flex-col items-center gap-1.5 cursor-pointer hover:border-amber-500"
                  >
                    <Minus className="w-6 h-6 text-red-600" />
                    <span>{lang === 'hi' ? 'डिवाइडर लाइन' : 'Divider Line'}</span>
                  </button>

                  <button
                    onClick={() =>
                      handleAddElement({
                        type: 'table',
                        label: 'Data Table',
                        width: 760,
                        height: 280,
                        headerBgColor: '#0B192C',
                        headerTextColor: '#FDE047',
                        borderColor: '#1E3A8A',
                        fontSize: 16,
                        tableHeaders: ['क्रम सं०', 'नाम / विवरण', 'भूमिका / स्कोर'],
                        tableRows: [
                          ['1', 'खिलाड़ी 1', 'Captain (C)'],
                          ['2', 'खिलाड़ी 2', 'Batsman'],
                          ['3', 'खिलाड़ी 3', 'Bowler'],
                        ],
                      })
                    }
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white flex flex-col items-center gap-1.5 cursor-pointer hover:border-amber-500"
                  >
                    <TableIcon className="w-6 h-6 text-emerald-600" />
                    <span>{lang === 'hi' ? 'तालिका (Table)' : 'Add Data Table'}</span>
                  </button>
                </div>
              </div>
            )}

            {leftTab === 'media' && (
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {lang === 'hi' ? 'लोगो, फोटो या हस्ताक्षर अपलोड करें' : 'Upload Logo, Photo or Signature'}
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-bold text-xs cursor-pointer hover:opacity-90">
                    <Upload className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'टूर्नामेंट लोगो अपलोड करें' : 'Upload Tournament Logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'Tournament Logo')}
                      className="hidden"
                    />
                  </label>

                  <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                    <ImageIcon className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'खिलाड़ी / अतिथि फोटो अपलोड करें' : 'Upload Player / Guest Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'Player Photo')}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <h5 className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {lang === 'hi' ? 'मीडिया लाइब्रेरी एसेट्स' : 'Saved Media Library'}
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    {mediaLibrary.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() =>
                          handleAddElement({
                            type: 'image',
                            label: asset.name,
                            imageUrl: asset.dataUrl,
                            width: 180,
                            height: 180,
                          })
                        }
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:border-amber-500 flex flex-col items-center cursor-pointer"
                      >
                        <img
                          src={asset.dataUrl}
                          alt={asset.name}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 object-contain mb-1"
                        />
                        <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate w-full text-center">
                          {asset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {leftTab === 'background' && (
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {lang === 'hi' ? '6 प्रोफेशनल क्रिकेट थीम्स' : '6 Professional Visual Themes'}
                </h4>
                <div className="space-y-2">
                  {VISUAL_THEMES.map((th) => (
                    <button
                      key={th.id}
                      onClick={() => handleApplyVisualTheme(th.id)}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between cursor-pointer ${
                        doc.theme === th.id
                          ? 'border-amber-500 ring-2 ring-amber-500/30'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {lang === 'hi' ? th.nameHi : th.nameEn}
                      </span>
                      <div className="flex items-center gap-1">
                        <span
                          className="w-4 h-4 rounded-full border border-slate-300"
                          style={{ background: th.bg }}
                        />
                        <span
                          className="w-4 h-4 rounded-full"
                          style={{ background: th.primary }}
                        />
                        <span
                          className="w-4 h-4 rounded-full"
                          style={{ background: th.accent }}
                        />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'hi' ? 'कैनवास बैकग्राउंड कलर' : 'Canvas Background Color'}
                    </label>
                    <input
                      type="color"
                      value={doc.backgroundColor || '#FFFFFF'}
                      onChange={(e) =>
                        commitDocChange({
                          ...doc,
                          backgroundColor: e.target.value,
                          backgroundGradient: undefined,
                        })
                      }
                      className="w-full h-9 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'hi' ? 'बॉर्डर फ्रेम कलर' : 'Border Frame Color'}
                    </label>
                    <input
                      type="color"
                      value={doc.borderFrameColor || '#0B192C'}
                      onChange={(e) =>
                        commitDocChange({
                          ...doc,
                          borderFrameColor: e.target.value,
                        })
                      }
                      className="w-full h-9 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* CENTER INTERACTIVE DESIGN CANVAS */}
        <main
          onClick={() => setSelectedIds([])}
          className="flex-1 flex flex-col items-center justify-between bg-slate-200/80 dark:bg-slate-950 overflow-auto p-4 sm:p-8 relative"
        >
          <div className="flex-1 flex items-center justify-center min-h-max min-w-max py-4">
            <div
              ref={canvasRef}
              style={{
                width: doc.width * zoom,
                height: doc.height * zoom,
              }}
              className="relative shadow-2xl transition-shadow"
            >
              <div
                style={{
                  width: doc.width,
                  height: doc.height,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  backgroundColor: doc.backgroundColor || '#FFFFFF',
                  backgroundImage: doc.backgroundGradient || 'none',
                  border: doc.borderFrameWidth
                    ? `${doc.borderFrameWidth}px solid ${doc.borderFrameColor || '#0B192C'}`
                    : 'none',
                }}
                className="relative overflow-hidden select-none"
              >
                {/* Optional Inner Gold Frame */}
                {doc.innerBorderColor && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 8,
                      border: `2.5px solid ${doc.innerBorderColor}`,
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Render All Editable Canvas Elements */}
                {doc.elements.map((el) => {
                  const isSelected = selectedIds.includes(el.id);
                  const stickerUrl =
                    el.type === 'sticker' && el.stickerId
                      ? getStickerDataUrl(el.stickerId)
                      : el.imageUrl;

                  return (
                    <div
                      key={el.id}
                      onPointerDown={(e) => handlePointerDownElement(e, el, 'move')}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        left: el.x,
                        top: el.y,
                        width: el.width,
                        height: el.height,
                        transform: `rotate(${el.rotation || 0}deg)`,
                        opacity: el.opacity ?? 1,
                        backgroundColor: el.backgroundColor || 'transparent',
                        borderColor: el.borderColor || 'transparent',
                        borderWidth: el.borderWidth ? `${el.borderWidth}px` : 0,
                        borderStyle: el.borderStyle || 'solid',
                        borderRadius:
                          el.type === 'circle'
                            ? '9999px'
                            : el.borderRadius
                            ? `${el.borderRadius}px`
                            : 0,
                        boxShadow:
                          el.shadowBlur && el.shadowColor
                            ? `0 4px ${el.shadowBlur}px ${el.shadowColor}`
                            : 'none',
                        padding: el.padding ? `${el.padding}px` : 0,
                        cursor: el.locked ? 'not-allowed' : 'move',
                        touchAction: 'none',
                      }}
                      className={`group transition-shadow ${
                        isSelected
                          ? 'ring-3 ring-amber-500 ring-offset-1 z-10'
                          : 'hover:ring-1 hover:ring-blue-400'
                      }`}
                    >
                      {/* Line Element */}
                      {el.type === 'line' && (
                        <div
                          style={{
                            width: '100%',
                            height: el.borderWidth || 4,
                            backgroundColor: el.color || '#0F172A',
                            marginTop: el.height / 2,
                          }}
                        />
                      )}

                      {/* Image or Sticker Element */}
                      {(el.type === 'image' || el.type === 'sticker') && stickerUrl && (
                        <img
                          src={stickerUrl}
                          alt={el.label || 'Graphic'}
                          referrerPolicy="no-referrer"
                          draggable={false}
                          className="w-full h-full object-contain pointer-events-none select-none"
                        />
                      )}

                      {/* Table Element */}
                      {el.type === 'table' && el.tableHeaders && el.tableRows && (
                        <table
                          className="w-full h-full border-collapse pointer-events-none"
                          style={{
                            fontSize: `${el.fontSize || 16}px`,
                            fontFamily: '"Noto Sans Devanagari", "Plus Jakarta Sans", sans-serif',
                          }}
                        >
                          <thead>
                            <tr
                              style={{
                                backgroundColor: el.headerBgColor || '#0B192C',
                                color: el.headerTextColor || '#FFFFFF',
                              }}
                            >
                              {el.tableHeaders.map((th, idx) => (
                                <th
                                  key={idx}
                                  className="border px-2 py-1 font-extrabold text-center"
                                  style={{ borderColor: el.borderColor || '#0F172A' }}
                                >
                                  {th}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {el.tableRows.map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                style={{
                                  backgroundColor: rIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                                  color: '#0F172A',
                                }}
                              >
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className={`border px-2 py-0.5 font-semibold ${
                                      cIdx === 0 ? 'text-center' : 'text-left'
                                    }`}
                                    style={{ borderColor: el.borderColor || '#94A3B8' }}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {/* Text Elements */}
                      {(el.type === 'heading' ||
                        el.type === 'subheading' ||
                        el.type === 'title' ||
                        el.type === 'body') && (
                        <div
                          style={{
                            fontFamily: `"${el.fontFamily || 'Noto Sans Devanagari'}", "Noto Sans Devanagari", sans-serif`,
                            fontSize: `${el.fontSize || 24}px`,
                            fontWeight: el.fontWeight || '700',
                            fontStyle: el.fontStyle || 'normal',
                            textDecoration: el.textDecoration || 'none',
                            textAlign: el.textAlign || 'left',
                            color: el.color || '#0F172A',
                            letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : 'normal',
                            lineHeight: el.lineHeight || 1.38,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                          className="w-full h-full pointer-events-none"
                        >
                          {el.text}
                        </div>
                      )}

                      {/* Resize Handles when Selected */}
                      {isSelected && !el.locked && (
                        <>
                          <div
                            onPointerDown={(e) =>
                              handlePointerDownElement(e, el, 'resize-br')
                            }
                            className="absolute -bottom-2.5 -right-2.5 w-5 h-5 rounded-full bg-amber-500 border-2 border-white shadow-md cursor-nwse-resize"
                            title="Drag to Resize"
                          />
                          <div
                            onPointerDown={(e) =>
                              handlePointerDownElement(e, el, 'resize-r')
                            }
                            className="absolute top-1/2 -right-2 -translate-y-1/2 w-3.5 h-7 rounded-full bg-blue-600 border border-white shadow-xs cursor-ew-resize"
                          />
                          <div
                            onPointerDown={(e) =>
                              handlePointerDownElement(e, el, 'resize-b')
                            }
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-3.5 rounded-full bg-blue-600 border border-white shadow-xs cursor-ns-resize"
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BOTTOM FLOATING ZOOM & MOBILE CONTROLS */}
          <div className="sticky bottom-2 z-20 flex items-center gap-2 bg-slate-900/90 text-white px-3.5 py-2 rounded-2xl shadow-xl backdrop-blur-xs">
            <button
              onClick={() =>
                setMobilePanel(mobilePanel === 'left' ? 'none' : 'left')
              }
              className="lg:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'टूल्स' : 'Tools'}</span>
            </button>

            <button
              onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.08).toFixed(2)))}
              className="p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold tabular-nums min-w-[46px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.08).toFixed(2)))}
              className="p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(0.62)}
              className="p-1 hover:bg-slate-800 rounded-lg text-[11px] font-semibold px-2 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {selectedElement && (
              <button
                onClick={() =>
                  setMobilePanel(mobilePanel === 'right' ? 'none' : 'right')
                }
                className="lg:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-xs"
              >
                <Type className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'एडिट करें' : 'Edit'}</span>
              </button>
            )}
          </div>
        </main>

        {/* RIGHT PANEL: ELEMENT PROPERTIES INSPECTOR */}
        <aside
          className={`${
            mobilePanel === 'right'
              ? 'fixed inset-y-0 right-0 z-40 flex w-80'
              : 'hidden lg:flex w-80'
          } flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shrink-0 overflow-y-auto p-4 space-y-4`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
              {lang === 'hi' ? 'एलिमेंट एडिटिंग पैनल' : 'Element Properties'}
            </h3>
            {mobilePanel === 'right' && (
              <button
                onClick={() => setMobilePanel('none')}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {!selectedElement ? (
            <div className="py-12 text-center space-y-3">
              <Move className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {lang === 'hi'
                  ? 'किसी भी टेक्स्ट, फोटो, ट्रॉफी या बॉक्स को बदलने के लिए कैनवास पर उस पर क्लिक करें।'
                  : 'Click any text, image, trophy, or shape on the canvas to edit its properties.'}
              </p>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-left space-y-2">
                <span className="text-[11px] font-bold text-slate-500 block">
                  {lang === 'hi' ? 'सभी लेयर्स (All Layers):' : 'All Canvas Layers:'}
                </span>
                <div className="max-h-72 overflow-y-auto space-y-1">
                  {doc.elements.map((item, i) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedIds([item.id])}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-left cursor-pointer"
                    >
                      <span className="truncate">
                        {i + 1}. {item.text ? item.text.slice(0, 26) : item.label || item.type}
                      </span>
                      {item.locked && <Lock className="w-3 h-3 text-amber-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Quick Actions Bar: Lock, Duplicate, Layer Order, Delete */}
              <div className="flex items-center justify-between gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
                <button
                  onClick={() =>
                    updateSelectedElements((el) => ({ ...el, locked: !el.locked }))
                  }
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                    selectedElement.locked
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                  title={selectedElement.locked ? 'Unlock' : 'Lock'}
                >
                  {selectedElement.locked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleLayerMove('up')}
                  className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                  title="Bring Forward"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleLayerMove('down')}
                  className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                  title="Send Backward"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDuplicateSelected}
                  className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                  title="Delete Element"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* TEXT EDITING CONTROLS */}
              {(selectedElement.type === 'heading' ||
                selectedElement.type === 'subheading' ||
                selectedElement.type === 'title' ||
                selectedElement.type === 'body') && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'hi' ? 'टेक्स्ट बदलें (Edit Text)' : 'Edit Text Content'}
                    </label>
                    <textarea
                      rows={4}
                      value={selectedElement.text || ''}
                      onChange={(e) =>
                        updateSelectedElements((el) => ({
                          ...el,
                          text: e.target.value,
                        }))
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Font Family & Size */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        {lang === 'hi' ? 'फॉन्ट (Font)' : 'Font Family'}
                      </label>
                      <select
                        value={selectedElement.fontFamily || 'Noto Sans Devanagari'}
                        onChange={(e) =>
                          updateSelectedElements((el) => ({
                            ...el,
                            fontFamily: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                      >
                        {AVAILABLE_FONTS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        {lang === 'hi' ? 'आकार (Size)' : 'Font Size'}
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={140}
                        value={selectedElement.fontSize || 24}
                        onChange={(e) =>
                          updateSelectedElements((el) => ({
                            ...el,
                            fontSize: Number(e.target.value),
                          }))
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Style & Alignment Buttons */}
                  <div className="flex items-center justify-between gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      onClick={() =>
                        updateSelectedElements((el) => ({
                          ...el,
                          fontWeight: el.fontWeight === '900' || el.fontWeight === '800' ? '500' : '900',
                        }))
                      }
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        selectedElement.fontWeight === '900' || selectedElement.fontWeight === '800'
                          ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                      title="Bold"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        updateSelectedElements((el) => ({
                          ...el,
                          fontStyle: el.fontStyle === 'italic' ? 'normal' : 'italic',
                        }))
                      }
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        selectedElement.fontStyle === 'italic'
                          ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                      title="Italic"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        updateSelectedElements((el) => ({
                          ...el,
                          textDecoration:
                            el.textDecoration === 'underline' ? 'none' : 'underline',
                        }))
                      }
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        selectedElement.textDecoration === 'underline'
                          ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                      title="Underline"
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                    <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
                    <button
                      onClick={() =>
                        updateSelectedElements((el) => ({ ...el, textAlign: 'left' }))
                      }
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        selectedElement.textAlign === 'left'
                          ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        updateSelectedElements((el) => ({ ...el, textAlign: 'center' }))
                      }
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        selectedElement.textAlign === 'center'
                          ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        updateSelectedElements((el) => ({ ...el, textAlign: 'right' }))
                      }
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        selectedElement.textAlign === 'right'
                          ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Line Height & Letter Spacing */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        {lang === 'hi' ? 'लाइन स्पेसिंग' : 'Line Height'}
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min={0.9}
                        max={2.5}
                        value={selectedElement.lineHeight || 1.38}
                        onChange={(e) =>
                          updateSelectedElements((el) => ({
                            ...el,
                            lineHeight: Number(e.target.value),
                          }))
                        }
                        className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        {lang === 'hi' ? 'लेटर स्पेसिंग' : 'Letter Spacing'}
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min={-2}
                        max={20}
                        value={selectedElement.letterSpacing || 0}
                        onChange={(e) =>
                          updateSelectedElements((el) => ({
                            ...el,
                            letterSpacing: Number(e.target.value),
                          }))
                        }
                        className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TABLE EDITOR CONTROLS */}
              {selectedElement.type === 'table' &&
                selectedElement.tableHeaders &&
                selectedElement.tableRows && (
                  <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {lang === 'hi' ? 'टेबल डेटा एडिट करें' : 'Edit Table Rows'}
                      </span>
                      <button
                        onClick={() =>
                          updateSelectedElements((el) => ({
                            ...el,
                            tableRows: [
                              ...(el.tableRows || []),
                              new Array(el.tableHeaders?.length || 3).fill(''),
                            ],
                          }))
                        }
                        className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                      >
                        + {lang === 'hi' ? 'नई पंक्ति (Add Row)' : 'Add Row'}
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {selectedElement.tableRows.map((row, rIdx) => (
                        <div
                          key={rIdx}
                          className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                            <span>Row #{rIdx + 1}</span>
                            <button
                              onClick={() =>
                                updateSelectedElements((el) => ({
                                  ...el,
                                  tableRows: (el.tableRows || []).filter(
                                    (_, idx) => idx !== rIdx
                                  ),
                                }))
                              }
                              className="text-red-500 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-1">
                            {row.map((cellVal, cIdx) => (
                              <input
                                key={cIdx}
                                type="text"
                                placeholder={selectedElement.tableHeaders?.[cIdx] || ''}
                                value={cellVal}
                                onChange={(e) => {
                                  const nextVal = e.target.value;
                                  updateSelectedElements((el) => {
                                    const copyRows = (el.tableRows || []).map((r) => [
                                      ...r,
                                    ]);
                                    copyRows[rIdx][cIdx] = nextVal;
                                    return { ...el, tableRows: copyRows };
                                  });
                                }}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white"
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* COLORS, BACKGROUND, BORDER & OPACITY */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {lang === 'hi' ? 'टेक्स्ट / लाइन कलर' : 'Text / Foreground'}
                    </label>
                    <input
                      type="color"
                      value={selectedElement.color || '#0F172A'}
                      onChange={(e) =>
                        updateSelectedElements((el) => ({
                          ...el,
                          color: e.target.value,
                        }))
                      }
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {lang === 'hi' ? 'बॉक्स बैकग्राउंड' : 'Box Background'}
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={
                          selectedElement.backgroundColor &&
                          selectedElement.backgroundColor.startsWith('#')
                            ? selectedElement.backgroundColor
                            : '#FFFFFF'
                        }
                        onChange={(e) =>
                          updateSelectedElements((el) => ({
                            ...el,
                            backgroundColor: e.target.value,
                          }))
                        }
                        className="flex-1 h-8 rounded cursor-pointer"
                      />
                      <button
                        onClick={() =>
                          updateSelectedElements((el) => ({
                            ...el,
                            backgroundColor: undefined,
                          }))
                        }
                        className="px-2 py-1 text-[10px] rounded bg-slate-200 dark:bg-slate-700 font-bold"
                        title="Clear Background"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* Border Width, Radius & Color */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {lang === 'hi' ? 'बॉर्डर चौड़ाई' : 'Border px'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={selectedElement.borderWidth || 0}
                      onChange={(e) =>
                        updateSelectedElements((el) => ({
                          ...el,
                          borderWidth: Number(e.target.value),
                        }))
                      }
                      className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {lang === 'hi' ? 'गोलाई (Radius)' : 'Corner Radius'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={selectedElement.borderRadius || 0}
                      onChange={(e) =>
                        updateSelectedElements((el) => ({
                          ...el,
                          borderRadius: Number(e.target.value),
                        }))
                      }
                      className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {lang === 'hi' ? 'बॉर्डर कलर' : 'Border Color'}
                    </label>
                    <input
                      type="color"
                      value={selectedElement.borderColor || '#0284C7'}
                      onChange={(e) =>
                        updateSelectedElements((el) => ({
                          ...el,
                          borderColor: e.target.value,
                        }))
                      }
                      className="w-full h-7 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Rotation & Opacity */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {lang === 'hi' ? 'घुमाव (Rotation °)' : 'Rotation (°)'}
                    </label>
                    <input
                      type="number"
                      min={-180}
                      max={180}
                      value={selectedElement.rotation || 0}
                      onChange={(e) =>
                        updateSelectedElements((el) => ({
                          ...el,
                          rotation: Number(e.target.value),
                        }))
                      }
                      className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {lang === 'hi' ? 'अपारदर्शिता (Opacity)' : 'Opacity (%)'}
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={Math.round((selectedElement.opacity ?? 1) * 100)}
                      onChange={(e) =>
                        updateSelectedElements((el) => ({
                          ...el,
                          opacity: Math.min(1, Math.max(0.1, Number(e.target.value) / 100)),
                        }))
                      }
                      className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Position X, Y, Width, Height */}
                <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">X</label>
                    <input
                      type="number"
                      value={selectedElement.x}
                      onChange={(e) =>
                        updateSelectedElements((el) => ({ ...el, x: Number(e.target.value) }))
                      }
                      className="w-full px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">Y</label>
                    <input
                      type="number"
                      value={selectedElement.y}
                      onChange={(e) =>
                        updateSelectedElements((el) => ({ ...el, y: Number(e.target.value) }))
                      }
                      className="w-full px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">W</label>
                    <input
                      type="number"
                      value={selectedElement.width}
                      onChange={(e) =>
                        updateSelectedElements((el) => ({
                          ...el,
                          width: Math.max(20, Number(e.target.value)),
                        }))
                      }
                      className="w-full px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">H</label>
                    <input
                      type="number"
                      value={selectedElement.height}
                      onChange={(e) =>
                        updateSelectedElements((el) => ({
                          ...el,
                          height: Math.max(20, Number(e.target.value)),
                        }))
                      }
                      className="w-full px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* FULL-SCREEN PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-5xl flex items-center justify-between text-white mb-3">
            <div>
              <h3 className="text-base font-bold">{doc.nameHi || doc.name}</h3>
              <p className="text-xs text-slate-400">
                {doc.width} × {doc.height} px — Jale Cricket Studio Live Preview
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('pdf')}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
              >
                Download PDF
              </button>
              <button
                onClick={() => handleExport('png')}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
              >
                Download PNG
              </button>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 w-full flex items-center justify-center overflow-auto">
            <div
              style={{
                width: doc.width * 0.55,
                height: doc.height * 0.55,
              }}
              className="relative shadow-2xl"
            >
              <div
                style={{
                  width: doc.width,
                  height: doc.height,
                  transform: 'scale(0.55)',
                  transformOrigin: 'top left',
                  backgroundColor: doc.backgroundColor || '#FFFFFF',
                  backgroundImage: doc.backgroundGradient || 'none',
                  border: doc.borderFrameWidth
                    ? `${doc.borderFrameWidth}px solid ${doc.borderFrameColor || '#0B192C'}`
                    : 'none',
                }}
                className="relative overflow-hidden"
              >
                {doc.elements.map((el) => {
                  const stickerUrl =
                    el.type === 'sticker' && el.stickerId
                      ? getStickerDataUrl(el.stickerId)
                      : el.imageUrl;
                  return (
                    <div
                      key={el.id}
                      style={{
                        position: 'absolute',
                        left: el.x,
                        top: el.y,
                        width: el.width,
                        height: el.height,
                        transform: `rotate(${el.rotation || 0}deg)`,
                        opacity: el.opacity ?? 1,
                        backgroundColor: el.backgroundColor || 'transparent',
                        borderColor: el.borderColor || 'transparent',
                        borderWidth: el.borderWidth ? `${el.borderWidth}px` : 0,
                        borderStyle: el.borderStyle || 'solid',
                        borderRadius:
                          el.type === 'circle'
                            ? '9999px'
                            : el.borderRadius
                            ? `${el.borderRadius}px`
                            : 0,
                        padding: el.padding ? `${el.padding}px` : 0,
                      }}
                    >
                      {(el.type === 'image' || el.type === 'sticker') && stickerUrl && (
                        <img
                          src={stickerUrl}
                          alt={el.label || ''}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                      )}
                      {(el.type === 'heading' ||
                        el.type === 'subheading' ||
                        el.type === 'title' ||
                        el.type === 'body') && (
                        <div
                          style={{
                            fontFamily: `"${el.fontFamily || 'Noto Sans Devanagari'}", sans-serif`,
                            fontSize: `${el.fontSize || 24}px`,
                            fontWeight: el.fontWeight || '700',
                            textAlign: el.textAlign || 'left',
                            color: el.color || '#0F172A',
                            lineHeight: el.lineHeight || 1.38,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {el.text}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
