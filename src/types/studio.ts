export type Language = 'hi' | 'en';

export type WorkspaceSection =
  | 'dashboard'
  | 'fb-live-studio'
  | 'tournament-profile'
  | 'poster-maker'
  | 'invitation-maker'
  | 'player-list-maker'
  | 'rules-maker'
  | 'prize-maker'
  | 'certificate-maker'
  | 'voucher-maker'
  | 'schedule-maker'
  | 'result-maker'
  | 'scorecard-maker'
  | 'letter-maker'
  | 'template-library'
  | 'saved-designs'
  | 'media-library'
  | 'backup-restore'
  | 'settings';

export type BroadcastScreenMode =
  | 'score-ticker'       // Clean non-overlapping bottom TV bar (85% camera area clear)
  | 'squad-team-a'       // Show Batting Team 15-Player List on screen
  | 'squad-team-b'       // Show Bowling Team 15-Player List on screen
  | 'squad-vs-both'      // Show Both Teams (Team A vs Team B) Playing XI + Extra side-by-side
  | 'full-sponsor-ad'    // Full-screen Local Market Sponsor Ad during Over/Drinks break
  | 'match-summary';     // Match Toss / Target / Need X runs in Y balls card

export type BroadcastCelebrationType =
  | 'none'
  | 'FOUR'
  | 'SIX'
  | 'WICKET'
  | 'FIFTY'
  | 'WIN';

export interface LiveBroadcastRoomState {
  roomId: string;
  tournamentName: string;
  seasonNumber: string;
  venue: string;
  matchStage: string;
  battingTeamId: string;
  battingTeamName: string;
  bowlingTeamId: string;
  bowlingTeamName: string;
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  totalMatchOvers: number;
  targetRuns: number; // 0 if 1st innings
  tossOrStatusNote: string;
  strikerName: string;
  strikerRuns: number;
  strikerBalls: number;
  nonStrikerName: string;
  nonStrikerRuns: number;
  nonStrikerBalls: number;
  bowlerName: string;
  bowlerWickets: number;
  bowlerRuns: number;
  bowlerOvers: string;
  thisOverBalls: string[]; // e.g. ['1', '4', '0', '6', 'W']
  screenMode: BroadcastScreenMode;
  celebration: BroadcastCelebrationType;
  celebrationText: string;
  celebrationTimestamp: number;
  activeSponsorIndex: number;
  autoRotateAds: boolean;
  autoRotateSeconds: number;
  showScoreboard: boolean;
  showSponsorTicker: boolean;
  showTopBadge: boolean;
  customTickerMessage: string;
  teamAPlayers: string[];
  teamBPlayers: string[];
  sponsorsList: {
    id: string;
    shopName: string;
    ownerName: string;
    address: string;
    mobile: string;
    tagline: string;
  }[];
  updatedAt: number;
}

export type TemplateCategory =
  | 'poster'
  | 'invitation'
  | 'player-list'
  | 'rules'
  | 'prize'
  | 'certificate'
  | 'voucher'
  | 'schedule'
  | 'result'
  | 'scorecard'
  | 'letter';

export type VisualThemeId =
  | 'blue-sports'
  | 'black-gold'
  | 'red-black'
  | 'cricket-stadium'
  | 'premium-royal'
  | 'minimal-white';

export interface TournamentProfile {
  id: string;
  tournamentName: string;
  tournamentNameEn: string;
  seasonNumber: string;
  tournamentLogo: string;
  startingDate: string;
  finalDate: string;
  matchTime: string;
  venue: string;
  organizerName: string;
  presidentName: string;
  secretaryName: string;
  chiefGuest: string;
  specialGuest: string;
  contactNumber: string;
  entryFee: string;
  winnerPrize: string;
  runnerUpPrize: string;
  thirdPlacePrize: string;
  manOfTheMatchPrize: string;
  manOfTheSeriesPrize: string;
  bestBatsmanPrize: string;
  bestBowlerPrize: string;
  centuryPrize: string;
  totalTeams: string;
  oversPerMatch: string;
  signatureImage: string;
  updatedAt: string;
}

export type StickerGraphicId =
  | 'jale-logo'
  | 'trophy-gold'
  | 'stumps-3d'
  | 'cricket-bat-ball'
  | 'batsman-action'
  | 'bowler-action'
  | 'ribbon-orange'
  | 'seal-badge'
  | 'juicer-prize'
  | 'signature-saif'
  | '2026-fireworks';

export type ElementType =
  | 'heading'
  | 'subheading'
  | 'title'
  | 'body'
  | 'rect'
  | 'circle'
  | 'pill'
  | 'line'
  | 'image'
  | 'sticker'
  | 'table';

