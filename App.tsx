import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

const casinoEntranceAsset = require('./assets/casino-entrance-gold-v1.png');
const casinoEntranceSource = Platform.OS === 'web'
  ? { uri: './casino-entrance-gold-v1.png' }
  : casinoEntranceAsset;
import {
  createDeck,
  canSplit,
  dealInitialRound,
  drawCard,
  handValue,
  insurancePayout,
  insuranceStake,
  isBlackjack,
  netForResult,
  payoutForResult,
  playDealer,
  resolveRound,
  shuffleDeck,
  type Card,
  type RoundResult,
} from './src/blackjack';
import {
  rouletteBetWins,
  rouletteColor,
  rouletteNet,
  roulettePayout,
  spinRoulette,
  type RouletteBet,
} from './src/roulette';
import {
  baccaratNet,
  baccaratPayout,
  baccaratScore,
  dealBaccaratRound,
  type BaccaratBet,
  type BaccaratWinner,
} from './src/baccarat';
import { crapsNet, crapsPayout, resolveCrapsRoll, rollDice, type CrapsBet, type CrapsRollResult } from './src/craps';
import { evaluatePachislot, pachislotSymbols, spinPachislotReels, spinSlot, type PachislotResult, type PachislotSymbol, type SlotResult, type SlotSymbol } from './src/slot';
import { rollSicBo, sicBoBetLabel, sicBoNet, sicBoPayout, type SicBoBet, type SicBoDice } from './src/sicbo';
import { dealVideoPoker, evaluateVideoPoker, exchangeVideoPoker, videoPokerNet, videoPokerPayout } from './src/videopoker';
import { dealHoldem, dealOmaha, madeHandCards, resolveHoldem, resolveOmaha } from './src/texasholdem';
import { dealSevenPoker, resolveSevenPoker } from './src/sevenpoker';
import { dealFiveCardDraw, exchangeDrawCards, opponentKeepCards, resolveFiveCardDraw } from './src/fivecarddraw';

type Tab = '홈' | '게임' | '지갑' | '기록' | '설정';
type AppScreen = 'tabs' | 'categoryCatalog' | 'gamePreview' | 'blackjackSetup' | 'blackjackGame' | 'rouletteGame' | 'baccaratSetup' | 'baccaratGame' | 'crapsSetup' | 'crapsGame' | 'slotSetup' | 'slotGame' | 'pachislotGame' | 'sicboSetup' | 'sicboGame' | 'videoPokerGame' | 'holdemSetup' | 'holdemGame' | 'omahaSetup' | 'omahaGame' | 'sevenPokerSetup' | 'sevenPokerGame' | 'fiveDrawSetup' | 'fiveDrawGame';

type CatalogGame = { name: string; icon: string; description: string; status: 'playable' | 'planned' };
type GameCategory = { name: string; icon: string; detail: string; eyebrow: string; games: CatalogGame[] };

type GameRecord = {
  id: string;
  game: '블랙잭' | '룰렛' | '바카라' | '크랩스' | '슬롯' | '식보' | '비디오 포커' | '텍사스 홀덤' | '오마하' | '세븐 포커' | '파이브 카드 드로우';
  result: RoundResult;
  difficulty: string;
  bet: number;
  net: number;
  playedAt: string;
  detail?: string;
};

const difficultyOptions = [
  { name: '입문', min: 10, max: 100, bets: [10, 25, 50, 100] },
  { name: '쉬움', min: 50, max: 500, bets: [50, 100, 250, 500] },
  { name: '보통', min: 100, max: 2000, bets: [100, 500, 1000, 2000] },
  { name: '어려움', min: 500, max: 10000, bets: [500, 1000, 5000, 10000] },
  { name: '전문가', min: 1000, max: 50000, bets: [1000, 5000, 10000, 50000] },
];

const betTierNames: Record<string, string> = { '입문': '라이트', '쉬움': '스탠더드', '보통': '프리미엄', '어려움': '하이롤러', '전문가': 'VIP' };
const betTierName = (value: string) => betTierNames[value] ?? value;
const englishGameNames: Record<string, string> = {
  '블랙잭': 'Blackjack', '바카라': 'Baccarat', '룰렛': 'Roulette', '크랩스': 'Craps', '슬롯': 'Slot',
  '텍사스 홀덤': 'Texas Hold’em', '오마하': 'Omaha', '세븐 포커': 'Seven-card Poker',
  '파이브 카드 드로우': 'Five-card Draw', '비디오 포커': 'Video Poker', '하이로우': 'High–Low',
};
const chineseGameNames: Record<string, string> = { '식보': '骰寶, Sic Bo', '파이 고우': '牌九, Pai Gow' };
const gameDisplayName = (name: string) => chineseGameNames[name] ? `${name}(${chineseGameNames[name]})` : englishGameNames[name] ? `${name}(${englishGameNames[name]})` : name;

const gameCategories: GameCategory[] = [
  { name: '한국 전통', icon: '花', detail: '고스톱 · 맞고 · 섰다', eyebrow: 'KOREAN CLASSICS', games: [
    { name: '고스톱', icon: '花', description: '화투패를 모아 점수를 겨루는 대표 게임', status: 'planned' },
    { name: '맞고', icon: '二', description: '두 명이 빠르게 즐기는 고스톱', status: 'planned' },
    { name: '섰다', icon: '光', description: '두 장의 화투 조합으로 승부', status: 'planned' },
    { name: '도리짓고땡', icon: '十', description: '패를 나누어 두 조합을 완성', status: 'planned' },
    { name: '민화투', icon: '月', description: '그림과 띠를 모으는 전통 화투', status: 'planned' },
    { name: '육백', icon: '六', description: '화투 점수를 누적하는 팀 게임', status: 'planned' },
  ]},
  { name: '카지노', icon: '◆', detail: '블랙잭 · 룰렛 · 바카라', eyebrow: 'CASINO GAMES', games: [
    { name: '블랙잭', icon: 'A♠', description: '카드 합계 21에 도전하는 테이블 게임', status: 'playable' },
    { name: '바카라', icon: '◆', description: '플레이어와 뱅커 중 승리할 쪽을 선택', status: 'playable' },
    { name: '룰렛', icon: '◎', description: '숫자와 색상에 코인을 거는 휠 게임', status: 'playable' },
    { name: '크랩스', icon: '⚄', description: '두 개의 주사위 결과를 예측하는 게임', status: 'playable' },
    { name: '식보', icon: '⚂', description: '세 개의 주사위 조합을 예측하는 게임', status: 'playable' },
    { name: '슬롯', icon: '7', description: '같은 그림과 연속 보너스를 노리는 머신 게임', status: 'playable' },
  ]},
  { name: '포커·카드', icon: '♠', detail: '홀덤 · 오마하 · 포커', eyebrow: 'POKER & CARDS', games: [
    { name: '텍사스 홀덤', icon: 'H', description: '공용 카드 다섯 장으로 만드는 포커', status: 'playable' },
    { name: '오마하', icon: 'O', description: '네 장의 개인 카드를 받는 포커', status: 'playable' },
    { name: '세븐 포커', icon: '7♠', description: '공개·비공개 카드 일곱 장 중 최고의 다섯 장으로 승부', status: 'playable' },
    { name: '파이브 카드 드로우', icon: '5', description: '원하는 카드를 보관하고 한 번 교환해 족보를 완성', status: 'playable' },
    { name: '비디오 포커', icon: 'VP', description: '다섯 장 중 필요한 카드를 보관하고 교환', status: 'playable' },
    { name: '하이로우', icon: '↕', description: '높은 패와 낮은 패를 함께 겨루기', status: 'planned' },
  ]},
  { name: '마작', icon: '發', detail: '리치 · 중국식 마작', eyebrow: 'MAHJONG', games: [
    { name: '리치 마작', icon: '立', description: '일본식 규칙과 역으로 즐기는 마작', status: 'planned' },
    { name: '중국식 마작', icon: '中', description: '중국 표준 규칙 기반 마작', status: 'planned' },
    { name: '홍콩 마작', icon: '港', description: '빠르고 직관적인 홍콩식 규칙', status: 'planned' },
    { name: '사천 마작', icon: '川', description: '지역 특색을 살린 사천식 마작', status: 'planned' },
  ]},
  { name: '레이싱', icon: '⚑', detail: '경마 · 경륜 · 경정', eyebrow: 'RACING', games: [
    { name: '경마', icon: '馬', description: '말과 기수의 순위를 예측', status: 'planned' },
    { name: '경륜', icon: '輪', description: '자전거 선수의 결승 순위를 예측', status: 'planned' },
    { name: '경정', icon: '艇', description: '보트 레이스의 결과를 예측', status: 'planned' },
    { name: '그레이하운드', icon: '犬', description: '견공 레이스 순위를 예측', status: 'planned' },
  ]},
  { name: '세계 게임', icon: '◎', detail: '세계 전통 · 주사위 · 복권', eyebrow: 'WORLD GAMES', games: [
    { name: '식보', icon: '⚂', description: '동아시아의 세 주사위 게임', status: 'playable' },
    { name: '파이 고우', icon: '牌', description: '중국 전통 도미노 조합 게임', status: 'planned' },
    { name: '틴 파티', icon: '十', description: '인도권에서 사랑받는 카드 게임', status: 'planned' },
    { name: '로또', icon: '⑥', description: '번호 여섯 개를 선택하는 추첨 게임', status: 'planned' },
    { name: '즉석 복권', icon: '票', description: '바로 결과를 확인하는 가상 복권', status: 'planned' },
    { name: '홀짝', icon: '±', description: '숫자의 홀수와 짝수를 예측', status: 'planned' },
  ]},
];

const europeanWheelOrder = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

const STORAGE_KEYS = {
  coins: 'world-casino.coins',
  difficulty: 'world-casino.difficulty',
  records: 'world-casino.records',
  testGrant: 'world-casino.test-grant-100k-v1',
};

const tabs: { name: Tab; icon: string }[] = [
  { name: '홈', icon: '⌂' },
  { name: '게임', icon: '♠' },
  { name: '지갑', icon: '◈' },
  { name: '기록', icon: '▥' },
  { name: '설정', icon: '⚙' },
];

const categories = gameCategories.map(({ name, icon, detail }) => ({ name, icon, detail }));

const categoryResults = [
  ['카지노', '+1,800 WC', true],
  ['한국 전통', '+900 WC', true],
  ['포커·카드', '+300 WC', true],
  ['마작', '-150 WC', false],
  ['레이싱', '-400 WC', false],
  ['세계 게임', '0 WC', true],
] as const;

export default function App() {
  const [entered, setEntered] = useState(false);
  const [tab, setTab] = useState<Tab>('홈');
  const [appScreen, setAppScreen] = useState<AppScreen>('tabs');
  const [coins, setCoins] = useState(10000);
  const [difficulty, setDifficulty] = useState('보통');
  const [selectedBet, setSelectedBet] = useState(500);
  const [gameRoundId, setGameRoundId] = useState(0);
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>(gameCategories[1]);
  const [selectedCatalogGame, setSelectedCatalogGame] = useState<CatalogGame>(gameCategories[1].games[0]);
  const [slotMode, setSlotMode] = useState<'classic' | 'pachislot'>('classic');

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.coins),
      AsyncStorage.getItem(STORAGE_KEYS.difficulty),
      AsyncStorage.getItem(STORAGE_KEYS.records),
      AsyncStorage.getItem(STORAGE_KEYS.testGrant),
    ]).then(([savedCoins, savedDifficulty, savedRecords, testGrant]) => {
      if (!testGrant) {
        const refilledCoins = Math.max(Number(savedCoins ?? 0), 100000);
        setCoins(refilledCoins);
        AsyncStorage.setItem(STORAGE_KEYS.coins, String(refilledCoins));
        AsyncStorage.setItem(STORAGE_KEYS.testGrant, 'done');
      } else if (savedCoins) {
        setCoins(Number(savedCoins));
      } else {
        setCoins(100000);
        AsyncStorage.setItem(STORAGE_KEYS.coins, '100000');
      }
      if (savedDifficulty) setDifficulty(savedDifficulty);
      if (savedRecords) setRecords(JSON.parse(savedRecords));
      setLoaded(true);
    });
  }, []);

  const saveDifficulty = async (value: string) => {
    setDifficulty(value);
    const option = difficultyOptions.find((item) => item.name === value);
    if (option) setSelectedBet(option.bets[Math.min(1, option.bets.length - 1)]);
    await AsyncStorage.setItem(STORAGE_KEYS.difficulty, value);
  };

  const refillTestCoins = () => {
    setCoins(100000);
    AsyncStorage.setItem(STORAGE_KEYS.coins, '100000');
  };

  const startBlackjack = async () => {
    if (selectedBet > coins) return;
    const nextCoins = coins - selectedBet;
    setCoins(nextCoins);
    await AsyncStorage.setItem(STORAGE_KEYS.coins, String(nextCoins));
    setGameRoundId((value) => value + 1);
    setAppScreen('blackjackGame');
  };

  const doubleBlackjack = () => {
    if (selectedBet > coins) return false;
    const nextCoins = coins - selectedBet;
    setCoins(nextCoins);
    AsyncStorage.setItem(STORAGE_KEYS.coins, String(nextCoins));
    return true;
  };

  const placeInsurance = (stake: number) => {
    if (stake > coins) return false;
    setCoins((currentCoins) => {
      const nextCoins = currentCoins - stake;
      AsyncStorage.setItem(STORAGE_KEYS.coins, String(nextCoins));
      return nextCoins;
    });
    return true;
  };

  const settleInsurance = (won: boolean, stake: number) => {
    const payout = insurancePayout(stake, won);
    if (payout > 0) {
      setCoins((currentCoins) => {
        const nextCoins = currentCoins + payout;
        AsyncStorage.setItem(STORAGE_KEYS.coins, String(nextCoins));
        return nextCoins;
      });
    }
  };

  const settleBlackjack = (result: RoundResult, roundBet = selectedBet) => {
    const payout = payoutForResult(roundBet, result);
    setCoins((currentCoins) => {
      const nextCoins = currentCoins + payout;
      AsyncStorage.setItem(STORAGE_KEYS.coins, String(nextCoins));
      return nextCoins;
    });

    setRecords((currentRecords) => {
      const record: GameRecord = {
        id: `${Date.now()}-${gameRoundId}-${currentRecords.length}`,
        game: '블랙잭',
        result,
        difficulty,
        bet: roundBet,
        net: netForResult(roundBet, result),
        playedAt: new Date().toISOString(),
      };
      const nextRecords = [record, ...currentRecords].slice(0, 100);
      AsyncStorage.setItem(STORAGE_KEYS.records, JSON.stringify(nextRecords));
      return nextRecords;
    });
  };

  const placeRouletteBet = (stake: number) => {
    if (stake > coins) return false;
    const nextCoins = coins - stake;
    setCoins(nextCoins);
    AsyncStorage.setItem(STORAGE_KEYS.coins, String(nextCoins));
    return true;
  };

  const settleRoulette = (bet: RouletteBet, stake: number, number: number, label: string) => {
    const payout = roulettePayout(bet, stake, number);
    const won = rouletteBetWins(bet, number);
    if (payout > 0) {
      setCoins((currentCoins) => {
        const nextCoins = currentCoins + payout;
        AsyncStorage.setItem(STORAGE_KEYS.coins, String(nextCoins));
        return nextCoins;
      });
    }
    setRecords((currentRecords) => {
      const record: GameRecord = {
        id: `${Date.now()}-roulette-${currentRecords.length}`,
        game: '룰렛',
        result: won ? 'win' : 'loss',
        difficulty,
        bet: stake,
        net: rouletteNet(bet, stake, number),
        playedAt: new Date().toISOString(),
        detail: `${label} · 결과 ${number}`,
      };
      const nextRecords = [record, ...currentRecords].slice(0, 100);
      AsyncStorage.setItem(STORAGE_KEYS.records, JSON.stringify(nextRecords));
      return nextRecords;
    });
  };

  const settleBaccarat = (bet: BaccaratBet, stake: number, winner: BaccaratWinner) => {
    const payout = baccaratPayout(bet, stake, winner);
    const net = baccaratNet(bet, stake, winner);
    if (payout > 0) {
      setCoins((currentCoins) => {
        const nextCoins = currentCoins + payout;
        AsyncStorage.setItem(STORAGE_KEYS.coins, String(nextCoins));
        return nextCoins;
      });
    }
    const labels = { player: '플레이어', banker: '뱅커', tie: '타이' } as const;
    setRecords((currentRecords) => {
      const record: GameRecord = {
        id: `${Date.now()}-baccarat-${currentRecords.length}`,
        game: '바카라',
        result: net > 0 ? 'win' : net < 0 ? 'loss' : 'push',
        difficulty,
        bet: stake,
        net,
        playedAt: new Date().toISOString(),
        detail: `${labels[bet]} 베팅 · ${labels[winner]} 승리`,
      };
      const nextRecords = [record, ...currentRecords].slice(0, 100);
      AsyncStorage.setItem(STORAGE_KEYS.records, JSON.stringify(nextRecords));
      return nextRecords;
    });
  };

  const settleCraps = (bet: CrapsBet, stake: number, result: CrapsRollResult) => {
    const payout = crapsPayout(bet, stake, result);
    const net = crapsNet(bet, stake, result);
    if (payout > 0) setCoins((current) => { const next = current + payout; AsyncStorage.setItem(STORAGE_KEYS.coins, String(next)); return next; });
    const names = { pass: '패스 라인', dontPass: '돈트 패스', field: '필드' } as const;
    setRecords((current) => {
      const record: GameRecord = { id: `${Date.now()}-craps-${current.length}`, game: '크랩스', result: net > 0 ? 'win' : net < 0 ? 'loss' : 'push', difficulty, bet: stake, net, playedAt: new Date().toISOString(), detail: `${names[bet]} · 주사위 합 ${result.total}` };
      const next = [record, ...current].slice(0, 100); AsyncStorage.setItem(STORAGE_KEYS.records, JSON.stringify(next)); return next;
    });
  };

  const settleSlot = (stake: number, result: SlotResult, usedFreeSpin: boolean) => {
    if (result.payout > 0) setCoins((current) => { const next = current + result.payout; AsyncStorage.setItem(STORAGE_KEYS.coins, String(next)); return next; });
    const net = result.payout - (usedFreeSpin ? 0 : stake);
    setRecords((current) => {
      const record: GameRecord = { id: `${Date.now()}-slot-${current.length}`, game: '슬롯', result: net > 0 ? 'win' : net < 0 ? 'loss' : 'push', difficulty, bet: usedFreeSpin ? 0 : stake, net, playedAt: new Date().toISOString(), detail: `${result.reels.join(' ')} · ${result.label}` };
      const next = [record, ...current].slice(0, 100); AsyncStorage.setItem(STORAGE_KEYS.records, JSON.stringify(next)); return next;
    });
  };

  const settlePachislot = (stake: number, result: PachislotResult, usedFreeGame: boolean) => {
    if (result.payout > 0) setCoins((current) => { const next = current + result.payout; AsyncStorage.setItem(STORAGE_KEYS.coins, String(next)); return next; });
    const net = result.payout - (usedFreeGame ? 0 : stake);
    setRecords((current) => { const record: GameRecord = { id: `${Date.now()}-pachislot-${current.length}`, game: '슬롯', result: net > 0 ? 'win' : net < 0 ? 'loss' : 'push', difficulty, bet: usedFreeGame ? 0 : stake, net, playedAt: new Date().toISOString(), detail: `파치슬롯 · ${result.reels.join(' ')} · ${result.label}` }; const next = [record, ...current].slice(0, 100); AsyncStorage.setItem(STORAGE_KEYS.records, JSON.stringify(next)); return next; });
  };

  const settleSicBo = (bet: SicBoBet, stake: number, dice: SicBoDice) => {
    const payout = sicBoPayout(bet, stake, dice); const net = sicBoNet(bet, stake, dice);
    if (payout > 0) setCoins((current) => { const next = current + payout; AsyncStorage.setItem(STORAGE_KEYS.coins, String(next)); return next; });
    setRecords((current) => { const record: GameRecord = { id: `${Date.now()}-sicbo-${current.length}`, game: '식보', result: net > 0 ? 'win' : 'loss', difficulty, bet: stake, net, playedAt: new Date().toISOString(), detail: `${sicBoBetLabel(bet)} · ${dice.join('·')} · 합계 ${dice[0] + dice[1] + dice[2]}` }; const next = [record, ...current].slice(0, 100); AsyncStorage.setItem(STORAGE_KEYS.records, JSON.stringify(next)); return next; });
  };

  const settleVideoPoker = (stake: number, hand: Card[]) => {
    const result = evaluateVideoPoker(hand); const payout = videoPokerPayout(stake, hand); const net = videoPokerNet(stake, hand);
    if (payout > 0) setCoins((current) => { const next = current + payout; AsyncStorage.setItem(STORAGE_KEYS.coins, String(next)); return next; });
    setRecords((current) => { const record: GameRecord = { id: `${Date.now()}-video-poker-${current.length}`, game: '비디오 포커', result: net > 0 ? 'win' : net < 0 ? 'loss' : 'push', difficulty, bet: stake, net, playedAt: new Date().toISOString(), detail: `${result.label} · ${hand.map((card) => `${card.rank}${card.suit}`).join(' ')}` }; const next = [record, ...current].slice(0, 100); AsyncStorage.setItem(STORAGE_KEYS.records, JSON.stringify(next)); return next; });
  };

  const settlePoker = (game: '텍사스 홀덤'|'오마하'|'세븐 포커'|'파이브 카드 드로우', stake: number, result: 'win' | 'loss' | 'push', detail: string) => {
    const payout = result === 'win' ? stake * 2 : result === 'push' ? stake : 0;
    if (payout) setCoins((current) => { const next=current+payout; AsyncStorage.setItem(STORAGE_KEYS.coins,String(next)); return next; });
    setRecords((current) => { const record: GameRecord={ id:`${Date.now()}-poker-${current.length}`, game, result, difficulty, bet:stake, net:result==='win'?stake:result==='push'?0:-stake, playedAt:new Date().toISOString(), detail }; const next=[record,...current].slice(0,100); AsyncStorage.setItem(STORAGE_KEYS.records,JSON.stringify(next)); return next; });
  };

  if (!entered) {
    return (
      <SafeAreaView style={styles.splash}>
        <StatusBar style="light" />
        <ImageBackground source={casinoEntranceSource} resizeMode="cover" style={styles.splashBackground}>
          <View style={styles.splashShade} />
          <View style={styles.splashHeader}>
            <Text style={styles.splashEyebrow}>WELCOME TO</Text>
            <Text style={styles.splashTitle}>WORLD CASINO</Text>
            <Text style={styles.splashSubtitle}>세계의 모든 게임이 시작되는 밤</Text>
          </View>
          <View style={styles.splashBottom}>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.splashEnterButton, pressed && styles.pressed]} onPress={() => setEntered(true)}><Text style={styles.splashEnterButtonTop}>◆ ENTER ◆</Text><Text style={styles.splashEnterButtonText}>카지노 입장하기</Text></Pressable>
            <Text style={styles.splashDisclaimer}>WC 게임 전용 코인 · 현금 환전 불가</Text>
          </View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar style="light" />
      <Header coins={coins} />
      <View style={styles.screen}>
        {appScreen === 'categoryCatalog' && (
          <CategoryCatalogScreen
            category={selectedCategory}
            onBack={() => setAppScreen('tabs')}
            onOpenGame={(game) => {
              setSelectedCatalogGame(game);
              setAppScreen(game.name === '블랙잭' ? 'blackjackSetup' : game.name === '룰렛' ? 'rouletteGame' : game.name === '바카라' ? 'baccaratSetup' : game.name === '크랩스' ? 'crapsSetup' : game.name === '슬롯' ? 'slotSetup' : game.name === '식보' ? 'sicboSetup' : game.name === '비디오 포커' ? 'videoPokerGame' : game.name === '텍사스 홀덤' ? 'holdemSetup' : game.name === '오마하' ? 'omahaSetup' : game.name === '세븐 포커' ? 'sevenPokerSetup' : game.name === '파이브 카드 드로우' ? 'fiveDrawSetup' : 'gamePreview');
            }}
          />
        )}
        {appScreen === 'gamePreview' && (
          <GamePreviewScreen game={selectedCatalogGame} category={selectedCategory} difficulty={difficulty} onBack={() => setAppScreen('categoryCatalog')} />
        )}
        {appScreen === 'blackjackSetup' && (
          <BlackjackSetupScreen
            coins={coins}
            difficulty={difficulty}
            selectedBet={selectedBet}
            onBack={() => setAppScreen('categoryCatalog')}
            onDifficultyChange={saveDifficulty}
            onBetChange={setSelectedBet}
            onStart={startBlackjack}
          />
        )}
        {appScreen === 'blackjackGame' && (
          <BlackjackGameScreen
            key={gameRoundId}
            bet={selectedBet}
            coins={coins}
            difficulty={difficulty}
            onDoubleDown={doubleBlackjack}
            onPlaceInsurance={placeInsurance}
            onSettleInsurance={settleInsurance}
            onSettle={settleBlackjack}
            onPlayAgain={startBlackjack}
            onExit={() => setAppScreen('categoryCatalog')}
          />
        )}
        {appScreen === 'rouletteGame' && (
          <RouletteGameScreen
            coins={coins}
            difficulty={difficulty}
            selectedBet={selectedBet}
            onBack={() => setAppScreen('categoryCatalog')}
            onBetChange={setSelectedBet}
            onPlaceBet={placeRouletteBet}
            onSettle={settleRoulette}
          />
        )}
        {appScreen === 'baccaratGame' && (
          <BaccaratGameScreen
            coins={coins}
            difficulty={difficulty}
            selectedBet={selectedBet}
            onBack={() => setAppScreen('categoryCatalog')}
            onBetChange={setSelectedBet}
            onPlaceBet={placeRouletteBet}
            onSettle={settleBaccarat}
          />
        )}
        {appScreen === 'baccaratSetup' && (
          <BaccaratSetupScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={() => setAppScreen('baccaratGame')} />
        )}
        {appScreen === 'crapsSetup' && <CrapsSetupScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={() => setAppScreen('crapsGame')} />}
        {appScreen === 'crapsGame' && <CrapsGameScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onBetChange={setSelectedBet} onPlaceBet={placeRouletteBet} onSettle={settleCraps} />}
        {appScreen === 'slotSetup' && <SlotSetupScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} mode={slotMode} onModeChange={setSlotMode} onBack={() => setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={() => setAppScreen(slotMode === 'classic' ? 'slotGame' : 'pachislotGame')} />}
        {appScreen === 'slotGame' && <SlotGameScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onBetChange={setSelectedBet} onPlaceBet={placeRouletteBet} onSettle={settleSlot} />}
        {appScreen === 'pachislotGame' && <PachislotGameScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onBetChange={setSelectedBet} onPlaceBet={placeRouletteBet} onSettle={settlePachislot} />}
        {appScreen === 'sicboSetup' && <SicBoSetupScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={() => setAppScreen('sicboGame')} />}
        {appScreen === 'sicboGame' && <SicBoGameScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onBetChange={setSelectedBet} onPlaceBet={placeRouletteBet} onSettle={settleSicBo} />}
        {appScreen === 'videoPokerGame' && <VideoPokerGameScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onBetChange={setSelectedBet} onPlaceBet={placeRouletteBet} onSettle={settleVideoPoker} />}
        {appScreen === 'holdemSetup' && <PokerSetupScreen mode="holdem" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={() => setAppScreen('holdemGame')} />}
        {appScreen === 'holdemGame' && <PokerGameScreen mode="holdem" coins={coins} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onPlaceBet={placeRouletteBet} onSettle={(stake,result,detail)=>settlePoker('텍사스 홀덤',stake,result,detail)} />}
        {appScreen === 'omahaSetup' && <PokerSetupScreen mode="omaha" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={() => setAppScreen('omahaGame')} />}
        {appScreen === 'omahaGame' && <PokerGameScreen mode="omaha" coins={coins} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onPlaceBet={placeRouletteBet} onSettle={(stake,result,detail)=>settlePoker('오마하',stake,result,detail)} />}
        {appScreen === 'sevenPokerSetup' && <SevenPokerSetupScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={() => setAppScreen('sevenPokerGame')} />}
        {appScreen === 'sevenPokerGame' && <SevenPokerGameScreen coins={coins} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onPlaceBet={placeRouletteBet} onSettle={(stake,result,detail)=>settlePoker('세븐 포커',stake,result,detail)} />}
        {appScreen === 'fiveDrawSetup' && <FiveDrawSetupScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={() => setAppScreen('fiveDrawGame')} />}
        {appScreen === 'fiveDrawGame' && <FiveDrawGameScreen coins={coins} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onPlaceBet={placeRouletteBet} onSettle={(stake,result,detail)=>settlePoker('파이브 카드 드로우',stake,result,detail)} />}
        {appScreen === 'tabs' && renderTab(tab, difficulty, saveDifficulty, sound, setSound, vibration, setVibration, refillTestCoins, coins, records, (category) => {
          setSelectedCategory(category);
          setAppScreen('categoryCatalog');
        }, () => {
          setSelectedCategory(gameCategories[1]);
          setAppScreen('blackjackSetup');
        }, (category, game) => {
          setSelectedCategory(category);
          setSelectedCatalogGame(game);
          setAppScreen(game.name === '블랙잭' ? 'blackjackSetup' : game.name === '룰렛' ? 'rouletteGame' : game.name === '바카라' ? 'baccaratSetup' : game.name === '크랩스' ? 'crapsSetup' : game.name === '슬롯' ? 'slotSetup' : game.name === '식보' ? 'sicboSetup' : game.name === '비디오 포커' ? 'videoPokerGame' : game.name === '텍사스 홀덤' ? 'holdemSetup' : game.name === '오마하' ? 'omahaSetup' : game.name === '세븐 포커' ? 'sevenPokerSetup' : game.name === '파이브 카드 드로우' ? 'fiveDrawSetup' : 'gamePreview');
        })}
      </View>
      {appScreen === 'tabs' && <View style={styles.tabBar}>
        {tabs.map((item) => {
          const selected = item.name === tab;
          return (
            <Pressable
              key={item.name}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={styles.tabItem}
              onPress={() => {
                setTab(item.name);
                setAppScreen('tabs');
              }}
            >
              <Text style={[styles.tabIcon, selected && styles.tabSelected]}>{item.icon}</Text>
              <Text style={[styles.tabLabel, selected && styles.tabSelected]}>{item.name}</Text>
            </Pressable>
          );
        })}
      </View>}
      {!loaded && <View style={styles.loadingCover}><Text style={styles.muted}>저장 정보 불러오는 중…</Text></View>}
    </SafeAreaView>
  );
}

