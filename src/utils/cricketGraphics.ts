import { StickerGraphicId } from '../types/studio';

export interface StickerGraphicMeta {
  id: StickerGraphicId;
  nameHi: string;
  nameEn: string;
  svgString: string;
  dataUrl: string;
}

function toSvgDataUrl(svg: string): string {
  const clean = svg.trim();
  try {
    const base64 = btoa(unescape(encodeURIComponent(clean)));
    return `data:image/svg+xml;base64,${base64}`;
  } catch {
    return `data:image/svg+xml;utf8,${encodeURIComponent(clean)}`;
  }
}

const JALE_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
  <defs>
    <linearGradient id="goldG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE066"/>
      <stop offset="50%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>
    <linearGradient id="navyG" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E3A8A"/>
      <stop offset="100%" stop-color="#0B192C"/>
    </linearGradient>
  </defs>
  <circle cx="160" cy="155" r="128" fill="url(#navyG)" stroke="url(#goldG)" stroke-width="8"/>
  <circle cx="160" cy="155" r="114" fill="none" stroke="#FDE047" stroke-width="2" stroke-dasharray="6 4"/>
  <g transform="rotate(-35 160 145)">
    <rect x="148" y="40" width="24" height="150" rx="5" fill="url(#goldG)" stroke="#78350F" stroke-width="2"/>
    <rect x="154" y="190" width="12" height="65" rx="4" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
  </g>
  <g transform="rotate(35 160 145)">
    <rect x="148" y="40" width="24" height="150" rx="5" fill="url(#goldG)" stroke="#78350F" stroke-width="2"/>
    <rect x="154" y="190" width="12" height="65" rx="4" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
  </g>
  <path d="M120 75 H200 L190 145 C190 168 175 182 160 185 C145 182 130 168 130 145 Z" fill="url(#goldG)" stroke="#78350F" stroke-width="3"/>
  <rect x="148" y="185" width="24" height="28" fill="url(#goldG)"/>
  <rect x="128" y="210" width="64" height="16" rx="4" fill="#78350F" stroke="#FDE047" stroke-width="2"/>
  <circle cx="160" cy="130" r="24" fill="#DC2626" stroke="#FEF08A" stroke-width="2.5"/>
  <path d="M142 118 Q160 130 178 142" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="3 3"/>
  <rect x="26" y="218" width="268" height="46" rx="10" fill="url(#goldG)" stroke="#78350F" stroke-width="3"/>
  <text x="160" y="248" font-family="Arial, sans-serif" font-weight="900" font-size="23" fill="#0B192C" text-anchor="middle">JALE CRICKET CUP</text>
  <rect x="66" y="266" width="188" height="28" rx="6" fill="#DC2626" stroke="#FEF08A" stroke-width="2"/>
  <text x="160" y="285" font-family="Arial, sans-serif" font-weight="800" font-size="15" fill="#FFFFFF" text-anchor="middle">SEASON - 2</text>
</svg>
`;

const TROPHY_GOLD_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="260" height="320" viewBox="0 0 260 320">
  <defs>
    <linearGradient id="cupGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFBEB"/>
      <stop offset="30%" stop-color="#FDE047"/>
      <stop offset="70%" stop-color="#D97706"/>
      <stop offset="100%" stop-color="#78350F"/>
    </linearGradient>
  </defs>
  <path d="M65 65 C20 65 20 145 72 155" fill="none" stroke="url(#cupGold)" stroke-width="14" stroke-linecap="round"/>
  <path d="M195 65 C240 65 240 145 188 155" fill="none" stroke="url(#cupGold)" stroke-width="14" stroke-linecap="round"/>
  <ellipse cx="130" cy="45" rx="68" ry="16" fill="#FDE047" stroke="#92400E" stroke-width="3"/>
  <path d="M62 45 L75 160 C82 200 105 218 130 222 C155 218 178 200 185 160 L198 45 Z" fill="url(#cupGold)" stroke="#92400E" stroke-width="3"/>
  <polygon points="130,85 140,108 165,110 146,126 152,150 130,136 108,150 114,126 95,110 120,108" fill="#FFFBEB" opacity="0.9"/>
  <rect x="115" y="220" width="30" height="42" rx="4" fill="url(#cupGold)" stroke="#92400E" stroke-width="2"/>
  <rect x="82" y="260" width="96" height="18" rx="6" fill="url(#cupGold)" stroke="#92400E" stroke-width="2"/>
  <rect x="64" y="278" width="132" height="28" rx="6" fill="#451A03" stroke="#F59E0B" stroke-width="3"/>
  <text x="130" y="297" font-family="Arial, sans-serif" font-weight="900" font-size="14" fill="#FDE047" text-anchor="middle">CHAMPIONS</text>
</svg>
`;

