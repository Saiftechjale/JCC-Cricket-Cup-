import { jsPDF } from 'jspdf';
import {
  CanvasElement,
  DesignDocument,
  MatchResultRecord,
  MatchScheduleRecord,
  PlayerRecord,
  ScorecardRecord,
  TournamentProfile,
} from '../types/studio';
import { getStickerDataUrl } from './cricketGraphics';

export type ExportPagePreset =
  | 'original'
  | 'A4-Portrait'
  | 'A4-Landscape'
  | 'A5-Portrait'
  | 'A5-Landscape'
  | 'Facebook-Portrait'
  | 'Instagram-Square'
  | 'Instagram-Story'
  | 'Custom';

export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpg';
  preset: ExportPagePreset;
  scale?: number;
  customWidth?: number;
  customHeight?: number;
  filename?: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const paragraphs = (text || '').split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push('');
      continue;
    }
    const words = para.split(' ');
    let currentLine = words[0] || '';
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = `${currentLine} ${word}`;
      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
  }
  return lines;
}

async function renderElementToCanvas(
  ctx: CanvasRenderingContext2D,
  el: CanvasElement
): Promise<void> {
  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;

  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  ctx.translate(cx, cy);
  if (el.rotation) {
    ctx.rotate((el.rotation * Math.PI) / 180);
  }
  ctx.translate(-el.width / 2, -el.height / 2);

  if (el.shadowBlur && el.shadowColor) {
    ctx.shadowColor = el.shadowColor;
    ctx.shadowBlur = el.shadowBlur;
  }

  const radius = el.type === 'circle' ? Math.min(el.width, el.height) / 2 : el.borderRadius || 0;

  // Background & Border for shapes and text boxes
  if (
    el.backgroundColor ||
    el.borderWidth ||
    el.type === 'rect' ||
    el.type === 'circle' ||
    el.type === 'pill'
  ) {
    drawRoundedRect(ctx, 0, 0, el.width, el.height, radius);
    if (el.backgroundColor && el.backgroundColor !== 'transparent') {
      ctx.fillStyle = el.backgroundColor;
      ctx.fill();
    }
    if (el.borderWidth && el.borderColor) {
      ctx.lineWidth = el.borderWidth;
      ctx.strokeStyle = el.borderColor;
      if (el.borderStyle === 'dashed') {
        ctx.setLineDash([8, 6]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Line element
  if (el.type === 'line') {
    ctx.beginPath();
    ctx.moveTo(0, el.height / 2);
    ctx.lineTo(el.width, el.height / 2);
    ctx.strokeStyle = el.color || el.borderColor || '#0F172A';
    ctx.lineWidth = el.borderWidth || 3;
    ctx.stroke();
  }

  // Image or Sticker
  if (el.type === 'image' || el.type === 'sticker') {
    const src =
      el.type === 'sticker' && el.stickerId
        ? getStickerDataUrl(el.stickerId)
        : el.imageUrl;
    if (src) {
      try {
        const img = await loadImage(src);
        ctx.drawImage(img, 0, 0, el.width, el.height);
      } catch (err) {
        console.warn('Could not draw image in export:', err);
      }
    }
  }

  // Table element
  if (el.type === 'table' && el.tableHeaders && el.tableRows) {
    const cols = el.tableHeaders.length;
    const totalRows = el.tableRows.length + 1;
    const rowH = el.height / totalRows;
    const colW = el.width / cols;
    const fSize = el.fontSize || 16;

    // Header Row
    ctx.fillStyle = el.headerBgColor || '#0B192C';
    ctx.fillRect(0, 0, el.width, rowH);
    ctx.strokeStyle = el.borderColor || '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, el.width, el.height);

    ctx.font = `800 ${fSize}px "Noto Sans Devanagari", "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = el.headerTextColor || '#FFFFFF';
    ctx.textBaseline = 'middle';

    el.tableHeaders.forEach((hText, cIdx) => {
      const cellX = cIdx * colW;
      ctx.strokeRect(cellX, 0, colW, rowH);
      ctx.textAlign = 'center';
      ctx.fillText(hText, cellX + colW / 2, rowH / 2, colW - 10);
    });

    // Data Rows
    el.tableRows.forEach((rData, rIdx) => {
      const yTop = (rIdx + 1) * rowH;
      ctx.fillStyle = rIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      ctx.fillRect(0, yTop, el.width, rowH);

      ctx.font = `600 ${fSize - 1}px "Noto Sans Devanagari", "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#0F172A';
      rData.forEach((cellVal, cIdx) => {
        const cellX = cIdx * colW;
        ctx.strokeStyle = el.borderColor || '#94A3B8';
        ctx.lineWidth = 1;
        ctx.strokeRect(cellX, yTop, colW, rowH);
        ctx.textAlign = cIdx === 0 ? 'center' : 'left';
        const textX = cIdx === 0 ? cellX + colW / 2 : cellX + 10;
        ctx.fillText(cellVal || '', textX, yTop + rowH / 2, colW - 16);
      });
    });
  }

  // Text Elements (heading, subheading, title, body)
  if (
    (el.type === 'heading' ||
      el.type === 'subheading' ||
      el.type === 'title' ||
      el.type === 'body') &&
    el.text
  ) {
    const pad = el.padding ?? 8;
    const fSize = el.fontSize || 24;
    const fWeight = el.fontWeight || '700';
    const fStyle = el.fontStyle || 'normal';
    const fFamily = el.fontFamily || 'Noto Sans Devanagari';
    ctx.font = `${fStyle} ${fWeight} ${fSize}px "${fFamily}", "Noto Sans Devanagari", sans-serif`;
    ctx.fillStyle = el.color || '#0F172A';
    ctx.textBaseline = 'top';

    const availW = Math.max(40, el.width - pad * 2);
    const lines = wrapLines(ctx, el.text, availW);
    const lineH = fSize * (el.lineHeight || 1.38);

    lines.forEach((line, idx) => {
      const lineY = pad + idx * lineH;
      let lineX = pad;
      if (el.textAlign === 'center') {
        ctx.textAlign = 'center';
        lineX = el.width / 2;
      } else if (el.textAlign === 'right') {
        ctx.textAlign = 'right';
        lineX = el.width - pad;
      } else {
        ctx.textAlign = 'left';
        lineX = pad;
      }
      ctx.fillText(line, lineX, lineY);

      if (el.textDecoration === 'underline' && line.trim()) {
        const metrics = ctx.measureText(line);
        let uStartX = lineX;
        if (el.textAlign === 'center') uStartX = lineX - metrics.width / 2;
        if (el.textAlign === 'right') uStartX = lineX - metrics.width;
        ctx.beginPath();
        ctx.moveTo(uStartX, lineY + fSize + 3);
        ctx.lineTo(uStartX + metrics.width, lineY + fSize + 3);
        ctx.strokeStyle = el.color || '#0F172A';
        ctx.lineWidth = Math.max(1.5, fSize / 14);
        ctx.stroke();
      }
    });
  }

  ctx.restore();
}

export async function renderDesignToCanvas(
  doc: DesignDocument,
  options: ExportOptions
): Promise<HTMLCanvasElement> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  let targetW = doc.width;
  let targetH = doc.height;

  if (options.preset === 'Facebook-Portrait') {
    targetW = 1080;
    targetH = 1350;
  } else if (options.preset === 'Instagram-Square') {
    targetW = 1080;
    targetH = 1080;
  } else if (options.preset === 'Instagram-Story') {
    targetW = 1080;
    targetH = 1920;
  } else if (options.preset === 'Custom' && options.customWidth && options.customHeight) {
    targetW = options.customWidth;
    targetH = options.customHeight;
  }

  const scale = options.scale || 2;
  const canvas = document.createElement('canvas');
  canvas.width = targetW * scale;
  canvas.height = targetH * scale;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // Fill background
  ctx.fillStyle = doc.backgroundColor || '#FFFFFF';
  ctx.fillRect(0, 0, targetW, targetH);

  // Scale factor from original doc dimensions into target preset dimensions
  const scaleX = targetW / doc.width;
  const scaleY = targetH / doc.height;
  const uniformScale = Math.min(scaleX, scaleY);
  const offsetX = (targetW - doc.width * uniformScale) / 2;
  const offsetY = (targetH - doc.height * uniformScale) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(uniformScale, uniformScale);

  // Draw doc background inside design bounds
  if (doc.backgroundGradient && doc.backgroundGradient.includes('#')) {
    const hexMatches = doc.backgroundGradient.match(/#[0-9A-Fa-f]{6}/g);
    if (hexMatches && hexMatches.length >= 2) {
      const grad = ctx.createLinearGradient(0, 0, 0, doc.height);
      grad.addColorStop(0, hexMatches[0]);
      grad.addColorStop(0.5, hexMatches[1]);
      grad.addColorStop(1, hexMatches[hexMatches.length - 1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, doc.width, doc.height);
    }
  } else {
    ctx.fillStyle = doc.backgroundColor || '#FFFFFF';
    ctx.fillRect(0, 0, doc.width, doc.height);
  }

  // Outer Frame Border
  if (doc.borderFrameWidth && doc.borderFrameColor) {
    ctx.strokeStyle = doc.borderFrameColor;
    ctx.lineWidth = doc.borderFrameWidth;
    ctx.strokeRect(
      doc.borderFrameWidth / 2,
      doc.borderFrameWidth / 2,
      doc.width - doc.borderFrameWidth,
      doc.height - doc.borderFrameWidth
    );
  }

  // Inner Gold Accent Frame Border
  if (doc.innerBorderColor) {
    const inset = (doc.borderFrameWidth || 8) + 8;
    ctx.strokeStyle = doc.innerBorderColor;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(inset, inset, doc.width - inset * 2, doc.height - inset * 2);
  }

  // Render all elements in layer order
  for (const el of doc.elements) {
    await renderElementToCanvas(ctx, el);
  }

  ctx.restore();
  return canvas;
}

export async function exportDesignDocument(
  doc: DesignDocument,
  options: ExportOptions
): Promise<void> {
  const canvas = await renderDesignToCanvas(doc, options);
  const safeName = (options.filename || doc.name || 'jale-cricket-design')
    .replace(/[^a-zA-Z0-9\u0900-\u097F_-]/g, '_')
    .slice(0, 60);

  if (options.format === 'png' || options.format === 'jpg') {
    const mime = options.format === 'png' ? 'image/png' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(mime, 0.96);
    const link = document.createElement('a');
    link.download = `${safeName}.${options.format}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // PDF Export via jsPDF preserving Hindi & English fonts via high-DPI image layer
  const imgData = canvas.toDataURL('image/jpeg', 0.96);
  const isLandscape =
    options.preset === 'A4-Landscape' ||
    options.preset === 'A5-Landscape' ||
    (options.preset === 'original' && canvas.width > canvas.height);

  let pdfFormat: string | [number, number] = 'a4';
  if (options.preset === 'A5-Portrait' || options.preset === 'A5-Landscape') {
    pdfFormat = 'a5';
  } else if (options.preset === 'original' || options.preset === 'Custom') {
    // Exact custom page size in pt so zero white margins occur
    const ptW = (canvas.width / (options.scale || 2)) * 0.75;
    const ptH = (canvas.height / (options.scale || 2)) * 0.75;
    const pdf = new jsPDF({
      orientation: ptW > ptH ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [ptW, ptH],
    });
    pdf.addImage(imgData, 'JPEG', 0, 0, ptW, ptH);
    pdf.save(`${safeName}.pdf`);
    return;
  }

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: pdfFormat,
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgRatio = canvas.width / canvas.height;
  const pageRatio = pageW / pageH;

  let renderW = pageW;
  let renderH = pageH;
  let offsetX = 0;
  let offsetY = 0;

  if (imgRatio > pageRatio) {
    renderW = pageW;
    renderH = pageW / imgRatio;
    offsetY = (pageH - renderH) / 2;
  } else {
    renderH = pageH;
    renderW = pageH * imgRatio;
    offsetX = (pageW - renderW) / 2;
  }

  pdf.addImage(imgData, 'JPEG', offsetX, offsetY, renderW, renderH);
  pdf.save(`${safeName}.pdf`);
}

export async function shareDesignDocument(doc: DesignDocument): Promise<boolean> {
  try {
    const canvas = await renderDesignToCanvas(doc, {
      format: 'png',
      preset: 'original',
      scale: 2,
    });
    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob((b) => res(b), 'image/png', 0.95)
    );
    if (!blob) return false;
    const file = new File([blob], `${doc.name || 'jale-cricket'}.png`, {
      type: 'image/png',
    });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: doc.nameHi || doc.name,
        text: `${doc.nameHi} — Created with Jale Cricket Studio`,
        files: [file],
      });
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Share cancelled or unsupported:', err);
    return false;
  }
}

/**
 * Generates a high-resolution Printable Player List PDF directly from Player Management records
 */
export async function exportPlayersPrintablePDF(
  players: PlayerRecord[],
  profile: TournamentProfile,
  teamFilter?: string
): Promise<void> {
  const doc: DesignDocument = {
    id: 'temp-players-pdf',
    name: `Player_List_${teamFilter || 'All_Teams'}`,
    nameHi: 'खिलाड़ियों की सूची',
    category: 'player-list',
    theme: 'minimal-white',
    width: 900,
    height: 1270,
    backgroundColor: '#FFFFFF',
    borderFrameColor: '#0B192C',
    borderFrameWidth: 6,
    updatedAt: new Date().toISOString(),
    version: 1,
    elements: [
      {
        id: 'h1',
        type: 'heading',
        x: 40,
        y: 25,
        width: 820,
        height: 85,
        rotation: 0,
        opacity: 1,
        locked: false,
        text: `${profile.tournamentName} (${profile.seasonNumber})\nस्थान: ${profile.venue}`,
        fontFamily: 'Noto Sans Devanagari',
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
        color: '#0B192C',
        lineHeight: 1.35,
      },
      {
        id: 'h2',
        type: 'subheading',
        x: 150,
        y: 120,
        width: 600,
        height: 44,
        rotation: 0,
        opacity: 1,
        locked: false,
        text: `पंजीकृत खिलाड़ियों की सूची ${teamFilter && teamFilter !== 'ALL' ? `— टीम: ${teamFilter}` : '(सभी टीमें)'}`,
        fontFamily: 'Noto Sans Devanagari',
        fontSize: 21,
        fontWeight: '800',
        textAlign: 'center',
        color: '#FFFFFF',
        backgroundColor: '#15803D',
        borderRadius: 8,
        padding: 8,
      },
      {
        id: 'tbl',
        type: 'table',
        x: 35,
        y: 180,
        width: 830,
        height: Math.min(960, Math.max(300, (players.length + 1) * 46)),
        rotation: 0,
        opacity: 1,
        locked: false,
        headerBgColor: '#0B192C',
        headerTextColor: '#FDE047',
        borderColor: '#334155',
        fontSize: 15,
        tableHeaders: ['क्र०', 'खिलाड़ी का नाम', 'पिता का नाम', 'टीम का नाम', 'भूमिका (Role)', 'मोबाइल', 'स्थिति'],
        tableRows: players.slice(0, 20).map((pl, idx) => [
          String(idx + 1),
          pl.playerName,
          pl.fatherName,
          pl.teamName,
          pl.role,
          pl.mobileNumber,
          pl.registrationStatus,
        ]),
      },
      {
        id: 'f1',
        type: 'body',
        x: 40,
        y: 1175,
        width: 820,
        height: 55,
        rotation: 0,
        opacity: 1,
        locked: false,
        text: `आयोजन समिति अध्यक्ष: ${profile.presidentName} | संपर्क: ${profile.contactNumber}`,
        fontFamily: 'Noto Sans Devanagari',
        fontSize: 19,
        fontWeight: '800',
        textAlign: 'center',
        color: '#0F172A',
      },
    ],
  };

  await exportDesignDocument(doc, {
    format: 'pdf',
    preset: 'A4-Portrait',
    scale: 2,
    filename: `Jale_Player_List_${teamFilter || 'All'}`,
  });
}

export async function exportSchedulesPrintablePDF(
  schedules: MatchScheduleRecord[],
  profile: TournamentProfile
): Promise<void> {
  const doc: DesignDocument = {
    id: 'temp-schedule-pdf',
    name: 'Match_Schedule',
    nameHi: 'मैच शेड्यूल',
    category: 'schedule',
    theme: 'blue-sports',
    width: 900,
    height: 1270,
    backgroundColor: '#FFFFFF',
    borderFrameColor: '#1E3A8A',
    borderFrameWidth: 6,
    updatedAt: new Date().toISOString(),
    version: 1,
    elements: [
      {
        id: 'sh1',
        type: 'heading',
        x: 40,
        y: 30,
        width: 820,
        height: 95,
        rotation: 0,
        opacity: 1,
        locked: false,
        text: `${profile.tournamentName} (${profile.seasonNumber})\nआधिकारिक मैच शेड्यूल (OFFICIAL MATCH SCHEDULE)`,
        fontFamily: 'Noto Sans Devanagari',
        fontSize: 30,
        fontWeight: '900',
        textAlign: 'center',
        color: '#1E3A8A',
        lineHeight: 1.35,
      },
      {
        id: 'stbl',
        type: 'table',
        x: 35,
        y: 150,
        width: 830,
        height: Math.min(950, Math.max(320, (schedules.length + 1) * 58)),
        rotation: 0,
        opacity: 1,
        locked: false,
        headerBgColor: '#0B192C',
        headerTextColor: '#FDE047',
        borderColor: '#1E3A8A',
        fontSize: 16,
        tableHeaders: ['मैच नं०', 'चरण (Stage)', 'टीम A', 'टीम B', 'दिनांक व समय', 'मैदान (Venue)'],
        tableRows: schedules.map((s) => [
          `मैच #${s.matchNumber}`,
          s.stage,
          s.teamA,
          s.teamB,
          `${s.matchDate} (${s.matchTime})`,
          s.venue,
        ]),
      },
      {
        id: 'sfoot',
        type: 'body',
        x: 40,
        y: 1165,
        width: 820,
        height: 60,
        rotation: 0,
        opacity: 1,
        locked: false,
        text: `आयोजक अध्यक्ष: ${profile.presidentName} | मोबाइल: ${profile.contactNumber}`,
        fontFamily: 'Noto Sans Devanagari',
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
        color: '#0F172A',
      },
    ],
  };

  await exportDesignDocument(doc, {
    format: 'pdf',
    preset: 'A4-Portrait',
    scale: 2,
    filename: 'Jale_Cricket_Match_Schedule',
  });
}