function Header({ coins }: { coins: number }) {
  return (
    <View style={styles.header}>
      <View style={styles.profileRow}>
        <View style={styles.avatar}><Text style={styles.avatarText}>G</Text></View>
        <View>
          <Text style={styles.profileName}>게스트</Text>
          <Text style={styles.level}>LV. 1</Text>
        </View>
      </View>
      <View style={styles.walletPill}>
        <Text style={styles.coin}>●</Text>
        <Text style={styles.walletText}>{coins.toLocaleString()} WC</Text>
      </View>
    </View>
  );
}

function renderTab(
  tab: Tab,
  difficulty: string,
  saveDifficulty: (value: string) => void,
  sound: boolean,
  setSound: (value: boolean) => void,
  vibration: boolean,
  setVibration: (value: boolean) => void,
  onRefillCoins: () => void,
  coins: number,
  records: GameRecord[],
  onOpenCategory: (category: GameCategory) => void,
  onOpenBlackjack: () => void,
  onOpenCatalogGame: (category: GameCategory, game: CatalogGame) => void,
) {
  if (tab === '게임') return <GamesScreen onOpenCategory={onOpenCategory} onOpenBlackjack={onOpenBlackjack} onOpenCatalogGame={onOpenCatalogGame} />;
  if (tab === '지갑') return <WalletScreen coins={coins} records={records} />;
  if (tab === '기록') return <RecordsScreen records={records} />;
  if (tab === '설정') {
    return <SettingsScreen difficulty={difficulty} saveDifficulty={saveDifficulty} sound={sound} setSound={setSound} vibration={vibration} setVibration={setVibration} onRefillCoins={onRefillCoins} />;
  }
  return <HomeScreen difficulty={difficulty} records={records} onContinue={(gameName) => {
    const category = gameCategories.find((item) => item.games.some((game) => game.name === gameName)) ?? gameCategories[1];
    const game = category.games.find((item) => item.name === gameName) ?? category.games[0];
    onOpenCatalogGame(category, game);
  }} />;
}

function Page({ children }: { children: React.ReactNode }) {
  return <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>{children}</ScrollView>;
}

function resultLabel(result: RoundResult) {
  if (result === 'blackjack') return '블랙잭';
  if (result === 'win') return '승리';
  if (result === 'push') return '무승부';
  return '패배';
}

function formatPlayedAt(value: string) {
  return new Date(value).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function HomeScreen({ difficulty, records, onContinue }: { difficulty: string; records: GameRecord[]; onContinue: (game: GameRecord['game']) => void }) {
  const recentGame = records[0];
  const continueGame = recentGame?.game ?? '블랙잭';
  const continueDifficulty = recentGame?.difficulty ?? difficulty;
  const continueBet = recentGame?.bet ?? 500;
  return (
    <Page>
      <Text style={styles.eyebrow}>오늘도 즐거운 한 판</Text>
      <Text style={styles.pageTitle}>메인 로비</Text>

      <Text style={styles.sectionTitle}>이어서 하기</Text>
      <View style={styles.heroCard}>
        <View style={styles.blackjackMark}>{continueGame === '룰렛' ? <Text style={styles.rouletteContinueMark}>◎</Text> : continueGame === '바카라' ? <Text style={styles.rouletteContinueMark}>◆</Text> : continueGame === '크랩스' ? <Text style={styles.rouletteContinueMark}>⚄</Text> : continueGame === '식보' ? <Text style={styles.rouletteContinueMark}>⚂</Text> : continueGame === '슬롯' ? <Text style={styles.rouletteContinueMark}>7</Text> : continueGame === '비디오 포커' ? <Text style={styles.rouletteContinueMark}>VP</Text> : <><Text style={styles.cardSuit}>A♠</Text><Text style={styles.cardSuit}>K♥</Text></>}</View>
        <View style={styles.heroCopy}>
          <Text style={styles.muted}>최근 플레이</Text>
          <Text style={styles.cardTitle}>{gameDisplayName(continueGame)}</Text>
          <Text style={styles.smallText}>{continueDifficulty} · 베팅 {continueBet.toLocaleString()} WC</Text>
        </View>
        <Pressable style={styles.smallButton} onPress={() => onContinue(continueGame)}><Text style={styles.smallButtonText}>계속</Text></Pressable>
      </View>

      <Text style={styles.sectionTitle}>최근 플레이</Text>
      <View style={styles.panel}>
        {records.length === 0 && <Text style={styles.emptyText}>아직 완료한 게임이 없습니다.</Text>}
        {records.slice(0, 2).map((record, index) => (
          <React.Fragment key={record.id}>
            <Row
              title={`${gameDisplayName(record.game)} · ${resultLabel(record.result)}`}
              subtitle={`${record.detail ? `${record.detail} · ` : ''}${formatPlayedAt(record.playedAt)} · ${betTierName(record.difficulty)}`}
              value={`${record.net > 0 ? '+' : ''}${record.net.toLocaleString()} WC`}
              positive={record.net > 0}
            />
            {index < Math.min(records.length, 2) - 1 && <View style={styles.separator} />}
          </React.Fragment>
        ))}
      </View>

      <Text style={styles.sectionTitle}>오늘의 미션</Text>
      <View style={styles.panel}>
        <Row title="게임 3판 플레이" subtitle="1 / 3 완료" value="+300 WC" positive />
        <View style={styles.progressTrack}><View style={styles.progressValue} /></View>
      </View>
    </Page>
  );
}

function GamesScreen({
  onOpenCategory,
  onOpenBlackjack,
  onOpenCatalogGame,
}: {
  onOpenCategory: (category: GameCategory) => void;
  onOpenBlackjack: () => void;
  onOpenCatalogGame: (category: GameCategory, game: CatalogGame) => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'playable'>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const allGames = gameCategories.flatMap((category) => category.games.map((game) => ({ category, game })));
  const visibleGames = allGames.filter(({ game }) => {
    const matchesQuery = game.name.toLowerCase().includes(query.trim().toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'playable' && game.status === 'playable') || (filter === 'favorites' && favorites.includes(game.name));
    return matchesQuery && matchesFilter;
  });

  useEffect(() => {
    AsyncStorage.getItem('world-casino.favorites').then((saved) => {
      if (saved) setFavorites(JSON.parse(saved));
    });
  }, []);

  const toggleFavorite = (gameName: string) => {
    setFavorites((current) => {
      const next = current.includes(gameName) ? current.filter((name) => name !== gameName) : [...current, gameName];
      AsyncStorage.setItem('world-casino.favorites', JSON.stringify(next));
      return next;
    });
  };

  const showGameResults = query.trim().length > 0 || filter !== 'all';

  return (
    <Page>
      <Text style={styles.pageTitle}>게임</Text>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          accessibilityLabel="게임 이름 검색"
          style={styles.searchInput}
          placeholder="게임 이름 검색"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {query.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기" onPress={() => setQuery('')}><Text style={styles.clearSearch}>×</Text></Pressable>}
      </View>
      <View style={styles.chipRow}>
        {([
          ['all', '전체'],
          ['favorites', `즐겨찾기 ${favorites.length}`],
          ['playable', '플레이 가능'],
        ] as const).map(([value, label]) => (
          <Pressable key={value} accessibilityRole="button" onPress={() => setFilter(value)} style={[styles.chip, filter === value && styles.chipActive]}>
            <Text style={filter === value ? styles.chipActiveText : styles.chipText}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {!showGameResults ? <>
        <Text style={styles.sectionTitle}>바로 플레이</Text>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.heroCard, pressed && styles.pressed]} onPress={onOpenBlackjack}>
          <View style={styles.blackjackMark}><Text style={styles.cardSuit}>A♠</Text><Text style={styles.cardSuit}>K♥</Text></View>
          <View style={styles.heroCopy}><Text style={styles.muted}>지금 플레이 가능</Text><Text style={styles.cardTitle}>블랙잭(Blackjack)</Text><Text style={styles.smallText}>베팅 등급과 금액을 선택해 시작</Text></View>
          <View style={styles.smallButton}><Text style={styles.smallButtonText}>시작</Text></View>
        </Pressable>
        <Text style={styles.sectionTitle}>6개 카테고리</Text>
        <View style={styles.categoryGrid}>
          {gameCategories.map((category) => (
            <Pressable key={category.name} style={({ pressed }) => [styles.categoryCard, pressed && styles.pressed]} onPress={() => onOpenCategory(category)} accessibilityRole="button">
              <Text style={styles.categoryIcon}>{category.icon}</Text><Text style={styles.categoryName}>{category.name}</Text><Text style={styles.categoryDetail}>{category.detail}</Text><Text style={styles.categoryCount}>{category.games.length}개 게임</Text>
            </Pressable>
          ))}
        </View>
      </> : <>
        <Text style={styles.sectionTitle}>{visibleGames.length}개 게임</Text>
        <View style={styles.catalogList}>
          {visibleGames.map(({ category, game }) => (
            <View key={`${category.name}-${game.name}`} style={styles.gameListCard}>
              <Pressable accessibilityRole="button" style={styles.resultOpenArea} onPress={() => onOpenCatalogGame(category, game)}>
                <View style={styles.gameListIcon}><Text style={styles.gameListIconText}>{game.icon}</Text></View>
                <View style={styles.gameListCopy}>
                  <Text style={styles.resultCategory}>{category.name}</Text>
                  <Text style={styles.gameListTitle}>{gameDisplayName(game.name)}</Text>
                  <Text style={styles.gameListDescription}>{game.description}</Text>
                </View>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`${game.name} 즐겨찾기`} style={styles.favoriteButton} onPress={() => toggleFavorite(game.name)}>
                <Text style={[styles.favoriteIcon, favorites.includes(game.name) && styles.favoriteIconActive]}>{favorites.includes(game.name) ? '★' : '☆'}</Text>
              </Pressable>
            </View>
          ))}
          {visibleGames.length === 0 && <View style={styles.panel}><Text style={styles.emptyText}>{filter === 'favorites' ? '즐겨찾기한 게임이 없습니다.' : '검색 결과가 없습니다.'}</Text></View>}
        </View>
      </>}
    </Page>
  );
}

function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.detailHeader}>
      <Pressable accessibilityRole="button" style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>‹</Text>
      </Pressable>
      <Text style={styles.detailHeaderTitle}>{title}</Text>
      <View style={styles.backButtonSpacer} />
    </View>
  );
}

function CoinStack({ amount, compact = false }: { amount: number; compact?: boolean }) {
  const layerCount = amount >= 5000 ? 5 : amount >= 1000 ? 4 : amount >= 500 ? 3 : 2;
  const layers = Array.from({ length: layerCount });
  return (
    <View style={[styles.coinStack, compact && styles.coinStackCompact]} accessibilityLabel={`${amount.toLocaleString()} 월드코인 베팅`}>
      {layers.map((_, index) => (
        <View key={index} style={[styles.worldCoinChip, compact && styles.worldCoinChipCompact, { bottom: index * (compact ? 3 : 5), zIndex: index + 1 }]}>
          {index === layerCount - 1 && <View style={[styles.worldCoinCenter, compact && styles.worldCoinCenterCompact]}><Text style={[styles.worldCoinAmount, compact && styles.worldCoinAmountCompact]}>{amount.toLocaleString()}</Text><Text style={[styles.worldCoinUnit, compact && styles.worldCoinUnitCompact]}>WC</Text></View>}
        </View>
      ))}
    </View>
  );
}

function betCoinLayerCount(amount: number) {
  if (amount >= 50000) return 12;
  if (amount >= 10000) return 10;
  if (amount >= 5000) return 8;
  if (amount >= 2000) return 7;
  if (amount >= 1000) return 6;
  if (amount >= 500) return 5;
  if (amount >= 250) return 4;
  if (amount >= 100) return 2;
  return 1;
}

function BetOptionCoin({ amount, selected, disabled = false, onPress }: { amount: number; level?: number; selected: boolean; disabled?: boolean; onPress: () => void }) {
  const level = betCoinLayerCount(amount);
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.betOptionCoin, disabled && styles.disabledCard]} accessibilityLabel={`${amount.toLocaleString()} WC 베팅`}>
      {Array.from({ length: level }).map((_, index) => (
        <View key={index} style={[styles.betOptionCoinLayer, selected && styles.betOptionCoinLayerActive, { bottom: 3 + index * 7, zIndex: index + 1 }]}>
          {index === level - 1 && <View style={[styles.betOptionCoinCenter, selected && styles.betOptionCoinCenterActive]}><Text style={[styles.betButtonText, selected && styles.betButtonTextActive]}>{amount.toLocaleString()}</Text><Text style={[styles.betButtonUnit, selected && styles.betButtonTextActive]}>WC</Text></View>}
        </View>
      ))}
    </Pressable>
  );
}

