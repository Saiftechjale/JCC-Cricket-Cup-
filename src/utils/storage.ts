import {
  DEFAULT_MEDIA_ASSETS,
  DEFAULT_PLAYERS,
  DEFAULT_RESULTS,
  DEFAULT_SCHEDULES,
  DEFAULT_SCORECARDS,
  DEFAULT_TOURNAMENT_PROFILES,
} from '../data/defaultTemplates';
import {
  DesignDocument,
  FullStudioBackup,
  MatchResultRecord,
  MatchScheduleRecord,
  MediaAsset,
  PlayerRecord,
  ScorecardRecord,
  StudioSettings,
  TournamentProfile,
} from '../types/studio';

const DB_NAME = 'jale_cricket_studio_idb_v1';
const DB_VERSION = 1;
const SETTINGS_KEY = 'jale_cricket_studio_settings_v1';

export const DEFAULT_SETTINGS: StudioSettings = {
  language: 'hi',
  darkMode: false,
  autoSave: true,
  defaultExportFormat: 'pdf',
  defaultPageSize: 'A4-Portrait',
  highResExportScale: 2,
  activeProfileId: 'profile-jale-s2',
};

export function loadStudioSettings(): StudioSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStudioSettings(settings: StudioSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}

function openStudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      const stores = [
        'profiles',
        'savedDesigns',
        'customTemplates',
        'players',
        'schedules',
        'results',
        'scorecards',
        'mediaLibrary',
      ];
      stores.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGetAll<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openStudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error(`IndexedDB getAll error (${storeName}):`, err);
    return [];
  }
}

export async function idbSaveAll<T extends { id: string }>(
  storeName: string,
  items: T[]
): Promise<void> {
  try {
    const db = await openStudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      items.forEach((item) => {
        store.put(item);
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error(`IndexedDB saveAll error (${storeName}):`, err);
  }
}

export interface HydratedStudioState {
  settings: StudioSettings;
  profiles: TournamentProfile[];
  savedDesigns: DesignDocument[];
  customTemplates: DesignDocument[];
  players: PlayerRecord[];
  schedules: MatchScheduleRecord[];
  results: MatchResultRecord[];
  scorecards: ScorecardRecord[];
  mediaLibrary: MediaAsset[];
}

export async function hydrateStudioData(): Promise<HydratedStudioState> {
  const settings = loadStudioSettings();
  let profiles = await idbGetAll<TournamentProfile>('profiles');
  if (profiles.length === 0) {
    profiles = DEFAULT_TOURNAMENT_PROFILES;
    await idbSaveAll('profiles', profiles);
  }

  const savedDesigns = await idbGetAll<DesignDocument>('savedDesigns');
  const customTemplates = await idbGetAll<DesignDocument>('customTemplates');

  let players = await idbGetAll<PlayerRecord>('players');
  if (players.length === 0) {
    players = DEFAULT_PLAYERS;
    await idbSaveAll('players', players);
  }

  let schedules = await idbGetAll<MatchScheduleRecord>('schedules');
  if (schedules.length === 0) {
    schedules = DEFAULT_SCHEDULES;
    await idbSaveAll('schedules', schedules);
  }

  let results = await idbGetAll<MatchResultRecord>('results');
  if (results.length === 0) {
    results = DEFAULT_RESULTS;
    await idbSaveAll('results', results);
  }

  let scorecards = await idbGetAll<ScorecardRecord>('scorecards');
  if (scorecards.length === 0) {
    scorecards = DEFAULT_SCORECARDS;
    await idbSaveAll('scorecards', scorecards);
  }

  let mediaLibrary = await idbGetAll<MediaAsset>('mediaLibrary');
  if (mediaLibrary.length === 0) {
    mediaLibrary = DEFAULT_MEDIA_ASSETS;
    await idbSaveAll('mediaLibrary', mediaLibrary);
  }

  return {
    settings,
    profiles,
    savedDesigns,
    customTemplates,
    players,
    schedules,
    results,
    scorecards,
    mediaLibrary,
  };
}

export async function restoreFullBackup(backup: FullStudioBackup): Promise<void> {
  if (backup.settings) saveStudioSettings(backup.settings);
  if (Array.isArray(backup.profiles)) await idbSaveAll('profiles', backup.profiles);
  if (Array.isArray(backup.savedDesigns)) await idbSaveAll('savedDesigns', backup.savedDesigns);
  if (Array.isArray(backup.customTemplates)) await idbSaveAll('customTemplates', backup.customTemplates);
  if (Array.isArray(backup.players)) await idbSaveAll('players', backup.players);
  if (Array.isArray(backup.schedules)) await idbSaveAll('schedules', backup.schedules);
  if (Array.isArray(backup.results)) await idbSaveAll('results', backup.results);
  if (Array.isArray(backup.scorecards)) await idbSaveAll('scorecards', backup.scorecards);
  if (Array.isArray(backup.mediaLibrary)) await idbSaveAll('mediaLibrary', backup.mediaLibrary);
}