export interface CanvasElement {
  id: string;
  type: ElementType;
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  // Text properties
  text?: string;
  bindField?: keyof TournamentProfile;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  letterSpacing?: number;
  lineHeight?: number;
  // Box / Shape properties
  backgroundColor?: string;
  backgroundGradient?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'double';
  borderRadius?: number;
  shadowColor?: string;
  shadowBlur?: number;
  padding?: number;
  // Media / Sticker / Table properties
  imageUrl?: string;
  stickerId?: StickerGraphicId;
  tableHeaders?: string[];
  tableRows?: string[][];
  headerBgColor?: string;
  headerTextColor?: string;
}

export interface DesignDocument {
  id: string;
  name: string;
  nameHi: string;
  category: TemplateCategory;
  theme: VisualThemeId;
  width: number;
  height: number;
  backgroundColor: string;
  backgroundGradient?: string;
  borderFrameColor?: string;
  borderFrameWidth?: number;
  innerBorderColor?: string;
  elements: CanvasElement[];
  updatedAt: string;
  version: number;
  isTemplate?: boolean;
  isCustomTemplate?: boolean;
  description?: string;
}

/**
 * 8-Team Tournament Roster: Each team has a name, village/place, captain/mobile,
 * and 15 player names (1-11 Playing XI + 12-15 Extra Players)
 */
export interface TeamSquadRecord {
  id: string;
  teamNumber: number; // 1 to 8
  teamName: string;
  village: string;
  captainName: string;
  mobileNumber: string;
  players: string[]; // Array of 15 player names
  updatedAt: string;
}

export interface LocalSponsorAd {
  id: string;
  shopName: string;
  ownerName: string;
  category?: string;
  address: string;
  mobile: string;
  tagline: string;
  micScript: string;
}

export interface PlayerRecord {
  id: string;
  playerName: string;
  fatherName: string;
  mobileNumber: string;
  teamName: string;
  village: string;
  jerseyNumber: string;
  role: 'Captain (C)' | 'Vice-Captain (VC)' | 'Wicket-Keeper (WK)' | 'Batsman' | 'Bowler' | 'All-Rounder';
  registrationStatus: 'Paid' | 'Pending' | 'Verified';
  entryFeePaid?: string;
  createdAt: string;
}

export interface MatchScheduleRecord {
  id: string;
  matchNumber: number;
  stage: 'Quarter Final 1' | 'Quarter Final 2' | 'Quarter Final 3' | 'Quarter Final 4' | 'Semi Final 1' | 'Semi Final 2' | 'Grand Final' | 'League Match' | 'Quarter Final' | 'Semi Final';
  teamA: string;
  teamB: string;
  matchDate: string;
  matchTime: string;
  venue: string;
  umpireName?: string;
  status: 'Upcoming' | 'Live' | 'Completed';
}

export interface MatchResultRecord {
  id: string;
  matchNumber: number;
  stage: string;
  matchDate: string;
  teamA: string;
  teamAScore: string;
  teamAWickets: string;
  teamAOvers: string;
  teamB: string;
  teamBScore: string;
  teamBWickets: string;
  teamBOvers: string;
  winner: string;
  winMargin: string;
  playerOfTheMatch: string;
  playerOfTheMatchStats: string;
  venue: string;
}

export interface BatsmanScoreRow {
  id: string;
  name: string;
  dismissal: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
}

export interface BowlerScoreRow {
  id: string;
  name: string;
  overs: string;
  maidens: number;
  runsConceded: number;
  wickets: number;
}

export interface ScorecardRecord {
  id: string;
  matchNumber: number;
  matchTitle: string;
  matchDate: string;
  venue: string;
  battingTeam: string;
  bowlingTeam: string;
  batsmen: BatsmanScoreRow[];
  bowlers: BowlerScoreRow[];
  extras: number;
  totalWickets: number;
  totalOvers: string;
  resultNote: string;
  manOfTheMatch: string;
}

export type MediaCategory =
  | 'Tournament Logo'
  | 'Sponsor Logo'
  | 'Organizer Photo'
  | 'Guest Photo'
  | 'Player Photo'
  | 'Cricket Images'
  | 'Background Images'
  | 'Signature Images';

export interface MediaAsset {
  id: string;
  name: string;
  category: MediaCategory;
  dataUrl: string;
  createdAt: string;
}

export interface StudioSettings {
  language: Language;
  darkMode: boolean;
  autoSave: boolean;
  defaultExportFormat: 'pdf' | 'png' | 'jpg';
  defaultPageSize: 'A4-Portrait' | 'A4-Landscape' | 'A5' | 'Social-4:5' | 'Social-1:1';
  highResExportScale: 2 | 3;
  activeProfileId: string;
}

export interface FullStudioBackup {
  appVersion: string;
  exportedAt: string;
  settings: StudioSettings;
  profiles: TournamentProfile[];
  savedDesigns: DesignDocument[];
  customTemplates: DesignDocument[];
  players: PlayerRecord[];
  teams?: TeamSquadRecord[];
  sponsors?: LocalSponsorAd[];
  schedules: MatchScheduleRecord[];
  results: MatchResultRecord[];
  scorecards: ScorecardRecord[];
  mediaLibrary: MediaAsset[];
}