function CategoryCatalogScreen({ category, onBack, onOpenGame }: { category: GameCategory; onBack: () => void; onOpenGame: (game: CatalogGame) => void }) {
  return (
    <View style={styles.detailScreen}>
      <ScreenHeader title={category.name} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.detailPage} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{category.eyebrow}</Text>
        <Text style={styles.detailLead}>원하는 게임을 선택하세요</Text>
        <View style={styles.searchBox}><Text style={styles.muted}>⌕  {category.name} 게임 검색</Text></View>
        <View style={styles.catalogList}>
          {category.games.map((game) => (
            <Pressable
              key={game.name}
              accessibilityRole="button"
              onPress={() => onOpenGame(game)}
              style={({ pressed }) => [styles.gameListCard, pressed && styles.pressed]}
            >
              <View style={styles.gameListIcon}><Text style={styles.gameListIconText}>{game.icon}</Text></View>
              <View style={styles.gameListCopy}>
                <View style={styles.gameTitleRow}>
                  <Text style={styles.gameListTitle}>{gameDisplayName(game.name)}</Text>
                  <Text style={game.status === 'playable' ? styles.availableBadge : styles.comingSoonBadge}>{game.status === 'playable' ? '플레이 가능' : '기본 화면'}</Text>
                </View>
                <Text style={styles.gameListDescription}>{game.description}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function BlackjackSetupScreen(props: {
  coins: number;
  difficulty: string;
  selectedBet: number;
  onBack: () => void;
  onDifficultyChange: (value: string) => void;
  onBetChange: (value: number) => void;
  onStart: () => void;
}) {
  const selectedDifficulty = difficultyOptions.find((item) => item.name === props.difficulty) ?? difficultyOptions[2];
  const canStart = props.selectedBet <= props.coins;
  return (
    <View style={styles.detailScreen}>
      <ScreenHeader title="블랙잭(Blackjack) 설정" onBack={props.onBack} />
      <ScrollView contentContainerStyle={styles.detailPage} showsVerticalScrollIndicator={false}>
        <View style={styles.blackjackIntro}>
          <View style={styles.blackjackIntroCards}><Text style={styles.introCard}>A♠</Text><Text style={styles.introCard}>K♥</Text></View>
          <View style={styles.blackjackIntroCopy}>
            <Text style={styles.eyebrow}>BLACKJACK</Text>
            <Text style={styles.detailLead}>21에 가장 가까이</Text>
            <Text style={styles.gameListDescription}>딜러보다 21에 가까운 카드 합계를 만드세요.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>베팅 등급</Text>
        <View style={styles.setupOptions}>
          {difficultyOptions.map((option) => {
            const selected = props.difficulty === option.name;
            return (
              <Pressable key={option.name} style={[styles.setupOption, selected && styles.setupOptionActive]} onPress={() => props.onDifficultyChange(option.name)}>
                <Text style={[styles.setupOptionTitle, selected && styles.setupOptionTitleActive]}>{betTierName(option.name)}</Text>
                <Text style={styles.setupOptionRange}>{option.min.toLocaleString()}~{option.max.toLocaleString()} WC</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>베팅 금액</Text>
        <View style={styles.betGrid}>
          {selectedDifficulty.bets.map((bet) => {
            const selected = props.selectedBet === bet;
            const disabled = bet > props.coins;
            return <BetOptionCoin key={bet} amount={bet} selected={selected} disabled={disabled} onPress={() => props.onBetChange(bet)} />;
          })}
        </View>

        <View style={styles.blackjackBetSpot}>
          <Text style={styles.blackjackBetSpotLabel}>BET</Text>
          <CoinStack amount={props.selectedBet} />
          <Text style={styles.blackjackBetSpotCaption}>{props.selectedBet.toLocaleString()} 월드코인을 테이블에 올렸습니다</Text>
        </View>

        <View style={styles.setupSummary}>
          <Row title="보유 코인" value={`${props.coins.toLocaleString()} WC`} />
          <View style={styles.separator} />
          <Row title="베팅 등급" value={betTierName(props.difficulty)} />
          <View style={styles.separator} />
          <Row title="선택 베팅" value={`${props.selectedBet.toLocaleString()} WC`} />
        </View>

        <Pressable disabled={!canStart} onPress={props.onStart} style={[styles.primaryButton, styles.fullWidthButton, !canStart && styles.disabledCard]}>
          <Text style={styles.primaryButtonText}>게임 시작</Text>
        </Pressable>
        <Text style={styles.setupNotice}>베팅 금액은 게임을 시작할 때 차감되고, 결과에 따라 자동 정산됩니다.</Text>
      </ScrollView>
    </View>
  );
}

function GamePreviewScreen({ game, category, difficulty, onBack }: { game: CatalogGame; category: GameCategory; difficulty: string; onBack: () => void }) {
  return (
    <View style={styles.detailScreen}>
      <ScreenHeader title={gameDisplayName(game.name)} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.detailPage} showsVerticalScrollIndicator={false}>
        <View style={styles.previewHero}>
          <View style={styles.previewIcon}><Text style={styles.previewIconText}>{game.icon}</Text></View>
          <Text style={styles.eyebrow}>{category.eyebrow}</Text>
          <Text style={styles.previewTitle}>{gameDisplayName(game.name)}</Text>
          <Text style={styles.previewDescription}>{game.description}</Text>
        </View>
        <Text style={styles.sectionTitle}>공통 게임 구조</Text>
        <View style={styles.panel}>
          <Row title="카테고리" value={category.name} />
          <View style={styles.separator} />
          <Row title="베팅 등급" value={betTierName(difficulty)} />
          <View style={styles.separator} />
          <Row title="사용 자산" value="통합 WC 코인" />
          <View style={styles.separator} />
          <Row title="기록·통계" value="통합 기록에 연결" />
        </View>
        <View style={styles.roadmapCard}>
          <Text style={styles.roadmapTitle}>게임 자리 준비 완료</Text>
          <Text style={styles.roadmapText}>이 화면에 규칙 엔진과 실제 플레이 테이블을 연결하면 됩니다. 전체 플랫폼을 먼저 완성한 뒤 게임별 기능을 추가합니다.</Text>
        </View>
        <Pressable disabled style={[styles.primaryButton, styles.fullWidthButton, styles.disabledCard]}>
          <Text style={styles.primaryButtonText}>실제 플레이는 다음 단계</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SlotRules({ compact = false }: { compact?: boolean }) {
  return <View style={[styles.slotRules, compact && styles.slotRulesCompact]}><Text style={styles.slotRulesTitle}>당첨 규칙</Text><Text style={styles.slotRuleText}>같은 그림 2개 · 베팅의 1.5배 작은 보너스</Text><Text style={styles.slotRuleText}>같은 그림 3개 · 그림별 4~50배 당첨</Text><Text style={styles.slotRuleText}>🃏 조커 · 다른 그림을 대신하는 와일드</Text><Text style={styles.slotRuleText}>⭐ 별 3개 · 무료 회전 5회</Text><Text style={styles.slotRuleText}>👑 왕관 3개 · 50배 잭팟</Text></View>;
}

function SlotSetupScreen(props: { coins: number; difficulty: string; selectedBet: number; mode: 'classic' | 'pachislot'; onModeChange: (value: 'classic' | 'pachislot') => void; onBack: () => void; onDifficultyChange: (value: string) => void; onBetChange: (value: number) => void; onStart: () => void }) {
  const option = difficultyOptions.find((item) => item.name === props.difficulty) ?? difficultyOptions[2];
  return <View style={styles.detailScreen}><ScreenHeader title="슬롯(Slot) 설정" onBack={props.onBack} /><ScrollView contentContainerStyle={styles.detailPage} showsVerticalScrollIndicator={false}>
    <View style={styles.slotSetupHero}><Text style={styles.slotLogo}>7</Text><View style={styles.slotSetupCopy}><Text style={styles.eyebrow}>WORLD SLOTS</Text><Text style={styles.detailLead}>그림을 맞추고 보너스에 도전</Text><Text style={styles.gameListDescription}>한 번 회전이 한 판이며, 무료 회전이 나오면 계속 이어집니다.</Text></View></View>
    <Text style={styles.sectionTitle}>게임 방식</Text><View style={styles.slotModeRow}><Pressable onPress={() => props.onModeChange('classic')} style={[styles.slotModeCard, props.mode === 'classic' && styles.slotModeActive]}><Text style={props.mode === 'classic' ? styles.slotModeTitleActive : styles.slotModeTitle}>클래식 슬롯(Classic Slot)</Text><Text style={styles.slotModeText}>자동으로 멈추는 3릴</Text></Pressable><Pressable onPress={() => props.onModeChange('pachislot')} style={[styles.slotModeCard, props.mode === 'pachislot' && styles.slotModeActive]}><Text style={props.mode === 'pachislot' ? styles.slotModeTitleActive : styles.slotModeTitle}>일본식 파치슬롯(Pachislot)</Text><Text style={styles.slotModeText}>레버 시작 · 릴 3개 직접 정지</Text></Pressable></View>
    <SlotRules />
    <Text style={styles.sectionTitle}>베팅 등급</Text><View style={styles.setupOptions}>{difficultyOptions.map((item) => <Pressable key={item.name} style={[styles.setupOption, props.difficulty === item.name && styles.setupOptionActive]} onPress={() => props.onDifficultyChange(item.name)}><Text style={[styles.setupOptionTitle, props.difficulty === item.name && styles.setupOptionTitleActive]}>{betTierName(item.name)}</Text><Text style={styles.setupOptionRange}>{item.min.toLocaleString()}~{item.max.toLocaleString()} WC</Text></Pressable>)}</View>
    <Text style={styles.sectionTitle}>베팅 금액</Text><View style={styles.betGrid}>{option.bets.map((amount) => <BetOptionCoin key={amount} amount={amount} selected={props.selectedBet === amount} disabled={amount > props.coins} onPress={() => props.onBetChange(amount)} />)}</View>
    <View style={styles.setupSummary}><Row title="보유 코인" value={`${props.coins.toLocaleString()} WC`} /><View style={styles.separator} /><Row title="선택 모드" value={props.mode === 'classic' ? '클래식 슬롯' : '일본식 파치슬롯'} /><View style={styles.separator} /><Row title="선택 베팅" value={`${props.selectedBet.toLocaleString()} WC`} /></View>
    <Pressable disabled={props.selectedBet > props.coins} style={[styles.primaryButton, styles.fullWidthButton, props.selectedBet > props.coins && styles.disabledCard]} onPress={props.onStart}><Text style={styles.primaryButtonText}>{props.mode === 'classic' ? '클래식 슬롯(Classic Slot) 시작' : '파치슬롯(Pachislot) 시작'}</Text></Pressable>
  </ScrollView></View>;
}

function SlotGameScreen({ coins, difficulty, selectedBet, onBack, onBetChange, onPlaceBet, onSettle }: { coins: number; difficulty: string; selectedBet: number; onBack: () => void; onBetChange: (value: number) => void; onPlaceBet: (stake: number) => boolean; onSettle: (stake: number, result: SlotResult, usedFreeSpin: boolean) => void }) {
  const option = difficultyOptions.find((item) => item.name === difficulty) ?? difficultyOptions[2];
  const [reels, setReels] = useState<[SlotSymbol, SlotSymbol, SlotSymbol]>(['🍒', '🔔', '👑']);
  const [result, setResult] = useState<SlotResult | null>(null);
  const [freeSpins, setFreeSpins] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const spin = () => {
    if (spinning) return;
    const usedFreeSpin = freeSpins > 0;
    if (!usedFreeSpin && !onPlaceBet(selectedBet)) return;
    if (usedFreeSpin) setFreeSpins((value) => value - 1);
    setSpinning(true); setResult(null);
    const ticker = setInterval(() => setReels([spinSlot(1).reels[0], spinSlot(1).reels[1], spinSlot(1).reels[2]]), 90);
    setTimeout(() => {
      clearInterval(ticker);
      const next = spinSlot(selectedBet); setReels(next.reels); setResult(next); setFreeSpins((value) => value + next.freeSpins); setSpinning(false); onSettle(selectedBet, next, usedFreeSpin);
    }, 720);
  };
  return <View style={styles.slotScreen}><ScreenHeader title="클래식 슬롯(Classic Slot)" onBack={onBack} /><ScrollView contentContainerStyle={styles.slotPage} showsVerticalScrollIndicator={false}>
    <View style={styles.rouletteStatusRow}><View><Text style={styles.eyebrow}>WORLD SLOTS</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View><View style={styles.difficultyBadge}><Text style={styles.difficultyBadgeText}>{betTierName(difficulty)}</Text></View></View>
    <View style={styles.slotMachine}><Text style={styles.slotJackpot}>◆ JACKPOT · x50 ◆</Text><View style={styles.slotReels}>{reels.map((symbol, index) => <View key={index} style={[styles.slotReel, Boolean(result?.multiplier) && styles.slotReelWin]}><Text style={styles.slotSymbol}>{symbol}</Text></View>)}</View><View style={styles.slotPayline} /><Text style={styles.slotMachineLabel}>{spinning ? '회전 중…' : result?.label ?? 'SPIN을 눌러 시작하세요'}</Text>{result && <Text style={[styles.slotPayout, result.payout > 0 ? styles.positive : styles.muted]}>{result.payout > 0 ? `+${result.payout.toLocaleString()} WC 지급` : '당첨 없음'}</Text>}{freeSpins > 0 && <Text style={styles.freeSpinBadge}>무료 회전 {freeSpins}회 남음</Text>}</View>
    <Pressable disabled={spinning || (freeSpins === 0 && selectedBet > coins)} style={[styles.slotSpinButton, (spinning || (freeSpins === 0 && selectedBet > coins)) && styles.disabledCard]} onPress={spin}><Text style={styles.slotSpinText}>{spinning ? '회전 중…' : freeSpins > 0 ? `무료 SPIN · ${freeSpins}회` : `SPIN · ${selectedBet.toLocaleString()} WC`}</Text></Pressable>
    <Text style={styles.sectionTitle}>베팅 금액</Text><View style={styles.betGrid}>{option.bets.map((amount) => <BetOptionCoin key={amount} amount={amount} selected={selectedBet === amount} disabled={spinning || freeSpins > 0} onPress={() => onBetChange(amount)} />)}</View>
    <SlotRules compact /><Text style={styles.disclaimer}>게임 전용 가상 코인 · 현금 환전 불가</Text>
  </ScrollView></View>;
}

function PachislotGameScreen({ coins, difficulty, selectedBet, onBack, onBetChange, onPlaceBet, onSettle }: { coins: number; difficulty: string; selectedBet: number; onBack: () => void; onBetChange: (value: number) => void; onPlaceBet: (stake: number) => boolean; onSettle: (stake: number, result: PachislotResult, usedFreeGame: boolean) => void }) {
  const option = difficultyOptions.find((item) => item.name === difficulty) ?? difficultyOptions[2];
  const [reels, setReels] = useState<[PachislotSymbol, PachislotSymbol, PachislotSymbol]>(['🍒', '🔔', '7️⃣']);
  const [target, setTarget] = useState<[PachislotSymbol, PachislotSymbol, PachislotSymbol]>(reels);
  const [stopped, setStopped] = useState<[boolean, boolean, boolean]>([true, true, true]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<PachislotResult | null>(null);
  const [replay, setReplay] = useState(false);
  const [bonusSpins, setBonusSpins] = useState(0);
  const roundFreeRef = useRef(false);

  useEffect(() => {
    if (!spinning) return;
    const timer = setInterval(() => setReels((current) => current.map((symbol, index) => stopped[index] ? symbol : pachislotSymbols[Math.floor(Math.random() * pachislotSymbols.length)]) as [PachislotSymbol, PachislotSymbol, PachislotSymbol]), 90);
    return () => clearInterval(timer);
  }, [spinning, stopped]);

  const pullLever = () => {
    if (spinning) return;
    const free = replay || bonusSpins > 0;
    if (!free && !onPlaceBet(selectedBet)) return;
    if (replay) setReplay(false); else if (bonusSpins > 0) setBonusSpins((value) => value - 1);
    roundFreeRef.current = free; setTarget(spinPachislotReels()); setStopped([false, false, false]); setResult(null); setSpinning(true);
  };

  const stopReel = (index: number) => {
    if (!spinning || stopped[index]) return;
    const nextStopped: [boolean, boolean, boolean] = [...stopped] as [boolean, boolean, boolean]; nextStopped[index] = true;
    const nextReels: [PachislotSymbol, PachislotSymbol, PachislotSymbol] = [...reels] as [PachislotSymbol, PachislotSymbol, PachislotSymbol]; nextReels[index] = target[index];
    setStopped(nextStopped); setReels(nextReels);
    if (nextStopped.every(Boolean)) {
      const next = evaluatePachislot(target, selectedBet); setResult(next); setSpinning(false); setReplay(next.replay); setBonusSpins((value) => value + next.bonusSpins); onSettle(selectedBet, next, roundFreeRef.current);
    }
  };

  return <View style={styles.pachislotScreen}><ScreenHeader title="일본식 파치슬롯(Pachislot)" onBack={onBack} /><ScrollView contentContainerStyle={styles.slotPage} showsVerticalScrollIndicator={false}>
    <View style={styles.rouletteStatusRow}><View><Text style={styles.eyebrow}>PACHISLOT</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View><View style={styles.difficultyBadge}><Text style={styles.difficultyBadgeText}>{betTierName(difficulty)}</Text></View></View>
    <View style={[styles.slotMachine, styles.pachislotMachine]}><Text style={styles.slotJackpot}>BIG BONUS · 7️⃣ 7️⃣ 7️⃣</Text><View style={styles.slotReels}>{reels.map((symbol, index) => <View key={index} style={[styles.slotReel, stopped[index] && Boolean(result?.payout) ? styles.slotReelWin : null]}><Text style={styles.slotSymbol}>{symbol}</Text></View>)}</View><View style={styles.slotPayline} /><Text style={styles.slotMachineLabel}>{spinning ? '정지 버튼을 하나씩 누르세요' : result?.label ?? '레버를 당겨 시작하세요'}</Text>{result?.payout ? <Text style={[styles.slotPayout, styles.positive]}>+{result.payout.toLocaleString()} WC 지급</Text> : null}{replay && <Text style={styles.freeSpinBadge}>REPLAY · 다음 게임 무료</Text>}{bonusSpins > 0 && <Text style={styles.bigBonusBadge}>BONUS {bonusSpins}게임 남음</Text>}</View>
    <View style={styles.stopButtonRow}>{[0, 1, 2].map((index) => <Pressable key={index} disabled={!spinning || stopped[index]} onPress={() => stopReel(index)} style={[styles.stopButton, (!spinning || stopped[index]) && styles.stopButtonStopped]}><Text style={styles.stopButtonText}>{stopped[index] ? 'STOP' : `${index + 1} 정지`}</Text></Pressable>)}</View>
    <Pressable disabled={spinning || (!replay && bonusSpins === 0 && selectedBet > coins)} onPress={pullLever} style={[styles.pachiLever, (spinning || (!replay && bonusSpins === 0 && selectedBet > coins)) && styles.disabledCard]}><Text style={styles.pachiLeverIcon}>●</Text><Text style={styles.pachiLeverText}>{spinning ? '릴 회전 중' : replay ? 'REPLAY 시작' : bonusSpins > 0 ? `보너스 게임 시작 · ${bonusSpins}회` : `레버 당기기 · ${selectedBet.toLocaleString()} WC`}</Text></Pressable>
    <Text style={styles.sectionTitle}>베팅 금액</Text><View style={styles.betGrid}>{option.bets.map((amount) => <BetOptionCoin key={amount} amount={amount} selected={selectedBet === amount} disabled={spinning || replay || bonusSpins > 0} onPress={() => onBetChange(amount)} />)}</View>
    <View style={styles.slotRules}><Text style={styles.slotRulesTitle}>파치슬롯 규칙</Text><Text style={styles.slotRuleText}>레버를 당긴 뒤 세 정지 버튼을 원하는 순서로 누릅니다.</Text><Text style={styles.slotRuleText}>🔁 3개는 리플레이 · 🔔 3개는 REGULAR 4게임</Text><Text style={styles.slotRuleText}>7️⃣ 3개는 BIG BONUS 8게임과 10배 당첨</Text></View>
  </ScrollView></View>;
}

function SicBoRules() {
  return <View style={styles.sicboRules}><Text style={styles.slotRulesTitle}>식보(骰寶, Sic Bo) 핵심 규칙</Text><Text style={styles.slotRuleText}>주사위 3개의 결과를 한 번에 맞힙니다.</Text><Text style={styles.slotRuleText}>대 11~17 · 소 4~10 · 트리플이면 대소·홀짝 모두 패배</Text><Text style={styles.slotRuleText}>특정 합계와 더블·트리플은 어려울수록 배당이 커집니다.</Text></View>;
}

function SicBoSetupScreen(props: { coins: number; difficulty: string; selectedBet: number; onBack: () => void; onDifficultyChange: (value: string) => void; onBetChange: (value: number) => void; onStart: () => void }) {
  const option = difficultyOptions.find((item) => item.name === props.difficulty) ?? difficultyOptions[2];
  return <View style={styles.detailScreen}><ScreenHeader title="식보(骰寶, Sic Bo) 설정" onBack={props.onBack} /><ScrollView contentContainerStyle={styles.detailPage} showsVerticalScrollIndicator={false}><View style={styles.sicboHero}><Text style={styles.sicboHeroDice}>⚀ ⚂ ⚄</Text><Text style={styles.detailLead}>세 주사위의 조합을 예측</Text><Text style={styles.gameListDescription}>매 회전마다 베팅하고 주사위 결과를 즉시 확인합니다.</Text></View><SicBoRules /><Text style={styles.sectionTitle}>베팅 등급</Text><View style={styles.setupOptions}>{difficultyOptions.map((item) => <Pressable key={item.name} style={[styles.setupOption, props.difficulty === item.name && styles.setupOptionActive]} onPress={() => props.onDifficultyChange(item.name)}><Text style={[styles.setupOptionTitle, props.difficulty === item.name && styles.setupOptionTitleActive]}>{betTierName(item.name)}</Text><Text style={styles.setupOptionRange}>{item.min.toLocaleString()}~{item.max.toLocaleString()} WC</Text></Pressable>)}</View><Text style={styles.sectionTitle}>베팅 금액</Text><View style={styles.betGrid}>{option.bets.map((amount) => <BetOptionCoin key={amount} amount={amount} selected={props.selectedBet === amount} disabled={amount > props.coins} onPress={() => props.onBetChange(amount)} />)}</View><Pressable disabled={props.selectedBet > props.coins} style={[styles.primaryButton, styles.fullWidthButton, props.selectedBet > props.coins && styles.disabledCard]} onPress={props.onStart}><Text style={styles.primaryButtonText}>식보(骰寶, Sic Bo) 시작</Text></Pressable></ScrollView></View>;
}

function SicBoGameScreen({ coins, difficulty, selectedBet, onBack, onBetChange, onPlaceBet, onSettle }: { coins: number; difficulty: string; selectedBet: number; onBack: () => void; onBetChange: (value: number) => void; onPlaceBet: (stake: number) => boolean; onSettle: (bet: SicBoBet, stake: number, dice: SicBoDice) => void }) {
  const option = difficultyOptions.find((item) => item.name === difficulty) ?? difficultyOptions[2];
  const [bet, setBet] = useState<SicBoBet>({ type: 'big' }); const [dice, setDice] = useState<SicBoDice>([1, 3, 5]); const [rolling, setRolling] = useState(false); const [net, setNet] = useState<number | null>(null);
  const selected = (candidate: SicBoBet) => JSON.stringify(candidate) === JSON.stringify(bet);
  const choose = (candidate: SicBoBet) => { if (!rolling) { setBet(candidate); setNet(null); } };
  const roll = () => { if (rolling || !onPlaceBet(selectedBet)) return; setRolling(true); setNet(null); const timer = setInterval(() => setDice(rollSicBo()), 90); setTimeout(() => { clearInterval(timer); const next = rollSicBo(); setDice(next); const nextNet = sicBoNet(bet, selectedBet, next); setNet(nextNet); setRolling(false); onSettle(bet, selectedBet, next); }, 720); };
  const optionButton = (candidate: SicBoBet, title: string, odds: string) => <Pressable key={`${candidate.type}-${'value' in candidate ? candidate.value : title}`} onPress={() => choose(candidate)} style={[styles.sicboBetButton, selected(candidate) && styles.sicboBetActive]}>{selected(candidate) && <CoinStack amount={selectedBet} compact />}<Text style={styles.sicboBetTitle}>{title}</Text><Text style={styles.sicboOdds}>{odds}</Text></Pressable>;
  return <View style={styles.sicboScreen}><ScreenHeader title="식보(骰寶, Sic Bo)" onBack={onBack} /><ScrollView contentContainerStyle={styles.sicboPage} showsVerticalScrollIndicator={false}><View style={styles.rouletteStatusRow}><View><Text style={styles.eyebrow}>SIC BO</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View><View style={styles.difficultyBadge}><Text style={styles.difficultyBadgeText}>{betTierName(difficulty)}</Text></View></View><View style={styles.sicboBowl}><Text style={styles.crapsPointLabel}>{rolling ? 'SHAKING' : `합계 ${dice[0] + dice[1] + dice[2]}`}</Text><View style={styles.sicboDiceRow}>{dice.map((value, index) => <Die key={index} value={value} />)}</View>{net !== null && <Text style={[styles.sicboResult, net > 0 ? styles.positive : styles.negative]}>{net > 0 ? '당첨' : '미당첨'} · {net > 0 ? '+' : ''}{net.toLocaleString()} WC</Text>}</View><Pressable disabled={rolling || selectedBet > coins} style={[styles.primaryButton, styles.rouletteSpinButton, styles.sicboRollButton, (rolling || selectedBet > coins) && styles.disabledCard]} onPress={roll}><Text style={styles.primaryButtonText}>{rolling ? '주사위 흔드는 중…' : `${sicBoBetLabel(bet)}에 ${selectedBet.toLocaleString()} WC 베팅`}</Text></Pressable>
    <Text style={styles.sectionTitle}>기본 베팅</Text><View style={styles.sicboFourGrid}>{optionButton({ type: 'big' }, '대 11–17', '1:1')}{optionButton({ type: 'small' }, '소 4–10', '1:1')}{optionButton({ type: 'odd' }, '홀수', '1:1')}{optionButton({ type: 'even' }, '짝수', '1:1')}</View>
    <Text style={styles.sectionTitle}>특정 합계</Text><View style={styles.sicboNumberGrid}>{Array.from({ length: 14 }, (_, index) => index + 4).map((value) => optionButton({ type: 'total', value }, String(value), value === 4 || value === 17 ? '50:1' : '6~18:1'))}</View>
    <Text style={styles.sectionTitle}>특정 숫자</Text><View style={styles.sicboNumberGrid}>{[1,2,3,4,5,6].map((value) => optionButton({ type: 'single', value }, String(value), '1~3개'))}</View>
    <Text style={styles.sectionTitle}>더블</Text><View style={styles.sicboNumberGrid}>{[1,2,3,4,5,6].map((value) => optionButton({ type: 'double', value }, `${value}${value}`, '11:1'))}</View>
    <Text style={styles.sectionTitle}>트리플</Text><View style={styles.sicboNumberGrid}>{[1,2,3,4,5,6].map((value) => optionButton({ type: 'triple', value }, `${value}${value}${value}`, '180:1'))}</View>
    <Text style={styles.sectionTitle}>베팅 금액</Text><View style={styles.betGrid}>{option.bets.map((amount) => <BetOptionCoin key={amount} amount={amount} selected={selectedBet === amount} disabled={rolling} onPress={() => onBetChange(amount)} />)}</View>
  </ScrollView></View>;
}

function VideoPokerGameScreen({ coins, difficulty, selectedBet, onBack, onBetChange, onPlaceBet, onSettle }: { coins: number; difficulty: string; selectedBet: number; onBack: () => void; onBetChange: (value: number) => void; onPlaceBet: (stake: number) => boolean; onSettle: (stake: number, hand: Card[]) => void }) {
  const option = difficultyOptions.find((item) => item.name === difficulty) ?? difficultyOptions[2];
  const [hand, setHand] = useState<Card[]>([]); const [deck, setDeck] = useState<Card[]>([]); const [held, setHeld] = useState([false, false, false, false, false]); const [phase, setPhase] = useState<'ready' | 'hold' | 'result'>('ready');
  const result = phase === 'result' ? evaluateVideoPoker(hand) : null;
  const deal = () => { if (!onPlaceBet(selectedBet)) return; const next = dealVideoPoker(); setHand(next.hand); setDeck(next.deck); setHeld([false, false, false, false, false]); setPhase('hold'); };
  const draw = () => { const next = exchangeVideoPoker(hand, deck, held); setHand(next.hand); setDeck(next.deck); setPhase('result'); onSettle(selectedBet, next.hand); };
  const reset = () => { setHand([]); setDeck([]); setHeld([false, false, false, false, false]); setPhase('ready'); };
  return <View style={styles.videoPokerScreen}><ScreenHeader title="비디오 포커(Video Poker)" onBack={onBack} /><ScrollView contentContainerStyle={styles.videoPokerPage} showsVerticalScrollIndicator={false}>
    <View style={styles.videoPokerCabinet}>
      <View style={styles.videoPokerMarquee}><View style={styles.marqueeBulb} /><View><Text style={styles.videoPokerMarqueeSmall}>WORLD CASINO</Text><Text style={styles.videoPokerMarqueeTitle}>JACKS OR BETTER</Text></View><View style={styles.marqueeBulb} /></View>
      <View style={styles.videoPokerGlass}>
        <View style={styles.videoPokerMiniPaytable}><Text style={styles.videoPokerPayline}>ROYAL 250× · STRAIGHT FLUSH 50× · FOUR 25×</Text><Text style={styles.videoPokerPayline}>FULL HOUSE 9× · FLUSH 6× · STRAIGHT 4×</Text><Text style={styles.videoPokerPayline}>THREE 3× · TWO PAIR 2× · JACKS+ 1×</Text></View>
        <View style={styles.videoPokerMeters}><View><Text style={styles.videoPokerMeterLabel}>CREDIT</Text><Text style={styles.videoPokerMeterValue}>{coins.toLocaleString()}</Text></View><View><Text style={styles.videoPokerMeterLabel}>BET</Text><Text style={styles.videoPokerMeterValue}>{selectedBet.toLocaleString()}</Text></View><View><Text style={styles.videoPokerMeterLabel}>WIN</Text><Text style={styles.videoPokerMeterValue}>{result && result.multiplier > 0 ? videoPokerPayout(selectedBet, hand).toLocaleString() : '0'}</Text></View></View>
        <Text style={styles.videoPokerPrompt}>{phase === 'ready' ? '카드 5장을 받아보세요' : phase === 'hold' ? '카드를 눌러 HOLD' : result?.label}</Text><View style={styles.videoPokerHand}>{hand.length ? hand.map((card, index) => <Pressable key={card.id} disabled={phase !== 'hold'} onPress={() => setHeld((current) => current.map((value, cardIndex) => cardIndex === index ? !value : value))} style={[styles.videoPokerCardWrap, held[index] && styles.videoPokerHeld]}><PlayingCard card={card} compact emphasis={result?(result.multiplier>0?'winner':'dim'):undefined}/><Text style={[styles.videoPokerHoldLabel, held[index] && styles.videoPokerHoldActive]}>{held[index] ? 'HOLD' : phase === 'hold' ? '선택' : ' '}</Text></Pressable>) : [0,1,2,3,4].map((index) => <View key={index} style={[styles.playingCard, styles.compactPlayingCard, styles.hiddenCard, styles.videoPokerEmpty]}><Text style={styles.hiddenCardMark}>◆</Text></View>)}</View>{result && <View style={styles.videoPokerResult}><Text style={styles.resultTitle}>{result.label}</Text><Text style={[styles.resultNet, result.multiplier > 0 ? styles.positive : styles.negative]}>{result.multiplier > 0 ? `+${videoPokerPayout(selectedBet, hand).toLocaleString()} WC 지급` : `-${selectedBet.toLocaleString()} WC`}</Text></View>}
      </View>
      <View style={styles.videoPokerControlDeck}><View style={styles.videoPokerCoinSlot}><Text style={styles.videoPokerCoinSlotText}>WC</Text></View>{phase === 'ready' && <Pressable disabled={selectedBet > coins} onPress={deal} style={[styles.videoPokerDealButton, selectedBet > coins && styles.disabledCard]}><Text style={styles.videoPokerDealText}>DEAL</Text><Text style={styles.videoPokerDealSub}>카드 받기</Text></Pressable>}{phase === 'hold' && <Pressable onPress={draw} style={styles.videoPokerDealButton}><Text style={styles.videoPokerDealText}>DRAW</Text><Text style={styles.videoPokerDealSub}>카드 교환</Text></Pressable>}{phase === 'result' && <Pressable onPress={reset} style={styles.videoPokerDealButton}><Text style={styles.videoPokerDealText}>NEW GAME</Text><Text style={styles.videoPokerDealSub}>다시 베팅</Text></Pressable>}<View style={styles.videoPokerSpeaker}><Text style={styles.videoPokerSpeakerText}>••••</Text></View></View>
      <View style={styles.videoPokerBase}><Text style={styles.videoPokerBaseText}>INSERT WORLD COIN · TOUCH SCREEN</Text></View>
    </View>
    <View style={styles.videoPokerPaytable}><Text style={styles.slotRulesTitle}>게임 방법</Text><Text style={styles.slotRuleText}>실제 비디오 포커 기계처럼 카드 화면을 눌러 HOLD할 카드를 고릅니다.</Text><Text style={styles.slotRuleText}>DEAL로 시작하고 DRAW를 누르면 선택하지 않은 카드만 한 번 교환됩니다.</Text></View>
    <Text style={styles.sectionTitle}>베팅 금액</Text><View style={styles.betGrid}>{option.bets.map((amount) => <BetOptionCoin key={amount} amount={amount} selected={selectedBet === amount} disabled={phase !== 'ready'} onPress={() => onBetChange(amount)} />)}</View><Text style={styles.disclaimer}>첫 5장을 받은 뒤 한 번만 교환합니다 · 게임 전용 가상 코인</Text>
  </ScrollView></View>;
}

function FiveDrawSetupScreen(props: { coins:number; difficulty:string; selectedBet:number; onBack:()=>void; onDifficultyChange:(v:string)=>void; onBetChange:(v:number)=>void; onStart:()=>void }) {
  const option=difficultyOptions.find((item)=>item.name===props.difficulty)??difficultyOptions[2];
  return <View style={styles.detailScreen}><ScreenHeader title="파이브 카드 드로우(Five-card Draw) 준비" onBack={props.onBack}/><ScrollView contentContainerStyle={styles.detailPage}><View style={styles.holdemGuide}><Text style={styles.detailLead}>다섯 장을 한 번 교환해 완성하는 포커</Text><Text style={styles.slotRuleText}>나와 컴퓨터가 비공개 카드 5장씩을 받습니다.</Text><Text style={styles.slotRuleText}>남길 카드를 눌러 보관하고, 나머지 카드는 한 번만 교환합니다.</Text><Text style={styles.slotRuleText}>교환 뒤 체크·콜, 레이즈 또는 폴드를 선택하고 마지막에 족보를 비교합니다.</Text></View><Text style={styles.sectionTitle}>베팅 등급</Text><View style={styles.setupOptions}>{difficultyOptions.map((item)=><Pressable key={item.name} style={[styles.setupOption,props.difficulty===item.name&&styles.setupOptionActive]} onPress={()=>props.onDifficultyChange(item.name)}><Text style={[styles.setupOptionTitle,props.difficulty===item.name&&styles.setupOptionTitleActive]}>{betTierName(item.name)}</Text><Text style={styles.setupOptionRange}>{item.min.toLocaleString()}~{item.max.toLocaleString()} WC</Text></Pressable>)}</View><Text style={styles.sectionTitle}>시작 베팅</Text><View style={styles.betGrid}>{option.bets.map((amount,index)=><BetOptionCoin key={amount} amount={amount} level={index+1} selected={props.selectedBet===amount} disabled={amount>props.coins} onPress={()=>props.onBetChange(amount)}/>)}</View><Pressable disabled={props.selectedBet>props.coins} style={[styles.primaryButton,styles.fullWidthButton,props.selectedBet>props.coins&&styles.disabledCard]} onPress={props.onStart}><Text style={styles.primaryButtonText}>드로우 포커 시작</Text></Pressable></ScrollView></View>;
}

function FiveDrawGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:(stake:number,result:'win'|'loss'|'push',detail:string)=>void}) {
  const [phase,setPhase]=useState<'ready'|'draw'|'bet'|'result'>('ready'); const [player,setPlayer]=useState<Card[]>([]); const [opponent,setOpponent]=useState<Card[]>([]); const [drawPile,setDrawPile]=useState<Card[]>([]); const [held,setHeld]=useState([false,false,false,false,false]); const [totalBet,setTotalBet]=useState(0); const [opponentExchanged,setOpponentExchanged]=useState(0); const [outcome,setOutcome]=useState(''); const [showdown,setShowdown]=useState<ReturnType<typeof resolveFiveCardDraw>|null>(null);
  const start=()=>{if(!onPlaceBet(selectedBet))return;const deal=dealFiveCardDraw();setPlayer(deal.player);setOpponent(deal.opponent);setDrawPile(deal.drawPile);setHeld([false,false,false,false,false]);setTotalBet(selectedBet);setOpponentExchanged(0);setOutcome('남길 카드를 눌러 보관하세요');setShowdown(null);setPhase('draw');};
  const exchange=()=>{const mine=exchangeDrawCards(player,held,drawPile);const computerKeep=opponentKeepCards(opponent);const theirs=exchangeDrawCards(opponent,computerKeep,mine.drawPile);setPlayer(mine.hand);setOpponent(theirs.hand);setDrawPile(theirs.drawPile);setOpponentExchanged(theirs.exchanged);setOutcome(`나는 ${mine.exchanged}장 · 컴퓨터는 ${theirs.exchanged}장 교환`);setPhase('bet');};
  const finish=(fold=false,raise=false)=>{if(fold){setOutcome('폴드 · 상대 카드는 공개하지 않습니다');setShowdown(null);onSettle(totalBet,'loss','상대 패 비공개 · 폴드');setPhase('result');return;}let stake=totalBet;if(raise){if(!onPlaceBet(selectedBet))return;stake+=selectedBet;setTotalBet(stake);}const resolved=resolveFiveCardDraw(player,opponent);setShowdown(resolved);setOutcome(resolved.result==='win'?'내가 이겼습니다':resolved.result==='loss'?'컴퓨터가 이겼습니다':'무승부입니다');onSettle(stake,resolved.result,`${resolved.playerHand.label} vs ${resolved.opponentHand.label}`);setPhase('result');};
  const emphasis=(card:Card,side:'player'|'opponent'):'winner'|'selected'|'dim'|undefined=>{if(!showdown)return undefined;const own=madeHandCards(side==='player'?showdown.playerHand:showdown.opponentHand);if(!own.some((used)=>used.id===card.id))return'dim';if(showdown.result==='push')return'selected';return(side==='player')===(showdown.result==='win')?'winner':'selected';};
  return <View style={styles.detailScreen}><ScreenHeader title="파이브 카드 드로우(Five-card Draw)" onBack={onBack}/><ScrollView contentContainerStyle={styles.holdemPage}><View style={[styles.holdemTable,styles.fiveDrawTable]}><Text style={styles.holdemSeat}>컴퓨터</Text><View style={styles.fiveDrawHand}>{opponent.map((card)=><PlayingCard key={card.id} card={card} compact hidden={!showdown} emphasis={emphasis(card,'opponent')}/>)}</View>{phase==='bet'||phase==='result'?<Text style={styles.sevenPokerHint}>컴퓨터가 {opponentExchanged}장 교환</Text>:null}<Text style={styles.holdemPot}>POT {(totalBet*2).toLocaleString()} WC</Text><Text style={styles.holdemSeat}>나</Text><View style={styles.fiveDrawHand}>{player.map((card,index)=><Pressable key={card.id} disabled={phase!=='draw'} onPress={()=>setHeld((current)=>current.map((value,i)=>i===index?!value:value))} style={[styles.videoPokerCardWrap,held[index]&&phase==='draw'&&styles.videoPokerHeld]}><PlayingCard card={card} compact emphasis={emphasis(card,'player')}/>{phase==='draw'?<Text style={[styles.videoPokerHoldLabel,held[index]&&styles.videoPokerHoldActive]}>{held[index]?'보관':'교환'}</Text>:null}</Pressable>)}</View><Text style={styles.holdemOutcome}>{outcome||'카드 5장을 받아 시작하세요'}</Text>{showdown?<Text style={styles.pokerInlineResult}>내 패: {showdown.playerHand.label} · 상대 패: {showdown.opponentHand.label}</Text>:null}</View>{phase==='ready'||phase==='result'?<Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton]} onPress={start}><Text style={styles.primaryButtonText}>{phase==='result'?'다시 플레이':'카드 5장 받기'} · {selectedBet.toLocaleString()} WC</Text></Pressable>:phase==='draw'?<Pressable style={[styles.primaryButton,styles.fullWidthButton]} onPress={exchange}><Text style={styles.primaryButtonText}>선택 완료 · 카드 교환</Text></Pressable>:<View style={styles.holdemActions}><Pressable style={styles.holdemFold} onPress={()=>finish(true)}><Text style={styles.holdemActionText}>폴드</Text></Pressable><Pressable style={styles.holdemAction} onPress={()=>finish()}><Text style={styles.primaryButtonText}>체크/콜</Text></Pressable><Pressable disabled={selectedBet>coins} style={styles.holdemAction} onPress={()=>finish(false,true)}><Text style={styles.primaryButtonText}>레이즈 +{selectedBet}</Text></Pressable></View>}<Text style={styles.disclaimer}>상대 카드는 끝까지 승부했을 때만 공개됩니다 · 교환은 한 번</Text></ScrollView></View>;
}

function SevenPokerSetupScreen(props: { coins:number; difficulty:string; selectedBet:number; onBack:()=>void; onDifficultyChange:(v:string)=>void; onBetChange:(v:number)=>void; onStart:()=>void }) {
  const option=difficultyOptions.find((item)=>item.name===props.difficulty)??difficultyOptions[2];
  return <View style={styles.detailScreen}><ScreenHeader title="세븐 포커(Seven-card Poker) 준비" onBack={props.onBack}/><ScrollView contentContainerStyle={styles.detailPage}><View style={styles.holdemGuide}><Text style={styles.detailLead}>공개 카드와 비공개 카드로 심리전</Text><Text style={styles.slotRuleText}>처음 3장을 받은 뒤 한 장씩 추가되어 총 7장을 받습니다.</Text><Text style={styles.slotRuleText}>상대의 공개 카드는 볼 수 있지만 비공개 카드는 마지막 승부에서 공개됩니다.</Text><Text style={styles.slotRuleText}>7장 중 가장 강한 5장으로 승패를 정하며, 결과에는 실제 족보 카드만 강조됩니다.</Text></View><Text style={styles.sectionTitle}>베팅 등급</Text><View style={styles.setupOptions}>{difficultyOptions.map((item)=><Pressable key={item.name} style={[styles.setupOption,props.difficulty===item.name&&styles.setupOptionActive]} onPress={()=>props.onDifficultyChange(item.name)}><Text style={[styles.setupOptionTitle,props.difficulty===item.name&&styles.setupOptionTitleActive]}>{betTierName(item.name)}</Text><Text style={styles.setupOptionRange}>{item.min.toLocaleString()}~{item.max.toLocaleString()} WC</Text></Pressable>)}</View><Text style={styles.sectionTitle}>시작 베팅</Text><View style={styles.betGrid}>{option.bets.map((amount,index)=><BetOptionCoin key={amount} amount={amount} level={index+1} selected={props.selectedBet===amount} disabled={amount>props.coins} onPress={()=>props.onBetChange(amount)}/>)}</View><Pressable disabled={props.selectedBet>props.coins} style={[styles.primaryButton,styles.fullWidthButton,props.selectedBet>props.coins&&styles.disabledCard]} onPress={props.onStart}><Text style={styles.primaryButtonText}>세븐 포커 시작</Text></Pressable></ScrollView></View>;
}

function SevenPokerGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:(stake:number,result:'win'|'loss'|'push',detail:string)=>void}) {
  const [round,setRound]=useState<ReturnType<typeof dealSevenPoker>|null>(null); const [stage,setStage]=useState(0); const [totalBet,setTotalBet]=useState(0); const [outcome,setOutcome]=useState(''); const [showdown,setShowdown]=useState<ReturnType<typeof resolveSevenPoker>|null>(null); const [foldedVisible,setFoldedVisible]=useState(0);
  const start=()=>{if(!onPlaceBet(selectedBet))return;setRound(dealSevenPoker());setStage(1);setTotalBet(selectedBet);setOutcome('');setShowdown(null);setFoldedVisible(0);};
  const finish=(fold=false)=>{if(!round)return;if(fold){setFoldedVisible(stage+2);setOutcome('폴드 · 패배 · 상대 비공개 카드는 공개하지 않습니다');setShowdown(null);onSettle(totalBet,'loss','상대 패 비공개 · 중간 폴드');setStage(5);return;}const resolved=resolveSevenPoker(round.player,round.opponent);setShowdown(resolved);setOutcome(resolved.result==='win'?'내가 이겼습니다':resolved.result==='loss'?'컴퓨터가 이겼습니다':'무승부입니다');onSettle(totalBet,resolved.result,`${resolved.playerHand.label} vs ${resolved.opponentHand.label}`);setStage(5);};
  const next=()=>stage<4?setStage(stage+1):finish(); const raise=()=>{if(onPlaceBet(selectedBet)){setTotalBet((value)=>value+selectedBet);next();}}; const visible=stage===0?0:stage===5&&!showdown&&foldedVisible?foldedVisible:stage+2;
  const emphasis=(card:Card,side:'player'|'opponent'):'winner'|'selected'|'dim'|undefined=>{if(!showdown)return undefined;const own=madeHandCards(side==='player'?showdown.playerHand:showdown.opponentHand);if(!own.some((used)=>used.id===card.id))return'dim';if(showdown.result==='push')return'selected';return(side==='player')===(showdown.result==='win')?'winner':'selected';};
  const cards=(side:'player'|'opponent')=>(round?.[side].slice(0,visible)??[]).map((card,index)=>{const privateCard=index<2||index===6;const label=privateCard?(side==='player'?'나만 보기':'비공개'):'모두 공개';return <View key={card.id} style={styles.sevenPokerCardSlot}><PlayingCard card={card} compact hidden={side==='opponent'&&!showdown&&privateCard} emphasis={emphasis(card,side)}/><Text style={[styles.sevenPokerVisibility,privateCard?styles.sevenPokerPrivate:styles.sevenPokerPublic]}>{label}</Text></View>;});
  return <View style={styles.detailScreen}><ScreenHeader title="세븐 포커(Seven-card Poker)" onBack={onBack}/><ScrollView contentContainerStyle={styles.holdemPage}><View style={[styles.holdemTable,styles.sevenPokerTable]}><Text style={styles.holdemSeat}>컴퓨터</Text><Text style={styles.sevenPokerHint}>{showdown?'모든 카드 공개':stage===5?'폴드 · 비공개 유지':'앞의 2장은 비공개'}</Text><View style={styles.sevenPokerCards}>{cards('opponent')}</View><Text style={styles.holdemPot}>POT {(totalBet*2).toLocaleString()} WC</Text><Text style={styles.holdemSeat}>나</Text><View style={styles.sevenPokerCards}>{cards('player')}</View>{outcome?<Text style={styles.holdemOutcome}>{outcome}</Text>:null}{showdown?<Text style={styles.pokerInlineResult}>내 패: {showdown.playerHand.label} · 상대 패: {showdown.opponentHand.label}</Text>:null}</View>{stage===0||stage===5?<Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton]} onPress={start}><Text style={styles.primaryButtonText}>{stage===5?'다시 플레이':'처음 3장 받기'} · {selectedBet.toLocaleString()} WC</Text></Pressable>:<View style={styles.holdemActions}><Pressable style={styles.holdemFold} onPress={()=>finish(true)}><Text style={styles.holdemActionText}>폴드</Text></Pressable><Pressable style={styles.holdemAction} onPress={next}><Text style={styles.primaryButtonText}>체크/콜</Text></Pressable><Pressable disabled={selectedBet>coins} style={styles.holdemAction} onPress={raise}><Text style={styles.primaryButtonText}>레이즈 +{selectedBet}</Text></Pressable></View>}<Text style={styles.disclaimer}>현재 단계: {['대기','첫 3장','네 번째 카드','다섯 번째 카드','여섯 번째 카드','마지막 승부'][stage]}</Text></ScrollView></View>;
}

function PokerSetupScreen(props: { mode:'holdem'|'omaha'; coins:number; difficulty:string; selectedBet:number; onBack:()=>void; onDifficultyChange:(v:string)=>void; onBetChange:(v:number)=>void; onStart:()=>void }) {
  const option=difficultyOptions.find((item)=>item.name===props.difficulty)??difficultyOptions[2];
  const omaha=props.mode==='omaha'; return <View style={styles.detailScreen}><ScreenHeader title={omaha?'오마하(Omaha) 준비':'텍사스 홀덤(Texas Hold’em) 준비'} onBack={props.onBack}/><ScrollView contentContainerStyle={styles.detailPage}><View style={styles.holdemGuide}><Text style={styles.detailLead}>{omaha?'네 장과 공용 카드로 승부':'두 장과 공용 카드로 승부'}</Text><Text style={styles.slotRuleText}>{omaha?'개인 카드 4장 중 정확히 2장과 공용 카드 중 정확히 3장을 반드시 사용합니다.':'내 카드 2장과 공용 카드 5장, 총 7장 중 가장 강한 5장 족보를 만듭니다.'}</Text><Text style={styles.slotRuleText}>플랍 3장 → 턴 1장 → 리버 1장 순서로 공개됩니다.</Text><Text style={styles.slotRuleText}>컴퓨터 한 명과 대결합니다.</Text></View><Text style={styles.sectionTitle}>베팅 등급</Text><View style={styles.setupOptions}>{difficultyOptions.map((item)=><Pressable key={item.name} style={[styles.setupOption,props.difficulty===item.name&&styles.setupOptionActive]} onPress={()=>props.onDifficultyChange(item.name)}><Text style={[styles.setupOptionTitle,props.difficulty===item.name&&styles.setupOptionTitleActive]}>{betTierName(item.name)}</Text><Text style={styles.setupOptionRange}>{item.min.toLocaleString()}~{item.max.toLocaleString()} WC</Text></Pressable>)}</View><Text style={styles.sectionTitle}>시작 베팅</Text><View style={styles.betGrid}>{option.bets.map((amount,index)=><BetOptionCoin key={amount} amount={amount} level={index+1} selected={props.selectedBet===amount} disabled={amount>props.coins} onPress={()=>props.onBetChange(amount)}/>)}</View><Pressable disabled={props.selectedBet>props.coins} style={[styles.primaryButton,styles.fullWidthButton,props.selectedBet>props.coins&&styles.disabledCard]} onPress={props.onStart}><Text style={styles.primaryButtonText}>테이블 입장</Text></Pressable></ScrollView></View>;
}

function PokerGameScreen({mode,coins,selectedBet,onBack,onPlaceBet,onSettle}:{mode:'holdem'|'omaha';coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:(stake:number,result:'win'|'loss'|'push',detail:string)=>void}) {
  const [round,setRound]=useState<ReturnType<typeof dealHoldem>|null>(null); const [stage,setStage]=useState(0); const [totalBet,setTotalBet]=useState(0); const [outcome,setOutcome]=useState(''); const [showdown,setShowdown]=useState<ReturnType<typeof resolveHoldem>|null>(null); const omaha=mode==='omaha';
  const start=()=>{ if(!onPlaceBet(selectedBet))return; setRound(omaha?dealOmaha():dealHoldem()); setStage(1); setTotalBet(selectedBet); setOutcome(''); setShowdown(null); };
  const finish=(fold=false)=>{ if(!round)return; if(fold){ setOutcome('폴드 · 패배'); setShowdown(null); onSettle(totalBet,'loss','리버 전 폴드'); setStage(5); return; } const resolved=omaha?resolveOmaha(round.player,round.opponent,round.community):resolveHoldem(round.player,round.opponent,round.community); setShowdown(resolved); setOutcome(resolved.result==='win'?'내가 이겼습니다':resolved.result==='loss'?'컴퓨터가 이겼습니다':'무승부입니다'); onSettle(totalBet,resolved.result,`${resolved.playerHand.label} vs ${resolved.opponentHand.label}`); setStage(5); };
  const next=()=>{ if(stage<4)setStage(stage+1); else finish(); }; const raise=()=>{ if(onPlaceBet(selectedBet)){setTotalBet((v)=>v+selectedBet); next();} };
  const shown=stage===1?0:stage===2?3:stage===3?4:5;
  const inHand=(card:Card,hand?:Card[])=>Boolean(hand?.some((used)=>used.id===card.id));
  const pokerEmphasis=(card:Card,side:'player'|'opponent'|'community'):'winner'|'selected'|'dim'|undefined=>{ if(!showdown)return undefined; const playerCards=madeHandCards(showdown.playerHand); const opponentCards=madeHandCards(showdown.opponentHand); const own=side==='opponent'?opponentCards:playerCards; const winner=showdown.result==='win'?playerCards:showdown.result==='loss'?opponentCards:null; if(side==='community')return winner&&inHand(card,winner)?'winner':inHand(card,playerCards)||inHand(card,opponentCards)?'selected':'dim'; if(inHand(card,own))return showdown.result==='push'?'selected':(side==='player')===(showdown.result==='win')?'winner':'selected'; return 'dim'; };
  return <View style={styles.detailScreen}><ScreenHeader title={omaha?'오마하(Omaha)':'텍사스 홀덤(Texas Hold’em)'} onBack={onBack}/><ScrollView contentContainerStyle={styles.holdemPage}><View style={styles.holdemTable}><Text style={styles.holdemSeat}>컴퓨터</Text><View style={styles.holdemCards}>{round?round.opponent.map((c)=><PlayingCard key={c.id} card={c} hidden={stage<5} compact emphasis={pokerEmphasis(c,'opponent')}/>):null}</View><Text style={styles.holdemPot}>POT {(totalBet*2).toLocaleString()} WC</Text><View style={styles.holdemCommunity}>{round?.community.slice(0,shown).map((c)=>{const common=Boolean(showdown&&inHand(c,madeHandCards(showdown.playerHand))&&inHand(c,madeHandCards(showdown.opponentHand)));return <View key={c.id} style={styles.pokerBoardCard}><PlayingCard card={c} compact emphasis={pokerEmphasis(c,'community')}/>{common&&<Text style={styles.pokerCommonBadge}>공통</Text>}</View>;})}{Array.from({length:5-shown},(_,i)=><View key={i} style={[styles.playingCard,styles.compactPlayingCard,styles.hiddenCard]}><Text style={styles.hiddenCardMark}>◆</Text></View>)}</View><Text style={styles.holdemSeat}>나</Text><View style={styles.holdemCards}>{round?.player.map((c)=><PlayingCard key={c.id} card={c} compact emphasis={pokerEmphasis(c,'player')}/>)}</View>{outcome?<Text style={styles.holdemOutcome}>{outcome}</Text>:null}{showdown&&<Text style={styles.pokerInlineResult}>내 패: {showdown.playerHand.label}  ·  상대 패: {showdown.opponentHand.label}</Text>}</View>{stage===0||stage===5?<Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton]} onPress={start}><Text style={styles.primaryButtonText}>{stage===5?'다시 플레이':'카드 받기'} · {selectedBet.toLocaleString()} WC</Text></Pressable>:<View style={styles.holdemActions}><Pressable style={styles.holdemFold} onPress={()=>finish(true)}><Text style={styles.holdemActionText}>폴드</Text></Pressable><Pressable style={styles.holdemAction} onPress={next}><Text style={styles.primaryButtonText}>체크/콜</Text></Pressable><Pressable disabled={selectedBet>coins} style={styles.holdemAction} onPress={raise}><Text style={styles.primaryButtonText}>레이즈 +{selectedBet}</Text></Pressable></View>}<Text style={styles.disclaimer}>현재 단계: {['대기','프리플랍','플랍','턴','리버','결과'][stage]}</Text></ScrollView></View>;
}