const STUMPS_3D_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280">
  <defs>
    <linearGradient id="stumpG" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="50%" stop-color="#D97706"/>
      <stop offset="100%" stop-color="#78350F"/>
    </linearGradient>
  </defs>
  <ellipse cx="140" cy="252" rx="85" ry="14" fill="rgba(0,0,0,0.18)"/>
  <rect x="98" y="55" width="16" height="192" rx="5" fill="url(#stumpG)" stroke="#78350F" stroke-width="2"/>
  <rect x="132" y="55" width="16" height="192" rx="5" fill="url(#stumpG)" stroke="#78350F" stroke-width="2"/>
  <rect x="166" y="55" width="16" height="192" rx="5" fill="url(#stumpG)" stroke="#78350F" stroke-width="2"/>
  <rect x="93" y="43" width="46" height="10" rx="3" fill="#F59E0B" stroke="#78350F" stroke-width="2"/>
  <rect x="141" y="43" width="46" height="10" rx="3" fill="#F59E0B" stroke="#78350F" stroke-width="2"/>
  <g transform="rotate(-28 140 165)">
    <rect x="126" y="55" width="28" height="145" rx="6" fill="url(#stumpG)" stroke="#451A03" stroke-width="2.5"/>
    <rect x="133" y="198" width="14" height="58" rx="4" fill="#F8FAFC" stroke="#334155" stroke-width="2"/>
  </g>
  <circle cx="105" cy="215" r="24" fill="#DC2626" stroke="#FEF08A" stroke-width="3"/>
  <path d="M88 202 Q105 215 122 228" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="4 3"/>
</svg>
`;

const CRICKET_BAT_BALL_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="180" viewBox="0 0 360 180">
  <defs>
    <linearGradient id="woodG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A"/>
      <stop offset="60%" stop-color="#D97706"/>
      <stop offset="100%" stop-color="#92400E"/>
    </linearGradient>
  </defs>
  <g transform="rotate(-62 180 90)">
    <rect x="166" y="-20" width="28" height="150" rx="6" fill="url(#woodG)" stroke="#451A03" stroke-width="3"/>
    <rect x="173" y="128" width="14" height="72" rx="4" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
  </g>
  <g transform="rotate(62 180 90)">
    <rect x="166" y="-20" width="28" height="150" rx="6" fill="url(#woodG)" stroke="#451A03" stroke-width="3"/>
    <rect x="173" y="128" width="14" height="72" rx="4" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
  </g>
  <circle cx="95" cy="118" r="28" fill="#DC2626" stroke="#FFFFFF" stroke-width="3"/>
  <path d="M75 102 Q95 118 115 134" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-dasharray="4 4"/>
  <circle cx="265" cy="118" r="28" fill="#DC2626" stroke="#FFFFFF" stroke-width="3"/>
  <path d="M245 102 Q265 118 285 134" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-dasharray="4 4"/>
</svg>
`;

const BATSMAN_ACTION_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="260" height="300" viewBox="0 0 260 300">
  <circle cx="130" cy="155" r="110" fill="#EFF6FF" stroke="#3B82F6" stroke-width="4" opacity="0.6"/>
  <circle cx="135" cy="64" r="22" fill="#1E3A8A" stroke="#0F172A" stroke-width="3"/>
  <path d="M142 64 H164 V76 H142 Z" fill="#94A3B8" stroke="#0F172A" stroke-width="2"/>
  <path d="M100 90 L162 88 L175 162 L108 165 Z" fill="#F59E0B" stroke="#1E3A8A" stroke-width="3"/>
  <path d="M115 90 L148 90 L152 135 L112 135 Z" fill="#1E3A8A"/>
  <g transform="rotate(-40 175 95)">
    <rect x="165" y="10" width="22" height="115" rx="4" fill="#D97706" stroke="#451A03" stroke-width="3"/>
    <rect x="170" y="122" width="12" height="45" rx="3" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/>
  </g>
  <path d="M112 165 L95 255 L122 258 L136 175 Z" fill="#1E40AF" stroke="#0F172A" stroke-width="3"/>
  <path d="M142 165 L168 255 L194 250 L168 165 Z" fill="#1E40AF" stroke="#0F172A" stroke-width="3"/>
  <rect x="92" y="195" width="30" height="65" rx="8" fill="#FFFFFF" stroke="#1E3A8A" stroke-width="3"/>
  <rect x="155" y="195" width="30" height="65" rx="8" fill="#FFFFFF" stroke="#1E3A8A" stroke-width="3"/>
  <circle cx="215" cy="195" r="14" fill="#DC2626" stroke="#FEF08A" stroke-width="2"/>
