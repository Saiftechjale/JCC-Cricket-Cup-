import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Check, Download, FileText, Sparkles, X } from 'lucide-react';
import { Language } from '../types/studio';
import { ExportResultPayload } from '../utils/exportEngine';

export const HDExportModal: React.FC<{ lang: Language }> = ({ lang }) => {
  const [payload, setPayload] = useState<ExportResultPayload | null>(null);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<ExportResultPayload>;
      if (custom.detail) {
        setPayload(custom.detail);
        setClicked(false);
      }
    };
    window.addEventListener('jale-export-success', handler);
    return () => window.removeEventListener('jale-export-success', handler);
  }, []);

  if (!payload) return null;

  const handleSingleDownloadAction = async () => {
    setClicked(true);
    try {
      // On Android APK, open the native save/share action when user taps this single button
      if (Capacitor.isNativePlatform() && payload.nativeUri) {
        await Share.share({
          title: payload.filename,
          text: `${payload.filename} — Jale Cricket Studio HD`,
          url: payload.nativeUri,
          dialogTitle: 'Save or Share HD File',
        });
        setTimeout(() => setClicked(false), 1200);
        return;
      }

      // On Web / Mobile Browser, trigger direct download
      const urlToDownload = payload.blobUrl || payload.previewDataUrl;
      if (urlToDownload) {
        const link = document.createElement('a');
        link.href = urlToDownload;
        link.download = payload.filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (link.parentNode) document.body.removeChild(link);
        }, 300);
      }
      setTimeout(() => setClicked(false), 1500);
    } catch {
      setTimeout(() => setClicked(false), 1200);
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
                  ? 'HD फाइल तैयार है!'
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
                className="max-h-64 w-auto object-contain rounded shadow-lg"
              />
              <span className="mt-2 text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {payload.width && payload.height
                  ? `${payload.width} × ${payload.height} px · Ultra-HD (${payload.format.toUpperCase()})`
                  : `Original HD Quality (${payload.format.toUpperCase()})`}
              </span>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-5 text-center space-y-2">
              <FileText className="w-10 h-10 text-amber-500 mx-auto" />
              <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                {payload.filename}
              </div>
            </div>
          )}

          {/* SINGLE UNIFIED DOWNLOAD / SAVE BUTTON */}
          <div className="pt-1">
            <button
              onClick={handleSingleDownloadAction}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              {clicked ? (
                <>
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>
                    {lang === 'hi'
                      ? '✓ सेव / डाउनलोड हो गया!'
                      : '✓ Saved / Downloaded!'}
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>
                    {lang === 'hi'
                      ? `डाउनलोड / सेव करें (${payload.format.toUpperCase()})`
                      : `Download / Save (${payload.format.toUpperCase()})`}
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