function PlayingCard({ card, hidden = false, compact = false, emphasis }: { card: Card; hidden?: boolean; compact?: boolean; emphasis?: 'winner'|'selected'|'dim' }) {
  if (hidden) {
    return <View style={[styles.playingCard, compact && styles.compactPlayingCard, styles.hiddenCard]}><Text style={styles.hiddenCardMark}>◆</Text></View>;
  }
  const red = card.suit === '♥' || card.suit === '♦';
  return (
    <View style={[styles.playingCard, compact && styles.compactPlayingCard, emphasis==='winner'&&styles.cardWinner, emphasis==='selected'&&styles.cardSelected, emphasis==='dim'&&styles.cardDim]}>
      <Text style={[styles.playingCardRank, red && styles.redCard]}>{card.rank}</Text>
      <Text style={[styles.playingCardSuit, red && styles.redCard]}>{card.suit}</Text>
    </View>
  );
}

function BlackjackGameScreen(props: {
  bet: number;
  coins: number;
  difficulty: string;
  onDoubleDown: () => boolean;
  onPlaceInsurance: (stake: number) => boolean;
  onSettleInsurance: (won: boolean, stake: number) => void;
  onSettle: (result: RoundResult, roundBet?: number) => void;
  onPlayAgain: () => void;
  onExit: () => void;
}) {
  const initial = useRef(dealInitialRound(shuffleDeck(createDeck()))).current;
  const [deck, setDeck] = useState(initial.deck);
  const [player, setPlayer] = useState(initial.player);
  const [dealer, setDealer] = useState(initial.dealer);
  const [phase, setPhase] = useState<'player' | 'result'>('player');
  const [result, setResult] = useState<RoundResult | null>(null);
  const [totalBet, setTotalBet] = useState(props.bet);
  const [splitHand, setSplitHand] = useState<Card[] | null>(null);
  const [activeHand, setActiveHand] = useState<0 | 1>(0);
  const [splitResults, setSplitResults] = useState<RoundResult[] | null>(null);
  const insuranceAmount = insuranceStake(props.bet);
  const [insuranceOpen, setInsuranceOpen] = useState(initial.dealer[0].rank === 'A');
  const [insuranceMessage, setInsuranceMessage] = useState<string | null>(null);
  const settled = useRef(false);

  const completeRound = (nextPlayer: Card[], nextDealer: Card[], nextDeck: Card[], roundBet = totalBet) => {
    const nextResult = resolveRound(nextPlayer, nextDealer);
    setPlayer(nextPlayer);
    setDealer(nextDealer);
    setDeck(nextDeck);
    setResult(nextResult);
    setTotalBet(roundBet);
    setPhase('result');
    if (!settled.current) {
      settled.current = true;
      props.onSettle(nextResult, roundBet);
    }
  };

  useEffect(() => {
    if (initial.dealer[0].rank === 'A') return;
    if (isBlackjack(initial.player) || isBlackjack(initial.dealer)) {
      completeRound(initial.player, initial.dealer, initial.deck);
    }
  }, []);

  const decideInsurance = (takeInsurance: boolean) => {
    if (!insuranceOpen) return;
    const dealerBlackjack = isBlackjack(dealer);
    if (takeInsurance) {
      if (!props.onPlaceInsurance(insuranceAmount)) return;
      props.onSettleInsurance(dealerBlackjack, insuranceAmount);
      setInsuranceMessage(dealerBlackjack ? `보험 적중 · +${(insuranceAmount * 2).toLocaleString()} WC` : `보험 손실 · -${insuranceAmount.toLocaleString()} WC`);
    } else {
      setInsuranceMessage('보험을 선택하지 않았습니다');
    }
    setInsuranceOpen(false);
    if (dealerBlackjack || isBlackjack(player)) {
      completeRound(player, dealer, deck);
    }
  };

  const hit = () => {
    if (phase !== 'player') return;
    const currentHand = activeHand === 0 ? player : splitHand!;
    const next = drawCard(deck, currentHand);
    setDeck(next.deck);
    if (activeHand === 0) setPlayer(next.hand); else setSplitHand(next.hand);
    if (handValue(next.hand) >= 21) {
      if (splitHand) {
        if (activeHand === 0) {
          setActiveHand(1);
        } else {
          finishSplit(player, next.hand, next.deck);
        }
        return;
      }
      if (handValue(next.hand) > 21) {
        completeRound(next.hand, dealer, next.deck);
      } else {
        const dealerResult = playDealer(next.deck, dealer);
        completeRound(next.hand, dealerResult.hand, dealerResult.deck);
      }
    }
  };

  const stand = () => {
    if (phase !== 'player') return;
    if (splitHand) {
      if (activeHand === 0) {
        setActiveHand(1);
      } else {
        finishSplit(player, splitHand, deck);
      }
      return;
    }
    const dealerResult = playDealer(deck, dealer);
    completeRound(player, dealerResult.hand, dealerResult.deck);
  };

  const finishSplit = (firstHand: Card[], secondHand: Card[], nextDeck: Card[]) => {
    const dealerResult = playDealer(nextDeck, dealer);
    const results = [resolveRound(firstHand, dealerResult.hand), resolveRound(secondHand, dealerResult.hand)];
    setPlayer(firstHand);
    setSplitHand(secondHand);
    setDealer(dealerResult.hand);
    setDeck(dealerResult.deck);
    setSplitResults(results);
    setPhase('result');
    if (!settled.current) {
      settled.current = true;
      props.onSettle(results[0], props.bet);
      props.onSettle(results[1], props.bet);
    }
  };

  const split = () => {
    if (phase !== 'player' || !canSplit(player) || !props.onDoubleDown()) return;
    const firstDraw = drawCard(deck, [player[0]]);
    const secondDraw = drawCard(firstDraw.deck, [player[1]]);
    setPlayer(firstDraw.hand);
    setSplitHand(secondDraw.hand);
    setDeck(secondDraw.deck);
    setTotalBet(props.bet * 2);
    setActiveHand(0);
  };

  const doubleDown = () => {
    if (phase !== 'player' || splitHand || player.length !== 2 || !props.onDoubleDown()) return;
    const doubledBet = props.bet * 2;
    const next = drawCard(deck, player);
    if (handValue(next.hand) > 21) {
      completeRound(next.hand, dealer, next.deck, doubledBet);
      return;
    }
    const dealerResult = playDealer(next.deck, dealer);
    completeRound(next.hand, dealerResult.hand, dealerResult.deck, doubledBet);
  };

  const net = result ? netForResult(totalBet, result) : 0;
  const splitNet = splitResults ? splitResults.reduce((sum, item) => sum + netForResult(props.bet, item), 0) : 0;
  const dealerScore = phase === 'result' ? handValue(dealer) : '?';

  return (
    <View style={styles.blackjackTable}>
      <View style={styles.gameTopBar}>
        <Text style={styles.gameTopTitle}>블랙잭(BLACKJACK)</Text>
        <View style={styles.gameTopActions}><View style={styles.gameBetPill}><CoinStack amount={totalBet} compact /><Text style={styles.gameBetText}>베팅 중</Text></View><Pressable accessibilityRole="button" accessibilityLabel="블랙잭 나가기" style={styles.gameExitButton} onPress={props.onExit}><Text style={styles.gameExitButtonText}>나가기</Text></Pressable></View>
      </View>

      <ScrollView contentContainerStyle={styles.tableContent} showsVerticalScrollIndicator={false}>
        <View style={styles.handHeader}>
          <Text style={styles.handTitle}>딜러</Text>
          <Text style={styles.scoreBadge}>{dealerScore}</Text>
        </View>
        <View style={styles.cardRow}>
          {dealer.map((card, index) => <PlayingCard key={`${card.id}-${index}`} card={card} hidden={phase === 'player' && index === 1} emphasis={phase==='result'&&result?(result==='loss'?'winner':result==='push'?'selected':'dim'):undefined} />)}
        </View>

        <View style={styles.tableRule}><Text style={styles.tableRuleText}>딜러는 17 이상에서 멈춥니다</Text></View>

        {insuranceOpen && (
          <View style={styles.insurancePanel}>
            <Text style={styles.insuranceTitle}>딜러의 공개 카드가 에이스입니다</Text>
            <Text style={styles.insuranceText}>보험 {insuranceAmount.toLocaleString()} WC를 걸까요? 딜러가 블랙잭이면 2대1 이익을 받습니다.</Text>
            <View style={styles.gameActions}>
              <Pressable
                disabled={props.coins < insuranceAmount}
                style={[styles.gameActionButton, styles.insuranceButton, props.coins < insuranceAmount && styles.disabledCard]}
                onPress={() => decideInsurance(true)}
              ><Text style={styles.gameActionText}>보험 가입</Text></Pressable>
              <Pressable style={[styles.gameActionButton, styles.standButton]} onPress={() => decideInsurance(false)}><Text style={styles.gameActionText}>가입 안 함</Text></Pressable>
            </View>
          </View>
        )}
        {insuranceMessage && <Text style={styles.insuranceMessage}>{insuranceMessage}</Text>}

        <View style={styles.handHeader}>
          <Text style={styles.handTitle}>{splitHand ? `손 1${phase === 'player' && activeHand === 0 ? ' · 진행 중' : ''}` : '플레이어'}</Text>
          <Text style={styles.scoreBadge}>{handValue(player)}</Text>
        </View>
        <View style={styles.cardRow}>
          {player.map((card, index) => <PlayingCard key={`${card.id}-${index}`} card={card} emphasis={phase==='result'&&result?(result==='win'||result==='blackjack'?'winner':result==='push'?'selected':'dim'):undefined} />)}
        </View>

        {splitHand && (
          <>
            <View style={styles.handHeader}>
              <Text style={styles.handTitle}>손 2{phase === 'player' && activeHand === 1 ? ' · 진행 중' : ''}</Text>
              <Text style={styles.scoreBadge}>{handValue(splitHand)}</Text>
            </View>
            <View style={styles.cardRow}>
              {splitHand.map((card, index) => <PlayingCard key={`split-${card.id}-${index}`} card={card} />)}
            </View>
          </>
        )}

        {phase === 'player' && !insuranceOpen && (
          <View>
            <View style={styles.gameActions}>
            <Pressable style={[styles.gameActionButton, styles.hitButton]} onPress={hit}><Text style={styles.gameActionText}>히트</Text><Text style={styles.gameActionSubtext}>카드 받기</Text></Pressable>
            <Pressable style={[styles.gameActionButton, styles.standButton]} onPress={stand}><Text style={styles.gameActionText}>스탠드</Text><Text style={styles.gameActionSubtext}>멈추기</Text></Pressable>
            </View>
            {!splitHand && player.length === 2 && (
              <Pressable
                disabled={props.coins < props.bet}
                style={[styles.doubleButton, props.coins < props.bet && styles.disabledCard]}
                onPress={doubleDown}
              >
                <Text style={styles.doubleButtonText}>더블다운 · {props.bet.toLocaleString()} WC 추가</Text>
                <Text style={styles.doubleButtonSubtext}>베팅을 두 배로 올리고 카드 한 장만 받기</Text>
              </Pressable>
            )}
            {!splitHand && canSplit(player) && (
              <Pressable
                disabled={props.coins < props.bet}
                style={[styles.splitButton, props.coins < props.bet && styles.disabledCard]}
                onPress={split}
              >
                <Text style={styles.doubleButtonText}>스플릿 · {props.bet.toLocaleString()} WC 추가</Text>
                <Text style={styles.doubleButtonSubtext}>같은 값의 카드 두 장을 두 손으로 나누기</Text>
              </Pressable>
            )}
          </View>
        )}

        {phase === 'result' && splitResults && splitHand && (
          <View style={styles.resultPanel}>
            <Text style={styles.resultTitle}>스플릿 결과</Text>
            <Text style={[styles.resultNet, splitNet > 0 && styles.positive, splitNet < 0 && styles.negative]}>{splitNet > 0 ? '+' : ''}{splitNet.toLocaleString()} WC</Text>
            <Text style={styles.resultDetail}>손 1 {resultLabel(splitResults[0])} · 손 2 {resultLabel(splitResults[1])}</Text>
            <Pressable disabled={props.coins < props.bet} style={[styles.primaryButton, styles.fullWidthButton, props.coins < props.bet && styles.disabledCard]} onPress={props.onPlayAgain}>
              <Text style={styles.primaryButtonText}>새 게임 시작</Text>
            </Pressable>
            <Pressable style={styles.exitButton} onPress={props.onExit}><Text style={styles.exitButtonText}>카지노 목록으로</Text></Pressable>
          </View>
        )}

        {phase === 'result' && result && !splitResults && (
          <View style={styles.resultPanel}>
            <Text style={styles.resultTitle}>{resultLabel(result)}</Text>
            <Text style={[styles.resultNet, net > 0 && styles.positive, net < 0 && styles.negative]}>{net > 0 ? '+' : ''}{net.toLocaleString()} WC</Text>
            <Text style={styles.resultDetail}>플레이어 {handValue(player)} · 딜러 {handValue(dealer)}</Text>
            <Pressable disabled={props.coins < props.bet} style={[styles.primaryButton, styles.fullWidthButton, props.coins < props.bet && styles.disabledCard]} onPress={props.onPlayAgain}>
              <Text style={styles.primaryButtonText}>같은 금액으로 다시 하기</Text>
            </Pressable>
            <Pressable style={styles.exitButton} onPress={props.onExit}><Text style={styles.exitButtonText}>카지노 목록으로</Text></Pressable>
          </View>
        )}

        <Text style={styles.gameFooter}>베팅 등급 {betTierName(props.difficulty)} · 게임 전용 가상 코인</Text>
      </ScrollView>
    </View>
  );
}

