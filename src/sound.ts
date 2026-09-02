/**
 * 게임 소리.
 *
 * ⚠️ **소리 파일을 안 씁니다.** 브라우저가 그 자리에서 만들어 냅니다(Web Audio).
 * mp3를 넣으면 파일이 커지고, 카드 한 장 놓는 소리 하나에 몇십 KB를 첫 화면에서
 * 내려받아야 합니다. 여기 있는 것은 **어떤 음을 언제 얼마나 낼지 적은 표**뿐입니다.
 *
 * 소리 하나는 `Tone` 몇 개가 겹친 것입니다.
 *   - `wave: 'noise'`는 음이 없는 잡음입니다. 카드 스치는 소리·칩 부딪는 소리에 씁니다
 *   - 나머지는 음높이가 있는 소리입니다. 이길 때 올라가고 질 때 내려갑니다
 */

export type SoundCue = 'card' | 'chip' | 'flip' | 'roll' | 'win' | 'lose';

export type Tone = {
  /** 소리결. noise는 음높이가 없는 잡음입니다. */
  wave: 'sine' | 'triangle' | 'square' | 'noise';
  /** 음높이(Hz). noise면 걸러 낼 가운데 주파수로 씁니다. */
  freq: number;
  /** 시작하고 몇 초 뒤에 낼지. */
  at: number;
  /** 얼마나 이어질지(초). */
  dur: number;
  /** 크기(0~1). 다 합쳐도 1을 넘지 않게 둡니다. */
  gain: number;
};

/**
 * 소리마다 무엇을 낼지.
 *
 * ⚠️ **전부 0.6초 안에 끝납니다.** 카드가 한 장씩 빠르게 놓일 때 소리가 겹쳐 쌓이면
 * 지직거립니다. 이길 때·질 때만 조금 깁니다 — 그때는 겹칠 일이 없습니다.
 */
export const soundCues: Record<SoundCue, Tone[]> = {
  // 카드가 천에 스치는 소리. 짧고 바람 소리에 가깝습니다.
  card: [{ wave: 'noise', freq: 2600, at: 0, dur: 0.07, gain: 0.16 }],
  // 칩 두 개가 부딪는 소리. 잡음 위에 높은 음을 살짝 얹습니다.
  chip: [
    { wave: 'noise', freq: 4200, at: 0, dur: 0.05, gain: 0.2 },
    { wave: 'triangle', freq: 2100, at: 0.01, dur: 0.06, gain: 0.1 },
  ],
  // 카드를 뒤집는 소리. 카드보다 조금 낮고 짧습니다.
  flip: [{ wave: 'noise', freq: 1700, at: 0, dur: 0.09, gain: 0.18 }],
  // 주사위·윷이 구르는 소리. 잡음을 네 번 끊어 냅니다.
  roll: [
    { wave: 'noise', freq: 1200, at: 0, dur: 0.05, gain: 0.18 },
    { wave: 'noise', freq: 900, at: 0.08, dur: 0.05, gain: 0.16 },
    { wave: 'noise', freq: 1400, at: 0.17, dur: 0.05, gain: 0.14 },
    { wave: 'noise', freq: 1000, at: 0.27, dur: 0.06, gain: 0.12 },
  ],
  // 이길 때. 도 · 미 · 솔로 올라갑니다.
  win: [
    { wave: 'triangle', freq: 523.25, at: 0, dur: 0.12, gain: 0.16 },
    { wave: 'triangle', freq: 659.25, at: 0.1, dur: 0.12, gain: 0.16 },
    { wave: 'triangle', freq: 783.99, at: 0.2, dur: 0.26, gain: 0.18 },
  ],
  // 질 때. 두 음으로 내려갑니다. 이길 때보다 작게 냅니다 — 지는 소리가 크면 짜증납니다.
  lose: [
    { wave: 'sine', freq: 330, at: 0, dur: 0.14, gain: 0.12 },
    { wave: 'sine', freq: 247, at: 0.13, dur: 0.24, gain: 0.12 },
  ],
};

/** 소리 하나가 다 끝나는 데 걸리는 시간(초). */
export const cueLength = (cue: SoundCue) =>
  soundCues[cue].reduce((longest, tone) => Math.max(longest, tone.at + tone.dur), 0);

/** 진동 길이(ms). 소리를 낼 수 없는 자리(아이폰 사파리)에서도 이건 됩니다. */
export const vibrationFor: Partial<Record<SoundCue, number>> = {
  win: 40,
  lose: 18,
  chip: 8,
};