</svg>
`;

const BOWLER_ACTION_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="260" height="300" viewBox="0 0 260 300">
  <circle cx="130" cy="155" r="110" fill="#FEF2F2" stroke="#EF4444" stroke-width="4" opacity="0.6"/>
  <circle cx="125" cy="66" r="20" fill="#7C2D12"/>
  <path d="M95 92 L155 86 L165 162 L102 165 Z" fill="#1E3A8A" stroke="#F59E0B" stroke-width="3"/>
  <path d="M95 96 L52 38 L68 28 L112 88 Z" fill="#1E3A8A" stroke="#0F172A" stroke-width="2"/>
  <circle cx="55" cy="28" r="13" fill="#DC2626" stroke="#FFFFFF" stroke-width="2"/>
  <path d="M155 92 L208 118 L198 134 L148 110 Z" fill="#1E3A8A" stroke="#0F172A" stroke-width="2"/>
  <path d="M108 162 L75 255 L102 262 L132 172 Z" fill="#F8FAFC" stroke="#1E3A8A" stroke-width="3"/>
  <path d="M142 162 L182 248 L205 238 L165 162 Z" fill="#F8FAFC" stroke="#1E3A8A" stroke-width="3"/>
</svg>
`;

const RIBBON_ORANGE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="110" viewBox="0 0 420 110">
  <polygon points="15,28 55,28 40,58 55,88 15,88 30,58" fill="#C2410C"/>
  <polygon points="405,28 365,28 380,58 365,88 405,88 390,58" fill="#C2410C"/>
  <rect x="42" y="14" width="336" height="66" rx="8" fill="#EA580C" stroke="#FFFBEB" stroke-width="3"/>
  <rect x="50" y="21" width="320" height="52" rx="5" fill="none" stroke="#FDE047" stroke-width="1.5" stroke-dasharray="6 4"/>
</svg>
`;

const SEAL_BADGE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
  <circle cx="110" cy="110" r="96" fill="#0B192C" stroke="#F59E0B" stroke-width="8"/>
  <circle cx="110" cy="110" r="82" fill="none" stroke="#FDE047" stroke-width="2" stroke-dasharray="8 6"/>
  <polygon points="110,38 126,76 168,80 136,108 146,148 110,126 74,148 84,108 52,80 94,76" fill="#F59E0B"/>
  <text x="110" y="180" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="#FFFFFF" text-anchor="middle">OFFICIAL SEAL</text>
</svg>
`;

const JUICER_PRIZE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="260" height="240" viewBox="0 0 260 240">
  <rect x="15" y="15" width="230" height="210" rx="20" fill="#EFF6FF" stroke="#3B82F6" stroke-width="3"/>
  <path d="M55 42 H115 L108 135 H62 Z" fill="#DBEAFE" stroke="#1E40AF" stroke-width="3"/>
  <rect x="50" y="32" width="70" height="12" rx="4" fill="#1E293B"/>
  <path d="M58 135 H112 L120 202 H50 Z" fill="#DC2626" stroke="#7F1D1D" stroke-width="3"/>
  <circle cx="85" cy="168" r="14" fill="#F8FAFC" stroke="#1E293B" stroke-width="3"/>
  <rect x="135" y="95" width="52" height="65" rx="6" fill="#E2E8F0" stroke="#475569" stroke-width="3"/>
  <rect x="132" y="85" width="58" height="12" rx="4" fill="#DC2626"/>
  <rect x="135" y="168" width="90" height="36" rx="6" fill="#16A34A" stroke="#14532D" stroke-width="2.5"/>
  <text x="180" y="192" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="#FFFFFF" text-anchor="middle">₹ CASH</text>
</svg>
`;

const SIGNATURE_SAIF_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120" viewBox="0 0 300 120">
  <path d="M48 82 C25 62, 55 20, 88 26 C112 30, 62 72, 92 82 C115 88, 130 58, 148 56 C162 55, 152 78, 168 76 C182 74, 195 52, 205 52 C215 52, 208 76, 222 72 C238 66, 252 28, 245 18 C238 10, 222 58, 228 98 C232 115, 258 88, 275 68" fill="none" stroke="#0F172A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="204" cy="38" r="3.5" fill="#0F172A"/>
  <path d="M35 96 Q155 82 282 78" fill="none" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round"/>
</svg>
`;