function CrapsRules() {
  return <View style={styles.baccaratRules}><Text style={styles.baccaratRulesTitle}>처음에는 세 가지 베팅만 알면 돼요</Text><Text style={styles.baccaratRuleText}>패스 라인: 첫 굴림 7·11 승리, 2·3·12 패배. 그 외에는 포인트가 됩니다.</Text><Text style={styles.baccaratRuleText}>돈트 패스: 패스 라인의 반대이며, 첫 굴림 12는 무승부입니다.</Text><Text style={styles.baccaratRuleText}>필드: 한 번만 굴려 2·3·4·9·10·11·12면 승리합니다.</Text><Text style={styles.baccaratRuleText}>포인트가 정해지면 같은 숫자가 7보다 먼저 나오면 패스 라인이 이깁니다.</Text></View>;
}

function CrapsSetupScreen(props: { coins: number; difficulty: string; selectedBet: number; onBack: () => void; onDifficultyChange: (value: string) => void; onBetChange: (value: number) => void; onStart: () => void }) {
  const option = difficultyOptions.find((item) => item.name === props.difficulty) ?? difficultyOptions[2];
  return <View style={styles.detailScreen}><ScreenHeader title="크랩스(Craps) 준비" onBack={props.onBack} /><ScrollView contentContainerStyle={styles.detailPage} showsVerticalScrollIndicator={false}><View style={styles.crapsSetupHero}><Text style={styles.crapsHeroDice}>⚄ ⚂</Text><Text style={styles.detailLead}>주사위 합으로 승부</Text><Text style={styles.gameListDescription}>두 주사위를 굴리고 포인트가 7보다 먼저 나올지 예측합니다.</Text></View><CrapsRules /><Text style={styles.sectionTitle}>베팅 등급</Text><View style={styles.setupOptions}>{difficultyOptions.map((item) => <Pressable key={item.name} style={[styles.setupOption, props.difficulty === item.name && styles.setupOptionActive]} onPress={() => props.onDifficultyChange(item.name)}><Text style={[styles.setupOptionTitle, props.difficulty === item.name && styles.setupOptionTitleActive]}>{betTierName(item.name)}</Text><Text style={styles.setupOptionRange}>{item.min.toLocaleString()}~{item.max.toLocaleString()} WC</Text></Pressable>)}</View><Text style={styles.sectionTitle}>시작 베팅 금액</Text><View style={styles.betGrid}>{option.bets.map((amount, index) => <BetOptionCoin key={amount} amount={amount} level={index + 1} selected={props.selectedBet === amount} onPress={() => props.onBetChange(amount)} />)}</View><View style={styles.setupSummary}><Row title="보유 코인" value={`${props.coins.toLocaleString()} WC`} /><View style={styles.separator} /><Row title="베팅 등급" value={betTierName(props.difficulty)} /><View style={styles.separator} /><Row title="선택 베팅" value={`${props.selectedBet.toLocaleString()} WC`} /></View><Pressable style={[styles.primaryButton, styles.fullWidthButton]} onPress={props.onStart}><Text style={styles.primaryButtonText}>크랩스(Craps) 시작</Text></Pressable></ScrollView></View>;
}

