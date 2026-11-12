import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Check, Download, FileText, Share2, Sparkles, X } from 'lucide-react';
import { Language } from '../types/studio';
import { ExportResultPayload } from '../utils/exportEngine';

export const HDExportModal: React.FC<{ lang: Language }> = ({ lang }) => {
  const [payload, setPayload] = useState<ExportResultPayload | null>(null);
  const [clickedBtn, setClickedBtn] = useState<'save' | 'share' | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<ExportResultPayload>;
      if (custom.detail) {
        setPayload(custom.detail);
        setClickedBtn(null);
      }
    };
    window.addEventListener('jale-export-success', handler);
    return () => window.removeEventListener('jale-export-success', handler);
  }, []);

  if (!payload) return null;

  const handleDirectDownload = () => {
    setClickedBtn('save');
    if (payload.blobUrl) {
      const link = document.createElement('a');
      link.href = payload.blobUrl;
      link.download = payload.filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (link.parentNode) document.body.removeChild(link);
      }, 300);
    } else if (payload.previewDataUrl) {
      const link = document.createElement('a');
      link.href = payload.previewDataUrl;
      link.download = payload.filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (link.parentNode) document.body.removeChild(link);
      }, 300);
    }
    setTimeout(() => setClickedBtn(null), 1800);
  };

  const handleShareOrOpen = async () => {
    setClickedBtn('share');
    try {
      if (Capacitor.isNativePlatform() && payload.nativeUri) {
        await Share.share({
          title: payload.filename,
          text: `${payload.filename} — Jale Cricket Studio HD`,
          url: payload.nativeUri,
          dialogTitle: 'Save to Phone / Share on WhatsApp',
        });
        setTimeout(() => setClickedBtn(null), 1500);
        return;
      }

      if (payload.blobUrl && navigator.canShare) {
        const res = await fetch(payload.blobUrl);
        const blob = await res.blob();
        const file = new File([blob], payload.filename, { type: blob.type });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: payload.filename,
            text: `${payload.filename} — Jale Cricket Studio HD`,
            files: [file],
          });
          setTimeout(() => setClickedBtn(null), 1500);
          return;
        }
      }

      // Fallback to direct download
      handleDirectDownload();
    } catch {
      setTimeout(() => setClickedBtn(null), 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-500 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Success Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white px-4 py-3.5 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-white stroke-[3]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black truncate">
                {lang === 'hi'
                  ? 'HD फाइल सफलतापूर्वक तैयार है!'
                  : 'Ultra-HD File Ready!'}
              </h3>
              <p className="text-[11px] text-emerald-100 truncate">
                {payload.filename}
              </p>
            </div>
          </div>
          <button
            onClick={() => setPayload(null)}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview Body */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {payload.previewDataUrl ? (
            <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800 flex flex-col items-center">
              <img
                src={payload.previewDataUrl}
                alt={payload.filename}
                referrerPolicy="no-referrer"
                className="max-h-60 w-auto object-contain rounded shadow-lg"
              />
              <span className="mt-2 text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {payload.width && payload.height
                  ? `${payload.width} × ${payload.height} px · Ultra-HD (${payload.format.toUpperCase()})`
                  : `Original HD Quality (${payload.format.toUpperCase()})`}
              </span>
              {(payload.format === 'png' || payload.format === 'jpg') && (
                <span className="text-[10px] text-slate-400 mt-0.5 text-center">
                  {lang === 'hi'
                    ? 'टिप: आप ऊपर दी गई इमेज को दबाए रखकर (Long-Press) भी सीधे गैलरी में सेव कर सकते हैं'
                    : 'Tip: You can also long-press the image above to save directly to Gallery'}
                </span>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-5 text-center space-y-2">
              <FileText className="w-10 h-10 text-amber-500 mx-auto" />
              <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                {payload.filename}
              </div>
            </div>
          )}

          {payload.nativeUri && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-200 text-center">
              {lang === 'hi'
                ? '✓ आपके फोन के Documents फोल्डर में सेव हो गया है!'
                : '✓ Saved directly to your device Documents folder!'}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-2.5 pt-1">
            <button
              onClick={handleShareOrOpen}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              {clickedBtn === 'share' ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {lang === 'hi'
                      ? '✓ खुल रहा है (Opening Share/Save)...'
                      : '✓ Opening Share / Save...'}
                  </span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>
                    {lang === 'hi'
                      ? 'WhatsApp / Gallery / Print में सेव व शेयर करें'
                      : 'Save to Gallery / Share on WhatsApp'}
                  </span>
                </>
              )}
            </button>

            <button
              onClick={handleDirectDownload}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
            >
              {clickedBtn === 'save' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  <span className="text-emerald-400">
                    {lang === 'hi'
                      ? '✓ डाउनलोड शुरू हो गया!'
                      : '✓ Download Triggered!'}
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>
                    {lang === 'hi'
                      ? `डायरेक्ट डाउनलोड करें (${payload.format.toUpperCase()})`
                      : `Direct Download (${payload.format.toUpperCase()})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