export async function exportResultCardPDF(
  res: MatchResultRecord,
  profile: TournamentProfile
): Promise<void> {
  const doc: DesignDocument = {
    id: 'temp-result-pdf',
    name: `Match_${res.matchNumber}_Result`,
    nameHi: 'मैच परिणाम पत्रक',
    category: 'result',
    theme: 'blue-sports',
    width: 900,
    height: 1125,
    backgroundColor: '#0B192C',
    backgroundGradient: 'linear-gradient(180deg, #0B192C 0%, #1E3A8A 100%)',
    borderFrameColor: '#F59E0B',
    borderFrameWidth: 8,
    updatedAt: new Date().toISOString(),
    version: 1,
    elements: [
      {
        id: 'rt1',
        type: 'heading',
        x: 50,
        y: 40,
        width: 800,
        height: 100,
        rotation: 0,
        opacity: 1,
        locked: false,
        text: `${profile.tournamentName}\nमैच #${res.matchNumber} (${res.stage}) — दिनांक: ${res.matchDate}`,
        fontFamily: 'Noto Sans Devanagari',
        fontSize: 32,
        fontWeight: '900',
        textAlign: 'center',
        color: '#FDE047',
        lineHeight: 1.35,
      },
      {
        id: 'rt2',
        type: 'title',
        x: 60,
        y: 175,
        width: 780,
        height: 310,
        rotation: 0,
        opacity: 1,
        locked: false,
        text: `${res.teamA}\nस्कोर: ${res.teamAScore}/${res.teamAWickets} (${res.teamAOvers} Overs)\n\nVS\n\n${res.teamB}\nस्कोर: ${res.teamBScore}/${res.teamBWickets} (${res.teamBOvers} Overs)`,
        fontFamily: 'Noto Sans Devanagari',
        fontSize: 30,
        fontWeight: '900',
        textAlign: 'center',
        color: '#0F172A',
        backgroundColor: '#FFFFFF',
        borderColor: '#F59E0B',
        borderWidth: 4,
        borderRadius: 20,
        padding: 24,
        lineHeight: 1.35,
      },
      {
        id: 'rt3',
        type: 'heading',
        x: 60,
        y: 520,
        width: 780,
        height: 95,
        rotation: 0,
        opacity: 1,
        locked: false,
        text: `विजेता: ${res.winner} (${res.winMargin})`,
        fontFamily: 'Noto Sans Devanagari',
        fontSize: 30,
        fontWeight: '900',
        textAlign: 'center',
        color: '#FFFFFF',
        backgroundColor: '#16A34A',
        borderRadius: 14,
        padding: 20,
      },
      {
        id: 'rt4',
        type: 'body',
        x: 60,
        y: 650,
        width: 780,
        height: 200,
        rotation: 0,
        opacity: 1,
        locked: false,
        text: `★ MAN OF THE MATCH (मैन ऑफ द मैच) ★\n${res.playerOfTheMatch}\n${res.playerOfTheMatchStats}`,
        fontFamily: 'Noto Sans Devanagari',
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        color: '#FDE047',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 24,
        lineHeight: 1.5,
      },
      {
        id: 'rt5',
        type: 'body',
        x: 60,
        y: 960,
        width: 780,
        height: 75,
        rotation: 0,
        opacity: 1,
        locked: false,
        text: `स्थान: ${res.venue} | अध्यक्ष: ${profile.presidentName} (${profile.contactNumber})`,
        fontFamily: 'Noto Sans Devanagari',
        fontSize: 22,
        fontWeight: '800',
        textAlign: 'center',
        color: '#FFFFFF',
      },
    ],
  };

  await exportDesignDocument(doc, {
    format: 'pdf',
    preset: 'A4-Portrait',
    scale: 2,
    filename: `Jale_Match_${res.matchNumber}_Result`,
  });
}