function Die({ value }: { value: number }) { return <View style={styles.die}><Text style={styles.dieText}>{['','⚀','⚁','⚂','⚃','⚄','⚅'][value]}</Text></View>; }

function CrapsGameScreen({ coins, difficulty: savedTier, selectedBet, onBack, onBetChange, onPlaceBet, onSettle }: { coins: number; difficulty: string; selectedBet: number; onBack: () => void; onBetChange: (value: number) => void; onPlaceBet: (stake: number) => boolean; onSettle: (bet: CrapsBet, stake: number, result: CrapsRollResult) => void }) {
  const [bet, setBet] = useState<CrapsBet>('pass'); const [point, setPoint] = useState<number | null>(null); const [last, setLast] = useState<CrapsRollResult | null>(null); const [active, setActive] = useState(false); const option = difficultyOptions.find((item) => item.name === savedTier) ?? difficultyOptions[2]; const difficulty = betTierName(savedTier);
  const names = { pass: '패스 라인', dontPass: '돈트 패스', field: '필드' } as const;
  const roll = () => { if (!active && !onPlaceBet(selectedBet)) return; const result = resolveCrapsRoll(bet, point, rollDice()); setLast(result); if (result.outcome === 'continue') { setPoint(result.point); setActive(true); } else { setPoint(null); setActive(false); onSettle(bet, selectedBet, result); } };
  return <View style={styles.crapsScreen}><ScreenHeader title="크랩스(Craps)" onBack={onBack} /><ScrollView contentContainerStyle={styles.crapsPage} showsVerticalScrollIndicator={false}><View style={styles.rouletteStatusRow}><View><Text style={styles.eyebrow}>CRAPS</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View><View style={styles.difficultyBadge}><Text style={styles.difficultyBadgeText}>{difficulty}</Text></View></View><View style={styles.crapsTable}><Text style={styles.crapsPointLabel}>{point ? `POINT ${point}` : 'COME OUT'}</Text><View style={styles.diceRow}>{last ? <><Die value={last.dice[0]} /><Die value={last.dice[1]} /></> : <><Die value={1} /><Die value={6} /></>}</View><Text style={styles.crapsTotal}>{last ? `합계 ${last.total}` : '주사위를 굴려보세요'}</Text>{last?.outcome === 'continue' && <Text style={styles.crapsContinue}>포인트 {last.point} · 다시 굴리세요</Text>}{last && last.outcome !== 'continue' && <Text style={[styles.crapsOutcome, last.outcome === 'win' ? styles.positive : last.outcome === 'loss' ? styles.negative : null]}>{last.outcome === 'win' ? '승리' : last.outcome === 'loss' ? '패배' : '무승부'} · {crapsNet(bet, selectedBet, last) > 0 ? '+' : ''}{crapsNet(bet, selectedBet, last).toLocaleString()} WC</Text>}</View><Pressable style={[styles.primaryButton, styles.rouletteSpinButton, styles.gameResultAction]} onPress={roll}><Text style={styles.primaryButtonText}>{active ? `포인트 ${point} · 다시 굴리기` : `${names[bet]}에 ${selectedBet.toLocaleString()} WC 베팅`}</Text></Pressable><Text style={styles.sectionTitle}>베팅 위치</Text><View style={styles.crapsBetGrid}>{(['pass','dontPass','field'] as CrapsBet[]).map((item) => <Pressable key={item} disabled={active} style={[styles.crapsBetArea, bet === item && styles.baccaratBetActive]} onPress={() => { setBet(item); setLast(null); }} >{bet === item && !active && <CoinStack amount={selectedBet} compact />}<Text style={styles.baccaratBetTitle}>{names[item]}</Text><Text style={styles.baccaratOdds}>{item === 'field' ? '한 번 굴림' : '1:1'}</Text></Pressable>)}</View><Text style={styles.sectionTitle}>베팅 금액</Text><View style={styles.betGrid}>{option.bets.map((amount, index) => <BetOptionCoin key={amount} amount={amount} level={index + 1} selected={selectedBet === amount} disabled={active} onPress={() => onBetChange(amount)} />)}</View><Text style={styles.disclaimer}>게임 전용 가상 코인 · 필드 2·12는 2배 수익</Text></ScrollView></View>;
}

function BaccaratRules({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.baccaratRules, compact && styles.baccaratRulesCompact]}>
      <Text style={styles.baccaratRulesTitle}>처음이어도 이것만 알면 돼요</Text>
      <Text style={styles.baccaratRuleText}>1. 플레이어와 뱅커 중 카드 합계가 9에 가까운 쪽이 이깁니다.</Text>
      <Text style={styles.baccaratRuleText}>2. A는 1점, 10·J·Q·K는 0점입니다.</Text>
      <Text style={styles.baccaratRuleText}>3. 합계는 마지막 숫자만 사용합니다. 예: 7+8=15 → 5점</Text>
      <Text style={styles.baccaratRuleText}>4. 세 번째 카드는 앱이 공식 규칙에 따라 자동으로 나눕니다.</Text>
      <View style={styles.baccaratOddsGuide}><Text style={styles.baccaratOddsGuideText}>플레이어 1:1</Text><Text style={styles.baccaratOddsGuideText}>뱅커 0.95:1</Text><Text style={styles.baccaratOddsGuideText}>타이 8:1</Text></View>
    </View>
  );
}

function BaccaratSetupScreen(props: {
  coins: number;
  difficulty: string;
  selectedBet: number;
  onBack: () => void;
  onDifficultyChange: (value: string) => void;
  onBetChange: (value: number) => void;
  onStart: () => void;
}) {
  const difficultyOption = difficultyOptions.find((item) => item.name === props.difficulty) ?? difficultyOptions[2];
  return (
    <View style={styles.detailScreen}>
      <ScreenHeader title="바카라(Baccarat) 준비" onBack={props.onBack} />
      <ScrollView contentContainerStyle={styles.detailPage} showsVerticalScrollIndicator={false}>
        <View style={styles.baccaratSetupHero}><Text style={styles.baccaratSetupIcon}>◆</Text><View style={styles.baccaratSetupCopy}><Text style={styles.eyebrow}>BACCARAT GUIDE</Text><Text style={styles.detailLead}>누가 9에 가까울까요?</Text><Text style={styles.gameListDescription}>선택만 하면 카드 배분과 계산은 앱이 자동으로 합니다.</Text></View></View>
        <BaccaratRules />

        <Text style={styles.sectionTitle}>베팅 등급</Text>
        <View style={styles.setupOptions}>{difficultyOptions.map((option) => <Pressable key={option.name} style={[styles.setupOption, props.difficulty === option.name && styles.setupOptionActive]} onPress={() => props.onDifficultyChange(option.name)}><Text style={[styles.setupOptionTitle, props.difficulty === option.name && styles.setupOptionTitleActive]}>{betTierName(option.name)}</Text><Text style={styles.setupOptionRange}>{option.min.toLocaleString()}~{option.max.toLocaleString()} WC</Text></Pressable>)}</View>

        <Text style={styles.sectionTitle}>시작 베팅 금액</Text>
        <View style={styles.betGrid}>{difficultyOption.bets.map((amount) => <BetOptionCoin key={amount} amount={amount} selected={props.selectedBet === amount} onPress={() => props.onBetChange(amount)} />)}</View>

        <View style={styles.setupSummary}><Row title="보유 코인" value={`${props.coins.toLocaleString()} WC`} /><View style={styles.separator} /><Row title="베팅 등급" value={betTierName(props.difficulty)} /><View style={styles.separator} /><Row title="선택 베팅" value={`${props.selectedBet.toLocaleString()} WC`} /></View>
        <Pressable disabled={props.selectedBet > props.coins} style={[styles.primaryButton, styles.fullWidthButton, props.selectedBet > props.coins && styles.disabledCard]} onPress={props.onStart}><Text style={styles.primaryButtonText}>바카라(Baccarat) 시작</Text></Pressable>
      </ScrollView>
    </View>
  );
}

function BaccaratGameScreen({
  coins,
  difficulty,
  selectedBet,
  onBack,
  onBetChange,
  onPlaceBet,
  onSettle,
}: {
  coins: number;
  difficulty: string;
  selectedBet: number;
  onBack: () => void;
  onBetChange: (value: number) => void;
  onPlaceBet: (stake: number) => boolean;
  onSettle: (bet: BaccaratBet, stake: number, winner: BaccaratWinner) => void;
}) {
  const [bet, setBet] = useState<BaccaratBet>('player');
  const [round, setRound] = useState<ReturnType<typeof dealBaccaratRound> | null>(null);
  const [showRules, setShowRules] = useState(false);
  const difficultyOption = difficultyOptions.find((item) => item.name === difficulty) ?? difficultyOptions[2];
  const labels = { player: '플레이어', banker: '뱅커', tie: '타이' } as const;
  const odds = { player: '1:1', banker: '0.95:1', tie: '8:1' } as const;

  const deal = () => {
    if (!onPlaceBet(selectedBet)) return;
    const nextRound = dealBaccaratRound();
    setRound(nextRound);
    onSettle(bet, selectedBet, nextRound.winner);
  };

  const net = round ? baccaratNet(bet, selectedBet, round.winner) : 0;
  return (
    <View style={styles.baccaratScreen}>
      <ScreenHeader title="바카라(Baccarat)" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.baccaratPage} showsVerticalScrollIndicator={false}>
        <View style={styles.rouletteStatusRow}>
          <View><Text style={styles.eyebrow}>BACCARAT</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View>
          <View style={styles.baccaratStatusActions}><View style={styles.difficultyBadge}><Text style={styles.difficultyBadgeText}>{betTierName(difficulty)}</Text></View><Pressable style={styles.rulesButton} onPress={() => setShowRules((value) => !value)}><Text style={styles.rulesButtonText}>? 규칙</Text></Pressable></View>
        </View>
        {showRules && <BaccaratRules compact />}

        <View style={styles.baccaratTable}>
          <View style={styles.baccaratHandSection}>
            <View style={styles.baccaratHandTitleRow}><Text style={styles.baccaratHandTitle}>PLAYER</Text><Text style={styles.baccaratScore}>{round ? baccaratScore(round.player) : '–'}</Text></View>
            <View style={styles.baccaratCards}>{round ? round.player.map((card, index) => <PlayingCard key={`bp-${card.id}-${index}`} card={card} emphasis={round.winner==='player'?'winner':round.winner==='tie'?'selected':'dim'} />) : <Text style={styles.baccaratWaiting}>카드 대기</Text>}</View>
          </View>
          <View style={styles.baccaratDivider} />
          <View style={styles.baccaratHandSection}>
            <View style={styles.baccaratHandTitleRow}><Text style={styles.baccaratHandTitle}>BANKER</Text><Text style={styles.baccaratScore}>{round ? baccaratScore(round.banker) : '–'}</Text></View>
            <View style={styles.baccaratCards}>{round ? round.banker.map((card, index) => <PlayingCard key={`bb-${card.id}-${index}`} card={card} emphasis={round.winner==='banker'?'winner':round.winner==='tie'?'selected':'dim'} />) : <Text style={styles.baccaratWaiting}>카드 대기</Text>}</View>
          </View>
        </View>

        {round && <View style={[styles.baccaratResult, net > 0 ? styles.rouletteWinCard : net < 0 ? styles.rouletteLossCard : styles.baccaratPushCard]}><Text style={styles.rouletteResultTitle}>{labels[round.winner]} 승리</Text><Text style={[styles.resultNet, net > 0 && styles.positive, net < 0 && styles.negative]}>{net > 0 ? '+' : ''}{net.toLocaleString()} WC</Text></View>}

        {round ? <Pressable style={[styles.primaryButton, styles.rouletteSpinButton, styles.gameResultAction]} onPress={() => setRound(null)}><Text style={styles.primaryButtonText}>다시 베팅하기</Text></Pressable> : <Pressable disabled={selectedBet > coins} style={[styles.primaryButton, styles.rouletteSpinButton, styles.gameResultAction, selectedBet > coins && styles.disabledCard]} onPress={deal}><Text style={styles.primaryButtonText}>{labels[bet]}에 {selectedBet.toLocaleString()} WC 베팅</Text></Pressable>}

        <Text style={styles.sectionTitle}>베팅 위치</Text>
        <View style={styles.baccaratBetRow}>
          {(['player', 'tie', 'banker'] as BaccaratBet[]).map((option) => {
            const active = bet === option;
            return <Pressable key={option} disabled={Boolean(round)} onPress={() => setBet(option)} style={[styles.baccaratBetArea, option === 'player' && styles.playerBetArea, option === 'banker' && styles.bankerBetArea, active && styles.baccaratBetActive]}>{active && !round && <CoinStack amount={selectedBet} compact />}<Text style={styles.baccaratBetTitle}>{labels[option]}</Text><Text style={styles.baccaratOdds}>{odds[option]}</Text></Pressable>;
          })}
        </View>

        <Text style={styles.sectionTitle}>베팅 금액</Text>
        <View style={styles.setupOptions}>
          {difficultyOption.bets.map((amount) => <BetOptionCoin key={amount} amount={amount} selected={selectedBet === amount} disabled={Boolean(round)} onPress={() => onBetChange(amount)} />)}
        </View>

        <Text style={styles.disclaimer}>뱅커 적중 수익은 5% 수수료 적용 · 타이 8:1</Text>
      </ScrollView>
    </View>
  );
}

function RouletteGameScreen({
  coins,
  difficulty,
  selectedBet,
  onBack,
  onBetChange,
  onPlaceBet,
  onSettle,
}: {
  coins: number;
  difficulty: string;
  selectedBet: number;
  onBack: () => void;
  onBetChange: (value: number) => void;
  onPlaceBet: (stake: number) => boolean;
  onSettle: (bet: RouletteBet, stake: number, number: number, label: string) => void;
}) {
  const [bet, setBet] = useState<RouletteBet>({ type: 'red' });
  const [phase, setPhase] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [resultNumber, setResultNumber] = useState<number | null>(null);
  const wheelProgress = useRef(new Animated.Value(0)).current;
  const difficultyOption = difficultyOptions.find((item) => item.name === difficulty) ?? difficultyOptions[2];
  const outsideBets: { label: string; bet: RouletteBet; color?: string }[] = [
    { label: '빨강', bet: { type: 'red' }, color: '#A8323A' },
    { label: '검정', bet: { type: 'black' }, color: '#20242B' },
    { label: '홀수', bet: { type: 'odd' } },
    { label: '짝수', bet: { type: 'even' } },
    { label: '1–18', bet: { type: 'low' } },
    { label: '19–36', bet: { type: 'high' } },
    { label: '1번째 12', bet: { type: 'dozen1' } },
    { label: '2번째 12', bet: { type: 'dozen2' } },
    { label: '3번째 12', bet: { type: 'dozen3' } },
  ];
  const betLabel = bet.type === 'straight' ? `숫자 ${bet.number}` : outsideBets.find((item) => item.bet.type === bet.type)?.label ?? '';
  const won = resultNumber !== null && rouletteBetWins(bet, resultNumber);

  useEffect(() => () => wheelProgress.stopAnimation(), [wheelProgress]);

  const spin = () => {
    if (phase === 'spinning' || !onPlaceBet(selectedBet)) return;
    const number = spinRoulette();
    const pocketIndex = europeanWheelOrder.indexOf(number);
    const target = 1800 + (360 - pocketIndex * (360 / europeanWheelOrder.length));
    wheelProgress.setValue(0);
    setPhase('spinning');
    setResultNumber(null);
    Animated.timing(wheelProgress, {
      toValue: target,
      duration: 1800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setResultNumber(number);
      setPhase('result');
      onSettle(bet, selectedBet, number, betLabel);
    });
  };

  const wheelRotation = wheelProgress.interpolate({ inputRange: [0, 2160], outputRange: ['0deg', '2160deg'] });

  return (
    <View style={styles.detailScreen}>
      <ScreenHeader title="유럽식 룰렛(Roulette)" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.roulettePage} showsVerticalScrollIndicator={false}>
        <View style={styles.rouletteStatusRow}>
          <View><Text style={styles.eyebrow}>ROULETTE</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View>
          <View style={styles.difficultyBadge}><Text style={styles.difficultyBadgeText}>{betTierName(difficulty)}</Text></View>
        </View>

        <View style={styles.rouletteStage}>
          <View style={styles.rouletteMarker} />
          <View style={[styles.rouletteWheel, phase === 'spinning' && styles.rouletteWheelSpinning]}>
            <Animated.View style={[styles.rouletteWheelRing, { transform: [{ rotate: wheelRotation }] }]}>
              {europeanWheelOrder.map((number, index) => {
                const angle = index * (360 / europeanWheelOrder.length);
                const radians = angle * Math.PI / 180;
                const radius = 103;
                const left = 125 + Math.sin(radians) * radius - 12;
                const top = 125 - Math.cos(radians) * radius - 12;
                const color = rouletteColor(number);
                return (
                  <View key={number} style={[styles.roulettePocket, { left, top, transform: [{ rotate: `${angle}deg` }] }, color === 'red' ? styles.roulettePocketRed : color === 'black' ? styles.roulettePocketBlack : styles.roulettePocketGreen]}>
                    <Text style={styles.roulettePocketText}>{number}</Text>
                  </View>
                );
              })}
            </Animated.View>
            <View style={styles.rouletteBowl}>
              <View style={styles.rouletteHub} />
              <Text style={[styles.rouletteResultNumber, resultNumber !== null && rouletteColor(resultNumber) === 'red' && styles.rouletteRedText]}>{phase === 'spinning' ? '•' : resultNumber ?? '◎'}</Text>
              <Text style={styles.rouletteWheelLabel}>{phase === 'spinning' ? '회전 중' : resultNumber === null ? '베팅 선택' : rouletteColor(resultNumber).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {phase === 'result' && resultNumber !== null && (
          <View style={[styles.rouletteResultCard, won ? styles.rouletteWinCard : styles.rouletteLossCard]}>
            <Text style={styles.rouletteResultTitle}>{won ? '적중!' : '아쉽게 빗나갔습니다'}</Text>
            <Text style={styles.smallText}>{betLabel} · {won ? `+${rouletteNet(bet, selectedBet, resultNumber).toLocaleString()} WC` : `-${selectedBet.toLocaleString()} WC`}</Text>
          </View>
        )}

        <Pressable accessibilityRole="button" disabled={phase === 'spinning' || selectedBet > coins} style={[styles.primaryButton, styles.rouletteSpinButton, styles.gameResultAction, (phase === 'spinning' || selectedBet > coins) && styles.disabledCard]} onPress={spin}>
          <Text style={styles.primaryButtonText}>{phase === 'spinning' ? '회전 중…' : `${betLabel}에 ${selectedBet.toLocaleString()} WC 베팅`}</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>바깥 베팅</Text>
        <View style={styles.rouletteBetGrid}>
          {outsideBets.map((item) => {
            const active = bet.type === item.bet.type;
            return <Pressable key={item.bet.type} disabled={phase === 'spinning'} onPress={() => { setBet(item.bet); setPhase('betting'); }} style={[styles.rouletteBetButton, item.color ? { backgroundColor: item.color } : null, active && styles.rouletteBetActive]}>{active && <CoinStack amount={selectedBet} compact />}<Text style={styles.rouletteBetText}>{item.label}</Text><Text style={styles.rouletteOdds}>{item.bet.type.startsWith('dozen') ? '2:1' : '1:1'}</Text></Pressable>;
          })}
        </View>

        <Text style={styles.sectionTitle}>숫자 하나 선택 · 35:1</Text>
        <View style={styles.numberGrid}>
          {Array.from({ length: 37 }, (_, number) => {
            const active = bet.type === 'straight' && bet.number === number;
            const color = rouletteColor(number);
            return <Pressable key={number} disabled={phase === 'spinning'} onPress={() => { setBet({ type: 'straight', number }); setPhase('betting'); }} style={[styles.numberCell, color === 'red' ? styles.numberRed : color === 'black' ? styles.numberBlack : styles.numberGreen, active && styles.numberActive]}>{active && <View style={styles.numberCoin}><Text style={styles.numberCoinText}>{selectedBet.toLocaleString()}</Text><Text style={styles.numberCoinUnit}>WC</Text></View>}<Text style={[styles.numberText, active && styles.numberTextWithCoin]}>{number}</Text></Pressable>;
          })}
        </View>

        <Text style={styles.sectionTitle}>베팅 금액</Text>
        <View style={styles.setupOptions}>
          {difficultyOption.bets.map((amount) => <BetOptionCoin key={amount} amount={amount} selected={selectedBet === amount} disabled={phase === 'spinning'} onPress={() => onBetChange(amount)} />)}
        </View>

        <Text style={styles.disclaimer}>유럽식 단일 0 룰렛 · 게임 전용 코인</Text>
      </ScrollView>
    </View>
  );
}

