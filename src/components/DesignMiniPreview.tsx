import React from 'react';
import { DesignDocument } from '../types/studio';
import { getStickerDataUrl } from '../utils/cricketGraphics';

interface DesignMiniPreviewProps {
  doc: DesignDocument;
  maxHeight?: number;
}

export const DesignMiniPreview: React.FC<DesignMiniPreviewProps> = ({
  doc,
  maxHeight = 230,
}) => {
  // Calculate scale so the full design fits inside a card preview box cleanly
  const scaleByHeight = maxHeight / doc.height;
  const scaleByWidth = 280 / doc.width;
  const scale = Math.min(scaleByHeight, scaleByWidth, 0.32);

  const scaledW = Math.round(doc.width * scale);
  const scaledH = Math.round(doc.height * scale);

  return (
    <div
      className="w-full flex items-center justify-center bg-slate-900/90 dark:bg-slate-950 p-3 overflow-hidden select-none"
      style={{ height: maxHeight + 20 }}
    >
      <div
        style={{
          width: scaledW,
          height: scaledH,
        }}
        className="relative shadow-xl rounded-sm overflow-hidden shrink-0 ring-1 ring-white/15"
      >
        <div
          style={{
            width: doc.width,
            height: doc.height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            backgroundColor: doc.backgroundColor || '#FFFFFF',
            backgroundImage: doc.backgroundGradient || 'none',
            border: doc.borderFrameWidth
              ? `${doc.borderFrameWidth}px solid ${doc.borderFrameColor || '#0B192C'}`
              : 'none',
          }}
          className="relative overflow-hidden pointer-events-none"
        >
          {doc.innerBorderColor && (
            <div
              style={{
                position: 'absolute',
                inset: 8,
                border: `2.5px solid ${doc.innerBorderColor}`,
              }}
            />
          )}

          {doc.elements.map((el) => {
            const imgSrc =
              el.imageUrl ||
              (el.type === 'sticker' && el.stickerId
                ? getStickerDataUrl(el.stickerId)
                : undefined);

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
                  overflow: 'hidden',
                }}
              >
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

                {(el.type === 'image' || el.type === 'sticker') && imgSrc && (
                  <img
                    src={imgSrc}
                    alt={el.label || ''}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                )}

                {el.type === 'table' && el.tableHeaders && el.tableRows && (
                  <table
                    className="w-full h-full border-collapse"
                    style={{
                      fontSize: `${el.fontSize || 15}px`,
                      fontFamily: '"Noto Sans Devanagari", sans-serif',
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
                            className="border px-1 py-0.5 font-extrabold text-center"
                            style={{ borderColor: el.borderColor || '#0F172A' }}
                          >
                            {th}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {el.tableRows.slice(0, 12).map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          style={{
                            backgroundColor:
                              rIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                            color: '#0F172A',
                          }}
                        >
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className="border px-1 py-0.5 font-semibold truncate"
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
                      lineHeight: el.lineHeight || 1.35,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
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
  );
};
