/**
 * 기기에 저장된 게임 데이터를 파일 하나로 내보내고 다시 가져오기 위한 형식과 검사.
 *
 * 가져오기는 남이 만든 파일이나 깨진 파일이 들어올 수 있으므로,
 * 여기서 통과한 것만 앱에 반영합니다. 통과하지 못하면 기존 데이터는 그대로 둡니다.
 */

export const BACKUP_FORMAT = 'world-casino-backup';
export const BACKUP_VERSION = 1;

export type BackupRecord = {
  id: string;
  game: string;
  result: string;
  difficulty: string;
  bet: number;
  net: number;
  playedAt: string;
  detail?: string;
};

export type BackupData = {
  format: typeof BACKUP_FORMAT;
  version: number;
  savedAt: string;
  coins: number;
  totalPlays: number;
  difficulty: string;
  records: BackupRecord[];
  preferences?: unknown;
};

/** 검사 결과. 실패하면 왜 실패했는지 사람이 읽을 문장으로 돌려줍니다. */
export type BackupCheck =
  | { ok: true; data: BackupData; summary: string }
  | { ok: false; reason: string };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const finiteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

function checkRecord(value: unknown): BackupRecord | null {
  if (!isObject(value)) return null;
  if (typeof value.id !== 'string' || typeof value.game !== 'string') return null;
  if (typeof value.result !== 'string' || typeof value.difficulty !== 'string') return null;
  if (!finiteNumber(value.bet) || !finiteNumber(value.net)) return null;
  if (typeof value.playedAt !== 'string' || Number.isNaN(Date.parse(value.playedAt))) return null;
  return {
    id: value.id, game: value.game, result: value.result, difficulty: value.difficulty,
    bet: value.bet, net: value.net, playedAt: value.playedAt,
    detail: typeof value.detail === 'string' ? value.detail : undefined,
  };
}

/** 파일 내용(문자열)을 검사합니다. 앱에 반영하기 전에 반드시 이걸 통과해야 합니다. */
export function checkBackup(text: string): BackupCheck {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: '파일을 읽을 수 없습니다. 이 앱에서 내보낸 파일이 맞는지 확인해 주세요.' };
  }
  if (!isObject(parsed)) return { ok: false, reason: '파일 형식이 올바르지 않습니다.' };
  if (parsed.format !== BACKUP_FORMAT) return { ok: false, reason: '이 앱에서 내보낸 백업 파일이 아닙니다.' };
  if (!finiteNumber(parsed.version) || parsed.version > BACKUP_VERSION) {
    return { ok: false, reason: '더 새로운 버전에서 만든 파일입니다. 앱을 새로고침한 뒤 다시 시도해 주세요.' };
  }
  if (!finiteNumber(parsed.coins) || parsed.coins < 0) return { ok: false, reason: '코인 값이 올바르지 않습니다.' };
  if (!Array.isArray(parsed.records)) return { ok: false, reason: '기록이 들어 있지 않습니다.' };

  const records: BackupRecord[] = [];
  let dropped = 0;
  for (const item of parsed.records) {
    const record = checkRecord(item);
    if (record) records.push(record); else dropped += 1;
  }
  // 기록이 통째로 깨진 파일은 되돌리기 어려우니 아예 막습니다.
  if (parsed.records.length > 0 && records.length === 0) {
    return { ok: false, reason: '기록을 하나도 읽지 못했습니다. 파일이 손상된 것 같습니다.' };
  }

  const totalPlays = finiteNumber(parsed.totalPlays) && parsed.totalPlays >= 0
    ? Math.floor(parsed.totalPlays)
    : records.length;

  const data: BackupData = {
    format: BACKUP_FORMAT,
    version: parsed.version,
    savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date(0).toISOString(),
    coins: Math.floor(parsed.coins),
    totalPlays,
    difficulty: typeof parsed.difficulty === 'string' ? parsed.difficulty : '보통',
    records: records.slice(0, 100),
    preferences: isObject(parsed.preferences) ? parsed.preferences : undefined,
  };

  const parts = [
    `코인 ${data.coins.toLocaleString()} WC`,
    `누적 ${data.totalPlays.toLocaleString()}판`,
    `기록 ${data.records.length}건`,
  ];
  if (dropped > 0) parts.push(`읽지 못한 기록 ${dropped}건은 건너뜁니다`);
  return { ok: true, data, summary: parts.join(' · ') };
}

/** 내보낼 내용을 만듭니다. */
export function buildBackup(input: {
  coins: number; totalPlays: number; difficulty: string;
  records: BackupRecord[]; preferences?: unknown; savedAt: string;
}): BackupData {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    savedAt: input.savedAt,
    coins: input.coins,
    totalPlays: input.totalPlays,
    difficulty: input.difficulty,
    records: input.records,
    preferences: input.preferences,
  };
}

/** 파일 이름. 날짜를 넣어 여러 번 내보내도 덮어쓰지 않게 합니다. */
export const backupFileName = (savedAt: string) =>
  `world-casino-${savedAt.slice(0, 10)}.json`;