function WalletScreen({ coins, records }: { coins: number; records: GameRecord[] }) {
  const totalNet = records.reduce((sum, record) => sum + record.net, 0);
  const returnRate = totalNet / 10000 * 100;
  const categoryComparison = ['카지노', '한국 전통', '포커·카드', '마작', '레이싱', '세계 게임'];
  return (
    <Page>
      <Text style={styles.pageTitle}>지갑</Text>
      <View style={styles.balanceCard}>
        <Text style={styles.muted}>전체 자산</Text>
        <Text style={styles.balance}>{coins.toLocaleString()} WC</Text>
        <Text style={totalNet >= 0 ? styles.positive : styles.negative}>누적 {totalNet > 0 ? '+' : ''}{totalNet.toLocaleString()} WC ({returnRate.toFixed(1)}%)</Text>
        <View style={styles.chart}>
          {[30, 42, 36, 55, 48, 72, 64, 88].map((height, index) => <View key={index} style={[styles.chartBar, { height }]} />)}
        </View>
      </View>
      <Text style={styles.sectionTitle}>카테고리별 비교</Text>
      <View style={styles.panel}>
        {categoryComparison.map((name, index) => {
          const value = name === '카지노' ? totalNet : 0;
          return (
          <React.Fragment key={name}>
            <Row title={name} value={`${value > 0 ? '+' : ''}${value.toLocaleString()} WC`} positive={value > 0} />
            {index < categoryComparison.length - 1 && <View style={styles.separator} />}
          </React.Fragment>
          );
        })}
      </View>
      <Text style={styles.sectionTitle}>분석 메뉴</Text>
      <View style={styles.panel}>
        <Row title="게임별 손익" value="보기  ›" />
        <View style={styles.separator} />
        <Row title="베팅 등급별 수익률" value="보기  ›" />
        <View style={styles.separator} />
        <Row title="전체 거래 내역" value="보기  ›" />
      </View>
    </Page>
  );
}

function maxWinStreak(records: GameRecord[]) {
  let current = 0;
  let maximum = 0;
  for (const record of [...records].reverse()) {
    if (record.result === 'win' || record.result === 'blackjack') {
      current += 1;
      maximum = Math.max(maximum, current);
    } else {
      current = 0;
    }
  }
  return maximum;
}

function RecordsScreen({ records }: { records: GameRecord[] }) {
  const wins = records.filter((record) => record.result === 'win' || record.result === 'blackjack').length;
  const winRate = records.length > 0 ? wins / records.length * 100 : 0;
  const totalNet = records.reduce((sum, record) => sum + record.net, 0);
  return (
    <Page>
      <Text style={styles.pageTitle}>기록</Text>
      <View style={styles.statsGrid}>
        <Stat label="전체 플레이" value={`${records.length}판`} />
        <Stat label="승률" value={`${winRate.toFixed(1)}%`} />
        <Stat label="최고 연승" value={`${maxWinStreak(records)}연승`} />
        <Stat label="총 손익" value={`${totalNet > 0 ? '+' : ''}${totalNet.toLocaleString()}`} positive={totalNet > 0} />
      </View>
      <Text style={styles.sectionTitle}>최근 경기</Text>
      <View style={styles.panel}>
        {records.length === 0 && <Text style={styles.emptyText}>게임을 완료하면 기록이 여기에 저장됩니다.</Text>}
        {records.map((record, index) => (
          <React.Fragment key={record.id}>
            <Row
              title={`${gameDisplayName(record.game)} · ${resultLabel(record.result)}`}
              subtitle={`${record.detail ? `${record.detail} · ` : ''}${betTierName(record.difficulty)} · 베팅 ${record.bet.toLocaleString()} WC · ${formatPlayedAt(record.playedAt)}`}
              value={`${record.net > 0 ? '+' : ''}${record.net.toLocaleString()} WC`}
              positive={record.net > 0}
            />
            {index < records.length - 1 && <View style={styles.separator} />}
          </React.Fragment>
        ))}
      </View>
    </Page>
  );
}