const FIREWORKS_2026_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="140" viewBox="0 0 320 140">
  <rect x="10" y="20" width="300" height="100" rx="18" fill="#0B192C" stroke="#F59E0B" stroke-width="4"/>
  <text x="160" y="88" font-family="Arial, sans-serif" font-weight="900" font-size="56" fill="#FDE047" text-anchor="middle" letter-spacing="4">2026</text>
  <circle cx="48" cy="52" r="8" fill="#EF4444"/>
  <circle cx="272" cy="52" r="8" fill="#3B82F6"/>
  <circle cx="48" cy="92" r="6" fill="#10B981"/>
  <circle cx="272" cy="92" r="6" fill="#F59E0B"/>
</svg>
`;

export const CRICKET_STICKERS: StickerGraphicMeta[] = [
  {
    id: 'jale-logo',
    nameHi: 'जाले क्रिकेट कप लोगो',
    nameEn: 'Jale Cricket Cup Logo',
    svgString: JALE_LOGO_SVG,
    dataUrl: toSvgDataUrl(JALE_LOGO_SVG),
  },
  {
    id: 'trophy-gold',
    nameHi: 'गोल्डन चैंपियन ट्रॉफी',
    nameEn: 'Golden Champion Trophy',
    svgString: TROPHY_GOLD_SVG,
    dataUrl: toSvgDataUrl(TROPHY_GOLD_SVG),
  },
  {
    id: 'stumps-3d',
    nameHi: '3D गोल्डन स्टंप व बैट',
    nameEn: '3D Golden Stumps & Bat',
    svgString: STUMPS_3D_SVG,
    dataUrl: toSvgDataUrl(STUMPS_3D_SVG),
  },
  {
    id: 'cricket-bat-ball',
    nameHi: 'क्रॉस्ड बैट और बॉल',
    nameEn: 'Crossed Bats & Balls',
    svgString: CRICKET_BAT_BALL_SVG,
    dataUrl: toSvgDataUrl(CRICKET_BAT_BALL_SVG),
  },
  {
    id: 'batsman-action',
    nameHi: 'बल्लेबाज (Batsman) एक्शन',
    nameEn: 'Batsman Action Graphic',
    svgString: BATSMAN_ACTION_SVG,
    dataUrl: toSvgDataUrl(BATSMAN_ACTION_SVG),
  },
  {
    id: 'bowler-action',
    nameHi: 'गेंदबाज (Bowler) एक्शन',
    nameEn: 'Bowler Action Graphic',
    svgString: BOWLER_ACTION_SVG,
    dataUrl: toSvgDataUrl(BOWLER_ACTION_SVG),
  },
  {
    id: 'ribbon-orange',
    nameHi: 'आमंत्रण हेडर रिबन',
    nameEn: 'Header Banner Ribbon',
    svgString: RIBBON_ORANGE_SVG,
    dataUrl: toSvgDataUrl(RIBBON_ORANGE_SVG),
  },
  {
    id: 'seal-badge',
    nameHi: 'ऑफिशियल टूर्नामेंट सील',
    nameEn: 'Official Tournament Seal',
    svgString: SEAL_BADGE_SVG,
    dataUrl: toSvgDataUrl(SEAL_BADGE_SVG),
  },
  {
    id: 'juicer-prize',
    nameHi: 'जूसर मशीन + कैश इनाम',
    nameEn: 'Juicer Mixer + Cash Prize',
    svgString: JUICER_PRIZE_SVG,
    dataUrl: toSvgDataUrl(JUICER_PRIZE_SVG),
  },
  {
    id: 'signature-saif',
    nameHi: 'हस्ताक्षर (Saif Signature)',
    nameEn: 'Authorized Signature (Saif)',
    svgString: SIGNATURE_SAIF_SVG,
    dataUrl: toSvgDataUrl(SIGNATURE_SAIF_SVG),
  },
  {
    id: '2026-fireworks',
    nameHi: '2026 फेस्टिव बैज',
    nameEn: '2026 Festive Badge',
    svgString: FIREWORKS_2026_SVG,
    dataUrl: toSvgDataUrl(FIREWORKS_2026_SVG),
  },
];

export function getStickerDataUrl(stickerId: StickerGraphicId): string {
  const found = CRICKET_STICKERS.find((s) => s.id === stickerId);
  return found ? found.dataUrl : CRICKET_STICKERS[0].dataUrl;
}