export async function exportScorecardPrintablePDF(
  sc: ScorecardRecord,
  profile: TournamentProfile
): Promise<void> {
  const totalRuns =
    sc.batsmen.reduce((sum, b) => sum + Number(b.runs || 0), 0) + Number(sc.extras || 0);

  const doc: DesignDocument = {
    id: 'temp-scorecard-pdf',
    name: `Scorecard_Match_${sc.matchNumber}`,
    nameHi: 'मैच स्कोरकार्ड',
    category: 'scorecard',
    theme: 'minimal-white',
    width: 900,
    height: 1270,
    backgroundColor: '#FFFFFF',
    borderFrameColor: '#0B192C',
    borderFrameWidth: 6,
    updatedAt: new Date().toISOString(),
    version: 1,
    elements: [
      {
        id: 'sch1',
        type: 'heading',
        x: 40,
        y: 25,
        width: 820,
        height: 95,
        rotation: 0,
        opacity: 1,
        locked: false,
        text: `${profile.tournamentName} (${profile.seasonNumber})\n${sc.matchTitle} — दिनांक: ${sc.matchDate}`,
        fontFamily: 'Noto Sans Devanagari',
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
        color: '#0B192C',
        lineHeight: 1.35,
      },
      {
        id: 'sch-sub',
        type: 'subheading',
        x: 40,
        y: 125,
        width: 820,
        height: 44,
        rotation: 0,
        opacity: 1,
        locked: false,
        text: `बल्लेबाजी: ${sc.battingTeam}   बनाम  गेंदबाजी: ${sc.bowlingTeam}`,
        fontFamily: 'Noto Sans Devanagari',
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
        color: '#FFFFFF',
        backgroundColor: '#1E3A8A',
        borderRadius: 8,
        padding: 8,
      },
      {
        id: 'sch-bat',
        type: 'table',
        x: 40,
        y: 185,
        width: 820,
        height: Math.min(480, (sc.batsmen.length + 3) * 48),
        rotation: 0,
        opacity: 1,
        locked: false,
        headerBgColor: '#0B192C',
        headerTextColor: '#FDE047',
        borderColor: '#334155',
        fontSize: 16,
        tableHeaders: ['बल्लेबाज (Batsman)', 'आउट विवरण (Dismissal)', 'रन (R)', 'गेंद (B)', '4s', '6s', 'SR'],
        tableRows: [
          ...sc.batsmen.map((b) => [
            b.name,
            b.dismissal,
            String(b.runs),
            String(b.balls),
            String(b.fours),
            String(b.sixes),
            b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0',
          ]),
          ['अतिरिक्त (Extras)', '-', String(sc.extras), '-', '-', '-', '-'],
          ['कुल स्कोर (TOTAL)', `${sc.totalOvers} Overs`, `${totalRuns}/${sc.totalWickets}`, '-', '-', '-', '-'],
        ],
      },
      {
        id: 'sch-bowl',
        type: 'table',
        x: 40,
        y: 690,
        width: 820,
        height: Math.min(340, (sc.bowlers.length + 1) * 50),
        rotation: 0,
        opacity: 1,
        locked: false,
        headerBgColor: '#15803D',
        headerTextColor: '#FFFFFF',
        borderColor: '#334155',
        fontSize: 16,
        tableHeaders: ['गेंदबाज (Bowler)', 'ओवर (O)', 'मेडन (M)', 'रन (R)', 'विकेट (W)', 'इकोनॉमी (Econ)'],
        tableRows: sc.bowlers.map((bw) => [
          bw.name,
          bw.overs,
          String(bw.maidens),
          String(bw.runsConceded),
          String(bw.wickets),
          parseFloat(bw.overs) > 0 ? (bw.runsConceded / parseFloat(bw.overs)).toFixed(2) : '0.00',
        ]),
      },
      {
        id: 'sch-res',
        type: 'body',
        x: 40,
        y: 1060,
        width: 820,
        height: 140,
        rotation: 0,
        opacity: 1,
        locked: false,
        text: `मैच परिणाम: ${sc.resultNote}\nमैन ऑफ द मैच: ${sc.manOfTheMatch}\nस्थान: ${sc.venue} | अध्यक्ष: ${profile.presidentName} (${profile.contactNumber})`,
        fontFamily: 'Noto Sans Devanagari',
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
        color: '#0F172A',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 16,
        lineHeight: 1.5,
      },
    ],
  };

  await exportDesignDocument(doc, {
    format: 'pdf',
    preset: 'A4-Portrait',
    scale: 2,
    filename: `Jale_Scorecard_Match_${sc.matchNumber}`,
  });
}