function SettingsScreen(props: {
  difficulty: string;
  saveDifficulty: (value: string) => void;
  sound: boolean;
  setSound: (value: boolean) => void;
  vibration: boolean;
  setVibration: (value: boolean) => void;
  onRefillCoins: () => void;
}) {
  return (
    <Page>
      <Text style={styles.pageTitle}>설정</Text>
      <Text style={styles.sectionTitle}>기본 베팅 등급</Text>
      <View style={styles.difficultyRow}>
        {difficultyOptions.map((option) => (
          <Pressable key={option.name} style={[styles.difficultyButton, props.difficulty === option.name && styles.difficultyActive]} onPress={() => props.saveDifficulty(option.name)}>
            <Text style={[styles.difficultyText, props.difficulty === option.name && styles.difficultyActiveText]}>{betTierName(option.name)}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.helperText}>베팅 등급은 걸 수 있는 WC 범위만 바꿉니다. 게임 실력 난이도와는 별개입니다.</Text>
      <Text style={styles.sectionTitle}>테스트 도구</Text>
      <Pressable style={styles.refillButton} onPress={props.onRefillCoins}>
        <Text style={styles.refillButtonTitle}>100,000 WC로 다시 채우기</Text>
        <Text style={styles.refillButtonText}>게임 테스트용 가상 코인을 즉시 복구합니다</Text>
      </Pressable>
      <Text style={styles.sectionTitle}>게임 환경</Text>
      <View style={styles.panel}>
        <ToggleRow title="효과음" value={props.sound} onValueChange={props.setSound} />
        <View style={styles.separator} />
        <ToggleRow title="진동" value={props.vibration} onValueChange={props.setVibration} />
        <View style={styles.separator} />
        <Row title="게임 진행 속도" value="보통  ›" />
        <View style={styles.separator} />
        <Row title="접근성" value="설정  ›" />
      </View>
      <Text style={styles.disclaimerBlock}>이 앱의 WC는 게임 전용 가상 코인이며 실제 현금으로 구매하거나 환전할 수 없습니다.</Text>
    </Page>
  );
}

function Row({ title, subtitle, value, positive = false }: { title: string; subtitle?: string; value: string; positive?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text>{subtitle && <Text style={styles.smallText}>{subtitle}</Text>}</View>
      <Text style={[styles.rowValue, positive && styles.positive]}>{value}</Text>
    </View>
  );
}

function Stat({ label, value, positive = false }: { label: string; value: string; positive?: boolean }) {
  return <View style={styles.stat}><Text style={styles.muted}>{label}</Text><Text style={[styles.statValue, positive && styles.positive]}>{value}</Text></View>;
}

function ToggleRow({ title, value, onValueChange }: { title: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return <View style={styles.row}><Text style={styles.rowTitle}>{title}</Text><Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#303746', true: '#80651F' }} thumbColor={value ? '#E4BC55' : '#9AA2B0'} /></View>;
}

const colors = {
  bg: '#080B12',
  panel: '#111722',
  panel2: '#151D2A',
  gold: '#D1A63C',
  goldLight: '#F0D58D',
  text: '#F4F1EA',
  muted: '#8D96A6',
  border: '#293140',
  green: '#44C28B',
  red: '#E36C72',
};

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.bg },
  screen: { flex: 1 },
  splash: { flex: 1, backgroundColor: '#040711', overflow: 'hidden' },
  splashBackground: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'space-between' },
  splashShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(3, 3, 8, 0.25)' },
  splashHeader: { zIndex: 2, alignItems: 'center', width: '100%', paddingTop: 38, paddingBottom: 36, backgroundColor: 'rgba(5, 4, 8, 0.38)' },
  splashEyebrow: { color: colors.gold, letterSpacing: 5, fontSize: 12, fontWeight: '700' },
  splashTitle: { color: '#FFF1B3', fontSize: 36, fontWeight: '900', marginTop: 7, letterSpacing: 1, textShadowColor: '#D99D22', textShadowRadius: 12 },
  splashSubtitle: { color: '#C4B994', fontSize: 13, marginTop: 6 },
  splashBottom: { zIndex: 2, width: '100%', alignItems: 'center', paddingHorizontal: 22, paddingBottom: 24, paddingTop: 70, backgroundColor: 'rgba(4, 3, 7, 0.28)' },
  splashEnterButton: { width: '88%', minHeight: 66, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(184, 135, 39, 0.96)', borderWidth: 2, borderColor: '#FFE39A', shadowColor: '#E1AD3F', shadowOpacity: 0.8, shadowRadius: 14, elevation: 8 },
  splashEnterButtonTop: { color: '#4A2D08', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  splashEnterButtonText: { color: '#170F05', fontSize: 18, fontWeight: '900', marginTop: 2 },
  splashDisclaimer: { color: '#E4DCC7', fontSize: 10, marginTop: 12, textShadowColor: '#000', textShadowRadius: 4 },
  doors: { flexDirection: 'row', height: 330, width: '86%', marginVertical: 34, borderWidth: 2, borderColor: colors.gold, borderRadius: 140, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, overflow: 'hidden', backgroundColor: '#19140C' },
  door: { flex: 1, backgroundColor: '#241B0F', justifyContent: 'center', borderColor: '#8A6824' },
  leftDoor: { borderRightWidth: 1 },
  rightDoor: { borderLeftWidth: 1 },
  doorLine: { position: 'absolute', top: 28, bottom: 28, left: 18, right: 18, borderWidth: 1, borderColor: '#69501E', borderRadius: 80, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  doorHandle: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.gold, alignSelf: 'center' },
  primaryButton: { minHeight: 52, width: '86%', borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gold },
  primaryButtonText: { color: '#171107', fontSize: 17, fontWeight: '800' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  disclaimer: { color: colors.muted, fontSize: 12, marginTop: 18 },
  header: { height: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: '#171D28' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel },
  avatarText: { color: colors.goldLight, fontWeight: '800' },
  profileName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  level: { color: colors.muted, fontSize: 11, marginTop: 2 },
  walletPill: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: '#745B22', borderRadius: 20, backgroundColor: '#11151D' },
  coin: { color: colors.gold, fontSize: 17 },
  walletText: { color: colors.text, fontSize: 15, fontWeight: '800' },
  page: { padding: 18, paddingBottom: 30 },
  eyebrow: { color: colors.gold, fontSize: 12, fontWeight: '700', marginBottom: 5 },
  pageTitle: { color: colors.text, fontSize: 29, fontWeight: '800', marginBottom: 20 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 14, marginBottom: 11 },
  heroCard: { minHeight: 128, flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: colors.panel, borderWidth: 1, borderColor: '#6D5520', borderRadius: 18 },
  blackjackMark: { width: 72, height: 92, borderRadius: 12, backgroundColor: '#10372C', alignItems: 'center', justifyContent: 'center', gap: 3 },
  cardSuit: { color: '#F2E6CB', fontSize: 19, fontWeight: '800' },
  rouletteContinueMark: { color: colors.goldLight, fontSize: 46, fontWeight: '900' },
  heroCopy: { flex: 1, marginLeft: 14 },
  cardTitle: { color: colors.text, fontSize: 21, fontWeight: '800', marginVertical: 4 },
  muted: { color: colors.muted, fontSize: 13 },
  smallText: { color: colors.muted, fontSize: 12, marginTop: 3 },
  smallButton: { minWidth: 58, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.gold },
  smallButtonText: { color: '#171107', fontWeight: '800' },
  panel: { backgroundColor: colors.panel, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 },
  row: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowCopy: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '800' },
  positive: { color: colors.green },
  negative: { color: colors.red },
  emptyText: { color: colors.muted, fontSize: 13, lineHeight: 20, paddingVertical: 22, textAlign: 'center' },
  separator: { height: 1, backgroundColor: colors.border },
  progressTrack: { height: 7, marginBottom: 16, borderRadius: 4, backgroundColor: '#252D39', overflow: 'hidden' },
  progressValue: { width: '33%', height: '100%', backgroundColor: colors.gold },
  searchBox: { height: 48, flexDirection: 'row', alignItems: 'center', borderRadius: 14, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 15 },
  searchIcon: { color: colors.muted, fontSize: 20, marginRight: 8 },
  searchInput: { flex: 1, height: '100%', color: colors.text, fontSize: 15 },
  clearSearch: { color: colors.muted, fontSize: 25, paddingHorizontal: 6 },
  chipRow: { flexDirection: 'row', gap: 8, marginVertical: 14 },
  chip: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 19, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  chipActiveText: { color: '#171107', fontSize: 13, fontWeight: '800' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: { width: '48%', minHeight: 155, borderRadius: 17, padding: 15, backgroundColor: colors.panel2, borderWidth: 1, borderColor: colors.border },
  categoryIcon: { color: colors.gold, fontSize: 28, fontWeight: '700', marginBottom: 16 },
  categoryName: { color: colors.text, fontSize: 16, fontWeight: '800' },
  categoryDetail: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  categoryCount: { color: colors.goldLight, fontSize: 10, fontWeight: '800', marginTop: 10 },
  comingSoon: { alignSelf: 'flex-start', color: colors.muted, fontSize: 10, marginTop: 9, paddingHorizontal: 7, paddingVertical: 4, backgroundColor: '#252C37', borderRadius: 8 },
  detailScreen: { flex: 1, backgroundColor: colors.bg },
  detailHeader: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailHeaderTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  backButtonSpacer: { width: 44, height: 44 },
  backButtonText: { color: colors.goldLight, fontSize: 36, lineHeight: 38, fontWeight: '400' },
  detailPage: { padding: 18, paddingBottom: 38 },
  detailLead: { color: colors.text, fontSize: 25, fontWeight: '900', marginBottom: 18 },
  catalogList: { gap: 10, marginTop: 16 },
  previewHero: { alignItems: 'center', paddingVertical: 20 },
  previewIcon: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#172B24', borderWidth: 1, borderColor: colors.gold, marginBottom: 18 },
  previewIconText: { color: colors.goldLight, fontSize: 32, fontWeight: '900' },
  previewTitle: { color: colors.text, fontSize: 30, fontWeight: '900', marginTop: 6 },
  previewDescription: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10, maxWidth: 320 },
  roadmapCard: { marginTop: 20, marginBottom: 18, padding: 18, borderRadius: 18, backgroundColor: '#15263B', borderWidth: 1, borderColor: '#315277' },
  roadmapTitle: { color: '#A9CFFF', fontSize: 16, fontWeight: '900' },
  roadmapText: { color: colors.text, fontSize: 12, lineHeight: 20, marginTop: 7 },
  gameListCard: { minHeight: 96, flexDirection: 'row', alignItems: 'center', padding: 13, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  resultOpenArea: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  resultCategory: { color: colors.gold, fontSize: 10, fontWeight: '800', marginBottom: 3 },
  favoriteButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  favoriteIcon: { color: colors.muted, fontSize: 25 },
  favoriteIconActive: { color: colors.gold },
  disabledCard: { opacity: 0.45 },
  gameListIcon: { width: 58, height: 66, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#102C26', borderWidth: 1, borderColor: '#285448' },
  gameListIconText: { color: colors.goldLight, fontSize: 21, fontWeight: '900' },
  gameListCopy: { flex: 1, marginLeft: 13 },
  gameTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gameListTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  gameListDescription: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  availableBadge: { color: colors.green, fontSize: 10, fontWeight: '800', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, backgroundColor: '#143329' },
  comingSoonBadge: { color: colors.muted, fontSize: 10, fontWeight: '700', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, backgroundColor: '#252C37' },
  chevron: { color: colors.gold, fontSize: 25, marginLeft: 6 },
  blackjackIntro: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, backgroundColor: '#0E2B24', borderWidth: 1, borderColor: '#315D50' },
  blackjackIntroCards: { width: 85, height: 100, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 14, backgroundColor: '#F2E7CF' },
  introCard: { color: '#181818', fontSize: 22, fontWeight: '900' },
  blackjackIntroCopy: { flex: 1, marginLeft: 16 },
  setupOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  setupOption: { width: '31%', minHeight: 64, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  setupOptionActive: { backgroundColor: '#2E2512', borderColor: colors.gold },
  setupOptionTitle: { color: colors.muted, fontSize: 14, fontWeight: '800' },
  setupOptionTitleActive: { color: colors.goldLight },
  setupOptionRange: { color: colors.muted, fontSize: 9, marginTop: 5 },
  betGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 7 },
  betOptionCoin: { width: '23%', height: 126, alignItems: 'center', justifyContent: 'flex-end' },
  betOptionCoinLayer: { position: 'absolute', width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#6E5518', borderWidth: 3, borderColor: '#D8AC3B', shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.32, shadowRadius: 3, elevation: 4 },
  betOptionCoinLayerActive: { backgroundColor: '#E1B63F', borderColor: '#FFE99A', shadowColor: colors.goldLight, shadowOpacity: 0.65 },
  betOptionCoinCenter: { width: 31, height: 31, alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: '#F0CE70' },
  betOptionCoinCenterActive: { borderColor: '#5B410B' },
  betButtonText: { color: colors.text, fontSize: 10, fontWeight: '900', lineHeight: 11 },
  betButtonTextActive: { color: '#171107' },
  betButtonUnit: { color: colors.goldLight, fontSize: 6, fontWeight: '900', lineHeight: 7 },
  coinStack: { width: 68, height: 78, alignSelf: 'center', position: 'relative' },
  coinStackCompact: { width: 44, height: 49, marginBottom: 2 },
  worldCoinChip: { position: 'absolute', left: 6, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D9A928', borderWidth: 4, borderColor: '#FFE69A', shadowColor: '#000000', shadowOpacity: 0.45, shadowRadius: 4, shadowOffset: { width: 0, height: 3 } },
  worldCoinChipCompact: { left: 3, width: 38, height: 38, borderRadius: 19, borderWidth: 3 },
  worldCoinCenter: { width: 39, height: 39, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9C653', borderWidth: 2, borderColor: '#7A5710', borderStyle: 'dashed' },
  worldCoinCenterCompact: { width: 26, height: 26, borderRadius: 13, borderWidth: 1 },
  worldCoinAmount: { color: '#241803', fontSize: 13, fontWeight: '900', lineHeight: 14 },
  worldCoinAmountCompact: { fontSize: 9, lineHeight: 10 },
  worldCoinUnit: { color: '#493306', fontSize: 8, fontWeight: '900', lineHeight: 9 },
  worldCoinUnitCompact: { fontSize: 6, lineHeight: 7 },
  blackjackBetSpot: { minHeight: 132, alignItems: 'center', justifyContent: 'center', marginTop: 18, paddingTop: 12, paddingBottom: 10, borderRadius: 66, backgroundColor: '#0B3026', borderWidth: 2, borderColor: '#B58A2E' },
  blackjackBetSpotLabel: { position: 'absolute', top: 10, color: '#8DAB9F', fontSize: 10, fontWeight: '900', letterSpacing: 3 },
  blackjackBetSpotCaption: { color: colors.goldLight, fontSize: 11, fontWeight: '800', marginTop: 5 },
  setupSummary: { marginTop: 20, paddingHorizontal: 14, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  fullWidthButton: { width: '100%', marginTop: 18 },
  setupNotice: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 10 },
  blackjackTable: { flex: 1, backgroundColor: '#07251D' },
  gameTopBar: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 17, borderBottomWidth: 1, borderBottomColor: '#2E594C', backgroundColor: '#081B17' },
  gameTopTitle: { color: colors.goldLight, fontSize: 18, fontWeight: '900', letterSpacing: 1.5 },
  gameTopActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gameExitButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#A58145', backgroundColor: '#24180E' },
  gameExitButtonText: { color: '#F9D985', fontSize: 12, fontWeight: '900' },
  gameBetPill: { minWidth: 82, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 6, borderRadius: 24, backgroundColor: '#2A2312', borderWidth: 1, borderColor: '#806526' },
  gameBetText: { color: colors.goldLight, fontSize: 12, fontWeight: '800' },
  tableContent: { padding: 18, paddingBottom: 38 },
  handHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 10 },
  handTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  scoreBadge: { minWidth: 34, height: 28, textAlign: 'center', lineHeight: 28, overflow: 'hidden', borderRadius: 14, color: '#171107', backgroundColor: colors.goldLight, fontSize: 14, fontWeight: '900' },
  cardRow: { minHeight: 126, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  playingCard: { width: 72, height: 108, borderRadius: 10, padding: 8, justifyContent: 'space-between', backgroundColor: '#F7F1E3', borderWidth: 1, borderColor: '#D4C9B2' },
  cardWinner: { transform: [{ translateY: -16 }, { scale: 1.06 }], borderWidth: 3, borderColor: '#F2C85B', shadowColor: '#FFD35F', shadowOpacity: 0.9, shadowRadius: 10, elevation: 9 },
  cardSelected: { transform: [{ translateY: -10 }, { scale: 1.04 }], borderWidth: 2, borderColor: '#D6DCE6' },
  cardDim: { opacity: 0.04, transform: [{ scale: 0.96 }] },
  holdemGuide: { padding: 18, borderRadius: 18, backgroundColor: '#18251F', borderWidth: 1, borderColor: '#3D7658', gap: 8 },
  holdemPage: { padding: 16, paddingBottom: 42, gap: 16 },
  holdemTable: { minHeight: 510, alignItems: 'center', justifyContent: 'space-around', padding: 18, borderRadius: 110, backgroundColor: '#075332', borderWidth: 8, borderColor: '#6B3E20', shadowColor: '#000', shadowOpacity: 0.7, shadowRadius: 12 },
  holdemSeat: { color: '#F8E6B0', fontSize: 14, fontWeight: '900' },
  holdemCards: { minHeight: 90, flexDirection: 'row', justifyContent: 'center', gap: 7 },
  sevenPokerTable: { minHeight: 570 },
  sevenPokerCards: { minHeight: 185, maxWidth: 310, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', gap: 8 },
  sevenPokerHint: { color: '#BBD7C8', fontSize: 10, fontWeight: '700' },
  sevenPokerCardSlot: { alignItems: 'center', gap: 3 },
  sevenPokerVisibility: { overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, fontSize: 8, fontWeight: '900' },
  sevenPokerPrivate: { color: '#FFF1B8', backgroundColor: '#694C18' },
  sevenPokerPublic: { color: '#DDF5E8', backgroundColor: '#17613E' },
  fiveDrawTable: { minHeight: 520 },
  fiveDrawHand: { width: '100%', minHeight: 105, flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 4 },
  holdemCommunity: { minHeight: 90, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  holdemPot: { color: '#FFE080', fontSize: 16, fontWeight: '900', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.35)' },
  holdemOutcome: { color: '#FFF4C7', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  pokerShowdown: { gap: 14, paddingVertical: 8 },
  pokerResultRow: { padding: 14, borderRadius: 18, backgroundColor: '#171B22', borderWidth: 2, borderColor: '#727986' },
  pokerWinnerRow: { borderColor: '#F2C85B', backgroundColor: '#29220F', transform: [{ translateY: -7 }], shadowColor: '#FFD35F', shadowOpacity: 0.75, shadowRadius: 12, elevation: 8 },
  pokerLoserRow: { opacity: 0.62, borderColor: '#4C5360' },
  pokerResultHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  pokerResultWho: { color: '#F4F1EA', fontSize: 15, fontWeight: '900' },
  pokerResultLabel: { color: '#F2C85B', fontSize: 13, fontWeight: '900' },
  pokerBestCards: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  pokerBestNote: { color: '#9299A5', fontSize: 10, textAlign: 'center', marginTop: 7 },
  pokerInlineResult: { color: '#FFF4C7', fontSize: 12, fontWeight: '800', textAlign: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.35)' },
  pokerBoardCard: { alignItems: 'center' },
  pokerCommonBadge: { position: 'absolute', bottom: -15, color: '#E8EDF6', fontSize: 9, fontWeight: '900', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 7, backgroundColor: '#33455C' },
  holdemActions: { flexDirection: 'row', gap: 8 },
  holdemAction: { flex: 1, minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gold },
  holdemFold: { flex: 0.7, minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#762A31' },
  holdemActionText: { color: '#FFF', fontWeight: '900' },
  compactPlayingCard: { width: 58, height: 88, padding: 6 },
  playingCardRank: { color: '#121212', fontSize: 21, fontWeight: '900' },
  playingCardSuit: { color: '#121212', fontSize: 29, alignSelf: 'center' },
  redCard: { color: '#C43A40' },
  hiddenCard: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#172845', borderWidth: 3, borderColor: '#D4A93F' },
  hiddenCardMark: { color: colors.gold, fontSize: 30 },
  tableRule: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 7, marginVertical: 12, borderRadius: 15, backgroundColor: '#0D342A' },
  tableRuleText: { color: '#9DBAAF', fontSize: 11 },
  gameActions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  gameActionButton: { flex: 1, minHeight: 68, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  hitButton: { backgroundColor: colors.gold },
  standButton: { backgroundColor: '#1B304E', borderWidth: 1, borderColor: '#46658F' },
  doubleButton: { marginTop: 10, minHeight: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: colors.gold, backgroundColor: '#182B24' },
  splitButton: { marginTop: 10, minHeight: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: '#7AA6D8', backgroundColor: '#17283D' },
  insurancePanel: { marginTop: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.gold, backgroundColor: '#17271F' },
  insuranceTitle: { color: colors.goldLight, fontSize: 16, fontWeight: '900' },
  insuranceText: { color: colors.text, fontSize: 12, lineHeight: 19, marginTop: 6 },
  insuranceButton: { backgroundColor: '#7B5A12', borderWidth: 1, borderColor: colors.gold },
  insuranceMessage: { color: colors.goldLight, fontSize: 12, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  doubleButtonText: { color: colors.text, fontSize: 15, fontWeight: '900' },
  doubleButtonSubtext: { color: colors.muted, fontSize: 11, marginTop: 4 },
  gameActionText: { color: colors.text, fontSize: 18, fontWeight: '900' },
  gameActionSubtext: { color: '#D6D9DF', fontSize: 10, marginTop: 3 },
  resultPanel: { marginTop: 22, padding: 18, alignItems: 'center', borderRadius: 20, backgroundColor: '#0D1917', borderWidth: 1, borderColor: '#796126' },
  resultTitle: { color: colors.goldLight, fontSize: 30, fontWeight: '900' },
  resultNet: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 7 },
  resultDetail: { color: colors.muted, fontSize: 12, marginTop: 7 },
  exitButton: { minHeight: 48, width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  exitButtonText: { color: colors.goldLight, fontSize: 14, fontWeight: '800' },
  gameFooter: { color: '#7F9E92', fontSize: 11, textAlign: 'center', marginTop: 18 },
  slotSetupHero: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, backgroundColor: '#311326', borderWidth: 1, borderColor: '#8D4B72' },
  slotLogo: { width: 78, color: '#FFDF75', fontSize: 68, lineHeight: 72, fontWeight: '900', textAlign: 'center', textShadowColor: '#D52D51', textShadowRadius: 6 },
  slotSetupCopy: { flex: 1, marginLeft: 12 },
  slotModeRow: { flexDirection: 'row', gap: 9 },
  slotModeCard: { flex: 1, minHeight: 82, padding: 12, justifyContent: 'center', borderRadius: 15, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  slotModeActive: { backgroundColor: '#38270D', borderColor: colors.gold },
  slotModeTitle: { color: colors.muted, fontSize: 13, fontWeight: '900' },
  slotModeTitleActive: { color: colors.goldLight, fontSize: 13, fontWeight: '900' },
  slotModeText: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  slotRules: { marginTop: 18, padding: 16, borderRadius: 17, backgroundColor: '#1C1625', borderWidth: 1, borderColor: '#65476F' },
  slotRulesCompact: { marginTop: 22 },
  slotRulesTitle: { color: colors.goldLight, fontSize: 15, fontWeight: '900', marginBottom: 7 },
  slotRuleText: { color: '#D8D3DF', fontSize: 11, lineHeight: 19 },
  slotScreen: { flex: 1, backgroundColor: '#130914' },
  slotPage: { padding: 18, paddingBottom: 44 },
  slotMachine: { minHeight: 310, alignItems: 'center', marginTop: 18, padding: 18, borderRadius: 28, backgroundColor: '#5A1735', borderWidth: 6, borderColor: '#D9AE3D', shadowColor: '#000000', shadowOpacity: 0.55, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  slotJackpot: { color: '#FFE588', fontSize: 17, fontWeight: '900', letterSpacing: 1.5, marginBottom: 20 },
  slotReels: { width: '100%', flexDirection: 'row', gap: 7, padding: 8, borderRadius: 16, backgroundColor: '#24101B', borderWidth: 2, borderColor: '#F0D178' },
  slotReel: { flex: 1, aspectRatio: 0.78, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 10, backgroundColor: '#FFF8E8', borderWidth: 2, borderColor: '#C9B989' },
  slotReelWin: { borderColor: '#FFE04F', backgroundColor: '#FFF2B5' },
  slotSymbol: { fontSize: 47 },
  slotPayline: { position: 'absolute', left: 20, right: 20, top: 143, height: 2, backgroundColor: '#F43C61', opacity: 0.8 },
  slotMachineLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', textAlign: 'center', marginTop: 18 },
  slotPayout: { fontSize: 14, fontWeight: '900', marginTop: 7 },
  freeSpinBadge: { color: '#281900', fontSize: 12, fontWeight: '900', marginTop: 10, paddingHorizontal: 14, paddingVertical: 7, overflow: 'hidden', borderRadius: 14, backgroundColor: '#FFD65A' },
  slotSpinButton: { minHeight: 72, alignItems: 'center', justifyContent: 'center', marginTop: 18, borderRadius: 36, backgroundColor: '#D82D52', borderWidth: 4, borderColor: '#FFD96B', shadowColor: '#FF5372', shadowOpacity: 0.5, shadowRadius: 8 },
  slotSpinText: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', letterSpacing: 1 },
  pachislotScreen: { flex: 1, backgroundColor: '#090D19' },
  pachislotMachine: { backgroundColor: '#17305B', borderColor: '#D74C58' },
  stopButtonRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  stopButton: { flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 29, backgroundColor: '#D72F42', borderWidth: 3, borderColor: '#FFE48B' },
  stopButtonStopped: { backgroundColor: '#303746', borderColor: '#697283' },
  stopButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  pachiLever: { minHeight: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 14, borderRadius: 18, backgroundColor: '#19283F', borderWidth: 2, borderColor: '#7B9BC9' },
  pachiLeverIcon: { color: '#E84252', fontSize: 34, lineHeight: 38 },
  pachiLeverText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  bigBonusBadge: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', marginTop: 10, paddingHorizontal: 14, paddingVertical: 7, overflow: 'hidden', borderRadius: 14, backgroundColor: '#C62E40' },
  sicboHero: { alignItems: 'center', padding: 20, borderRadius: 20, backgroundColor: '#4A1118', borderWidth: 2, borderColor: '#C89D3D' },
  sicboHeroDice: { color: '#FFF1C4', fontSize: 48, marginBottom: 10 },
  sicboRules: { marginTop: 18, padding: 16, borderRadius: 17, backgroundColor: '#21151A', borderWidth: 1, borderColor: '#76505A' },
  sicboScreen: { flex: 1, backgroundColor: '#120B0D' },
  sicboPage: { padding: 18, paddingBottom: 46 },
  sicboBowl: { minHeight: 230, alignItems: 'center', justifyContent: 'center', marginTop: 18, borderRadius: 115, backgroundColor: '#621B22', borderWidth: 5, borderColor: '#D8B451' },
  sicboDiceRow: { flexDirection: 'row', gap: 8, marginTop: 22, transform: [{ scale: 0.75 }] },
  sicboResult: { fontSize: 16, fontWeight: '900', marginTop: -4 },
  sicboRollButton: { marginTop: 14, marginBottom: 2 },
  sicboFourGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sicboNumberGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sicboBetButton: { width: '23%', minHeight: 68, alignItems: 'center', justifyContent: 'center', padding: 5, borderRadius: 12, backgroundColor: '#2A2024', borderWidth: 1, borderColor: '#59464D' },
  sicboBetActive: { borderWidth: 3, borderColor: colors.goldLight, backgroundColor: '#53301A' },
  sicboBetTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  sicboOdds: { color: '#C9BDC2', fontSize: 8, marginTop: 4 },
  videoPokerScreen: { flex: 1, backgroundColor: '#071A2A' },
  videoPokerPage: { padding: 18, paddingBottom: 48 },
  videoPokerCabinet: { borderRadius: 27, backgroundColor: '#6C1422', borderWidth: 4, borderColor: '#E2B84D', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.65, shadowRadius: 14, elevation: 10 },
  videoPokerMarquee: { minHeight: 84, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#A6202D', borderBottomWidth: 4, borderBottomColor: '#F0C35A' },
  marqueeBulb: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFF3A3', borderWidth: 2, borderColor: '#F8D24E', shadowColor: '#FFF0A0', shadowOpacity: 1, shadowRadius: 8 },
  videoPokerMarqueeSmall: { color: '#FFD767', fontSize: 10, fontWeight: '900', textAlign: 'center', letterSpacing: 3 },
  videoPokerMarqueeTitle: { color: '#FFFFFF', fontSize: 23, fontWeight: '900', textAlign: 'center', letterSpacing: 1, textShadowColor: '#FFB02E', textShadowRadius: 9 },
  videoPokerGlass: { paddingVertical: 17, paddingHorizontal: 10, backgroundColor: '#071D3A', borderBottomWidth: 5, borderBottomColor: '#B4832B', alignItems: 'center' },
  videoPokerMiniPaytable: { width: '100%', padding: 8, borderRadius: 8, backgroundColor: '#102E59', borderWidth: 1, borderColor: '#4D81B2' },
  videoPokerPayline: { color: '#FFE47E', fontSize: 8, lineHeight: 14, fontWeight: '900', textAlign: 'center' },
  videoPokerMeters: { width: '100%', marginTop: 10, paddingHorizontal: 9, paddingVertical: 7, flexDirection: 'row', justifyContent: 'space-between', borderRadius: 7, backgroundColor: '#030B12', borderWidth: 1, borderColor: '#31516A' },
  videoPokerMeterLabel: { color: '#7FA9C2', fontSize: 7, fontWeight: '900', textAlign: 'center' },
  videoPokerMeterValue: { color: '#FFDD66', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  videoPokerPrompt: { color: '#FFF1C4', fontSize: 16, fontWeight: '900', marginTop: 14, marginBottom: 18, textAlign: 'center' },
  videoPokerHand: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 3 },
  videoPokerCardWrap: { alignItems: 'center', borderRadius: 11, padding: 2 },
  videoPokerHeld: { backgroundColor: '#D8B451' },
  videoPokerHoldLabel: { color: '#9EB3C5', fontSize: 10, fontWeight: '900', marginTop: 5 },
  videoPokerHoldActive: { color: '#FFF1C4' },
  videoPokerEmpty: { opacity: 0.7 },
  videoPokerResult: { marginTop: 18, alignItems: 'center' },
  videoPokerPaytable: { marginTop: 18, padding: 16, borderRadius: 16, backgroundColor: '#102C45', borderWidth: 1, borderColor: '#456781' },
  videoPokerControlDeck: { minHeight: 94, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#42101A', borderTopWidth: 2, borderTopColor: '#F1CD70' },
  videoPokerDealButton: { width: 132, minHeight: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D32D35', borderWidth: 5, borderColor: '#F3C656', shadowColor: '#FFB733', shadowOpacity: 0.8, shadowRadius: 7, elevation: 8 },
  videoPokerDealText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', letterSpacing: 1 },
  videoPokerDealSub: { color: '#FFE69A', fontSize: 9, fontWeight: '800' },
  videoPokerCoinSlot: { width: 42, height: 54, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: '#171719', borderWidth: 2, borderColor: '#9D854C' },
  videoPokerCoinSlotText: { color: '#E8C865', fontSize: 10, fontWeight: '900', transform: [{ rotate: '-90deg' }] },
  videoPokerSpeaker: { width: 43, height: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#210910', borderWidth: 1, borderColor: '#7C4650' },
  videoPokerSpeakerText: { color: '#8F5D65', fontSize: 12, letterSpacing: -1 },
  videoPokerBase: { paddingVertical: 10, backgroundColor: '#250A10', borderTopWidth: 1, borderTopColor: '#7F4B2A' },
  videoPokerBaseText: { color: '#B98E55', fontSize: 8, fontWeight: '900', textAlign: 'center', letterSpacing: 1.5 },
  baccaratSetupHero: { flexDirection: 'row', alignItems: 'center', padding: 17, borderRadius: 20, backgroundColor: '#0B302F', borderWidth: 1, borderColor: '#416B62' },
  crapsSetupHero: { alignItems: 'center', padding: 20, borderRadius: 20, backgroundColor: '#183324', borderWidth: 1, borderColor: '#53705E' },
  crapsHeroDice: { color: colors.goldLight, fontSize: 48, marginBottom: 8 },
  crapsScreen: { flex: 1, backgroundColor: '#071A12' },
  crapsPage: { padding: 18, paddingBottom: 44 },
  crapsTable: { minHeight: 270, alignItems: 'center', justifyContent: 'center', marginTop: 18, padding: 20, borderRadius: 42, backgroundColor: '#0A422D', borderWidth: 3, borderColor: '#D0A441' },
  crapsPointLabel: { position: 'absolute', top: 17, color: colors.goldLight, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  diceRow: { flexDirection: 'row', gap: 18, marginTop: 20 },
  die: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#F5EEDA', borderWidth: 2, borderColor: '#C9B98D', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 7 },
  dieText: { color: '#161616', fontSize: 66, lineHeight: 76 },
  crapsTotal: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 18 },
  crapsContinue: { color: colors.goldLight, fontSize: 12, fontWeight: '800', marginTop: 7 },
  crapsOutcome: { fontSize: 16, fontWeight: '900', marginTop: 7 },
  crapsBetGrid: { flexDirection: 'row', gap: 8 },
  crapsBetArea: { flex: 1, minHeight: 105, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#173328', borderWidth: 1, borderColor: '#4B665B' },
  baccaratSetupIcon: { width: 70, textAlign: 'center', color: colors.goldLight, fontSize: 44 },
  baccaratSetupCopy: { flex: 1, marginLeft: 12 },
  baccaratRules: { marginTop: 18, padding: 17, borderRadius: 18, backgroundColor: '#111E25', borderWidth: 1, borderColor: '#47616B' },
  baccaratRulesCompact: { marginTop: 14 },
  baccaratRulesTitle: { color: colors.goldLight, fontSize: 16, fontWeight: '900', marginBottom: 9 },
  baccaratRuleText: { color: '#D8DDE0', fontSize: 12, lineHeight: 20, marginTop: 3 },
  baccaratOddsGuide: { flexDirection: 'row', justifyContent: 'space-between', gap: 5, marginTop: 13 },
  baccaratOddsGuideText: { flex: 1, paddingVertical: 8, textAlign: 'center', overflow: 'hidden', borderRadius: 9, color: colors.text, backgroundColor: '#24313A', fontSize: 9, fontWeight: '800' },
  baccaratStatusActions: { alignItems: 'flex-end', gap: 7 },
  rulesButton: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 11, backgroundColor: '#18303A', borderWidth: 1, borderColor: '#54717B' },
  rulesButtonText: { color: colors.text, fontSize: 11, fontWeight: '800' },
  baccaratScreen: { flex: 1, backgroundColor: '#071D25' },
  baccaratPage: { padding: 18, paddingBottom: 44 },
  baccaratTable: { marginTop: 20, padding: 16, borderRadius: 70, backgroundColor: '#0A3A36', borderWidth: 3, borderColor: '#B88A30' },
  baccaratHandSection: { minHeight: 158 },
  baccaratHandTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  baccaratHandTitle: { color: colors.goldLight, fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  baccaratScore: { minWidth: 32, height: 28, textAlign: 'center', lineHeight: 28, overflow: 'hidden', borderRadius: 14, color: '#171107', backgroundColor: colors.goldLight, fontSize: 15, fontWeight: '900' },
  baccaratCards: { minHeight: 110, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  baccaratWaiting: { color: '#82A69E', fontSize: 13, fontWeight: '700' },
  baccaratDivider: { height: 1, backgroundColor: '#6D8057', marginVertical: 12 },
  baccaratResult: { marginTop: 16, padding: 16, alignItems: 'center', borderRadius: 18, borderWidth: 1 },
  baccaratPushCard: { backgroundColor: '#202D35', borderColor: '#70808A' },
  baccaratBetRow: { flexDirection: 'row', gap: 8 },
  baccaratBetArea: { flex: 1, minHeight: 104, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#27303A', borderWidth: 1, borderColor: '#59636E' },
  playerBetArea: { backgroundColor: '#17375C' },
  bankerBetArea: { backgroundColor: '#672832' },
  baccaratBetActive: { borderWidth: 3, borderColor: colors.goldLight },
  baccaratBetTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  baccaratOdds: { color: '#D0D5DA', fontSize: 10, marginTop: 4 },
  refillButton: { padding: 18, borderRadius: 17, backgroundColor: '#19382E', borderWidth: 1, borderColor: colors.gold },
  refillButtonTitle: { color: colors.goldLight, fontSize: 16, fontWeight: '900' },
  refillButtonText: { color: colors.muted, fontSize: 11, marginTop: 5 },
  roulettePage: { padding: 18, paddingBottom: 44 },
  rouletteStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rouletteBalance: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 3 },
  difficultyBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, backgroundColor: '#2E2512', borderWidth: 1, borderColor: colors.gold },
  difficultyBadgeText: { color: colors.goldLight, fontSize: 12, fontWeight: '800' },
  rouletteStage: { height: 300, alignItems: 'center', justifyContent: 'center' },
  rouletteMarker: { position: 'absolute', zIndex: 5, top: 4, width: 0, height: 0, borderLeftWidth: 11, borderRightWidth: 11, borderTopWidth: 22, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: colors.goldLight },
  rouletteWheel: { width: 270, height: 270, alignItems: 'center', justifyContent: 'center', borderRadius: 135, backgroundColor: '#6F541C', borderWidth: 8, borderColor: '#D8B85C', shadowColor: '#000000', shadowOpacity: 0.55, shadowRadius: 16, shadowOffset: { width: 0, height: 9 } },
  rouletteWheelSpinning: { borderColor: '#FFE39A' },
  rouletteWheelRing: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#17201D', borderWidth: 2, borderColor: '#E0C276' },
  roulettePocket: { position: 'absolute', width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 4, borderWidth: 0.5, borderColor: '#E8D9AA' },
  roulettePocketRed: { backgroundColor: '#A72F39' },
  roulettePocketBlack: { backgroundColor: '#1A1D21' },
  roulettePocketGreen: { backgroundColor: '#14754F' },
  roulettePocketText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  rouletteBowl: { width: 142, height: 142, alignItems: 'center', justifyContent: 'center', borderRadius: 71, backgroundColor: '#0A392B', borderWidth: 8, borderColor: '#B68D33' },
  rouletteHub: { position: 'absolute', top: 18, width: 22, height: 22, borderRadius: 11, backgroundColor: '#E9CD7A', borderWidth: 4, borderColor: '#725619' },
  rouletteResultNumber: { color: colors.text, fontSize: 38, fontWeight: '900', marginTop: 12 },
  rouletteRedText: { color: '#FF6973' },
  rouletteWheelLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', marginTop: 2 },
  rouletteResultCard: { padding: 15, borderRadius: 16, borderWidth: 1, marginBottom: 2 },
  rouletteWinCard: { backgroundColor: '#12382D', borderColor: colors.green },
  rouletteLossCard: { backgroundColor: '#3A1B20', borderColor: colors.red },
  rouletteResultTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginBottom: 4 },
  rouletteBetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rouletteBetButton: { width: '31%', minHeight: 78, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.panel2, borderWidth: 1, borderColor: colors.border },
  rouletteBetActive: { borderColor: colors.goldLight, borderWidth: 3 },
  rouletteBetText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  rouletteOdds: { color: '#CDD3D8', fontSize: 9, marginTop: 3 },
  numberGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  numberCell: { width: '12%', aspectRatio: 0.82, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#59616A' },
  numberRed: { backgroundColor: '#9D3038' },
  numberBlack: { backgroundColor: '#20242B' },
  numberGreen: { backgroundColor: '#16714D' },
  numberActive: { borderColor: colors.goldLight, borderWidth: 3 },
  numberText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  numberTextWithCoin: { position: 'absolute', bottom: 2, fontSize: 9 },
  numberCoin: { width: 32, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#D9A928', borderWidth: 2, borderColor: '#FFE69A' },
  numberCoinText: { color: '#241803', fontSize: 7, fontWeight: '900', lineHeight: 8 },
  numberCoinUnit: { color: '#493306', fontSize: 5, fontWeight: '900', lineHeight: 6 },
  rouletteSpinButton: { width: '100%', marginTop: 24 },
  gameResultAction: { marginTop: 14 },
  balanceCard: { minHeight: 235, backgroundColor: '#111A24', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#6D5520' },
  balance: { color: colors.text, fontSize: 32, fontWeight: '900', marginVertical: 8 },
  chart: { height: 100, flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 20 },
  chartBar: { flex: 1, minHeight: 8, borderRadius: 4, backgroundColor: colors.gold },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { width: '48%', minHeight: 100, padding: 15, justifyContent: 'space-between', borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '900' },
  difficultyRow: { flexDirection: 'row', gap: 7 },
  difficultyButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel },
  difficultyActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  difficultyText: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  difficultyActiveText: { color: '#171107' },
  helperText: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 10 },
  disclaimerBlock: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 22, padding: 14, borderRadius: 12, backgroundColor: '#0D1119' },
  tabBar: { height: 72, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: '#0B0F17' },
  tabItem: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabIcon: { color: '#707988', fontSize: 22, lineHeight: 24 },
  tabLabel: { color: '#707988', fontSize: 11, fontWeight: '700' },
  tabSelected: { color: colors.gold },
  loadingCover: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
