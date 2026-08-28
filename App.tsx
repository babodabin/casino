import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  PanResponder,
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
const carLogoSources: Record<number, any> = {
  1: require('./assets/racing-logos/mercedes.png'),
  2: require('./assets/racing-logos/mclaren.png'),
  3: require('./assets/racing-logos/redbull.png'),
  4: require('./assets/racing-logos/ferrari.png'),
  5: require('./assets/racing-logos/audi.png'),
  6: require('./assets/racing-logos/astonmartin.png'),
};
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
import { createHwatuDeck, monthNames, type HwatuCard } from './src/hwatu';
import { hwatuCardImages } from './src/hwatuimages';
import { calculateGoStopSettlement, chooseComputerGoStopCard, chooseGoOrStop, dealGoStop, declareGoStopShake, playGoStopBomb, playGoStopTurn, scoreGoStop, type GoStopDeckStyle, type GoStopMode, type GoStopRound } from './src/gostop';
import { chooseComputerMinhwatuCard, dealMinhwatu, playMinhwatuTurn, scoreMinhwatu, settleMinhwatu, type MinhwaRound } from './src/minhwatu';
import { chooseComputerYukbaekCard, createYukbaekMatch, createYukbaekRound, playYukbaekTurn, scoreYukbaek, settleYukbaekRound, type YukbaekMatch } from './src/yukbaek';
import { DEFAULT_SEOTDA_RULES, dealSeotda, evaluateSeotda, resolveSeotda, seotdaRuleLabels, type SeotdaRules } from './src/seotda';
import { dealDori, evaluateDori, resolveDori } from './src/dorijitgottaeng';
import { backupFileName, buildBackup, checkBackup, type BackupData } from './src/backup';
import { levelFromPlays } from './src/level';
import { DAILY_MISSION_GOAL, DAILY_MISSION_REWARD, countPlayedOn, missionDayKey, shouldClaimMission } from './src/mission';
import { decidePokerAction, doriEquity, estimateDrawEquity, estimateEquity, pokerActionLabel, seotdaEquity } from './src/pokerai';
import { evaluatePachislot, pachislotSymbols, spinPachislotReels, spinSlot, type PachislotResult, type PachislotSymbol, type SlotResult, type SlotSymbol } from './src/slot';
import { rollSicBo, sicBoBetLabel, sicBoNet, sicBoPayout, type SicBoBet, type SicBoDice } from './src/sicbo';
import { rollYahtzeeDice, scoreYahtzeeCategory, yahtzeeCategories, yahtzeeCategoryLabels, yahtzeePayoutMultiplier, yahtzeeTotal, yahtzeeUpperBonus, yahtzeeUpperSubtotal, type YahtzeeCategory, type YahtzeeDie, type YahtzeeScoreCard } from './src/yahtzee';
import { drawLotto, drawOddEven, drawScratch, lottoResult, oddEvenWins, scratchResult, type OddEvenChoice, type ScratchSymbol } from './src/worldgames';
import { arrangeChinesePoker, dealChinesePoker, evaluateChineseArrangement, resolveChinesePoker, type ChineseArrangement, type ChineseResult } from './src/chinesepoker';
import { dealTujeon, evaluateTujeon, resolveTujeon, shouldFoldTujeon, tujeonFoldRefund, tujeonMultiplier, tujeonSuitMarks, tujeonWinPayout, type TujeonCard, type TujeonHand, type TujeonSuit } from './src/tujeon';
import { createPusherField, dropPusherCoin, pusherBallPayout, pusherBarPayout, pusherCenterColumn, pusherChuteStart, pusherColumns, pusherGoldPayout, pusherPayout, type PusherCoin, type PusherField } from './src/coinpusher';
import { bigTwoMultiplier, bigTwoOpeningCard, bigTwoValue, bigTwoWinPayout, canBeatBigTwo, chooseBigTwoPlay, classifyBigTwo, legalBigTwoPlays, passBigTwo, playBigTwo, startBigTwo, stepBigTwo, type BigTwoState } from './src/bigtwo';
import { throwYut, throwYutSticks, yutDescription, yutMultiplier, yutOutcomes, yutPayout, yutProbability, type YutFace, type YutOutcome } from './src/yutbet';
import { createShellRound, shellLayoutAfter, shellMultiplier, shellPayout, type ShellRound } from './src/shellgame';
import { createFishField, fishEventText, fishRaceLaps, simulateFishRace, type FishRaceResult, type FishTicket, type RaceFish } from './src/fishrace';
import { luckyFishCaveCount, luckyFishCaves, luckyFishForks, luckyFishMultiplier, luckyFishOffset, luckyFishProbability, swimLuckyFish, type LuckyFishPath } from './src/luckyfish';
import {compareTeenPatti,dealTeenPatti,evaluateTeenPatti} from './src/teenpatti';
import { arrangePaiGow, dealPaiGow, evaluatePaiGowTwo, isValidPaiGowSplit, resolvePaiGow, splitPaiGow, type PaiGowSplit } from './src/paigow';
import { createHorseField, horseBetLabels, horseTicketOdds, requiredHorseSelections, settleHorseTicket, simulateHorseRace, type Horse, type HorseBetType, type HorseRaceResult, type HorseTicket } from './src/horseracing';
import { createCycleField, cycleBetLabels, cycleTicketOdds, requiredCycleSelections, settleCycleTicket, simulateCycleRace, type CycleBetType, type CycleRaceResult, type CycleTicket, type Cyclist } from './src/cycling';
import { boatBetLabels, boatTicketOdds, createBoatField, requiredBoatSelections, settleBoatTicket, simulateBoatRace, type BoatBetType, type BoatRaceResult, type BoatRacer, type BoatTicket } from './src/boatracing';
import { createGreyhoundField, greyhoundBetLabels, greyhoundTicketOdds, requiredGreyhoundSelections, settleGreyhoundTicket, simulateGreyhoundRace, type Greyhound, type GreyhoundBetType, type GreyhoundRaceResult, type GreyhoundTicket } from './src/greyhound';
import { carTicketPayout, createCarField, simulateCarRace, type CarRaceResult, type CarRaceTicket, type RaceCar } from './src/carracing';
import { bullTicketPayout, createBullField, simulateBullTournament, type BullTicket, type BullTournamentResult, type FightingBull } from './src/bullfighting';
import { dealVideoPoker, evaluateVideoPoker, exchangeVideoPoker, videoPokerNet, videoPokerPayout } from './src/videopoker';
import { dealHoldem, dealOmaha, madeHandCards, resolveHoldem, resolveOmaha } from './src/texasholdem';
import { dealSevenPoker, resolveSevenPoker } from './src/sevenpoker';
import { dealFiveCardDraw, exchangeDrawCards, opponentKeepCards, resolveFiveCardDraw } from './src/fivecarddraw';
import { dealHighLow, resolveHighLow } from './src/highlow';
import { summariseWin, isModeWinningShape, canModeWinShape, winButtonLabel, mahjongMinimumNote, type MahjongWinSummary } from './src/mahjongmodes';
import { drawSichuanReplacement, chooseVoidSuit, suitNames, nextVoidDiscard, swapThreeTiles, settleSichuanFullDraw, settleSichuanKan, refundSichuanKanTransfers, settleSichuanMultipleRon, createBloodState, settleSichuanWin, autoPlaySichuanRemainder, activeSichuanSeats, rankSichuanScores, evaluateSichuanFan, sichuanScore, countRoots, sichuanSuits, type SichuanSuit, type SichuanBloodState, type SichuanKanTransfer } from './src/sichuanmahjong';
import { createHongKongMatch, settleHongKongWin, settleHongKongMultipleRon, settleHongKongDraw, hongKongRoundLabel, rankHongKongScores, shuffleFlowers, createFlowerTiles, dealInitialHongKongFlowers, evaluateHongKongFaan, hongKongScore, drawHongKongTurn, HONG_KONG_MIN_FAAN, HONG_KONG_MIN_OPTIONS, type HongKongFlower, type HongKongMatchState } from './src/hongkongmahjong';
import { createChineseMatch, settleChineseWin, settleChineseMultipleRon, settleChineseDraw, chineseRoundLabel, rankChineseScores, evaluateChineseYaku, chineseScore, type ChineseMatchState } from './src/chinesemahjong';
import { canDeclareRiichiNow, chooseCallByPriority, drawModeSupplement, getModeCallOptions, isDoubleRiichiDeclaration, isMahjongSessionFinished, mahjongDealerSeat, reconcileSichuanKanEvent } from './src/mahjongflow';
import { isRedFive, DEFAULT_RIICHI_RULES, riichiRuleLabels, type RiichiRuleOptions, advanceRiichiMatch, applyMahjongCall, countYakumanMultiplier, seatWindFor, roundWindFor, getAnkanOptions, getKakanOptions, applyAnkan, applyKakan, ankanKeepsWait, canRobKan, deadWallDoraIndicators, deadWallUraIndicators, drawReplacementTile, MAX_KAN_PER_ROUND, canDeclareNineTerminals, countNineTerminals, isFourWindDiscardAbort, isFourRiichiAbort, isFourKanAbort, isNagashiMangan, nagashiManganPayments, type MahjongKanOption, calculateNotenPayments, calculateRiichiFu, calculateRiichiScore, canRonMahjong, chooseComputerCall, chooseComputerDiscard, countMahjongDora, dealRiichi, discardTile, doraFromIndicator, drawTile as drawMahjongTile, evaluateBasicRiichiYaku, getMahjongCallOptions, getMahjongWaits, getRiichiDiscardOptions, isMahjongFuriten, isWinningMahjongHand, playOneComputerTurn, rankRiichiScores, riichiRoundLabel, settleRiichiWin, settleMultipleRon, sortMahjongHand, suggestBeginnerRiichiYaku, suggestRiichiDiscards, tileDangerScore, type MahjongCallOption, type RiichiMatchState, type MahjongTile } from './src/riichimahjong';

type Tab = '홈' | '게임' | '지갑' | '기록' | '설정';
type MahjongMode = 'riichi'|'chinese'|'hongkong'|'sichuan';
type AppScreen = 'tabs' | 'categoryCatalog' | 'gamePreview' | 'carSetup' | 'carGame' | 'bullSetup' | 'bullGame' | 'yutSetup' | 'yutGame' | 'shellSetup' | 'shellGame' | 'fishRaceSetup' | 'fishRaceGame' | 'luckyFishSetup' | 'luckyFishGame' | 'blackjackSetup' | 'blackjackGame' | 'rouletteGame' | 'baccaratSetup' | 'baccaratGame' | 'crapsSetup' | 'crapsGame' | 'slotSetup' | 'slotGame' | 'pachislotGame' | 'sicboSetup' | 'sicboGame' | 'yahtzeeSetup' | 'yahtzeeGame' | 'oddEvenSetup' | 'oddEvenGame' | 'lottoSetup' | 'lottoGame' | 'scratchSetup' | 'scratchGame' | 'teenPattiSetup' | 'teenPattiGame' | 'paiGowSetup' | 'paiGowGame' | 'horseSetup' | 'horseGame' | 'cycleSetup' | 'cycleGame' | 'boatSetup' | 'boatGame' | 'greyhoundSetup' | 'greyhoundGame' | 'rouletteSetup' | 'videoPokerSetup' | 'videoPokerGame' | 'holdemSetup' | 'holdemGame' | 'omahaSetup' | 'omahaGame' | 'sevenPokerSetup' | 'sevenPokerGame' | 'fiveDrawSetup' | 'fiveDrawGame' | 'chinesePokerSetup' | 'chinesePokerGame' | 'highLowSetup' | 'highLowGame' | 'riichiSetup' | 'riichiGame' | 'chineseMahjongSetup' | 'chineseMahjongGame' | 'hongKongMahjongSetup' | 'hongKongMahjongGame' | 'sichuanMahjongSetup' | 'sichuanMahjongGame' | 'seotdaSetup' | 'seotdaGame' | 'doriSetup' | 'doriGame' | 'gostopSetup' | 'gostopGame' | 'matgoSetup' | 'matgoGame' | 'minhwatuSetup' | 'minhwatuGame' | 'yukbaekSetup' | 'yukbaekGame' | 'tujeonSetup' | 'tujeonGame' | 'bigTwoSetup' | 'bigTwoGame' | 'pusherSetup' | 'pusherGame';

type CatalogGame = { name: string; icon: string; description: string; status: 'playable' | 'planned' };
type GameCategory = { name: string; icon: string; detail: string; eyebrow: string; games: CatalogGame[] };

type GameRecord = {
  id: string;
  game: '블랙잭' | '룰렛' | '바카라' | '크랩스' | '슬롯' | '식보' | '야찌' | '홀짝' | '공 어디에?' | '로또' | '즉석 복권' | '틴 파티' | '파이 고우' | '경마' | '경륜' | '경정' | '그레이하운드' | '자동차 레이스' | '소싸움' | '피시 레이스' | '행운의 물고기' | '비디오 포커' | '텍사스 홀덤' | '오마하' | '세븐 포커' | '파이브 카드 드로우' | '차이니즈 포커' | '하이로우' | '리치 마작' | '중국식 마작' | '홍콩 마작' | '사천 마작' | '고스톱' | '맞고' | '민화투' | '육백' | '윷 베팅' | '섰다' | '도리짓고땡' | '투전' | '빅투' | '코인 푸셔';
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
const chineseGameNames: Record<string, string> = { '식보': '骰寶, Sic Bo', '파이 고우': '牌九, Pai Gow', '차이니즈 포커': '十三水, Chinese Poker', '투전': '鬪箋' };
const gameDisplayName = (name: string) => chineseGameNames[name] ? `${name}(${chineseGameNames[name]})` : englishGameNames[name] ? `${name}(${englishGameNames[name]})` : name;

const gameCategories: GameCategory[] = [
  { name: '한국 전통', icon: '花', detail: '고스톱 · 맞고 · 섰다', eyebrow: 'KOREAN CLASSICS', games: [
    { name: '고스톱', icon: '花', description: '세 명이 화투패를 모아 고 또는 스톱을 선택', status: 'playable' },
    { name: '맞고', icon: '二', description: '두 명이 열 장씩 받아 빠르게 겨루는 고스톱', status: 'playable' },
    { name: '섰다', icon: '光', description: '두 장의 화투 조합으로 승부', status: 'playable' },
    { name: '도리짓고땡', icon: '十', description: '다섯 장 중 셋으로 짓고 남은 둘로 승부', status: 'playable' },
    { name: '투전', icon: '箋', description: '여든 장 종이패로 같은 숫자를 짝지어 겨루는 노름', status: 'playable' },
    { name: '윷 베팅', icon: '윷', description: '도·개·걸·윷·모 중 던진 결과를 예측', status: 'playable' },
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
    { name: '차이니즈 포커', icon: '十三', description: '열세 장을 세 줄로 나눠 줄마다 겨루는 카드 게임', status: 'playable' },
    { name: '비디오 포커', icon: 'VP', description: '다섯 장 중 필요한 카드를 보관하고 교환', status: 'playable' },
    { name: '하이로우', icon: '↕', description: '높은 패와 낮은 패로 팟을 나누어 승부', status: 'playable' },
  ]},
  { name: '마작', icon: '發', detail: '리치 · 중국식 마작', eyebrow: 'MAHJONG', games: [
    { name: '리치 마작', icon: '立', description: '패를 뽑고 버려 네 몸통과 한 머리를 완성', status: 'playable' },
    { name: '중국식 마작', icon: '中', description: '136장으로 즐기는 중국 표준형 마작', status: 'playable' },
    { name: '홍콩 마작', icon: '港', description: '빠르고 직관적인 홍콩식 마작', status: 'playable' },
    { name: '사천 마작', icon: '川', description: '자패 없이 세 종류 숫자패로 승부', status: 'playable' },
  ]},
  { name: '스포츠/아케이드', icon: '⚑', detail: '경마 · 경륜 · 아케이드', eyebrow: 'SPORTS & ARCADE', games: [
    { name: '경마', icon: '馬', description: '출전마를 분석하고 결승 순위를 예측', status: 'playable' },
    { name: '경륜', icon: '輪', description: '일곱 선수의 전법과 막판 스퍼트를 예측', status: 'playable' },
    { name: '경정', icon: '艇', description: '6대 보트의 스타트와 1마크 선회를 예측', status: 'playable' },
    { name: '코인 푸셔', icon: '◉', description: '동전을 넣어 밀어내는 오락실 기계', status: 'playable' },
    { name: '피시 레이스', icon: '魚', description: '여섯 물고기의 수중 장애물 경주 우승자를 예측', status: 'playable' },
    { name: '행운의 물고기', icon: '🐠', description: '갈림길을 헤엄친 물고기가 들어갈 동굴을 예측', status: 'playable' },
  ]},
  { name: '세계 게임', icon: '◎', detail: '세계 전통 · 주사위 · 복권', eyebrow: 'WORLD GAMES', games: [
    { name: '야찌', icon: '⚄', description: '다섯 주사위를 굴려 목표 조합과 최고 점수를 만드는 게임', status: 'playable' },
    { name: '파이 고우', icon: '牌', description: '7장을 5장 하이와 2장 로우로 나누는 카드 게임', status: 'playable' },
    { name: '틴 파티', icon: '十', description: '인도권에서 사랑받는 세 장 카드 게임', status: 'playable' },
    { name: '빅투', icon: '2♠', description: '손에 든 열세 장을 먼저 다 내려놓는 카드 게임', status: 'playable' },
    { name: '즉석 복권', icon: '票', description: '바로 결과를 확인하는 가상 복권', status: 'playable' },
    { name: '공 어디에?', icon: '●', description: '빠르게 섞이는 컵 속 공의 위치를 찾는 게임', status: 'playable' },
  ]},
];

/** 게임 이름 → 카테고리. 지갑의 카테고리별 손익을 실제 기록으로 계산할 때 씁니다. */
/**
 * 카탈로그에서 고른 게임 이름 → 처음 열릴 화면.
 * 플레이 가능한 게임은 전부 준비 화면(베팅 등급·금액 선택)을 먼저 거칩니다.
 */
const gameEntryScreens: Record<string, AppScreen> = {
  '블랙잭': 'blackjackSetup',
  '룰렛': 'rouletteSetup',
  '바카라': 'baccaratSetup',
  '크랩스': 'crapsSetup',
  '슬롯': 'slotSetup',
  '식보': 'sicboSetup',
  '야찌': 'yahtzeeSetup',
  '홀짝': 'oddEvenSetup', '공 어디에?':'shellSetup', '로또':'lottoSetup', '즉석 복권':'scratchSetup',
  '틴 파티':'teenPattiSetup',
  '파이 고우':'paiGowSetup',
  '경마':'horseSetup',
  '경륜':'cycleSetup',
  '경정':'boatSetup',
  '그레이하운드':'greyhoundSetup',
  '코인 푸셔':'pusherSetup',
  '자동차 레이스':'carSetup',
  '소싸움':'bullSetup',
  '피시 레이스':'fishRaceSetup',
  '행운의 물고기':'luckyFishSetup',
  '비디오 포커': 'videoPokerSetup',
  '텍사스 홀덤': 'holdemSetup',
  '오마하': 'omahaSetup',
  '세븐 포커': 'sevenPokerSetup',
  '파이브 카드 드로우': 'fiveDrawSetup',
  '차이니즈 포커': 'chinesePokerSetup',
  '하이로우': 'highLowSetup',
  '리치 마작': 'riichiSetup',
  '중국식 마작': 'chineseMahjongSetup',
  '홍콩 마작': 'hongKongMahjongSetup',
  '사천 마작': 'sichuanMahjongSetup',
  '고스톱': 'gostopSetup',
  '맞고': 'matgoSetup',
  '민화투': 'minhwatuSetup',
  '투전': 'tujeonSetup',
  '빅투': 'bigTwoSetup',
  '육백': 'yukbaekSetup',
  '윷 베팅': 'yutSetup',
  '섰다': 'seotdaSetup',
  '도리짓고땡': 'doriSetup',
};
const screenForGame = (name: string): AppScreen => gameEntryScreens[name] ?? 'gamePreview';


const gameCategoryOf = (game: string) => gameCategories.find((category) => category.games.some((item) => item.name === game))?.name ?? '기타';

const europeanWheelOrder = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

const STORAGE_KEYS = {
  coins: 'world-casino.coins',
  difficulty: 'world-casino.difficulty',
  records: 'world-casino.records',
  testGrant: 'world-casino.test-grant-100k-v1',
  preferences: 'world-casino.preferences',
  missionClaimed: 'world-casino.mission-claimed',
  totalPlays: 'world-casino.total-plays',
  lastGame: 'world-casino.last-game',
  // 코인 푸셔의 판은 실제 기계처럼 이어집니다. 새로 열 때마다 동전을 다시 깔아 주면
  // 조금만 넣고 나가기를 반복하는 것이 이득이 되기 때문입니다.
  pusherField: 'world-casino.pusher-field',
};


/** 게임 진행 속도. 숫자는 애니메이션 길이에 곱하는 배수입니다. */
export type GameSpeed = '느림' | '보통' | '빠름';
const gameSpeedOptions: { name: GameSpeed; factor: number; detail: string }[] = [
  { name: '느림', factor: 1.8, detail: '연출을 길게 보고 싶을 때' },
  { name: '보통', factor: 1, detail: '기본 속도' },
  { name: '빠름', factor: 0.45, detail: '결과를 빨리 확인하고 싶을 때' },
];
const gameSpeedFactor = (speed: GameSpeed) => gameSpeedOptions.find((option) => option.name === speed)?.factor ?? 1;

/** 접근성 설정. 저장되는 값 전부입니다. */
export type AccessibilityOptions = {
  /** 글자와 패를 키웁니다 */
  largeText: boolean;
  /** 배경을 더 어둡게, 글자와 테두리를 더 밝게 */
  highContrast: boolean;
  /** 회전·굴림 연출을 거의 없앱니다 */
  reduceMotion: boolean;
};
const DEFAULT_ACCESSIBILITY: AccessibilityOptions = { largeText: false, highContrast: false, reduceMotion: false };
const accessibilityLabels: Record<keyof AccessibilityOptions, { title: string; detail: string }> = {
  largeText: { title: '큰 글씨', detail: '앱 전체 글자 크기를 약 1.15배로 키웁니다' },
  highContrast: { title: '고대비', detail: '배경을 더 어둡게, 글자와 경계선을 더 밝게 만듭니다' },
  reduceMotion: { title: '애니메이션 줄이기', detail: '룰렛·슬롯·주사위 회전 연출을 거의 없앱니다' },
};

const tabs: { name: Tab; icon: string }[] = [
  { name: '홈', icon: '⌂' },
  { name: '게임', icon: '♠' },
  { name: '지갑', icon: '◈' },
  { name: '기록', icon: '▥' },
  { name: '설정', icon: '⚙' },
];

const categories = gameCategories.map(({ name, icon, detail }) => ({ name, icon, detail }));

/**
 * 화면 어딘가에서 에러가 나면 하얀 화면이 되는 대신 안내를 보여 줍니다.
 * 렌더링 중에 난 에러만 잡을 수 있고, 버튼 누른 뒤 비동기로 나는 에러는 못 잡습니다.
 */
class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    // 개발 중 원인을 찾을 수 있게 콘솔에는 남깁니다.
    console.error('화면에서 에러가 발생했습니다', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorMark}>◆</Text>
        <Text style={styles.errorTitle}>화면을 그리다가 문제가 생겼습니다</Text>
        <Text style={styles.errorText}>저장된 코인과 기록은 그대로 있습니다. 아래 버튼으로 다시 시작해 보세요.</Text>
        <View style={styles.errorDetailBox}>
          <Text style={styles.errorDetail}>{this.state.error.message || String(this.state.error)}</Text>
        </View>
        <Pressable style={[styles.primaryButton, styles.fullWidthButton]} onPress={() => this.setState({ error: null })}>
          <Text style={styles.primaryButtonText}>다시 시도</Text>
        </Pressable>
        {Platform.OS === 'web' && (
          <Pressable style={styles.errorSecondary} onPress={() => window.location.reload()}>
            <Text style={styles.errorSecondaryText}>앱 새로 열기</Text>
          </Pressable>
        )}
      </View>
    );
  }
}

export default function App() {
  return <AppErrorBoundary><CasinoApp /></AppErrorBoundary>;
}

function CasinoApp() {
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
  const [gameSpeed, setGameSpeed] = useState<GameSpeed>('보통');
  const [accessibility, setAccessibility] = useState<AccessibilityOptions>(DEFAULT_ACCESSIBILITY);
  // 미션 보상을 받은 날짜. 같은 날 두 번 주지 않기 위해 저장합니다.
  const [missionClaimedDay, setMissionClaimedDay] = useState('');
  // 기록은 최근 100판만 보관하므로, 레벨용 누적 판수는 따로 셉니다.
  const [totalPlays, setTotalPlays] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>(gameCategories[1]);
  const [selectedCatalogGame, setSelectedCatalogGame] = useState<CatalogGame>(gameCategories[1].games[0]);
  const [slotMode, setSlotMode] = useState<'classic' | 'pachislot'>('classic');
  const [seotdaRules, setSeotdaRules] = useState<SeotdaRules>(DEFAULT_SEOTDA_RULES);
  const [goStopDeckStyle,setGoStopDeckStyle]=useState<GoStopDeckStyle>('classic');
  // 홈의 '이어서 하기'는 마지막으로 '고른' 게임을 보여 줍니다(끝까지 안 해도 됩니다).
  const [lastGame, setLastGame] = useState<GameRecord['game'] | ''>('');

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.coins),
      AsyncStorage.getItem(STORAGE_KEYS.difficulty),
      AsyncStorage.getItem(STORAGE_KEYS.records),
      AsyncStorage.getItem(STORAGE_KEYS.testGrant),
      AsyncStorage.getItem(STORAGE_KEYS.preferences),
      AsyncStorage.getItem(STORAGE_KEYS.missionClaimed),
      AsyncStorage.getItem(STORAGE_KEYS.totalPlays),
      AsyncStorage.getItem(STORAGE_KEYS.lastGame),
    ]).then(([savedCoins, savedDifficulty, savedRecords, testGrant, savedPreferences, savedMissionDay, savedTotalPlays, savedLastGame]) => {
      if (savedLastGame) setLastGame(savedLastGame as GameRecord['game']);
      if (savedMissionDay) setMissionClaimedDay(savedMissionDay);
      if (savedTotalPlays && Number.isFinite(Number(savedTotalPlays))) setTotalPlays(Math.max(0, Number(savedTotalPlays)));
      if (!testGrant) {
        const refilledCoins = Math.max(Number(savedCoins ?? 0), 100000);
        setCoins(refilledCoins);
        AsyncStorage.setItem(STORAGE_KEYS.testGrant, 'done').catch(() => {});
      } else if (savedCoins && Number.isFinite(Number(savedCoins))) {
        setCoins(Number(savedCoins));
      } else {
        setCoins(100000);
      }
      if (savedDifficulty) setDifficulty(savedDifficulty);
      // 저장된 기록이 깨져 있어도 앱이 시작되지 못하는 일은 없어야 합니다.
      if (savedRecords) {
        try {
          const parsed = JSON.parse(savedRecords);
          if (Array.isArray(parsed)) setRecords(parsed);
        } catch {
          AsyncStorage.removeItem(STORAGE_KEYS.records).catch(() => {});
        }
      }
      // 설정도 기록과 같은 이유로, 깨져 있으면 기본값으로 시작합니다.
      if (savedPreferences) {
        try {
          const parsed = JSON.parse(savedPreferences) as Partial<{ sound: boolean; vibration: boolean; gameSpeed: GameSpeed; accessibility: Partial<AccessibilityOptions> }>;
          if (typeof parsed.sound === 'boolean') setSound(parsed.sound);
          if (typeof parsed.vibration === 'boolean') setVibration(parsed.vibration);
          if (parsed.gameSpeed && gameSpeedOptions.some((option) => option.name === parsed.gameSpeed)) setGameSpeed(parsed.gameSpeed);
          if (parsed.accessibility) setAccessibility({ ...DEFAULT_ACCESSIBILITY, ...parsed.accessibility });
        } catch {
          AsyncStorage.removeItem(STORAGE_KEYS.preferences).catch(() => {});
        }
      }
    })
      .catch(() => {})
      // 저장소를 읽지 못해도 로딩 화면에서 멈추지 않고 기본값으로 시작합니다.
      .finally(() => setLoaded(true));
  }, []);

  // 저장은 상태 업데이터 안이 아니라 여기 한 곳에서만 일어납니다.
  // (업데이터는 순수해야 하며, React가 두 번 호출하거나 결과를 버릴 수 있습니다.)
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.coins, String(coins)).catch(() => {});
  }, [coins, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify({ sound, vibration, gameSpeed, accessibility })).catch(() => {});
  }, [sound, vibration, gameSpeed, accessibility, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.totalPlays, String(totalPlays)).catch(() => {});
  }, [totalPlays, loaded]);

  useEffect(() => {
    if (!loaded || !lastGame) return;
    AsyncStorage.setItem(STORAGE_KEYS.lastGame, lastGame).catch(() => {});
  }, [lastGame, loaded]);

  // 오늘의 미션 보상. 오늘 세 판을 채우면 코인을 실제로 넣어 주고,
  // 같은 날 다시 주지 않도록 날짜를 저장합니다.
  const missionDay = missionDayKey(new Date());
  const missionDone = Math.min(countPlayedOn(records, missionDay), DAILY_MISSION_GOAL);
  const missionClaimed = missionClaimedDay === missionDay;
  useEffect(() => {
    if (!loaded || !shouldClaimMission(missionDone, missionClaimedDay, missionDay)) return;
    setCoins((current) => current + DAILY_MISSION_REWARD);
    setMissionClaimedDay(missionDay);
    AsyncStorage.setItem(STORAGE_KEYS.missionClaimed, missionDay).catch(() => {});
  }, [loaded, missionClaimed, missionDone, missionDay]);

  // 큰 글씨와 고대비는 화면 전체에 걸리는 설정이라 앱 루트에 한 번만 적용합니다.
  // (웹 빌드 전용. 네이티브에서는 아무 일도 하지 않습니다.)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const root = document.getElementById('root') ?? document.body;
    if (!root) return;
    const style = root.style as CSSStyleDeclaration & { zoom?: string };
    style.zoom = accessibility.largeText ? '1.15' : '';
    style.filter = accessibility.highContrast ? 'contrast(1.28) saturate(1.12)' : '';
    return () => { style.zoom = ''; style.filter = ''; };
  }, [accessibility.largeText, accessibility.highContrast]);

  // 애니메이션 길이에 곱하는 배수 하나로 룰렛·슬롯·파치슬롯·식보 연출을 모두 조절합니다.
  const motion = accessibility.reduceMotion ? 0.08 : gameSpeedFactor(gameSpeed);

  // 노치와 홈 인디케이터가 차지하는 높이. 웹에서는 CSS env()를 재서 가져옵니다.
  // (네이티브에서는 0으로 두고 화면이 알아서 처리하게 합니다.)
  const [insets, setInsets] = useState({ top: 0, bottom: 0 });
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    // 아이폰에서 env(safe-area-inset-*)이 실제 값을 주려면 뷰포트에 viewport-fit=cover가 있어야 합니다.
    // Expo가 만드는 index.html에는 없어서 여기서 붙입니다.
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      const content = viewport.getAttribute('content') ?? '';
      if (!content.includes('viewport-fit')) viewport.setAttribute('content', `${content}, viewport-fit=cover`);
    }
    // 홈 화면에 추가해서 전체화면으로 열었는지. 이때만 상태바 자리를 앱이 직접 비워야 합니다.
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches
      || (window.navigator as { standalone?: boolean }).standalone === true;
    const measure = () => {
      const probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);';
      document.body.appendChild(probe);
      const style = window.getComputedStyle(probe);
      let top = parseFloat(style.paddingTop) || 0;
      const bottom = parseFloat(style.paddingBottom) || 0;
      probe.remove();
      // 전체화면인데 값을 못 읽으면 헤더가 시계와 겹칩니다. 그럴 때만 최소값을 둡니다.
      if (standalone && top === 0) top = 44;
      const next = { top, bottom };
      setInsets((current) => (current.top === next.top && current.bottom === next.bottom ? current : next));
    };
    measure();
    // 켜자마자는 값이 아직 0으로 나올 수 있어 몇 번 더 잽니다.
    const again = window.requestAnimationFrame(measure);
    const later = window.setTimeout(measure, 400);
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      window.cancelAnimationFrame(again);
      window.clearTimeout(later);
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, []);


  // 백업 내보내기·가져오기. 가져오기는 검사를 통과한 뒤 확인을 받고 나서야 반영합니다.
  const [backupNote, setBackupNote] = useState('');
  const [pendingImport, setPendingImport] = useState<{ data: BackupData; summary: string } | null>(null);

  const exportBackup = () => {
    try {
      const savedAt = new Date().toISOString();
      const payload = buildBackup({ coins, totalPlays, difficulty, records, preferences: { sound, vibration, gameSpeed, accessibility }, savedAt });
      if (Platform.OS !== 'web' || typeof document === 'undefined') { setBackupNote('이 기기에서는 파일로 내보낼 수 없습니다.'); return; }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backupFileName(savedAt);
      document.body.appendChild(link);
      link.click();
      link.remove();
      // 브라우저가 저장을 끝낼 시간을 준 뒤 정리합니다.
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setBackupNote(`${backupFileName(savedAt)} 로 내보냈습니다 · 코인 ${coins.toLocaleString()} WC · 기록 ${records.length}건`);
    } catch {
      setBackupNote('내보내는 중 문제가 생겼습니다. 다시 시도해 주세요.');
    }
  };

  const pickBackupFile = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') { setBackupNote('이 기기에서는 파일을 열 수 없습니다.'); return; }
    setBackupNote('');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onerror = () => setBackupNote('파일을 여는 데 실패했습니다.');
      reader.onload = () => {
        const check = checkBackup(String(reader.result ?? ''));
        if (!check.ok) { setPendingImport(null); setBackupNote(check.reason); return; }
        setPendingImport({ data: check.data, summary: check.summary });
        setBackupNote('');
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // 확인을 누른 뒤에야 실제로 덮어씁니다.
  const applyImport = () => {
    if (!pendingImport) return;
    const { data } = pendingImport;
    setCoins(data.coins);
    setTotalPlays(data.totalPlays);
    setDifficulty(data.difficulty);
    setRecords(data.records as GameRecord[]);
    const preferences = data.preferences as Partial<{ sound: boolean; vibration: boolean; gameSpeed: GameSpeed; accessibility: Partial<AccessibilityOptions> }> | undefined;
    if (preferences) {
      if (typeof preferences.sound === 'boolean') setSound(preferences.sound);
      if (typeof preferences.vibration === 'boolean') setVibration(preferences.vibration);
      if (preferences.gameSpeed && gameSpeedOptions.some((option) => option.name === preferences.gameSpeed)) setGameSpeed(preferences.gameSpeed);
      if (preferences.accessibility) setAccessibility({ ...DEFAULT_ACCESSIBILITY, ...preferences.accessibility });
    }
    setPendingImport(null);
    setBackupNote(`가져왔습니다 · ${pendingImport.summary}`);
  };


  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records)).catch(() => {});
  }, [records, loaded]);

  const saveDifficulty = (value: string) => {
    setDifficulty(value);
    const option = difficultyOptions.find((item) => item.name === value);
    if (option) setSelectedBet(option.bets[Math.min(1, option.bets.length - 1)]);
    AsyncStorage.setItem(STORAGE_KEYS.difficulty, value).catch(() => {});
  };

  const refillTestCoins = () => {
    setCoins(100000);
  };

  // 같은 렌더 안에서 차감이 연속으로 일어나도 정확하도록 잔액을 ref로 함께 추적합니다.
  const coinsRef = useRef(coins);
  coinsRef.current = coins;

  const placeBet = (stake: number) => {
    if (stake > coinsRef.current) return false;
    coinsRef.current -= stake;
    setCoins((current) => current - stake);
    return true;
  };

  const startBlackjack = () => {
    if (!placeBet(selectedBet)) return;
    setGameRoundId((value) => value + 1);
    setAppScreen('blackjackGame');
  };

  const doubleBlackjack = () => placeBet(selectedBet);

  const placeInsurance = (stake: number) => placeBet(stake);

  const settleInsurance = (won: boolean, stake: number) => {
    const payout = insurancePayout(stake, won);
    if (payout > 0) {
      setCoins((currentCoins) => currentCoins + payout);
    }
  };

  const settleBlackjack = (result: RoundResult, roundBet = selectedBet) => {
    const payout = payoutForResult(roundBet, result);
    setCoins((currentCoins) => currentCoins + payout);

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
      return nextRecords;
    });
  };

  const settleRoulette = (bet: RouletteBet, stake: number, number: number, label: string) => {
    const payout = roulettePayout(bet, stake, number);
    const won = rouletteBetWins(bet, number);
    if (payout > 0) {
      setCoins((currentCoins) => currentCoins + payout);
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
      return nextRecords;
    });
  };

  const settleBaccarat = (bet: BaccaratBet, stake: number, winner: BaccaratWinner) => {
    const payout = baccaratPayout(bet, stake, winner);
    const net = baccaratNet(bet, stake, winner);
    if (payout > 0) {
      setCoins((currentCoins) => currentCoins + payout);
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
      return nextRecords;
    });
  };

  /**
   * 기록 추가는 여기 한 곳만 씁니다.
   * 기록은 최근 100판만 남기지만 레벨용 누적 판수는 계속 늘어나야 하므로
   * 두 가지를 같이 갱신합니다.
   */
  const addRecord = (make: (count: number) => GameRecord) => {
    setRecords((current) => [make(current.length), ...current].slice(0, 100));
    setTotalPlays((current) => current + 1);
  };

  const settleCraps = (bet: CrapsBet, stake: number, result: CrapsRollResult) => {
    const payout = crapsPayout(bet, stake, result);
    const net = crapsNet(bet, stake, result);
    if (payout > 0) setCoins((current) => current + payout);
    const names = { pass: '패스 라인', dontPass: '돈트 패스', field: '필드' } as const;
    addRecord((count) => ({ id: `${Date.now()}-craps-${count}`, game: '크랩스', result: net > 0 ? 'win' : net < 0 ? 'loss' : 'push', difficulty, bet: stake, net, playedAt: new Date().toISOString(), detail: `${names[bet]} · 주사위 합 ${result.total}` }));
  };

  const settleSlot = (stake: number, result: SlotResult, usedFreeSpin: boolean) => {
    if (result.payout > 0) setCoins((current) => current + result.payout);
    const net = result.payout - (usedFreeSpin ? 0 : stake);
    addRecord((count) => ({ id: `${Date.now()}-slot-${count}`, game: '슬롯', result: net > 0 ? 'win' : net < 0 ? 'loss' : 'push', difficulty, bet: usedFreeSpin ? 0 : stake, net, playedAt: new Date().toISOString(), detail: `${result.reels.join(' ')} · ${result.label}` }));
  };

  const settlePachislot = (stake: number, result: PachislotResult, usedFreeGame: boolean) => {
    if (result.payout > 0) setCoins((current) => current + result.payout);
    const net = result.payout - (usedFreeGame ? 0 : stake);
    addRecord((count) => ({ id: `${Date.now()}-pachislot-${count}`, game: '슬롯', result: net > 0 ? 'win' : net < 0 ? 'loss' : 'push', difficulty, bet: usedFreeGame ? 0 : stake, net, playedAt: new Date().toISOString(), detail: `파치슬롯 · ${result.reels.join(' ')} · ${result.label}` }));
  };

  const settleSicBo = (bet: SicBoBet, stake: number, dice: SicBoDice) => {
    const payout = sicBoPayout(bet, stake, dice); const net = sicBoNet(bet, stake, dice);
    if (payout > 0) setCoins((current) => current + payout);
    addRecord((count) => ({ id: `${Date.now()}-sicbo-${count}`, game: '식보', result: net > 0 ? 'win' : 'loss', difficulty, bet: stake, net, playedAt: new Date().toISOString(), detail: `${sicBoBetLabel(bet)} · ${dice.join('·')} · 합계 ${dice[0] + dice[1] + dice[2]}` }));
  };

  const settleYahtzee = (stake:number, score:number, multiplier:number) => {
    const payout=stake*multiplier; const net=payout-stake;
    if(payout>0)setCoins((current)=>current+payout);
    addRecord((count)=>({id:`${Date.now()}-yahtzee-${count}`,game:'야찌',result:net>0?'win':'loss',difficulty,bet:stake,net,playedAt:new Date().toISOString(),detail:`최종 ${score}점 · ${multiplier?`${multiplier}배 지급`:'목표 미달'}`}));
  };
  const settleWorldInstant=(game:'홀짝'|'로또'|'즉석 복권',stake:number,multiplier:number,detail:string)=>{
    const payout=stake*multiplier,net=payout-stake;if(payout)setCoins((current)=>current+payout);
    addRecord((count)=>({id:`${Date.now()}-world-${count}`,game,result:net>0?'win':net===0?'push':'loss',difficulty,bet:stake,net,playedAt:new Date().toISOString(),detail}));
  };
  const settleNewGame=(game:'윷 베팅'|'공 어디에?'|'피시 레이스'|'행운의 물고기'|'차이니즈 포커'|'투전'|'빅투'|'코인 푸셔',stake:number,multiplier:number,detail:string)=>{
    const payout=Math.round(stake*multiplier),net=payout-stake;
    if(payout>0)setCoins((current)=>current+payout);
    addRecord((count)=>({id:`${Date.now()}-new-${count}`,game,result:net>0?'win':net===0?'push':'loss',difficulty,bet:stake,net,playedAt:new Date().toISOString(),detail}));
  };
  const settleTeenPatti=(mine:number,theirs:number,result:'win'|'loss'|'push',detail:string)=>{
    const payout=result==='win'?mine+theirs:result==='push'?mine:0,net=payout-mine;if(payout)setCoins((current)=>current+payout);
    addRecord((count)=>({id:`${Date.now()}-teen-patti-${count}`,game:'틴 파티',result,difficulty,bet:mine,net,playedAt:new Date().toISOString(),detail}));
  };
  const settlePaiGow=(stake:number,result:'win'|'loss'|'push',detail:string)=>{
    const payout=result==='win'?stake*2:result==='push'?stake:0,net=payout-stake;
    if(payout)setCoins((current)=>current+payout);
    addRecord((count)=>({id:`${Date.now()}-pai-gow-${count}`,game:'파이 고우',result,difficulty,bet:stake,net,playedAt:new Date().toISOString(),detail}));
  };
  const settleHorseRace=(ticket:HorseTicket,race:HorseRaceResult)=>{
    const payout=settleHorseTicket(ticket,race),net=payout-ticket.stake;
    if(payout)setCoins((current)=>current+payout);
    addRecord((count)=>({id:`${Date.now()}-horse-${count}`,game:'경마',result:net>0?'win':'loss',difficulty,bet:ticket.stake,net,playedAt:new Date().toISOString(),detail:`${horseBetLabels[ticket.type]} ${ticket.selections.join('→')} · 결승 ${race.order.slice(0,3).join('→')} · 배당 ${ticket.odds.toFixed(1)}배`}));
  };
  const settleCycleRace=(ticket:CycleTicket,race:CycleRaceResult)=>{
    const payout=settleCycleTicket(ticket,race),net=payout-ticket.stake;if(payout)setCoins((current)=>current+payout);
    addRecord((count)=>({id:`${Date.now()}-cycle-${count}`,game:'경륜',result:net>0?'win':'loss',difficulty,bet:ticket.stake,net,playedAt:new Date().toISOString(),detail:`${cycleBetLabels[ticket.type]} ${ticket.selections.join('→')} · 결승 ${race.order.slice(0,3).join('→')} · 배당 ${ticket.odds.toFixed(1)}배`}));
  };
  const settleBoatRace=(ticket:BoatTicket,race:BoatRaceResult)=>{
    const payout=settleBoatTicket(ticket,race),net=payout-ticket.stake;if(payout)setCoins((current)=>current+payout);
    addRecord((count)=>({id:`${Date.now()}-boat-${count}`,game:'경정',result:net>0?'win':'loss',difficulty,bet:ticket.stake,net,playedAt:new Date().toISOString(),detail:`${boatBetLabels[ticket.type]} ${ticket.selections.join('→')} · 결승 ${race.order.slice(0,3).join('→')} · 배당 ${ticket.odds.toFixed(1)}배`}));
  };
  const settleGreyhoundRace=(ticket:GreyhoundTicket,race:GreyhoundRaceResult)=>{
    const payout=settleGreyhoundTicket(ticket,race),net=payout-ticket.stake;if(payout)setCoins((current)=>current+payout);
    addRecord((count)=>({id:`${Date.now()}-greyhound-${count}`,game:'그레이하운드',result:net>0?'win':'loss',difficulty,bet:ticket.stake,net,playedAt:new Date().toISOString(),detail:`${greyhoundBetLabels[ticket.type]} ${ticket.selections.join('→')} · 결승 ${race.order.slice(0,3).join('→')} · 배당 ${ticket.odds.toFixed(1)}배`}));
  };
  const settleCarRace=(ticket:CarRaceTicket,race:CarRaceResult)=>{
    const payout=carTicketPayout(ticket,race),net=payout-ticket.stake;if(payout)setCoins((current)=>current+payout);
    const winner=createCarField().find(car=>car.id===race.order[0]);
    addRecord((count)=>({id:`${Date.now()}-car-${count}`,game:'자동차 레이스',result:net>0?'win':'loss',difficulty,bet:ticket.stake,net,playedAt:new Date().toISOString(),detail:`우승 ${winner?.koreanName??race.order[0]} · 선택 ${ticket.selection}번 · 배당 ${ticket.odds.toFixed(1)}배`}));
  };
  const settleBullTournament=(ticket:BullTicket,result:BullTournamentResult)=>{
    const payout=bullTicketPayout(ticket,result),net=payout-ticket.stake;if(payout)setCoins(current=>current+payout);
    const winner=createBullField().find(bull=>bull.id===result.champion);
    addRecord(count=>({id:`${Date.now()}-bull-${count}`,game:'소싸움',result:net>0?'win':'loss',difficulty,bet:ticket.stake,net,playedAt:new Date().toISOString(),detail:`대회 우승 ${winner?.name??result.champion} · 선택 ${ticket.selection}번 · 배당 ${ticket.odds.toFixed(1)}배`}));
  };

  const settleVideoPoker = (stake: number, hand: Card[]) => {
    const result = evaluateVideoPoker(hand); const payout = videoPokerPayout(stake, hand); const net = videoPokerNet(stake, hand);
    if (payout > 0) setCoins((current) => current + payout);
    addRecord((count) => ({ id: `${Date.now()}-video-poker-${count}`, game: '비디오 포커', result: net > 0 ? 'win' : net < 0 ? 'loss' : 'push', difficulty, bet: stake, net, playedAt: new Date().toISOString(), detail: `${result.label} · ${hand.map((card) => `${card.rank}${card.suit}`).join(' ')}` }));
  };

  // 컴퓨터가 레이즈·폴드를 하면 양쪽이 넣은 돈이 달라지므로 각각 받아 정산합니다.
  const settlePoker = (game: '텍사스 홀덤'|'오마하'|'세븐 포커'|'파이브 카드 드로우', mine: number, theirs: number, result: 'win' | 'loss' | 'push', detail: string) => {
    const payout = result === 'win' ? mine + theirs : result === 'push' ? mine : 0;
    const net = result === 'win' ? theirs : result === 'push' ? 0 : -mine;
    if (payout) setCoins((current) => current + payout);
    addRecord((count) => ({ id: `${Date.now()}-poker-${count}`, game, result, difficulty, bet:mine, net, playedAt:new Date().toISOString(), detail }));
  };

  // 화투 게임들은 정산 방식이 같아 한 함수로 씁니다.
  const settleHwatu = (game: '고스톱' | '맞고' | '민화투' | '육백' | '섰다' | '도리짓고땡') => (mine: number, theirs: number, result: 'win' | 'loss' | 'push', detail: string) => {
    const payout = result === 'win' ? mine + theirs : result === 'push' ? mine : 0;
    const net = result === 'win' ? theirs : result === 'push' ? 0 : -mine;
    if (payout) setCoins((current) => current + payout);
    addRecord((count) => ({ id: `${Date.now()}-hwatu-${count}`, game, result, difficulty, bet: mine, net, playedAt: new Date().toISOString(), detail }));
  };
  const settleSeotda = settleHwatu('섰다');
  const settleDori = settleHwatu('도리짓고땡');
  const settleGostop = settleHwatu('고스톱');
  const settleMatgo = settleHwatu('맞고');
  const settleMinhwa = settleHwatu('민화투');
  const settleYukbaek = settleHwatu('육백');

  const settleHighLow = (mine: number, theirs: number, share: number, detail: string) => {
    const payout = Math.round((mine + theirs) * share); const net = payout - mine;
    if (payout) setCoins((current) => current + payout);
    addRecord((count) => ({ id: `${Date.now()}-high-low-${count}`, game:'하이로우', result:net>0?'win':net<0?'loss':'push', difficulty, bet:mine, net, playedAt:new Date().toISOString(), detail }));
  };

  const settleMahjong = (game:'리치 마작'|'중국식 마작'|'홍콩 마작'|'사천 마작',stake: number, result: 'win'|'loss'|'push', detail: string) => {
    const payout=result==='win'?stake*4:result==='push'?stake:0; if(payout)setCoins((current) => current + payout);
    addRecord((count) => ({ id: `${Date.now()}-mahjong-${count}`, game,result,difficulty,bet:stake,net:result==='win'?stake*3:result==='push'?0:-stake,playedAt:new Date().toISOString(),detail }));
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
    // SafeAreaView(웹)는 스스로 env(safe-area-inset-*) 여백을 붙입니다.
    // 아래 탭바에서도 같은 값을 쓰기 때문에 여기서 쓰면 여백이 두 번 들어갑니다.
    // 그래서 일반 View를 쓰고, 여백은 이 아래에서 한 번만 줍니다.
    <View style={[styles.app, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <Header coins={coins} totalPlays={totalPlays} />
      <View style={[styles.screen, appScreen !== 'tabs' && { paddingBottom: insets.bottom }]}>
        {appScreen === 'categoryCatalog' && (
          <CategoryCatalogScreen
            category={selectedCategory}
            onBack={() => setAppScreen('tabs')}
            onOpenGame={(game) => {
              setSelectedCatalogGame(game);
              if (game.status === 'playable') setLastGame(game.name as GameRecord['game']);
              setAppScreen(screenForGame(game.name));
            }}
          />
        )}
        {appScreen === 'gamePreview' && (
          <GamePreviewScreen game={selectedCatalogGame} category={selectedCategory} difficulty={difficulty} onBack={() => setAppScreen('categoryCatalog')} />
        )}
        {appScreen === 'yutSetup' && <SimpleSetupScreen title="윷 베팅 준비" hero="도 · 개 · 걸 · 윷 · 모" lead="네 개의 윷을 던져 나올 결과를 예측하세요" rules={['1. 말을 움직이는 보드게임이 아니라 한 번의 윷 결과에 베팅합니다.','2. 도·개·걸은 자주 나오며 윷·모는 드물어 배당이 높습니다.','3. 결과를 고르고 베팅한 뒤 윷 던지기를 누릅니다.']} startLabel="윷판 입장" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('yutGame')}/>}
        {appScreen === 'yutGame' && <YutBetGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('yutSetup')} onPlaceBet={placeBet} onSettle={(stake,multiplier,detail)=>settleNewGame('윷 베팅',stake,multiplier,detail)}/>}
        {appScreen === 'shellSetup' && <SimpleSetupScreen title="공 어디에? 준비" hero="◉  ◉  ◉" lead="컵의 움직임을 끝까지 따라가세요" rules={['1. 처음에 공이 든 컵을 보여줍니다.','2. 세 개의 컵이 여러 번 자리를 바꿉니다.','3. 섞기가 끝난 뒤 공이 든 컵을 맞히면 3배를 받습니다.']} startLabel="테이블 입장" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('shellGame')}/>}
        {appScreen === 'shellGame' && <ShellGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('shellSetup')} onPlaceBet={placeBet} onSettle={(stake,multiplier,detail)=>settleNewGame('공 어디에?',stake,multiplier,detail)}/>}
        {appScreen === 'fishRaceSetup' && <SimpleSetupScreen title="피시 레이스 준비" hero="🐟 🐠 🐡 🐟" lead="수중 장애물을 통과할 우승 물고기를 고르세요" rules={['1. 여섯 물고기 중 우승할 한 마리를 선택합니다.','2. 물살·해초·거품 구간에서 속도가 계속 달라집니다.','3. 가장 먼저 산호 결승선에 도착한 물고기가 우승합니다.']} startLabel="수중 경기장 입장" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('fishRaceGame')}/>}
        {appScreen === 'fishRaceGame' && <FishRaceGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('fishRaceSetup')} onPlaceBet={placeBet} onSettle={(stake,multiplier,detail)=>settleNewGame('피시 레이스',stake,multiplier,detail)}/>}
        {appScreen === 'luckyFishSetup' && <SimpleSetupScreen title="행운의 물고기 준비" hero="🐠 → ◇ ◇ ◇" lead="물고기가 들어갈 마지막 동굴을 예측하세요" rules={['1. 여섯 동굴 중 물고기가 들어갈 곳을 선택합니다.','2. 물고기는 여러 갈림길에서 방향을 바꾸며 이동합니다.','3. 선택한 동굴에 들어가면 표시된 배당을 받습니다.']} startLabel="산호초 입장" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('luckyFishGame')}/>}
        {appScreen === 'luckyFishGame' && <LuckyFishGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('luckyFishSetup')} onPlaceBet={placeBet} onSettle={(stake,multiplier,detail)=>settleNewGame('행운의 물고기',stake,multiplier,detail)}/>}
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
            onExit={() => setAppScreen('blackjackSetup')}
          />
        )}
        {appScreen === 'doriSetup' && (
          <DoriSetupScreen
            coins={coins}
            difficulty={difficulty}
            selectedBet={selectedBet}
            onBack={() => setAppScreen('categoryCatalog')}
            onDifficultyChange={saveDifficulty}
            onBetChange={setSelectedBet}
            onStart={() => setAppScreen('doriGame')}
          />
        )}
        {appScreen === 'doriGame' && (
          <DoriGameScreen coins={coins} selectedBet={selectedBet} onBack={() => setAppScreen('doriSetup')} onPlaceBet={placeBet} onSettle={settleDori} />
        )}
        {(appScreen === 'gostopSetup' || appScreen === 'matgoSetup') && (
          <GoStopSetupScreen mode={appScreen==='gostopSetup'?'gostop':'matgo'} coins={coins} difficulty={difficulty} selectedBet={selectedBet} deckStyle={goStopDeckStyle}
            onDeckStyleChange={setGoStopDeckStyle} onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet}
            onStart={()=>setAppScreen(appScreen==='gostopSetup'?'gostopGame':'matgoGame')}/>
        )}
        {(appScreen === 'gostopGame' || appScreen === 'matgoGame') && (
          <GoStopGameScreen mode={appScreen === 'gostopGame' ? 'gostop' : 'matgo'} deckStyle={goStopDeckStyle} coins={coins} selectedBet={selectedBet}
            onBack={() => setAppScreen(appScreen === 'gostopGame' ? 'gostopSetup' : 'matgoSetup')}
            onPlaceBet={placeBet} onSettle={appScreen === 'gostopGame' ? settleGostop : settleMatgo}/>
        )}
        {appScreen === 'minhwatuSetup' && (
          <SimpleSetupScreen title="민화투 준비" hero="光 20 · 十 10 · 띠 5" lead="피 대신 그림과 약을 모아 점수 겨루기"
            rules={[
              '1. 두 명이 손패 10장씩, 바닥 8장을 놓고 시작합니다.',
              '2. 고스톱처럼 같은 월 패를 맞춰 가져오지만 고·스톱 없이 끝까지 진행합니다.',
              '3. 광은 장당 20점, 열끗은 10점, 띠는 5점이며 피는 0점입니다.',
              '4. 홍단·청단·초단은 상대에게서 30점, 초약(5월)·풍약(10월)·비약(12월)은 20점을 가져옵니다.',
              '5. 모든 패를 사용한 뒤 최종 점수 차이로 승부하고 WC를 정산합니다.',
            ]}
            startLabel="민화투 시작" coins={coins} difficulty={difficulty} selectedBet={selectedBet}
            onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('minhwatuGame')}/>
        )}
        {appScreen === 'minhwatuGame' && (
          <MinhwatuGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('minhwatuSetup')} onPlaceBet={placeBet} onSettle={settleMinhwa}/>
        )}
        {appScreen === 'yukbaekSetup' && (
          <SimpleSetupScreen title="육백 준비" hero="六百 · 먼저 600점" lead="화투의 높은 패와 역을 모아 여러 판 누적 승부"
            rules={[
              '1. 두 명이 손패 10장씩, 바닥 8장을 놓고 같은 월 패를 맞춰 가져옵니다.',
              '2. 광과 2월 매조는 장당 50점, 나머지 열끗·띠는 10점입니다. 대부분의 피는 0점입니다.',
              '3. 홍단은 150점, 청단·초단·대삼·꽃놀이술·달맞이술은 각각 100점입니다.',
              '4. 1·2·3·4·8·10·11월 중 한 달의 네 장을 모두 모으면 섬 50점입니다.',
              '5. 비광을 뺀 사광 또는 띠 7장을 모으면 즉시 승리합니다.',
              '6. 한 판 점수를 계속 누적하며 먼저 600점 이상에 도달한 사람이 전체 경기에서 이깁니다.',
            ]}
            startLabel="육백 시작" coins={coins} difficulty={difficulty} selectedBet={selectedBet}
            onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('yukbaekGame')}/>
        )}
        {appScreen === 'yukbaekGame' && (
          <YukbaekGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('yukbaekSetup')} onPlaceBet={placeBet} onSettle={settleYukbaek}/>
        )}
        {appScreen === 'seotdaSetup' && (
          <SeotdaSetupScreen
            coins={coins}
            difficulty={difficulty}
            selectedBet={selectedBet}
            rules={seotdaRules}
            onRulesChange={setSeotdaRules}
            onBack={() => setAppScreen('categoryCatalog')}
            onDifficultyChange={saveDifficulty}
            onBetChange={setSelectedBet}
            onStart={() => setAppScreen('seotdaGame')}
          />
        )}
        {appScreen === 'seotdaGame' && (
          <SeotdaGameScreen coins={coins} selectedBet={selectedBet} rules={seotdaRules} onBack={() => setAppScreen('seotdaSetup')} onPlaceBet={placeBet} onSettle={settleSeotda} />
        )}
        {appScreen === 'rouletteSetup' && (
          <SimpleSetupScreen
            title="유럽식 룰렛(Roulette)"
            hero="◎ 0 · 32 · 15"
            lead="숫자와 색상에 코인을 거는 휠 게임"
            rules={[
              '1. 0이 하나뿐인 유럽식 휠(37칸)을 씁니다.',
              '2. 빨강·검정·홀·짝·구간은 1:1, 12개 묶음은 2:1입니다.',
              '3. 숫자 하나를 맞히면 35:1로 돌려받습니다.',
            ]}
            startLabel="룰렛 시작"
            coins={coins}
            difficulty={difficulty}
            selectedBet={selectedBet}
            onBack={() => setAppScreen('categoryCatalog')}
            onDifficultyChange={saveDifficulty}
            onBetChange={setSelectedBet}
            onStart={() => setAppScreen('rouletteGame')}
          />
        )}
        {appScreen === 'videoPokerSetup' && (
          <SimpleSetupScreen
            title="비디오 포커(Video Poker)"
            hero="A♠ K♠ Q♠"
            lead="잭 이상 원 페어부터 배당이 시작됩니다"
            rules={[
              '1. 다섯 장을 받고 남길 카드를 눌러 HOLD합니다.',
              '2. DRAW를 누르면 고르지 않은 카드만 한 번 교환됩니다.',
              '3. 로열 스트레이트 플러시 250배 · 포카드 25배 · 잭 이상 원 페어 1배.',
            ]}
            startLabel="비디오 포커 시작"
            coins={coins}
            difficulty={difficulty}
            selectedBet={selectedBet}
            onBack={() => setAppScreen('categoryCatalog')}
            onDifficultyChange={saveDifficulty}
            onBetChange={setSelectedBet}
            onStart={() => setAppScreen('videoPokerGame')}
          />
        )}
        {appScreen === 'rouletteGame' && (
          <RouletteGameScreen
            coins={coins}
            difficulty={difficulty}
            selectedBet={selectedBet}
            motion={motion}
            onBack={() => setAppScreen('rouletteSetup')}
            onBetChange={setSelectedBet}
            onPlaceBet={placeBet}
            onSettle={settleRoulette}
          />
        )}
        {appScreen === 'baccaratGame' && (
          <BaccaratGameScreen
            coins={coins}
            difficulty={difficulty}
            selectedBet={selectedBet}
            onBack={() => setAppScreen('baccaratSetup')}
            onBetChange={setSelectedBet}
            onPlaceBet={placeBet}
            onSettle={settleBaccarat}
          />
        )}
        {appScreen === 'baccaratSetup' && (
          <BaccaratSetupScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={() => setAppScreen('baccaratGame')} />
        )}
        {appScreen === 'crapsSetup' && <CrapsSetupScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={() => setAppScreen('crapsGame')} />}
        {appScreen === 'crapsGame' && <CrapsGameScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('crapsSetup')} onBetChange={setSelectedBet} onPlaceBet={placeBet} onSettle={settleCraps} />}
        {appScreen === 'slotSetup' && <SlotSetupScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} mode={slotMode} onModeChange={setSlotMode} onBack={() => setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={() => setAppScreen(slotMode === 'classic' ? 'slotGame' : 'pachislotGame')} />}
        {appScreen === 'slotGame' && <SlotGameScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} motion={motion} onBack={() => setAppScreen('slotSetup')} onBetChange={setSelectedBet} onPlaceBet={placeBet} onSettle={settleSlot} />}
        {appScreen === 'pachislotGame' && <PachislotGameScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} motion={motion} onBack={() => setAppScreen('slotSetup')} onBetChange={setSelectedBet} onPlaceBet={placeBet} onSettle={settlePachislot} />}
        {appScreen === 'sicboSetup' && <SicBoSetupScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={() => setAppScreen('sicboGame')} />}
        {appScreen === 'sicboGame' && <SicBoGameScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} motion={motion} onBack={() => setAppScreen('sicboSetup')} onBetChange={setSelectedBet} onPlaceBet={placeBet} onSettle={settleSicBo} />}
        {appScreen === 'yahtzeeSetup' && <SimpleSetupScreen title="야찌(Yahtzee) 준비" hero="⚄ ⚂ ⚅ ⚀ ⚃" lead="다섯 주사위로 13개 점수칸을 완성하세요" rules={[
          '1. 한 라운드에 주사위 다섯 개를 최대 세 번 굴립니다.',
          '2. 원하는 주사위를 눌러 보관한 뒤 나머지만 다시 굴릴 수 있습니다.',
          '3. 매 라운드 반드시 비어 있는 점수칸 하나를 선택합니다. 조건을 못 맞추면 그 칸은 0점입니다.',
          '4. 1~6 상단 점수 합계가 63점 이상이면 보너스 35점을 받습니다.',
          '5. 13라운드 최종 200점부터 2배, 250점부터 3배로 WC를 돌려받습니다.',
        ]} startLabel="야찌 시작" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('yahtzeeGame')}/>}
        {appScreen === 'yahtzeeGame' && <YahtzeeGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('yahtzeeSetup')} onPlaceBet={placeBet} onSettle={settleYahtzee}/>}
        {appScreen === 'oddEvenSetup' && <SimpleSetupScreen title="홀짝 준비" hero="1 · 2 · 3 · 4" lead="나올 숫자가 홀수인지 짝수인지 선택" rules={['1. 1부터 100 중 숫자 하나를 무작위로 뽑습니다.','2. 추첨 전에 홀 또는 짝을 선택합니다.','3. 맞히면 베팅금의 2배를 돌려받습니다.']} startLabel="홀짝 시작" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('oddEvenGame')}/>}
        {appScreen === 'oddEvenGame' && <OddEvenGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('oddEvenSetup')} onPlaceBet={placeBet} onSettle={(stake,multiplier,detail)=>settleWorldInstant('홀짝',stake,multiplier,detail)}/>}
        {appScreen === 'lottoSetup' && <SimpleSetupScreen title="월드 로또 준비" hero="⑥ · 1~45" lead="번호 여섯 개를 직접 선택" rules={['1. 1부터 45 중 서로 다른 번호 6개를 고릅니다.','2. 당첨 번호 6개와 보너스 번호 1개를 추첨합니다.','3. 3개부터 당첨이며 일치 개수가 많을수록 배당이 커집니다.']} startLabel="로또 시작" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('lottoGame')}/>}
        {appScreen === 'lottoGame' && <LottoGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('lottoSetup')} onPlaceBet={placeBet} onSettle={(stake,multiplier,detail)=>settleWorldInstant('로또',stake,multiplier,detail)}/>}
        {appScreen === 'scratchSetup' && <SimpleSetupScreen title="즉석 복권 준비" hero="票 · SCRATCH" lead="손가락으로 은색 코팅을 긁어 보세요" rules={['1. 복권 한 장에는 그림 아홉 개가 숨어 있습니다.','2. 구매한 뒤 손가락으로 각 칸의 은색 코팅을 직접 긁습니다.','3. 같은 그림 3개는 2배, 4개는 5배, 5개 이상은 20배입니다.']} startLabel="즉석 복권 시작" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('scratchGame')}/>}
        {appScreen === 'scratchGame' && <ScratchGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('scratchSetup')} onPlaceBet={placeBet} onSettle={(stake,multiplier,detail)=>settleWorldInstant('즉석 복권',stake,multiplier,detail)}/>}
        {appScreen === 'teenPattiSetup' && <SimpleSetupScreen title="틴 파티(Teen Patti) 준비" hero="A♠ K♠ Q♠" lead="세 장만으로 겨루는 인도의 대표 카드 게임" rules={['1. 나와 컴퓨터가 카드 세 장씩 받고 같은 기본 베팅을 냅니다.','2. 족보는 트레일 > 퓨어 시퀀스 > 시퀀스 > 컬러 > 페어 > 하이 카드 순입니다.','3. 시퀀스는 AKQ가 가장 높고 A23, KQJ 순서로 이어집니다.','4. 카드를 본 뒤 계속하려면 콜, 불리하면 다이를 선택합니다.','5. 쇼다운에서는 양쪽 카드를 모두 공개하고 더 높은 세 장 족보가 팟을 가져갑니다.']} startLabel="틴 파티 시작" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('teenPattiGame')}/>}
        {appScreen === 'teenPattiGame' && <TeenPattiGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('teenPattiSetup')} onPlaceBet={placeBet} onSettle={settleTeenPatti}/>}
        {appScreen === 'paiGowSetup' && <SimpleSetupScreen title="파이 고우 포커(Pai Gow Poker) 준비" hero="7장 → 5장 + 2장" lead="두 개의 패를 만들어 딜러의 두 패와 모두 겨루세요" rules={['1. 나와 딜러가 카드 7장씩 받습니다.','2. 내 카드 중 로우 핸드로 쓸 카드 2장을 누르면 나머지 5장이 하이 핸드가 됩니다.','3. 하이 핸드는 일반 포커 족보, 로우 핸드는 원 페어 또는 높은 카드로 비교합니다.','4. 하이 핸드는 반드시 로우 핸드보다 강해야 합니다. 아니면 파울이라 승부할 수 없습니다.','5. 딜러의 하이와 로우를 모두 이기면 승리, 하나씩 이기면 무승부, 모두 지면 패배입니다. 같은 패는 딜러 승리입니다.','6. 초보용 기본판이라 조커와 카지노 수수료는 적용하지 않습니다.']} startLabel="파이 고우 시작" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('paiGowGame')}/>}
        {appScreen === 'paiGowGame' && <PaiGowGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('paiGowSetup')} onPlaceBet={placeBet} onSettle={settlePaiGow}/>}
        {appScreen === 'horseSetup' && <SimpleSetupScreen title="경마(Horse Racing) 준비" hero="馬 ① ② ③" lead="출전마의 능력과 배당을 보고 결승 순위를 예측하세요" rules={['1. 매 경주 여섯 마리의 속도·지구력·최근 컨디션과 예상 배당을 확인합니다.','2. 단승은 1위 한 마리, 연승은 3위 안에 들 한 마리를 고릅니다.','3. 복승은 1·2위를 순서 없이, 쌍승은 정확한 순서로 맞혀야 합니다.','4. 배당이 높은 말은 적중 가능성이 낮지만 받을 수 있는 WC가 많습니다.','5. 베팅 뒤 경주 시작을 누르면 실제 트랙에서 결승선까지 달리고 순위가 확정됩니다.']} startLabel="경마장 입장" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('horseGame')}/>}
        {appScreen === 'horseGame' && <HorseRacingGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('horseSetup')} onPlaceBet={placeBet} onSettle={settleHorseRace}/>}
        {appScreen === 'cycleSetup' && <SimpleSetupScreen title="경륜(Keirin) 준비" hero="🚴 ① ② ③ ④" lead="일곱 선수의 전법과 마지막 바퀴 승부를 예측하세요" rules={['1. 선수 7명의 스프린트·지구력·전술과 주 전법을 확인합니다.','2. 선행은 먼저 치고 나가며, 젖히기는 바깥에서 추월하고, 추입은 막판에 속도를 냅니다. 마크는 강한 선수를 따라갑니다.','3. 단승은 1위, 연승은 7인 경기에서 2위 안에 들 선수 한 명을 맞힙니다.','4. 복승은 1·2위를 순서 없이, 쌍승은 정확한 순서로 맞힙니다.','5. 경주는 마지막 바퀴 진입 순서와 최종 스프린트 결과가 달라질 수 있습니다.']} startLabel="벨로드롬 입장" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('cycleGame')}/>}
        {appScreen === 'cycleGame' && <CycleRacingGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('cycleSetup')} onPlaceBet={placeBet} onSettle={settleCycleRace}/>}
        {appScreen === 'boatSetup' && <SimpleSetupScreen title="경정(Boat Racing) 준비" hero="🚤 ① ② ③ ④ ⑤ ⑥" lead="6대 보트의 스타트와 첫 번째 선회를 예측하세요" rules={['1. 1번 흰색부터 6번 초록색까지 여섯 보트가 출전합니다.','2. 스타트는 출발 타이밍, 선회는 1마크를 도는 능력, 모터는 직선 속도를 뜻합니다.','3. 단승은 1위, 연승은 2위 안에 들 보트 한 대를 맞힙니다.','4. 복승은 1·2위를 순서 없이, 쌍승은 정확한 순서로 맞힙니다.','5. 1마크 선두가 유리하지만 모터 성능에 따라 마지막 직선에서 순위가 바뀔 수 있습니다.']} startLabel="수면 경기장 입장" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('boatGame')}/>}
        {appScreen === 'boatGame' && <BoatRacingGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('boatSetup')} onPlaceBet={placeBet} onSettle={settleBoatRace}/>}
        {appScreen === 'greyhoundSetup' && <SimpleSetupScreen title="그레이하운드(Greyhound Racing) 준비" hero="🐕 ① ② ③ ④ ⑤ ⑥" lead="트랩에서 출발하는 6마리의 첫 코너와 결승 순위를 예측하세요" rules={['1. 여섯 마리가 각자 번호와 색상이 정해진 출발 트랩에서 동시에 출발합니다.','2. 출발은 초반 가속, 코너는 첫 굽이 통과, 막판은 결승 직선의 추월 능력입니다.','3. 레일형은 안쪽, 중간형은 중앙, 외곽형은 바깥 주로에서 능력을 더 잘 냅니다.','4. 단승은 1위, 연승은 2위 안, 복승은 1·2위 무순서, 쌍승은 정확한 순서를 맞힙니다.','5. 첫 코너 선두가 유리하지만 막판 속도가 좋은 개가 결승 직선에서 역전할 수 있습니다.']} startLabel="그레이하운드 경기장 입장" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('greyhoundGame')}/>}
        {appScreen === 'greyhoundGame' && <GreyhoundRacingGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('greyhoundSetup')} onPlaceBet={placeBet} onSettle={settleGreyhoundRace}/>}
        {appScreen === 'carSetup' && <SimpleSetupScreen title="자동차 레이스(Formula Racing) 준비" hero="🏎 ① ② ③ ④ ⑤ ⑥" lead="여섯 브랜드 중 결승선을 가장 먼저 통과할 차량을 선택하세요" rules={['1. 차량마다 최고 속도·코너링·안정성이 조금씩 다릅니다.','2. 배당이 낮은 차량은 우승 후보이며, 높은 차량은 이변을 노리는 선택입니다.','3. 이번 기본판은 가장 이해하기 쉬운 단승, 즉 우승 차량 한 대만 선택합니다.','4. 베팅 후 레이스가 시작되며 중간 순위와 최종 1·2·3위를 확인할 수 있습니다.']} startLabel="서킷 입장" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('carGame')}/>}
        {appScreen === 'carGame' && <CarRacingGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('carSetup')} onPlaceBet={placeBet} onSettle={settleCarRace}/>}
        {appScreen === 'bullSetup' && <SimpleSetupScreen title="한국 전통 소싸움 준비" hero="牛 ① ② ③ ④ ⑤ ⑥" lead="여섯 마리의 힘과 지구력, 투지를 보고 최종 우승 소를 선택하세요" rules={['1. 여섯 마리가 예선·준결승·결승 토너먼트를 치릅니다.','2. 힘은 밀어붙이는 능력, 지구력은 오래 버티는 능력, 투지는 불리할 때 버티는 능력입니다.','3. 1·2번 우승 후보는 예선을 통과한 상태에서 준결승부터 출전합니다.','4. 이번 기본판은 최종 우승 소 한 마리를 맞히는 단승 방식입니다.','5. 실제 상처 묘사 없이 전통적인 힘겨루기 경기로 표현합니다.']} startLabel="소싸움 경기장 입장" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('bullGame')}/>}
        {appScreen === 'bullGame' && <BullfightingGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('bullSetup')} onPlaceBet={placeBet} onSettle={settleBullTournament}/>}
        {appScreen === 'videoPokerGame' && <VideoPokerGameScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('videoPokerSetup')} onBetChange={setSelectedBet} onPlaceBet={placeBet} onSettle={settleVideoPoker} />}
        {appScreen === 'holdemSetup' && <PokerSetupScreen mode="holdem" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={() => setAppScreen('holdemGame')} />}
        {appScreen === 'holdemGame' && <PokerGameScreen mode="holdem" coins={coins} selectedBet={selectedBet} onBack={() => setAppScreen('holdemSetup')} onPlaceBet={placeBet} onSettle={(mine,theirs,result,detail)=>settlePoker('텍사스 홀덤',mine,theirs,result,detail)} />}
        {appScreen === 'omahaSetup' && <PokerSetupScreen mode="omaha" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={() => setAppScreen('omahaGame')} />}
        {appScreen === 'omahaGame' && <PokerGameScreen mode="omaha" coins={coins} selectedBet={selectedBet} onBack={() => setAppScreen('omahaSetup')} onPlaceBet={placeBet} onSettle={(mine,theirs,result,detail)=>settlePoker('오마하',mine,theirs,result,detail)} />}
        {appScreen === 'sevenPokerSetup' && <SevenPokerSetupScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={() => setAppScreen('sevenPokerGame')} />}
        {appScreen === 'sevenPokerGame' && <SevenPokerGameScreen coins={coins} selectedBet={selectedBet} onBack={() => setAppScreen('sevenPokerSetup')} onPlaceBet={placeBet} onSettle={(mine,theirs,result,detail)=>settlePoker('세븐 포커',mine,theirs,result,detail)} />}
        {appScreen === 'fiveDrawSetup' && <FiveDrawSetupScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={() => setAppScreen('fiveDrawGame')} />}
        {appScreen === 'fiveDrawGame' && <FiveDrawGameScreen coins={coins} selectedBet={selectedBet} onBack={() => setAppScreen('fiveDrawSetup')} onPlaceBet={placeBet} onSettle={(mine,theirs,result,detail)=>settlePoker('파이브 카드 드로우',mine,theirs,result,detail)} />}
        {appScreen === 'chinesePokerSetup' && <SimpleSetupScreen title="차이니즈 포커 준비" hero="十三水 · 5 · 5 · 3" lead="열세 장을 세 줄로 나눠 줄마다 겨룹니다" rules={['1. 카드 열세 장을 받아 뒷줄 5장, 가운뎃줄 5장, 앞줄 3장으로 나눕니다.','2. 뒷줄이 가운뎃줄보다, 가운뎃줄이 앞줄보다 세야 합니다. 어기면 파울로 세 줄을 모두 내줍니다.','3. 앞줄 세 장은 스트레이트와 플러시를 세지 않아 트리플·원 페어·하이 카드만 있습니다.','4. 줄마다 이기면 베팅금의 6분의 1을 받고, 세 줄을 모두 이기면 스쿱이라 두 배가 됩니다.']} startLabel="자리 앉기" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('chinesePokerGame')}/>}
        {appScreen === 'chinesePokerGame' && <ChinesePokerGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('chinesePokerSetup')} onPlaceBet={placeBet} onSettle={(stake,multiplier,detail)=>settleNewGame('차이니즈 포커',stake,multiplier,detail)}/>}
        {appScreen === 'tujeonSetup' && <SimpleSetupScreen title="투전 준비" hero="鬪箋 · 여든 장" lead="같은 숫자를 짝지어 상대와 겨룹니다" rules={['1. 여덟 무리(사람·물고기·새·꿩·별·말·노루·토끼)에 1부터 10까지, 모두 여든 장입니다.','2. 다섯 장을 받아 같은 숫자가 몇 장 모였는지로 겨룹니다. 오동 · 사동 · 삼동 · 두동동 · 동동 순입니다.','3. 짝이 하나도 없으면 다섯 장을 더한 끝자리가 끗이고, 9가 가보 0이 망통입니다.','4. 패를 보고 나쁘면 죽을 수 있습니다. 죽으면 베팅금의 0.35배만 돌려받습니다.','5. 승부해서 이기면 1.9배, 비기면 그대로 돌려받습니다.']} startLabel="판에 앉기" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('tujeonGame')}/>}
        {appScreen === 'tujeonGame' && <TujeonGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('tujeonSetup')} onPlaceBet={placeBet} onSettle={(stake,multiplier,detail)=>settleNewGame('투전',stake,multiplier,detail)}/>}
        {appScreen === 'bigTwoSetup' && <SimpleSetupScreen title="빅투 준비" hero="♦3 · · · 2♠" lead="열세 장을 먼저 다 내려놓으면 이깁니다" rules={['1. 네 명이 열세 장씩 나눠 갖습니다. ♦3을 가진 사람이 먼저 내고 첫 장에는 ♦3이 들어가야 합니다.','2. 숫자는 3이 가장 약하고 2가 가장 셉니다. 같은 숫자면 ♦ ♣ ♥ ♠ 순으로 세집니다.','3. 한 장·두 장(페어)·세 장(트리플)·다섯 장(스트레이트 이상)만 낼 수 있습니다.','4. 앞사람과 같은 장수로만, 더 세게 받아쳐야 합니다. 낼 게 없으면 넘깁니다.','5. 먼저 다 내면 '+bigTwoWinPayout[4]+'배입니다. 져도 세 장 이하로 털었으면 절반을 돌려받습니다.']} startLabel="판에 앉기" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('bigTwoGame')}/>}
        {appScreen === 'bigTwoGame' && <BigTwoGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('bigTwoSetup')} onPlaceBet={placeBet} onSettle={(stake,multiplier,detail)=>settleNewGame('빅투',stake,multiplier,detail)}/>}
        {appScreen === 'pusherSetup' && <SimpleSetupScreen title="코인 푸셔 준비" hero="◉ ◉ ◉" lead="밀판이 밀어낸 동전이 내 몫입니다" rules={['1. 동전을 한 개 넣으면 밀판이 한 번 앞으로 밉니다.','2. 앞턱을 넘어간 동전이 내 몫입니다. 넣은 것이 바로 나오지 않고 쌓였다가 한꺼번에 쏟아집니다.','3. 금화는 '+pusherGoldPayout+'배로 쳐줍니다.','4. 앞쪽 양옆에는 빠지는 홈이 있어 그리로 밀린 동전은 사라집니다.','5. 판은 실제 기계처럼 그대로 남아 다음에 이어서 합니다.']} startLabel="기계 앞에 서기" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={()=>setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={()=>setAppScreen('pusherGame')}/>}
        {appScreen === 'pusherGame' && <CoinPusherGameScreen coins={coins} selectedBet={selectedBet} onBack={()=>setAppScreen('pusherSetup')} onPlaceBet={placeBet} onSettle={(stake,multiplier,detail)=>settleNewGame('코인 푸셔',stake,multiplier,detail)}/>}
        {appScreen === 'highLowSetup' && <HighLowSetupScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={() => setAppScreen('highLowGame')} />}
        {appScreen === 'highLowGame' && <HighLowGameScreen coins={coins} selectedBet={selectedBet} onBack={() => setAppScreen('highLowSetup')} onPlaceBet={placeBet} onSettle={settleHighLow} />}
        {appScreen === 'riichiSetup' && <RiichiSetupScreen coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={() => setAppScreen('riichiGame')} />}
        {appScreen === 'riichiGame' && <RiichiGameScreen mode="riichi" coins={coins} selectedBet={selectedBet} onBack={() => setAppScreen('riichiSetup')} onPlaceBet={placeBet} onSettle={(stake,result,detail)=>settleMahjong('리치 마작',stake,result,detail)} />}
        {appScreen === 'chineseMahjongSetup' && <WorldMahjongSetupScreen mode="chinese" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={() => setAppScreen('chineseMahjongGame')} />}
        {appScreen === 'chineseMahjongGame' && <RiichiGameScreen mode="chinese" coins={coins} selectedBet={selectedBet} onBack={() => setAppScreen('chineseMahjongSetup')} onPlaceBet={placeBet} onSettle={(stake,result,detail)=>settleMahjong('중국식 마작',stake,result,detail)} />}
        {appScreen === 'hongKongMahjongSetup' && <WorldMahjongSetupScreen mode="hongkong" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={() => setAppScreen('hongKongMahjongGame')} />}
        {appScreen === 'hongKongMahjongGame' && <RiichiGameScreen mode="hongkong" coins={coins} selectedBet={selectedBet} onBack={() => setAppScreen('hongKongMahjongSetup')} onPlaceBet={placeBet} onSettle={(stake,result,detail)=>settleMahjong('홍콩 마작',stake,result,detail)} />}
        {appScreen === 'sichuanMahjongSetup' && <WorldMahjongSetupScreen mode="sichuan" coins={coins} difficulty={difficulty} selectedBet={selectedBet} onBack={() => setAppScreen('categoryCatalog')} onDifficultyChange={saveDifficulty} onBetChange={setSelectedBet} onStart={() => setAppScreen('sichuanMahjongGame')} />}
        {appScreen === 'sichuanMahjongGame' && <RiichiGameScreen mode="sichuan" coins={coins} selectedBet={selectedBet} onBack={() => setAppScreen('sichuanMahjongSetup')} onPlaceBet={placeBet} onSettle={(stake,result,detail)=>settleMahjong('사천 마작',stake,result,detail)} />}
        {appScreen === 'tabs' && renderTab({
          tab, difficulty, saveDifficulty, sound, setSound, vibration, setVibration,
          gameSpeed, setGameSpeed, accessibility, setAccessibility,
          onRefillCoins: refillTestCoins, coins, records, totalPlays, lastGame,
          onExportBackup: exportBackup, onPickBackup: pickBackupFile,
          onApplyImport: applyImport, onCancelImport: () => setPendingImport(null),
          backupNote, pendingImport,
          onOpenCategory: (category) => {
            setSelectedCategory(category);
            setAppScreen('categoryCatalog');
          },
          onOpenBlackjack: () => {
            setSelectedCategory(gameCategories[1]);
            setAppScreen('blackjackSetup');
          },
          onOpenCatalogGame: (category, game) => {
            setSelectedCategory(category);
            setSelectedCatalogGame(game);
            if (game.status === 'playable') setLastGame(game.name as GameRecord['game']);
            setAppScreen(screenForGame(game.name));
          },
        })}
      </View>
      {appScreen === 'tabs' && <View style={[styles.tabBar, { height: 72 + insets.bottom, paddingBottom: insets.bottom }]}>
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
    </View>
  );
}

function Header({ coins, totalPlays }: { coins: number; totalPlays: number }) {
  const { level } = levelFromPlays(totalPlays);
  return (
    <View style={styles.header}>
      <View style={styles.profileRow}>
        <View style={styles.avatar}><Text style={styles.avatarText}>G</Text></View>
        <View>
          <Text style={styles.profileName}>게스트</Text>
          <Text style={styles.level}>LV. {level}</Text>
        </View>
      </View>
      <View style={styles.walletPill}>
        <Text style={styles.coin}>●</Text>
        <Text style={styles.walletText}>{coins.toLocaleString()} WC</Text>
      </View>
    </View>
  );
}

/** 탭 화면에 넘길 값들. 자리 순서로 넘기면 실수하기 쉬워 객체 하나로 모았습니다. */
type TabProps = {
  tab: Tab;
  difficulty: string;
  saveDifficulty: (value: string) => void;
  sound: boolean;
  setSound: (value: boolean) => void;
  vibration: boolean;
  setVibration: (value: boolean) => void;
  gameSpeed: GameSpeed;
  setGameSpeed: (value: GameSpeed) => void;
  accessibility: AccessibilityOptions;
  setAccessibility: (value: AccessibilityOptions) => void;
  onRefillCoins: () => void;
  onExportBackup: () => void;
  onPickBackup: () => void;
  onApplyImport: () => void;
  onCancelImport: () => void;
  backupNote: string;
  pendingImport: { summary: string } | null;
  coins: number;
  records: GameRecord[];
  totalPlays: number;
  lastGame: GameRecord['game'] | '';
  onOpenCategory: (category: GameCategory) => void;
  onOpenBlackjack: () => void;
  onOpenCatalogGame: (category: GameCategory, game: CatalogGame) => void;
};

function renderTab(props: TabProps) {
  if (props.tab === '게임') return <GamesScreen onOpenCategory={props.onOpenCategory} onOpenBlackjack={props.onOpenBlackjack} onOpenCatalogGame={props.onOpenCatalogGame} records={props.records} lastGame={props.lastGame} />;
  if (props.tab === '지갑') return <WalletScreen coins={props.coins} records={props.records} />;
  if (props.tab === '기록') return <RecordsScreen records={props.records} totalPlays={props.totalPlays} />;
  if (props.tab === '설정') {
    return <SettingsScreen
      difficulty={props.difficulty}
      saveDifficulty={props.saveDifficulty}
      sound={props.sound}
      setSound={props.setSound}
      vibration={props.vibration}
      setVibration={props.setVibration}
      gameSpeed={props.gameSpeed}
      setGameSpeed={props.setGameSpeed}
      accessibility={props.accessibility}
      setAccessibility={props.setAccessibility}
      onRefillCoins={props.onRefillCoins}
      onExportBackup={props.onExportBackup}
      onPickBackup={props.onPickBackup}
      onApplyImport={props.onApplyImport}
      onCancelImport={props.onCancelImport}
      backupNote={props.backupNote}
      pendingImport={props.pendingImport}
    />;
  }
  return <HomeScreen difficulty={props.difficulty} records={props.records} lastGame={props.lastGame} onContinue={(gameName) => {
    const category = gameCategories.find((item) => item.games.some((game) => game.name === gameName)) ?? gameCategories[1];
    const game = category.games.find((item) => item.name === gameName) ?? category.games[0];
    props.onOpenCatalogGame(category, game);
  }} />;
}

/**
 * 화면을 떠났다가 돌아왔을 때 보던 위치로 되돌립니다.
 * 준비 화면에서 아래쪽을 보다가 게임에 들어갔다 나오면 맨 위로 튀는 것을 막습니다.
 */
const scrollMemory = new Map<string, number>();
function useScrollMemory(key: string) {
  const ref = useRef<ScrollView | null>(null);
  const restored = useRef(false);
  return {
    ref,
    onScroll: (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      const y = event.nativeEvent.contentOffset.y;
      // 화면을 떠날 때 0이 한 번 더 들어와 기억한 위치를 지워 버립니다.
      // 맨 위(0)는 어차피 되돌릴 것이 없으므로 0은 저장하지 않습니다.
      if (y > 0) scrollMemory.set(key, y);
    },
    scrollEventThrottle: 80,
    onContentSizeChange: () => {
      if (restored.current) return;
      restored.current = true;
      const saved = scrollMemory.get(key) ?? 0;
      if (saved > 0) ref.current?.scrollTo({ y: saved, animated: false });
    },
  };
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

function HomeScreen({ difficulty, records, lastGame, onContinue }: { difficulty: string; records: GameRecord[]; lastGame: GameRecord['game'] | ''; onContinue: (game: GameRecord['game']) => void }) {
  const recentGame = records[0];
  // 마지막으로 '고른' 게임이 우선입니다. 없으면 마지막으로 끝낸 게임을 씁니다.
  const continueGame = lastGame || recentGame?.game || '블랙잭';
  // 등급·금액은 그 게임을 마지막으로 했을 때의 값입니다. 한 번도 안 했으면 지금 설정을 씁니다.
  const lastOfGame = records.find((record) => record.game === continueGame);
  const continueDifficulty = lastOfGame?.difficulty ?? difficulty;
  const continueBet = lastOfGame?.bet ?? 500;
  const continueIcon = gameCategories.flatMap((category) => category.games).find((game) => game.name === continueGame)?.icon ?? '◆';
  // 오늘의 미션은 실제로 오늘 완료한 판 수를 셉니다.
  const missionDone = Math.min(countPlayedOn(records, missionDayKey(new Date())), DAILY_MISSION_GOAL);
  return (
    <Page>
      <Text style={styles.eyebrow}>오늘도 즐거운 한 판</Text>
      <Text style={styles.pageTitle}>메인 로비</Text>

      <Text style={styles.sectionTitle}>이어서 하기</Text>
      <View style={styles.heroCard}>
        <View style={styles.blackjackMark}><Text style={styles.rouletteContinueMark}>{continueIcon}</Text></View>
        <View style={styles.heroCopy}>
          <Text style={styles.muted}>마지막에 고른 게임</Text>
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
        <Row
          title={`게임 ${DAILY_MISSION_GOAL}판 플레이`}
          subtitle={missionDone >= DAILY_MISSION_GOAL ? `${missionDone} / ${DAILY_MISSION_GOAL} 완료 · 보상 지급됨` : `${missionDone} / ${DAILY_MISSION_GOAL} 완료`}
          value={`+${DAILY_MISSION_REWARD.toLocaleString()} WC`}
          positive
        />
        <View style={styles.progressTrack}><View style={[styles.progressValue, { width: `${Math.round(missionDone / DAILY_MISSION_GOAL * 100)}%` }]} /></View>
      </View>
    </Page>
  );
}

function GamesScreen({
  onOpenCategory,
  onOpenBlackjack,
  onOpenCatalogGame,
  records,
  lastGame,
}: {
  onOpenCategory: (category: GameCategory) => void;
  onOpenBlackjack: () => void;
  onOpenCatalogGame: (category: GameCategory, game: CatalogGame) => void;
  records: GameRecord[];
  lastGame: GameRecord['game'] | '';
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'recent'>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const allGames = gameCategories.flatMap((category) => category.games.map((game) => ({ category, game })));
  // 최근: 마지막으로 고른 게임을 맨 앞에 두고, 그다음은 최근에 플레이한 순서입니다.
  const recentNames: string[] = [];
  [lastGame, ...records.map((record) => record.game)].forEach((name) => {
    if (name && !recentNames.includes(name)) recentNames.push(name);
  });
  const visibleGames = allGames.filter(({ game }) => {
    const matchesQuery = game.name.toLowerCase().includes(query.trim().toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'recent' && recentNames.includes(game.name)) || (filter === 'favorites' && favorites.includes(game.name));
    return matchesQuery && matchesFilter;
  });
  // 최근 목록은 가나다순이 아니라 최근에 본 순서로 보여 줍니다.
  if (filter === 'recent') visibleGames.sort((a, b) => recentNames.indexOf(a.game.name) - recentNames.indexOf(b.game.name));

  useEffect(() => {
    // 저장값이 깨져 있어도 즐겨찾기 때문에 화면이 멈추면 안 됩니다.
    AsyncStorage.getItem('world-casino.favorites').then((saved) => {
      if (!saved) return;
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setFavorites(parsed.filter((name) => typeof name === 'string'));
      } catch {
        AsyncStorage.removeItem('world-casino.favorites').catch(() => {});
      }
    }).catch(() => {});
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
          ['recent', `최근 ${recentNames.length}`],
        ] as const).map(([value, label]) => (
          <Pressable key={value} accessibilityRole="button" onPress={() => setFilter(value)} style={[styles.chip, filter === value && styles.chipActive]}>
            <Text style={filter === value ? styles.chipActiveText : styles.chipText}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {!showGameResults ? <>
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
          {visibleGames.length === 0 && <View style={styles.panel}><Text style={styles.emptyText}>{query.trim() ? '검색 결과가 없습니다.' : filter === 'favorites' ? '즐겨찾기한 게임이 없습니다. 게임 옆의 별을 눌러 추가하세요.' : filter === 'recent' ? '아직 연 게임이 없습니다. 게임을 하나 골라 보세요.' : '게임이 없습니다.'}</Text></View>}
        </View>
      </>}
    </Page>
  );
}

function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.detailHeader}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="뒤로"
        style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        onPress={onBack}
        hitSlop={10}
      >
        <Text style={styles.backButtonArrow}>‹</Text>
        <Text style={styles.backButtonLabel}>뒤로</Text>
      </Pressable>
      <Text style={styles.detailHeaderTitle} numberOfLines={1}>{title}</Text>
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
      <ScrollView {...useScrollMemory('CategoryCatalogScreen')} contentContainerStyle={styles.detailPage} showsVerticalScrollIndicator={false}>
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
                  {game.status !== 'playable' && <Text style={styles.comingSoonBadge}>준비 중</Text>}
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
      <ScrollView {...useScrollMemory('BlackjackSetupScreen')} contentContainerStyle={styles.detailPage} showsVerticalScrollIndicator={false}>
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
      <ScrollView {...useScrollMemory('GamePreviewScreen')} contentContainerStyle={styles.detailPage} showsVerticalScrollIndicator={false}>
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
  return <View style={styles.detailScreen}><ScreenHeader title="슬롯(Slot) 설정" onBack={props.onBack} /><ScrollView {...useScrollMemory('SlotSetupScreen')} contentContainerStyle={styles.detailPage} showsVerticalScrollIndicator={false}>
    <View style={styles.slotSetupHero}><Text style={styles.slotLogo}>7</Text><View style={styles.slotSetupCopy}><Text style={styles.eyebrow}>WORLD SLOTS</Text><Text style={styles.detailLead}>그림을 맞추고 보너스에 도전</Text><Text style={styles.gameListDescription}>한 번 회전이 한 판이며, 무료 회전이 나오면 계속 이어집니다.</Text></View></View>
    <Text style={styles.sectionTitle}>게임 방식</Text><View style={styles.slotModeRow}><Pressable onPress={() => props.onModeChange('classic')} style={[styles.slotModeCard, props.mode === 'classic' && styles.slotModeActive]}><Text style={props.mode === 'classic' ? styles.slotModeTitleActive : styles.slotModeTitle}>클래식 슬롯(Classic Slot)</Text><Text style={styles.slotModeText}>자동으로 멈추는 3릴</Text></Pressable><Pressable onPress={() => props.onModeChange('pachislot')} style={[styles.slotModeCard, props.mode === 'pachislot' && styles.slotModeActive]}><Text style={props.mode === 'pachislot' ? styles.slotModeTitleActive : styles.slotModeTitle}>일본식 파치슬롯(Pachislot)</Text><Text style={styles.slotModeText}>레버 시작 · 릴 3개 직접 정지</Text></Pressable></View>
    <SlotRules />
    <Text style={styles.sectionTitle}>베팅 등급</Text><View style={styles.setupOptions}>{difficultyOptions.map((item) => <Pressable key={item.name} style={[styles.setupOption, props.difficulty === item.name && styles.setupOptionActive]} onPress={() => props.onDifficultyChange(item.name)}><Text style={[styles.setupOptionTitle, props.difficulty === item.name && styles.setupOptionTitleActive]}>{betTierName(item.name)}</Text><Text style={styles.setupOptionRange}>{item.min.toLocaleString()}~{item.max.toLocaleString()} WC</Text></Pressable>)}</View>
    <Text style={styles.sectionTitle}>베팅 금액</Text><View style={styles.betGrid}>{option.bets.map((amount) => <BetOptionCoin key={amount} amount={amount} selected={props.selectedBet === amount} disabled={amount > props.coins} onPress={() => props.onBetChange(amount)} />)}</View>
    <View style={styles.setupSummary}><Row title="보유 코인" value={`${props.coins.toLocaleString()} WC`} /><View style={styles.separator} /><Row title="선택 모드" value={props.mode === 'classic' ? '클래식 슬롯' : '일본식 파치슬롯'} /><View style={styles.separator} /><Row title="선택 베팅" value={`${props.selectedBet.toLocaleString()} WC`} /></View>
    <Pressable disabled={props.selectedBet > props.coins} style={[styles.primaryButton, styles.fullWidthButton, props.selectedBet > props.coins && styles.disabledCard]} onPress={props.onStart}><Text style={styles.primaryButtonText}>{props.mode === 'classic' ? '클래식 슬롯(Classic Slot) 시작' : '파치슬롯(Pachislot) 시작'}</Text></Pressable>
  </ScrollView></View>;
}

function SlotGameScreen({ coins, difficulty, selectedBet, motion, onBack, onBetChange, onPlaceBet, onSettle }: { coins: number; difficulty: string; selectedBet: number; motion: number; onBack: () => void; onBetChange: (value: number) => void; onPlaceBet: (stake: number) => boolean; onSettle: (stake: number, result: SlotResult, usedFreeSpin: boolean) => void }) {
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
    const ticker = setInterval(() => setReels([spinSlot(1).reels[0], spinSlot(1).reels[1], spinSlot(1).reels[2]]), Math.max(30, Math.round(90 * motion)));
    setTimeout(() => {
      clearInterval(ticker);
      const next = spinSlot(selectedBet); setReels(next.reels); setResult(next); setFreeSpins((value) => value + next.freeSpins); setSpinning(false); onSettle(selectedBet, next, usedFreeSpin);
    }, Math.max(80, Math.round(720 * motion)));
  };
  return <View style={styles.slotScreen}><ScreenHeader title="클래식 슬롯(Classic Slot)" onBack={onBack} /><ScrollView contentContainerStyle={styles.slotPage} showsVerticalScrollIndicator={false}>
    <View style={styles.rouletteStatusRow}><View><Text style={styles.eyebrow}>WORLD SLOTS</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View><View style={styles.difficultyBadge}><Text style={styles.difficultyBadgeText}>{betTierName(difficulty)}</Text></View></View>
    <View style={[styles.slotMachine,spinning&&styles.slotMachineSpinning]}><View style={styles.slotBulbRow}>{Array.from({length:11},(_,index)=><View key={index} style={[styles.slotBulb,spinning&&index%2===0&&styles.slotBulbHot]}/>)}</View><View style={styles.slotMarquee}><Text style={styles.slotMarqueeSmall}>WORLD CASINO</Text><Text style={styles.slotJackpot}>◆ MEGA JACKPOT · x50 ◆</Text></View><View style={styles.slotMeters}><View style={styles.slotMeter}><Text style={styles.slotMeterLabel}>CREDIT</Text><Text style={styles.slotMeterValue}>{coins.toLocaleString()}</Text></View><View style={styles.slotMeter}><Text style={styles.slotMeterLabel}>BET</Text><Text style={styles.slotMeterValue}>{selectedBet.toLocaleString()}</Text></View><View style={styles.slotMeter}><Text style={styles.slotMeterLabel}>WIN</Text><Text style={styles.slotMeterValue}>{result?.payout.toLocaleString()??'0'}</Text></View></View><View style={styles.slotReelWindow}><View style={styles.slotReels}>{reels.map((symbol, index) => <View key={index} style={[styles.slotReel, Boolean(result?.multiplier) && styles.slotReelWin]}><Text style={styles.slotGhostSymbol}>{spinning?'◆':' '}</Text><Text style={styles.slotSymbol}>{symbol}</Text><Text style={styles.slotGhostSymbol}>{spinning?'●':' '}</Text></View>)}</View><View style={styles.slotPayline} /></View><View style={styles.slotDecorControls}><View style={[styles.slotDecorButton,{backgroundColor:'#F4C84B'}]}/><View style={[styles.slotDecorButton,{backgroundColor:'#E85252'}]}/><View style={[styles.slotDecorButton,{backgroundColor:'#4CCB8B'}]}/><Text style={styles.slotDecorText}>1 LINE　MAX BET　AUTO PLAY</Text></View><Text style={styles.slotMachineLabel}>{spinning ? '회전 중…' : result?.label ?? 'SPIN을 눌러 시작하세요'}</Text>{result && <Text style={[styles.slotPayout, result.payout > 0 ? styles.positive : styles.muted]}>{result.payout > 0 ? `+${result.payout.toLocaleString()} WC 지급` : '당첨 없음'}</Text>}{freeSpins > 0 && <Text style={styles.freeSpinBadge}>무료 회전 {freeSpins}회 남음</Text>}<View style={styles.slotBulbRow}>{Array.from({length:11},(_,index)=><View key={index} style={[styles.slotBulb,spinning&&index%2===1&&styles.slotBulbHot]}/>)}</View></View>
    <Pressable disabled={spinning || (freeSpins === 0 && selectedBet > coins)} style={[styles.slotSpinButton, (spinning || (freeSpins === 0 && selectedBet > coins)) && styles.disabledCard]} onPress={spin}><Text style={styles.slotSpinText}>{spinning ? '회전 중…' : freeSpins > 0 ? `무료 SPIN · ${freeSpins}회` : `SPIN · ${selectedBet.toLocaleString()} WC`}</Text></Pressable>
    <Text style={styles.sectionTitle}>베팅 금액</Text><View style={styles.betGrid}>{option.bets.map((amount) => <BetOptionCoin key={amount} amount={amount} selected={selectedBet === amount} disabled={spinning || freeSpins > 0} onPress={() => onBetChange(amount)} />)}</View>
    <SlotRules compact /><Text style={styles.disclaimer}>게임 전용 가상 코인 · 현금 환전 불가</Text>
  </ScrollView></View>;
}

function PachislotGameScreen({ coins, difficulty, selectedBet, motion, onBack, onBetChange, onPlaceBet, onSettle }: { coins: number; difficulty: string; selectedBet: number; motion: number; onBack: () => void; onBetChange: (value: number) => void; onPlaceBet: (stake: number) => boolean; onSettle: (stake: number, result: PachislotResult, usedFreeGame: boolean) => void }) {
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
    const timer = setInterval(() => setReels((current) => current.map((symbol, index) => stopped[index] ? symbol : pachislotSymbols[Math.floor(Math.random() * pachislotSymbols.length)]) as [PachislotSymbol, PachislotSymbol, PachislotSymbol]), Math.max(30, Math.round(90 * motion)));
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

/** 룰렛·비디오 포커도 다른 게임과 같은 준비 화면을 거칩니다(등급·금액을 여기서 정함). */
function SimpleSetupScreen(props: {
  title: string;
  hero: string;
  lead: string;
  rules: string[];
  startLabel: string;
  coins: number;
  difficulty: string;
  selectedBet: number;
  onBack: () => void;
  onDifficultyChange: (value: string) => void;
  onBetChange: (value: number) => void;
  onStart: () => void;
}) {
  const option = difficultyOptions.find((item) => item.name === props.difficulty) ?? difficultyOptions[2];
  return (
    <View style={styles.detailScreen}>
      <ScreenHeader title={`${props.title} 설정`} onBack={props.onBack} />
      <ScrollView {...useScrollMemory('SimpleSetupScreen')} contentContainerStyle={styles.detailPage} showsVerticalScrollIndicator={false}>
        <View style={styles.sicboHero}>
          <Text style={styles.sicboHeroDice}>{props.hero}</Text>
          <Text style={styles.detailLead}>{props.lead}</Text>
        </View>
        <View style={styles.slotRules}>
          <Text style={styles.slotRulesTitle}>규칙</Text>
          {props.rules.map((rule, index) => <Text key={index} style={styles.slotRuleText}>{rule}</Text>)}
        </View>
        <Text style={styles.sectionTitle}>베팅 등급</Text>
        <View style={styles.setupOptions}>
          {difficultyOptions.map((item) => (
            <Pressable key={item.name} style={[styles.setupOption, props.difficulty === item.name && styles.setupOptionActive]} onPress={() => props.onDifficultyChange(item.name)}>
              <Text style={[styles.setupOptionTitle, props.difficulty === item.name && styles.setupOptionTitleActive]}>{betTierName(item.name)}</Text>
              <Text style={styles.setupOptionRange}>{item.min.toLocaleString()}~{item.max.toLocaleString()} WC</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.sectionTitle}>베팅 금액</Text>
        <View style={styles.betGrid}>
          {option.bets.map((amount, index) => <BetOptionCoin key={amount} amount={amount} level={index + 1} selected={props.selectedBet === amount} disabled={amount > props.coins} onPress={() => props.onBetChange(amount)} />)}
        </View>
        <Pressable disabled={props.selectedBet > props.coins} style={[styles.primaryButton, styles.fullWidthButton, props.selectedBet > props.coins && styles.disabledCard]} onPress={props.onStart}>
          <Text style={styles.primaryButtonText}>{props.startLabel}</Text>
        </Pressable>
        <Text style={styles.disclaimer}>베팅 금액은 게임 안에서도 바꿀 수 있습니다.</Text>
      </ScrollView>
    </View>
  );
}

function SicBoSetupScreen(props: { coins: number; difficulty: string; selectedBet: number; onBack: () => void; onDifficultyChange: (value: string) => void; onBetChange: (value: number) => void; onStart: () => void }) {
  const option = difficultyOptions.find((item) => item.name === props.difficulty) ?? difficultyOptions[2];
  return <View style={styles.detailScreen}><ScreenHeader title="식보(骰寶, Sic Bo) 설정" onBack={props.onBack} /><ScrollView {...useScrollMemory('SicBoSetupScreen')} contentContainerStyle={styles.detailPage} showsVerticalScrollIndicator={false}><View style={styles.sicboHero}><Text style={styles.sicboHeroDice}>⚀ ⚂ ⚄</Text><Text style={styles.detailLead}>세 주사위의 조합을 예측</Text><Text style={styles.gameListDescription}>매 회전마다 베팅하고 주사위 결과를 즉시 확인합니다.</Text></View><SicBoRules /><Text style={styles.sectionTitle}>베팅 등급</Text><View style={styles.setupOptions}>{difficultyOptions.map((item) => <Pressable key={item.name} style={[styles.setupOption, props.difficulty === item.name && styles.setupOptionActive]} onPress={() => props.onDifficultyChange(item.name)}><Text style={[styles.setupOptionTitle, props.difficulty === item.name && styles.setupOptionTitleActive]}>{betTierName(item.name)}</Text><Text style={styles.setupOptionRange}>{item.min.toLocaleString()}~{item.max.toLocaleString()} WC</Text></Pressable>)}</View><Text style={styles.sectionTitle}>베팅 금액</Text><View style={styles.betGrid}>{option.bets.map((amount) => <BetOptionCoin key={amount} amount={amount} selected={props.selectedBet === amount} disabled={amount > props.coins} onPress={() => props.onBetChange(amount)} />)}</View><Pressable disabled={props.selectedBet > props.coins} style={[styles.primaryButton, styles.fullWidthButton, props.selectedBet > props.coins && styles.disabledCard]} onPress={props.onStart}><Text style={styles.primaryButtonText}>식보(骰寶, Sic Bo) 시작</Text></Pressable></ScrollView></View>;
}

function SicBoGameScreen({ coins, difficulty, selectedBet, motion, onBack, onBetChange, onPlaceBet, onSettle }: { coins: number; difficulty: string; selectedBet: number; motion: number; onBack: () => void; onBetChange: (value: number) => void; onPlaceBet: (stake: number) => boolean; onSettle: (bet: SicBoBet, stake: number, dice: SicBoDice) => void }) {
  const option = difficultyOptions.find((item) => item.name === difficulty) ?? difficultyOptions[2];
  const [bet, setBet] = useState<SicBoBet>({ type: 'big' }); const [dice, setDice] = useState<SicBoDice>([1, 3, 5]); const [rolling, setRolling] = useState(false); const [net, setNet] = useState<number | null>(null);
  const selected = (candidate: SicBoBet) => JSON.stringify(candidate) === JSON.stringify(bet);
  const choose = (candidate: SicBoBet) => { if (!rolling) { setBet(candidate); setNet(null); } };
  const roll = () => { if (rolling || !onPlaceBet(selectedBet)) return; setRolling(true); setNet(null); const timer = setInterval(() => setDice(rollSicBo()), Math.max(30, Math.round(90 * motion))); setTimeout(() => { clearInterval(timer); const next = rollSicBo(); setDice(next); const nextNet = sicBoNet(bet, selectedBet, next); setNet(nextNet); setRolling(false); onSettle(bet, selectedBet, next); }, Math.max(80, Math.round(720 * motion))); };
  const optionButton = (candidate: SicBoBet, title: string, odds: string) => <Pressable key={`${candidate.type}-${'value' in candidate ? candidate.value : title}`} onPress={() => choose(candidate)} style={[styles.sicboBetButton, selected(candidate) && styles.sicboBetActive]}>{selected(candidate) && <CoinStack amount={selectedBet} compact />}<Text style={styles.sicboBetTitle}>{title}</Text><Text style={styles.sicboOdds}>{odds}</Text></Pressable>;
  return <View style={styles.sicboScreen}><ScreenHeader title="식보(骰寶, Sic Bo)" onBack={onBack} /><ScrollView contentContainerStyle={styles.sicboPage} showsVerticalScrollIndicator={false}><View style={styles.rouletteStatusRow}><View><Text style={styles.eyebrow}>SIC BO</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View><View style={styles.difficultyBadge}><Text style={styles.difficultyBadgeText}>{betTierName(difficulty)}</Text></View></View><View style={[styles.sicboBowl,rolling&&styles.diceTableRolling]}><Text style={styles.crapsPointLabel}>{rolling ? 'SHAKING' : `합계 ${dice[0] + dice[1] + dice[2]}`}</Text><View style={styles.sicboDiceRow}>{dice.map((value, index) => <Die key={index} value={value} rolling={rolling} index={index}/>)}</View>{net !== null && <Text style={[styles.sicboResult, net > 0 ? styles.positive : styles.negative]}>{net > 0 ? '당첨' : '미당첨'} · {net > 0 ? '+' : ''}{net.toLocaleString()} WC</Text>}</View><Pressable disabled={rolling || selectedBet > coins} style={[styles.primaryButton, styles.rouletteSpinButton, styles.sicboRollButton, (rolling || selectedBet > coins) && styles.disabledCard]} onPress={roll}><Text style={styles.primaryButtonText}>{rolling ? '주사위 흔드는 중…' : `${sicBoBetLabel(bet)}에 ${selectedBet.toLocaleString()} WC 베팅`}</Text></Pressable>
    <Text style={styles.sectionTitle}>기본 베팅</Text><View style={styles.sicboFourGrid}>{optionButton({ type: 'big' }, '대 11–17', '1:1')}{optionButton({ type: 'small' }, '소 4–10', '1:1')}{optionButton({ type: 'odd' }, '홀수', '1:1')}{optionButton({ type: 'even' }, '짝수', '1:1')}</View>
    <Text style={styles.sectionTitle}>특정 합계</Text><View style={styles.sicboNumberGrid}>{Array.from({ length: 14 }, (_, index) => index + 4).map((value) => optionButton({ type: 'total', value }, String(value), value === 4 || value === 17 ? '50:1' : '6~18:1'))}</View>
    <Text style={styles.sectionTitle}>특정 숫자</Text><View style={styles.sicboNumberGrid}>{[1,2,3,4,5,6].map((value) => optionButton({ type: 'single', value }, String(value), '1~3개'))}</View>
    <Text style={styles.sectionTitle}>더블</Text><View style={styles.sicboNumberGrid}>{[1,2,3,4,5,6].map((value) => optionButton({ type: 'double', value }, `${value}${value}`, '11:1'))}</View>
    <Text style={styles.sectionTitle}>트리플</Text><View style={styles.sicboNumberGrid}>{[1,2,3,4,5,6].map((value) => optionButton({ type: 'triple', value }, `${value}${value}${value}`, '180:1'))}</View>
    <Text style={styles.sectionTitle}>베팅 금액</Text><View style={styles.betGrid}>{option.bets.map((amount) => <BetOptionCoin key={amount} amount={amount} selected={selectedBet === amount} disabled={rolling} onPress={() => onBetChange(amount)} />)}</View>
  </ScrollView></View>;
}

function YahtzeeGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(stake:number)=>boolean;onSettle:(stake:number,score:number,multiplier:number)=>void}){
  const [started,setStarted]=useState(false); const [finished,setFinished]=useState(false);
  const [dice,setDice]=useState<YahtzeeDie[]>([1,1,1,1,1]); const [held,setHeld]=useState([false,false,false,false,false]);
  const [rollCount,setRollCount]=useState(0); const [card,setCard]=useState<YahtzeeScoreCard>({}); const [rolling,setRolling]=useState(false);
  const total=yahtzeeTotal(card); const completed=Object.keys(card).length;
  const begin=()=>{if(!onPlaceBet(selectedBet))return;setStarted(true);setFinished(false);setDice([1,1,1,1,1]);setHeld([false,false,false,false,false]);setRollCount(0);setCard({});};
  const roll=()=>{if(!started||finished||rollCount>=3||rolling)return;setRolling(true);const timer=setInterval(()=>setDice((current)=>rollYahtzeeDice(current,held)),75);setTimeout(()=>{clearInterval(timer);setDice((current)=>rollYahtzeeDice(current,held));setRollCount((value)=>value+1);setRolling(false);},850);};
  const choose=(category:YahtzeeCategory)=>{
    if(rollCount===0||card[category]!==undefined||finished)return;
    const value=scoreYahtzeeCategory(category,dice); const next={...card,[category]:value}; setCard(next); setHeld([false,false,false,false,false]); setRollCount(0);
    if(Object.keys(next).length===yahtzeeCategories.length){const finalScore=yahtzeeTotal(next);const multiplier=yahtzeePayoutMultiplier(finalScore);setFinished(true);onSettle(selectedBet,finalScore,multiplier);}
  };
  return <View style={styles.sicboScreen}><ScreenHeader title="야찌(Yahtzee)" onBack={onBack}/><ScrollView contentContainerStyle={styles.sicboPage} showsVerticalScrollIndicator={false}>
    <View style={styles.rouletteStatusRow}><View><Text style={styles.eyebrow}>WORLD DICE GAME</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View><View style={styles.difficultyBadge}><Text style={styles.difficultyBadgeText}>{completed}/13칸</Text></View></View>
    {!started?<><View style={styles.sicboBowl}><Text style={styles.sicboResult}>한 판은 13라운드입니다</Text><Text style={styles.slotRuleText}>200점 이상 2배 · 250점 이상 3배</Text></View><Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton,selectedBet>coins&&styles.disabledCard]} onPress={begin}><Text style={styles.primaryButtonText}>{selectedBet.toLocaleString()} WC로 시작</Text></Pressable></>:
    <><View style={[styles.sicboBowl,rolling&&styles.diceTableRolling]}><Text style={styles.crapsPointLabel}>{rolling?'ROLLING…':finished?'게임 종료':rollCount===0?'새 라운드':`${rollCount}/3회 굴림`}</Text><View style={styles.sicboDiceRow}>{dice.map((value,index)=><Pressable key={index} disabled={rollCount===0||finished||rolling} onPress={()=>setHeld((current)=>current.map((item,i)=>i===index?!item:item))} style={[styles.yahtzeeDieButton,held[index]&&styles.yahtzeeHeld]}><Die value={value} rolling={rolling&&!held[index]} index={index}/><Text style={styles.yahtzeeHoldText}>{held[index]?'KEEP':'보관'}</Text></Pressable>)}</View><Text style={styles.sicboResult}>현재 {total}점{yahtzeeUpperBonus(card)>0?' · 상단 보너스 +35':''}</Text></View>
    {!finished?<Pressable disabled={rollCount>=3||rolling} style={[styles.primaryButton,styles.rouletteSpinButton,(rollCount>=3||rolling)&&styles.disabledCard]} onPress={roll}><Text style={styles.primaryButtonText}>{rolling?'주사위 굴리는 중…':rollCount===0?'주사위 굴리기':rollCount<3?'나머지 다시 굴리기':'점수칸을 선택하세요'}</Text></Pressable>:<Pressable style={[styles.primaryButton,styles.fullWidthButton]} onPress={begin}><Text style={styles.primaryButtonText}>새 게임 시작</Text></Pressable>}
    <View style={styles.yahtzeeSummary}><Text style={styles.slotRulesTitle}>점수 현황</Text><Text style={styles.slotRuleText}>상단 {yahtzeeUpperSubtotal(card)}/63 · 보너스 {yahtzeeUpperBonus(card)} · 총점 {total}</Text></View>
    <View style={styles.sicboFourGrid}>{yahtzeeCategories.map((category)=>{const saved=card[category];const preview=rollCount>0?scoreYahtzeeCategory(category,dice):0;return <Pressable key={category} disabled={saved!==undefined||rollCount===0||finished} onPress={()=>choose(category)} style={[styles.sicboBetButton,saved!==undefined&&styles.disabledCard]}><Text style={styles.sicboBetTitle}>{yahtzeeCategoryLabels[category]}</Text><Text style={styles.sicboOdds}>{saved!==undefined?`${saved}점`:rollCount>0?`선택 시 ${preview}점`:'—'}</Text></Pressable>;})}</View>
    {finished&&<View style={styles.setupSummary}><Text style={styles.resultTitle}>최종 {total}점</Text><Text style={styles.resultDetail}>{yahtzeePayoutMultiplier(total)?`${(selectedBet*yahtzeePayoutMultiplier(total)).toLocaleString()} WC 지급`:'목표 점수 미달'}</Text></View>}</>}
  </ScrollView></View>;
}

type InstantSettle=(stake:number,multiplier:number,detail:string)=>void;
function OddEvenGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:InstantSettle}){
  const [choice,setChoice]=useState<OddEvenChoice>('홀');const [value,setValue]=useState<number|null>(null);const [history,setHistory]=useState<number[]>([]);
  const play=()=>{if(!onPlaceBet(selectedBet))return;const next=drawOddEven(),win=oddEvenWins(choice,next);setValue(next);setHistory(current=>[next,...current].slice(0,15));onSettle(selectedBet,win?2:0,`${choice} 선택 · ${next}은 ${next%2?'홀':'짝'}`);};
  return <View style={styles.sicboScreen}><ScreenHeader title="홀짝" onBack={onBack}/><ScrollView contentContainerStyle={styles.sicboPage}><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text><View style={styles.sicboBowl}><Text style={styles.yahtzeeBigNumber}>{value??'?'}</Text><Text style={styles.sicboResult}>{value===null?'홀 또는 짝을 고르세요':`${value%2?'홀수':'짝수'}가 나왔습니다`}</Text></View><View style={styles.sicboFourGrid}>{(['홀','짝'] as OddEvenChoice[]).map(item=><Pressable key={item} onPress={()=>setChoice(item)} style={[styles.sicboBetButton,choice===item&&styles.sicboBetActive]}><Text style={styles.sicboBetTitle}>{item}</Text><Text style={styles.sicboOdds}>2배 지급</Text></Pressable>)}</View><Pressable style={[styles.primaryButton,styles.fullWidthButton]} onPress={play}><Text style={styles.primaryButtonText}>{choice}에 {selectedBet.toLocaleString()} WC</Text></Pressable><View style={styles.numberHistoryPanel}><Text style={styles.slotRulesTitle}>지금까지 나온 숫자</Text>{history.length?<View style={styles.numberHistoryRow}>{history.map((number,index)=><View key={`${number}-${index}`} style={[styles.numberHistoryBall,number%2?styles.oddHistoryBall:styles.evenHistoryBall]}><Text style={styles.numberHistoryValue}>{number}</Text><Text style={styles.numberHistoryKind}>{number%2?'홀':'짝'}</Text></View>)}</View>:<Text style={styles.slotRuleText}>첫 결과가 여기에 기록됩니다.</Text>}</View></ScrollView></View>;
}
function LottoGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:InstantSettle}){
  const [chosen,setChosen]=useState<number[]>([]);const [draw,setDraw]=useState<{numbers:number[];bonus:number}|null>(null);
  const toggle=(value:number)=>{if(draw)return;setChosen(current=>current.includes(value)?current.filter(v=>v!==value):current.length<6?[...current,value].sort((a,b)=>a-b):current);};
  const play=()=>{if(chosen.length!==6||!onPlaceBet(selectedBet))return;const next=drawLotto(),result=lottoResult(chosen,next.numbers,next.bonus);setDraw(next);onSettle(selectedBet,result.multiplier,`${result.matches}개 일치${result.bonusHit?' + 보너스':''}`);};
  const matched=draw?chosen.filter(number=>draw.numbers.includes(number)):[],bonusHit=!!draw&&chosen.includes(draw.bonus),result=draw?lottoResult(chosen,draw.numbers,draw.bonus):null;
  return <View style={styles.sicboScreen}><ScreenHeader title="월드 로또" onBack={onBack}/><ScrollView contentContainerStyle={styles.sicboPage}><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text><Text style={styles.sectionTitle}>내 번호 {chosen.length}/6</Text><View style={styles.yahtzeeNumberGrid}>{Array.from({length:45},(_,i)=>i+1).map(value=><Pressable key={value} onPress={()=>toggle(value)} style={[styles.yahtzeeNumber,chosen.includes(value)&&styles.sicboBetActive,draw&&matched.includes(value)&&styles.lottoMatchedPick,draw&&chosen.includes(value)&&!matched.includes(value)&&styles.lottoMissedPick]}><Text style={styles.sicboBetTitle}>{value}</Text></Pressable>)}</View>{draw&&<View style={styles.lottoResultPanel}><Text style={styles.slotRulesTitle}>당첨 번호</Text><View style={styles.lottoBallRow}>{draw.numbers.map(number=><View key={number} style={[styles.lottoBall,matched.includes(number)&&styles.lottoBallMatch]}><Text style={styles.lottoBallText}>{number}</Text>{matched.includes(number)&&<Text style={styles.lottoBallCheck}>내 번호</Text>}</View>)}<Text style={styles.lottoPlus}>＋</Text><View style={[styles.lottoBall,styles.lottoBonusBall,bonusHit&&styles.lottoBallMatch]}><Text style={styles.lottoBallText}>{draw.bonus}</Text><Text style={styles.lottoBallCheck}>보너스</Text></View></View><Text style={styles.lottoMatchSummary}>{result?.matches??0}개 일치{bonusHit?' · 보너스도 일치':''}</Text><Text style={styles.resultDetail}>{matched.length?`맞은 번호: ${matched.join(', ')}`:'맞은 번호가 없습니다'}{bonusHit?` · 보너스 ${draw.bonus}`:''}</Text><Text style={[styles.sicboResult,(result?.multiplier??0)>0?styles.positive:styles.muted]}>{(result?.multiplier??0)>0?`${result?.multiplier}배 당첨`:'이번 회차 미당첨'}</Text></View>}<Pressable disabled={chosen.length!==6} style={[styles.primaryButton,styles.fullWidthButton,chosen.length!==6&&styles.disabledCard]} onPress={draw?()=>{setDraw(null);setChosen([]);}:play}><Text style={styles.primaryButtonText}>{draw?'새 번호 고르기':`${selectedBet.toLocaleString()} WC 추첨`}</Text></Pressable></ScrollView></View>;
}
function ScratchGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:InstantSettle}){
  const [symbols,setSymbols]=useState<ScratchSymbol[]|null>(null),[revealed,setRevealed]=useState<number[]>([]),[settled,setSettled]=useState(false);const sizeRef=useRef({width:1,height:1});const symbolsRef=useRef<ScratchSymbol[]|null>(null);
  const revealAt=(x:number,y:number)=>{if(!symbolsRef.current)return;const col=Math.max(0,Math.min(2,Math.floor(x/(sizeRef.current.width/3)))),row=Math.max(0,Math.min(2,Math.floor(y/(sizeRef.current.height/3)))),index=row*3+col;setRevealed(current=>current.includes(index)?current:[...current,index]);};
  const scratchResponder=useRef(PanResponder.create({onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>true,onPanResponderGrant:event=>revealAt(event.nativeEvent.locationX,event.nativeEvent.locationY),onPanResponderMove:event=>revealAt(event.nativeEvent.locationX,event.nativeEvent.locationY)})).current;
  const play=()=>{if(!onPlaceBet(selectedBet))return;const next=drawScratch();symbolsRef.current=next;setSymbols(next);setRevealed([]);setSettled(false);};
  useEffect(()=>{if(symbols&&revealed.length===9&&!settled){const result=scratchResult(symbols);setSettled(true);onSettle(selectedBet,result.multiplier,`${result.symbol||'당첨 없음'} ${result.count}개`);}},[symbols,revealed.length,settled,selectedBet]);
  return <View style={styles.sicboScreen}><ScreenHeader title="즉석 복권" onBack={onBack}/><ScrollView contentContainerStyle={styles.sicboPage} scrollEnabled={!symbols||settled}><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text>{symbols?<><Text style={styles.scratchInstruction}>손가락으로 은색 칸을 문질러 모두 긁어보세요</Text><View {...scratchResponder.panHandlers} onLayout={event=>{sizeRef.current=event.nativeEvent.layout;}} style={styles.yahtzeeScratchGrid}>{symbols.map((symbol,index)=><View key={index} style={styles.yahtzeeScratchCell}><Text style={styles.yahtzeeScratchSymbol}>{symbol}</Text>{!revealed.includes(index)&&<View pointerEvents="none" style={styles.scratchCoating}><Text style={styles.scratchCoatingText}>SCRATCH</Text><Text style={styles.scratchDust}>✦ ✧</Text></View>}</View>)}</View><Text style={styles.scratchProgress}>{revealed.length}/9칸 긁음</Text></>:<View style={styles.scratchTicketPreview}><Text style={styles.scratchTicketTitle}>WORLD CASINO</Text><Text style={styles.scratchTicketPrize}>LUCKY 9</Text><Text style={styles.scratchTicketHint}>같은 그림을 모으면 당첨</Text></View>}{symbols&&settled&&<Text style={styles.sicboResult}>{scratchResult(symbols).multiplier?`${scratchResult(symbols).symbol} ${scratchResult(symbols).count}개 · ${scratchResult(symbols).multiplier}배 당첨`:'아쉽지만 미당첨'}</Text>}<Pressable disabled={!!symbols&&!settled} style={[styles.primaryButton,styles.fullWidthButton,!!symbols&&!settled&&styles.disabledCard]} onPress={play}><Text style={styles.primaryButtonText}>{symbols&&settled?'새 복권 구매':`${selectedBet.toLocaleString()} WC 복권 구매`}</Text></Pressable></ScrollView></View>;
}
function TeenPattiGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:(mine:number,theirs:number,result:'win'|'loss'|'push',detail:string)=>void}){
  const [round,setRound]=useState<{player:Card[];opponent:Card[]}|null>(null),[mine,setMine]=useState(0),[theirs,setTheirs]=useState(0),[result,setResult]=useState<'win'|'loss'|'push'|null>(null),[folded,setFolded]=useState(false);
  const start=()=>{if(!onPlaceBet(selectedBet))return;setRound(dealTeenPatti());setMine(selectedBet);setTheirs(selectedBet);setResult(null);setFolded(false);};
  const showdown=(raised=false)=>{if(!round)return;let myBet=mine,opponentBet=theirs;if(raised){if(!onPlaceBet(selectedBet))return;myBet+=selectedBet;opponentBet+=selectedBet;setMine(myBet);setTheirs(opponentBet);}const compared=compareTeenPatti(round.player,round.opponent),next=compared>0?'win':compared<0?'loss':'push';setResult(next);onSettle(myBet,opponentBet,next,`나 ${evaluateTeenPatti(round.player).label} · 컴퓨터 ${evaluateTeenPatti(round.opponent).label}`);};
  const fold=()=>{if(!round||result)return;setFolded(true);setResult('loss');onSettle(mine,theirs,'loss',`다이 · 상대 카드 비공개`);};
  return <View style={styles.pokerTable}><ScreenHeader title="틴 파티(Teen Patti)" onBack={onBack}/><ScrollView contentContainerStyle={styles.pokerPage}><View style={styles.rouletteStatusRow}><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text><Text style={styles.difficultyBadgeText}>POT {(mine+theirs).toLocaleString()} WC</Text></View>{!round?<Pressable style={[styles.primaryButton,styles.fullWidthButton]} onPress={start}><Text style={styles.primaryButtonText}>세 장 받기 · {selectedBet.toLocaleString()} WC</Text></Pressable>:<><Text style={styles.pokerSeat}>컴퓨터</Text><View style={styles.cardRow}>{round.opponent.map((card,index)=><PlayingCard key={card.id} card={card} hidden={!result||folded} emphasis={result&&!folded?(result==='loss'?'winner':'dim'):undefined}/>)}</View><FaceDownCardDeck label="남은 카드"/><Text style={styles.pokerSeat}>나 · {evaluateTeenPatti(round.player).label}</Text><View style={styles.cardRow}>{round.player.map(card=><PlayingCard key={card.id} card={card} emphasis={result?(result==='win'?'winner':'dim'):undefined}/>)}</View>{result?<><Text style={styles.sicboResult}>{folded?'다이했습니다':result==='win'?'내가 이겼습니다':result==='push'?'무승부입니다':'컴퓨터가 이겼습니다'}</Text><Pressable style={[styles.primaryButton,styles.fullWidthButton]} onPress={start}><Text style={styles.primaryButtonText}>다시 하기</Text></Pressable></>:<View style={styles.pokerActionRow}><Pressable style={styles.secondaryButton} onPress={fold}><Text style={styles.secondaryButtonText}>다이</Text></Pressable><Pressable style={styles.secondaryButton} onPress={()=>showdown(false)}><Text style={styles.secondaryButtonText}>콜 · 공개</Text></Pressable><Pressable style={styles.primaryButton} onPress={()=>showdown(true)}><Text style={styles.primaryButtonText}>레이즈 +{selectedBet.toLocaleString()}</Text></Pressable></View>}</>}</ScrollView></View>;
}

function PaiGowGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:(stake:number,result:'win'|'loss'|'push',detail:string)=>void}){
  const [round,setRound]=useState<{player:Card[];dealer:Card[]}|null>(null);
  const [lowIds,setLowIds]=useState<string[]>([]);
  const [dealerSplit,setDealerSplit]=useState<PaiGowSplit|null>(null);
  const [outcome,setOutcome]=useState<ReturnType<typeof resolvePaiGow>|null>(null);
  const start=()=>{if(!onPlaceBet(selectedBet))return;setRound(dealPaiGow());setLowIds([]);setDealerSplit(null);setOutcome(null);};
  const toggle=(id:string)=>{if(outcome)return;setLowIds(current=>current.includes(id)?current.filter(item=>item!==id):current.length<2?[...current,id]:current);};
  const recommend=()=>{if(!round)return;setLowIds(arrangePaiGow(round.player).low.map(card=>card.id));};
  const chosenLow=round?round.player.filter(card=>lowIds.includes(card.id)):[];
  const chosenHigh=round?round.player.filter(card=>!lowIds.includes(card.id)):[];
  const valid=chosenLow.length===2&&isValidPaiGowSplit(chosenHigh,chosenLow);
  const playerSplit=valid?splitPaiGow(round!.player,lowIds):null;
  const showdown=()=>{if(!round||!playerSplit)return;const house=arrangePaiGow(round.dealer),resolved=resolvePaiGow(playerSplit,house);setDealerSplit(house);setOutcome(resolved);onSettle(selectedBet,resolved.result,`하이 ${playerSplit.highRank.label} ${resolved.high==='win'?'승':'패'} · 로우 ${playerSplit.lowRank.label} ${resolved.low==='win'?'승':'패'}`);};
  return <View style={styles.pokerTable}><ScreenHeader title="파이 고우 포커(Pai Gow Poker)" onBack={onBack}/><ScrollView contentContainerStyle={styles.pokerPage} showsVerticalScrollIndicator={false}>
    <View style={styles.rouletteStatusRow}><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text><Text style={styles.difficultyBadgeText}>BET {selectedBet.toLocaleString()} WC</Text></View>
    {!round?<><View style={styles.holdemGuide}><Text style={styles.slotRulesTitle}>카드 7장을 받은 뒤</Text><Text style={styles.slotRuleText}>앞에 둘 로우 카드 2장을 직접 고릅니다. 나머지 5장은 자동으로 하이 핸드가 됩니다.</Text></View><Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton,selectedBet>coins&&styles.disabledCard]} onPress={start}><Text style={styles.primaryButtonText}>7장 받기</Text></Pressable></>:
    <><Text style={styles.pokerSeat}>딜러 · {dealerSplit?`${dealerSplit.highRank.label} / ${dealerSplit.lowRank.label}`:'승부 전 비공개'}</Text><View style={styles.cardRow}>{round.dealer.map(card=><PlayingCard key={card.id} card={card} hidden={!outcome} emphasis={outcome?(outcome.result==='loss'?'winner':'dim'):undefined}/>)}</View><FaceDownCardDeck label="남은 카드"/>
    <View style={styles.paiGowDivider}><Text style={styles.paiGowDividerTitle}>내 카드 — 로우로 보낼 2장을 선택</Text><Text style={styles.slotRuleText}>{lowIds.length}/2장 선택 · 선택한 카드는 위로 올라갑니다</Text></View>
    <View style={styles.cardRow}>{round.player.map(card=><Pressable key={card.id} disabled={!!outcome} onPress={()=>toggle(card.id)}><PlayingCard card={card} emphasis={lowIds.includes(card.id)?'selected':outcome?(outcome.result==='win'?'winner':'dim'):undefined}/></Pressable>)}</View>
    <View style={styles.paiGowHandSummary}><View style={styles.highLowResult}><Text style={styles.highLowResultTitle}>하이 · 5장</Text><Text style={styles.slotRuleText}>{playerSplit?.highRank.label??(lowIds.length===2?'파울 배치':'2장을 선택하세요')}</Text>{outcome&&<Text style={styles.paiGowResultMark}>{outcome.high==='win'?'승':'패'}</Text>}</View><View style={styles.highLowResult}><Text style={styles.highLowResultTitle}>로우 · 2장</Text><Text style={styles.slotRuleText}>{chosenLow.length===2?evaluatePaiGowTwo(chosenLow).label:'—'}</Text>{outcome&&<Text style={styles.paiGowResultMark}>{outcome.low==='win'?'승':'패'}</Text>}</View></View>
    {!outcome?<><View style={styles.pokerActionRow}><Pressable style={styles.secondaryButton} onPress={recommend}><Text style={styles.secondaryButtonText}>추천 배치</Text></Pressable><Pressable disabled={!valid} style={[styles.primaryButton,styles.paiGowShowdownButton,!valid&&styles.disabledCard]} onPress={showdown}><Text style={styles.primaryButtonText}>승부 보기</Text></Pressable></View>{lowIds.length===2&&!valid&&<Text style={styles.paiGowWarning}>파울: 하이 핸드가 로우 핸드보다 강하도록 다시 선택하세요.</Text>}</>:
    <><Text style={styles.sicboResult}>{outcome.result==='win'?'두 패를 모두 이겼습니다':outcome.result==='push'?'한 패씩 이겨 무승부입니다':'두 패 모두 딜러가 이겼습니다'}</Text><Pressable style={[styles.primaryButton,styles.fullWidthButton]} onPress={start}><Text style={styles.primaryButtonText}>다시 하기</Text></Pressable></>}</>}
  </ScrollView></View>;
}


type ChineseRowKey='back'|'middle'|'front';
const chineseRowMeta:{key:ChineseRowKey;name:string;size:number;hint:string}[]=[
  {key:'back',name:'뒷줄',size:5,hint:'세 줄 중 가장 세야 합니다'},
  {key:'middle',name:'가운뎃줄',size:5,hint:'뒷줄보다는 약해야 합니다'},
  {key:'front',name:'앞줄',size:3,hint:'스트레이트·플러시는 세지 않습니다'},
];
const chineseOutcomeMark={win:'승',loss:'패',push:'무'} as const;

function ChinesePokerGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:InstantSettle}){
  const [round,setRound]=useState<{player:Card[];opponent:Card[]}|null>(null);
  const [rows,setRows]=useState<Record<ChineseRowKey,string[]>>({back:[],middle:[],front:[]});
  const [target,setTarget]=useState<ChineseRowKey>('back');
  const [opponentHand,setOpponentHand]=useState<ChineseArrangement|null>(null);
  const [result,setResult]=useState<ChineseResult|null>(null);

  const start=()=>{
    if(selectedBet>coins||!onPlaceBet(selectedBet))return;
    setRound(dealChinesePoker());setRows({back:[],middle:[],front:[]});setTarget('back');setOpponentHand(null);setResult(null);
  };
  const cardsOf=(key:ChineseRowKey):Card[]=>round?rows[key].flatMap(id=>{const found=round.player.find(card=>card.id===id);return found?[found]:[];}):[];
  const assigned=new Set([...rows.back,...rows.middle,...rows.front]);
  const remaining=round?round.player.filter(card=>!assigned.has(card.id)):[];

  const place=(id:string)=>{
    if(result)return;
    const size=chineseRowMeta.find(row=>row.key===target)!.size;
    if(rows[target].length>=size)return;
    const next={...rows,[target]:[...rows[target],id]};
    setRows(next);
    // 고르던 줄이 다 차면 아직 자리가 남은 줄로 옮겨 갑니다.
    if(next[target].length>=size){const open=chineseRowMeta.find(row=>next[row.key].length<row.size);if(open)setTarget(open.key);}
  };
  const takeBack=(key:ChineseRowKey,id:string)=>{if(result)return;setRows(current=>({...current,[key]:current[key].filter(item=>item!==id)}));setTarget(key);};
  const recommend=()=>{
    if(!round||result)return;
    const layout=arrangeChinesePoker(round.player);
    setRows({back:layout.back.map(card=>card.id),middle:layout.middle.map(card=>card.id),front:layout.front.map(card=>card.id)});
  };
  const clearRows=()=>{if(result)return;setRows({back:[],middle:[],front:[]});setTarget('back');};

  const complete=rows.back.length===5&&rows.middle.length===5&&rows.front.length===3;
  const mine=complete?evaluateChineseArrangement({back:cardsOf('back'),middle:cardsOf('middle'),front:cardsOf('front')}):null;
  const handOf=(arrangement:ChineseArrangement|null,key:ChineseRowKey)=>arrangement?arrangement[key]:null;
  const outcomeOf=(name:string)=>result?.rows.find(row=>row.row===name)?.outcome;

  const showdown=()=>{
    if(!round||!mine||mine.foul||result)return;
    const theirs=evaluateChineseArrangement(arrangeChinesePoker(round.opponent));
    const resolved=resolveChinesePoker(mine,theirs);
    setOpponentHand(theirs);setResult(resolved);
    const rowText=resolved.rows.map(row=>`${row.row} ${chineseOutcomeMark[row.outcome]}`).join(' · ');
    onSettle(selectedBet,resolved.multiplier,`${rowText} · 합계 ${resolved.units>0?'+':''}${resolved.units}${resolved.scoop==='player'?' 스쿱':resolved.scoop==='opponent'?' 스쿱 당함':''}`);
  };

  const summary=!result?'':result.playerFoul?'파울로 세 줄을 모두 내줬습니다':result.opponentFoul?'상대가 파울이라 세 줄을 모두 가져왔습니다'
    :result.scoop==='player'?`세 줄을 모두 이겨 스쿱! ${(selectedBet*2).toLocaleString()} WC`
    :result.scoop==='opponent'?'세 줄을 모두 내줬습니다'
    :result.units>0?`${result.units}줄 앞서 ${Math.round(selectedBet*result.multiplier).toLocaleString()} WC`
    :result.units<0?`${-result.units}줄 밀려 ${Math.round(selectedBet*result.multiplier).toLocaleString()} WC`
    :'비겨서 베팅금을 돌려받았습니다';

  return <View style={styles.pokerTable}><ScreenHeader title={gameDisplayName('차이니즈 포커')} onBack={onBack}/><ScrollView contentContainerStyle={styles.pokerPage} showsVerticalScrollIndicator={false}>
    <View style={styles.rouletteStatusRow}><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text><Text style={styles.difficultyBadgeText}>BET {selectedBet.toLocaleString()} WC</Text></View>
    {!round?<>
      <View style={styles.holdemGuide}><Text style={styles.slotRulesTitle}>카드 열세 장을 받아</Text><Text style={styles.slotRuleText}>뒷줄 5장 · 가운뎃줄 5장 · 앞줄 3장으로 직접 나눕니다.</Text><Text style={styles.slotRuleText}>뒤로 갈수록 세야 하고, 어기면 파울로 세 줄을 모두 내줍니다.</Text></View>
      <Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton,selectedBet>coins&&styles.disabledCard]} onPress={start}><Text style={styles.primaryButtonText}>{selectedBet>coins?'코인이 부족합니다':'13장 받기'}</Text></Pressable>
    </>:<>
      {chineseRowMeta.map(row=>{
        const cards=cardsOf(row.key),hand=handOf(mine,row.key),outcome=outcomeOf(row.name);
        return <Pressable key={row.key} disabled={!!result} onPress={()=>setTarget(row.key)} style={[styles.chineseRow,target===row.key&&!result&&styles.chineseRowActive,outcome==='win'&&styles.chineseRowWon,outcome==='loss'&&styles.chineseRowLost]}>
          <View style={styles.chineseRowHead}>
            <Text style={styles.chineseRowName}>{row.name} · {cards.length}/{row.size}</Text>
            <Text style={styles.chineseRowLabel}>{hand?hand.label:row.hint}</Text>
            {outcome&&<Text style={styles.chineseRowMark}>{chineseOutcomeMark[outcome]}</Text>}
          </View>
          <View style={styles.chineseSlotRow}>
            {cards.map(card=><Pressable key={card.id} disabled={!!result} onPress={()=>takeBack(row.key,card.id)}><PlayingCard card={card} compact emphasis={outcome==='win'?'winner':outcome==='loss'?'dim':undefined}/></Pressable>)}
            {Array.from({length:row.size-cards.length},(_,index)=><View key={`empty-${index}`} style={styles.chineseEmptySlot}/>)}
          </View>
          {opponentHand&&<Text style={styles.chineseOpponentLine}>상대 {handOf(opponentHand,row.key)?.label}</Text>}
        </Pressable>;
      })}
      {!result&&<>
        <Text style={styles.sectionTitle}>남은 카드 {remaining.length}장 — 누르면 {chineseRowMeta.find(row=>row.key===target)!.name}에 놓입니다</Text>
        <View style={styles.chineseHandRow}>{remaining.map(card=><Pressable key={card.id} onPress={()=>place(card.id)}><PlayingCard card={card} compact/></Pressable>)}</View>
        {mine?.foul&&<Text style={styles.paiGowWarning}>파울입니다. 뒷줄이 가운뎃줄보다, 가운뎃줄이 앞줄보다 세도록 다시 놓으세요.</Text>}
        <View style={styles.pokerActionRow}>
          <Pressable style={styles.secondaryButton} onPress={recommend}><Text style={styles.secondaryButtonText}>추천 배치</Text></Pressable>
          <Pressable style={styles.secondaryButton} onPress={clearRows}><Text style={styles.secondaryButtonText}>다시 놓기</Text></Pressable>
          <Pressable disabled={!complete||!!mine?.foul} style={[styles.primaryButton,styles.paiGowShowdownButton,(!complete||!!mine?.foul)&&styles.disabledCard]} onPress={showdown}><Text style={styles.primaryButtonText}>승부 보기</Text></Pressable>
        </View>
      </>}
      {result&&<>
        <Text style={styles.sicboResult}>{summary}</Text>
        <Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton,selectedBet>coins&&styles.disabledCard]} onPress={start}><Text style={styles.primaryButtonText}>{selectedBet>coins?'코인이 부족합니다':'다시 하기'}</Text></Pressable>
      </>}
    </>}
  </ScrollView></View>;
}

type PusherView={id:number;kind:PusherCoin['kind'];fromDepth:number;fromColumn:number;toDepth:number;toColumn:number;fate:'stay'|'won'|'lost'};
const pusherFrames=16, pusherFrameMs=28;

function CoinPusherGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:InstantSettle}){
  const [field,setField]=useState<PusherField|null>(null);
  const [lane,setLane]=useState(pusherCenterColumn);
  const [view,setView]=useState<PusherView[]>([]);
  const [progress,setProgress]=useState(1);
  const [tray,setTray]=useState<PusherCoin[]>([]);
  const [swallowed,setSwallowed]=useState(0);
  const [history,setHistory]=useState<number[]>([]);
  const busy=progress<1;

  const showField=(coins:PusherCoin[])=>setView(coins.map((coin)=>({id:coin.id,kind:coin.kind,fromDepth:coin.depth,fromColumn:coin.column,toDepth:coin.depth,toColumn:coin.column,fate:'stay'})));

  // 판은 실제 기계처럼 저장해 두고 이어서 씁니다.
  useEffect(()=>{
    let alive=true;
    const use=(next:PusherField)=>{if(!alive)return;setField(next);showField(next.coins);};
    AsyncStorage.getItem(STORAGE_KEYS.pusherField).then((raw)=>{
      if(raw){
        try{
          const parsed=JSON.parse(raw);
          if(parsed&&Array.isArray(parsed.coins)&&typeof parsed.nextId==='number'&&parsed.coins.every((c:PusherCoin)=>typeof c.column==='number')){use(parsed);return;}
        }catch{}
      }
      use(createPusherField());
    }).catch(()=>use(createPusherField()));
    return()=>{alive=false;};
  },[]);

  // 밀리는 동안 한 칸씩 그림을 옮깁니다.
  useEffect(()=>{
    if(progress>=1)return;
    const timer=setTimeout(()=>setProgress((current)=>Math.min(1,current+1/pusherFrames)),pusherFrameMs);
    return()=>clearTimeout(timer);
  },[progress]);

  const drop=()=>{
    if(!field||busy||selectedBet>coins)return;
    if(!onPlaceBet(selectedBet))return;
    const push=dropPusherCoin(field,lane);
    const previous=new Map(field.coins.map((coin)=>[coin.id,coin]));
    previous.set(push.dropped.id,{...push.dropped,depth:-0.06});   // 위에서 떨어지는 것처럼 보이게 합니다
    const make=(coin:PusherCoin,fate:PusherView['fate'],toDepth:number):PusherView=>{
      const start=previous.get(coin.id)??coin;
      return {id:coin.id,kind:coin.kind,fromDepth:start.depth,fromColumn:start.column,toDepth,toColumn:coin.column,fate};
    };
    setView([
      ...push.field.coins.map((coin)=>make(coin,'stay',coin.depth)),
      ...push.won.map((coin)=>make(coin,'won',1.14)),
      ...push.lost.map((coin)=>make(coin,'lost',coin.depth)),
    ]);
    setProgress(0);
    setField(push.field);
    setTray(push.won);
    setSwallowed(push.lost.length);
    setHistory((current)=>[push.won.length,...current].slice(0,10));
    AsyncStorage.setItem(STORAGE_KEYS.pusherField,JSON.stringify(push.field)).catch(()=>{});
    const gold=push.won.filter((coin)=>coin.kind==='금화').length;
    const detail=push.won.length===0?`${lane+1}번 줄에 넣음 · 넘어온 것 없음 · 판에 ${push.field.coins.length}개`
      :`${lane+1}번 줄에 넣어 ${push.won.length}개 획득${gold?` (금화 ${gold})`:''} · 판에 ${push.field.coins.length}개`;
    onSettle(selectedBet,push.multiplier,detail);
  };

  const eased=progress<1?1-(1-progress)*(1-progress):1;   // 밀판이 처음에 빠르고 끝에서 느려집니다
  const gained=tray.reduce((sum,coin)=>sum+pusherPayout(coin.kind),0);

  return <View style={styles.pusherScreen}><ScreenHeader title="코인 푸셔(Coin Pusher)" onBack={onBack}/><ScrollView contentContainerStyle={styles.sicboPage} showsVerticalScrollIndicator={false}>
    <View style={styles.rouletteStatusRow}><View><Text style={styles.eyebrow}>COIN PUSHER · 금화 {pusherGoldPayout}배 · 구슬 {pusherBallPayout}배 · 금괴 {pusherBarPayout}배</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View><View style={styles.difficultyBadge}><Text style={styles.difficultyBadgeText}>{field?`판에 ${field.coins.length}개`:'기계 여는 중'}</Text></View></View>

    <Text style={styles.sectionTitle}>넣을 줄 고르기</Text>
    <View style={styles.pusherLaneRow}>{Array.from({length:pusherColumns},(_,column)=><Pressable key={column} disabled={busy} onPress={()=>setLane(column)} style={[styles.pusherLane,lane===column&&styles.pusherLaneActive]}>
      <Text style={[styles.pusherLaneText,lane===column&&styles.pusherLaneTextActive]}>{column+1}</Text>
    </Pressable>)}</View>

    <View style={styles.pusherCabinet}>
      <View style={[styles.pusherPlate,busy&&{transform:[{translateY:Math.sin(eased*Math.PI)*7}]}]}><Text style={styles.pusherPlateText}>밀판</Text></View>
      <View style={styles.pusherBed}>
        <View style={[styles.pusherWallEnd,{top:`${pusherChuteStart*100}%`}]}/>
        <View style={[styles.pusherAimLine,{left:`${(lane+0.5)/pusherColumns*100}%`}]}/>
        {view.map((item)=>{
          const depth=item.fromDepth+(item.toDepth-item.fromDepth)*eased;
          const column=item.fromColumn+(item.toColumn-item.fromColumn)*eased;
          const opacity=item.fate==='lost'?1-eased:1;
          const shape=item.kind==='금화'?styles.pusherGold:item.kind==='구슬'?styles.pusherBall:item.kind==='금괴'?styles.pusherBar:null;
          return <View key={item.id} style={[styles.pusherCoin,shape,{top:`${depth*100}%`,left:`${(column+0.5)/pusherColumns*100}%`,opacity,zIndex:Math.round(depth*200)}]}>
            {(item.kind==='금화'||item.kind==='금괴')&&<Text style={styles.pusherGoldMark}>金</Text>}
          </View>;
        })}
      </View>
      <View style={styles.pusherLip}><Text style={styles.pusherLipText}>앞턱</Text></View>
      <View style={styles.pusherTray}>
        {tray.length>0?tray.map((coin)=><View key={`tray-${coin.id}`} style={[styles.pusherCoin,styles.pusherCoinTray,coin.kind==='금화'&&styles.pusherGold,coin.kind==='구슬'&&styles.pusherBall,coin.kind==='금괴'&&styles.pusherBar]}>{(coin.kind==='금화'||coin.kind==='금괴')&&<Text style={styles.pusherGoldMark}>金</Text>}</View>)
          :<Text style={styles.pusherTrayEmpty}>{field?'받침대가 비었습니다':''}</Text>}
      </View>
    </View>

    {tray.length>0?<Text style={styles.pusherPayout}>{tray.length}개 · {Math.round(selectedBet*gained).toLocaleString()} WC</Text>
      :<Text style={styles.tujeonAdvice}>{swallowed>0?`${swallowed}개가 앞쪽 구멍에 빠졌습니다`:'줄을 고르고 동전을 넣으세요'}</Text>}

    {history.length>0&&<View style={styles.yutHistory}><Text style={styles.slotRulesTitle}>최근 나온 개수</Text><View style={styles.yutHistoryRow}>{history.map((count,index)=><Text key={index} style={[styles.yutHistoryChip,count>=2&&styles.yutHistoryChipRare]}>{count}</Text>)}</View></View>}

    <Pressable disabled={!field||busy||selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton,(!field||busy||selectedBet>coins)&&styles.disabledCard]} onPress={drop}>
      <Text style={styles.primaryButtonText}>{selectedBet>coins?'코인이 부족합니다':`${lane+1}번 줄에 ${selectedBet.toLocaleString()} WC 넣기`}</Text>
    </Pressable>
    <View style={styles.setupSummary}><Text style={styles.slotRulesTitle}>규칙</Text><Text style={styles.slotRuleText}>앞턱을 넘어간 동전 하나가 베팅금 1배입니다. 경품은 금화 {pusherGoldPayout}배, 구슬 {pusherBallPayout}배, 금괴 {pusherBarPayout}배이고 한 번 나가면 다시 채워지지 않습니다.</Text><Text style={styles.slotRuleText}>동전이 뭉친 줄일수록 한 번에 더 많이 밀립니다.</Text><Text style={styles.slotRuleText}>앞쪽 바닥 구멍은 어느 줄이든 똑같이 뚫려 있어, 어디에 넣어도 기댓값은 같습니다.</Text><Text style={styles.slotRuleText}>판은 그대로 남아 다음에 이어서 합니다.</Text></View>
  </ScrollView></View>;
}


const bigTwoPlayers=4;
const bigTwoSeatName=(index:number)=>index===0?'나':`컴퓨터 ${index}`;

function BigTwoGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:InstantSettle}){
  const [state,setState]=useState<BigTwoState|null>(null);
  const [picked,setPicked]=useState<string[]>([]);
  const settledRef=useRef(false);

  const start=()=>{
    if(selectedBet>coins||!onPlaceBet(selectedBet))return;
    settledRef.current=false;setPicked([]);setState(startBigTwo(bigTwoPlayers));
  };

  // 컴퓨터 차례는 한 박자 쉬고 저절로 넘어갑니다.
  useEffect(()=>{
    if(!state||state.winner!==null||state.turn===0)return;
    const timer=setTimeout(()=>setState(current=>(current&&current.winner===null&&current.turn!==0)?stepBigTwo(current):current),750);
    return()=>clearTimeout(timer);
  },[state]);

  useEffect(()=>{
    if(!state||state.winner===null||settledRef.current)return;
    settledRef.current=true;
    const won=state.winner===0,mine=state.hands[0].length;
    onSettle(selectedBet,bigTwoMultiplier(bigTwoPlayers,won,mine),won?'먼저 다 내려놓았습니다':`${bigTwoSeatName(state.winner)}가 먼저 냄 · 내 손에 ${mine}장`);
  },[state]);

  const myHand=state?state.hands[0]:[];
  const myTurn=!!state&&state.winner===null&&state.turn===0;
  const opening=state?bigTwoOpeningCard(state):undefined;
  const chosen=myHand.filter(card=>picked.includes(card.id));
  const combo=chosen.length?classifyBigTwo(chosen):null;
  const openingOk=!opening||chosen.some(card=>card.id===opening);
  const canPlay=myTurn&&!!combo&&canBeatBigTwo(combo,state!.current)&&openingOk;
  const canPass=myTurn&&!!state?.current;
  const stuck=myTurn&&legalBigTwoPlays(myHand,state!.current,opening).length===0;

  const toggle=(id:string)=>{if(!myTurn)return;setPicked(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);};
  const play=()=>{if(!state||!canPlay)return;setState(playBigTwo(state,chosen));setPicked([]);};
  const pass=()=>{if(!state||!canPass)return;setState(passBigTwo(state));setPicked([]);};
  const suggest=()=>{if(!state||!myTurn)return;const pick=chooseBigTwoPlay(myHand,state.current,opening);setPicked(pick?pick.cards.map(card=>card.id):[]);};

  const hint=!state?'':state.winner!==null?''
    :!myTurn?`${bigTwoSeatName(state.turn)} 차례입니다`
    :stuck?'낼 수 있는 게 없습니다. 넘기세요.'
    :opening?'첫 장에는 ♦3이 들어가야 합니다'
    :!chosen.length?state.current?`${state.current.type}보다 센 ${state.current.cards.length}장을 고르세요`:'아무거나 골라 내세요'
    :!combo?'낼 수 없는 모양입니다'
    :!canBeatBigTwo(combo,state.current)?`${combo.type}로는 앞사람을 이기지 못합니다`
    :`${combo.type} · 낼 수 있습니다`;

  const summary=!state||state.winner===null?'':state.winner===0
    ?`먼저 다 내려놓았습니다! ${Math.round(selectedBet*bigTwoWinPayout[bigTwoPlayers]).toLocaleString()} WC`
    :myHand.length<=3?`${bigTwoSeatName(state.winner)}가 먼저 냈지만 ${myHand.length}장만 남아 절반을 돌려받았습니다`
    :`${bigTwoSeatName(state.winner)}가 먼저 냈습니다 · 내 손에 ${myHand.length}장`;

  return <View style={styles.pokerTable}><ScreenHeader title="빅투(Big Two)" onBack={onBack}/><ScrollView contentContainerStyle={styles.pokerPage} showsVerticalScrollIndicator={false}>
    <View style={styles.rouletteStatusRow}><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text><Text style={styles.difficultyBadgeText}>BET {selectedBet.toLocaleString()} WC</Text></View>
    {!state?<>
      <View style={styles.holdemGuide}><Text style={styles.slotRulesTitle}>네 명이 열세 장씩</Text><Text style={styles.slotRuleText}>먼저 다 내려놓으면 이깁니다. 3이 가장 약하고 2가 가장 셉니다.</Text><Text style={styles.slotRuleText}>앞사람과 같은 장수로만, 더 세게 받아쳐야 합니다.</Text></View>
      <Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton,selectedBet>coins&&styles.disabledCard]} onPress={start}><Text style={styles.primaryButtonText}>{selectedBet>coins?'코인이 부족합니다':'판 시작'}</Text></Pressable>
    </>:<>
      <View style={styles.bigTwoSeats}>{[1,2,3].map(seat=><View key={seat} style={[styles.bigTwoSeat,state.turn===seat&&state.winner===null&&styles.bigTwoSeatActive,state.winner===seat&&styles.bigTwoSeatWon]}>
        <Text style={styles.bigTwoSeatName}>{bigTwoSeatName(seat)}</Text>
        <Text style={styles.bigTwoSeatCount}>{state.hands[seat].length}장</Text>
      </View>)}</View>

      <View style={styles.bigTwoTable}>
        <Text style={styles.bigTwoTableLabel}>{state.current?`바닥 · ${bigTwoSeatName(state.leader)}의 ${state.current.type}`:'바닥이 비었습니다'}</Text>
        <View style={styles.cardRow}>{state.current?state.current.cards.map(card=><PlayingCard key={card.id} card={card} compact/>):<Text style={styles.slotRuleText}>새로 시작하는 차례입니다</Text>}</View>
      </View>

      {state.log.length>0&&<View style={styles.bigTwoLog}>{state.log.slice(-3).map((line,index)=><Text key={index} style={styles.bigTwoLogLine}>{line}</Text>)}</View>}

      <Text style={styles.sectionTitle}>내 패 {myHand.length}장</Text>
      <View style={styles.chineseHandRow}>{myHand.map(card=><Pressable key={card.id} disabled={!myTurn} onPress={()=>toggle(card.id)}><PlayingCard card={card} compact emphasis={picked.includes(card.id)?'selected':undefined}/></Pressable>)}</View>

      {state.winner===null?<>
        <Text style={styles.tujeonAdvice}>{hint}</Text>
        <View style={styles.pokerActionRow}>
          <Pressable disabled={!myTurn} style={[styles.secondaryButton,!myTurn&&styles.disabledCard]} onPress={suggest}><Text style={styles.secondaryButtonText}>골라주기</Text></Pressable>
          <Pressable disabled={!canPass} style={[styles.secondaryButton,!canPass&&styles.disabledCard]} onPress={pass}><Text style={styles.secondaryButtonText}>넘기기</Text></Pressable>
          <Pressable disabled={!canPlay} style={[styles.primaryButton,styles.paiGowShowdownButton,!canPlay&&styles.disabledCard]} onPress={play}><Text style={styles.primaryButtonText}>내기</Text></Pressable>
        </View>
      </>:<>
        <Text style={styles.sicboResult}>{summary}</Text>
        <Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton,selectedBet>coins&&styles.disabledCard]} onPress={start}><Text style={styles.primaryButtonText}>{selectedBet>coins?'코인이 부족합니다':'다시 하기'}</Text></Pressable>
      </>}
    </>}
  </ScrollView></View>;
}

const tujeonSuitColors:Record<TujeonSuit,string>={사람:'#B4413F',물고기:'#2F6D8C',새:'#3E7F5C',꿩:'#8C5A2B',별:'#8A6BA8',말:'#A8722E',노루:'#5C6E3E',토끼:'#96566E'};

function TujeonCardView({card,hidden=false,emphasis}:{card:TujeonCard;hidden?:boolean;emphasis?:'winner'|'dim'}){
  if(hidden)return <View style={[styles.tujeonCard,styles.tujeonCardBack]}><Text style={styles.tujeonCardBackMark}>箋</Text></View>;
  return <View style={[styles.tujeonCard,emphasis==='winner'&&styles.cardWinner,emphasis==='dim'&&styles.cardDim]}>
    <View style={[styles.tujeonCardBand,{backgroundColor:tujeonSuitColors[card.suit]}]}><Text style={styles.tujeonCardMark}>{tujeonSuitMarks[card.suit]}</Text></View>
    <Text style={styles.tujeonCardNumber}>{card.number}</Text>
    <Text style={styles.tujeonCardSuit}>{card.suit}</Text>
  </View>;
}

function TujeonGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:InstantSettle}){
  const [round,setRound]=useState<{player:TujeonCard[];opponent:TujeonCard[]}|null>(null);
  const [outcome,setOutcome]=useState<ReturnType<typeof resolveTujeon>|null>(null);
  const [folded,setFolded]=useState(false);
  const start=()=>{
    if(selectedBet>coins||!onPlaceBet(selectedBet))return;
    setRound(dealTujeon());setOutcome(null);setFolded(false);
  };
  const myHand:TujeonHand|null=round?evaluateTujeon(round.player):null;
  const done=!!outcome||folded;
  const fold=()=>{
    if(!round||!myHand||done)return;
    setFolded(true);
    onSettle(selectedBet,tujeonFoldRefund,`${myHand.label}로 죽음 · ${Math.round(selectedBet*tujeonFoldRefund).toLocaleString()} WC 회수`);
  };
  const showdown=()=>{
    if(!round||!myHand||done)return;
    const resolved=resolveTujeon(round.player,round.opponent);
    setOutcome(resolved);
    onSettle(selectedBet,tujeonMultiplier(resolved.result),`${resolved.playerHand.label} 대 ${resolved.opponentHand.label} · ${resolved.result==='win'?'승':resolved.result==='push'?'무승부':'패'}`);
  };
  const summary=folded?`${myHand?.label}로 죽어 ${Math.round(selectedBet*tujeonFoldRefund).toLocaleString()} WC를 회수했습니다`
    :outcome?outcome.result==='win'?`${outcome.playerHand.label}로 이겨 ${Math.round(selectedBet*tujeonWinPayout).toLocaleString()} WC`
      :outcome.result==='push'?'같은 패라 베팅금을 돌려받았습니다'
      :`${outcome.opponentHand.label}에 졌습니다`
    :'';
  return <View style={styles.pokerTable}><ScreenHeader title={gameDisplayName('투전')} onBack={onBack}/><ScrollView contentContainerStyle={styles.pokerPage} showsVerticalScrollIndicator={false}>
    <View style={styles.rouletteStatusRow}><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text><Text style={styles.difficultyBadgeText}>BET {selectedBet.toLocaleString()} WC</Text></View>
    {!round?<>
      <View style={styles.holdemGuide}><Text style={styles.slotRulesTitle}>여든 장 투전목에서 다섯 장</Text><Text style={styles.slotRuleText}>같은 숫자가 몇 장 모였는지로 겨룹니다. 오동 · 사동 · 삼동 · 두동동 · 동동 순입니다.</Text><Text style={styles.slotRuleText}>짝이 없으면 다섯 장을 더한 끝자리가 끗이고 9가 가보, 0이 망통입니다.</Text></View>
      <Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton,selectedBet>coins&&styles.disabledCard]} onPress={start}><Text style={styles.primaryButtonText}>{selectedBet>coins?'코인이 부족합니다':'5장 받기'}</Text></Pressable>
    </>:<>
      <Text style={styles.pokerSeat}>상대 · {outcome?outcome.opponentHand.label:folded?'보지 않고 물러남':'승부 전 비공개'}</Text>
      <View style={styles.tujeonRow}>{round.opponent.map(card=><TujeonCardView key={card.id} card={card} hidden={!outcome} emphasis={outcome?(outcome.result==='loss'?'winner':'dim'):undefined}/>)}</View>
      <Text style={styles.sectionTitle}>내 패</Text>
      <View style={styles.tujeonRow}>{round.player.map(card=><TujeonCardView key={card.id} card={card} emphasis={outcome?(outcome.result==='win'?'winner':'dim'):undefined}/>)}</View>
      <Text style={styles.tujeonHandLabel}>{myHand?.label}</Text>
      {!done&&<Text style={styles.tujeonAdvice}>{myHand&&shouldFoldTujeon(myHand)?'끗이 낮습니다. 죽는 편이 나을 수 있습니다.':'해볼 만한 패입니다.'}</Text>}
      {!done?<View style={styles.pokerActionRow}>
        <Pressable style={styles.secondaryButton} onPress={fold}><Text style={styles.secondaryButtonText}>죽기 · {Math.round(selectedBet*tujeonFoldRefund).toLocaleString()} WC 회수</Text></Pressable>
        <Pressable style={[styles.primaryButton,styles.paiGowShowdownButton]} onPress={showdown}><Text style={styles.primaryButtonText}>승부 보기</Text></Pressable>
      </View>:<>
        <Text style={styles.sicboResult}>{summary}</Text>
        <Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton,selectedBet>coins&&styles.disabledCard]} onPress={start}><Text style={styles.primaryButtonText}>{selectedBet>coins?'코인이 부족합니다':'다시 하기'}</Text></Pressable>
      </>}
    </>}
  </ScrollView></View>;
}

const shellCupColors=['#B4552F','#2F6D8C','#6A4E8F'];
const fishName=(field:RaceFish[],id:number)=>{const fish=field.find(item=>item.id===id);return fish?`${fish.id}. ${fish.name}`:`${id}번`;};

function YutStickView({face,tumbling}:{face:YutFace;tumbling:boolean}){
  return <View style={[styles.yutStick,face==='배'?styles.yutStickFlat:styles.yutStickRound,tumbling&&styles.yutStickTumbling]}>
    {face==='배'&&<View style={styles.yutStickMark}/>}
    <Text style={[styles.yutStickFaceText,face==='배'?styles.yutStickFaceFlatText:styles.yutStickFaceRoundText]}>{face}</Text>
  </View>;
}

function YutBetGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:InstantSettle}){
  const [choice,setChoice]=useState<YutOutcome>('개');
  const [sticks,setSticks]=useState<YutFace[]>(['등','등','등','등']);
  const [outcome,setOutcome]=useState<YutOutcome|null>(null);
  const [throwing,setThrowing]=useState(false);
  const [history,setHistory]=useState<YutOutcome[]>([]);
  useEffect(()=>{
    if(!throwing)return;
    const spin=setInterval(()=>setSticks(throwYutSticks()),90);
    const stop=setTimeout(()=>{
      clearInterval(spin);
      const result=throwYut();
      setSticks(result.sticks);setOutcome(result.outcome);setThrowing(false);
      setHistory(current=>[result.outcome,...current].slice(0,12));
      onSettle(selectedBet,yutMultiplier(choice,result.outcome),`${choice}에 베팅 · ${result.outcome}(배 ${result.sticks.filter(face=>face==='배').length}개)`);
    },1000);
    return()=>{clearInterval(spin);clearTimeout(stop);};
  },[throwing]);
  const start=()=>{if(throwing||selectedBet>coins)return;if(!onPlaceBet(selectedBet))return;setOutcome(null);setThrowing(true);};
  const won=outcome!==null&&outcome===choice;
  return <View style={styles.yutScreen}><ScreenHeader title="윷 베팅" onBack={onBack}/><ScrollView contentContainerStyle={styles.sicboPage} showsVerticalScrollIndicator={false}>
    <View style={styles.rouletteStatusRow}><View><Text style={styles.eyebrow}>YUT · 도 개 걸 윷 모</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View><View style={styles.difficultyBadge}><Text style={styles.difficultyBadgeText}>{throwing?'윷을 던지는 중':outcome?`결과 ${outcome}`:'결과를 고르세요'}</Text></View></View>
    <View style={styles.yutMat}>
      <View style={styles.yutStickRow}>{sticks.map((face,index)=><YutStickView key={index} face={face} tumbling={throwing}/>)}</View>
      <Text style={[styles.yutOutcomeText,won&&styles.yutOutcomeWin]}>{throwing?'…':outcome??'준비'}</Text>
      <Text style={styles.yutOutcomeDetail}>{throwing?'윷가락이 구르는 중입니다':outcome?`배 ${sticks.filter(face=>face==='배').length}개 · ${won?`${yutPayout[choice]}배 적중`:'미적중'}`:'배가 위로 오는 개수로 결과가 정해집니다'}</Text>
    </View>
    <Text style={styles.sectionTitle}>결과 선택</Text>
    <View style={styles.yutChoiceGrid}>{yutOutcomes.map(item=><Pressable key={item} disabled={throwing} onPress={()=>setChoice(item)} style={[styles.yutChoice,choice===item&&styles.yutChoiceActive,outcome===item&&styles.yutChoiceHit]}>
      <Text style={styles.yutChoiceName}>{item}</Text>
      <Text style={styles.yutChoiceDetail}>{yutDescription[item]}</Text>
      <Text style={styles.yutChoiceOdds}>{yutPayout[item]}배</Text>
      <Text style={styles.yutChoiceChance}>{(yutProbability[item]*100).toFixed(1)}%</Text>
    </Pressable>)}</View>
    {history.length>0&&<View style={styles.yutHistory}><Text style={styles.slotRulesTitle}>최근 결과</Text><View style={styles.yutHistoryRow}>{history.map((item,index)=><Text key={index} style={[styles.yutHistoryChip,(item==='윷'||item==='모')&&styles.yutHistoryChipRare]}>{item}</Text>)}</View></View>}
    <Pressable disabled={throwing||selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton,(throwing||selectedBet>coins)&&styles.disabledCard]} onPress={start}><Text style={styles.primaryButtonText}>{selectedBet>coins?'코인이 부족합니다':`${choice}에 ${selectedBet.toLocaleString()} WC 던지기`}</Text></Pressable>
  </ScrollView></View>;
}

function ShellGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:InstantSettle}){
  const [round,setRound]=useState<ShellRound|null>(null);
  const [phase,setPhase]=useState<'ready'|'peek'|'shuffle'|'pick'|'done'>('ready');
  const [step,setStep]=useState(0);
  const [choice,setChoice]=useState<number|null>(null);
  const roundRef=useRef<ShellRound|null>(null);
  useEffect(()=>{
    if(phase!=='peek')return;
    const timer=setTimeout(()=>{setStep(0);setPhase('shuffle');},1400);
    return()=>clearTimeout(timer);
  },[phase]);
  useEffect(()=>{
    if(phase!=='shuffle'||!roundRef.current)return;
    const total=roundRef.current.swaps.length;
    if(step>=total){const timer=setTimeout(()=>setPhase('pick'),350);return()=>clearTimeout(timer);}
    const timer=setTimeout(()=>setStep(current=>current+1),330);
    return()=>clearTimeout(timer);
  },[phase,step]);
  const start=()=>{if(selectedBet>coins||!onPlaceBet(selectedBet))return;const next=createShellRound(8);roundRef.current=next;setRound(next);setChoice(null);setStep(0);setPhase('peek');};
  const pick=(position:number)=>{
    if(phase!=='pick'||!round)return;
    setChoice(position);setPhase('done');
    onSettle(selectedBet,shellMultiplier(position,round),`${position+1}번 자리 선택 · 공은 ${round.final+1}번`);
  };
  const layout=round?shellLayoutAfter(round,phase==='ready'||phase==='peek'?0:step):[0,1,2];
  const ballPosition=round?(phase==='ready'||phase==='peek'?round.start:round.final):-1;
  const showBall=phase==='peek'||phase==='done';
  const won=phase==='done'&&choice===round?.final;
  return <View style={styles.shellScreen}><ScreenHeader title="공 어디에?" onBack={onBack}/><ScrollView contentContainerStyle={styles.sicboPage} showsVerticalScrollIndicator={false}>
    <View style={styles.rouletteStatusRow}><View><Text style={styles.eyebrow}>SHELL GAME · 3 CUPS</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View><View style={styles.difficultyBadge}><Text style={styles.difficultyBadgeText}>{phase==='ready'?'대기 중':phase==='peek'?'공 위치 공개':phase==='shuffle'?`섞는 중 ${step}/${round?.swaps.length??0}`:phase==='pick'?'컵을 고르세요':won?'적중':'미적중'}</Text></View></View>
    <View style={styles.shellTable}>
      <View style={styles.shellCupRow}>{[0,1,2].map(position=>{
        const cup=layout[position],hasBall=showBall&&ballPosition===position;
        return <Pressable key={position} disabled={phase!=='pick'} onPress={()=>pick(position)} style={[styles.shellCupSlot,phase==='pick'&&styles.shellCupSlotPickable,choice===position&&styles.shellCupSlotChosen]}>
          <View style={[styles.shellCup,{backgroundColor:shellCupColors[cup]},hasBall&&styles.shellCupLifted]}><Text style={styles.shellCupLabel}>{position+1}</Text></View>
          <View style={styles.shellBallSlot}>{hasBall?<View style={styles.shellBall}/>:<View style={styles.shellBallShadow}/>}</View>
        </Pressable>;
      })}</View>
      <Text style={styles.shellHint}>{phase==='ready'?'게임을 시작하면 공이 든 컵을 먼저 보여줍니다':phase==='peek'?'이 컵에 공이 들어 있습니다':phase==='shuffle'?'컵의 움직임을 끝까지 따라가세요':phase==='pick'?'공이 들어 있다고 생각하는 컵을 누르세요':won?`${shellPayout}배 적중! ${(selectedBet*shellPayout).toLocaleString()} WC`:`공은 ${(round?.final??0)+1}번 자리에 있었습니다`}</Text>
    </View>
    <View style={styles.setupSummary}><Text style={styles.slotRulesTitle}>규칙</Text><Text style={styles.slotRuleText}>컵 세 개가 여덟 번 자리를 바꿉니다.</Text><Text style={styles.slotRuleText}>맞히면 베팅금의 {shellPayout}배를 돌려받습니다.</Text><Text style={styles.slotRuleText}>운이 아니라 눈으로 따라가면 맞출 수 있습니다.</Text></View>
    {(phase==='ready'||phase==='done')&&<Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton,selectedBet>coins&&styles.disabledCard]} onPress={start}><Text style={styles.primaryButtonText}>{selectedBet>coins?'코인이 부족합니다':`${selectedBet.toLocaleString()} WC 걸고 시작`}</Text></Pressable>}
  </ScrollView></View>;
}

function FishRaceGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:InstantSettle}){
  const [field,setField]=useState<RaceFish[]>(()=>createFishField());
  const [selection,setSelection]=useState<number|null>(null);
  const [phase,setPhase]=useState<'betting'|'racing'|'finished'>('betting');
  const [race,setRace]=useState<FishRaceResult|null>(null);
  const [progress,setProgress]=useState(0);
  const [ticket,setTicket]=useState<FishTicket|null>(null);
  const settledRef=useRef(false);
  useEffect(()=>{if(phase!=='racing')return;const timer=setInterval(()=>setProgress(current=>Math.min(1,current+.022)),70);return()=>clearInterval(timer);},[phase]);
  useEffect(()=>{
    if(phase!=='racing'||progress<1||!race||!ticket||settledRef.current)return;
    settledRef.current=true;setPhase('finished');
    const won=ticket.selection===race.order[0];
    onSettle(ticket.stake,won?ticket.odds:0,`${fishName(field,ticket.selection)} 선택 · 우승 ${fishName(field,race.order[0])}`);
  },[phase,progress,race,ticket]);
  const start=()=>{
    if(!selection||selectedBet>coins||!onPlaceBet(selectedBet))return;
    const odds=field.find(fish=>fish.id===selection)?.odds??0;
    settledRef.current=false;setTicket({selection,stake:selectedBet,odds});setRace(simulateFishRace(field));setProgress(0);setPhase('racing');
  };
  const reset=()=>{setField(createFishField());setSelection(null);setRace(null);setTicket(null);setProgress(0);settledRef.current=false;setPhase('betting');};
  const maxTime=race?Math.max(...Object.values(race.times)):1;
  const shownLap=Math.min(fishRaceLaps,Math.max(1,Math.ceil(progress*fishRaceLaps)));
  const lapEvents=race?race.events.filter(event=>event.lap===shownLap):[];
  return <View style={styles.fishScreen}><ScreenHeader title="피시 레이스" onBack={onBack}/><ScrollView contentContainerStyle={styles.horsePage} showsVerticalScrollIndicator={false}>
    <View style={styles.rouletteStatusRow}><View><Text style={styles.eyebrow}>CORAL SPRINT · 6 LANES</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View><View style={styles.difficultyBadge}><Text style={styles.difficultyBadgeText}>{phase==='betting'?'베팅 접수 중':phase==='racing'?`${shownLap}구간 통과`:'경기 종료'}</Text></View></View>
    <View style={styles.fishTank}>{field.map(fish=>{
      const laneProgress=race?Math.min(1,progress*maxTime/race.times[fish.id]):0;
      const place=race?race.order.indexOf(fish.id):-1;
      const isMine=(ticket?.selection??selection)===fish.id;
      return <View key={fish.id} style={[styles.fishLane,isMine&&styles.racingChosenLane]}>
        <View style={[styles.fishBadge,{backgroundColor:fish.color}]}><Text style={styles.fishBadgeText}>{fish.id}</Text></View>
        <View style={styles.fishCourse}>
          <View style={styles.fishWeeds}><Text style={styles.fishWeedText}>🌿</Text><Text style={styles.fishWeedText}>🫧</Text><Text style={styles.fishWeedText}>🪨</Text></View>
          <View style={[styles.fishSwim,{width:`${Math.max(7,laneProgress*88)}%`}]}><Text style={styles.fishRunner}>{fish.emoji}</Text>{isMine&&<Text style={styles.racingTrackPick}>내 선택</Text>}</View>
          <View style={styles.fishFinish}/>
        </View>
        {phase==='finished'&&<Text style={styles.fishPlace}>{place+1}위</Text>}
      </View>;
    })}</View>
    {phase==='racing'&&lapEvents.length>0&&<View style={styles.fishEventPanel}><Text style={styles.fishEventTitle}>{shownLap}구간 상황</Text>{lapEvents.slice(0,3).map((event,index)=><Text key={index} style={styles.fishEventText}>{fishName(field,event.fish)} · {fishEventText[event.kind]}</Text>)}</View>}
    {phase==='betting'?<>
      <RacingPickBanner label={selection?`${fishName(field,selection)} · ${selectedBet.toLocaleString()} WC`:'아래에서 우승 물고기를 고르세요'} disabled={!selection||selectedBet>coins} onStart={start} startLabel="출발 신호"/>
      <Text style={styles.sectionTitle}>우승 물고기 선택</Text>
      <View style={styles.horseCards}>{field.map(fish=><Pressable key={fish.id} onPress={()=>setSelection(fish.id)} style={[styles.fishCard,selection===fish.id&&styles.fishCardActive]}>
        <View style={[styles.fishCardBadge,{backgroundColor:fish.color}]}><Text style={styles.fishCardEmoji}>{fish.emoji}</Text></View>
        <View style={styles.horseInfo}><Text style={styles.fishName}>{fish.id}. {fish.name}</Text><Text style={styles.fishStats}>속도 {fish.speed} · 민첩 {fish.agility} · 뒷심 {fish.stamina}</Text></View>
        <View><Text style={styles.fishOdds}>{fish.odds.toFixed(1)}배</Text>{selection===fish.id&&<Text style={styles.racingSelectedTag}>내 선택</Text>}</View>
      </Pressable>)}</View>
      <View style={styles.carTicket}><Text style={styles.horseTicketTitle}>우승 예측 티켓</Text><Text style={styles.carTicketText}>{selection?`${fishName(field,selection)} · ${selectedBet.toLocaleString()} WC`:'물고기 한 마리를 선택하세요'}</Text>{selection&&<Text style={styles.horseExpected}>적중 시 {Math.round(selectedBet*(field.find(fish=>fish.id===selection)?.odds??0)).toLocaleString()} WC</Text>}</View>
    </>:<View style={styles.carTicket}>
      <Text style={styles.horseTicketTitle}>{phase==='racing'?'수중 장애물 구간을 통과하는 중입니다':'피시 레이스 결과'}</Text>
      {phase==='finished'&&race&&ticket&&<>
        <Text style={styles.horsePodium}>🥇 {fishName(field,race.order[0])}　🥈 {fishName(field,race.order[1])}　🥉 {fishName(field,race.order[2])}</Text>
        <Text style={styles.horseExpected}>{ticket.selection===race.order[0]?`${Math.round(ticket.stake*ticket.odds).toLocaleString()} WC 적중!`:`${fishName(field,ticket.selection)} 미적중`}</Text>
        <Pressable style={[styles.primaryButton,styles.fullWidthButton]} onPress={reset}><Text style={styles.primaryButtonText}>다음 경주</Text></Pressable>
      </>}
    </View>}
  </ScrollView></View>;
}

function LuckyFishGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:InstantSettle}){
  const [choice,setChoice]=useState<number|null>(null);
  const [path,setPath]=useState<LuckyFishPath|null>(null);
  const [step,setStep]=useState(0);
  const [phase,setPhase]=useState<'betting'|'swimming'|'finished'>('betting');
  const pathRef=useRef<LuckyFishPath|null>(null);
  const choiceRef=useRef<number|null>(null);
  useEffect(()=>{
    if(phase!=='swimming'||!pathRef.current)return;
    if(step>=luckyFishForks){
      const current=pathRef.current,picked=choiceRef.current;
      const timer=setTimeout(()=>{
        setPhase('finished');
        if(picked!==null)onSettle(selectedBet,luckyFishMultiplier(picked,current),`${luckyFishCaves[picked].name} 선택 · 도착 ${luckyFishCaves[current.cave].name}`);
      },500);
      return()=>clearTimeout(timer);
    }
    const timer=setTimeout(()=>setStep(value=>value+1),520);
    return()=>clearTimeout(timer);
  },[phase,step]);
  const start=()=>{
    if(choice===null||selectedBet>coins||!onPlaceBet(selectedBet))return;
    const next=swimLuckyFish();pathRef.current=next;choiceRef.current=choice;setPath(next);setStep(0);setPhase('swimming');
  };
  const reset=()=>{setPath(null);pathRef.current=null;setStep(0);setChoice(null);choiceRef.current=null;setPhase('betting');};
  const offset=path?luckyFishOffset(path,step):.5;
  const won=phase==='finished'&&path!==null&&choice===path.cave;
  return <View style={styles.luckyFishScreen}><ScreenHeader title="행운의 물고기" onBack={onBack}/><ScrollView contentContainerStyle={styles.sicboPage} showsVerticalScrollIndicator={false}>
    <View style={styles.rouletteStatusRow}><View><Text style={styles.eyebrow}>LUCKY FISH · 6 CAVES</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View><View style={styles.difficultyBadge}><Text style={styles.difficultyBadgeText}>{phase==='betting'?'동굴을 고르세요':phase==='swimming'?`갈림길 ${Math.min(step+1,luckyFishForks)}/${luckyFishForks}`:won?'적중':'미적중'}</Text></View></View>
    <View style={styles.luckyReef}>
      <View style={[styles.luckyFishSwimmer,{left:`${(offset*(luckyFishCaveCount-1)+.5)*100/luckyFishCaveCount}%`,top:6+step*30}]}><Text style={styles.luckyFishEmoji}>🐠</Text></View>
      {Array.from({length:luckyFishForks},(_,level)=><View key={level} style={styles.luckyForkRow}>{Array.from({length:level+2},(_,branch)=><View key={branch} style={styles.luckyForkCell}><View style={[styles.luckyForkDot,phase!=='betting'&&step>level&&styles.luckyForkDotPassed]}/></View>)}</View>)}
      <View style={styles.luckyMouthRow}>{luckyFishCaves.map(cave=><View key={cave.id} style={styles.luckyForkCell}><View style={[styles.luckyMouth,{backgroundColor:cave.color},phase==='finished'&&path?.cave===cave.id&&styles.luckyMouthLanded]}><Text style={styles.luckyMouthText}>{cave.payout}</Text></View></View>)}</View>
      <Text style={styles.luckyReefHint}>{phase==='betting'?'물고기는 갈림길마다 좌우로 갈라집니다':phase==='swimming'?(path&&step>0?`${path.turns[step-1]}으로 꺾었습니다`:'출발합니다'):path?`${luckyFishCaves[path.cave].name}에 도착`:''}</Text>
    </View>
    <View style={styles.luckyCaveRow}>{luckyFishCaves.map(cave=><Pressable key={cave.id} disabled={phase!=='betting'} onPress={()=>setChoice(cave.id)} style={[styles.luckyCave,{borderColor:cave.color},choice===cave.id&&styles.luckyCaveActive,phase==='finished'&&path?.cave===cave.id&&styles.luckyCaveLanded]}>
      <View style={[styles.luckyCaveMouth,{backgroundColor:cave.color}]}/>
      <Text style={styles.luckyCaveName}>{cave.name}</Text>
      <Text style={styles.luckyCaveOdds}>{cave.payout}배</Text>
      <Text style={styles.luckyCaveChance}>{(luckyFishProbability(cave.id)*100).toFixed(1)}%</Text>
    </Pressable>)}</View>
    {phase==='finished'&&<View style={styles.carTicket}><Text style={styles.horseTicketTitle}>{won?'적중!':'다음 기회에'}</Text><Text style={styles.carTicketText}>{won&&choice!==null?`${luckyFishCaves[choice].payout}배 · ${(selectedBet*luckyFishCaves[choice].payout).toLocaleString()} WC`:path?`물고기는 ${luckyFishCaves[path.cave].name}으로 들어갔습니다`:''}</Text><Pressable style={[styles.primaryButton,styles.fullWidthButton]} onPress={reset}><Text style={styles.primaryButtonText}>다시 하기</Text></Pressable></View>}
    {phase==='betting'&&<Pressable disabled={choice===null||selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton,(choice===null||selectedBet>coins)&&styles.disabledCard]} onPress={start}><Text style={styles.primaryButtonText}>{selectedBet>coins?'코인이 부족합니다':choice===null?'동굴을 선택하세요':`${luckyFishCaves[choice].name}에 ${selectedBet.toLocaleString()} WC`}</Text></Pressable>}
  </ScrollView></View>;
}

function BullFigure({bull}:{bull:FightingBull}){return <View style={styles.bullFigure}><Text style={[styles.bullEmoji,{color:bull.color}]}>♉</Text><View style={[styles.bullBand,{backgroundColor:bull.color}]}><Text style={styles.bullBandText}>{bull.id}</Text></View></View>}

function RacingPickBanner({label,disabled,onStart,startLabel}:{label:string;disabled:boolean;onStart:()=>void;startLabel:string}){
  return <View style={styles.racingPickBanner}>
    <View style={styles.racingPickCopy}><Text style={styles.racingPickEyebrow}>내 선택</Text><Text style={styles.racingPickText}>{label}</Text></View>
    <Pressable disabled={disabled} style={[styles.racingStartButton,disabled&&styles.disabledCard]} onPress={onStart}><Text style={styles.racingStartButtonText}>{startLabel}</Text></Pressable>
  </View>;
}

function BullfightingGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:(ticket:BullTicket,result:BullTournamentResult)=>void}){
  const [bulls]=useState<FightingBull[]>(()=>createBullField()),[selection,setSelection]=useState<number|null>(null),[phase,setPhase]=useState<'betting'|'tournament'|'finished'>('betting'),[result,setResult]=useState<BullTournamentResult|null>(null),[ticket,setTicket]=useState<BullTicket|null>(null),[shown,setShown]=useState(0),[fightProgress,setFightProgress]=useState(0);
  const bullName=(id:number)=>bulls.find(bull=>bull.id===id)?.name??`${id}번`;
  const currentMatch=phase==='tournament'&&result?result.matches[shown]??null:null;
  useEffect(()=>{if(phase!=='tournament'||!result||shown>=result.matches.length)return;const timer=setInterval(()=>setFightProgress(current=>{if(current>=1){setShown(value=>Math.min(result.matches.length,value+1));return 0;}return Math.min(1,current+.045);}),90);return()=>clearInterval(timer);},[phase,result,shown]);
  useEffect(()=>{if(phase==='tournament'&&result&&ticket&&shown>=result.matches.length){setPhase('finished');onSettle(ticket,result);}},[phase,result,ticket,shown]);
  const start=()=>{const bull=bulls.find(item=>item.id===selection);if(!bull||!onPlaceBet(selectedBet))return;setTicket({selection:bull.id,stake:selectedBet,odds:bull.odds});setResult(simulateBullTournament(bulls));setShown(0);setFightProgress(0);setPhase('tournament');};
  const reset=()=>{setSelection(null);setResult(null);setTicket(null);setShown(0);setFightProgress(0);setPhase('betting');};
  const leftWinning=!!currentMatch&&currentMatch.winner===currentMatch.left;
  const push=(Math.sin(fightProgress*8*Math.PI)*3)+(fightProgress*(leftWinning?26:-26));
  const leftHealth=currentMatch?Math.max(currentMatch.winner===currentMatch.left?42:6,100-fightProgress*(currentMatch.winner===currentMatch.left?50:94)):100;
  const rightHealth=currentMatch?Math.max(currentMatch.winner===currentMatch.right?42:6,100-fightProgress*(currentMatch.winner===currentMatch.right?50:94)):100;
  return <View style={styles.bullScreen}><ScreenHeader title="청도 전통 소싸움장" onBack={onBack}/><ScrollView contentContainerStyle={styles.horsePage} showsVerticalScrollIndicator={false}>
    <View style={styles.rouletteStatusRow}><View><Text style={styles.eyebrow}>KOREAN BULL STRENGTH TOURNAMENT</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View><View style={styles.bullStatus}><Text style={styles.bullStatusText}>{phase==='betting'?'출전 준비':phase==='tournament'?'경기 진행 중':'우승 확정'}</Text></View></View>
    <View style={styles.bullArena}><View style={styles.bullArenaRing}><Text style={styles.bullArenaTitle}>{phase==='betting'?'전통 힘겨루기 대회':phase==='finished'&&result?`우승 · ${bullName(result.champion)}`:`${currentMatch?.round??'예선'} 진행 중`}</Text>{currentMatch?<><View style={styles.bullHealthRow}><View style={styles.bullHealthBox}><Text style={styles.bullHealthName}>{bullName(currentMatch.left)}</Text><View style={styles.bullHealthTrack}><View style={[styles.bullHealthFill,{width:`${leftHealth}%`}]} /></View></View><View style={styles.bullHealthBox}><Text style={styles.bullHealthName}>{bullName(currentMatch.right)}</Text><View style={styles.bullHealthTrack}><View style={[styles.bullHealthFill,{width:`${rightHealth}%`}]} /></View></View></View><View style={styles.bullFaceoff}><View style={{transform:[{translateX:push}]}}><Text style={[styles.bullFace,{transform:[{scaleX:-1}]}]}>🐂</Text></View><Text style={styles.bullImpact}>✦</Text><View style={{transform:[{translateX:push}]}}><Text style={styles.bullFace}>🐂</Text></View></View><Text style={styles.bullActionText}>{fightProgress<.35?'서로 힘을 재고 있습니다':fightProgress<.75?'뿔을 맞대고 밀어붙입니다!':'한쪽이 밀려나고 있습니다!'}</Text></>:<View style={styles.bullFaceoff}><Text style={[styles.bullFace,{transform:[{scaleX:-1}]}]}>🐂</Text><Text style={styles.bullVs}>힘겨루기</Text><Text style={styles.bullFace}>🐂</Text></View>}</View></View>
    {phase==='betting'?<><RacingPickBanner label={selection?`${bullName(selection)} · ${selectedBet.toLocaleString()} WC`:'아래에서 우승 소를 선택하세요'} disabled={!selection||selectedBet>coins} onStart={start} startLabel="대회 시작"/><Text style={styles.sectionTitle}>우승 소 선택</Text><View style={styles.bullGrid}>{bulls.map(bull=><Pressable key={bull.id} onPress={()=>setSelection(bull.id)} style={[styles.bullCard,selection===bull.id&&styles.bullCardActive]}><BullFigure bull={bull}/><View style={styles.bullCopy}><Text style={styles.bullName}>{bull.id}. {bull.name}</Text><Text style={styles.bullStats}>힘 {bull.power} · 지구력 {bull.endurance} · 투지 {bull.spirit}</Text><Text style={styles.bullOdds}>{bull.odds.toFixed(1)}배</Text></View>{selection===bull.id&&<Text style={styles.racingSelectedTag}>내 선택</Text>}{bull.id<=2&&<Text style={styles.bullSeed}>준결승 시드</Text>}</Pressable>)}</View><View style={styles.bullTicket}><Text style={styles.horseTicketTitle}>대회 우승 예측</Text><Text style={styles.carTicketText}>{selection?`${bullName(selection)} · ${selectedBet.toLocaleString()} WC`:'출전 소 한 마리를 선택하세요'}</Text></View></>:
    <View style={styles.bullBracket}><Text style={styles.horseTicketTitle}>{phase==='finished'?'토너먼트 결과':'경기 진행'}</Text>{result?.matches.slice(0,shown).map((match,index)=><View key={index} style={[styles.bullMatch,match.round==='결승'&&styles.bullFinal]}><Text style={styles.bullRound}>{match.round}</Text><Text style={styles.bullMatchText}>{bullName(match.left)} 대 {bullName(match.right)}</Text><Text style={styles.bullWinner}>승리 {bullName(match.winner)}</Text></View>)}{phase==='finished'&&result&&ticket&&<><Text style={styles.bullChampion}>🏆 {bullName(result.champion)} 우승</Text><Text style={styles.horseExpected}>{bullTicketPayout(ticket,result)>0?`${bullTicketPayout(ticket,result).toLocaleString()} WC 적중!`:`${bullName(ticket.selection)} 우승 예측 미적중`}</Text><Pressable style={[styles.primaryButton,styles.fullWidthButton]} onPress={reset}><Text style={styles.primaryButtonText}>다음 대회</Text></Pressable></>}</View>}
  </ScrollView></View>;
}

function FormulaCar({car,small=false}:{car:RaceCar;small?:boolean}){
  return <View style={[styles.formulaCar,small&&styles.formulaCarSmall]}>
    <View style={[styles.formulaRearWing,{backgroundColor:car.accent}]}/><View style={[styles.formulaWheel,styles.formulaWheelBack]}/>
    <View style={[styles.formulaBody,{backgroundColor:car.color}]}><View style={[styles.formulaCockpit,{borderBottomColor:car.accent}]}/><Text style={styles.formulaNumber}>{car.id}</Text></View>
    <View style={[styles.formulaNose,{borderLeftColor:car.color}]}/><View style={[styles.formulaFrontWing,{backgroundColor:car.accent}]}/><View style={[styles.formulaWheel,styles.formulaWheelFront]}/>
  </View>;
}

function CarRacingGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:(ticket:CarRaceTicket,result:CarRaceResult)=>void}){
  const [cars]=useState<RaceCar[]>(()=>createCarField()),[selection,setSelection]=useState<number|null>(null),[phase,setPhase]=useState<'betting'|'racing'|'finished'>('betting'),[race,setRace]=useState<CarRaceResult|null>(null),[ticket,setTicket]=useState<CarRaceTicket|null>(null),[progress,setProgress]=useState(0);
  const maxTime=race?Math.max(...Object.values(race.times)):1;
  useEffect(()=>{if(phase!=='racing')return;const timer=setInterval(()=>setProgress(current=>Math.min(1,current+.023)),80);return()=>clearInterval(timer);},[phase]);
  useEffect(()=>{if(phase==='racing'&&progress>=1&&ticket&&race){setPhase('finished');onSettle(ticket,race);}},[phase,progress,ticket,race]);
  const start=()=>{const car=cars.find(item=>item.id===selection);if(!car||!onPlaceBet(selectedBet))return;const nextTicket={selection:car.id,stake:selectedBet,odds:car.odds},nextRace=simulateCarRace(cars);setTicket(nextTicket);setRace(nextRace);setProgress(0);setPhase('racing');};
  const reset=()=>{setSelection(null);setRace(null);setTicket(null);setProgress(0);setPhase('betting');};
  const carName=(id:number)=>cars.find(car=>car.id===id)?.koreanName??`${id}번`;
  return <View style={styles.carRaceScreen}><ScreenHeader title="월드 포뮬러 서킷" onBack={onBack}/><ScrollView contentContainerStyle={styles.horsePage} showsVerticalScrollIndicator={false}>
    <View style={styles.rouletteStatusRow}><View><Text style={styles.eyebrow}>WORLD GRAND PRIX · 6 CARS</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View><View style={styles.carStatus}><Text style={styles.carStatusText}>{phase==='betting'?'출발 준비':phase==='racing'?(progress>.5?'마지막 구간':'레이스 중'):'레이스 종료'}</Text></View></View>
    <View style={styles.carTrack}>{cars.map(car=>{const laneProgress=race?Math.min(1,progress*maxTime/race.times[car.id]):0,place=race?.order.indexOf(car.id)??-1,isMine=(ticket?.selection??selection)===car.id;return <View key={car.id} style={[styles.carLane,isMine&&styles.racingChosenLane]}><View style={styles.carLaneBadge}><Text style={styles.carLaneNumber}>{car.id}</Text></View><View style={styles.carLaneCourse}><View style={[styles.carDistance,{width:`${Math.max(10,laneProgress*84)}%`,transform:[{translateY:phase==='racing'?Math.sin((progress*40)+(car.id*1.7))*2:0}]}]}><FormulaCar car={car} small/>{isMine&&<Text style={styles.racingTrackPick}>내 차</Text>}</View><View style={styles.carFinishLine}/></View>{phase==='finished'&&<Text style={styles.carPlace}>{place+1}위</Text>}</View>})}</View>
    {phase==='racing'&&race&&progress>.48&&<View style={styles.carLivePanel}><Text style={styles.carLiveTitle}>중간 순위</Text><Text style={styles.carLiveText}>{race.midRaceOrder.slice(0,3).map(carName).join(' → ')}</Text></View>}
    {phase==='betting'?<><RacingPickBanner label={selection?`${carName(selection)} · ${selectedBet.toLocaleString()} WC`:'아래에서 우승 차량을 선택하세요'} disabled={!selection||selectedBet>coins} onStart={start} startLabel="레이스 시작"/><Text style={styles.sectionTitle}>우승 차량 선택</Text><View style={styles.carGrid}>{cars.map(car=><Pressable key={car.id} onPress={()=>setSelection(car.id)} style={[styles.carCard,selection===car.id&&styles.carCardActive]}><View style={[styles.carLogoPlate,{borderColor:car.accent}]}><Image source={carLogoSources[car.id]} style={styles.carLogo} resizeMode="contain"/></View><View style={styles.carCardCopy}><Text style={styles.carName}>{car.id}. {car.koreanName}</Text><Text style={styles.carStats}>속도 {car.speed} · 코너 {car.cornering} · 안정 {car.stability}</Text><Text style={styles.carOdds}>{car.odds.toFixed(1)}배</Text></View>{selection===car.id&&<Text style={styles.racingSelectedTag}>내 선택</Text>}<FormulaCar car={car}/></Pressable>)}</View><View style={styles.carTicket}><Text style={styles.horseTicketTitle}>우승 예측 티켓</Text><Text style={styles.carTicketText}>{selection?`${carName(selection)} · ${selectedBet.toLocaleString()} WC`:'차량 한 대를 선택하세요'}</Text>{selection&&<Text style={styles.horseExpected}>적중 시 {Math.round(selectedBet*(cars.find(car=>car.id===selection)?.odds??0)).toLocaleString()} WC</Text>}</View></>:
    <View style={styles.carResult}><Text style={styles.horseTicketTitle}>{phase==='racing'?'서킷을 질주하고 있습니다':'최종 결과'}</Text>{phase==='finished'&&race&&ticket&&<><Text style={styles.horsePodium}>🥇 {carName(race.order[0])}{'\n'}🥈 {carName(race.order[1])}　🥉 {carName(race.order[2])}</Text><Text style={styles.horseExpected}>{carTicketPayout(ticket,race)>0?`${carTicketPayout(ticket,race).toLocaleString()} WC 적중!`:`${carName(ticket.selection)} 우승 예측 미적중`}</Text><Pressable style={[styles.primaryButton,styles.fullWidthButton]} onPress={reset}><Text style={styles.primaryButtonText}>다음 레이스</Text></Pressable></>}</View>}
  </ScrollView></View>;
}

function HorseRacingGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:(ticket:HorseTicket,result:HorseRaceResult)=>void}){
  const [horses,setHorses]=useState<Horse[]>(()=>createHorseField());
  const [betType,setBetType]=useState<HorseBetType>('win');
  const [selections,setSelections]=useState<number[]>([]);
  const [phase,setPhase]=useState<'betting'|'racing'|'finished'>('betting');
  const [race,setRace]=useState<HorseRaceResult|null>(null);
  const [ticket,setTicket]=useState<HorseTicket|null>(null);
  const [progress,setProgress]=useState(0);
  const needed=requiredHorseSelections(betType),odds=horseTicketOdds(betType,selections,horses);
  useEffect(()=>{if(phase!=='racing')return;const timer=setInterval(()=>setProgress(current=>Math.min(1,current+.025)),80);return()=>clearInterval(timer);},[phase]);
  useEffect(()=>{if(phase==='racing'&&progress>=1&&ticket&&race){setPhase('finished');onSettle(ticket,race);}},[phase,progress,ticket,race]);
  const chooseType=(type:HorseBetType)=>{if(phase!=='betting')return;setBetType(type);setSelections([]);};
  const chooseHorse=(id:number)=>{if(phase!=='betting')return;setSelections(current=>current.includes(id)?current.filter(item=>item!==id):current.length<needed?[...current,id]:[id]);};
  const startRace=()=>{if(selections.length!==needed||!odds||!onPlaceBet(selectedBet))return;const nextTicket={type:betType,selections:[...selections],stake:selectedBet,odds},nextRace=simulateHorseRace(horses);setTicket(nextTicket);setRace(nextRace);setProgress(0);setPhase('racing');};
  const newRace=()=>{setHorses(createHorseField());setSelections([]);setRace(null);setTicket(null);setProgress(0);setPhase('betting');};
  const maxTime=race?Math.max(...Object.values(race.times)):1;
  return <View style={styles.horseScreen}><ScreenHeader title="월드 경마장" onBack={onBack}/><ScrollView contentContainerStyle={styles.horsePage} showsVerticalScrollIndicator={false}>
    <View style={styles.rouletteStatusRow}><View><Text style={styles.eyebrow}>SEOUL NIGHT RACE · 1,600M</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View><View style={styles.difficultyBadge}><Text style={styles.difficultyBadgeText}>{phase==='betting'?'마권 판매 중':phase==='racing'?'경주 진행 중':'경주 확정'}</Text></View></View>
    <View style={styles.horseTrack}>{horses.map(horse=>{const laneProgress=race?Math.min(1,progress*maxTime/race.times[horse.id]):0;const place=race?.order.indexOf(horse.id)??-1,isMine=(ticket?.selections??selections).includes(horse.id);return <View key={horse.id} style={[styles.horseLane,isMine&&styles.racingChosenLane]}><View style={styles.horseLaneNumber}><Text style={styles.horseLaneNumberText}>{horse.id}</Text></View><View style={styles.horseLaneCourse}><View style={[styles.horseDistance,{width:`${Math.max(5,laneProgress*88)}%`}]}><Text style={styles.horseRunner}>🏇</Text>{isMine&&<Text style={styles.racingTrackPick}>내 선택</Text>}</View><View style={styles.horseFinishLine}/></View>{phase==='finished'&&<Text style={styles.horsePlace}>{place+1}위</Text>}</View>;})}</View>
    {phase==='betting'?<><RacingPickBanner label={`${horseBetLabels[betType]} · ${selections.length?selections.join(' → '):'선택 대기'} · ${selectedBet.toLocaleString()} WC`} disabled={selections.length!==needed||selectedBet>coins} onStart={startRace} startLabel="경주 시작"/><Text style={styles.sectionTitle}>승식 선택</Text><View style={styles.horseBetTypeRow}>{(['win','place','quinella','exacta'] as HorseBetType[]).map(type=><Pressable key={type} onPress={()=>chooseType(type)} style={[styles.horseBetType,betType===type&&styles.horseBetTypeActive]}><Text style={styles.horseBetTypeTitle}>{horseBetLabels[type]}</Text><Text style={styles.horseBetTypeDetail}>{type==='win'?'1위':type==='place'?'3위 안':type==='quinella'?'1·2위 무순서':'1·2위 순서'}</Text></Pressable>)}</View>
    <Text style={styles.sectionTitle}>출전마 선택 · {selections.length}/{needed}</Text><View style={styles.horseCards}>{horses.map(horse=><Pressable key={horse.id} onPress={()=>chooseHorse(horse.id)} style={[styles.horseCard,selections.includes(horse.id)&&styles.horseCardActive]}><View style={[styles.horseNumberBadge,{backgroundColor:horse.color}]}><Text style={styles.horseNumberText}>{horse.id}</Text></View><View style={styles.horseInfo}><Text style={styles.horseName}>{horse.name}</Text><Text style={styles.horseStats}>속도 {horse.speed} · 지구력 {horse.stamina} · 컨디션 {horse.form}</Text></View><View><Text style={styles.horseOdds}>{betType==='place'?horse.placeOdds.toFixed(1):horse.winOdds.toFixed(1)}배</Text>{selections.includes(horse.id)&&<Text style={styles.horsePickOrder}>{selections.indexOf(horse.id)+1}번째</Text>}</View></Pressable>)}</View>
    <View style={styles.horseTicket}><Text style={styles.horseTicketTitle}>마권</Text><Text style={styles.slotRuleText}>{horseBetLabels[betType]} · {selections.length?selections.join(' → '):'말을 선택하세요'} · {selectedBet.toLocaleString()} WC</Text><Text style={styles.horseExpected}>{odds?`예상 배당 ${odds.toFixed(1)}배 · 적중 시 ${Math.round(selectedBet*odds).toLocaleString()} WC`:'선택을 완료하면 배당이 표시됩니다'}</Text></View></>:
    <View style={styles.horseResultPanel}><Text style={styles.horseTicketTitle}>{phase==='racing'?'결승선을 향해 달리고 있습니다':'경주 결과'}</Text>{phase==='finished'&&race&&ticket&&<><Text style={styles.horsePodium}>🥇 {race.order[0]}번 　🥈 {race.order[1]}번 　🥉 {race.order[2]}번</Text><Text style={styles.horseExpected}>{settleHorseTicket(ticket,race)>0?`${settleHorseTicket(ticket,race).toLocaleString()} WC 적중!`:`${horseBetLabels[ticket.type]} 마권 미적중`}</Text><Pressable style={[styles.primaryButton,styles.fullWidthButton]} onPress={newRace}><Text style={styles.primaryButtonText}>다음 경주</Text></Pressable></>}</View>}
  </ScrollView></View>;
}

function CycleRacingGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:(ticket:CycleTicket,result:CycleRaceResult)=>void}){
  const [riders,setRiders]=useState<Cyclist[]>(()=>createCycleField()),[betType,setBetType]=useState<CycleBetType>('win'),[selections,setSelections]=useState<number[]>([]),[phase,setPhase]=useState<'betting'|'racing'|'finished'>('betting'),[race,setRace]=useState<CycleRaceResult|null>(null),[ticket,setTicket]=useState<CycleTicket|null>(null),[progress,setProgress]=useState(0);
  const needed=requiredCycleSelections(betType),odds=cycleTicketOdds(betType,selections,riders);
  useEffect(()=>{if(phase!=='racing')return;const timer=setInterval(()=>setProgress(current=>Math.min(1,current+.022)),80);return()=>clearInterval(timer);},[phase]);
  useEffect(()=>{if(phase==='racing'&&progress>=1&&ticket&&race){setPhase('finished');onSettle(ticket,race);}},[phase,progress,ticket,race]);
  const chooseType=(type:CycleBetType)=>{if(phase==='betting'){setBetType(type);setSelections([]);}};
  const choose=(id:number)=>{if(phase!=='betting')return;setSelections(current=>current.includes(id)?current.filter(item=>item!==id):current.length<needed?[...current,id]:[id]);};
  const start=()=>{if(selections.length!==needed||!odds||!onPlaceBet(selectedBet))return;const nextTicket={type:betType,selections:[...selections],stake:selectedBet,odds},nextRace=simulateCycleRace(riders);setTicket(nextTicket);setRace(nextRace);setProgress(0);setPhase('racing');};
  const reset=()=>{setRiders(createCycleField());setSelections([]);setRace(null);setTicket(null);setProgress(0);setPhase('betting');};
  const maxTime=race?Math.max(...Object.values(race.times)):1;
  return <View style={styles.cycleScreen}><ScreenHeader title="월드 벨로드롬" onBack={onBack}/><ScrollView contentContainerStyle={styles.horsePage} showsVerticalScrollIndicator={false}>
    <View style={styles.rouletteStatusRow}><View><Text style={styles.eyebrow}>GWANGMYEONG · 7 RIDERS</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View><View style={styles.difficultyBadge}><Text style={styles.difficultyBadgeText}>{phase==='betting'?'경주권 판매 중':phase==='racing'?(progress>.68?'🔔 마지막 바퀴':'대열 주행 중'):'순위 확정'}</Text></View></View>
    <View style={styles.cycleTrack}>{riders.map(rider=>{const laneProgress=race?Math.min(1,progress*maxTime/race.times[rider.id]):0,place=race?.order.indexOf(rider.id)??-1,isMine=(ticket?.selections??selections).includes(rider.id);return <View key={rider.id} style={[styles.cycleLane,isMine&&styles.racingChosenLane]}><View style={[styles.cycleJersey,{backgroundColor:rider.color}]}><Text style={[styles.horseLaneNumberText,rider.id===2&&{color:'#FFF'}]}>{rider.id}</Text></View><View style={styles.horseLaneCourse}><View style={[styles.horseDistance,{width:`${Math.max(5,laneProgress*88)}%`}]}><Text style={styles.cycleRider}>🚴</Text>{isMine&&<Text style={styles.racingTrackPick}>내 선택</Text>}</View><View style={styles.horseFinishLine}/></View>{phase==='finished'&&<Text style={styles.horsePlace}>{place+1}위</Text>}</View>;})}</View>
    {phase==='racing'&&race&&progress>.68&&<View style={styles.cycleBell}><Text style={styles.cycleBellTitle}>🔔 마지막 바퀴 진입</Text><Text style={styles.slotRuleText}>현재 대열 {race.lastLapOrder.slice(0,4).join(' → ')} · 막판 추입이 시작됩니다</Text></View>}
    {phase==='betting'?<><RacingPickBanner label={`${cycleBetLabels[betType]} · ${selections.length?selections.join(' → '):'선택 대기'} · ${selectedBet.toLocaleString()} WC`} disabled={selections.length!==needed||selectedBet>coins} onStart={start} startLabel="출발"/><Text style={styles.sectionTitle}>승식 선택</Text><View style={styles.horseBetTypeRow}>{(['win','place','quinella','exacta'] as CycleBetType[]).map(type=><Pressable key={type} onPress={()=>chooseType(type)} style={[styles.horseBetType,betType===type&&styles.horseBetTypeActive]}><Text style={styles.horseBetTypeTitle}>{cycleBetLabels[type]}</Text><Text style={styles.horseBetTypeDetail}>{type==='win'?'1위':type==='place'?'2위 안':type==='quinella'?'1·2위 무순서':'1·2위 순서'}</Text></Pressable>)}</View>
    <Text style={styles.sectionTitle}>선수 선택 · {selections.length}/{needed}</Text><View style={styles.horseCards}>{riders.map(rider=><Pressable key={rider.id} onPress={()=>choose(rider.id)} style={[styles.horseCard,selections.includes(rider.id)&&styles.horseCardActive]}><View style={[styles.cycleJerseyLarge,{backgroundColor:rider.color}]}><Text style={[styles.horseNumberText,rider.id===1&&{color:'#111'}]}>{rider.id}</Text></View><View style={styles.horseInfo}><View style={styles.cycleNameRow}><Text style={styles.horseName}>{rider.name}</Text><Text style={styles.cycleStyle}>{rider.style}</Text></View><Text style={styles.horseStats}>스프린트 {rider.sprint} · 지구력 {rider.endurance} · 전술 {rider.tactics}</Text></View><View><Text style={styles.horseOdds}>{betType==='place'?rider.placeOdds.toFixed(1):rider.winOdds.toFixed(1)}배</Text>{selections.includes(rider.id)&&<Text style={styles.horsePickOrder}>{selections.indexOf(rider.id)+1}번째</Text>}</View></Pressable>)}</View>
    <View style={styles.cycleTicket}><Text style={styles.horseTicketTitle}>경주권</Text><Text style={styles.cycleTicketText}>{cycleBetLabels[betType]} · {selections.length?selections.join(' → '):'선수를 선택하세요'} · {selectedBet.toLocaleString()} WC</Text><Text style={styles.horseExpected}>{odds?`예상 배당 ${odds.toFixed(1)}배 · 적중 시 ${Math.round(selectedBet*odds).toLocaleString()} WC`:'선택을 완료하면 배당이 표시됩니다'}</Text></View></>:
    <View style={styles.horseResultPanel}><Text style={styles.horseTicketTitle}>{phase==='racing'?'경주가 진행 중입니다':'경륜 결과'}</Text>{phase==='finished'&&race&&ticket&&<><Text style={styles.horsePodium}>🥇 {race.order[0]}번　🥈 {race.order[1]}번　🥉 {race.order[2]}번</Text><Text style={styles.horseExpected}>{settleCycleTicket(ticket,race)>0?`${settleCycleTicket(ticket,race).toLocaleString()} WC 적중!`:`${cycleBetLabels[ticket.type]} 경주권 미적중`}</Text><Pressable style={[styles.primaryButton,styles.fullWidthButton]} onPress={reset}><Text style={styles.primaryButtonText}>다음 경주</Text></Pressable></>}</View>}
  </ScrollView></View>;
}

function BoatRacingGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:(ticket:BoatTicket,result:BoatRaceResult)=>void}){
  const [boats,setBoats]=useState<BoatRacer[]>(()=>createBoatField()),[betType,setBetType]=useState<BoatBetType>('win'),[selections,setSelections]=useState<number[]>([]),[phase,setPhase]=useState<'betting'|'racing'|'finished'>('betting'),[race,setRace]=useState<BoatRaceResult|null>(null),[ticket,setTicket]=useState<BoatTicket|null>(null),[progress,setProgress]=useState(0);
  const needed=requiredBoatSelections(betType),odds=boatTicketOdds(betType,selections,boats);
  useEffect(()=>{if(phase!=='racing')return;const timer=setInterval(()=>setProgress(current=>Math.min(1,current+.021)),80);return()=>clearInterval(timer);},[phase]);
  useEffect(()=>{if(phase==='racing'&&progress>=1&&ticket&&race){setPhase('finished');onSettle(ticket,race);}},[phase,progress,ticket,race]);
  const chooseType=(type:BoatBetType)=>{if(phase==='betting'){setBetType(type);setSelections([]);}};
  const choose=(id:number)=>{if(phase!=='betting')return;setSelections(current=>current.includes(id)?current.filter(item=>item!==id):current.length<needed?[...current,id]:[id]);};
  const start=()=>{if(selections.length!==needed||!odds||!onPlaceBet(selectedBet))return;const nextTicket={type:betType,selections:[...selections],stake:selectedBet,odds},nextRace=simulateBoatRace(boats);setTicket(nextTicket);setRace(nextRace);setProgress(0);setPhase('racing');};
  const reset=()=>{setBoats(createBoatField());setSelections([]);setRace(null);setTicket(null);setProgress(0);setPhase('betting');};
  const maxTime=race?Math.max(...Object.values(race.times)):1;
  return <View style={styles.boatScreen}><ScreenHeader title="월드 경정장" onBack={onBack}/><ScrollView contentContainerStyle={styles.horsePage} showsVerticalScrollIndicator={false}>
    <View style={styles.rouletteStatusRow}><View><Text style={styles.eyebrow}>MISARI WATER COURSE · 6 BOATS</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View><View style={styles.difficultyBadge}><Text style={styles.difficultyBadgeText}>{phase==='betting'?'승자투표권 판매 중':phase==='racing'?(progress>.43?'1마크 통과':'스타트 경합'):'순위 확정'}</Text></View></View>
    <View style={styles.boatCourse}>{boats.map(boat=>{const laneProgress=race?Math.min(1,progress*maxTime/race.times[boat.id]):0,place=race?.order.indexOf(boat.id)??-1,isMine=(ticket?.selections??selections).includes(boat.id);return <View key={boat.id} style={[styles.boatLane,isMine&&styles.racingChosenLane]}><View style={[styles.boatLaneBadge,{backgroundColor:boat.color}]}><Text style={[styles.horseLaneNumberText,{color:boat.textColor}]}>{boat.id}</Text></View><View style={styles.boatWater}><View style={[styles.horseDistance,{width:`${Math.max(7,laneProgress*88)}%`}]}><Text style={styles.boatWake}>≈≈<Text style={styles.boatRunner}>🚤</Text></Text>{isMine&&<Text style={styles.racingTrackPick}>내 선택</Text>}</View><View style={styles.boatFinishLine}/></View>{phase==='finished'&&<Text style={styles.boatPlace}>{place+1}위</Text>}</View>})}</View>
    {phase==='racing'&&race&&progress>.43&&<View style={styles.boatMarkPanel}><Text style={styles.boatMarkTitle}>⚑ 1마크 선회</Text><Text style={styles.boatMarkText}>선회 순서 {race.firstMarkOrder.slice(0,4).join(' → ')} · 이제 모터 직선 승부입니다</Text></View>}
    {phase==='betting'?<><RacingPickBanner label={`${boatBetLabels[betType]} · ${selections.length?selections.join(' → '):'선택 대기'} · ${selectedBet.toLocaleString()} WC`} disabled={selections.length!==needed||selectedBet>coins} onStart={start} startLabel="경주 시작"/><Text style={styles.sectionTitle}>승식 선택</Text><View style={styles.horseBetTypeRow}>{(['win','place','quinella','exacta'] as BoatBetType[]).map(type=><Pressable key={type} onPress={()=>chooseType(type)} style={[styles.horseBetType,betType===type&&styles.boatBetTypeActive]}><Text style={styles.horseBetTypeTitle}>{boatBetLabels[type]}</Text><Text style={styles.horseBetTypeDetail}>{type==='win'?'1위':type==='place'?'2위 안':type==='quinella'?'1·2위 무순서':'1·2위 순서'}</Text></Pressable>)}</View>
    <Text style={styles.sectionTitle}>보트 선택 · {selections.length}/{needed}</Text><View style={styles.horseCards}>{boats.map(boat=><Pressable key={boat.id} onPress={()=>choose(boat.id)} style={[styles.boatCard,selections.includes(boat.id)&&styles.boatCardActive]}><View style={[styles.boatLargeBadge,{backgroundColor:boat.color}]}><Text style={[styles.horseNumberText,{color:boat.textColor}]}>{boat.id}</Text></View><View style={styles.horseInfo}><View style={styles.cycleNameRow}><Text style={styles.boatName}>{boat.name}</Text><Text style={styles.boatStyle}>{boat.style}</Text></View><Text style={styles.boatStats}>스타트 {boat.start} · 선회 {boat.turn} · 모터 {boat.motor}</Text></View><View><Text style={styles.boatOdds}>{betType==='place'?boat.placeOdds.toFixed(1):boat.winOdds.toFixed(1)}배</Text>{selections.includes(boat.id)&&<Text style={styles.boatPickOrder}>{selections.indexOf(boat.id)+1}번째</Text>}</View></Pressable>)}</View>
    <View style={styles.boatTicket}><Text style={styles.horseTicketTitle}>승자투표권</Text><Text style={styles.boatTicketText}>{boatBetLabels[betType]} · {selections.length?selections.join(' → '):'보트를 선택하세요'} · {selectedBet.toLocaleString()} WC</Text><Text style={styles.horseExpected}>{odds?`예상 배당 ${odds.toFixed(1)}배 · 적중 시 ${Math.round(selectedBet*odds).toLocaleString()} WC`:'선택을 완료하면 배당이 표시됩니다'}</Text></View></>:
    <View style={styles.boatResultPanel}><Text style={styles.horseTicketTitle}>{phase==='racing'?'물보라를 가르며 질주 중입니다':'경정 결과'}</Text>{phase==='finished'&&race&&ticket&&<><Text style={styles.horsePodium}>🥇 {race.order[0]}번　🥈 {race.order[1]}번　🥉 {race.order[2]}번</Text><Text style={styles.horseExpected}>{settleBoatTicket(ticket,race)>0?`${settleBoatTicket(ticket,race).toLocaleString()} WC 적중!`:`${boatBetLabels[ticket.type]} 투표권 미적중`}</Text><Pressable style={[styles.primaryButton,styles.fullWidthButton]} onPress={reset}><Text style={styles.primaryButtonText}>다음 경주</Text></Pressable></>}</View>}
  </ScrollView></View>;
}

function GreyhoundRacingGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:(ticket:GreyhoundTicket,result:GreyhoundRaceResult)=>void}){
  const [dogs,setDogs]=useState<Greyhound[]>(()=>createGreyhoundField()),[betType,setBetType]=useState<GreyhoundBetType>('win'),[selections,setSelections]=useState<number[]>([]),[phase,setPhase]=useState<'betting'|'racing'|'finished'>('betting'),[race,setRace]=useState<GreyhoundRaceResult|null>(null),[ticket,setTicket]=useState<GreyhoundTicket|null>(null),[progress,setProgress]=useState(0);
  const needed=requiredGreyhoundSelections(betType),odds=greyhoundTicketOdds(betType,selections,dogs);
  useEffect(()=>{if(phase!=='racing')return;const timer=setInterval(()=>setProgress(current=>Math.min(1,current+.024)),75);return()=>clearInterval(timer);},[phase]);
  useEffect(()=>{if(phase==='racing'&&progress>=1&&ticket&&race){setPhase('finished');onSettle(ticket,race);}},[phase,progress,ticket,race]);
  const chooseType=(type:GreyhoundBetType)=>{if(phase==='betting'){setBetType(type);setSelections([]);}};
  const choose=(id:number)=>{if(phase!=='betting')return;setSelections(current=>current.includes(id)?current.filter(item=>item!==id):current.length<needed?[...current,id]:[id]);};
  const start=()=>{if(selections.length!==needed||!odds||!onPlaceBet(selectedBet))return;const nextTicket={type:betType,selections:[...selections],stake:selectedBet,odds},nextRace=simulateGreyhoundRace(dogs);setTicket(nextTicket);setRace(nextRace);setProgress(0);setPhase('racing');};
  const reset=()=>{setDogs(createGreyhoundField());setSelections([]);setRace(null);setTicket(null);setProgress(0);setPhase('betting');};
  const maxTime=race?Math.max(...Object.values(race.times)):1;
  return <View style={styles.greyhoundScreen}><ScreenHeader title="월드 그레이하운드 스타디움" onBack={onBack}/><ScrollView contentContainerStyle={styles.horsePage} showsVerticalScrollIndicator={false}>
    <View style={styles.rouletteStatusRow}><View><Text style={styles.eyebrow}>NIGHT SPRINT · 480M · 6 TRAPS</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View><View style={styles.difficultyBadge}><Text style={styles.difficultyBadgeText}>{phase==='betting'?'베팅 접수 중':phase==='racing'?(progress>.4?'첫 코너 통과':'트랩 오픈'):'공식 순위'}</Text></View></View>
    <View style={styles.greyhoundTrack}>{dogs.map(dog=>{const laneProgress=race?Math.min(1,progress*maxTime/race.times[dog.id]):0,place=race?.order.indexOf(dog.id)??-1,isMine=(ticket?.selections??selections).includes(dog.id);return <View key={dog.id} style={[styles.greyhoundLane,isMine&&styles.racingChosenLane]}><View style={[styles.greyhoundTrap,{backgroundColor:dog.vestColor}]}><Text style={[styles.horseLaneNumberText,{color:dog.textColor}]}>{dog.id}</Text></View><View style={styles.greyhoundCourse}><View style={[styles.horseDistance,{width:`${Math.max(6,laneProgress*88)}%`}]}><Text style={styles.greyhoundRunner}>🐕</Text>{isMine&&<Text style={styles.racingTrackPick}>내 선택</Text>}</View><View style={styles.greyhoundFinish}/></View>{phase==='finished'&&<Text style={styles.greyhoundPlace}>{place+1}위</Text>}</View>})}</View>
    {phase==='racing'&&race&&progress>.4&&<View style={styles.greyhoundBend}><Text style={styles.greyhoundBendTitle}>◖ 첫 코너 통과</Text><Text style={styles.greyhoundBendText}>현재 순서 {race.firstBendOrder.slice(0,4).join(' → ')} · 결승 직선 추격이 시작됩니다</Text></View>}
    {phase==='betting'?<><RacingPickBanner label={`${greyhoundBetLabels[betType]} · ${selections.length?selections.join(' → '):'선택 대기'} · ${selectedBet.toLocaleString()} WC`} disabled={selections.length!==needed||selectedBet>coins} onStart={start} startLabel="트랩 오픈"/><Text style={styles.sectionTitle}>승식 선택</Text><View style={styles.horseBetTypeRow}>{(['win','place','quinella','exacta'] as GreyhoundBetType[]).map(type=><Pressable key={type} onPress={()=>chooseType(type)} style={[styles.horseBetType,betType===type&&styles.greyhoundBetActive]}><Text style={styles.horseBetTypeTitle}>{greyhoundBetLabels[type]}</Text><Text style={styles.horseBetTypeDetail}>{type==='win'?'1위':type==='place'?'2위 안':type==='quinella'?'1·2위 무순서':'1·2위 순서'}</Text></Pressable>)}</View>
    <Text style={styles.sectionTitle}>출전견 선택 · {selections.length}/{needed}</Text><View style={styles.horseCards}>{dogs.map(dog=><Pressable key={dog.id} onPress={()=>choose(dog.id)} style={[styles.greyhoundCard,selections.includes(dog.id)&&styles.greyhoundCardActive]}><View style={[styles.greyhoundVest,{backgroundColor:dog.vestColor}]}><Text style={[styles.horseNumberText,{color:dog.textColor}]}>{dog.id}</Text></View><View style={styles.horseInfo}><View style={styles.cycleNameRow}><Text style={styles.greyhoundName}>{dog.name}</Text><Text style={styles.greyhoundLine}>{dog.line}</Text></View><Text style={styles.greyhoundStats}>출발 {dog.breakSpeed} · 코너 {dog.cornering} · 막판 {dog.finishSpeed}</Text></View><View><Text style={styles.greyhoundOdds}>{betType==='place'?dog.placeOdds.toFixed(1):dog.winOdds.toFixed(1)}배</Text>{selections.includes(dog.id)&&<Text style={styles.greyhoundPick}>{selections.indexOf(dog.id)+1}번째</Text>}</View></Pressable>)}</View>
    <View style={styles.greyhoundTicket}><Text style={styles.horseTicketTitle}>레이스 티켓</Text><Text style={styles.greyhoundTicketText}>{greyhoundBetLabels[betType]} · {selections.length?selections.join(' → '):'출전견을 선택하세요'} · {selectedBet.toLocaleString()} WC</Text><Text style={styles.horseExpected}>{odds?`예상 배당 ${odds.toFixed(1)}배 · 적중 시 ${Math.round(selectedBet*odds).toLocaleString()} WC`:'선택을 완료하면 배당이 표시됩니다'}</Text></View></>:
    <View style={styles.greyhoundResult}><Text style={styles.horseTicketTitle}>{phase==='racing'?'인공 토끼를 쫓아 질주 중입니다':'그레이하운드 결과'}</Text>{phase==='finished'&&race&&ticket&&<><Text style={styles.horsePodium}>🥇 {race.order[0]}번　🥈 {race.order[1]}번　🥉 {race.order[2]}번</Text><Text style={styles.horseExpected}>{settleGreyhoundTicket(ticket,race)>0?`${settleGreyhoundTicket(ticket,race).toLocaleString()} WC 적중!`:`${greyhoundBetLabels[ticket.type]} 티켓 미적중`}</Text><Pressable style={[styles.primaryButton,styles.fullWidthButton]} onPress={reset}><Text style={styles.primaryButtonText}>다음 레이스</Text></Pressable></>}</View>}
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
  return <View style={styles.detailScreen}><ScreenHeader title="파이브 카드 드로우(Five-card Draw) 준비" onBack={props.onBack}/><ScrollView {...useScrollMemory('FiveDrawSetupScreen')} contentContainerStyle={styles.detailPage}><View style={styles.holdemGuide}><Text style={styles.detailLead}>다섯 장을 한 번 교환해 완성하는 포커</Text><Text style={styles.slotRuleText}>나와 컴퓨터가 비공개 카드 5장씩을 받습니다.</Text><Text style={styles.slotRuleText}>남길 카드를 눌러 보관하고, 나머지 카드는 한 번만 교환합니다.</Text><Text style={styles.slotRuleText}>교환 뒤 체크·콜, 레이즈 또는 폴드를 선택하고 마지막에 족보를 비교합니다.</Text></View><Text style={styles.sectionTitle}>베팅 등급</Text><View style={styles.setupOptions}>{difficultyOptions.map((item)=><Pressable key={item.name} style={[styles.setupOption,props.difficulty===item.name&&styles.setupOptionActive]} onPress={()=>props.onDifficultyChange(item.name)}><Text style={[styles.setupOptionTitle,props.difficulty===item.name&&styles.setupOptionTitleActive]}>{betTierName(item.name)}</Text><Text style={styles.setupOptionRange}>{item.min.toLocaleString()}~{item.max.toLocaleString()} WC</Text></Pressable>)}</View><Text style={styles.sectionTitle}>시작 베팅</Text><View style={styles.betGrid}>{option.bets.map((amount,index)=><BetOptionCoin key={amount} amount={amount} level={index+1} selected={props.selectedBet===amount} disabled={amount>props.coins} onPress={()=>props.onBetChange(amount)}/>)}</View><Pressable disabled={props.selectedBet>props.coins} style={[styles.primaryButton,styles.fullWidthButton,props.selectedBet>props.coins&&styles.disabledCard]} onPress={props.onStart}><Text style={styles.primaryButtonText}>드로우 포커 시작</Text></Pressable></ScrollView></View>;
}

function FiveDrawGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:(mine:number,theirs:number,result:'win'|'loss'|'push',detail:string)=>void}) {
  // 실제 드로우 포커처럼 베팅이 두 번입니다. 교환 전(preBet) 한 번, 교환 후(bet) 한 번.
  const [phase,setPhase]=useState<'ready'|'preBet'|'draw'|'bet'|'result'>('ready');
  const [player,setPlayer]=useState<Card[]>([]);
  const [opponent,setOpponent]=useState<Card[]>([]);
  const [drawPile,setDrawPile]=useState<Card[]>([]);
  const [held,setHeld]=useState([false,false,false,false,false]);
  const [betting,setBetting]=useState<PokerBetting>({mine:0,theirs:0,raises:0});
  const [opponentExchanged,setOpponentExchanged]=useState(0);
  const [myExchanged,setMyExchanged]=useState(0);
  // 교환 단계를 실제로 지났는지. 교환 전에 끝난 판에서 '0장 교환'이 뜨면 안 됩니다.
  const [drawDone,setDrawDone]=useState(false);
  const [outcome,setOutcome]=useState('');
  const [opponentNote,setOpponentNote]=useState('');
  const [showdown,setShowdown]=useState<ReturnType<typeof resolveFiveCardDraw>|null>(null);

  const start=()=>{if(!onPlaceBet(selectedBet))return;const deal=dealFiveCardDraw();setPlayer(deal.player);setOpponent(deal.opponent);setDrawPile(deal.drawPile);setHeld([false,false,false,false,false]);setBetting({mine:selectedBet,theirs:selectedBet,raises:0});setOpponentExchanged(0);setMyExchanged(0);setDrawDone(false);setOutcome('교환 전 첫 베팅입니다');setOpponentNote('컴퓨터도 같은 금액을 냈습니다');setShowdown(null);setPhase('preBet');};

  const exchange=()=>{const mine=exchangeDrawCards(player,held,drawPile);const computerKeep=opponentKeepCards(opponent);const theirs=exchangeDrawCards(opponent,computerKeep,mine.drawPile);setPlayer(mine.hand);setOpponent(theirs.hand);setDrawPile(theirs.drawPile);setOpponentExchanged(theirs.exchanged);setMyExchanged(mine.exchanged);setDrawDone(true);setBetting((current)=>({...current,raises:0}));setOutcome(`나는 ${mine.exchanged}장 · 컴퓨터는 ${theirs.exchanged}장 교환`);setOpponentNote('교환 후 마지막 베팅입니다');setPhase('bet');};

  const settle=(current:PokerBetting,mineCards:Card[],theirCards:Card[])=>{
    const resolved=resolveFiveCardDraw(mineCards,theirCards);
    setShowdown(resolved);
    setOutcome(resolved.result==='win'?'내가 이겼습니다':resolved.result==='loss'?'컴퓨터가 이겼습니다':'무승부입니다');
    onSettle(current.mine,current.theirs,resolved.result,`${resolved.playerHand.label} vs ${resolved.opponentHand.label}`);
    setPhase('result');
  };

  const computerFolds=(current:PokerBetting)=>{
    setBetting(current);setOpponentNote('컴퓨터 폴드 — 팟을 가져갑니다');setOutcome('컴퓨터가 폴드했습니다');setShowdown(null);
    onSettle(current.mine,current.theirs,'win','컴퓨터 폴드 · 상대 패 비공개');setPhase('result');
  };

  const computerRaises=(current:PokerBetting,amount:number)=>{
    const next={mine:current.mine,theirs:current.mine+amount,raises:current.raises+1};
    setBetting(next);
    setOpponentNote(`컴퓨터 ${pokerActionLabel({kind:'raise',amount})} — 콜하려면 ${(next.theirs-next.mine).toLocaleString()} WC`);
  };

  /**
   * 교환 전 라운드. 아직 아무도 카드를 바꾸지 않았으니
   * 컴퓨터는 자기 다섯 장만 보고 무작위 상대와 비교합니다.
   */
  const computerPreDraw=(current:PokerBetting)=>{
    const equity=estimateDrawEquity({hole:opponent,trials:200});
    const action=decidePokerAction({equity,toCall:current.mine-current.theirs,pot:current.mine+current.theirs,raiseSize:selectedBet,canRaise:current.raises<MAX_RAISES_PER_STREET,street:0});
    if(action.kind==='fold'){computerFolds(current);return;}
    if(action.kind==='raise'){computerRaises(current,action.amount);return;}
    const next={mine:current.mine,theirs:current.mine,raises:0};
    setBetting(next);
    setOpponentNote(`컴퓨터 ${action.kind==='call'?`콜 ${(current.mine-current.theirs).toLocaleString()} WC`:'체크'} · 이제 카드를 교환하세요`);
    setPhase('draw');
  };

  /** 교환 후 라운드. 내가 몇 장을 바꿨는지까지 넣어 승률을 다시 잽니다. */
  const computerPostDraw=(current:PokerBetting)=>{
    const equity=estimateDrawEquity({hole:opponent,opponentDrawCount:myExchanged,trials:200});
    const action=decidePokerAction({equity,toCall:current.mine-current.theirs,pot:current.mine+current.theirs,raiseSize:selectedBet,canRaise:current.raises<MAX_RAISES_PER_STREET,street:3});
    if(action.kind==='fold'){computerFolds(current);return;}
    if(action.kind==='raise'){computerRaises(current,action.amount);return;}
    const next={mine:current.mine,theirs:current.mine,raises:0};
    setBetting(next);
    setOpponentNote(`컴퓨터 ${action.kind==='call'?`콜 ${(current.mine-current.theirs).toLocaleString()} WC`:'체크'}`);
    settle(next,player,opponent);
  };

  const toCall=Math.max(0,betting.theirs-betting.mine);
  const canAct=phase==='preBet'||phase==='bet';
  const respond=phase==='bet'?computerPostDraw:computerPreDraw;
  const fold=()=>{setOutcome('폴드 · 상대 카드는 공개하지 않습니다');setShowdown(null);onSettle(betting.mine,betting.theirs,'loss','상대 패 비공개 · 폴드');setPhase('result');};
  const callOrCheck=()=>{if(toCall>0&&!onPlaceBet(toCall))return;const next={...betting,mine:betting.mine+toCall};setBetting(next);respond(next);};
  const raise=()=>{const need=toCall+selectedBet;if(!onPlaceBet(need))return;const next={mine:betting.mine+need,theirs:betting.theirs,raises:betting.raises+1};setBetting(next);respond(next);};

  const emphasis=(card:Card,side:'player'|'opponent'):'winner'|'selected'|'dim'|undefined=>{if(!showdown)return undefined;const own=madeHandCards(side==='player'?showdown.playerHand:showdown.opponentHand);if(!own.some((used)=>used.id===card.id))return'dim';if(showdown.result==='push')return'selected';return(side==='player')===(showdown.result==='win')?'winner':'selected';};

  return <View style={styles.detailScreen}><ScreenHeader title="파이브 카드 드로우(Five-card Draw)" onBack={onBack}/><ScrollView contentContainerStyle={styles.holdemPage}><View style={[styles.holdemTable,styles.fiveDrawTable]}><Text style={styles.holdemSeat}>컴퓨터</Text><View style={styles.fiveDrawHand}>{opponent.map((card)=><PlayingCard key={card.id} card={card} compact hidden={!showdown} emphasis={emphasis(card,'opponent')}/>)}</View>{drawDone?<Text style={styles.sevenPokerHint}>컴퓨터가 {opponentExchanged}장 교환</Text>:phase==='result'?<Text style={styles.sevenPokerHint}>교환 전에 끝난 판입니다</Text>:null}<Text style={styles.holdemPot}>POT {(betting.mine+betting.theirs).toLocaleString()} WC</Text><Text style={styles.pokerContribution}>내가 낸 돈 {betting.mine.toLocaleString()} · 컴퓨터 {betting.theirs.toLocaleString()} WC</Text><Text style={styles.holdemSeat}>나</Text><View style={styles.fiveDrawHand}>{player.map((card,index)=><Pressable key={card.id} disabled={phase!=='draw'} onPress={()=>setHeld((current)=>current.map((value,i)=>i===index?!value:value))} style={[styles.videoPokerCardWrap,held[index]&&phase==='draw'&&styles.videoPokerHeld]}><PlayingCard card={card} compact emphasis={emphasis(card,'player')}/>{phase==='draw'?<Text style={[styles.videoPokerHoldLabel,held[index]&&styles.videoPokerHoldActive]}>{held[index]?'보관':'교환'}</Text>:null}</Pressable>)}</View>{opponentNote?<Text style={styles.pokerOpponentNote}>{opponentNote}</Text>:null}<Text style={styles.holdemOutcome}>{outcome||'카드 5장을 받아 시작하세요'}</Text>{showdown?<Text style={styles.pokerInlineResult}>내 패: {showdown.playerHand.label} · 상대 패: {showdown.opponentHand.label}</Text>:null}</View>{phase==='ready'||phase==='result'?<Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton]} onPress={start}><Text style={styles.primaryButtonText}>{phase==='result'?'다시 플레이':'카드 5장 받기'} · {selectedBet.toLocaleString()} WC</Text></Pressable>:phase==='draw'?<Pressable style={[styles.primaryButton,styles.fullWidthButton]} onPress={exchange}><Text style={styles.primaryButtonText}>선택 완료 · 카드 교환</Text></Pressable>:<View style={styles.holdemActions}><Pressable style={styles.holdemFold} onPress={fold}><Text style={styles.holdemActionText}>폴드</Text></Pressable><Pressable disabled={toCall>coins} style={[styles.holdemAction,toCall>coins&&styles.disabledCard]} onPress={callOrCheck}><Text style={styles.primaryButtonText}>{toCall>0?`콜 ${toCall.toLocaleString()}`:'체크'}</Text></Pressable><Pressable disabled={toCall+selectedBet>coins||betting.raises>=MAX_RAISES_PER_STREET} style={[styles.holdemAction,(toCall+selectedBet>coins||betting.raises>=MAX_RAISES_PER_STREET)&&styles.disabledCard]} onPress={raise}><Text style={styles.primaryButtonText}>레이즈 +{selectedBet.toLocaleString()}</Text></Pressable></View>}<Text style={styles.disclaimer}>{phase==='preBet'?'교환 전 첫 베팅 · 다음에 카드를 한 번 교환합니다':phase==='draw'?'남길 카드를 눌러 보관하세요 · 교환은 한 번':'상대 카드는 끝까지 승부했을 때만 공개됩니다'}{canAct&&betting.raises>=MAX_RAISES_PER_STREET?' · 이 라운드 레이즈 한도 도달':''}</Text></ScrollView></View>;
}

function SevenPokerSetupScreen(props: { coins:number; difficulty:string; selectedBet:number; onBack:()=>void; onDifficultyChange:(v:string)=>void; onBetChange:(v:number)=>void; onStart:()=>void }) {
  const option=difficultyOptions.find((item)=>item.name===props.difficulty)??difficultyOptions[2];
  return <View style={styles.detailScreen}><ScreenHeader title="세븐 포커(Seven-card Poker) 준비" onBack={props.onBack}/><ScrollView {...useScrollMemory('SevenPokerSetupScreen')} contentContainerStyle={styles.detailPage}><View style={styles.holdemGuide}><Text style={styles.detailLead}>공개 카드와 비공개 카드로 심리전</Text><Text style={styles.slotRuleText}>처음 3장을 받은 뒤 한 장씩 추가되어 총 7장을 받습니다.</Text><Text style={styles.slotRuleText}>상대의 공개 카드는 볼 수 있지만 비공개 카드는 마지막 승부에서 공개됩니다.</Text><Text style={styles.slotRuleText}>7장 중 가장 강한 5장으로 승패를 정하며, 결과에는 실제 족보 카드만 강조됩니다.</Text></View><Text style={styles.sectionTitle}>베팅 등급</Text><View style={styles.setupOptions}>{difficultyOptions.map((item)=><Pressable key={item.name} style={[styles.setupOption,props.difficulty===item.name&&styles.setupOptionActive]} onPress={()=>props.onDifficultyChange(item.name)}><Text style={[styles.setupOptionTitle,props.difficulty===item.name&&styles.setupOptionTitleActive]}>{betTierName(item.name)}</Text><Text style={styles.setupOptionRange}>{item.min.toLocaleString()}~{item.max.toLocaleString()} WC</Text></Pressable>)}</View><Text style={styles.sectionTitle}>시작 베팅</Text><View style={styles.betGrid}>{option.bets.map((amount,index)=><BetOptionCoin key={amount} amount={amount} level={index+1} selected={props.selectedBet===amount} disabled={amount>props.coins} onPress={()=>props.onBetChange(amount)}/>)}</View><Pressable disabled={props.selectedBet>props.coins} style={[styles.primaryButton,styles.fullWidthButton,props.selectedBet>props.coins&&styles.disabledCard]} onPress={props.onStart}><Text style={styles.primaryButtonText}>세븐 포커 시작</Text></Pressable></ScrollView></View>;
}

function SevenPokerGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:(mine:number,theirs:number,result:'win'|'loss'|'push',detail:string)=>void}) {
  const [round,setRound]=useState<ReturnType<typeof dealSevenPoker>|null>(null);
  const [stage,setStage]=useState(0);
  const [betting,setBetting]=useState<PokerBetting>({mine:0,theirs:0,raises:0});
  const [outcome,setOutcome]=useState('');
  const [opponentNote,setOpponentNote]=useState('');
  const [showdown,setShowdown]=useState<ReturnType<typeof resolveSevenPoker>|null>(null);
  const [foldedVisible,setFoldedVisible]=useState(0);

  const start=()=>{if(!onPlaceBet(selectedBet))return;setRound(dealSevenPoker());setStage(1);setBetting({mine:selectedBet,theirs:selectedBet,raises:0});setOutcome('');setOpponentNote('컴퓨터도 같은 금액을 냈습니다');setShowdown(null);setFoldedVisible(0);};

  const settle=(current:PokerBetting,active:ReturnType<typeof dealSevenPoker>)=>{
    const resolved=resolveSevenPoker(active.player,active.opponent);
    setShowdown(resolved);
    setOutcome(resolved.result==='win'?'내가 이겼습니다':resolved.result==='loss'?'컴퓨터가 이겼습니다':'무승부입니다');
    onSettle(current.mine,current.theirs,resolved.result,`${resolved.playerHand.label} vs ${resolved.opponentHand.label}`);
    setStage(5);
  };

  /**
   * 컴퓨터는 자기 손패 전부와 내 공개 카드(3~5번째)를 보고 승률을 잽니다.
   * 내 비공개 카드는 모르는 것으로 두고 무작위로 채워 계산합니다.
   */
  const computerTurn=(current:PokerBetting,street:number)=>{
    if(!round)return;
    const visible=street+2;
    const myOpen=round.player.slice(0,visible).filter((_,index)=>index>=2&&index!==6);
    const theirCards=round.opponent.slice(0,visible);
    const equity=estimateEquity({
      variant:'seven',
      hole:theirCards,
      holeToCome:7-theirCards.length,
      opponentKnown:myOpen,
      opponentHidden:7-myOpen.length,
      trials:160,
    });
    const action=decidePokerAction({equity,toCall:current.mine-current.theirs,pot:current.mine+current.theirs,raiseSize:selectedBet,canRaise:current.raises<MAX_RAISES_PER_STREET,street:street-1});
    if(action.kind==='fold'){
      setBetting(current);setOpponentNote('컴퓨터 폴드 — 팟을 가져갑니다');setOutcome('컴퓨터가 폴드했습니다');setShowdown(null);setFoldedVisible(visible);
      onSettle(current.mine,current.theirs,'win','컴퓨터 폴드 · 상대 패 비공개');setStage(5);return;
    }
    if(action.kind==='raise'){
      const next={mine:current.mine,theirs:current.mine+action.amount,raises:current.raises+1};
      setBetting(next);setOpponentNote(`컴퓨터 ${pokerActionLabel(action)} — 콜하려면 ${(next.theirs-next.mine).toLocaleString()} WC`);return;
    }
    const next={mine:current.mine,theirs:current.mine,raises:0};
    setBetting(next);
    setOpponentNote(`컴퓨터 ${action.kind==='call'?`콜 ${(current.mine-current.theirs).toLocaleString()} WC`:'체크'}`);
    if(street<4)setStage(street+1); else settle(next,round);
  };

  const toCall=Math.max(0,betting.theirs-betting.mine);
  const canAct=stage>=1&&stage<=4;
  const fold=()=>{if(!round)return;setFoldedVisible(stage+2);setOutcome('폴드 · 패배 · 상대 비공개 카드는 공개하지 않습니다');setShowdown(null);onSettle(betting.mine,betting.theirs,'loss','상대 패 비공개 · 중간 폴드');setStage(5);};
  const callOrCheck=()=>{if(!round)return;if(toCall>0&&!onPlaceBet(toCall))return;const next={...betting,mine:betting.mine+toCall};setBetting(next);computerTurn(next,stage);};
  const raise=()=>{if(!round)return;const need=toCall+selectedBet;if(!onPlaceBet(need))return;const next={mine:betting.mine+need,theirs:betting.theirs,raises:betting.raises+1};setBetting(next);computerTurn(next,stage);};

  const visible=stage===0?0:stage===5&&!showdown&&foldedVisible?foldedVisible:Math.min(7,stage+2);
  const emphasis=(card:Card,side:'player'|'opponent'):'winner'|'selected'|'dim'|undefined=>{if(!showdown)return undefined;const own=madeHandCards(side==='player'?showdown.playerHand:showdown.opponentHand);if(!own.some((used)=>used.id===card.id))return'dim';if(showdown.result==='push')return'selected';return(side==='player')===(showdown.result==='win')?'winner':'selected';};
  const cards=(side:'player'|'opponent')=>(round?.[side].slice(0,visible)??[]).map((card,index)=>{const privateCard=index<2||index===6;const label=privateCard?(side==='player'?'나만 보기':'비공개'):'모두 공개';return <View key={card.id} style={styles.sevenPokerCardSlot}><PlayingCard card={card} compact hidden={side==='opponent'&&!showdown&&privateCard} emphasis={emphasis(card,side)}/><Text style={[styles.sevenPokerVisibility,privateCard?styles.sevenPokerPrivate:styles.sevenPokerPublic]}>{label}</Text></View>;});

  return <View style={styles.detailScreen}><ScreenHeader title="세븐 포커(Seven-card Poker)" onBack={onBack}/><ScrollView contentContainerStyle={styles.holdemPage}><View style={[styles.holdemTable,styles.sevenPokerTable]}><Text style={styles.holdemSeat}>컴퓨터</Text><Text style={styles.sevenPokerHint}>{showdown?'모든 카드 공개':stage===5?'폴드 · 비공개 유지':'앞의 2장은 비공개'}</Text><View style={styles.sevenPokerCards}>{cards('opponent')}</View><Text style={styles.holdemPot}>POT {(betting.mine+betting.theirs).toLocaleString()} WC</Text><Text style={styles.pokerContribution}>내가 낸 돈 {betting.mine.toLocaleString()} · 컴퓨터 {betting.theirs.toLocaleString()} WC</Text><Text style={styles.holdemSeat}>나</Text><View style={styles.sevenPokerCards}>{cards('player')}</View>{opponentNote?<Text style={styles.pokerOpponentNote}>{opponentNote}</Text>:null}{outcome?<Text style={styles.holdemOutcome}>{outcome}</Text>:null}{showdown?<Text style={styles.pokerInlineResult}>내 패: {showdown.playerHand.label} · 상대 패: {showdown.opponentHand.label}</Text>:null}</View>{!canAct?<Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton]} onPress={start}><Text style={styles.primaryButtonText}>{stage===5?'다시 플레이':'처음 3장 받기'} · {selectedBet.toLocaleString()} WC</Text></Pressable>:<View style={styles.holdemActions}><Pressable style={styles.holdemFold} onPress={fold}><Text style={styles.holdemActionText}>폴드</Text></Pressable><Pressable disabled={toCall>coins} style={[styles.holdemAction,toCall>coins&&styles.disabledCard]} onPress={callOrCheck}><Text style={styles.primaryButtonText}>{toCall>0?`콜 ${toCall.toLocaleString()}`:'체크'}</Text></Pressable><Pressable disabled={toCall+selectedBet>coins||betting.raises>=MAX_RAISES_PER_STREET} style={[styles.holdemAction,(toCall+selectedBet>coins||betting.raises>=MAX_RAISES_PER_STREET)&&styles.disabledCard]} onPress={raise}><Text style={styles.primaryButtonText}>레이즈 +{selectedBet.toLocaleString()}</Text></Pressable></View>}<Text style={styles.disclaimer}>현재 단계: {['대기','첫 3장','네 번째 카드','다섯 번째 카드','여섯 번째 카드','마지막 승부'][stage]}{canAct&&betting.raises>=MAX_RAISES_PER_STREET?' · 이 라운드 레이즈 한도 도달':''}</Text></ScrollView></View>;
}

function HighLowSetupScreen(props: { coins:number; difficulty:string; selectedBet:number; onBack:()=>void; onDifficultyChange:(v:string)=>void; onBetChange:(v:number)=>void; onStart:()=>void }) {
  const option=difficultyOptions.find((item)=>item.name===props.difficulty)??difficultyOptions[2];
  return <View style={styles.detailScreen}><ScreenHeader title="하이로우(High–Low) 준비" onBack={props.onBack}/><ScrollView {...useScrollMemory('HighLowSetupScreen')} contentContainerStyle={styles.detailPage}><View style={styles.holdemGuide}><Text style={styles.detailLead}>높은 패와 낮은 패가 팟을 절반씩</Text><Text style={styles.slotRuleText}>각자 카드 7장을 받고 가장 강한 하이 족보와 가장 낮은 로우 족보를 동시에 만듭니다.</Text><Text style={styles.slotRuleText}>로우는 A를 1로 쓰며, 8 이하의 서로 다른 카드 5장이 있어야 합니다. 스트레이트와 플러시는 로우에서 불리하지 않습니다.</Text><Text style={styles.slotRuleText}>하이 승자가 팟의 절반, 로우 승자가 나머지 절반을 가져갑니다. 두 쪽을 모두 이기면 팟 전체를 가져갑니다.</Text></View><Text style={styles.sectionTitle}>베팅 등급</Text><View style={styles.setupOptions}>{difficultyOptions.map((item)=><Pressable key={item.name} style={[styles.setupOption,props.difficulty===item.name&&styles.setupOptionActive]} onPress={()=>props.onDifficultyChange(item.name)}><Text style={[styles.setupOptionTitle,props.difficulty===item.name&&styles.setupOptionTitleActive]}>{betTierName(item.name)}</Text><Text style={styles.setupOptionRange}>{item.min.toLocaleString()}~{item.max.toLocaleString()} WC</Text></Pressable>)}</View><Text style={styles.sectionTitle}>시작 베팅</Text><View style={styles.betGrid}>{option.bets.map((amount,index)=><BetOptionCoin key={amount} amount={amount} level={index+1} selected={props.selectedBet===amount} disabled={amount>props.coins} onPress={()=>props.onBetChange(amount)}/>)}</View><Pressable disabled={props.selectedBet>props.coins} style={[styles.primaryButton,styles.fullWidthButton,props.selectedBet>props.coins&&styles.disabledCard]} onPress={props.onStart}><Text style={styles.primaryButtonText}>하이로우 시작</Text></Pressable></ScrollView></View>;
}

function HighLowGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:(mine:number,theirs:number,share:number,detail:string)=>void}) {
  const [round,setRound]=useState<ReturnType<typeof dealHighLow>|null>(null);
  const [stage,setStage]=useState(0);
  const [betting,setBetting]=useState<PokerBetting>({mine:0,theirs:0,raises:0});
  const [showdown,setShowdown]=useState<ReturnType<typeof resolveHighLow>|null>(null);
  const [outcome,setOutcome]=useState('');
  const [opponentNote,setOpponentNote]=useState('');
  const [foldedVisible,setFoldedVisible]=useState(0);

  const start=()=>{if(!onPlaceBet(selectedBet))return;setRound(dealHighLow());setStage(1);setBetting({mine:selectedBet,theirs:selectedBet,raises:0});setShowdown(null);setOutcome('하이와 로우를 함께 노리세요');setOpponentNote('컴퓨터도 같은 금액을 냈습니다');setFoldedVisible(0);};

  const settle=(current:PokerBetting,active:ReturnType<typeof dealHighLow>)=>{
    const resolved=resolveHighLow(active.player,active.opponent);
    setShowdown(resolved);setStage(5);
    const label=resolved.share===1?'하이와 로우를 모두 이겼습니다':resolved.share===0.5?'팟을 절반 가져왔습니다':resolved.share===0?'하이와 로우 모두 졌습니다':`팟의 ${Math.round(resolved.share*100)}%를 가져왔습니다`;
    setOutcome(label);
    onSettle(current.mine,current.theirs,resolved.share,`하이 ${resolved.playerHigh.label} · 로우 ${resolved.playerLow?.label??'없음'}`);
  };

  /** 컴퓨터는 하이와 로우 양쪽 승률을 평균 낸 값으로 판단합니다. */
  const computerTurn=(current:PokerBetting,street:number)=>{
    if(!round)return;
    const visible=street+2;
    const myOpen=round.player.slice(0,visible).filter((_,index)=>index>=2&&index!==6);
    const theirCards=round.opponent.slice(0,visible);
    const equity=estimateEquity({variant:'highlow',hole:theirCards,holeToCome:7-theirCards.length,opponentKnown:myOpen,opponentHidden:7-myOpen.length,trials:120});
    const action=decidePokerAction({equity,toCall:current.mine-current.theirs,pot:current.mine+current.theirs,raiseSize:selectedBet,canRaise:current.raises<MAX_RAISES_PER_STREET,street:street-1});
    if(action.kind==='fold'){
      setBetting(current);setOpponentNote('컴퓨터 폴드 — 팟을 전부 가져갑니다');setOutcome('컴퓨터가 폴드했습니다');setShowdown(null);setFoldedVisible(visible);
      onSettle(current.mine,current.theirs,1,'컴퓨터 폴드 · 상대 패 비공개');setStage(5);return;
    }
    if(action.kind==='raise'){
      const next={mine:current.mine,theirs:current.mine+action.amount,raises:current.raises+1};
      setBetting(next);setOpponentNote(`컴퓨터 ${pokerActionLabel(action)} — 콜하려면 ${(next.theirs-next.mine).toLocaleString()} WC`);return;
    }
    const next={mine:current.mine,theirs:current.mine,raises:0};
    setBetting(next);
    setOpponentNote(`컴퓨터 ${action.kind==='call'?`콜 ${(current.mine-current.theirs).toLocaleString()} WC`:'체크'}`);
    if(street<4)setStage(street+1); else settle(next,round);
  };

  const toCall=Math.max(0,betting.theirs-betting.mine);
  const canAct=stage>=1&&stage<=4;
  const fold=()=>{if(!round)return;setFoldedVisible(stage+2);setStage(5);setOutcome('폴드 · 상대 비공개 카드는 공개하지 않습니다');onSettle(betting.mine,betting.theirs,0,'중간 폴드 · 상대 패 비공개');};
  const callOrCheck=()=>{if(!round)return;if(toCall>0&&!onPlaceBet(toCall))return;const next={...betting,mine:betting.mine+toCall};setBetting(next);computerTurn(next,stage);};
  const raise=()=>{if(!round)return;const need=toCall+selectedBet;if(!onPlaceBet(need))return;const next={mine:betting.mine+need,theirs:betting.theirs,raises:betting.raises+1};setBetting(next);computerTurn(next,stage);};

  const visible=stage===0?0:stage===5&&!showdown&&foldedVisible?foldedVisible:Math.min(7,stage+2);
  const cards=(side:'player'|'opponent')=>(round?.[side].slice(0,visible)??[]).map((card,index)=>{const privateCard=index<2||index===6;return <View key={card.id} style={styles.sevenPokerCardSlot}><PlayingCard card={card} compact hidden={side==='opponent'&&!showdown&&privateCard}/><Text style={[styles.sevenPokerVisibility,privateCard?styles.sevenPokerPrivate:styles.sevenPokerPublic]}>{privateCard?(side==='player'?'나만 보기':'비공개'):'모두 공개'}</Text></View>;});
  const winner=(side:'player'|'opponent',kind:'high'|'low')=>{if(!showdown)return'';const value=kind==='high'?showdown.highWinner:showdown.lowWinner;return value==='tie'?'무승부':value==='none'?'성립 없음':value===side?'승리':'패배';};

  return <View style={styles.detailScreen}><ScreenHeader title="하이로우(High–Low)" onBack={onBack}/><ScrollView contentContainerStyle={styles.holdemPage}><View style={[styles.holdemTable,styles.sevenPokerTable]}><Text style={styles.holdemSeat}>컴퓨터</Text><View style={styles.sevenPokerCards}>{cards('opponent')}</View><Text style={styles.holdemPot}>POT {(betting.mine+betting.theirs).toLocaleString()} WC</Text><Text style={styles.pokerContribution}>내가 낸 돈 {betting.mine.toLocaleString()} · 컴퓨터 {betting.theirs.toLocaleString()} WC</Text><Text style={styles.holdemSeat}>나</Text><View style={styles.sevenPokerCards}>{cards('player')}</View>{opponentNote?<Text style={styles.pokerOpponentNote}>{opponentNote}</Text>:null}<Text style={styles.holdemOutcome}>{outcome||'처음 3장을 받아 시작하세요'}</Text>{showdown?<View style={styles.highLowResultRow}><View style={styles.highLowResult}><Text style={styles.highLowResultTitle}>HIGH · {winner('player','high')}</Text><Text style={styles.slotRuleText}>나 {showdown.playerHigh.label}</Text><Text style={styles.slotRuleText}>상대 {showdown.opponentHigh.label}</Text></View><View style={styles.highLowResult}><Text style={styles.highLowResultTitle}>LOW · {winner('player','low')}</Text><Text style={styles.slotRuleText}>나 {showdown.playerLow?.label??'로우 없음'}</Text><Text style={styles.slotRuleText}>상대 {showdown.opponentLow?.label??'로우 없음'}</Text></View></View>:null}</View>{!canAct?<Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton]} onPress={start}><Text style={styles.primaryButtonText}>{stage===5?'다시 플레이':'처음 3장 받기'} · {selectedBet.toLocaleString()} WC</Text></Pressable>:<View style={styles.holdemActions}><Pressable style={styles.holdemFold} onPress={fold}><Text style={styles.holdemActionText}>폴드</Text></Pressable><Pressable disabled={toCall>coins} style={[styles.holdemAction,toCall>coins&&styles.disabledCard]} onPress={callOrCheck}><Text style={styles.primaryButtonText}>{toCall>0?`콜 ${toCall.toLocaleString()}`:'체크'}</Text></Pressable><Pressable disabled={toCall+selectedBet>coins||betting.raises>=MAX_RAISES_PER_STREET} style={[styles.holdemAction,(toCall+selectedBet>coins||betting.raises>=MAX_RAISES_PER_STREET)&&styles.disabledCard]} onPress={raise}><Text style={styles.primaryButtonText}>레이즈 +{selectedBet.toLocaleString()}</Text></Pressable></View>}<Text style={styles.disclaimer}>8 이하 로우 · 하이와 로우가 팟 절반씩 · 중간 폴드 시 상대 비공개 유지</Text></ScrollView></View>;
}

function PokerSetupScreen(props: { mode:'holdem'|'omaha'; coins:number; difficulty:string; selectedBet:number; onBack:()=>void; onDifficultyChange:(v:string)=>void; onBetChange:(v:number)=>void; onStart:()=>void }) {
  const option=difficultyOptions.find((item)=>item.name===props.difficulty)??difficultyOptions[2];
  const omaha=props.mode==='omaha'; return <View style={styles.detailScreen}><ScreenHeader title={omaha?'오마하(Omaha) 준비':'텍사스 홀덤(Texas Hold’em) 준비'} onBack={props.onBack}/><ScrollView {...useScrollMemory('PokerSetupScreen')} contentContainerStyle={styles.detailPage}><View style={styles.holdemGuide}><Text style={styles.detailLead}>{omaha?'네 장과 공용 카드로 승부':'두 장과 공용 카드로 승부'}</Text><Text style={styles.slotRuleText}>{omaha?'개인 카드 4장 중 정확히 2장과 공용 카드 중 정확히 3장을 반드시 사용합니다.':'내 카드 2장과 공용 카드 5장, 총 7장 중 가장 강한 5장 족보를 만듭니다.'}</Text><Text style={styles.slotRuleText}>플랍 3장 → 턴 1장 → 리버 1장 순서로 공개됩니다.</Text><Text style={styles.slotRuleText}>컴퓨터 한 명과 대결합니다.</Text></View><Text style={styles.sectionTitle}>베팅 등급</Text><View style={styles.setupOptions}>{difficultyOptions.map((item)=><Pressable key={item.name} style={[styles.setupOption,props.difficulty===item.name&&styles.setupOptionActive]} onPress={()=>props.onDifficultyChange(item.name)}><Text style={[styles.setupOptionTitle,props.difficulty===item.name&&styles.setupOptionTitleActive]}>{betTierName(item.name)}</Text><Text style={styles.setupOptionRange}>{item.min.toLocaleString()}~{item.max.toLocaleString()} WC</Text></Pressable>)}</View><Text style={styles.sectionTitle}>시작 베팅</Text><View style={styles.betGrid}>{option.bets.map((amount,index)=><BetOptionCoin key={amount} amount={amount} level={index+1} selected={props.selectedBet===amount} disabled={amount>props.coins} onPress={()=>props.onBetChange(amount)}/>)}</View><Pressable disabled={props.selectedBet>props.coins} style={[styles.primaryButton,styles.fullWidthButton,props.selectedBet>props.coins&&styles.disabledCard]} onPress={props.onStart}><Text style={styles.primaryButtonText}>테이블 입장</Text></Pressable></ScrollView></View>;
}

/** 한 라운드에서 양쪽이 올릴 수 있는 최대 횟수. 무한 레이즈 전쟁을 막습니다. */
const MAX_RAISES_PER_STREET = 3;

/** 컴퓨터가 이번 판에 넣은 돈과 내가 넣은 돈을 따로 들고 다닙니다. */
type PokerBetting = { mine: number; theirs: number; raises: number };

function PokerGameScreen({mode,coins,selectedBet,onBack,onPlaceBet,onSettle}:{mode:'holdem'|'omaha';coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:(mine:number,theirs:number,result:'win'|'loss'|'push',detail:string)=>void}) {
  const [round,setRound]=useState<ReturnType<typeof dealHoldem>|null>(null);
  const [stage,setStage]=useState(0);
  const [betting,setBetting]=useState<PokerBetting>({mine:0,theirs:0,raises:0});
  const [outcome,setOutcome]=useState('');
  const [opponentNote,setOpponentNote]=useState('');
  const [showdown,setShowdown]=useState<ReturnType<typeof resolveHoldem>|null>(null);
  const [foldedShown,setFoldedShown]=useState(0);
  const omaha=mode==='omaha';

  const start=()=>{ if(!onPlaceBet(selectedBet))return; setRound(omaha?dealOmaha():dealHoldem()); setStage(1); setBetting({mine:selectedBet,theirs:selectedBet,raises:0}); setOutcome(''); setOpponentNote('컴퓨터도 같은 금액을 냈습니다'); setShowdown(null); setFoldedShown(0); };

  const shownFor=(value:number)=>value===1?0:value===2?3:value===3?4:5;
  const shown=stage===5&&!showdown?foldedShown:shownFor(stage);

  /** 컴퓨터가 지금 보고 있는 정보로 승률을 재고 행동을 고릅니다. */
  const computerDecision=(current:PokerBetting,street:number,active:ReturnType<typeof dealHoldem>)=>{
    const board=active.community.slice(0,shownFor(street));
    const equity=estimateEquity({
      variant: omaha?'omaha':'holdem',
      hole: active.opponent,
      community: board,
      opponentHidden: omaha?4:2,
      communityToCome: 5-board.length,
      trials: omaha?90:200,
    });
    const toCall=current.mine-current.theirs;
    return decidePokerAction({
      equity, toCall,
      pot: current.mine+current.theirs,
      raiseSize: selectedBet,
      canRaise: current.raises<MAX_RAISES_PER_STREET,
      street: street-1,
    });
  };

  const settle=(current:PokerBetting,active:ReturnType<typeof dealHoldem>)=>{
    const resolved=omaha?resolveOmaha(active.player,active.opponent,active.community):resolveHoldem(active.player,active.opponent,active.community);
    setShowdown(resolved);
    setOutcome(resolved.result==='win'?'내가 이겼습니다':resolved.result==='loss'?'컴퓨터가 이겼습니다':'무승부입니다');
    onSettle(current.mine,current.theirs,resolved.result,`${resolved.playerHand.label} vs ${resolved.opponentHand.label}`);
    setStage(5);
  };

  /** 내가 행동한 뒤 컴퓨터 차례. 폴드·콜·레이즈를 실제로 골라 돌려줍니다. */
  const computerTurn=(current:PokerBetting,street:number)=>{
    if(!round)return;
    const action=computerDecision(current,street,round);
    if(action.kind==='fold'){
      setBetting(current);
      setOpponentNote('컴퓨터 폴드 — 팟을 가져갑니다');
      setOutcome('컴퓨터가 폴드했습니다');
      setShowdown(null);
      setFoldedShown(shownFor(street));
      onSettle(current.mine,current.theirs,'win','컴퓨터 폴드 · 상대 패 비공개');
      setStage(5);
      return;
    }
    if(action.kind==='raise'){
      const next={mine:current.mine,theirs:current.mine+action.amount,raises:current.raises+1};
      setBetting(next);
      setOpponentNote(`컴퓨터 ${pokerActionLabel(action)} — 콜하려면 ${(next.theirs-next.mine).toLocaleString()} WC`);
      return;
    }
    // 체크 또는 콜: 금액을 맞추고 다음 라운드로 넘어갑니다.
    const next={mine:current.mine,theirs:current.mine,raises:0};
    setBetting(next);
    setOpponentNote(`컴퓨터 ${pokerActionLabel(action.kind==='call'?{kind:'call',amount:current.mine-current.theirs}:action)}`);
    if(street<4)setStage(street+1); else settle(next,round);
  };

  const toCall=Math.max(0,betting.theirs-betting.mine);
  const canAct=stage>=1&&stage<=4;

  const fold=()=>{ if(!round)return; setFoldedShown(shownFor(stage)); setOutcome('폴드 · 패배 · 상대 카드는 비공개입니다'); setShowdown(null); onSettle(betting.mine,betting.theirs,'loss','중간 폴드 · 상대 패 비공개'); setStage(5); };

  const callOrCheck=()=>{ if(!round)return; if(toCall>0&&!onPlaceBet(toCall))return; const next={...betting,mine:betting.mine+toCall}; setBetting(next); computerTurn(next,stage); };

  const raise=()=>{ if(!round)return; const need=toCall+selectedBet; if(!onPlaceBet(need))return; const next={mine:betting.mine+need,theirs:betting.theirs,raises:betting.raises+1}; setBetting(next); computerTurn(next,stage); };

  const inHand=(card:Card,hand?:Card[])=>Boolean(hand?.some((used)=>used.id===card.id));
  const pokerEmphasis=(card:Card,side:'player'|'opponent'|'community'):'winner'|'selected'|'dim'|undefined=>{ if(!showdown)return undefined; const playerCards=madeHandCards(showdown.playerHand); const opponentCards=madeHandCards(showdown.opponentHand); const own=side==='opponent'?opponentCards:playerCards; const winner=showdown.result==='win'?playerCards:showdown.result==='loss'?opponentCards:null; if(side==='community')return winner&&inHand(card,winner)?'winner':inHand(card,playerCards)||inHand(card,opponentCards)?'selected':'dim'; if(inHand(card,own))return showdown.result==='push'?'selected':(side==='player')===(showdown.result==='win')?'winner':'selected'; return 'dim'; };

  return <View style={styles.detailScreen}><ScreenHeader title={omaha?'오마하(Omaha)':'텍사스 홀덤(Texas Hold’em)'} onBack={onBack}/><ScrollView contentContainerStyle={styles.holdemPage}><View style={styles.holdemTable}><Text style={styles.holdemSeat}>컴퓨터</Text><View style={styles.holdemCards}>{round?round.opponent.map((c)=><PlayingCard key={c.id} card={c} hidden={!showdown} compact emphasis={pokerEmphasis(c,'opponent')}/>):null}</View><Text style={styles.holdemPot}>POT {(betting.mine+betting.theirs).toLocaleString()} WC</Text><Text style={styles.pokerContribution}>내가 낸 돈 {betting.mine.toLocaleString()} · 컴퓨터 {betting.theirs.toLocaleString()} WC</Text><FaceDownCardDeck label="남은 카드"/><View style={styles.holdemCommunity}>{round?.community.slice(0,shown).map((c)=>{const common=Boolean(showdown&&inHand(c,madeHandCards(showdown.playerHand))&&inHand(c,madeHandCards(showdown.opponentHand)));return <View key={c.id} style={styles.pokerBoardCard}><PlayingCard card={c} compact emphasis={pokerEmphasis(c,'community')}/>{common&&<Text style={styles.pokerCommonBadge}>공통</Text>}</View>;})}{Array.from({length:5-shown},(_,i)=><View key={i} style={[styles.playingCard,styles.compactPlayingCard,styles.hiddenCard]}><Text style={styles.hiddenCardMark}>◆</Text></View>)}</View><Text style={styles.holdemSeat}>나</Text><View style={styles.holdemCards}>{round?.player.map((c)=><PlayingCard key={c.id} card={c} compact emphasis={pokerEmphasis(c,'player')}/>)}</View>{opponentNote?<Text style={styles.pokerOpponentNote}>{opponentNote}</Text>:null}{outcome?<Text style={styles.holdemOutcome}>{outcome}</Text>:null}{showdown&&<Text style={styles.pokerInlineResult}>내 패: {showdown.playerHand.label}  ·  상대 패: {showdown.opponentHand.label}</Text>}</View>{!canAct?<Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton]} onPress={start}><Text style={styles.primaryButtonText}>{stage===5?'다시 플레이':'카드 받기'} · {selectedBet.toLocaleString()} WC</Text></Pressable>:<View style={styles.holdemActions}><Pressable style={styles.holdemFold} onPress={fold}><Text style={styles.holdemActionText}>폴드</Text></Pressable><Pressable disabled={toCall>coins} style={[styles.holdemAction,toCall>coins&&styles.disabledCard]} onPress={callOrCheck}><Text style={styles.primaryButtonText}>{toCall>0?`콜 ${toCall.toLocaleString()}`:'체크'}</Text></Pressable><Pressable disabled={toCall+selectedBet>coins||betting.raises>=MAX_RAISES_PER_STREET} style={[styles.holdemAction,(toCall+selectedBet>coins||betting.raises>=MAX_RAISES_PER_STREET)&&styles.disabledCard]} onPress={raise}><Text style={styles.primaryButtonText}>레이즈 +{selectedBet.toLocaleString()}</Text></Pressable></View>}<Text style={styles.disclaimer}>현재 단계: {['대기','프리플랍','플랍','턴','리버','결과'][stage]}{canAct&&betting.raises>=MAX_RAISES_PER_STREET?' · 이 라운드 레이즈 한도 도달':''}</Text></ScrollView></View>;
}

function RiichiSetupScreen(props:{coins:number;difficulty:string;selectedBet:number;onBack:()=>void;onDifficultyChange:(v:string)=>void;onBetChange:(v:number)=>void;onStart:()=>void}) {
  const option=difficultyOptions.find((item)=>item.name===props.difficulty)??difficultyOptions[2];
  return <View style={styles.detailScreen}><ScreenHeader title="리치 마작(Riichi Mahjong) 준비" onBack={props.onBack}/><ScrollView {...useScrollMemory('RiichiSetupScreen')} contentContainerStyle={styles.detailPage}><View style={styles.mahjongGuide}><Text style={styles.mahjongHeroTiles}>🀇 🀈 🀉　🀀 🀀</Text><Text style={styles.detailLead}>한 장을 뽑고 한 장을 버려 완성</Text><Text style={styles.slotRuleText}>기본 완성 모양은 같은 패 2장인 머리 하나와, 세 장으로 된 몸통 네 개입니다.</Text><Text style={styles.slotRuleText}>몸통은 같은 패 3장 또는 같은 종류의 연속 숫자 3장으로 만듭니다.</Text></View><RiichiBeginnerGuide/><MahjongGlossary/><Text style={styles.sectionTitle}>베팅 등급</Text><View style={styles.setupOptions}>{difficultyOptions.map((item)=><Pressable key={item.name} style={[styles.setupOption,props.difficulty===item.name&&styles.setupOptionActive]} onPress={()=>props.onDifficultyChange(item.name)}><Text style={[styles.setupOptionTitle,props.difficulty===item.name&&styles.setupOptionTitleActive]}>{betTierName(item.name)}</Text><Text style={styles.setupOptionRange}>{item.min.toLocaleString()}~{item.max.toLocaleString()} WC</Text></Pressable>)}</View><Text style={styles.sectionTitle}>참가 코인</Text><View style={styles.betGrid}>{option.bets.map((amount,index)=><BetOptionCoin key={amount} amount={amount} level={index+1} selected={props.selectedBet===amount} disabled={amount>props.coins} onPress={()=>props.onBetChange(amount)}/>)}</View><Pressable disabled={props.selectedBet>props.coins} style={[styles.primaryButton,styles.fullWidthButton,props.selectedBet>props.coins&&styles.disabledCard]} onPress={props.onStart}><Text style={styles.primaryButtonText}>설명을 읽었어요 · 동1국 시작</Text></Pressable></ScrollView></View>;
}

function RiichiBeginnerGuide(){
  const [open,setOpen]=useState(true);
  return <><View style={styles.mahjongBeginner}><Pressable onPress={()=>setOpen((value)=>!value)} style={styles.mahjongGuideHeader}><View><Text style={styles.mahjongGuideEyebrow}>FIRST MAHJONG</Text><Text style={styles.mahjongGuideTitle}>처음 하는 사람을 위한 설명</Text></View><Text style={styles.mahjongGuideToggle}>{open?'접기 −':'보기 +'}</Text></Pressable>{open?<View style={styles.mahjongGuideBody}>
    <View style={styles.mahjongLesson}><Text style={styles.mahjongLessonNumber}>1</Text><View style={styles.mahjongLessonCopy}><Text style={styles.mahjongLessonTitle}>무엇을 만들면 되나요?</Text><Text style={styles.mahjongLessonText}>내 패 14장을 <Text style={styles.mahjongStrong}>몸통 4개 + 머리 1개</Text>로 나누면 기본 완성입니다. 머리는 똑같은 패 2장입니다. 예외로 서로 다른 일곱 쌍인 칠대자와 1·9·자패 13종을 모으는 국사무쌍도 있습니다.</Text><Text style={styles.mahjongExample}>🀇🀈🀉　🀙🀚🀛　🀐🀐🀐　🀀🀀🀀　🀄🀄</Text></View></View>
    <View style={styles.mahjongLesson}><Text style={styles.mahjongLessonNumber}>2</Text><View style={styles.mahjongLessonCopy}><Text style={styles.mahjongLessonTitle}>몸통은 두 종류예요</Text><Text style={styles.mahjongLessonText}><Text style={styles.mahjongStrong}>연속 3장</Text>: 같은 무늬의 3·4·5처럼 이어지는 숫자입니다. <Text style={styles.mahjongStrong}>같은 3장</Text>: 똑같은 패 세 장입니다. 동·남·서·북과 백·발·중은 숫자가 아니므로 연속으로 만들 수 없습니다.</Text></View></View>
    <View style={styles.mahjongLesson}><Text style={styles.mahjongLessonNumber}>3</Text><View style={styles.mahjongLessonCopy}><Text style={styles.mahjongLessonTitle}>패의 종류</Text><Text style={styles.mahjongLessonText}>🀇~🀏 만수, 🀙~🀡 통수, 🀐~🀘 삭수는 각각 1부터 9입니다. 🀀🀁🀂🀃은 동·남·서·북, 🀆🀅🀄은 백·발·중입니다. 모든 패는 네 장씩 있습니다.</Text></View></View>
    <View style={styles.mahjongLesson}><Text style={styles.mahjongLessonNumber}>4</Text><View style={styles.mahjongLessonCopy}><Text style={styles.mahjongLessonTitle}>내 차례에 하는 일</Text><Text style={styles.mahjongLessonText}>패 한 장을 자동으로 뽑아 14장이 됩니다. 필요 없는 패 하나를 누르면 버리고 다시 13장이 됩니다. 이 과정을 반복하면서 완성에 가까워지면 됩니다. 밝게 올라온 패가 방금 뽑은 패입니다.</Text></View></View>
    <View style={styles.mahjongLesson}><Text style={styles.mahjongLessonNumber}>5</Text><View style={styles.mahjongLessonCopy}><Text style={styles.mahjongLessonTitle}>쯔모와 론</Text><Text style={styles.mahjongLessonText}><Text style={styles.mahjongStrong}>쯔모</Text>는 내가 뽑은 패로 완성하는 승리, <Text style={styles.mahjongStrong}>론</Text>은 다른 사람이 버린 패로 완성하는 승리입니다. 상대의 버림패로 완성되면 론 버튼이 나타납니다.</Text></View></View>
    <View style={styles.mahjongLesson}><Text style={styles.mahjongLessonNumber}>6</Text><View style={styles.mahjongLessonCopy}><Text style={styles.mahjongLessonTitle}>치·퐁·깡·리치는 무엇인가요?</Text><Text style={styles.mahjongLessonText}>치·퐁은 상대의 버림패를 가져와 몸통을 만드는 것, 깡은 같은 패 4장을 공개하는 것입니다. 치는 바로 왼쪽 상대의 패만 가져올 수 있지만 퐁·깡은 누구의 패든 가능합니다. 리치는 패를 공개하지 않은 텐파이 상태에서 1,000점을 맡기고 선언합니다. 선언 후에는 새로 뽑은 패만 그대로 버립니다.</Text></View></View>
    <View style={styles.mahjongCurrentRule}><Text style={styles.mahjongCurrentTitle}>현재 이 앱에서 먼저 연습하는 것</Text><Text style={styles.mahjongLessonText}>패 뽑기 → 필요 없는 패 버리기 → 몸통 4개와 머리 1개 만들기 → 쯔모 판정. 처음에는 점수보다 패 모양을 익히면 됩니다.</Text></View>
  </View>:null}</View><RiichiYakuGuide/></>;
}

const beginnerRiichiYaku=[
  {name:'리치',han:'1판 · 울면 불가',tiles:'🀇🀈🀉　🀚🀛🀜　🀔🀕🀖　🀞🀞🀞　🀄🀄',detail:'치·퐁·깡으로 공개하지 않은 텐파이에서 1,000점을 내고 선언합니다. 패 모양 자체보다 선언이 역이 됩니다.'},
  {name:'멘젠쯔모',han:'1판 · 울면 불가',tiles:'🀇🀈🀉　🀚🀛🀜　🀔🀕🀖　🀀🀀🀀　🀄🀄',detail:'한 번도 치·퐁하지 않은 상태에서 마지막 패를 내가 직접 뽑아 완성합니다.'},
  {name:'탕야오',han:'1판 · 1·9·자패 금지',tiles:'🀈🀉🀊　🀛🀜🀝　🀓🀔🀕　🀞🀞🀞　🀌🀌',detail:'모든 패를 숫자 2~8만으로 만듭니다. 앱의 기본 설정에서는 울어도 성립합니다.'},
  {name:'역패',han:'1판 · 울어도 가능',tiles:'🀇🀈🀉　🀙🀚🀛　🀐🀑🀒　🀄🀄🀄　🀀🀀',detail:'백·발·중, 내 자리의 바람, 현재 판의 바람 중 하나를 같은 패 3장으로 만듭니다.'},
  {name:'핑후',han:'1판 · 울면 불가',tiles:'🀇🀈🀉　🀚🀛🀜　🀔🀕🀖　🀝🀞🀟　🀌🀌',detail:'네 몸통이 모두 연속패이고 점수 없는 머리이며, 양쪽으로 기다리는 형태로 완성합니다.'},
  {name:'이페코',han:'1판 · 울면 불가',tiles:'🀇🀈🀉　🀇🀈🀉　🀔🀕🀖　🀝🀞🀟　🀄🀄',detail:'같은 종류의 똑같은 연속 몸통을 두 개 만듭니다.'},
  {name:'치또이츠',han:'2판 · 울면 불가',tiles:'🀇🀇　🀊🀊　🀙🀙　🀝🀝　🀐🀐　🀖🀖　🀄🀄',detail:'서로 다른 똑같은 패 두 장짜리 짝을 일곱 개 만듭니다. 몸통 4개와 머리 1개의 예외입니다.'},
] as const;

function RiichiYakuGuide(){
  const [open,setOpen]=useState(true);
  return <View style={styles.riichiYakuGuide}><Pressable onPress={()=>setOpen((value)=>!value)} style={styles.mahjongGuideHeader}><View><Text style={styles.mahjongGuideEyebrow}>EASY YAKU</Text><Text style={styles.mahjongGuideTitle}>처음 노려볼 쉬운 역</Text></View><Text style={styles.mahjongGuideToggle}>{open?'접기 −':'보기 +'}</Text></Pressable>{open?<View style={styles.riichiYakuBody}><View style={styles.riichiNoYakuWarning}><Text style={styles.riichiNoYakuTitle}>완성 모양만으로는 이길 수 없어요</Text><Text style={styles.mahjongTileGroupDetail}>리치마작은 몸통 4개와 머리 1개를 만들고, 아래와 같은 역도 최소 하나 있어야 쯔모·론할 수 있습니다.</Text></View>{beginnerRiichiYaku.map((yaku)=><View key={yaku.name} style={styles.riichiYakuCard}><View style={styles.riichiYakuHeading}><Text style={styles.riichiYakuName}>{yaku.name}</Text><Text style={styles.riichiYakuHan}>{yaku.han}</Text></View><Text style={styles.riichiYakuTiles}>{yaku.tiles}</Text><Text style={styles.riichiYakuDetail}>{yaku.detail}</Text></View>)}</View>:null}</View>;
}

const mahjongGlossary=[
  ['몸통','패 3장으로 만든 한 묶음. 연속 숫자 3장(순쯔) 또는 같은 패 3장(커쯔)입니다.'],
  ['머리','똑같은 패 2장. 기본 완성은 몸통 4개와 머리 1개입니다.'],
  ['역(役)','승리할 자격과 점수를 주는 조건. 리치·탕야오·역패 등이 역입니다.'],
  ['판(飜)','리치마작에서 역의 가치를 세는 단위. 판이 높을수록 점수가 크게 오릅니다.'],
  ['부(符)','리치마작에서 패 모양의 어려움을 세는 단위. 판과 부로 점수를 정합니다.'],
  ['쯔모','내가 직접 뽑은 패로 완성해 승리하는 것.'],
  ['론','다른 사람이 버린 패로 완성해 승리하는 것.'],
  ['텐파이','필요한 패가 딱 1장만 남은 완성 직전 상태.'],
  ['리치','울지 않은 텐파이에서 1,000점을 맡기고 선언하는 일본식 규칙.'],
  ['멘젠','치·퐁·명깡으로 패를 공개하지 않은 상태. 리치와 멘젠쯔모 같은 역을 만들 수 있습니다.'],
  ['샹텐','텐파이까지 몇 단계 남았는지 나타내는 수. 0샹텐은 텐파이 바로 전 단계입니다.'],
  ['유효패','뽑았을 때 현재 손패의 완성 가능성을 높여 주는 패. 남은 장수도 중요합니다.'],
  ['후리텐','내 대기패를 내가 이미 버렸거나 론을 넘겨서, 남의 버림패로 론할 수 없는 상태. 쯔모는 가능합니다.'],
  ['현물','리치한 상대가 이미 버린 패. 그 상대에게는 론당하지 않는 안전패입니다.'],
  ['스지','상대의 버림패 숫자를 보고 양면 대기 가능성을 일부 줄여 추측하는 방어 기준. 완전한 안전은 아닙니다.'],
  ['도라','가지고 있으면 판을 더해 주는 보너스패. 도라만 있고 다른 역이 없으면 화료할 수 없습니다.'],
  ['공탁','리치를 선언하며 내는 1,000점. 다음 화료자가 가져갑니다.'],
  ['본장','친의 연장 횟수. 본장이 쌓이면 화료 때 주고받는 점수가 늘어납니다.'],
  ['치','바로 왼쪽 사람이 버린 패로 연속 숫자 몸통을 만드는 것.'],
  ['퐁','누군가 버린 패를 가져와 같은 패 3장 몸통을 만드는 것.'],
  ['깡','같은 패 4장을 한 묶음으로 만들고 보충패를 뽑는 것.'],
  ['동·남·서·북','바람패. 숫자처럼 이어지지 않으며 같은 패 3장으로 몸통을 만듭니다.'],
  ['정결(定缺)','사천마작에서 한 종류를 정해 모두 버리는 규칙. 남아 있으면 화료할 수 없습니다.'],
  ['화료','패를 완성해 승리를 선언하는 것. 쯔모와 론이 화료 방법입니다.'],
] as const;

function MahjongGlossary(){
  const [open,setOpen]=useState(true);
  return <><MahjongTileBasics/><View style={styles.mahjongGlossary}><Pressable onPress={()=>setOpen((value)=>!value)} style={styles.mahjongGuideHeader}><View><Text style={styles.mahjongGuideEyebrow}>MAHJONG WORDS</Text><Text style={styles.mahjongGuideTitle}>처음 보는 마작 용어</Text></View><Text style={styles.mahjongGuideToggle}>{open?'접기 −':'보기 +'}</Text></Pressable>{open?<View style={styles.mahjongGlossaryGrid}>{mahjongGlossary.map(([term,detail])=><View key={term} style={styles.mahjongGlossaryRow}><Text style={styles.mahjongGlossaryTerm}>{term}</Text><Text style={styles.mahjongGlossaryDetail}>{detail}</Text></View>)}</View>:null}</View><MahjongModeComparison/></>;
}

const mahjongModeComparison=[
  {icon:'立',name:'리치마작',region:'일본',tiles:'136장 중 왕패 14장 별도',win:'역 1개 이상',calls:'치·퐁·깡',score:'판과 부로 계산',special:'리치·도라·후리텐·도중유국'},
  {icon:'中',name:'중국식 마작',region:'국표 · MCR',tiles:'136장',win:'역 합계 8점 이상',calls:'치·퐁·깡',score:'81개 역 점수를 더함',special:'꽃패는 보너스지만 8점 조건에서 제외'},
  {icon:'港',name:'홍콩마작',region:'홍콩',tiles:'136장 + 꽃패 8장',win:'기본 설정 3번 이상',calls:'치·퐁·깡',score:'번마다 두 배',special:'꽃패·친 연장·론은 방총자가 전액 지불'},
  {icon:'川',name:'사천마작',region:'중국 사천',tiles:'자패 없는 108장',win:'정결 완료 + 완성',calls:'퐁·깡만 가능',score:'번을 배수로 계산',special:'환삼장·정결·혈전도저·과수'},
] as const;

function MahjongModeComparison(){
  const [open,setOpen]=useState(true);
  return <View style={styles.mahjongModeComparison}><Pressable onPress={()=>setOpen((value)=>!value)} style={styles.mahjongGuideHeader}><View><Text style={styles.mahjongGuideEyebrow}>4 RULE SETS</Text><Text style={styles.mahjongGuideTitle}>네 가지 마작 차이</Text></View><Text style={styles.mahjongGuideToggle}>{open?'접기 −':'보기 +'}</Text></Pressable>{open?<View style={styles.mahjongModeBody}><View style={styles.mahjongModeCommon}><Text style={styles.mahjongModeCommonTitle}>공통 목표</Text><Text style={styles.mahjongModeText}>한 장을 뽑고 한 장을 버리며 기본적으로 몸통 4개와 머리 1개를 만듭니다. 달라지는 것은 사용하는 패, 이길 수 있는 최소 조건과 점수 계산입니다.</Text></View>{mahjongModeComparison.map((item)=><View key={item.name} style={styles.mahjongModeCard}><View style={styles.mahjongModeHeading}><Text style={styles.mahjongModeIcon}>{item.icon}</Text><View><Text style={styles.mahjongModeName}>{item.name}</Text><Text style={styles.mahjongModeRegion}>{item.region}</Text></View></View><View style={styles.mahjongModeFacts}><Text style={styles.mahjongModeFact}><Text style={styles.mahjongModeLabel}>사용 패　</Text>{item.tiles}</Text><Text style={styles.mahjongModeFact}><Text style={styles.mahjongModeLabel}>승리 조건　</Text>{item.win}</Text><Text style={styles.mahjongModeFact}><Text style={styles.mahjongModeLabel}>부르기　</Text>{item.calls}</Text><Text style={styles.mahjongModeFact}><Text style={styles.mahjongModeLabel}>점수　</Text>{item.score}</Text><Text style={styles.mahjongModeFact}><Text style={styles.mahjongModeLabel}>특징　</Text>{item.special}</Text></View></View>)}</View>:null}</View>;
}

function MahjongTileBasics(){
  const [open,setOpen]=useState(true);
  const groups=[
    {name:'만수 · 숫자 1~9',tiles:'🀇 🀈 🀉 🀊 🀋 🀌 🀍 🀎 🀏',detail:'한자 모양의 숫자패. 같은 종류 안에서 2·3·4처럼 이어집니다.'},
    {name:'통수 · 숫자 1~9',tiles:'🀙 🀚 🀛 🀜 🀝 🀞 🀟 🀠 🀡',detail:'동그라미 모양의 숫자패. 같은 통수끼리만 이어집니다.'},
    {name:'삭수 · 숫자 1~9',tiles:'🀐 🀑 🀒 🀓 🀔 🀕 🀖 🀗 🀘',detail:'대나무 모양의 숫자패. 1삭은 대나무 대신 새 그림입니다.'},
  ];
  return <View style={styles.mahjongTileBasics}><Pressable onPress={()=>setOpen((value)=>!value)} style={styles.mahjongGuideHeader}><View><Text style={styles.mahjongGuideEyebrow}>TILE GUIDE</Text><Text style={styles.mahjongGuideTitle}>패 그림부터 익히기</Text></View><Text style={styles.mahjongGuideToggle}>{open?'접기 −':'보기 +'}</Text></Pressable>{open?<View style={styles.mahjongTileBasicsBody}>{groups.map((group)=><View key={group.name} style={styles.mahjongTileGroup}><Text style={styles.mahjongTileGroupName}>{group.name}</Text><Text style={styles.mahjongTileLine}>{group.tiles}</Text><Text style={styles.mahjongTileGroupDetail}>{group.detail}</Text></View>)}<View style={styles.mahjongTileGroup}><Text style={styles.mahjongTileGroupName}>자패 · 숫자가 없는 패</Text><Text style={styles.mahjongTileLine}>🀀 🀁 🀂 🀃　🀆 🀅 🀄</Text><Text style={styles.mahjongTileGroupDetail}>동·남·서·북과 백·발·중. 순서대로 이어지지 않고, 똑같은 패 3장으로만 몸통을 만듭니다. 사천마작에서는 자패를 사용하지 않습니다.</Text></View><View style={styles.mahjongShapeExample}><Text style={styles.mahjongShapeTitle}>완성 모양 예시</Text><Text style={styles.mahjongShapeTiles}>🀇🀈🀉　🀜🀜🀜　🀔🀕🀖　🀀🀀🀀　🀄🀄</Text><Text style={styles.mahjongTileGroupDetail}>연속 몸통 2개 + 같은 패 몸통 2개 + 같은 패 2장인 머리 1개입니다.</Text></View></View>:null}</View>;
}

function MahjongTileView({tile,selected=false,recommended=false,onPress,showRed=false}:{tile:MahjongTile;selected?:boolean;recommended?:boolean;onPress?:()=>void;showRed?:boolean}) {
  // 적도라는 리치 마작 전용 규칙입니다.
  const red=showRed&&isRedFive(tile);
  return <Pressable disabled={!onPress} onPress={onPress} style={[styles.mahjongTile,recommended&&styles.mahjongTileRecommended,selected&&styles.mahjongTileDrawn,red&&styles.mahjongTileRed]}><Text style={[styles.mahjongGlyph,red&&styles.mahjongGlyphRed]}>{tile.glyph}</Text>{recommended&&<Text style={styles.mahjongRecommendMark}>추천</Text>}{red&&<Text style={styles.mahjongRedMark}>적</Text>}</Pressable>;
}

const mahjongProfiles:Record<MahjongMode,{title:string;round:string;lead:string;rules:string[];honors:boolean;note:string}>={
  riichi:{title:'리치 마작(Riichi Mahjong)',round:'東 1局',lead:'일본식 리치 규칙의 기본판',rules:['136장의 숫자패와 자패를 모두 사용합니다.','몸통 4개와 머리 1개뿐 아니라 칠대자와 국사무쌍도 완성으로 판정합니다.'],honors:true,note:'암깡·가깡·창깡·영상개화, 도라·뒷도라·깡도라, 판·부 실제 점수 계산'},
  chinese:{title:'중국식 마작(Chinese Mahjong)',round:'东 1局',lead:'중국 표준형 마작의 기본판',rules:['136장의 숫자패와 동·남·서·북·백·발·중을 사용합니다.','한 장을 뽑고 한 장을 버려 몸통 4개와 머리 1개를 만듭니다.','부(符)가 없습니다. 역마다 정해진 점수를 그대로 더합니다.','역 합계 8점을 넘겨야 화료할 수 있습니다.','쯔모는 세 명이 각각 역점수+8점, 론은 방총자가 역점수+8점에 나머지 둘이 8점씩 냅니다.'],honors:true,note:'국표마작 역 체계와 8점 최소 제한 적용'},
  hongkong:{title:'홍콩 마작(Hong Kong Mahjong)',round:'東 1局',lead:'빠르고 직관적인 홍콩식 기본판',rules:['136장 전체를 사용하며 기본 완성 모양은 같습니다.','홍콩식은 비교적 간결한 번(番) 체계를 사용합니다.','136장에 꽃패 8장을 더해 씁니다. 자기 번호 꽃패는 1번씩 붙습니다.','부(符) 없이 번(番)만 세고 점수는 번마다 두 배로 오릅니다.','최소 3번을 넘겨야 화료할 수 있고, 한도 역은 번수와 무관합니다.','론은 방총자가 세 명 몫을 전부 냅니다.'],honors:true,note:'꽃패·최소 3번·한도 13번의 홍콩식 번 계산 적용'},
  sichuan:{title:'사천 마작(Sichuan Mahjong)',round:'川 1局',lead:'자패 없이 숫자패로만 즐기는 기본판',rules:['동·남·서·북·백·발·중을 빼고 만수·통수·삭수 108장만 사용합니다.','몸통 4개와 머리 1개를 만드는 기본 목표는 같습니다.','정결(定缺): 한 종류를 정해 전부 버려야 화료할 수 있습니다.','치(吃)가 없습니다. 퐁과 깡만 부를 수 있습니다.','같은 패 네 장이 든 용칠대자를 인정하고, 점수는 번이 배수로 곱해집니다.'],honors:false,note:'정결·용칠대자·번 배수 점수(상한 64배) 적용'},
};

function WorldMahjongSetupScreen(props:{mode:Exclude<MahjongMode,'riichi'>;coins:number;difficulty:string;selectedBet:number;onBack:()=>void;onDifficultyChange:(v:string)=>void;onBetChange:(v:number)=>void;onStart:()=>void}){
  const profile=mahjongProfiles[props.mode];const option=difficultyOptions.find((item)=>item.name===props.difficulty)??difficultyOptions[2];
  return <View style={styles.detailScreen}><ScreenHeader title={`${profile.title} 준비`} onBack={props.onBack}/><ScrollView {...useScrollMemory('WorldMahjongSetupScreen')} contentContainerStyle={styles.detailPage}><View style={styles.mahjongGuide}><Text style={styles.mahjongHeroTiles}>{props.mode==='sichuan'?'🀇 🀈 🀉　🀙 🀚 🀛':'🀇 🀈 🀉　🀀 🀀'}</Text><Text style={styles.detailLead}>{profile.lead}</Text>{profile.rules.map((rule,index)=><Text key={index} style={styles.slotRuleText}>{index+1}. {rule}</Text>)}</View><View style={styles.mahjongCurrentRule}><Text style={styles.mahjongCurrentTitle}>처음 플레이하는 방법</Text><Text style={styles.mahjongLessonText}>밝게 올라온 패가 새로 뽑은 패입니다. 내 패 중 필요 없는 한 장을 누르면 컴퓨터 3명의 차례가 자동으로 진행됩니다. 완성 패가 되면 쯔모 버튼이 켜집니다.</Text><Text style={[styles.mahjongLessonText,{marginTop:6}]}>{profile.note}</Text></View><MahjongGlossary/><Text style={styles.sectionTitle}>베팅 등급</Text><View style={styles.setupOptions}>{difficultyOptions.map((item)=><Pressable key={item.name} style={[styles.setupOption,props.difficulty===item.name&&styles.setupOptionActive]} onPress={()=>props.onDifficultyChange(item.name)}><Text style={[styles.setupOptionTitle,props.difficulty===item.name&&styles.setupOptionTitleActive]}>{betTierName(item.name)}</Text><Text style={styles.setupOptionRange}>{item.min.toLocaleString()}~{item.max.toLocaleString()} WC</Text></Pressable>)}</View><Text style={styles.sectionTitle}>참가 코인</Text><View style={styles.betGrid}>{option.bets.map((amount,index)=><BetOptionCoin key={amount} amount={amount} level={index+1} selected={props.selectedBet===amount} disabled={amount>props.coins} onPress={()=>props.onBetChange(amount)}/>)}</View><Pressable disabled={props.selectedBet>props.coins} style={[styles.primaryButton,styles.fullWidthButton]} onPress={props.onStart}><Text style={styles.primaryButtonText}>{profile.title} 시작</Text></Pressable></ScrollView></View>;
}

function RiichiGameScreen({mode,coins,selectedBet,onBack,onPlaceBet,onSettle}:{mode:MahjongMode;coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:(stake:number,result:'win'|'loss'|'push',detail:string)=>void}) {
  const profile=mahjongProfiles[mode];
  type PendingCall={tile:MahjongTile;discarder:number;nextComputer:number;options:MahjongCallOption[];canRon:boolean;otherRonSeats?:number[];onPassRon?:()=>void;kanRefundTransfers?:SichuanKanTransfer[]};
  type MahjongRoundResult={winner:number|null;winners?:number[];method:'론'|'쯔모'|'유국'|'유국만관';concealed:MahjongTile[];melds:MahjongTile[][];yaku:string[];grade:string;scoreText:string};
  const [phase,setPhase]=useState<'ready'|'playing'|'result'>('ready'); const [player,setPlayer]=useState<MahjongTile[]>([]); const [opponents,setOpponents]=useState<MahjongTile[][]>([[],[],[]]); const [wall,setWall]=useState<MahjongTile[]>([]); const [deadWall,setDeadWall]=useState<MahjongTile[]>([]); const [rivers,setRivers]=useState<MahjongTile[][]>([[],[],[],[]]); const [drawnId,setDrawnId]=useState(''); const [message,setMessage]=useState('동1국을 시작하세요');
  const [openMelds,setOpenMelds]=useState<MahjongTile[][]>([]); const [pendingCall,setPendingCall]=useState<PendingCall|null>(null);
  const [riichiDeclared,setRiichiDeclared]=useState(false); const [choosingRiichi,setChoosingRiichi]=useState(false); const [riichiPoints,setRiichiPoints]=useState(25000); const [riichiMarker,setRiichiMarker]=useState('');
  const [doubleRiichiDeclared,setDoubleRiichiDeclared]=useState(false);
  const [temporaryFuriten,setTemporaryFuriten]=useState(false); const [ippatsuEligible,setIppatsuEligible]=useState(false);
  const [opponentRiichi,setOpponentRiichi]=useState([false,false,false]);
  const [opponentDoubleRiichi,setOpponentDoubleRiichi]=useState([false,false,false]);
  const [opponentOpenMelds,setOpponentOpenMelds]=useState([0,0,0]);
  const [opponentMelds,setOpponentMelds]=useState<MahjongTile[][][]>([[],[],[]]);
  const [roundResult,setRoundResult]=useState<MahjongRoundResult|null>(null);
  const [matchState,setMatchState]=useState<RiichiMatchState>({roundIndex:0,honba:0,riichiSticks:0,scores:[25000,25000,25000,25000],finished:false});
  const [concealedKans,setConcealedKans]=useState<MahjongTile[][]>([]);
  const [afterKanDraw,setAfterKanDraw]=useState(false);
  // 사천 마작의 정결(定缺). 네 명이 각자 버릴 종류를 하나씩 정합니다.
  const [voidSuits,setVoidSuits]=useState<SichuanSuit[]>(['p','p','p','p']);
  const [choosingVoid,setChoosingVoid]=useState(false);
  const [bloodState,setBloodState]=useState<SichuanBloodState>(createBloodState(0));
  const [bloodLog,setBloodLog]=useState<string[]>([]);
  const [sichuanKanTransfers,setSichuanKanTransfers]=useState<SichuanKanTransfer[]>([]);
  const [sichuanLastKanTransfers,setSichuanLastKanTransfers]=useState<SichuanKanTransfer[]>([]);
  const [sichuanSettledKanCount,setSichuanSettledKanCount]=useState(0);
  const [flowers,setFlowers]=useState<HongKongFlower[][]>([[],[],[],[]]);
  const [flowerWall,setFlowerWall]=useState<HongKongFlower[]>([]);
  const [rules,setRules]=useState<RiichiRuleOptions>(DEFAULT_RIICHI_RULES);
  const [minFaan,setMinFaan]=useState<number>(HONG_KONG_MIN_FAAN);
  const [showRules,setShowRules]=useState(false);
  const [showPlayHelp,setShowPlayHelp]=useState(true);
  const [hkMatch,setHkMatch]=useState<HongKongMatchState>(createHongKongMatch(500));
  const [cnMatch,setCnMatch]=useState<ChineseMatchState>(createChineseMatch(0));
  // 도라 표시패는 누가 깡했든 한 장씩 늘어나므로 국 전체의 깡 수를 따로 셉니다.
  const [revealedKans,setRevealedKans]=useState(0);
  // 도중유국·유국만관 판정에 필요한 국 단위 기록
  const [kanOwners,setKanOwners]=useState<number[]>([]);
  const [anyCallMade,setAnyCallMade]=useState(false);
  const [myDiscardClaimed,setMyDiscardClaimed]=useState(false);
  const [turnsTaken,setTurnsTaken]=useState(0);
  // 친이 컴퓨터인 국은 그 자리부터 먼저 진행한 뒤 플레이어 차례로 넘깁니다.
  const [openingComputerSeat,setOpeningComputerSeat]=useState<number|null>(null);
  // 공통 시작 버튼은 원래 리치 반장전 종료만 보고 있었습니다.
  // 다른 세 종목의 최종 종료도 연결해 새 경기에서 참가 코인을 다시 받습니다.
  useEffect(()=>{
    if(phase!=='result')return;
    const finished=isMahjongSessionFinished(mode,{riichi:matchState.finished,hongkong:hkMatch.finished,chinese:cnMatch.finished,sichuan:bloodState.over});
    if(finished&&!matchState.finished)setMatchState((current)=>({...current,finished:true}));
  },[phase,mode,hkMatch.finished,cnMatch.finished,bloodState.over,matchState.finished]);
  useEffect(()=>{
    if(phase==='playing'&&mode==='chinese'&&cnMatch.finished)setCnMatch(createChineseMatch(0));
  },[phase,mode,cnMatch.finished]);
  // 깡은 손패 길이와 완성 판정에 모두 영향을 줍니다. 암깡도 몸통 하나로 셉니다.
  const meldCount=openMelds.length+concealedKans.length;
  const kanCount=openMelds.filter((meld)=>meld.length===4).length+concealedKans.length;
  const start=()=>{
    if((phase==='ready'||matchState.finished)&&!onPlaceBet(selectedBet))return;
    const freshMatch=phase==='ready'||matchState.finished;
    if(freshMatch)setMatchState({roundIndex:0,honba:0,riichiSticks:0,scores:[25000,25000,25000,25000],finished:false});
    const dealerSeat=freshMatch?0:mode==='riichi'?mahjongDealerSeat(matchState.roundIndex):mode==='hongkong'?mahjongDealerSeat(hkMatch.roundIndex):mode==='chinese'?mahjongDealerSeat(cnMatch.roundIndex):0;
    const round=dealRiichi(Math.random,profile.honors,mode==='riichi'?14:0);
    const draw=dealerSeat===0?drawMahjongTile(round.player,round.wall):{hand:round.player,wall:round.wall,drawn:undefined};
    setPlayer(draw.hand);setOpponents(round.opponents);setWall(draw.wall);setDeadWall(round.deadWall);setRivers(round.rivers);setOpenMelds([]);setPendingCall(null);setRoundResult(null);setRiichiDeclared(false);setDoubleRiichiDeclared(false);setChoosingRiichi(false);
    if(freshMatch)setRiichiPoints(25000);
    setRiichiMarker('');setTemporaryFuriten(false);setIppatsuEligible(false);setOpponentRiichi([false,false,false]);setOpponentDoubleRiichi([false,false,false]);setOpponentOpenMelds([0,0,0]);setOpponentMelds([[],[],[]]);setConcealedKans([]);setAfterKanDraw(false);setRevealedKans(0);setKanOwners([]);setSichuanSettledKanCount(0);setAnyCallMade(false);setMyDiscardClaimed(false);setTurnsTaken(0);setDrawnId(draw.drawn?.id??'');setOpeningComputerSeat(dealerSeat===0?null:dealerSeat-1);setConcealedKans([]);setAfterKanDraw(false);
    if(mode==='sichuan'){
      // 환삼장: 같은 종류 세 장을 옆자리로 넘깁니다.
      const swapped=swapThreeTiles([draw.hand.filter((tile)=>tile.id!==draw.drawn?.id),round.opponents[0],round.opponents[1],round.opponents[2]],1);
      const mine=draw.drawn?sortMahjongHand([...swapped[0],draw.drawn]):swapped[0];
      setPlayer(mine);setOpponents([swapped[1],swapped[2],swapped[3]]);
      setVoidSuits([chooseVoidSuit(mine),chooseVoidSuit(swapped[1]),chooseVoidSuit(swapped[2]),chooseVoidSuit(swapped[3])]);
      setChoosingVoid(true);
      if(phase==='ready'||bloodState.over)setBloodState(createBloodState(0));
      setBloodLog([]);
      setSichuanKanTransfers([]);
      setSichuanLastKanTransfers([]);
    }else setChoosingVoid(false);
    if(mode==='hongkong'){
      // 꽃패 여덟 장 중 배패 때 나오는 몇 장만 먼저 주고, 나머지는 산에 남겨
      // 게임 중에 뽑으면 그때 보충패를 가져옵니다(補花).
      const pool=shuffleFlowers(createFlowerTiles(),Math.random);
      const dealt=dealInitialHongKongFlowers(pool,Math.random);
      setFlowers(dealt.flowers);
      setFlowerWall(dealt.flowerWall);
    }else{ setFlowers([[],[],[],[]]); setFlowerWall([]); }
    const indicator=deadWallDoraIndicators(round.deadWall,0)[0],dora=indicator?doraFromIndicator(indicator):null;
    setMessage(dealerSeat===0?`뽑은 패를 확인하고 한 장을 버리세요${mode==='riichi'&&indicator&&dora?` · 도라 표시 ${indicator.glyph} → 도라 ${dora.suit}${dora.value}`:''}`:`컴퓨터 ${dealerSeat}이 친 · 컴퓨터부터 시작합니다`);
    setPhase('playing');
  };

  const finish=(result:'win'|'loss'|'push',text:string)=>{setPhase('result');setMessage(text);onSettle(selectedBet,result,text);};
  // 도중유국: 친이 그대로 유지되고 본장만 하나 올라갑니다.
  const settleAbortiveDraw=(label:string,detail:string)=>{
    setMatchState((current)=>advanceRiichiMatch(current,{abortive:true}));
    setWall([]);
    setRoundResult({winner:null,method:'유국',concealed:[],melds:[],yaku:[],grade:label,scoreText:detail});
    finish('push',`${label} · ${detail}`);
  };
  const settleExhaustiveDraw=(nextPlayer:MahjongTile[],nextOpponents:MahjongTile[][])=>{const tenpai=[getMahjongWaits(nextPlayer,meldCount,profile.honors).length>0,...nextOpponents.map((hand)=>getMahjongWaits(hand,0,profile.honors).length>0)];
    // 유국만관: 버린 패가 전부 1·9·자패이고 한 번도 울리지 않았으면 만관 취급
    if(mode==='riichi'&&isNagashiMangan(rivers[0],myDiscardClaimed)){
      const payouts=nagashiManganPayments(0,matchState.roundIndex%4);
      setMatchState((current)=>{const next={...current,scores:current.scores.map((score,seat)=>score+payouts[seat]) as RiichiMatchState['scores']};setRiichiPoints(next.scores[0]);return advanceRiichiMatch(next,{exhaustive:true,tenpai});});
      setPlayer(nextPlayer);setOpponents(nextOpponents);setWall([]);
      setRoundResult({winner:0,method:'유국만관',concealed:sortMahjongHand(nextPlayer),melds:[],yaku:['유국만관 (流し満貫)'],grade:'유국만관',scoreText:`${payouts[0].toLocaleString()}점 획득 · 버림패가 모두 1·9·자패`});
      finish('win',`유국만관! 버린 패가 모두 1·9·자패였습니다 · ${payouts[0].toLocaleString()}점`);
      return;
    }
    // 종목마다 유국 정산이 다릅니다.
    if(mode==='hongkong'){setHkMatch((current)=>settleHongKongDraw(current));setPlayer(nextPlayer);setOpponents(nextOpponents);setWall([]);
      setRoundResult({winner:null,method:'유국',concealed:[],melds:[],yaku:[],grade:'점수 이동 없음',scoreText:'친이 그대로 이어갑니다'});
      finish('push','유국 · 점수 이동 없이 친이 이어갑니다');return;}
    if(mode==='chinese'){setCnMatch((current)=>settleChineseDraw(current));setPlayer(nextPlayer);setOpponents(nextOpponents);setWall([]);
      setRoundResult({winner:null,method:'유국',concealed:[],melds:[],yaku:[],grade:'점수 이동 없음',scoreText:'다음 국으로 넘어갑니다'});
      finish('push','유국 · 국표마작은 유국에 점수가 오가지 않습니다');return;}
    if(mode==='sichuan'){
      // 차대각: 텐파이 여부와 정결 완료 여부를 함께 따져 정산합니다.
      const settled=settleSichuanFullDraw(bloodState,{
        hands:[nextPlayer,...nextOpponents],
        melds:[openMelds,...opponentMelds],
        voidSuits,kanTransfers:sichuanKanTransfers,basePoints:1,
      });
      setBloodState(settled.state);setBloodLog(settled.log);setPlayer(nextPlayer);setOpponents(nextOpponents);setWall([]);
      const mineDelta=settled.state.scores[0]-bloodState.scores[0];
      const status=(index:number)=>!settled.cleared[index]?'화저':settled.tenpai[index]?'텐파이':'노텐';
      setRoundResult({winner:null,method:'유국',concealed:[],melds:[],yaku:settled.log,grade:[0,1,2,3].map((index)=>`${index===0?'나':`컴퓨터 ${index}`}: ${status(index)}`).join(' · '),scoreText:mineDelta===0?'내 점수 이동 없음':`내 점수 ${mineDelta>0?'+':''}${mineDelta}`});
      finish(mineDelta>0?'win':mineDelta<0?'loss':'push',`유국 · 차대각 정산 · 나는 ${status(0)}${mineDelta===0?'':` · ${mineDelta>0?'+':''}${mineDelta}`}`);return;}
    const payments=calculateNotenPayments(tenpai);const mine=payments[0];setMatchState((current)=>advanceRiichiMatch(current,{exhaustive:true,tenpai}));setPlayer(nextPlayer);setOpponents(nextOpponents);setWall([]);setRiichiPoints((value)=>value+mine);setRoundResult({winner:null,method:'유국',concealed:[],melds:[],yaku:[],grade:tenpai.map((ready,index)=>`${index===0?'나':`컴퓨터 ${index}`}: ${ready?'텐파이':'노텐'}`).join(' · '),scoreText:mine===0?'내 점수 이동 없음':`내 점수 ${mine>0?'+':''}${mine.toLocaleString()}점`});finish('push',`유국 · 나는 ${tenpai[0]?'텐파이':'노텐'}${mine===0?' · 점수 이동 없음':` · ${mine>0?'+':''}${mine.toLocaleString()}점`}\n${tenpai.map((ready,index)=>`${index===0?'나':`컴퓨터 ${index}`}: ${ready?'텐파이':'노텐'}`).join(' · ')}`);};
  // 도중유국 감시: 사개깡 · 사가리치 · 사풍연타
  useEffect(()=>{
    if(phase!=='playing'||mode!=='riichi'||pendingCall)return;
    if(isFourKanAbort(kanOwners)){settleAbortiveDraw('사개깡','두 명 이상이 나눠서 깡을 네 번 해 유국');return;}
    if(isFourRiichiAbort([riichiDeclared,...opponentRiichi])){settleAbortiveDraw('사가리치','네 명이 모두 리치를 선언해 유국');return;}
    if(isFourWindDiscardAbort(rivers,anyCallMade)){settleAbortiveDraw('사풍연타','첫 순번에 네 명이 같은 바람패를 버려 유국');return;}
  },[phase,mode,pendingCall,kanOwners,riichiDeclared,opponentRiichi,rivers,anyCallMade]);

  // 플레이어가 버린 패를 컴퓨터가 대명깡한 경로는 즉시 정산 함수 밖에서 진행됩니다.
  // 새 깡 소유자를 순서대로 확인해 아직 정산하지 않은 컴퓨터 명깡만 한 번 정산합니다.
  useEffect(()=>{
    if(mode!=='sichuan'||kanOwners.length<=sichuanSettledKanCount)return;
    const settled=reconcileSichuanKanEvent(bloodState,kanOwners,sichuanSettledKanCount,0);
    if(!settled)return;
    if(settled.owner===0){setSichuanSettledKanCount(settled.settledCount);return;}
    setBloodState(settled.state);
    setSichuanKanTransfers((current)=>[...current,...settled.transfers]);
    setSichuanLastKanTransfers(settled.transfers);
    setSichuanSettledKanCount(settled.settledCount);
    setBloodLog((current)=>[...current,`컴퓨터 ${settled.owner} · ${settled.label} · 내가 ${settled.gained}점 지불`]);
  },[mode,kanOwners,sichuanSettledKanCount,bloodState]);

  const drawForPlayer=(nextHand:MahjongTile[],nextWall:MahjongTile[],nextOpponents=opponents)=>{
    if(mode==='hongkong'){
      if(hkMatch.finished)setHkMatch(createHongKongMatch(500));
      const bloom=drawHongKongTurn({hand:nextHand,wall:nextWall,flowerWall,collected:flowers[0],flowerChance:0.06,random:Math.random});
      if(!bloom.drawn){settleExhaustiveDraw(nextHand,nextOpponents);return;}
      if(!riichiDeclared)setTemporaryFuriten(false);
      setFlowers((current)=>{const next=current.map((list)=>[...list]);next[0]=bloom.collected;return next;});
      setFlowerWall(bloom.flowerWall);setPlayer(bloom.hand);setWall(bloom.wall);setDrawnId(bloom.drawn.id);
      setMessage(bloom.drawnFlowers.length?`꽃패 ${bloom.drawnFlowers.map((flower)=>flower.glyph).join(' ')}을 옆으로 빼고 보충패를 뽑았습니다 · 한 장을 버리세요`:'새 패를 뽑았습니다 · 한 장을 버리세요');
      return;
    }
    const draw=drawMahjongTile(nextHand,nextWall);if(!draw.drawn){settleExhaustiveDraw(nextHand,nextOpponents);return;}if(!riichiDeclared)setTemporaryFuriten(false);
    setPlayer(draw.hand);setWall(draw.wall);setDrawnId(draw.drawn.id);const permanent=isMahjongFuriten(nextHand,rivers[0],openMelds.length,profile.honors);setMessage(permanent?'새 패를 뽑았습니다 · 내 버림패에 대기패가 있어 후리텐(론 불가, 쯔모 가능)':'새 패를 뽑았습니다 · 한 장을 버리세요');};
  const runComputers=(from:number,nextOpponents:MahjongTile[][],nextWall:MahjongTile[],nextRivers:MahjongTile[][],nextPlayer:MahjongTile[],lockedRiichi=riichiDeclared,blockedFuriten=temporaryFuriten,openCounts=opponentOpenMelds,computerMelds=opponentMelds)=>{
    const hands=nextOpponents.map((hand)=>[...hand]);
    const streams=nextRivers.map((river)=>[...river]);
    const riichiStates=[...opponentRiichi];
    const doubleRiichiStates=[...opponentDoubleRiichi];
    const counts=[...openCounts];
    const meldSets=computerMelds.map((melds)=>melds.map((meld)=>[...meld]));
    const flowerSets=flowers.map((list)=>[...list]);
    let remainingFlowerWall=[...flowerWall];
    const levels=(['easy','normal','expert'] as const);
    let remaining=[...nextWall];

    const persist=()=>{
      setOpponents(hands.map((hand)=>[...hand]));
      setOpponentRiichi([...riichiStates]);
      setOpponentDoubleRiichi([...doubleRiichiStates]);
      setOpponentOpenMelds([...counts]);
      setOpponentMelds(meldSets.map((melds)=>melds.map((meld)=>[...meld])));
      setWall([...remaining]);
      setRivers(streams.map((river)=>[...river]));
      setPlayer(nextPlayer);
      if(mode==='hongkong'){setFlowers(flowerSets.map((list)=>[...list]));setFlowerWall([...remainingFlowerWall]);}
    };

    const finishComputerWin=(winner:number,concealed:MahjongTile[],winningTile:MahjongTile,winType:'ron'|'tsumo',loser?:number,kanRefundTransfers:SichuanKanTransfer[]=[])=>{
      persist();
      const melds=meldSets[winner];const seat=winner+1;
      const result=summariseWin({mode,hand:concealed,melds,winType,winningTile,seat,dealerSeat:matchState.roundIndex%4,roundIndex:matchState.roundIndex,riichi:riichiStates[winner],doubleRiichi:doubleRiichiStates[winner],firstTurn:streams[seat].length===0,anyCallMade,voidSuit:voidSuits[seat],flowers:flowerSets[seat],doraIndicators,uraIndicators:riichiStates[winner]?deadWallUraIndicators(deadWall,revealedKans):[],activeOpponents:activeSichuanSeats(bloodState).length-1,redFives:rules.redFives,openTanyao:rules.openTanyao,minFaan});
      setRoundResult({winner:seat,method:winType==='ron'?'론':'쯔모',concealed:sortMahjongHand(concealed),melds:melds.map((meld)=>[...meld]),yaku:result.lines.map((line)=>`${line.name} ${line.value}`),grade:result.grade,scoreText:result.scoreText});

      if(mode==='sichuan'){
        const fans=evaluateSichuanFan({hand:concealed,melds,winType});
        const score=sichuanScore({fans,roots:countRoots(concealed,melds),basePoints:1,winType,activeOpponents:activeSichuanSeats(bloodState).length-1});
        const stateBeforeWin=winType==='ron'&&kanRefundTransfers.length?refundSichuanKanTransfers(bloodState,kanRefundTransfers):bloodState;
        const settled=settleSichuanWin(stateBeforeWin,{winner:seat,score,winType,loser:loser===undefined?undefined:loser+1});
        const carriedKanTransfers=kanRefundTransfers.length?sichuanKanTransfers.slice(0,-kanRefundTransfers.length):sichuanKanTransfers;
        const rest=autoPlaySichuanRemainder({state:settled,hands:[nextPlayer,...hands],melds:[openMelds,...meldSets],wall:remaining,rivers:streams,voidSuits,kanTransfers:carriedKanTransfers,basePoints:1,startSeat:seat+1});
        setBloodState(rest.state);setSichuanKanTransfers(rest.kanTransfers);setBloodLog([...(kanRefundTransfers.length?[`호상전포 · 직전 깡 점수 ${kanRefundTransfers.length}건 환급`]:[]),`컴퓨터 ${seat} ${winType==='ron'?'론':'쯔모'} · ${fans.map((fan)=>fan.name).join('·')} ${score.multiplier}배`,...rest.log]);
        setOpponents(rest.hands.slice(1));setWall(rest.wall);setRivers(rest.rivers);
        const delta=rest.state.scores[0]-bloodState.scores[0];
        finish(delta>0?'win':delta<0?'loss':'push',`컴퓨터 ${seat} ${winType==='ron'?'론':'쯔모'} · ${result.grade}\n혈전 ${rest.state.winners.length}명 화료 · 내 점수 ${delta>0?'+':''}${delta}`);
        return;
      }
      if(mode==='hongkong')setHkMatch((current)=>settleHongKongWin(current,{winner:seat,score:hongKongScore({faan:evaluateHongKongFaan({hand:concealed,melds,winType,winningTile,seatWind:seatWindFor(seat,hkMatch.roundIndex%4),roundWind:roundWindFor(hkMatch.roundIndex),flowers:flowerSets[seat],seat}),basePoints:1,winType}),winType,loser:loser===undefined?undefined:loser+1}));
      else if(mode==='chinese')setCnMatch((current)=>settleChineseWin(current,{winner:seat,score:chineseScore({yaku:evaluateChineseYaku({hand:concealed,melds,winType,winningTile,seatWind:seatWindFor(seat,cnMatch.roundIndex%4),roundWind:roundWindFor(cnMatch.roundIndex)}),winType}),winType,loser:loser===undefined?undefined:loser+1}));
      else if(result.riichiScore)setMatchState((current)=>{const next=settleRiichiWin(current,{winner:seat,loser:loser===undefined?undefined:loser+1,score:result.riichiScore!,winType});setRiichiPoints(next.scores[0]);return next;});
      else setMatchState((current)=>advanceRiichiMatch(current,{winner:seat}));
      finish('loss',`컴퓨터 ${seat} ${winType==='ron'?'론':'쯔모'} · ${result.grade}\n${result.lines.map((line)=>`${line.name} ${line.value}`).join(' · ')}`);
    };

    const finishComputerRons=(winners:number[],winningTile:MahjongTile,discarder:number,kanRefundTransfers:SichuanKanTransfer[]=[])=>{
      if(winners.length===1){finishComputerWin(winners[0],[...hands[winners[0]],winningTile],winningTile,'ron',discarder,kanRefundTransfers);return;}
      persist();
      const details=winners.map((winner)=>{
        const seat=winner+1;const concealed=[...hands[winner],winningTile];const melds=meldSets[winner];
        const summary=summariseWin({mode,hand:concealed,melds,winType:'ron',winningTile,seat,dealerSeat:matchState.roundIndex%4,roundIndex:matchState.roundIndex,riichi:riichiStates[winner],doubleRiichi:doubleRiichiStates[winner],firstTurn:streams[seat].length===0,anyCallMade,voidSuit:voidSuits[seat],flowers:flowerSets[seat],doraIndicators,uraIndicators:riichiStates[winner]?deadWallUraIndicators(deadWall,revealedKans):[],activeOpponents:activeSichuanSeats(bloodState).length-1,redFives:rules.redFives,openTanyao:rules.openTanyao,minFaan});
        return {winner,seat,concealed,melds,summary};
      });
      const first=details[0];const names=details.map(({seat})=>`컴퓨터 ${seat}`).join(' · ');
      setRoundResult({winner:first.seat,winners:details.map(({seat})=>seat),method:'론',concealed:sortMahjongHand(first.concealed),melds:first.melds.map((meld)=>[...meld]),yaku:first.summary.lines.map((line)=>`${line.name} ${line.value}`),grade:`${names} 일포다향 · ${first.summary.grade}`,scoreText:first.summary.scoreText});
      if(mode==='sichuan'){
        const ronWinners=details.map(({seat,concealed,melds})=>({seat,score:sichuanScore({fans:evaluateSichuanFan({hand:concealed,melds,winType:'ron'}),roots:countRoots(concealed,melds),basePoints:1,winType:'ron',activeOpponents:activeSichuanSeats(bloodState).length-1})}));
        const stateBeforeRon=kanRefundTransfers.length?refundSichuanKanTransfers(bloodState,kanRefundTransfers):bloodState;
        const settled=settleSichuanMultipleRon(stateBeforeRon,{loser:discarder+1,winners:ronWinners});
        const carriedKanTransfers=kanRefundTransfers.length?sichuanKanTransfers.slice(0,-kanRefundTransfers.length):sichuanKanTransfers;
        const rest=autoPlaySichuanRemainder({state:settled,hands:[nextPlayer,...hands],melds:[openMelds,...meldSets],wall:remaining,rivers:streams,voidSuits,kanTransfers:carriedKanTransfers,basePoints:1,startSeat:first.seat+1});
        setBloodState(rest.state);setSichuanKanTransfers(rest.kanTransfers);setBloodLog([...(kanRefundTransfers.length?[`호상전포 · 직전 깡 점수 ${kanRefundTransfers.length}건 환급`]:[]),`${names} 론 · 일포다향`,...rest.log]);setOpponents(rest.hands.slice(1));setWall(rest.wall);setRivers(rest.rivers);
      }else if(mode==='hongkong'){
        const scored=details.map(({seat,concealed,melds})=>({seat,score:hongKongScore({faan:evaluateHongKongFaan({hand:concealed,melds,winType:'ron',winningTile,seatWind:seatWindFor(seat,hkMatch.roundIndex%4),roundWind:roundWindFor(hkMatch.roundIndex),flowers:flowerSets[seat],seat}),basePoints:1,winType:'ron'})}));
        setHkMatch((current)=>settleHongKongMultipleRon(current,{loser:discarder+1,winners:scored}));
      }else if(mode==='chinese'){
        const scored=details.map(({seat,concealed,melds})=>({seat,score:chineseScore({yaku:evaluateChineseYaku({hand:concealed,melds,winType:'ron',winningTile,seatWind:seatWindFor(seat,cnMatch.roundIndex%4),roundWind:roundWindFor(cnMatch.roundIndex)}),winType:'ron'})}));
        setCnMatch((current)=>settleChineseMultipleRon(current,{loser:discarder+1,winners:scored}));
      }else{
        const scored=details.flatMap(({seat,summary})=>summary.riichiScore?[{seat,score:summary.riichiScore}]:[]);
        if(scored.length)setMatchState((current)=>{const next=settleMultipleRon(current,{winners:scored,discarderSeat:discarder+1});setRiichiPoints(next.scores[0]);return next;});
      }
      finish('loss',`${names} 동시 론 · 내가 아닌 컴퓨터 ${discarder+1}의 ${winningTile.glyph} 방총`);
    };

    const processTurn=(index:number):void=>{
      if(index>=3){persist();setPendingCall(null);drawForPlayer(nextPlayer,remaining,hands);return;}
      if(mode==='hongkong'&&remainingFlowerWall.length){
        const bloom=drawHongKongTurn({hand:hands[index],wall:[],flowerWall:remainingFlowerWall,collected:flowerSets[index+1],flowerChance:0.06,random:Math.random});
        flowerSets[index+1]=bloom.collected;remainingFlowerWall=bloom.flowerWall;
      }
      const turn=playOneComputerTurn(hands[index],remaining,Math.random,{canWin:(handAfter,drawn)=>summariseWin({mode,hand:handAfter,melds:meldSets[index],winType:'tsumo',winningTile:drawn,seat:index+1,dealerSeat:matchState.roundIndex%4,roundIndex:matchState.roundIndex,riichi:riichiStates[index],doubleRiichi:doubleRiichiStates[index],firstTurn:streams[index+1].length===0,anyCallMade,voidSuit:voidSuits[index+1],flowers:flowerSets[index+1],doraIndicators,activeOpponents:activeSichuanSeats(bloodState).length-1,redFives:rules.redFives,openTanyao:rules.openTanyao,minFaan}).allowed,level:levels[index],points:matchState.scores[index+1],riichiRivers:[...(lockedRiichi?[streams[0]]:[]),...riichiStates.flatMap((declared,seat)=>declared&&seat!==index?[streams[seat+1]]:[])],visibleTiles:[...hands[index],...streams.flat(),...meldSets.flat(2)],opponentRiichi:lockedRiichi||riichiStates.some((declared,seat)=>declared&&seat!==index),includeHonors:profile.honors,riichiDeclared:riichiStates[index],openMeldCount:counts[index],openMelds:meldSets[index],requireYaku:mode==='riichi'});
      hands[index]=turn.hand;
      remaining=turn.wall;
      if(turn.riichi){
        doubleRiichiStates[index]=isDoubleRiichiDeclaration(streams[index+1].length,anyCallMade);
        riichiStates[index]=true;
        setMatchState((current)=>({...current,riichiSticks:current.riichiSticks+1,scores:current.scores.map((score,seat)=>seat===index+1?score-1000:score) as RiichiMatchState['scores']}));
      }
      if(turn.win){finishComputerWin(index,turn.hand,turn.winningTile!,'tsumo');return;}
      if(turn.discarded)resolveDiscard(index,turn.discarded,index+1,Boolean(turn.riichi));
      else processTurn(index+1);
    };

    const resolveDiscard=(discarder:number,discarded:MahjongTile,nextComputer:number,declaredNow=false,kanRefundTransfers:SichuanKanTransfer[]=[]):void=>{
      streams[discarder+1].push(discarded);
      const playerOptions=lockedRiichi?[]:getModeCallOptions(mode,nextPlayer,discarded,discarder===2,voidSuits[0]);
      const structurallyRon=canRonMahjong(nextPlayer,discarded,meldCount);
      const permanentFuriten=isMahjongFuriten(nextPlayer,streams[0],meldCount,profile.honors);
      const hasRonYaku=mode!=='riichi'||evaluateBasicRiichiYaku({concealed:[...nextPlayer,discarded],openMelds,riichi:lockedRiichi,doubleRiichi:doubleRiichiDeclared,ippatsu:ippatsuEligible,firstTurn:streams[0].length===0,anyCallMade,winType:'ron',winningTile:discarded,seatWind:seatWindFor(0,matchState.roundIndex%4),roundWind:roundWindFor(matchState.roundIndex)}).length>0;
      const playerRon=structurallyRon&&hasRonYaku&&!blockedFuriten&&!permanentFuriten;
      const reactionOrder=Array.from({length:3},(_,offset)=>(discarder+2+offset)%4).filter((seat)=>seat>0).map((seat)=>seat-1);
      const ronWinners=reactionOrder.filter((candidate)=>{
        if(candidate===discarder)return false;
        const structural=canRonMahjong(hands[candidate],discarded,counts[candidate]);
        if(!structural)return false;
        const furiten=isMahjongFuriten(hands[candidate],streams[candidate+1],counts[candidate],profile.honors);
        const hasYaku=summariseWin({mode,hand:[...hands[candidate],discarded],melds:meldSets[candidate],winType:'ron',winningTile:discarded,seat:candidate+1,dealerSeat:matchState.roundIndex%4,roundIndex:matchState.roundIndex,riichi:riichiStates[candidate],doubleRiichi:doubleRiichiStates[candidate],firstTurn:streams[candidate+1].length===0,anyCallMade,voidSuit:voidSuits[candidate+1],flowers:flowers[candidate+1],doraIndicators,activeOpponents:activeSichuanSeats(bloodState).length-1,redFives:rules.redFives,openTanyao:rules.openTanyao,minFaan}).allowed;
        return hasYaku&&!furiten;
      });
      if(playerRon||playerOptions.length){
        if(!playerRon&&ronWinners.length){finishComputerRons(ronWinners,discarded,discarder,kanRefundTransfers);return;}
        persist();
        setPendingCall({tile:discarded,discarder:discarder+1,nextComputer,options:ronWinners.length?[]:playerOptions,canRon:playerRon,otherRonSeats:ronWinners.map((winner)=>winner+1),onPassRon:ronWinners.length?()=>finishComputerRons(ronWinners,discarded,discarder,kanRefundTransfers):undefined,kanRefundTransfers});
        setMessage(`컴퓨터 ${discarder+1}(${['쉬움','보통','전문가'][discarder]})이 ${discarded.glyph} 버림 · ${playerRon?'론할 수 있어요':'가져올까요?'}${declaredNow?' · 컴퓨터 리치 선언':''}`);
        return;
      }
      if(structurallyRon&&(blockedFuriten||permanentFuriten))setMessage(`${discarded.glyph}은 완성패지만 후리텐이라 론할 수 없습니다 · 쯔모는 가능`);

      if(ronWinners.length){finishComputerRons(ronWinners,discarded,discarder,kanRefundTransfers);return;}

      const callReactions=reactionOrder.flatMap((candidate)=>{
        if(candidate===discarder||riichiStates[candidate])return [];
        const nextSeat=(discarder+2)%4;
        const canChi=candidate+1===nextSeat;
        const allowedCalls=getModeCallOptions(mode,hands[candidate],discarded,canChi,voidSuits[candidate+1]);
        const call=chooseComputerCall(hands[candidate],discarded,canChi,{level:levels[candidate],openMeldCount:counts[candidate],includeHonors:profile.honors,allowedCalls});
        return call?[{candidate,call}]:[];
      });
      const callReaction=chooseCallByPriority(callReactions.map((reaction)=>({...reaction,seat:reaction.candidate+1})),discarder+1);
      if(callReaction){
        const {candidate:caller,call}=callReaction;
          const called=applyMahjongCall(hands[caller],discarded,call);
          streams[discarder+1].pop();
          counts[caller]++;
          meldSets[caller].push(called.meld);
          let callHand=called.hand;
          let callKanTransfers:SichuanKanTransfer[]=[];
          if(call.kind==='kan'){
            if(mode==='sichuan'){
              const settled=settleSichuanKan(bloodState,{kanner:caller+1,kind:'minkan',discarder:discarder+1,basePoints:1});
              setBloodState(settled.state);
              setSichuanKanTransfers((current)=>[...current,...settled.transfers]);
              setSichuanLastKanTransfers(settled.transfers);
              callKanTransfers=settled.transfers;
              setSichuanSettledKanCount((count)=>count+1);
              setBloodLog((current)=>[...current,`컴퓨터 ${caller+1} · ${settled.label} · ${settled.gained}점`]);
            }
            const supplement=drawModeSupplement(mode,callHand,remaining,deadWall,revealedKans);
            if(!supplement.drawn){persist();settleExhaustiveDraw(nextPlayer,hands);return;}
            callHand=supplement.hand;
            remaining=supplement.wall;
            setDeadWall(supplement.deadWall);
            setRevealedKans((value)=>value+1);
            setKanOwners((current)=>[...current,caller+1]);
          }
          const thrown=chooseComputerDiscard(callHand,{level:levels[caller],openMeldCount:counts[caller],includeHonors:profile.honors,riichiRivers:[...(lockedRiichi?[streams[0]]:[]),...riichiStates.flatMap((declared,seat)=>declared&&seat!==caller?[streams[seat+1]]:[])],visibleTiles:[...callHand,...streams.flat(),...meldSets.flat(2)]});
          hands[caller]=sortMahjongHand(callHand.filter((candidate)=>candidate.id!==thrown.id));
          setIppatsuEligible(false);
          setMessage(`컴퓨터 ${caller+1}이 컴퓨터 ${discarder+1}의 패로 ${call.kind==='chi'?'치':call.kind==='pon'?'퐁':'깡'} · ${thrown.glyph} 버림`);
          resolveDiscard(caller,thrown,caller+1,false,callKanTransfers);
          return;
      }
      processTurn(nextComputer);
    };

    processTurn(from);
  };
  useEffect(()=>{
    if(phase!=='playing'||openingComputerSeat===null)return;
    const first=openingComputerSeat;
    setOpeningComputerSeat(null);
    runComputers(first,opponents,wall,rivers,player,false,false,[0,0,0],[[],[],[]]);
  },[phase,openingComputerSeat]);
  const riichiChoices=mode==='riichi'&&canDeclareRiichiNow({points:riichiPoints,closed:openMelds.length===0,wallRemaining:wall.length,alreadyDeclared:riichiDeclared})?getRiichiDiscardOptions(player,profile.honors):[];
  // 깡은 패를 뽑은 직후에만, 국당 네 번까지. 리치 중에는 대기가 바뀌지 않는 암깡만 허용합니다.
  const drawnTileNow=player.find((tile)=>tile.id===drawnId)??null;
  const kanOptions:MahjongKanOption[]=phase!=='playing'||pendingCall||!drawnId||revealedKans>=MAX_KAN_PER_ROUND||!wall.length?[]
    :[...getAnkanOptions(player),...getKakanOptions(player,openMelds)].filter((option)=>{
      if(mode==='sichuan'&&option.tiles[0].suit===voidSuits[0])return false;
      if(!riichiDeclared)return true;
      if(option.kind!=='ankan'||!drawnTileNow)return false;
      if(option.tiles[0].suit!==drawnTileNow.suit||option.tiles[0].value!==drawnTileNow.value)return false;
      return ankanKeepsWait(player.filter((tile)=>tile.id!==drawnTileNow.id),drawnTileNow,meldCount,profile.honors);
    });

  // 구종구패: 첫 순번에 1·9·자패가 아홉 종류 이상이면 유국을 선언할 수 있습니다.
  const canAbortNineTerminals=mode==='riichi'&&phase==='playing'&&!pendingCall&&!!drawnId&&canDeclareNineTerminals(player,turnsTaken===0,anyCallMade);
  const declareNineTerminals=()=>{
    if(!canAbortNineTerminals)return;
    settleAbortiveDraw('구종구패',`1·9·자패 ${countNineTerminals(player)}종류로 유국을 선언했습니다`);
  };

  const declareKan=(option:MahjongKanOption)=>{
    if(phase!=='playing'||pendingCall)return;
    if(option.kind==='kakan'){
      const added=option.tiles[option.tiles.length-1];
      // 창깡: 가깡하려는 패로 상대가 완성할 수 있으면 그 자리에서 론이 성립합니다.
      const robber=opponents.findIndex((hand,index)=>canRobKan(hand,added,opponentOpenMelds[index])&&(mode!=='riichi'||evaluateBasicRiichiYaku({concealed:[...hand,added],openMelds:opponentMelds[index],riichi:opponentRiichi[index],winType:'ron',winningTile:added,robbingKan:true,seatWind:seatWindFor(index+1,matchState.roundIndex%4),roundWind:roundWindFor(matchState.roundIndex)}).length>0));
      if(robber>=0){
        const melds=opponentMelds[robber];const winningHand=[...opponents[robber],added];
        const yaku=mode==='riichi'?evaluateBasicRiichiYaku({concealed:winningHand,openMelds:melds,riichi:opponentRiichi[robber],winType:'ron',winningTile:added,robbingKan:true,seatWind:seatWindFor(robber+1,matchState.roundIndex%4),roundWind:roundWindFor(matchState.roundIndex)}):[];
        const fu=mode==='riichi'?calculateRiichiFu({concealed:winningHand,openMelds:melds,winningTile:added,winType:'ron',seatWind:seatWindFor(robber+1,matchState.roundIndex%4),roundWind:roundWindFor(matchState.roundIndex)}):null;
        const tiles=[...winningHand,...melds.flat()];
        const visible=countMahjongDora(tiles,deadWallDoraIndicators(deadWall,revealedKans));
        const ura=opponentRiichi[robber]?countMahjongDora(tiles,deadWallUraIndicators(deadWall,revealedKans)):0;
        const yakuman=countYakumanMultiplier(yaku);const han=yakuman?0:yaku.reduce((sum,item)=>sum+item.han,0)+visible+ura;
        const score=mode==='riichi'&&(fu||yakuman)?calculateRiichiScore({han,fu:fu?.fu??0,dealer:matchState.roundIndex%4===robber+1,winType:'ron',yakumanCount:yakuman}):null;
        if(score)setMatchState((current)=>{const next=settleRiichiWin(current,{winner:robber+1,loser:0,score,winType:'ron'});setRiichiPoints(next.scores[0]);return next;});
        else setMatchState((current)=>advanceRiichiMatch(current,{winner:robber+1}));
        finish('loss',`창깡! 컴퓨터 ${robber+1}이 내 가깡 패 ${added.glyph}을 가로챘습니다${yaku.length?` · ${yaku.map((item)=>item.name).join(' · ')}`:''}`);
        return;
      }
    }
    // 가깡이 창깡으로 취소되지 않은 뒤에만 쓰촨 과수 점수를 지급합니다.
    if(mode==='sichuan'){
      const settled=settleSichuanKan(bloodState,{kanner:0,kind:option.kind,basePoints:1});
      setBloodState(settled.state);
      setSichuanKanTransfers((current)=>[...current,...settled.transfers]);
      setSichuanLastKanTransfers(settled.transfers);
      setBloodLog((current)=>[...current,`${settled.label} · ${settled.gained}점 받음`]);
    }
    const applied=option.kind==='ankan'?applyAnkan(player,option):applyKakan(player,openMelds,option);
    if(option.kind==='ankan')setConcealedKans((current)=>[...current,option.tiles]);
    else setOpenMelds((applied as ReturnType<typeof applyKakan>).openMelds);
    // 왕패는 리치마작에만 있습니다. 나머지 종목은 산의 마지막 패를 영상패로 가져옵니다.
    const supplement=drawModeSupplement(mode,applied.hand,wall,deadWall,revealedKans);
    setPlayer(supplement.hand);setWall(supplement.wall);setDeadWall(supplement.deadWall);
    setDrawnId(supplement.drawn?.id??'');setAfterKanDraw(true);setIppatsuEligible(false);setRevealedKans((value)=>value+1);setKanOwners((current)=>[...current,0]);setAnyCallMade(true);
    const indicator=deadWallDoraIndicators(supplement.deadWall,revealedKans+1).slice(-1)[0];
    setMessage(`${option.kind==='ankan'?'암깡':'가깡'} ${option.tiles[0].glyph} · 영상패 ${supplement.drawn?.glyph??'없음'}${indicator?` · 깡도라 표시 ${indicator.glyph}`:''}`);
  };
  const discard=(tile:MahjongTile)=>{if(phase!=='playing'||pendingCall)return;if(choosingVoid){setMessage('먼저 버릴 종류(정결)를 하나 고르세요');return;}if(riichiDeclared&&tile.id!==drawnId)return;if(mode==='sichuan'){const forced=nextVoidDiscard(player,voidSuits[0]);if(forced&&tile.suit!==voidSuits[0]){setMessage(`정결한 ${suitNames[voidSuits[0]]}를 먼저 다 버려야 합니다`);return;}}const declaration=choosingRiichi&&riichiChoices.some((choice)=>choice.tile.id===tile.id);const doubleDeclaration=declaration&&turnsTaken===0&&!anyCallMade;if(choosingRiichi&&!declaration)return;setAfterKanDraw(false);setTurnsTaken((value)=>value+1);const mine=discardTile(player,tile.id);const nextRivers=rivers.map((river)=>[...river]);nextRivers[0].push(mine.discarded);if(declaration){setRiichiDeclared(true);setDoubleRiichiDeclared(doubleDeclaration);setChoosingRiichi(false);setRiichiPoints((value)=>value-1000);setRiichiMarker(mine.discarded.id);setIppatsuEligible(true);setMessage(`${doubleDeclaration?'더블리치':'리치'}! ${mine.discarded.glyph}을 옆으로 놓고 1,000점을 공탁했습니다`);}else if(riichiDeclared)setIppatsuEligible(false);const computerRons=opponents.map((hand,index)=>({hand,index})).filter(({hand,index})=>(mode==='sichuan'?bloodState.finished[index+1]?false:canModeWinShape('sichuan',[...hand,mine.discarded],opponentMelds[index],voidSuits[index+1]):canRonMahjong(hand,mine.discarded,opponentOpenMelds[index]))&&summariseWin({mode,hand:[...hand,mine.discarded],melds:opponentMelds[index],winType:'ron',winningTile:mine.discarded,seat:index+1,dealerSeat:matchState.roundIndex%4,roundIndex:matchState.roundIndex,riichi:opponentRiichi[index],doubleRiichi:opponentDoubleRiichi[index],firstTurn:rivers[index+1].length===0,anyCallMade,voidSuit:voidSuits[index+1],flowers:flowers[index+1],doraIndicators,activeOpponents:activeSichuanSeats(bloodState).length-1,redFives:rules.redFives,openTanyao:rules.openTanyao,minFaan}).allowed).map(({index})=>index);const computerRon=computerRons[0]??-1;setPlayer(mine.hand);setDrawnId('');if(computerRon>=0){setRivers(nextRivers);if(declaration){setRiichiDeclared(false);setDoubleRiichiDeclared(false);setRiichiPoints((value)=>value+1000);}
      const melds=opponentMelds[computerRon];const winningHand=[...opponents[computerRon],mine.discarded];const seat=computerRon+1;
      const result=summariseWin({mode,hand:winningHand,melds,winType:'ron',winningTile:mine.discarded,seat,dealerSeat:matchState.roundIndex%4,roundIndex:matchState.roundIndex,riichi:opponentRiichi[computerRon],voidSuit:voidSuits[seat],flowers:flowers[seat],doraIndicators,uraIndicators:opponentRiichi[computerRon]?deadWallUraIndicators(deadWall,revealedKans):[],activeOpponents:activeSichuanSeats(bloodState).length-1});
      const ronWinnerNames=computerRons.map((index)=>`컴퓨터 ${index+1}`).join(' · ');
      setRoundResult({winner:seat,winners:computerRons.map((index)=>index+1),method:'론',concealed:sortMahjongHand(winningHand),melds:melds.map((meld)=>[...meld]),yaku:result.lines.map((line)=>`${line.name} ${line.value}`),grade:computerRons.length>1?`${ronWinnerNames} 일포다향 · ${result.grade}`:result.grade,scoreText:result.scoreText});

      if(mode==='sichuan'){
        // 혈전도저: 컴퓨터가 화료해도 국은 계속됩니다.
        const ronWinners=computerRons.map((index)=>{const hand=[...opponents[index],mine.discarded];const winnerMelds=opponentMelds[index];const winnerFans=evaluateSichuanFan({hand,melds:winnerMelds,winType:'ron'});const winnerScore=sichuanScore({fans:winnerFans,roots:countRoots(hand,winnerMelds),basePoints:1,winType:'ron',activeOpponents:activeSichuanSeats(bloodState).length-1});return {seat:index+1,index,fans:winnerFans,score:winnerScore};});
        const fans=ronWinners[0].fans;
        const score=ronWinners[0].score;
        const ronBaseState=afterKanDraw?refundSichuanKanTransfers(bloodState,sichuanLastKanTransfers):bloodState;
        const settled=ronWinners.length>1?settleSichuanMultipleRon(ronBaseState,{loser:0,winners:ronWinners.map(({seat,score})=>({seat,score}))}):settleSichuanWin(ronBaseState,{winner:seat,score,winType:'ron',loser:0});
        const carriedKanTransfers=afterKanDraw?sichuanKanTransfers.slice(0,-sichuanLastKanTransfers.length):sichuanKanTransfers;
        const rest=autoPlaySichuanRemainder({state:settled,hands:[mine.hand,...opponents],melds:[openMelds,...opponentMelds],wall,rivers:nextRivers,voidSuits,kanTransfers:carriedKanTransfers,basePoints:1,startSeat:seat+1});
        const ronLabel=ronWinners.map((winner)=>`컴퓨터 ${winner.index+1}`).join('·');
        setBloodState(rest.state);setSichuanKanTransfers(rest.kanTransfers);setBloodLog([...(afterKanDraw?['깡 직후 방총 · 방금 받은 깡 점수 반환']:[]),`${ronLabel} 론 · ${fans.map((fan)=>fan.name).join('·')} ${score.multiplier}배`,...rest.log]);
        setOpponents(rest.hands.slice(1));setWall(rest.wall);setRivers(rest.rivers);
        const delta=rest.state.scores[0]-bloodState.scores[0];
        finish(delta>0?'win':delta<0?'loss':'push',`${ronLabel} 론${ronWinners.length>1?' · 일포다향':''} · ${result.grade}\n혈전 ${rest.state.winners.length}명 화료 · 내 점수 ${delta>0?'+':''}${delta}`);
        return;
      }
      if(mode==='hongkong'){
        const winners=computerRons.map((index)=>{const winnerSeat=index+1;const hand=[...opponents[index],mine.discarded];const winnerMelds=opponentMelds[index];return {seat:winnerSeat,score:hongKongScore({faan:evaluateHongKongFaan({hand,melds:winnerMelds,winType:'ron',winningTile:mine.discarded,seatWind:seatWindFor(winnerSeat,hkMatch.roundIndex%4),roundWind:roundWindFor(hkMatch.roundIndex),flowers:flowers[winnerSeat],seat:winnerSeat}),basePoints:1,winType:'ron'})};});
        setHkMatch((current)=>winners.length>1?settleHongKongMultipleRon(current,{loser:0,winners}):settleHongKongWin(current,{winner:seat,score:winners[0].score,winType:'ron',loser:0}));
      }
      else if(mode==='chinese'){
        const winners=computerRons.map((index)=>{const winnerSeat=index+1;const hand=[...opponents[index],mine.discarded];const winnerMelds=opponentMelds[index];return {seat:winnerSeat,score:chineseScore({yaku:evaluateChineseYaku({hand,melds:winnerMelds,winType:'ron',winningTile:mine.discarded,seatWind:seatWindFor(winnerSeat,cnMatch.roundIndex%4),roundWind:roundWindFor(cnMatch.roundIndex)}),winType:'ron'})};});
        setCnMatch((current)=>winners.length>1?settleChineseMultipleRon(current,{loser:0,winners}):settleChineseWin(current,{winner:seat,score:winners[0].score,winType:'ron',loser:0}));
      }
      else if(result.riichiScore)setMatchState((current)=>{
        const winners=computerRons.flatMap((index)=>{const winnerSeat=index+1;const hand=[...opponents[index],mine.discarded];const summary=summariseWin({mode:'riichi',hand,melds:opponentMelds[index],winType:'ron',winningTile:mine.discarded,seat:winnerSeat,dealerSeat:current.roundIndex%4,roundIndex:current.roundIndex,riichi:opponentRiichi[index],doraIndicators,uraIndicators:opponentRiichi[index]?deadWallUraIndicators(deadWall,revealedKans):[],redFives:rules.redFives,openTanyao:rules.openTanyao});return summary.riichiScore?[{seat:winnerSeat,score:summary.riichiScore}]:[];});
        const next=winners.length>1?settleMultipleRon(current,{winners,discarderSeat:0}):settleRiichiWin(current,{winner:seat,loser:0,score:result.riichiScore!,winType:'ron'});setRiichiPoints(next.scores[0]);return next;
      });
      else setMatchState((current)=>advanceRiichiMatch(current,{winner:seat}));
      const ronNames=computerRons.map((index)=>`컴퓨터 ${index+1}`).join('·');
      finish('loss',`${ronNames} 론${computerRons.length>1?' · 일포다향':''} · 내가 버린 ${mine.discarded.glyph}으로 완성 · ${result.grade}\n${result.lines.map((line)=>`${line.name} ${line.value}`).join(' · ')}`);
      return;}if(declaration)setMatchState((current)=>({...current,riichiSticks:current.riichiSticks+1,scores:[current.scores[0]-1000,current.scores[1],current.scores[2],current.scores[3]]}));const levels=(['easy','normal','expert'] as const);const calls=opponents.map((hand,index)=>opponentRiichi[index]?null:chooseComputerCall(hand,mine.discarded,index===0,{level:levels[index],openMeldCount:opponentOpenMelds[index],includeHonors:profile.honors,allowedCalls:getModeCallOptions(mode,hand,mine.discarded,index===0,voidSuits[index+1])}));const callReaction=chooseCallByPriority(calls.flatMap((call,index)=>call?[{seat:index+1,candidate:index,call}]:[]),0);const caller=callReaction?.candidate??-1;if(caller>=0){const call=callReaction!.call;const called=applyMahjongCall(opponents[caller],mine.discarded,call);const hands=opponents.map((hand)=>[...hand]);const counts=[...opponentOpenMelds];counts[caller]++;const computerMeldSets=opponentMelds.map((melds)=>melds.map((meld)=>[...meld]));computerMeldSets[caller].push(called.meld);setOpponentMelds(computerMeldSets);setAnyCallMade(true);setMyDiscardClaimed(true);if(call.kind==='kan')setKanOwners((current)=>[...current,caller+1]);let remaining=[...wall],callHand=called.hand;if(call.kind==='kan'){const supplement=mode==='riichi'?drawReplacementTile(callHand,remaining,deadWall,revealedKans):{...drawSichuanReplacement(callHand,remaining),deadWall};callHand=supplement.hand;remaining=supplement.wall;setDeadWall(supplement.deadWall);setRevealedKans((value)=>value+1);}const thrown=chooseComputerDiscard(callHand,{level:levels[caller],openMeldCount:counts[caller],includeHonors:profile.honors,riichiRivers:[...(riichiDeclared||declaration?[nextRivers[0]]:[]),...opponentRiichi.flatMap((declared,seat)=>declared&&seat!==caller?[nextRivers[seat+1]]:[])],visibleTiles:[...callHand,...nextRivers.flat(),...computerMeldSets.flat(2)]});hands[caller]=sortMahjongHand(callHand.filter((candidate)=>candidate.id!==thrown.id));nextRivers[0].pop();nextRivers[caller+1].push(thrown);setOpponentOpenMelds(counts);setOpponents(hands);setRivers(nextRivers);setPlayer(mine.hand);setDrawnId('');setIppatsuEligible(false);setMessage(`컴퓨터 ${caller+1}(${['쉬움','보통','전문가'][caller]}) ${call.kind==='chi'?'치':call.kind==='pon'?'퐁':'깡'} · ${thrown.glyph} 버림`);runComputers(caller+1,hands,remaining,nextRivers,mine.hand,declaration||riichiDeclared,temporaryFuriten,counts,computerMeldSets);return;}runComputers(0,opponents,wall,nextRivers,mine.hand,declaration||riichiDeclared);};
  const passCall=()=>{if(!pendingCall)return;const next=pendingCall.nextComputer;const passedRon=pendingCall.canRon;const onPassRon=pendingCall.onPassRon;if(passedRon){setTemporaryFuriten(true);setMessage(riichiDeclared?'론을 넘겨 리치 후리텐 · 이번 판에는 더 이상 론할 수 없습니다':'론을 넘겨 임시 후리텐 · 다음에 내 패를 뽑을 때까지 론할 수 없습니다');}setPendingCall(null);if(onPassRon){onPassRon();return;}runComputers(next,opponents,wall,rivers,player,riichiDeclared,passedRon||temporaryFuriten);};
  const claim=(option:MahjongCallOption)=>{if(!pendingCall)return;setAnyCallMade(true);if(option.kind==='kan')setKanOwners((current)=>[...current,0]);setIppatsuEligible(false);const called=applyMahjongCall(player,pendingCall.tile,option);const nextRivers=rivers.map((river)=>[...river]);nextRivers[pendingCall.discarder].pop();const melds=[...openMelds,called.meld];setOpenMelds(melds);setRivers(nextRivers);setPendingCall(null);if(option.kind==='kan'){if(mode==='sichuan'){const settled=settleSichuanKan(bloodState,{kanner:0,kind:'minkan',discarder:pendingCall.discarder,basePoints:1});setBloodState(settled.state);setSichuanKanTransfers((current)=>[...current,...settled.transfers]);setSichuanLastKanTransfers(settled.transfers);setBloodLog((current)=>[...current,`${settled.label} · ${settled.gained}점 받음`]);}const draw=drawModeSupplement(mode,called.hand,wall,deadWall,revealedKans);if(!draw.drawn){settleExhaustiveDraw(called.hand,opponents);return;}setPlayer(draw.hand);setWall(draw.wall);setDeadWall(draw.deadWall);setRevealedKans((value)=>value+1);setDrawnId(draw.drawn.id);setAfterKanDraw(true);setMessage(`깡! 보충패 ${draw.drawn.glyph}을 뽑았습니다 · 한 장을 버리세요`);}else{setPlayer(called.hand);setDrawnId('');setMessage(`${option.kind==='chi'?'치':'퐁'}! 공개 몸통을 만들었습니다 · 한 장을 버리세요`);}};
  const opponentMeldView=(index:number)=><>{mode==='sichuan'&&<Text style={styles.mahjongVoidNote}>{sichuanSeatStatus(index+1)}</Text>}{opponentMelds[index]?.length?<View style={styles.mahjongOpponentMeldRow}>{opponentMelds[index].map((meld,meldIndex)=><View key={meldIndex} style={styles.mahjongOpponentOpenMeld}>{meld.map((tile)=><Text key={tile.id} style={styles.mahjongOpponentMeldGlyph}>{tile.glyph}</Text>)}</View>)}</View>:null}</>;
  const sichuanSeatStatus=(seat:number)=>`${seat===0?'나':`C${seat}`} · 정결 ${suitNames[voidSuits[seat]]} · ${bloodState.finished[seat]?'화료 후 이탈':'진행 중'} · ${bloodState.scores[seat]>0?'+':''}${bloodState.scores[seat]}점 · 깡 ${sichuanKanTransfers.filter((transfer)=>transfer.to===seat).length}건`;
  const doraIndicators=mode==='riichi'?deadWallDoraIndicators(deadWall,revealedKans):[];const uraIndicators=mode==='riichi'&&riichiDeclared?deadWallUraIndicators(deadWall,revealedKans):[];
  const structuralWin=isModeWinningShape(mode,player,meldCount);const drawnTile=player.find((tile)=>tile.id===drawnId)??player[player.length-1];// 종목마다 화료 조건이 다릅니다. 리치는 역, 홍콩은 3번, 중국식은 8점, 사천은 정결.
  const tsumoSummary:MahjongWinSummary|null=structuralWin?summariseWin({mode,hand:player,melds:openMelds,concealedKans,winType:'tsumo',winningTile:drawnTile,seat:0,dealerSeat:matchState.roundIndex%4,roundIndex:matchState.roundIndex,riichi:riichiDeclared,doubleRiichi:doubleRiichiDeclared,ippatsu:ippatsuEligible,firstTurn:turnsTaken===0,anyCallMade,afterKan:afterKanDraw,voidSuit:voidSuits[0],doraIndicators,uraIndicators,lastTile:wall.length===0,redFives:rules.redFives,openTanyao:rules.openTanyao,minFaan}):null;
  const win=structuralWin&&(tsumoSummary?.allowed??false);
  const beginnerYakuHints=mode==='riichi'?suggestBeginnerRiichiYaku(player,meldCount,seatWindFor(0,matchState.roundIndex%4),roundWindFor(matchState.roundIndex)):[];
  const activeRiichiRivers=mode==='riichi'?opponentRiichi.flatMap((declared,index)=>declared?[rivers[index+1]]:[]):[];
  const visibleMahjongTiles=[...player,...rivers.flat(),...openMelds.flat(),...opponentMelds.flat(2)];
  const discardGuides=mode==='riichi'&&phase==='playing'&&!pendingCall&&!riichiDeclared
    ?suggestRiichiDiscards(player,{openMeldCount:meldCount,includeHonors:profile.honors,visibleTiles:visibleMahjongTiles,limit:3})
    :[];
  const permanentFuritenNow=mode==='riichi'&&phase==='playing'&&getMahjongWaits(player,meldCount,profile.honors).length>0&&isMahjongFuriten(player,rivers[0],meldCount,profile.honors);
  const dangerGroups={safe:[] as MahjongTile[],caution:[] as MahjongTile[],danger:[] as MahjongTile[]};
  if(activeRiichiRivers.length)new Map(player.map((tile)=>[`${tile.suit}${tile.value}`,tile])).forEach((tile)=>{const score=tileDangerScore(tile,{riichiRivers:activeRiichiRivers,visibleTiles:visibleMahjongTiles});if(score===0)dangerGroups.safe.push(tile);else if(score<30)dangerGroups.caution.push(tile);else dangerGroups.danger.push(tile);});
  const quit=()=>{if(phase==='playing')onSettle(selectedBet,'loss','중도 종료');onBack();};
  const winWithRiichi=(text:string)=>{
    const winType:'tsumo'|'ron'=pendingCall?'ron':'tsumo';
    const winningTile=pendingCall?.tile??player.find((tile)=>tile.id===drawnId)??player[player.length-1];
    const concealed=pendingCall?[...player,pendingCall.tile]:player;
    const otherRonSeats=winType==='ron'?(pendingCall?.otherRonSeats??[]):[];
    const result=summariseWin({mode,hand:concealed,melds:openMelds,concealedKans,winType,winningTile,seat:0,dealerSeat:matchState.roundIndex%4,roundIndex:matchState.roundIndex,riichi:riichiDeclared,doubleRiichi:doubleRiichiDeclared,ippatsu:ippatsuEligible,firstTurn:turnsTaken===0,anyCallMade,afterKan:afterKanDraw&&winType==='tsumo',voidSuit:voidSuits[0],doraIndicators,uraIndicators,lastTile:wall.length===0,redFives:rules.redFives,openTanyao:rules.openTanyao,minFaan});
    if(!result.allowed){setMessage(result.blockedReason);return;}

    // 종목마다 국 진행과 점수 이동 방식이 다릅니다.
    if(mode==='riichi'){
      const score=result.riichiScore;
      if(score)setMatchState((current)=>{
        const others=otherRonSeats.flatMap((seat)=>{const index=seat-1;const hand=[...opponents[index],winningTile];const summary=summariseWin({mode:'riichi',hand,melds:opponentMelds[index],winType:'ron',winningTile,seat,dealerSeat:current.roundIndex%4,roundIndex:current.roundIndex,riichi:opponentRiichi[index],doraIndicators,uraIndicators:opponentRiichi[index]?deadWallUraIndicators(deadWall,revealedKans):[],redFives:rules.redFives,openTanyao:rules.openTanyao});return summary.riichiScore?[{seat,score:summary.riichiScore}]:[];});
        const next=others.length&&pendingCall?settleMultipleRon(current,{winners:[{seat:0,score},...others],discarderSeat:pendingCall.discarder}):settleRiichiWin(current,{winner:0,score,winType,loser:pendingCall?.discarder});setRiichiPoints(next.scores[0]);return next;
      });
      else setMatchState((current)=>advanceRiichiMatch(current,{winner:0}));
    }else if(mode==='hongkong'){
      const faan=evaluateHongKongFaan({hand:concealed,melds:openMelds,concealedKans,winType,winningTile,seatWind:seatWindFor(0,hkMatch.roundIndex%4),roundWind:roundWindFor(hkMatch.roundIndex),flowers:flowers[0],seat:0});
      const playerScore=hongKongScore({faan,basePoints:1,winType});
      setHkMatch((current)=>{
        const others=otherRonSeats.map((seat)=>{const index=seat-1;const hand=[...opponents[index],winningTile];return {seat,score:hongKongScore({faan:evaluateHongKongFaan({hand,melds:opponentMelds[index],winType:'ron',winningTile,seatWind:seatWindFor(seat,current.roundIndex%4),roundWind:roundWindFor(current.roundIndex),flowers:flowers[seat],seat}),basePoints:1,winType:'ron'})};});
        return others.length&&pendingCall?settleHongKongMultipleRon(current,{loser:pendingCall.discarder,winners:[{seat:0,score:playerScore},...others]}):settleHongKongWin(current,{winner:0,score:playerScore,winType,loser:pendingCall?.discarder});
      });
    }else if(mode==='chinese'){
      const yaku=evaluateChineseYaku({hand:concealed,melds:openMelds,concealedKans,winType,winningTile,seatWind:seatWindFor(0,cnMatch.roundIndex%4),roundWind:roundWindFor(cnMatch.roundIndex)});
      const playerScore=chineseScore({yaku,winType});
      setCnMatch((current)=>{
        const others=otherRonSeats.map((seat)=>{const index=seat-1;const hand=[...opponents[index],winningTile];return {seat,score:chineseScore({yaku:evaluateChineseYaku({hand,melds:opponentMelds[index],winType:'ron',winningTile,seatWind:seatWindFor(seat,current.roundIndex%4),roundWind:roundWindFor(current.roundIndex)}),winType:'ron'})};});
        return others.length&&pendingCall?settleChineseMultipleRon(current,{loser:pendingCall.discarder,winners:[{seat:0,score:playerScore},...others]}):settleChineseWin(current,{winner:0,score:playerScore,winType,loser:pendingCall?.discarder});
      });
    }else if(mode==='sichuan'){
      // 혈전도저: 내가 화료해도 국이 끝나지 않습니다. 남은 사람끼리 이어서 둡니다.
      const fans=evaluateSichuanFan({hand:concealed,melds:openMelds,winType,afterKan:afterKanDraw&&winType==='tsumo'});
      const score=sichuanScore({fans,roots:countRoots(concealed,openMelds),basePoints:1,winType,activeOpponents:activeSichuanSeats(bloodState).length-1});
      const others=otherRonSeats.map((seat)=>{const index=seat-1;const hand=[...opponents[index],winningTile];const melds=opponentMelds[index];return {seat,score:sichuanScore({fans:evaluateSichuanFan({hand,melds,winType:'ron'}),roots:countRoots(hand,melds),basePoints:1,winType:'ron',activeOpponents:activeSichuanSeats(bloodState).length-1})};});
      const kanRefundTransfers=winType==='ron'?(pendingCall?.kanRefundTransfers??[]):[];
      const stateBeforeWin=kanRefundTransfers.length?refundSichuanKanTransfers(bloodState,kanRefundTransfers):bloodState;
      const settled=others.length&&pendingCall?settleSichuanMultipleRon(stateBeforeWin,{loser:pendingCall.discarder,winners:[{seat:0,score},...others]}):settleSichuanWin(stateBeforeWin,{winner:0,score,winType,loser:pendingCall?.discarder});
      const carriedKanTransfers=kanRefundTransfers.length?sichuanKanTransfers.slice(0,-kanRefundTransfers.length):sichuanKanTransfers;
      const rest=autoPlaySichuanRemainder({
        state:settled,
        hands:[player,...opponents],
        melds:[openMelds,...opponentMelds],
        wall,rivers,voidSuits,kanTransfers:carriedKanTransfers,basePoints:1,startSeat:1,
      });
      setBloodState(rest.state);
      setSichuanKanTransfers(rest.kanTransfers);
      setBloodLog([...(kanRefundTransfers.length?[`호상전포 · 컴퓨터 ${pendingCall?.discarder}의 직전 깡 점수 환급`]:[]),...rest.log]);
      setOpponents(rest.hands.slice(1));
      setWall(rest.wall);
      setRivers(rest.rivers);
    }

    setRoundResult({
      winner:0,
      winners:otherRonSeats.length?[0,...otherRonSeats]:undefined,
      method:winType==='ron'?'론':'쯔모',
      concealed:sortMahjongHand(concealed),
      melds:[...openMelds.map((meld)=>[...meld]),...concealedKans.map((meld)=>[...meld])],
      yaku:result.lines.map((line)=>`${line.name} ${line.value}`),
      grade:otherRonSeats.length?`나 · ${otherRonSeats.map((seat)=>`컴퓨터 ${seat}`).join(' · ')} 일포다향 · ${result.grade}`:result.grade,
      scoreText:result.scoreText,
    });
    const detail=result.lines.map((line)=>`${line.name} ${line.value}: ${line.detail}`).join('\n');
    const sharedRon=otherRonSeats.length?` · 컴퓨터 ${otherRonSeats.join('·컴퓨터 ')}도 함께 론(일포다향)`:'';
    finish('win',`${text}${sharedRon} · ${result.grade}\n${detail}\n${result.scoreText}`);
  };
  const turnGuide=phase==='ready'
    ? {step:'시작 전',title:'패 13장 받기를 누르세요',detail:'코인이 차감되고 첫 패를 받은 뒤, 한 장을 뽑고 한 장을 버리는 플레이가 시작됩니다.'}
    : phase==='result'
      ? {step:'한 국 종료',title:'결과와 성립한 역을 확인하세요',detail:matchState.finished?'최종 순위가 정해졌습니다. 반장전 결과를 확인할 수 있습니다.':'다음 국을 누르면 현재 점수를 이어서 진행합니다.'}
      : choosingVoid
        ? {step:'1단계 · 정결',title:'가장 적게 가진 종류를 고르세요',detail:'선택한 만수·통수·삭수는 전부 버려야 합니다. 그 종류가 손에 남아 있으면 이길 수 없습니다.'}
        : pendingCall
          ? {step:'상대 버림패',title:`${pendingCall.tile.glyph}에 반응할지 고르세요`,detail:'론은 즉시 승리, 치·퐁·깡은 공개 몸통을 만듭니다. 필요하지 않다면 넘기기를 누르세요.'}
          : choosingRiichi
            ? {step:'리치 선언',title:'노랗게 표시된 패를 하나 버리세요',detail:'각 선택지 아래에 그 패를 버렸을 때 기다리는 패가 표시됩니다. 선언 뒤에는 새로 뽑은 패만 버립니다.'}
            : {step:'내 차례',title:'밝게 올라온 패를 확인하고 한 장을 버리세요',detail:mode==='sichuan'?`정결한 ${suitNames[voidSuits[0]]}가 남아 있다면 그 종류부터 버리세요.`:'이어질 숫자나 같은 그림을 남기고, 몸통을 만들기 어려운 패를 누르세요.'};
  return <View style={styles.detailScreen}><ScreenHeader title={profile.title} onBack={quit}/><ScrollView contentContainerStyle={styles.mahjongPage}><View style={styles.mahjongTable}><View style={styles.mahjongOpponent}><Text style={styles.mahjongSeat}>북 · 컴퓨터 3 · 전문가</Text><View style={styles.mahjongBacks}>{Array.from({length:opponents[2]?.length??13},(_,i)=><View key={i} style={styles.mahjongBack}/>)}</View>{opponentMeldView(2)}</View><View style={styles.mahjongMiddle}><View style={styles.mahjongSide}><Text style={styles.mahjongSeat}>서 · 컴퓨터 2 · 보통</Text><Text style={styles.mahjongRiver}>{rivers[2].slice(-8).map((tile)=>tile.glyph).join(' ')}</Text>{opponentMeldView(1)}</View><View style={styles.mahjongCenter}><Text style={styles.mahjongRound}>{mode==='riichi'?riichiRoundLabel(matchState.roundIndex):mode==='hongkong'?hongKongRoundLabel(hkMatch.roundIndex):mode==='chinese'?chineseRoundLabel(cnMatch.roundIndex):`혈전 ${bloodState.winners.length}/3`}</Text><Text style={styles.mahjongWall}>{matchState.honba}본장 · 공탁 {matchState.riichiSticks}개</Text><Text style={styles.mahjongWall}>남은 패 {wall.length}</Text>{mode==='sichuan'&&<Text style={styles.mahjongVoidNote}>{choosingVoid?'정결 미선택':`정결 ${suitNames[voidSuits[0]]}`}</Text>}{mode==='hongkong'&&flowers[0].length>0&&<Text style={styles.mahjongVoidNote}>꽃패 {flowers[0].map((flower)=>flower.glyph).join('')}</Text>}<Text style={styles.mahjongPot}>{selectedBet.toLocaleString()} WC</Text>{mode==='riichi'&&<><Text style={styles.mahjongPoints}>{riichiPoints.toLocaleString()}점</Text><Text style={styles.mahjongWall}>나 {matchState.scores[0].toLocaleString()} · C1 {matchState.scores[1].toLocaleString()}</Text><Text style={styles.mahjongWall}>C2 {matchState.scores[2].toLocaleString()} · C3 {matchState.scores[3].toLocaleString()}</Text></>}{mode==='hongkong'&&<><Text style={styles.mahjongPoints}>{hkMatch.scores[0].toLocaleString()}점</Text><Text style={styles.mahjongWall}>C1 {hkMatch.scores[1]} · C2 {hkMatch.scores[2]} · C3 {hkMatch.scores[3]}</Text></>}{mode==='chinese'&&<><Text style={styles.mahjongPoints}>{cnMatch.scores[0]>0?'+':''}{cnMatch.scores[0]}점</Text><Text style={styles.mahjongWall}>C1 {cnMatch.scores[1]} · C2 {cnMatch.scores[2]} · C3 {cnMatch.scores[3]}</Text></>}{mode==='sichuan'&&<><Text style={styles.mahjongPoints}>{bloodState.scores[0]>0?'+':''}{bloodState.scores[0]}</Text><Text style={styles.mahjongWall}>C1 {bloodState.scores[1]} · C2 {bloodState.scores[2]} · C3 {bloodState.scores[3]}</Text></>}</View><View style={styles.mahjongSide}><Text style={styles.mahjongSeat}>남 · 컴퓨터 1 · 쉬움</Text><Text style={styles.mahjongRiver}>{rivers[1].slice(-8).map((tile)=>tile.glyph).join(' ')}</Text>{opponentMeldView(0)}</View></View><View style={styles.mahjongPlayerRiver}><Text style={styles.mahjongRiver}>{rivers[0].slice(-16).map((tile)=>tile.glyph).join(' ')}</Text>{riichiMarker!==''&&<Text style={styles.mahjongRiichiMarker}>↔ {rivers[0].find((tile)=>tile.id===riichiMarker)?.glyph} 리치 선언패</Text>}</View>{openMelds.length>0&&<View style={styles.mahjongMeldArea}><Text style={styles.mahjongMeldLabel}>내가 공개한 몸통</Text><View style={styles.mahjongMeldRow}>{openMelds.map((meld,index)=><View key={index} style={styles.mahjongOpenMeld}>{meld.map((tile)=><Text key={tile.id} style={styles.mahjongMeldGlyph}>{tile.glyph}</Text>)}</View>)}</View></View>}<Text style={styles.mahjongMessage}>{message}</Text>{phase!=='playing'&&<Pressable onPress={()=>setShowRules((value)=>!value)} style={styles.mahjongRulesToggle}><Text style={styles.mahjongRulesToggleText}>{showRules?'룰 설정 닫기':'⚙ 룰 설정'}</Text></Pressable>}
    <View style={styles.mahjongTurnGuide}><Text style={styles.mahjongTurnStep}>{turnGuide.step}</Text><Text style={styles.mahjongTurnTitle}>{turnGuide.title}</Text><Text style={styles.mahjongTurnDetail}>{turnGuide.detail}</Text></View>
    {mode==='riichi'&&phase==='playing'&&<><Pressable onPress={()=>setShowPlayHelp((value)=>!value)} style={styles.mahjongPlayHelpToggle}><Text style={styles.mahjongPlayHelpToggleText}>{showPlayHelp?'초보 진행 도움 접기 −':'초보 진행 도움 보기 +'}</Text></Pressable>{showPlayHelp&&<View style={styles.mahjongPlayHelp}><Text style={styles.mahjongPlayHelpTitle}>지금 알아둘 것</Text><View style={styles.mahjongStatusRow}><Text style={styles.mahjongStatusLabel}>내 상태</Text><Text style={styles.mahjongStatusText}>{riichiDeclared?'리치 선언 · 새로 뽑은 패만 버릴 수 있음':openMelds.length?'오픈 패 · 리치는 불가능, 공개해도 되는 역 필요':'멘젠 · 텐파이가 되면 리치 가능'}</Text></View><View style={styles.mahjongStatusRow}><Text style={styles.mahjongStatusLabel}>론 상태</Text><Text style={[styles.mahjongStatusText,(temporaryFuriten||permanentFuritenNow)&&styles.mahjongStatusWarning]}>{temporaryFuriten?'후리텐 · 다음 내 차례까지 론 불가':permanentFuritenNow?'후리텐 · 내 버림패에 대기패가 있어 론 불가':'론 가능 · 단, 완성 모양과 역이 모두 필요'}</Text></View><View style={styles.mahjongStatusRow}><Text style={styles.mahjongStatusLabel}>용어</Text><Text style={styles.mahjongStatusText}>텐파이=한 장 남음 · 유효패=뽑으면 좋아지는 패 · 쯔모=직접 뽑아 승리 · 론=남의 버림패로 승리</Text></View></View>}</>}
    {mode==='riichi'&&phase==='playing'&&showPlayHelp&&discardGuides.length>0&&<View style={styles.mahjongDiscardGuide}><Text style={styles.mahjongDiscardGuideTitle}>추천 버림패 · 위에서부터 확인</Text><Text style={styles.mahjongDiscardGuideCaution}>정답을 대신 고르는 기능은 아닙니다. 현재 패 모양과 남은 유효패를 계산한 참고 순위입니다.</Text>{discardGuides.map((guide,index)=><View key={`${guide.tile.suit}${guide.tile.value}`} style={[styles.mahjongDiscardGuideRow,index===0&&styles.mahjongDiscardGuideBest]}><View style={styles.mahjongDiscardGuideRank}><Text style={styles.mahjongDiscardGuideRankText}>{index+1}</Text></View><Text style={styles.mahjongDiscardGuideTile}>{guide.tile.glyph}</Text><View style={styles.mahjongDiscardGuideText}><Text style={styles.mahjongDiscardGuideName}>{guide.tile.glyph} 버리기 {guide.tenpai?'· 텐파이':''}</Text><Text style={styles.mahjongDiscardGuideReason}>{guide.reason}</Text></View></View>)}</View>}
    {mode==='riichi'&&phase==='playing'&&showPlayHelp&&pendingCall&&!pendingCall.canRon&&<View style={styles.mahjongCallAdvice}><Text style={styles.mahjongCallAdviceTitle}>치·퐁·깡 전에 확인</Text><Text style={styles.mahjongCallAdviceText}>가져오면 패가 공개되어 멘젠과 리치를 잃습니다. 역패·탕야오처럼 공개해도 남는 역이 확실하거나, 텐파이가 크게 가까워질 때만 선택하세요. 모르겠다면 ‘넘기기’가 안전합니다.</Text></View>}
    {showRules&&phase!=='playing'&&<View style={styles.mahjongWaitPanel}>
      <Text style={styles.mahjongWaitTitle}>룰 설정</Text>
      {mode==='riichi'&&(Object.keys(DEFAULT_RIICHI_RULES) as (keyof RiichiRuleOptions)[]).map((option)=>(
        <Pressable key={option} onPress={()=>setRules((current)=>({...current,[option]:!current[option]}))} style={styles.mahjongRuleRow}>
          <View style={[styles.mahjongRuleBox,rules[option]&&styles.mahjongRuleBoxOn]}><Text style={styles.mahjongRuleCheck}>{rules[option]?'✓':''}</Text></View>
          <View style={styles.mahjongRuleText}>
            <Text style={styles.mahjongRuleName}>{riichiRuleLabels[option].name}</Text>
            <Text style={styles.mahjongRuleDetail}>{riichiRuleLabels[option].detail}</Text>
          </View>
        </Pressable>
      ))}
      {mode==='hongkong'&&<>
        <Text style={styles.mahjongRuleDetail}>최소 번을 넘겨야 화료할 수 있습니다. 낮출수록 쉽게 이깁니다.</Text>
        <View style={styles.mahjongVoidRow}>{HONG_KONG_MIN_OPTIONS.map((value)=>(
          <Pressable key={value} onPress={()=>setMinFaan(value)} style={[styles.mahjongVoidButton,minFaan===value&&styles.mahjongVoidButtonActive]}>
            <Text style={styles.mahjongVoidButtonText}>{value}번</Text>
            <Text style={styles.mahjongVoidCount}>{value===1?'느슨':value===3?'표준':'엄격'}</Text>
          </Pressable>
        ))}</View>
      </>}
      {mode==='chinese'&&<Text style={styles.mahjongRuleDetail}>국표마작은 8점 최소 조건이 규칙으로 정해져 있어 바꿀 수 없습니다.</Text>}
      {mode==='sichuan'&&<Text style={styles.mahjongRuleDetail}>사천 마작은 정결·혈전도저·과수가 모두 기본 규칙입니다.</Text>}
    </View>}
    {mode==='riichi'&&phase==='playing'&&beginnerYakuHints.length>0&&<View style={styles.mahjongYakuHintPanel}><Text style={styles.mahjongYakuHintTitle}>현재 패에서 생각해 볼 역</Text><Text style={styles.mahjongYakuHintCaution}>승리 확정이 아닌 방향 안내입니다. 패를 버리면 후보도 달라집니다.</Text>{beginnerYakuHints.map((hint)=><View key={hint.name} style={styles.mahjongYakuHintRow}><Text style={styles.mahjongYakuHintName}>{hint.name}</Text><Text style={styles.mahjongYakuHintReason}>{hint.reason}</Text></View>)}</View>}
    {mode==='riichi'&&phase==='playing'&&activeRiichiRivers.length>0&&<View style={styles.mahjongDefensePanel}><Text style={styles.mahjongDefenseTitle}>상대 리치 · 버릴 패 안전도</Text><Text style={styles.mahjongDefenseIntro}>현물은 그 리치자가 이미 버린 패라 론당하지 않습니다. 주의·위험 표시는 스지와 보이는 패까지 계산한 참고값이며 절대 안전을 뜻하지 않습니다.</Text><View style={styles.mahjongDefenseRow}><Text style={[styles.mahjongDefenseLabel,styles.mahjongDefenseSafe]}>안전</Text><Text style={styles.mahjongDefenseTiles}>{dangerGroups.safe.length?dangerGroups.safe.map((tile)=>tile.glyph).join(' '):'없음'}</Text></View><View style={styles.mahjongDefenseRow}><Text style={[styles.mahjongDefenseLabel,styles.mahjongDefenseCaution]}>주의</Text><Text style={styles.mahjongDefenseTiles}>{dangerGroups.caution.length?dangerGroups.caution.map((tile)=>tile.glyph).join(' '):'없음'}</Text></View><View style={styles.mahjongDefenseRow}><Text style={[styles.mahjongDefenseLabel,styles.mahjongDefenseDanger]}>위험</Text><Text style={styles.mahjongDefenseTiles}>{dangerGroups.danger.length?dangerGroups.danger.map((tile)=>tile.glyph).join(' '):'없음'}</Text></View></View>}
    {choosingVoid&&<View style={styles.mahjongWaitPanel}><Text style={styles.mahjongWaitTitle}>버릴 종류를 하나 고르세요 (정결)</Text><Text style={styles.mahjongWaitText}>고른 종류를 전부 버려야 화료할 수 있습니다. 적게 가진 쪽이 유리합니다.</Text><View style={styles.mahjongVoidRow}>{sichuanSuits.map((suit)=>{const held=player.filter((tile)=>tile.suit===suit).length;return <Pressable key={suit} onPress={()=>{setVoidSuits((current)=>[suit,current[1],current[2],current[3]]);setChoosingVoid(false);setMessage(`정결 ${suitNames[suit]} · ${suitNames[suit]}를 전부 버리세요`);}} style={[styles.mahjongVoidButton,voidSuits[0]===suit&&styles.mahjongVoidButtonActive]}><Text style={styles.mahjongVoidButtonText}>{suitNames[suit]}</Text><Text style={styles.mahjongVoidCount}>{held}장</Text></Pressable>;})}</View></View>}{bloodLog.length>0&&<View style={styles.mahjongWaitPanel}><Text style={styles.mahjongWaitTitle}>혈전 진행</Text>{bloodLog.map((line,index)=><Text key={index} style={styles.mahjongWaitText}>{line}</Text>)}</View>}{choosingRiichi&&<View style={styles.mahjongWaitPanel}><Text style={styles.mahjongWaitTitle}>노란 패 중 하나를 버려 리치 선언</Text>{riichiChoices.map((choice)=><Text key={choice.tile.id} style={styles.mahjongWaitText}>{choice.tile.glyph} 버림 → {choice.waits.map((tile)=>tile.glyph).join(' ')} 대기</Text>)}</View>}<View style={styles.mahjongHand}>{sortMahjongHand(player).map((tile)=>{const riichiChoice=choosingRiichi&&riichiChoices.some((choice)=>choice.tile.id===tile.id);const canDiscard=phase==='playing'&&!pendingCall&&(!riichiDeclared||tile.id===drawnId);return <MahjongTileView key={tile.id} tile={tile} selected={tile.id===drawnId||riichiChoice} showRed={mode==='riichi'&&rules.redFives} onPress={canDiscard?()=>discard(tile):undefined}/>;})}</View></View>{phase==='result'&&roundResult&&<View style={styles.mahjongResultPanel}><Text style={styles.mahjongResultTitle}>{roundResult.winner===null?'유국':`${roundResult.winner===0?'내가':`컴퓨터 ${roundResult.winner}이`} ${roundResult.method}`}</Text>{roundResult.concealed.length>0&&<View style={styles.mahjongResultTiles}>{roundResult.concealed.map((tile)=><Text key={tile.id} style={styles.mahjongResultTile}>{tile.glyph}</Text>)}</View>}{roundResult.melds.length>0&&<View style={styles.mahjongMeldRow}>{roundResult.melds.map((meld,index)=><View key={index} style={styles.mahjongOpponentOpenMeld}>{meld.map((tile)=><Text key={tile.id} style={styles.mahjongOpponentMeldGlyph}>{tile.glyph}</Text>)}</View>)}</View>}<Text style={styles.mahjongResultGrade}>{roundResult.grade}</Text>{roundResult.yaku.length>0&&<Text style={styles.mahjongResultYaku}>{roundResult.yaku.join(' · ')}</Text>}<Text style={styles.mahjongResultScore}>{roundResult.scoreText}</Text></View>}{phase==='result'&&mode==='riichi'&&matchState.finished&&<View style={styles.mahjongWaitPanel}><Text style={styles.mahjongWaitTitle}>반장전 최종 순위</Text>{rankRiichiScores(matchState.scores).map((entry)=><Text key={entry.seat} style={styles.mahjongWaitText}>{entry.rank}위 · {entry.seat===0?'나':`컴퓨터 ${entry.seat}`} · {entry.score.toLocaleString()}점</Text>)}</View>}{phase==='result'&&mode==='sichuan'&&<View style={styles.mahjongWaitPanel}><Text style={styles.mahjongWaitTitle}>혈전 결과 · {bloodState.winners.length}명 화료</Text>{rankSichuanScores(bloodState.scores).map((entry)=><Text key={entry.seat} style={styles.mahjongWaitText}>{entry.rank}위 · {entry.seat===0?'나':`컴퓨터 ${entry.seat}`} · {entry.score>0?'+':''}{entry.score}</Text>)}</View>}{phase==='result'&&mode==='hongkong'&&hkMatch.finished&&<View style={styles.mahjongWaitPanel}><Text style={styles.mahjongWaitTitle}>최종 순위</Text>{rankHongKongScores(hkMatch.scores).map((entry)=><Text key={entry.seat} style={styles.mahjongWaitText}>{entry.rank}위 · {entry.seat===0?'나':`컴퓨터 ${entry.seat}`} · {entry.score.toLocaleString()}점</Text>)}</View>}{phase==='result'&&mode==='chinese'&&cnMatch.finished&&<View style={styles.mahjongWaitPanel}><Text style={styles.mahjongWaitTitle}>최종 순위</Text>{rankChineseScores(cnMatch.scores).map((entry)=><Text key={entry.seat} style={styles.mahjongWaitText}>{entry.rank}위 · {entry.seat===0?'나':`컴퓨터 ${entry.seat}`} · {entry.score>0?'+':''}{entry.score}점</Text>)}</View>}{phase==='ready'||phase==='result'?<Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton]} onPress={start}><Text style={styles.primaryButtonText}>{phase==='result'?(matchState.finished?'반장전 결과':'다음 국'):'패 13장 받기'} · {selectedBet.toLocaleString()} WC</Text></Pressable>:pendingCall?<View style={styles.mahjongCallPanel}><Text style={styles.mahjongCallTitle}>{pendingCall.tile.glyph}에 반응할 수 있어요</Text><View style={styles.mahjongCallButtons}>{pendingCall.canRon&&<Pressable onPress={()=>winWithRiichi(`론! 컴퓨터 ${pendingCall.discarder}의 ${pendingCall.tile.glyph}으로 완성`)} style={styles.mahjongRonButton}><Text style={styles.primaryButtonText}>론</Text></Pressable>}{pendingCall.options.map((option,index)=><Pressable key={`${option.kind}-${index}`} onPress={()=>claim(option)} style={styles.mahjongCallButton}><Text style={styles.holdemActionText}>{option.label}</Text></Pressable>)}<Pressable onPress={passCall} style={styles.mahjongPassButton}><Text style={styles.holdemActionText}>넘기기</Text></Pressable></View></View>:<View style={styles.mahjongActions}>{mode==='riichi'&&!riichiDeclared&&openMelds.length===0&&riichiChoices.length>0&&<Pressable onPress={()=>setChoosingRiichi((value)=>!value)} style={styles.mahjongRiichiButton}><Text style={styles.primaryButtonText}>{choosingRiichi?'취소':'리치'}</Text></Pressable>}{canAbortNineTerminals&&<Pressable onPress={declareNineTerminals} style={styles.mahjongKanButton}><Text style={styles.holdemActionText}>구종구패</Text></Pressable>}{kanOptions.map((option,index)=><Pressable key={`kan-${index}`} onPress={()=>declareKan(option)} style={styles.mahjongKanButton}><Text style={styles.holdemActionText}>{option.kind==='ankan'?'암깡':'가깡'} {option.tiles[0].glyph}</Text></Pressable>)}<Pressable onPress={()=>setPlayer(sortMahjongHand(player))} style={styles.mahjongSortButton}><Text style={styles.holdemActionText}>패 정렬</Text></Pressable><Pressable disabled={!win} onPress={()=>winWithRiichi('쯔모! 완성 패입니다')} style={[styles.mahjongTsumoButton,!win&&styles.disabledCard]}><Text style={styles.primaryButtonText}>{winButtonLabel(mode,structuralWin,tsumoSummary)}</Text></Pressable></View>}<Text style={styles.disclaimer}>{riichiDeclared?'리치 후에는 새로 뽑은 패만 그대로 버릴 수 있습니다':mahjongMinimumNote[mode]} · {profile.note}</Text></ScrollView></View>;
}

/** 작은 카드 안에서도 월별 그림이 구분되도록 만든 화투 전용 삽화입니다. */
const hwatuPicture:Record<number,{plant:string;figure:string;color:string;dark:string}>={
  1:{plant:'솔',figure:'학',color:'#D93642',dark:'#183D2A'},
  2:{plant:'매화',figure:'새',color:'#E84B78',dark:'#3C271D'},
  3:{plant:'벚꽃',figure:'막',color:'#EF6688',dark:'#5E1E2A'},
  4:{plant:'등꽃',figure:'새',color:'#7D5BA6',dark:'#263A2B'},
  5:{plant:'창포',figure:'다리',color:'#8558A5',dark:'#27513A'},
  6:{plant:'모란',figure:'나비',color:'#D94A63',dark:'#34512D'},
  7:{plant:'싸리',figure:'멧돼지',color:'#C94C58',dark:'#384527'},
  8:{plant:'억새',figure:'달',color:'#E5C75A',dark:'#1C2737'},
  9:{plant:'국화',figure:'술잔',color:'#D9A82F',dark:'#3C542A'},
  10:{plant:'단풍',figure:'사슴',color:'#D84832',dark:'#2D3F28'},
  11:{plant:'오동',figure:'봉황',color:'#9B5DAD',dark:'#26333D'},
  12:{plant:'버들',figure:'비',color:'#4C75A7',dark:'#263747'},
};
function HwatuMonthPicture({month}:{month:number}){
  const picture=hwatuPicture[month];
  return <View style={[styles.hwatuPicture,{backgroundColor:picture.dark}]}><View style={[styles.hwatuBranch,{backgroundColor:picture.color}]}/><View style={[styles.hwatuBranch,styles.hwatuBranchSecond,{backgroundColor:picture.color}]}/>{[0,1,2,3].map((index)=><View key={index} style={[styles.hwatuBlossom,{backgroundColor:picture.color,left:5+(index%2)*17,top:5+Math.floor(index/2)*15}]}/>)}{month===8&&<View style={styles.hwatuMoon}/>}<Text style={styles.hwatuPlant}>{picture.plant}</Text><View style={styles.hwatuFigureBadge}><Text style={styles.hwatuFigure}>{picture.figure}</Text></View></View>;
}
function HwatuCardView({ card, hidden = false, emphasis, showMonth=false }: { card: HwatuCard; hidden?: boolean; emphasis?: 'winner' | 'dim'; showMonth?:boolean }) {
  if (hidden) return <View style={[styles.hwatuCard, styles.hwatuHidden]}><Text style={styles.hwatuHiddenMark}>花</Text></View>;
  if(card.bonus)return <View style={[styles.hwatuCard,styles.hwatuBright,emphasis==='winner'&&styles.cardWinner]}><Text style={styles.hwatuMonth}>BONUS</Text><View style={[styles.hwatuPicture,{backgroundColor:'#7A1E3A'}]}><Text style={styles.hwatuHiddenMark}>＋</Text></View><Text style={styles.hwatuKind}>{card.bonus}피</Text><Text style={styles.hwatuName}>보너스</Text></View>;
  const label = card.kind === '광' ? '光' : card.kind === '열끗' ? '十' : card.kind === '띠' ? (card.ribbon ?? '띠') : card.double ? '쌍피' : '피';
  const source=hwatuCardImages[card.id];
  const webImageUri=source&&typeof source==='object'&&'uri' in source?String(source.uri):'';
  const webImageStyle=webImageUri&&Platform.OS==='web'?({backgroundImage:`url("${webImageUri}")`,backgroundSize:'contain',backgroundPosition:'center',backgroundRepeat:'no-repeat'} as any):null;
  return (
    <View style={[styles.hwatuCard, card.kind === '광' && (source ? styles.hwatuBrightEdge : styles.hwatuBright), emphasis === 'winner' && styles.cardWinner, emphasis === 'dim' && styles.cardDim]}>
      {source?(Platform.OS==='web'?<View style={[styles.hwatuCardImage,webImageStyle]}/>:<Image source={source} resizeMode="contain" style={styles.hwatuCardImage}/>):<HwatuMonthPicture month={card.month}/>}
      {showMonth&&<View style={styles.hwatuCardCaption}><Text style={styles.hwatuMonth}>{card.month}월</Text><Text style={styles.hwatuKind}>{label}</Text></View>}
    </View>
  );
}

function FaceDownHwatuDeck({count}:{count:number}){
  return <View style={styles.hwatuDeckStack}><View style={[styles.hwatuDeckLayer,{transform:[{translateX:-3},{translateY:3}]}]}/><View style={styles.hwatuDeckLayer}><Text style={styles.hwatuDeckMark}>花</Text></View><Text style={styles.hwatuDeckCount}>{count}장</Text></View>;
}

function HwatuFloor({cards,deckCount}:{cards:HwatuCard[];deckCount:number}){
  const split=Math.ceil(cards.length/2);
  return <View style={styles.hwatuFloorBoard}><View style={styles.hwatuFloorRow}>{cards.slice(0,split).map(card=><HwatuCardView key={card.id} card={card}/>)}</View><FaceDownHwatuDeck count={deckCount}/><View style={styles.hwatuFloorRow}>{cards.slice(split).map(card=><HwatuCardView key={card.id} card={card}/>)}</View></View>;
}

function hwatuScoreGroup(card:HwatuCard){
  if(card.kind==='광')return '광';if(card.kind==='열끗')return '열끗';if(card.kind==='띠')return card.ribbon??'띠';return '피';
}
function HwatuCapturedGroups({cards}:{cards:HwatuCard[]}){
  const order=['광','열끗','홍단','청단','초단','띠','피'];
  return <View style={styles.hwatuCapturedGroups}>{order.map(label=>{const group=cards.filter(card=>hwatuScoreGroup(card)===label);if(!group.length)return null;return <View key={label} style={styles.hwatuCapturedGroup}><Text style={styles.hwatuCapturedLabel}>{label} · {group.length}</Text><View style={styles.hwatuCapturedCards}>{group.map(card=><HwatuCardView key={card.id} card={card}/>)}</View></View>;})}</View>;
}

function GoStopSetupScreen(props:{mode:GoStopMode;deckStyle:GoStopDeckStyle;coins:number;difficulty:string;selectedBet:number;onDeckStyleChange:(value:GoStopDeckStyle)=>void;onBack:()=>void;onDifficultyChange:(value:string)=>void;onBetChange:(value:number)=>void;onStart:()=>void}){
  const option=difficultyOptions.find((item)=>item.name===props.difficulty)??difficultyOptions[2];const title=props.mode==='gostop'?'고스톱':'맞고';
  return <View style={styles.detailScreen}><ScreenHeader title={`${title} 준비`} onBack={props.onBack}/><ScrollView contentContainerStyle={styles.detailPage} showsVerticalScrollIndicator={false}>
    <View style={styles.sicboHero}><Text style={styles.sicboHeroDice}>{props.mode==='gostop'?'花 · GO / STOP':'二 · 맞고'}</Text><Text style={styles.detailLead}>{props.mode==='gostop'?'세 명이 3점부터 결정':'두 명이 7점부터 결정'}</Text></View>
    <Text style={styles.sectionTitle}>게임 종류</Text><View style={styles.slotModeRow}>
      <Pressable onPress={()=>props.onDeckStyleChange('classic')} style={[styles.slotModeCard,props.deckStyle==='classic'&&styles.slotModeActive]}><Text style={props.deckStyle==='classic'?styles.slotModeTitleActive:styles.slotModeTitle}>기본판 · 48장</Text><Text style={styles.slotModeText}>정규 화투패만 사용</Text></Pressable>
      <Pressable onPress={()=>props.onDeckStyleChange('bonus')} style={[styles.slotModeCard,props.deckStyle==='bonus'&&styles.slotModeActive]}><Text style={props.deckStyle==='bonus'?styles.slotModeTitleActive:styles.slotModeTitle}>보너스판 · 50장</Text><Text style={styles.slotModeText}>2피·3피 보너스 추가</Text></Pressable>
    </View>
    <View style={styles.slotRules}><Text style={styles.slotRulesTitle}>규칙</Text><Text style={styles.slotRuleText}>{props.mode==='gostop'?'손패 7장씩·바닥 6장':'손패 10장씩·바닥 8장'}으로 시작합니다.</Text><Text style={styles.slotRuleText}>같은 월을 맞춰 광·열끗·띠·피를 모으고 기준 점수부터 고 또는 스톱을 고릅니다.</Text><Text style={styles.slotRuleText}>쪽·따닥·뻑·싹쓸이·폭탄·흔들기와 피박·광박·멍박·고박을 적용합니다.</Text>{props.deckStyle==='bonus'?<><Text style={styles.slotRuleText}>처음 받은 보너스패는 즉시 획득하고 손패를 보충합니다.</Text><Text style={styles.slotRuleText}>더미에서 보너스패가 나오면 획득한 뒤 일반 패가 나올 때까지 더 뒤집습니다.</Text></>:null}</View>
    <Text style={styles.sectionTitle}>베팅 등급</Text><View style={styles.setupOptions}>{difficultyOptions.map((item)=><Pressable key={item.name} style={[styles.setupOption,props.difficulty===item.name&&styles.setupOptionActive]} onPress={()=>props.onDifficultyChange(item.name)}><Text style={[styles.setupOptionTitle,props.difficulty===item.name&&styles.setupOptionTitleActive]}>{betTierName(item.name)}</Text><Text style={styles.setupOptionRange}>{item.min.toLocaleString()}~{item.max.toLocaleString()} WC</Text></Pressable>)}</View>
    <Text style={styles.sectionTitle}>시작 베팅</Text><View style={styles.betGrid}>{option.bets.map((amount,index)=><BetOptionCoin key={amount} amount={amount} level={index+1} selected={props.selectedBet===amount} disabled={amount>props.coins} onPress={()=>props.onBetChange(amount)}/>)}</View>
    <Pressable disabled={props.selectedBet>props.coins} style={[styles.primaryButton,styles.fullWidthButton,props.selectedBet>props.coins&&styles.disabledCard]} onPress={props.onStart}><Text style={styles.primaryButtonText}>{title} {props.deckStyle==='bonus'?'보너스판':'기본판'} 시작</Text></Pressable>
  </ScrollView></View>;
}

/** 화면 자동 진행용 선택값. 같은 월 두 장이 있으면 첫 장을 골라 흐름을 멈추지 않습니다. */
function automaticGoStopChoice(round: GoStopRound, played: HwatuCard, selectedPlayedMatchId?:string) {
  const matches = round.floor.filter((item) => item.month === played.month);
  const playedMatchId = matches.length === 2 ? (selectedPlayedMatchId??matches[0].id) : undefined;
  let floor = [...round.floor];
  if (matches.length === 0) floor.push(played);
  else if (matches.length === 1) floor = floor.filter((item) => item.id !== matches[0].id);
  else if (matches.length === 2) floor = floor.filter((item) => item.id !== playedMatchId);
  else floor = floor.filter((item) => item.month !== played.month);
  const drawn = round.deck.find((card)=>!card.bonus);
  const drawnMatches = drawn ? floor.filter((item) => item.month === drawn.month) : [];
  return { playedMatchId, drawnMatchId: drawnMatches.length === 2 ? drawnMatches[0].id : undefined };
}

function GoStopGameScreen({mode,deckStyle,coins,selectedBet,onBack,onPlaceBet,onSettle}:{mode:GoStopMode;deckStyle:GoStopDeckStyle;coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(value:number)=>boolean;onSettle:(mine:number,theirs:number,result:'win'|'loss'|'push',detail:string)=>void}) {
  const [round,setRound]=useState<GoStopRound|null>(null);
  const [settled,setSettled]=useState(false);
  const [pendingPlay,setPendingPlay]=useState<HwatuCard|null>(null);
  const [carryMultiplier,setCarryMultiplier]=useState(1);
  const [lastOpponentCapture,setLastOpponentCapture]=useState<HwatuCard[]>([]);
  const title=mode==='matgo'?'맞고':'고스톱';

  const finish=(next:GoStopRound,force=false)=>{
    if(settled&&!force)return;
    if(next.winner===null){
      onSettle(selectedBet,selectedBet,'push',next.nagari?`${title} · 나가리 · 다음 판 ${carryMultiplier*2}배`:`${title} · 무승부`);
      if(next.nagari)setCarryMultiplier((value)=>value*2);
      setSettled(true);return;
    }
    const winner=next.players[next.winner];
    if(next.winner===0){
      const bills=next.players.slice(1).map((loser)=>calculateGoStopSettlement(winner,loser,mode));
      const wonPoints=bills.reduce((sum,bill)=>sum+Math.max(1,bill.finalPoints),0)*carryMultiplier;
      const reasons=Array.from(new Set(bills.flatMap((bill)=>bill.reasons)));
      onSettle(selectedBet,selectedBet*wonPoints,'win',`${title} · ${scoreGoStop(winner.captured).total}점 · ${carryMultiplier>1?`나가리 ${carryMultiplier}배 · `:''}${reasons.length?reasons.join(' · '):'기본 정산'}`);
    }else{
      const bill=calculateGoStopSettlement(winner,next.players[0],mode);
      const wantedLoss=selectedBet*Math.max(1,bill.finalPoints)*carryMultiplier;
      const extra=Math.min(Math.max(0,wantedLoss-selectedBet),coins);
      if(extra>0)onPlaceBet(extra);
      onSettle(selectedBet+extra,0,'loss',`${title} · 컴퓨터 ${next.winner} 승리 · ${carryMultiplier>1?`나가리 ${carryMultiplier}배 · `:''}${bill.reasons.length?bill.reasons.join(' · '):'기본 정산'}`);
    }
    setCarryMultiplier(1);
    setSettled(true);
  };

  /** 컴퓨터들은 첫 번째 가능한 패를 내며, 기준 점수가 되면 스톱합니다. */
  const runComputers=(initial:GoStopRound)=>{
    let next=initial;
    let safety=0;
    while(!next.finished&&next.turn!==0&&safety<8){
      if(next.pendingDecision===next.turn){ next=chooseGoOrStop(next,'stop'); break; }
      const hand=next.players[next.turn].hand;
      if(!hand.length)break;
      const bombMonth=Array.from(new Set(hand.map((card)=>card.month))).find((month)=>hand.filter((card)=>card.month===month).length===3&&next.floor.filter((card)=>card.month===month).length===1);
      if(bombMonth!==undefined){next=playGoStopBomb(next,bombMonth);safety+=1;continue;}
      const shakeMonth=Array.from(new Set(hand.map((card)=>card.month))).find((month)=>hand.filter((card)=>card.month===month).length===3&&!(next.players[next.turn].shakenMonths??[]).includes(month));
      if(shakeMonth!==undefined)next=declareGoStopShake(next,shakeMonth);
      const played=chooseComputerGoStopCard(next);
      next=playGoStopTurn(next,played.id,automaticGoStopChoice(next,played));
      safety+=1;
    }
    return next;
  };

  const start=()=>{
    if(!onPlaceBet(selectedBet))return;
    const next=dealGoStop(mode,Math.random,deckStyle);setRound(next);setSettled(false);setPendingPlay(null);setLastOpponentCapture([]);
    if(next.finished)finish(next,true);
  };
  const play=(card:HwatuCard,selectedMatchId?:string)=>{
    if(!round||round.turn!==0||round.pendingDecision!==null&&round.pendingDecision!==undefined)return;
    const matches=round.floor.filter((item)=>item.month===card.month);
    if(matches.length===2&&!selectedMatchId){setPendingPlay(card);return;}
    const before=new Set(round.players.slice(1).flatMap(player=>player.captured.map(item=>item.id)));
    let next=playGoStopTurn(round,card.id,automaticGoStopChoice(round,card,selectedMatchId));
    setPendingPlay(null);
    if(next.pendingDecision!==0)next=runComputers(next);
    setLastOpponentCapture(next.players.slice(1).flatMap(player=>player.captured).filter(item=>!before.has(item.id)));
    setRound(next);if(next.finished)finish(next);
  };
  const bomb=(month:number)=>{
    if(!round||round.turn!==0||round.pendingDecision===0)return;
    let next=playGoStopBomb(round,month);
    if(next.pendingDecision!==0)next=runComputers(next);
    setRound(next);if(next.finished)finish(next);
  };
  const shake=(month:number)=>{if(round)setRound(declareGoStopShake(round,month));};
  const decide=(action:'go'|'stop')=>{
    if(!round||round.pendingDecision!==0)return;
    let next=chooseGoOrStop(round,action);
    if(action==='go')next=runComputers(next);
    setRound(next);if(next.finished)finish(next);
  };
  const myScore=round?scoreGoStop(round.players[0].captured):null;
  const bombMonths=round?Array.from(new Set(round.players[0].hand.map((card)=>card.month))).filter((month)=>round.players[0].hand.filter((card)=>card.month===month).length===3&&round.floor.filter((card)=>card.month===month).length===1):[];
  const shakeMonths=round?Array.from(new Set(round.players[0].hand.map((card)=>card.month))).filter((month)=>round.players[0].hand.filter((card)=>card.month===month).length===3&&!(round.players[0].shakenMonths??[]).includes(month)):[];

  return <View style={styles.detailScreen}><ScreenHeader title={title} onBack={onBack}/><ScrollView contentContainerStyle={styles.holdemPage}>
    {!round?<>
      <View style={styles.sicboHero}><Text style={styles.sicboHeroDice}>{mode==='matgo'?'二 花':'花 GO'}</Text><Text style={styles.detailLead}>{mode==='matgo'?'두 명이 7점부터 고·스톱':'세 명이 3점부터 고·스톱'}</Text></View>
      <Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton,selectedBet>coins&&styles.disabledCard]} onPress={start}><Text style={styles.primaryButtonText}>패 돌리기 · {selectedBet.toLocaleString()} WC</Text></Pressable>
    </>:<>
      <View style={styles.panel}>
        <Row title="차례" value={round.finished?'경기 종료':round.turn===0?'내 차례':`컴퓨터 ${round.turn}`}/><View style={styles.separator}/>
        <Row title="더미" value={`${round.deck.length}장`}/><View style={styles.separator}/>
        <Row title="내 점수" value={`${myScore?.total??0}점 · ${round.players[0].goCount}고`}/>
        {carryMultiplier>1?<><View style={styles.separator}/><Row title="나가리 누적" value={`이번 판 ${carryMultiplier}배`}/></>:null}
      </View>
      <Text style={styles.sectionTitle}>컴퓨터 상황</Text>
      <View style={styles.panel}>{round.players.slice(1).map((player,index)=><View key={index} style={styles.row}><Text style={styles.rowTitle}>컴퓨터 {index+1}</Text><Text style={styles.rowValue}>손 {player.hand.length}장 · 획득 {player.captured.length}장 · {scoreGoStop(player.captured).total}점</Text></View>)}</View>
      {lastOpponentCapture.length?<View style={styles.hwatuLastCapture}><Text style={styles.hwatuLastCaptureTitle}>상대가 이번에 가져간 패</Text><View style={styles.hwatuCompactRow}>{lastOpponentCapture.map(card=><HwatuCardView key={card.id} card={card}/>)}</View></View>:null}
      <Text style={styles.sectionTitle}>바닥 패 · 가운데는 뒤집을 더미</Text>
      <HwatuFloor cards={round.floor} deckCount={round.deck.length}/>
      <Text style={styles.sectionTitle}>내가 모은 패 · 점수 종류별 정리</Text>
      <Text style={styles.helperText}>광 {myScore?.counts.광??0} · 열끗 {myScore?.counts.열끗??0} · 띠 {myScore?.counts.띠??0} · 피 {myScore?.counts.피??0}{myScore?.bonuses.length?` · ${myScore.bonuses.join(' · ')}`:''}</Text>
      <HwatuCapturedGroups cards={round.players[0].captured}/>
      <Text style={styles.sectionTitle}>내 손패 — 낼 패를 누르세요</Text>
      <View style={styles.hwatuHand}>{round.players[0].hand.map((card)=><Pressable key={card.id} disabled={round.turn!==0||round.finished||round.pendingDecision===0||pendingPlay!==null} onPress={()=>play(card)}><HwatuCardView card={card} emphasis={round.turn===0&&!round.finished?'winner':undefined}/></Pressable>)}</View>
      {pendingPlay?<View style={styles.panel}><Text style={styles.rowTitle}>{pendingPlay.month}월 바닥 패가 두 장입니다 · 가져갈 패를 고르세요</Text><View style={styles.hwatuHand}>{round.floor.filter((item)=>item.month===pendingPlay.month).map((card)=><Pressable key={card.id} onPress={()=>play(pendingPlay,card.id)}><HwatuCardView card={card} emphasis="winner"/></Pressable>)}</View><Pressable style={styles.holdemFold} onPress={()=>setPendingPlay(null)}><Text style={styles.holdemActionText}>선택 취소</Text></Pressable></View>:null}
      {bombMonths.length?<View style={styles.holdemActions}>{bombMonths.map((month)=><Pressable key={month} style={styles.holdemAction} onPress={()=>bomb(month)}><Text style={styles.primaryButtonText}>{month}월 폭탄</Text></Pressable>)}</View>:null}
      {shakeMonths.length&&round.turn===0&&!round.finished?<View style={styles.holdemActions}>{shakeMonths.map((month)=><Pressable key={month} style={styles.holdemAction} onPress={()=>shake(month)}><Text style={styles.primaryButtonText}>{month}월 흔들기</Text></Pressable>)}</View>:null}
      {round.lastEvents?.length?<Text style={styles.pokerOpponentNote}>이번 차례: {round.lastEvents.join(' · ')}</Text>:null}
      <Text style={styles.holdemOutcome}>{round.message}</Text>
      {round.pendingDecision===0&&!round.finished?<View style={styles.holdemActions}><Pressable style={styles.holdemAction} onPress={()=>decide('go')}><Text style={styles.primaryButtonText}>고 · 계속하기</Text></Pressable><Pressable style={styles.holdemFold} onPress={()=>decide('stop')}><Text style={styles.holdemActionText}>스톱 · 끝내기</Text></Pressable></View>:null}
      {round.finished?<Pressable style={[styles.primaryButton,styles.fullWidthButton]} onPress={start}><Text style={styles.primaryButtonText}>다시 하기</Text></Pressable>:null}
    </>}
  </ScrollView></View>;
}

function automaticMinhwaChoice(round:MinhwaRound,played:HwatuCard,selectedId?:string){
  const matches=round.floor.filter((item)=>item.month===played.month);
  const playedMatchId=matches.length===2?(selectedId??matches[0].id):undefined;
  let floor=[...round.floor];
  if(matches.length===0)floor.push(played);else if(matches.length===1)floor=floor.filter((item)=>item.id!==matches[0].id);else if(matches.length===2)floor=floor.filter((item)=>item.id!==playedMatchId);else floor=floor.filter((item)=>item.month!==played.month);
  const drawn=round.deck[0];const drawnMatches=drawn?floor.filter((item)=>item.month===drawn.month):[];
  return {playedMatchId,drawnMatchId:drawnMatches.length===2?drawnMatches[0].id:undefined};
}

function MinhwatuGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(value:number)=>boolean;onSettle:(mine:number,theirs:number,result:'win'|'loss'|'push',detail:string)=>void}){
  const [round,setRound]=useState<MinhwaRound|null>(null);
  const [pendingPlay,setPendingPlay]=useState<HwatuCard|null>(null);
  const [settled,setSettled]=useState(false);
  const [resultText,setResultText]=useState('');
  const finish=(next:MinhwaRound)=>{
    if(settled)return;
    const result=settleMinhwatu(next.players);const difference=Math.abs(result.scores[0]-result.scores[1]);const units=Math.max(1,Math.ceil(difference/10));
    const detail=`민화투 · 나 ${result.scores[0]}점 vs 컴퓨터 ${result.scores[1]}점 · 차이 ${difference}점`;
    if(result.winner===null){onSettle(selectedBet,selectedBet,'push',detail);setResultText(`무승부 · ${result.scores[0]}점`);}
    else if(result.winner===0){onSettle(selectedBet,selectedBet*units,'win',detail);setResultText(`내가 이겼습니다 · ${result.scores[0]} 대 ${result.scores[1]}`);}
    else {const wanted=selectedBet*units;const extra=Math.min(Math.max(0,wanted-selectedBet),coins);if(extra>0)onPlaceBet(extra);onSettle(selectedBet+extra,0,'loss',detail);setResultText(`컴퓨터가 이겼습니다 · ${result.scores[1]} 대 ${result.scores[0]}`);}
    setSettled(true);
  };
  const runComputer=(initial:MinhwaRound)=>{
    let next=initial;if(!next.finished&&next.turn===1){const card=chooseComputerMinhwatuCard(next);next=playMinhwatuTurn(next,card.id,automaticMinhwaChoice(next,card));}return next;
  };
  const start=()=>{if(!onPlaceBet(selectedBet))return;setRound(dealMinhwatu());setPendingPlay(null);setSettled(false);setResultText('');};
  const play=(card:HwatuCard,selectedId?:string)=>{
    if(!round||round.turn!==0||round.finished)return;const matches=round.floor.filter((item)=>item.month===card.month);
    if(matches.length===2&&!selectedId){setPendingPlay(card);return;}
    let next=playMinhwatuTurn(round,card.id,automaticMinhwaChoice(round,card,selectedId));setPendingPlay(null);next=runComputer(next);setRound(next);if(next.finished)finish(next);
  };
  const mine=round?scoreMinhwatu(round.players[0].captured):null;const computer=round?scoreMinhwatu(round.players[1].captured):null;
  return <View style={styles.detailScreen}><ScreenHeader title="민화투" onBack={onBack}/><ScrollView contentContainerStyle={styles.holdemPage}>
    {!round?<><View style={styles.sicboHero}><Text style={styles.sicboHeroDice}>光 · 十 · 띠</Text><Text style={styles.detailLead}>피는 0점 · 그림과 약을 모으세요</Text></View><Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton,selectedBet>coins&&styles.disabledCard]} onPress={start}><Text style={styles.primaryButtonText}>패 돌리기 · {selectedBet.toLocaleString()} WC</Text></Pressable></>:<>
      <View style={styles.panel}><Row title="차례" value={round.finished?'경기 종료':round.turn===0?'내 차례':'컴퓨터 차례'}/><View style={styles.separator}/><Row title="더미" value={`${round.deck.length}장`}/><View style={styles.separator}/><Row title="현재 기본 점수" value={`나 ${mine?.base??0} · 컴퓨터 ${computer?.base??0}`}/></View>
      <Text style={styles.sectionTitle}>컴퓨터가 모은 패</Text><Text style={styles.helperText}>광 {computer?.bright??0}점 · 열끗 {computer?.animal??0}점 · 띠 {computer?.ribbon??0}점 · 약 {computer?.medicines.map((item)=>item.name).join('·')||'없음'}</Text>
      <Text style={styles.sectionTitle}>바닥 패</Text><View style={styles.hwatuHand}>{round.floor.map((card)=><HwatuCardView key={card.id} card={card} showMonth/>)}</View>
      <Text style={styles.sectionTitle}>내가 모은 패</Text><Text style={styles.helperText}>광 {mine?.bright??0}점 · 열끗 {mine?.animal??0}점 · 띠 {mine?.ribbon??0}점 · 약 {mine?.medicines.map((item)=>item.name).join('·')||'없음'}</Text><View style={styles.hwatuHand}>{round.players[0].captured.map((card)=><HwatuCardView key={card.id} card={card} showMonth/>)}</View>
      <Text style={styles.sectionTitle}>내 손패 — 낼 패를 누르세요</Text><View style={styles.hwatuHand}>{round.players[0].hand.map((card)=><Pressable key={card.id} disabled={round.turn!==0||round.finished||pendingPlay!==null} onPress={()=>play(card)}><HwatuCardView card={card} emphasis={round.turn===0?'winner':undefined} showMonth/></Pressable>)}</View>
      {pendingPlay?<View style={styles.panel}><Text style={styles.rowTitle}>{pendingPlay.month}월 중 가져갈 패를 고르세요</Text><View style={styles.hwatuHand}>{round.floor.filter((item)=>item.month===pendingPlay.month).map((card)=><Pressable key={card.id} onPress={()=>play(pendingPlay,card.id)}><HwatuCardView card={card} emphasis="winner"/></Pressable>)}</View><Pressable style={styles.holdemFold} onPress={()=>setPendingPlay(null)}><Text style={styles.holdemActionText}>선택 취소</Text></Pressable></View>:null}
      <Text style={styles.holdemOutcome}>{resultText||round.message}</Text>{round.finished?<Pressable style={[styles.primaryButton,styles.fullWidthButton]} onPress={start}><Text style={styles.primaryButtonText}>다시 하기</Text></Pressable>:null}
    </>}
  </ScrollView></View>;
}

function YukbaekGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(value:number)=>boolean;onSettle:(mine:number,theirs:number,result:'win'|'loss'|'push',detail:string)=>void}){
  const [round,setRound]=useState<MinhwaRound|null>(null);
  const [match,setMatch]=useState<YukbaekMatch>(createYukbaekMatch());
  const [pendingPlay,setPendingPlay]=useState<HwatuCard|null>(null);
  const [roundText,setRoundText]=useState('');
  const [lastScores,setLastScores]=useState<ReturnType<typeof settleYukbaekRound>['scores']|null>(null);

  const beginMatch=()=>{
    if(!onPlaceBet(selectedBet))return;
    setMatch(createYukbaekMatch());setRound(createYukbaekRound());setPendingPlay(null);setRoundText('1번째 판을 시작합니다');setLastScores(null);
  };
  const nextRound=()=>{setRound(createYukbaekRound());setPendingPlay(null);setRoundText(`${match.round}번째 판을 시작합니다`);setLastScores(null);};
  const finish=(finished:MinhwaRound)=>{
    const settled=settleYukbaekRound(match,finished);setMatch(settled.match);setLastScores(settled.scores);
    const mine=settled.scores[0],computer=settled.scores[1];
    if(settled.match.winner!==null){
      const result=settled.match.winner===0?'win':'loss';
      onSettle(selectedBet,selectedBet,result,`육백 · ${settled.match.round-1}판 · 누적 ${settled.match.totals[0]} 대 ${settled.match.totals[1]}`);
      setRoundText(result==='win'?`내가 먼저 600점을 넘었습니다`:`컴퓨터가 먼저 600점을 넘었습니다`);
    }else setRoundText(`이번 판: 나 ${mine.total}점 · 컴퓨터 ${computer.total}점`);
  };
  const runComputer=(initial:MinhwaRound)=>{
    let next=initial;
    if(!next.finished&&next.turn===1){const card=chooseComputerYukbaekCard(next);next=playYukbaekTurn(next,card.id,automaticMinhwaChoice(next,card));}
    return next;
  };
  const play=(card:HwatuCard,selectedId?:string)=>{
    if(!round||round.turn!==0||round.finished)return;
    const matches=round.floor.filter((item)=>item.month===card.month);
    if(matches.length===2&&!selectedId){setPendingPlay(card);return;}
    let next=playYukbaekTurn(round,card.id,automaticMinhwaChoice(round,card,selectedId));setPendingPlay(null);next=runComputer(next);setRound(next);if(next.finished)finish(next);
  };
  const mine=round?scoreYukbaek(round.players[0].captured):null;
  const computer=round?scoreYukbaek(round.players[1].captured):null;
  const yakuLabel=(score:ReturnType<typeof scoreYukbaek>|null)=>score?.yaku.map((item)=>`${item.name} ${item.points}`).join(' · ')||'아직 없음';

  return <View style={styles.detailScreen}><ScreenHeader title="육백" onBack={onBack}/><ScrollView contentContainerStyle={styles.holdemPage}>
    {!round?<><View style={styles.sicboHero}><Text style={styles.sicboHeroDice}>六百</Text><Text style={styles.detailLead}>한 판씩 점수를 쌓아 먼저 600점</Text></View><Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton,selectedBet>coins&&styles.disabledCard]} onPress={beginMatch}><Text style={styles.primaryButtonText}>육백 경기 시작 · {selectedBet.toLocaleString()} WC</Text></Pressable></>:<>
      <View style={styles.panel}><Row title="현재 판" value={`${Math.max(1,match.round-(round.finished?1:0))}번째`}/><View style={styles.separator}/><Row title="누적 점수" value={`나 ${match.totals[0]} · 컴퓨터 ${match.totals[1]} / 600`}/><View style={styles.separator}/><Row title="이번 판" value={`나 ${mine?.total??0} · 컴퓨터 ${computer?.total??0}`}/><View style={styles.separator}/><Row title="차례" value={round.finished?'판 종료':round.turn===0?'내 차례':'컴퓨터 차례'}/></View>
      <Text style={styles.sectionTitle}>컴퓨터가 모은 패</Text><Text style={styles.helperText}>패 점수 {computer?.cardPoints??0} · 역 점수 {computer?.yakuPoints??0} · {yakuLabel(computer)}</Text>
      <Text style={styles.sectionTitle}>바닥 패</Text><View style={styles.hwatuHand}>{round.floor.map((card)=><HwatuCardView key={card.id} card={card} showMonth/>)}</View>
      <Text style={styles.sectionTitle}>내가 모은 패</Text><Text style={styles.helperText}>패 점수 {mine?.cardPoints??0} · 역 점수 {mine?.yakuPoints??0} · {yakuLabel(mine)}</Text><View style={styles.hwatuHand}>{round.players[0].captured.map((card)=><HwatuCardView key={card.id} card={card} showMonth/>)}</View>
      <Text style={styles.sectionTitle}>내 손패 — 낼 패를 누르세요</Text><View style={styles.hwatuHand}>{round.players[0].hand.map((card)=><Pressable key={card.id} disabled={round.turn!==0||round.finished||pendingPlay!==null} onPress={()=>play(card)}><HwatuCardView card={card} emphasis={round.turn===0?'winner':undefined} showMonth/></Pressable>)}</View>
      {pendingPlay?<View style={styles.panel}><Text style={styles.rowTitle}>{pendingPlay.month}월 중 가져갈 패를 고르세요</Text><View style={styles.hwatuHand}>{round.floor.filter((item)=>item.month===pendingPlay.month).map((card)=><Pressable key={card.id} onPress={()=>play(pendingPlay,card.id)}><HwatuCardView card={card} emphasis="winner"/></Pressable>)}</View><Pressable style={styles.holdemFold} onPress={()=>setPendingPlay(null)}><Text style={styles.holdemActionText}>선택 취소</Text></Pressable></View>:null}
      <Text style={styles.holdemOutcome}>{roundText||round.message}</Text>
      {lastScores?<View style={styles.panel}><Row title="이번 판 패 점수" value={`나 ${lastScores[0].cardPoints} · 컴퓨터 ${lastScores[1].cardPoints}`}/><View style={styles.separator}/><Row title="이번 판 역 점수" value={`나 ${lastScores[0].yakuPoints} · 컴퓨터 ${lastScores[1].yakuPoints}`}/></View>:null}
      {round.finished&&match.winner===null?<Pressable style={[styles.primaryButton,styles.fullWidthButton]} onPress={nextRound}><Text style={styles.primaryButtonText}>다음 판 · 누적 계속</Text></Pressable>:null}
      {match.winner!==null?<Pressable style={[styles.primaryButton,styles.fullWidthButton]} onPress={beginMatch}><Text style={styles.primaryButtonText}>새 육백 경기</Text></Pressable>:null}
    </>}
  </ScrollView></View>;
}

function DoriSetupScreen(props: { coins:number; difficulty:string; selectedBet:number; onBack:()=>void; onDifficultyChange:(v:string)=>void; onBetChange:(v:number)=>void; onStart:()=>void }) {
  const option = difficultyOptions.find((item) => item.name === props.difficulty) ?? difficultyOptions[2];
  return (
    <View style={styles.detailScreen}>
      <ScreenHeader title="도리짓고땡 준비" onBack={props.onBack} />
      <ScrollView {...useScrollMemory('DoriSetupScreen')} contentContainerStyle={styles.detailPage} showsVerticalScrollIndicator={false}>
        <View style={styles.sicboHero}>
          <Text style={styles.sicboHeroDice}>三 + 二 = 짓기</Text>
          <Text style={styles.detailLead}>다섯 장 중 셋으로 짓고 둘로 겨루기</Text>
        </View>
        <View style={styles.slotRules}>
          <Text style={styles.slotRulesTitle}>규칙</Text>
          <Text style={styles.slotRuleText}>1. 화투 20장(1~10월 각 두 장)에서 다섯 장을 받습니다.</Text>
          <Text style={styles.slotRuleText}>2. 그중 <Text style={styles.mahjongStrong}>세 장의 월 합이 10·20·30</Text>이 되게 지어 내려놓습니다.</Text>
          <Text style={styles.slotRuleText}>3. 남은 두 장으로 겨룹니다. 같은 달 두 장이면 <Text style={styles.mahjongStrong}>땡</Text>, 아니면 두 달을 더한 <Text style={styles.mahjongStrong}>끗</Text>입니다.</Text>
          <Text style={styles.slotRuleText}>4. 땡이 끗보다 무조건 높고, 장(10)땡이 가장 높습니다. 9끗은 갑오, 0끗은 망통.</Text>
          <Text style={styles.slotRuleText}>5. 세 장으로 10의 배수를 <Text style={styles.mahjongStrong}>못 만들면 그 판은 집니다</Text>. 대략 열 판에 세 판꼴로 나옵니다.</Text>
          <Text style={styles.slotRuleText}>지을 방법이 여럿이면 남는 두 장이 가장 센 쪽으로 자동으로 지어 드립니다.</Text>
        </View>
        <Text style={styles.sectionTitle}>베팅 등급</Text>
        <View style={styles.setupOptions}>
          {difficultyOptions.map((item) => (
            <Pressable key={item.name} style={[styles.setupOption, props.difficulty === item.name && styles.setupOptionActive]} onPress={() => props.onDifficultyChange(item.name)}>
              <Text style={[styles.setupOptionTitle, props.difficulty === item.name && styles.setupOptionTitleActive]}>{betTierName(item.name)}</Text>
              <Text style={styles.setupOptionRange}>{item.min.toLocaleString()}~{item.max.toLocaleString()} WC</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.sectionTitle}>시작 베팅</Text>
        <View style={styles.betGrid}>
          {option.bets.map((amount, index) => <BetOptionCoin key={amount} amount={amount} level={index + 1} selected={props.selectedBet === amount} disabled={amount > props.coins} onPress={() => props.onBetChange(amount)} />)}
        </View>
        <Pressable disabled={props.selectedBet > props.coins} style={[styles.primaryButton, styles.fullWidthButton, props.selectedBet > props.coins && styles.disabledCard]} onPress={props.onStart}>
          <Text style={styles.primaryButtonText}>도리짓고땡 시작</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function DoriGameScreen({coins,selectedBet,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:(mine:number,theirs:number,result:'win'|'loss'|'push',detail:string)=>void}) {
  const [round,setRound]=useState<ReturnType<typeof dealDori>|null>(null);
  const [phase,setPhase]=useState<'ready'|'bet'|'result'>('ready');
  const [betting,setBetting]=useState<PokerBetting>({mine:0,theirs:0,raises:0});
  const [outcome,setOutcome]=useState('');
  const [opponentNote,setOpponentNote]=useState('');
  const [showdown,setShowdown]=useState<ReturnType<typeof resolveDori>|null>(null);

  const myResult=round?evaluateDori(round.player):null;

  const start=()=>{if(!onPlaceBet(selectedBet))return;setRound(dealDori());setBetting({mine:selectedBet,theirs:selectedBet,raises:0});setOutcome('');setOpponentNote('컴퓨터도 같은 금액을 냈습니다');setShowdown(null);setPhase('bet');};

  const settle=(current:PokerBetting,active:ReturnType<typeof dealDori>)=>{
    const resolved=resolveDori(active.player,active.opponent);
    setShowdown(resolved);
    setOutcome(resolved.result==='win'?'내가 이겼습니다':resolved.result==='loss'?'컴퓨터가 이겼습니다':'비겼습니다');
    const label=(r:ReturnType<typeof evaluateDori>)=>r.kind==='hand'?r.hand.name:'못 지음';
    onSettle(current.mine,current.theirs,resolved.result,`${label(resolved.playerHand)} vs ${label(resolved.opponentHand)}`);
    setPhase('result');
  };

  /** 컴퓨터는 상대가 받을 수 있는 다섯 장 3,003가지를 전부 세어 판단합니다. */
  const computerTurn=(current:PokerBetting)=>{
    if(!round)return;
    const equity=doriEquity(round.opponent);
    const action=decidePokerAction({equity,toCall:current.mine-current.theirs,pot:current.mine+current.theirs,raiseSize:selectedBet,canRaise:current.raises<MAX_RAISES_PER_STREET,street:2});
    if(action.kind==='fold'){
      setBetting(current);setOpponentNote('컴퓨터 죽음 — 팟을 가져갑니다');setOutcome('컴퓨터가 죽었습니다');setShowdown(null);
      onSettle(current.mine,current.theirs,'win','컴퓨터 죽음 · 상대 패 비공개');setPhase('result');return;
    }
    if(action.kind==='raise'){
      const next={mine:current.mine,theirs:current.mine+action.amount,raises:current.raises+1};
      setBetting(next);setOpponentNote(`컴퓨터 ${pokerActionLabel(action)} — 받으려면 ${(next.theirs-next.mine).toLocaleString()} WC`);return;
    }
    const next={mine:current.mine,theirs:current.mine,raises:0};
    setBetting(next);
    setOpponentNote(`컴퓨터 ${action.kind==='call'?`받음 ${(current.mine-current.theirs).toLocaleString()} WC`:'체크'}`);
    settle(next,round);
  };

  const toCall=Math.max(0,betting.theirs-betting.mine);
  const fold=()=>{setOutcome('죽었습니다 · 상대 패는 공개하지 않습니다');setShowdown(null);onSettle(betting.mine,betting.theirs,'loss','중간에 죽음 · 상대 패 비공개');setPhase('result');};
  const callOrCheck=()=>{if(toCall>0&&!onPlaceBet(toCall))return;const next={...betting,mine:betting.mine+toCall};setBetting(next);computerTurn(next);};
  const raise=()=>{const need=toCall+selectedBet;if(!onPlaceBet(need))return;const next={mine:betting.mine+need,theirs:betting.theirs,raises:betting.raises+1};setBetting(next);computerTurn(next);};

  /** 지은 세 장은 흐리게, 겨루는 두 장은 그대로 보여 줍니다. */
  const handRow=(cards:HwatuCard[],result:ReturnType<typeof evaluateDori>|null,hidden:boolean,winner:boolean|undefined)=>{
    const buildIds=result&&result.kind==='hand'?new Set(result.hand.build.map((card)=>card.id)):new Set<string>();
    return <View style={styles.hwatuHand}>{cards.map((card)=>
      <HwatuCardView key={card.id} card={card} hidden={hidden} showMonth
        emphasis={hidden?undefined:buildIds.has(card.id)?'dim':winner===undefined?undefined:winner?'winner':'dim'}/>)}</View>;
  };

  const winnerSide=(side:'player'|'opponent')=>{
    if(!showdown||showdown.result==='push')return undefined;
    return (side==='player')===(showdown.result==='win');
  };
  const label=(r:ReturnType<typeof evaluateDori>)=>r.kind==='hand'?`${r.hand.name} · ${r.hand.detail}`:'못 지음 · 세 장으로 10의 배수를 만들 수 없습니다';

  return <View style={styles.detailScreen}><ScreenHeader title="도리짓고땡" onBack={onBack}/><ScrollView contentContainerStyle={styles.holdemPage}>
    <View style={[styles.holdemTable,styles.fiveDrawTable]}>
      <Text style={styles.holdemSeat}>컴퓨터</Text>
      {round?handRow(round.opponent,showdown?evaluateDori(round.opponent):null,!showdown,winnerSide('opponent')):null}
      {showdown?<Text style={styles.pokerInlineResult}>{label(showdown.opponentHand)}</Text>:null}
      <Text style={styles.holdemPot}>POT {(betting.mine+betting.theirs).toLocaleString()} WC</Text>
      <Text style={styles.pokerContribution}>내가 낸 돈 {betting.mine.toLocaleString()} · 컴퓨터 {betting.theirs.toLocaleString()} WC</Text>
      <Text style={styles.holdemSeat}>나</Text>
      {round?handRow(round.player,myResult,false,winnerSide('player')):null}
      {myResult?<Text style={styles.seotdaMyHand}>{label(myResult)}</Text>:null}
      {round&&myResult?.kind==='hand'?<Text style={styles.doriHint}>흐린 세 장이 지은 패입니다</Text>:null}
      {opponentNote?<Text style={styles.pokerOpponentNote}>{opponentNote}</Text>:null}
      <Text style={styles.holdemOutcome}>{outcome||'다섯 장을 받아 시작하세요'}</Text>
    </View>
    {phase!=='bet'
      ?<Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton]} onPress={start}><Text style={styles.primaryButtonText}>{phase==='result'?'다시 하기':'다섯 장 받기'} · {selectedBet.toLocaleString()} WC</Text></Pressable>
      :<View style={styles.holdemActions}>
        <Pressable style={styles.holdemFold} onPress={fold}><Text style={styles.holdemActionText}>죽기</Text></Pressable>
        <Pressable disabled={toCall>coins} style={[styles.holdemAction,toCall>coins&&styles.disabledCard]} onPress={callOrCheck}><Text style={styles.primaryButtonText}>{toCall>0?`받기 ${toCall.toLocaleString()}`:'체크'}</Text></Pressable>
        <Pressable disabled={toCall+selectedBet>coins||betting.raises>=MAX_RAISES_PER_STREET} style={[styles.holdemAction,(toCall+selectedBet>coins||betting.raises>=MAX_RAISES_PER_STREET)&&styles.disabledCard]} onPress={raise}><Text style={styles.primaryButtonText}>더 걸기 +{selectedBet.toLocaleString()}</Text></Pressable>
      </View>}
    <Text style={styles.disclaimer}>세 장으로 10의 배수를 못 만들면 집니다 · 상대 패는 끝까지 갔을 때만 공개됩니다</Text>
  </ScrollView></View>;
}

function SeotdaSetupScreen(props: { coins:number; difficulty:string; selectedBet:number; rules:SeotdaRules; onRulesChange:(v:SeotdaRules)=>void; onBack:()=>void; onDifficultyChange:(v:string)=>void; onBetChange:(v:number)=>void; onStart:()=>void }) {
  const option = difficultyOptions.find((item) => item.name === props.difficulty) ?? difficultyOptions[2];
  const deck=createHwatuDeck();
  const monthCards=Array.from({length:10},(_,index)=>deck.find((card)=>card.month===index+1)!);
  return (
    <View style={styles.detailScreen}>
      <ScreenHeader title="섰다 준비" onBack={props.onBack} />
      <ScrollView {...useScrollMemory('SeotdaSetupScreen')} contentContainerStyle={styles.detailPage} showsVerticalScrollIndicator={false}>
        <View style={styles.sicboHero}>
          <Text style={styles.sicboHeroDice}>光 十 띠</Text>
          <Text style={styles.detailLead}>화투 두 장으로 겨루는 승부</Text>
        </View>
        <View style={styles.hwatuMonthGuide}>
          <Text style={styles.slotRulesTitle}>1월부터 10월 그림 순서</Text>
          <Text style={styles.slotRuleText}>섰다는 그림 이름보다 카드 왼쪽 위의 월 숫자로 계산합니다. 먼저 이 순서만 익히면 됩니다.</Text>
          <View style={styles.hwatuMonthGrid}>{monthCards.map((card)=><View key={card.month} style={styles.hwatuMonthGuideItem}><HwatuCardView card={card}/><Text style={styles.hwatuMonthGuideLabel}>{card.month}월 · {monthNames[card.month]}</Text></View>)}</View>
        </View>
        <View style={styles.seotdaStrengthGuide}>
          <Text style={styles.slotRulesTitle}>약한 패 → 강한 패</Text>
          <Text style={styles.seotdaStrengthText}>망통(0끗) → 1~8끗 → 갑오(9끗) → 세륙 → 장사 → 장삥 → 구삥 → 독사 → 알리 → 1땡~장땡 → 일팔광땡 → 일삼광땡 → 삼팔광땡</Text>
        </View>
        <View style={styles.slotRules}>
          <Text style={styles.slotRulesTitle}>족보 (높은 순)</Text>
          <Text style={styles.slotRuleText}>1. 삼팔광땡 · 일삼광땡 · 일팔광땡 — 광 두 장</Text>
          <Text style={styles.slotRuleText}>2. 땡 — 같은 달 두 장. 장(10)땡이 가장 높습니다</Text>
          <Text style={styles.slotRuleText}>3. 알리(1·2) · 독사(1·4) · 구삥(1·9) · 장삥(1·10) · 장사(4·10) · 세륙(4·6)</Text>
          <Text style={styles.slotRuleText}>4. 끗 — 두 달을 더해 10으로 나눈 나머지. 9끗이 갑오, 0끗이 망통</Text>
          <Text style={styles.slotRuleText}>같은 족보면 비기고 낸 돈을 돌려받습니다.</Text>
        </View>
        <Text style={styles.sectionTitle}>특수 족보</Text>
        <View style={styles.panel}>
          {(Object.keys(seotdaRuleLabels) as (keyof SeotdaRules)[]).map((key, index) => (
            <React.Fragment key={key}>
              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{seotdaRuleLabels[key].title}</Text>
                  <Text style={styles.smallText}>{seotdaRuleLabels[key].detail}</Text>
                </View>
                <Switch
                  value={props.rules[key]}
                  onValueChange={(value) => props.onRulesChange({ ...props.rules, [key]: value })}
                  trackColor={{ false: '#303746', true: '#80651F' }}
                  thumbColor={props.rules[key] ? '#E4BC55' : '#9AA2B0'}
                />
              </View>
              {index < 2 && <View style={styles.separator} />}
            </React.Fragment>
          ))}
        </View>
        <Text style={styles.helperText}>특수 족보는 지역마다 쓰는 곳도 있고 안 쓰는 곳도 있어 끄고 켤 수 있게 했습니다.</Text>
        <Text style={styles.sectionTitle}>베팅 등급</Text>
        <View style={styles.setupOptions}>
          {difficultyOptions.map((item) => (
            <Pressable key={item.name} style={[styles.setupOption, props.difficulty === item.name && styles.setupOptionActive]} onPress={() => props.onDifficultyChange(item.name)}>
              <Text style={[styles.setupOptionTitle, props.difficulty === item.name && styles.setupOptionTitleActive]}>{betTierName(item.name)}</Text>
              <Text style={styles.setupOptionRange}>{item.min.toLocaleString()}~{item.max.toLocaleString()} WC</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.sectionTitle}>시작 베팅</Text>
        <View style={styles.betGrid}>
          {option.bets.map((amount, index) => <BetOptionCoin key={amount} amount={amount} level={index + 1} selected={props.selectedBet === amount} disabled={amount > props.coins} onPress={() => props.onBetChange(amount)} />)}
        </View>
        <Pressable disabled={props.selectedBet > props.coins} style={[styles.primaryButton, styles.fullWidthButton, props.selectedBet > props.coins && styles.disabledCard]} onPress={props.onStart}>
          <Text style={styles.primaryButtonText}>섰다 시작</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SeotdaGameScreen({coins,selectedBet,rules,onBack,onPlaceBet,onSettle}:{coins:number;selectedBet:number;rules:SeotdaRules;onBack:()=>void;onPlaceBet:(v:number)=>boolean;onSettle:(mine:number,theirs:number,result:'win'|'loss'|'push',detail:string)=>void}) {
  const [round,setRound]=useState<ReturnType<typeof dealSeotda>|null>(null);
  const [phase,setPhase]=useState<'ready'|'bet'|'result'>('ready');
  const [betting,setBetting]=useState<PokerBetting>({mine:0,theirs:0,raises:0});
  const [outcome,setOutcome]=useState('');
  const [opponentNote,setOpponentNote]=useState('');
  const [showdown,setShowdown]=useState<ReturnType<typeof resolveSeotda>|null>(null);

  const start=()=>{if(!onPlaceBet(selectedBet))return;setRound(dealSeotda());setBetting({mine:selectedBet,theirs:selectedBet,raises:0});setOutcome('두 장을 받았습니다');setOpponentNote('컴퓨터도 같은 금액을 냈습니다');setShowdown(null);setPhase('bet');};

  const settle=(current:PokerBetting,active:ReturnType<typeof dealSeotda>)=>{
    const resolved=resolveSeotda(active.player,active.opponent,rules);
    setShowdown(resolved);
    setOutcome(resolved.voided?'멍텅구리구사 · 판이 무효가 되어 낸 돈을 돌려받습니다':resolved.result==='win'?'내가 이겼습니다':resolved.result==='loss'?'컴퓨터가 이겼습니다':'같은 족보 · 비겼습니다');
    onSettle(current.mine,current.theirs,resolved.result,`${resolved.playerHand.name} vs ${resolved.opponentHand.name}`);
    setPhase('result');
  };

  /** 컴퓨터는 자기 두 장으로 이길 확률을 전부 세어 판단합니다(경우의 수 153가지). */
  const computerTurn=(current:PokerBetting)=>{
    if(!round)return;
    const equity=seotdaEquity(round.opponent,rules);
    const action=decidePokerAction({equity,toCall:current.mine-current.theirs,pot:current.mine+current.theirs,raiseSize:selectedBet,canRaise:current.raises<MAX_RAISES_PER_STREET,street:2});
    if(action.kind==='fold'){
      setBetting(current);setOpponentNote('컴퓨터 죽음 — 팟을 가져갑니다');setOutcome('컴퓨터가 죽었습니다');setShowdown(null);
      onSettle(current.mine,current.theirs,'win','컴퓨터 죽음 · 상대 패 비공개');setPhase('result');return;
    }
    if(action.kind==='raise'){
      const next={mine:current.mine,theirs:current.mine+action.amount,raises:current.raises+1};
      setBetting(next);setOpponentNote(`컴퓨터 ${pokerActionLabel(action)} — 받으려면 ${(next.theirs-next.mine).toLocaleString()} WC`);return;
    }
    const next={mine:current.mine,theirs:current.mine,raises:0};
    setBetting(next);
    setOpponentNote(`컴퓨터 ${action.kind==='call'?`받음 ${(current.mine-current.theirs).toLocaleString()} WC`:'체크'}`);
    settle(next,round);
  };

  const toCall=Math.max(0,betting.theirs-betting.mine);
  const fold=()=>{setOutcome('죽었습니다 · 상대 패는 공개하지 않습니다');setShowdown(null);onSettle(betting.mine,betting.theirs,'loss','중간에 죽음 · 상대 패 비공개');setPhase('result');};
  const callOrCheck=()=>{if(toCall>0&&!onPlaceBet(toCall))return;const next={...betting,mine:betting.mine+toCall};setBetting(next);computerTurn(next);};
  const raise=()=>{const need=toCall+selectedBet;if(!onPlaceBet(need))return;const next={mine:betting.mine+need,theirs:betting.theirs,raises:betting.raises+1};setBetting(next);computerTurn(next);};

  const emphasis=(side:'player'|'opponent'):'winner'|'dim'|undefined=>{
    if(!showdown||showdown.voided||showdown.result==='push')return undefined;
    return (side==='player')===(showdown.result==='win')?'winner':'dim';
  };

  return <View style={styles.detailScreen}><ScreenHeader title="섰다" onBack={onBack}/><ScrollView contentContainerStyle={styles.holdemPage}>
    <View style={[styles.holdemTable,styles.fiveDrawTable]}>
      <Text style={styles.holdemSeat}>컴퓨터</Text>
      <View style={styles.hwatuHand}>{round?round.opponent.map((card)=><HwatuCardView key={card.id} card={card} hidden={!showdown} emphasis={emphasis('opponent')} showMonth/>):null}</View>
      {showdown?<Text style={styles.pokerInlineResult}>{showdown.opponentHand.name} · {showdown.opponentHand.detail}</Text>:null}
      <Text style={styles.holdemPot}>POT {(betting.mine+betting.theirs).toLocaleString()} WC</Text>
      <Text style={styles.pokerContribution}>내가 낸 돈 {betting.mine.toLocaleString()} · 컴퓨터 {betting.theirs.toLocaleString()} WC</Text>
      <Text style={styles.holdemSeat}>나</Text>
      <View style={styles.hwatuHand}>{round?round.player.map((card)=><HwatuCardView key={card.id} card={card} emphasis={emphasis('player')} showMonth/>):null}</View>
      {round?<Text style={styles.seotdaMyHand}>{evaluateSeotda(round.player,rules).name} · {evaluateSeotda(round.player,rules).detail}</Text>:null}
      {opponentNote?<Text style={styles.pokerOpponentNote}>{opponentNote}</Text>:null}
      <Text style={styles.holdemOutcome}>{outcome||'두 장을 받아 시작하세요'}</Text>
    </View>
    {phase!=='bet'
      ?<Pressable disabled={selectedBet>coins} style={[styles.primaryButton,styles.fullWidthButton]} onPress={start}><Text style={styles.primaryButtonText}>{phase==='result'?'다시 하기':'두 장 받기'} · {selectedBet.toLocaleString()} WC</Text></Pressable>
      :<View style={styles.holdemActions}>
        <Pressable style={styles.holdemFold} onPress={fold}><Text style={styles.holdemActionText}>죽기</Text></Pressable>
        <Pressable disabled={toCall>coins} style={[styles.holdemAction,toCall>coins&&styles.disabledCard]} onPress={callOrCheck}><Text style={styles.primaryButtonText}>{toCall>0?`받기 ${toCall.toLocaleString()}`:'체크'}</Text></Pressable>
        <Pressable disabled={toCall+selectedBet>coins||betting.raises>=MAX_RAISES_PER_STREET} style={[styles.holdemAction,(toCall+selectedBet>coins||betting.raises>=MAX_RAISES_PER_STREET)&&styles.disabledCard]} onPress={raise}><Text style={styles.primaryButtonText}>더 걸기 +{selectedBet.toLocaleString()}</Text></Pressable>
      </View>}
    <Text style={styles.disclaimer}>같은 족보면 비깁니다 · 상대 패는 끝까지 갔을 때만 공개됩니다{betting.raises>=MAX_RAISES_PER_STREET&&phase==='bet'?' · 더 걸기 한도 도달':''}</Text>
  </ScrollView></View>;
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
    // 스플릿한 손의 21은 블랙잭이 아니므로 2.5배가 아닌 2배로 정산합니다.
    const results = [resolveRound(firstHand, dealerResult.hand, false), resolveRound(secondHand, dealerResult.hand, false)];
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
        <View style={styles.gameTopActions}><View style={styles.gameBetPill}><CoinStack amount={totalBet} compact /><Text style={styles.gameBetText}>{phase === 'result' ? '정산 완료' : '베팅 중'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="블랙잭 나가기" style={styles.gameExitButton} onPress={props.onExit}><Text style={styles.gameExitButtonText}>나가기</Text></Pressable></View>
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
  return <View style={styles.detailScreen}><ScreenHeader title="크랩스(Craps) 준비" onBack={props.onBack} /><ScrollView {...useScrollMemory('CrapsSetupScreen')} contentContainerStyle={styles.detailPage} showsVerticalScrollIndicator={false}><View style={styles.crapsSetupHero}><Text style={styles.crapsHeroDice}>⚄ ⚂</Text><Text style={styles.detailLead}>주사위 합으로 승부</Text><Text style={styles.gameListDescription}>두 주사위를 굴리고 포인트가 7보다 먼저 나올지 예측합니다.</Text></View><CrapsRules /><Text style={styles.sectionTitle}>베팅 등급</Text><View style={styles.setupOptions}>{difficultyOptions.map((item) => <Pressable key={item.name} style={[styles.setupOption, props.difficulty === item.name && styles.setupOptionActive]} onPress={() => props.onDifficultyChange(item.name)}><Text style={[styles.setupOptionTitle, props.difficulty === item.name && styles.setupOptionTitleActive]}>{betTierName(item.name)}</Text><Text style={styles.setupOptionRange}>{item.min.toLocaleString()}~{item.max.toLocaleString()} WC</Text></Pressable>)}</View><Text style={styles.sectionTitle}>시작 베팅 금액</Text><View style={styles.betGrid}>{option.bets.map((amount, index) => <BetOptionCoin key={amount} amount={amount} level={index + 1} selected={props.selectedBet === amount} onPress={() => props.onBetChange(amount)} />)}</View><View style={styles.setupSummary}><Row title="보유 코인" value={`${props.coins.toLocaleString()} WC`} /><View style={styles.separator} /><Row title="베팅 등급" value={betTierName(props.difficulty)} /><View style={styles.separator} /><Row title="선택 베팅" value={`${props.selectedBet.toLocaleString()} WC`} /></View><Pressable style={[styles.primaryButton, styles.fullWidthButton]} onPress={props.onStart}><Text style={styles.primaryButtonText}>크랩스(Craps) 시작</Text></Pressable></ScrollView></View>;
}

function Die({ value, rolling=false, index=0 }: { value: number; rolling?:boolean; index?:number }) {
  return <View style={[styles.die,rolling&&styles.dieRolling,{transform:[{rotate:rolling?`${(value*47+index*71)%360}deg`:'0deg'},{translateY:rolling?(index%2===0?-7:6):0},{scale:rolling?1.08:1}]}]}><Text style={styles.dieText}>{['','⚀','⚁','⚂','⚃','⚄','⚅'][value]}</Text></View>;
}

function FaceDownCardDeck({label='DECK'}:{label?:string}){
  return <View style={styles.tableDeckArea}><View style={styles.tableDeckShadow}/><View style={[styles.playingCard,styles.compactPlayingCard,styles.hiddenCard,styles.tableDeckCard]}><Text style={styles.hiddenCardMark}>◆</Text></View><Text style={styles.tableDeckLabel}>{label}</Text></View>;
}

function CrapsGameScreen({ coins, difficulty: savedTier, selectedBet, onBack, onBetChange, onPlaceBet, onSettle }: { coins: number; difficulty: string; selectedBet: number; onBack: () => void; onBetChange: (value: number) => void; onPlaceBet: (stake: number) => boolean; onSettle: (bet: CrapsBet, stake: number, result: CrapsRollResult) => void }) {
  const [bet, setBet] = useState<CrapsBet>('pass'); const [point, setPoint] = useState<number | null>(null); const [last, setLast] = useState<CrapsRollResult | null>(null); const [active, setActive] = useState(false); const [rolling,setRolling]=useState(false); const [rollingDice,setRollingDice]=useState<[number,number]>([1,6]); const option = difficultyOptions.find((item) => item.name === savedTier) ?? difficultyOptions[2]; const difficulty = betTierName(savedTier);
  const names = { pass: '패스 라인', dontPass: '돈트 패스', field: '필드' } as const;
  const roll = () => { if(rolling)return;if (!active && !onPlaceBet(selectedBet)) return;setRolling(true);setLast(null);const timer=setInterval(()=>setRollingDice(rollDice()),80);setTimeout(()=>{clearInterval(timer);const dice=rollDice();setRollingDice(dice);const result = resolveCrapsRoll(bet, point, dice); setLast(result);setRolling(false); if (result.outcome === 'continue') { setPoint(result.point); setActive(true); } else { setPoint(null); setActive(false); onSettle(bet, selectedBet, result); }},900); };
  const shownDice=rolling?rollingDice:last?.dice??rollingDice;
  return <View style={styles.crapsScreen}><ScreenHeader title="크랩스(Craps)" onBack={onBack} /><ScrollView contentContainerStyle={styles.crapsPage} showsVerticalScrollIndicator={false}><View style={styles.rouletteStatusRow}><View><Text style={styles.eyebrow}>CRAPS</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View><View style={styles.difficultyBadge}><Text style={styles.difficultyBadgeText}>{difficulty}</Text></View></View><View style={[styles.crapsTable,rolling&&styles.diceTableRolling]}><Text style={styles.crapsPointLabel}>{rolling?'ROLLING…':point ? `POINT ${point}` : 'COME OUT'}</Text><View style={styles.diceRow}>{shownDice.map((value,index)=><Die key={index} value={value} rolling={rolling} index={index}/>)}</View><Text style={styles.crapsTotal}>{rolling?'주사위가 테이블 위를 구릅니다':last ? `합계 ${last.total}` : '주사위를 굴려보세요'}</Text>{last?.outcome === 'continue' && <Text style={styles.crapsContinue}>포인트 {last.point} · 다시 굴리세요</Text>}{last && last.outcome !== 'continue' && <Text style={[styles.crapsOutcome, last.outcome === 'win' ? styles.positive : last.outcome === 'loss' ? styles.negative : null]}>{last.outcome === 'win' ? '승리' : last.outcome === 'loss' ? '패배' : '무승부'} · {crapsNet(bet, selectedBet, last) > 0 ? '+' : ''}{crapsNet(bet, selectedBet, last).toLocaleString()} WC</Text>}</View><Pressable disabled={rolling} style={[styles.primaryButton, styles.rouletteSpinButton, styles.gameResultAction,rolling&&styles.disabledCard]} onPress={roll}><Text style={styles.primaryButtonText}>{rolling?'주사위 굴리는 중…':active ? `포인트 ${point} · 다시 굴리기` : `${names[bet]}에 ${selectedBet.toLocaleString()} WC 베팅`}</Text></Pressable><Text style={styles.sectionTitle}>베팅 위치</Text><View style={styles.crapsBetGrid}>{(['pass','dontPass','field'] as CrapsBet[]).map((item) => <Pressable key={item} disabled={active||rolling} style={[styles.crapsBetArea, bet === item && styles.baccaratBetActive]} onPress={() => { setBet(item); setLast(null); }} >{bet === item && !active && <CoinStack amount={selectedBet} compact />}<Text style={styles.baccaratBetTitle}>{names[item]}</Text><Text style={styles.baccaratOdds}>{item === 'field' ? '한 번 굴림' : '1:1'}</Text></Pressable>)}</View><Text style={styles.sectionTitle}>베팅 금액</Text><View style={styles.betGrid}>{option.bets.map((amount, index) => <BetOptionCoin key={amount} amount={amount} level={index + 1} selected={selectedBet === amount} disabled={active||rolling} onPress={() => onBetChange(amount)} />)}</View><Text style={styles.disclaimer}>게임 전용 가상 코인 · 필드 2·12는 2배 수익</Text></ScrollView></View>;
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
      <ScrollView {...useScrollMemory('BaccaratSetupScreen')} contentContainerStyle={styles.detailPage} showsVerticalScrollIndicator={false}>
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
  motion,
  onBack,
  onBetChange,
  onPlaceBet,
  onSettle,
}: {
  coins: number;
  difficulty: string;
  selectedBet: number;
  motion: number;
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

  // 스핀을 누르는 순간 코인이 빠지므로, 회전 애니메이션이 끝나든 중간에 화면을 벗어나든
  // 정산은 반드시 한 번 실행되어야 합니다. 결과 숫자는 이미 정해져 있습니다.
  const pendingSettle = useRef<(() => void) | null>(null);
  const settleOnce = () => {
    const run = pendingSettle.current;
    pendingSettle.current = null;
    run?.();
  };

  // 회전 중 마커가 가리키는 숫자를 실시간으로 따라갑니다. 마지막 저속 구간에서
  // 숫자가 한 칸씩 넘어가는 것이 보여야 긴장감이 생깁니다.
  const [tickingNumber, setTickingNumber] = useState<number | null>(null);
  const tickingRef = useRef<number | null>(null);

  useEffect(() => {
    const id = wheelProgress.addListener(({ value }) => {
      const step = 360 / europeanWheelOrder.length;
      const normalized = ((-value % 360) + 360) % 360;
      const index = Math.round(normalized / step) % europeanWheelOrder.length;
      const pocket = europeanWheelOrder[index];
      if (tickingRef.current !== pocket) {
        tickingRef.current = pocket;
        setTickingNumber(pocket);
      }
    });
    return () => {
      wheelProgress.removeListener(id);
      wheelProgress.stopAnimation();
      settleOnce();
    };
  }, [wheelProgress]);

  const spin = () => {
    if (phase === 'spinning' || !onPlaceBet(selectedBet)) return;
    const number = spinRoulette();
    const pocketIndex = europeanWheelOrder.indexOf(number);
    const step = 360 / europeanWheelOrder.length;
    const landing = 360 - pocketIndex * step;
    // 1단계에서 빠르게 여섯 바퀴를 돌고, 2단계에서 마지막 한 바퀴 반을 기어가듯 붙입니다.
    const handoff = 360 * 6 + landing - 540;
    const target = 360 * 6 + landing;

    wheelProgress.setValue(0);
    setPhase('spinning');
    setResultNumber(null);
    pendingSettle.current = () => onSettle(bet, selectedBet, number, betLabel);

    Animated.sequence([
      Animated.timing(wheelProgress, {
        toValue: handoff,
        duration: Math.max(120, Math.round(2400 * motion)),
        easing: Easing.bezier(0.22, 0.68, 0.42, 0.92),
        useNativeDriver: true,
      }),
      Animated.timing(wheelProgress, {
        toValue: target,
        duration: Math.max(180, Math.round(3400 * motion)),
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      setResultNumber(number);
      setPhase('result');
      settleOnce();
    });
  };

  const wheelRotation = wheelProgress.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });
  const shownNumber = phase === 'spinning' ? tickingNumber : resultNumber;
  const shownColor = shownNumber === null ? null : rouletteColor(shownNumber);

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
          <View style={styles.rouletteBall} />
          <View style={[styles.rouletteWheel, phase === 'spinning' && styles.rouletteWheelSpinning]}>
            <Animated.View style={[styles.rouletteWheelRing, { transform: [{ rotate: wheelRotation }] }]}>
              {europeanWheelOrder.map((number, index) => {
                const angle = index * (360 / europeanWheelOrder.length);
                const radians = angle * Math.PI / 180;
                const center = 150;
                const radius = 124;
                const left = center + Math.sin(radians) * radius - 17;
                const top = center - Math.cos(radians) * radius - 14;
                const color = rouletteColor(number);
                return (
                  <View key={number} style={[styles.roulettePocket, { left, top, transform: [{ rotate: `${angle}deg` }] }, color === 'red' ? styles.roulettePocketRed : color === 'black' ? styles.roulettePocketBlack : styles.roulettePocketGreen]}>
                    <Text style={styles.roulettePocketText}>{number}</Text>
                  </View>
                );
              })}
              <View style={styles.rouletteSpokes} />
            </Animated.View>
            <View style={styles.rouletteBowl}>
              <View style={styles.rouletteHub} />
              <Text
                style={[
                  styles.rouletteResultNumber,
                  shownColor === 'red' && styles.rouletteRedText,
                  shownColor === 'green' && styles.rouletteGreenText,
                  phase === 'spinning' && styles.rouletteNumberTicking,
                ]}
              >
                {shownNumber ?? '◎'}
              </Text>
              <Text style={styles.rouletteWheelLabel}>
                {phase === 'spinning' ? '멈추는 중…' : resultNumber === null ? '베팅 선택' : rouletteColor(resultNumber).toUpperCase()}
              </Text>
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

type WalletAnalysis = 'game' | 'tier' | 'ledger';

/** 기록 묶음 하나의 요약치. 게임별·등급별 분석이 같은 계산을 씁니다. */
function summariseRecords(records: GameRecord[]) {
  const plays = records.length;
  const wins = records.filter((record) => record.result === 'win' || record.result === 'blackjack').length;
  const pushes = records.filter((record) => record.result === 'push').length;
  const losses = plays - wins - pushes;
  const net = records.reduce((sum, record) => sum + record.net, 0);
  const stake = records.reduce((sum, record) => sum + record.bet, 0);
  return {
    plays, wins, pushes, losses, net, stake,
    winRate: plays > 0 ? wins / plays * 100 : 0,
    returnRate: stake > 0 ? net / stake * 100 : 0,
  };
}

const signed = (value: number) => `${value > 0 ? '+' : ''}${value.toLocaleString()}`;

function WalletScreen({ coins, records }: { coins: number; records: GameRecord[] }) {
  const [analysis, setAnalysis] = useState<WalletAnalysis | null>(null);
  const overall = summariseRecords(records);
  // 최근 여덟 판의 손익을 막대로 보여 줍니다(고정 그림이 아니라 실제 기록).
  // 판이 적어도 자리 여덟 칸은 그대로 두어, 막대 한두 개가 화면을 덮지 않게 합니다.
  const CHART_SLOTS = 8;
  const recentNets = records.slice(0, CHART_SLOTS).map((record) => record.net).reverse();
  const peak = Math.max(1, ...recentNets.map((value) => Math.abs(value)));
  const chartSlots = Array.from({ length: CHART_SLOTS }, (_, index) => {
    const at = index - (CHART_SLOTS - recentNets.length);
    if (at < 0) return null;
    const value = recentNets[at];
    return { value, height: 8 + Math.round(Math.abs(value) / peak * 60) };
  });

  if (analysis) return <WalletAnalysisScreen kind={analysis} records={records} onBack={() => setAnalysis(null)} />;

  return (
    <Page>
      <Text style={styles.pageTitle}>지갑</Text>
      <View style={styles.balanceCard}>
        <Text style={styles.muted}>전체 자산</Text>
        <Text style={styles.balance}>{coins.toLocaleString()} WC</Text>
        <Text style={overall.net >= 0 ? styles.positive : styles.negative}>누적 {signed(overall.net)} WC ({overall.returnRate.toFixed(1)}%)</Text>
        {recentNets.length > 0
          ? <>
              <View style={styles.chart}>
                {chartSlots.map((slot, index) => (
                  <View key={index} style={styles.chartSlot}>
                    {slot
                      ? <View style={[styles.chartBar, { height: slot.height }, slot.value < 0 && styles.chartBarLoss]} />
                      : <View style={styles.chartBarEmpty} />}
                  </View>
                ))}
              </View>
              <Text style={styles.chartCaption}>최근 {recentNets.length}판 손익 · 금색은 이익, 붉은색은 손실</Text>
            </>
          : <Text style={styles.emptyText}>게임을 완료하면 최근 손익 그래프가 나타납니다.</Text>}
      </View>
      <Text style={styles.sectionTitle}>카테고리별 비교</Text>
      <View style={styles.panel}>
        {gameCategories.map((category, index) => {
          const inCategory = records.filter((record) => gameCategoryOf(record.game) === category.name);
          const value = inCategory.reduce((sum, record) => sum + record.net, 0);
          return (
            <React.Fragment key={category.name}>
              <Row
                title={category.name}
                subtitle={inCategory.length > 0 ? `${inCategory.length}판` : undefined}
                value={`${signed(value)} WC`}
                positive={value > 0}
              />
              {index < gameCategories.length - 1 && <View style={styles.separator} />}
            </React.Fragment>
          );
        })}
      </View>
      <Text style={styles.sectionTitle}>분석 메뉴</Text>
      <View style={styles.panel}>
        <Pressable accessibilityRole="button" onPress={() => setAnalysis('game')}><Row title="게임별 손익" subtitle={`${new Set(records.map((record) => record.game)).size}개 게임`} value="보기  ›" /></Pressable>
        <View style={styles.separator} />
        <Pressable accessibilityRole="button" onPress={() => setAnalysis('tier')}><Row title="베팅 등급별 수익률" subtitle={`${new Set(records.map((record) => record.difficulty)).size}개 등급`} value="보기  ›" /></Pressable>
        <View style={styles.separator} />
        <Pressable accessibilityRole="button" onPress={() => setAnalysis('ledger')}><Row title="전체 거래 내역" subtitle={`${records.length}건`} value="보기  ›" /></Pressable>
      </View>
    </Page>
  );
}

const walletAnalysisTitle: Record<WalletAnalysis, string> = {
  game: '게임별 손익',
  tier: '베팅 등급별 수익률',
  ledger: '전체 거래 내역',
};

function WalletAnalysisScreen({ kind, records, onBack }: { kind: WalletAnalysis; records: GameRecord[]; onBack: () => void }) {
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'win' | 'loss'>('all');

  const groups = (() => {
    if (kind === 'game') {
      const names = [...new Set(records.map((record) => record.game))];
      return names
        .map((name) => ({ key: name, label: gameDisplayName(name), sub: gameCategoryOf(name), stats: summariseRecords(records.filter((record) => record.game === name)) }))
        .sort((a, b) => b.stats.net - a.stats.net);
    }
    if (kind === 'tier') {
      // 등급은 항상 다섯 칸을 모두 보여 주어야 어디를 안 해봤는지 알 수 있습니다.
      return difficultyOptions.map((option) => ({
        key: option.name,
        label: betTierName(option.name),
        sub: `${option.min.toLocaleString()}~${option.max.toLocaleString()} WC`,
        stats: summariseRecords(records.filter((record) => record.difficulty === option.name)),
      }));
    }
    return [];
  })();

  const ledger = records.filter((record) =>
    ledgerFilter === 'all' ? true
    : ledgerFilter === 'win' ? record.net > 0
    : record.net < 0);

  return (
    <Page>
      <View style={styles.analysisHeader}>
        <Pressable accessibilityRole="button" accessibilityLabel="뒤로" style={styles.analysisBack} onPress={onBack}><Text style={styles.analysisBackText}>‹</Text></Pressable>
        <Text style={styles.pageTitle}>{walletAnalysisTitle[kind]}</Text>
      </View>

      {records.length === 0 && <View style={styles.panel}><Text style={styles.emptyText}>아직 기록이 없습니다. 게임을 한 판 마치면 여기에 쌓입니다.</Text></View>}

      {kind !== 'ledger' && records.length > 0 && (
        <View style={styles.panel}>
          {groups.map((group, index) => (
            <React.Fragment key={group.key}>
              {group.stats.plays === 0
                ? <Row title={group.label} subtitle={group.sub} value="기록 없음" />
                : <Row
                    title={group.label}
                    subtitle={`${group.sub} · ${group.stats.plays}판 · 승률 ${group.stats.winRate.toFixed(1)}% · 베팅 ${group.stats.stake.toLocaleString()} WC`}
                    value={`${signed(group.stats.net)} WC\n${group.stats.returnRate.toFixed(1)}%`}
                    positive={group.stats.net > 0}
                  />}
              {index < groups.length - 1 && <View style={styles.separator} />}
            </React.Fragment>
          ))}
        </View>
      )}

      {kind === 'ledger' && records.length > 0 && (
        <>
          <View style={styles.filterRow}>
            {([['all', `전체 ${records.length}`], ['win', `수익 ${records.filter((record) => record.net > 0).length}`], ['loss', `손실 ${records.filter((record) => record.net < 0).length}`]] as const).map(([key, label]) => (
              <Pressable key={key} accessibilityRole="button" style={[styles.filterChip, ledgerFilter === key && styles.filterChipActive]} onPress={() => setLedgerFilter(key)}>
                <Text style={[styles.filterChipText, ledgerFilter === key && styles.filterChipTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.panel}>
            {ledger.length === 0 && <Text style={styles.emptyText}>해당하는 기록이 없습니다.</Text>}
            {ledger.map((record, index) => (
              <React.Fragment key={record.id}>
                <Row
                  title={`${gameDisplayName(record.game)} · ${resultLabel(record.result)}`}
                  subtitle={`${record.detail ? `${record.detail} · ` : ''}${formatPlayedAt(record.playedAt)} · ${betTierName(record.difficulty)} · 베팅 ${record.bet.toLocaleString()} WC`}
                  value={`${signed(record.net)} WC`}
                  positive={record.net > 0}
                />
                {index < ledger.length - 1 && <View style={styles.separator} />}
              </React.Fragment>
            ))}
          </View>
        </>
      )}
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

function RecordsScreen({ records, totalPlays }: { records: GameRecord[]; totalPlays: number }) {
  const wins = records.filter((record) => record.result === 'win' || record.result === 'blackjack').length;
  const winRate = records.length > 0 ? wins / records.length * 100 : 0;
  const totalNet = records.reduce((sum, record) => sum + record.net, 0);
  const rank = levelFromPlays(totalPlays);
  return (
    <Page>
      <Text style={styles.pageTitle}>기록</Text>
      <View style={styles.levelCard}>
        <View style={styles.levelHeadRow}>
          <Text style={styles.levelBadge}>LV. {rank.level}</Text>
          <Text style={styles.muted}>누적 {totalPlays.toLocaleString()}판</Text>
        </View>
        <View style={styles.progressTrack}><View style={[styles.progressValue, { width: `${Math.round(rank.progress * 100)}%` }]} /></View>
        <Text style={styles.smallText}>다음 레벨까지 {rank.playsToNext}판 · 이번 레벨 {rank.playsIntoLevel} / {rank.playsForLevel}판</Text>
        <Text style={styles.helperText}>레벨은 이기고 지는 것과 상관없이 플레이한 판수로만 오릅니다.</Text>
      </View>
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

/** 접근성 요약 한 줄. 켜진 항목 이름만 붙여 보여 줍니다. */
function accessibilitySummary(options: AccessibilityOptions) {
  const on = (Object.keys(accessibilityLabels) as (keyof AccessibilityOptions)[]).filter((key) => options[key]);
  return on.length === 0 ? '모두 꺼짐' : on.map((key) => accessibilityLabels[key].title).join(' · ');
}

function SettingsScreen(props: {
  difficulty: string;
  saveDifficulty: (value: string) => void;
  sound: boolean;
  setSound: (value: boolean) => void;
  vibration: boolean;
  setVibration: (value: boolean) => void;
  gameSpeed: GameSpeed;
  setGameSpeed: (value: GameSpeed) => void;
  accessibility: AccessibilityOptions;
  setAccessibility: (value: AccessibilityOptions) => void;
  onRefillCoins: () => void;
  onExportBackup: () => void;
  onPickBackup: () => void;
  onApplyImport: () => void;
  onCancelImport: () => void;
  backupNote: string;
  pendingImport: { summary: string } | null;
}) {
  const [detail, setDetail] = useState<'speed' | 'accessibility' | null>(null);

  if (detail === 'speed') return (
    <Page>
      <View style={styles.analysisHeader}>
        <Pressable accessibilityRole="button" accessibilityLabel="뒤로" style={styles.analysisBack} onPress={() => setDetail(null)}><Text style={styles.analysisBackText}>‹</Text></Pressable>
        <Text style={styles.pageTitle}>게임 진행 속도</Text>
      </View>
      <Text style={styles.helperText}>룰렛이 도는 시간, 슬롯 릴이 멈추는 시간, 주사위가 구르는 시간에 바로 적용됩니다.</Text>
      <View style={styles.panel}>
        {gameSpeedOptions.map((option, index) => (
          <React.Fragment key={option.name}>
            <Pressable accessibilityRole="button" onPress={() => props.setGameSpeed(option.name)}>
              <Row title={option.name} subtitle={option.detail} value={props.gameSpeed === option.name ? '● 사용 중' : `${option.factor}배`} positive={props.gameSpeed === option.name} />
            </Pressable>
            {index < gameSpeedOptions.length - 1 && <View style={styles.separator} />}
          </React.Fragment>
        ))}
      </View>
      {props.accessibility.reduceMotion && <Text style={styles.helperText}>지금은 접근성의 &lsquo;애니메이션 줄이기&rsquo;가 켜져 있어 속도 설정보다 그쪽이 우선합니다.</Text>}
    </Page>
  );

  if (detail === 'accessibility') return (
    <Page>
      <View style={styles.analysisHeader}>
        <Pressable accessibilityRole="button" accessibilityLabel="뒤로" style={styles.analysisBack} onPress={() => setDetail(null)}><Text style={styles.analysisBackText}>‹</Text></Pressable>
        <Text style={styles.pageTitle}>접근성</Text>
      </View>
      <View style={styles.panel}>
        {(Object.keys(accessibilityLabels) as (keyof AccessibilityOptions)[]).map((key, index) => (
          <React.Fragment key={key}>
            <View style={styles.row}>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{accessibilityLabels[key].title}</Text>
                <Text style={styles.smallText}>{accessibilityLabels[key].detail}</Text>
              </View>
              <Switch
                value={props.accessibility[key]}
                onValueChange={(value) => props.setAccessibility({ ...props.accessibility, [key]: value })}
                trackColor={{ false: '#303746', true: '#80651F' }}
                thumbColor={props.accessibility[key] ? '#E4BC55' : '#9AA2B0'}
              />
            </View>
            {index < Object.keys(accessibilityLabels).length - 1 && <View style={styles.separator} />}
          </React.Fragment>
        ))}
      </View>
      <Text style={styles.helperText}>설정은 바로 적용되고 다음에 열 때도 그대로 유지됩니다.</Text>
    </Page>
  );

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
      <Text style={styles.sectionTitle}>데이터 백업</Text>
      <View style={styles.panel}>
        <Pressable accessibilityRole="button" onPress={props.onExportBackup}>
          <Row title="파일로 내보내기" subtitle="코인 · 기록 · 설정을 JSON 파일 하나로 저장합니다" value="내보내기" />
        </Pressable>
        <View style={styles.separator} />
        <Pressable accessibilityRole="button" onPress={props.onPickBackup}>
          <Row title="파일에서 가져오기" subtitle="다른 기기에서 내보낸 파일을 불러옵니다" value="가져오기" />
        </Pressable>
      </View>
      {props.pendingImport && (
        <View style={styles.importConfirm}>
          <Text style={styles.importConfirmTitle}>이 내용으로 덮어쓸까요?</Text>
          <Text style={styles.importConfirmSummary}>{props.pendingImport.summary}</Text>
          <Text style={styles.smallText}>지금 기기에 있는 코인과 기록은 사라지고 위 내용으로 바뀝니다.</Text>
          <View style={styles.importConfirmRow}>
            <Pressable style={styles.importCancel} onPress={props.onCancelImport}><Text style={styles.holdemActionText}>취소</Text></Pressable>
            <Pressable style={styles.importApply} onPress={props.onApplyImport}><Text style={styles.primaryButtonText}>덮어쓰기</Text></Pressable>
          </View>
        </View>
      )}
      {props.backupNote ? <Text style={styles.helperText}>{props.backupNote}</Text> : null}
      <Text style={styles.helperText}>데이터는 이 기기 안에만 저장됩니다. 브라우저 데이터를 지우면 사라지니, 옮기거나 보관하려면 내보내기를 쓰세요.</Text>
      <Text style={styles.sectionTitle}>게임 환경</Text>
      <View style={styles.panel}>
        <ToggleRow title="효과음" value={props.sound} onValueChange={props.setSound} />
        <View style={styles.separator} />
        <ToggleRow title="진동" value={props.vibration} onValueChange={props.setVibration} />
        <View style={styles.separator} />
        <Pressable accessibilityRole="button" onPress={() => setDetail('speed')}><Row title="게임 진행 속도" value={`${props.gameSpeed}  ›`} /></Pressable>
        <View style={styles.separator} />
        <Pressable accessibilityRole="button" onPress={() => setDetail('accessibility')}><Row title="접근성" subtitle={accessibilitySummary(props.accessibility)} value="설정  ›" /></Pressable>
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
  progressValue: { width: '0%', height: '100%', backgroundColor: colors.gold },
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
  detailHeader: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailHeaderTitle: { color: colors.text, fontSize: 16, fontWeight: '800', flex: 1, textAlign: 'center', marginHorizontal: 6 },
  // 밀어서 뒤로 가기를 쓰지 않으므로, 뒤로 버튼은 손가락으로 누르기 쉽게 크고 뚜렷하게 둡니다.
  backButton: { minWidth: 84, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.panel2, borderWidth: 1, borderColor: colors.border },
  backButtonPressed: { backgroundColor: '#232B39', borderColor: colors.gold },
  backButtonSpacer: { minWidth: 84, height: 48 },
  backButtonArrow: { color: colors.goldLight, fontSize: 28, lineHeight: 30, fontWeight: '400', marginTop: -2 },
  backButtonLabel: { color: colors.goldLight, fontSize: 15, fontWeight: '700' },
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
  gameTopBar: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 17, borderBottomWidth: 1, borderBottomColor: '#2E594C', backgroundColor: '#081B17' },
  gameTopTitle: { color: colors.goldLight, fontSize: 18, fontWeight: '900', letterSpacing: 1.5 },
  gameTopActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gameExitButton: { minWidth: 84, height: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: '#A58145', backgroundColor: '#24180E' },
  gameExitButtonText: { color: '#F9D985', fontSize: 15, fontWeight: '900' },
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
  pokerTable: { flex: 1, backgroundColor: '#052E22' },
  pokerPage: { flexGrow: 1, padding: 16, paddingBottom: 42, gap: 16, alignItems: 'center' },
  pokerSeat: { color: '#F8E6B0', fontSize: 16, fontWeight: '900', marginTop: 5 },
  pokerActionRow: { width: '100%', flexDirection: 'row', gap: 8, marginTop: 12 },
  secondaryButton: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderRadius: 14, backgroundColor: '#1B304E', borderWidth: 1, borderColor: '#6681A5' },
  secondaryButtonText: { color: '#F4F7FC', fontSize: 14, fontWeight: '900', textAlign: 'center' },
  paiGowDivider: { width: '100%', padding: 12, borderRadius: 14, backgroundColor: '#153E31', borderWidth: 1, borderColor: '#5A8C75' },
  paiGowDividerTitle: { color: '#FFE080', fontSize: 14, fontWeight: '900', marginBottom: 4 },
  paiGowHandSummary: { width: '100%', flexDirection: 'row', gap: 8 },
  paiGowResultMark: { color: '#FFE080', fontSize: 16, fontWeight: '900', marginTop: 6 },
  paiGowShowdownButton: { flex: 1, width: undefined },
  chineseRow: { width: '100%', borderRadius: 14, borderWidth: 1, borderColor: '#2A3346', backgroundColor: 'rgba(16,22,34,0.72)', padding: 10, gap: 8, marginBottom: 10 },
  chineseRowActive: { borderColor: colors.gold, backgroundColor: 'rgba(42,34,14,0.72)' },
  chineseRowWon: { borderColor: '#3FA96A' },
  chineseRowLost: { borderColor: '#B4413F' },
  chineseRowHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chineseRowName: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  chineseRowLabel: { flex: 1, color: '#9AA6B8', fontSize: 12, fontWeight: '700' },
  chineseRowMark: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, overflow: 'hidden', backgroundColor: '#2A3346' },
  chineseSlotRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chineseEmptySlot: { width: 58, height: 88, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: '#3A4459' },
  chineseOpponentLine: { color: '#8E9AAC', fontSize: 12, fontWeight: '700' },
  chineseHandRow: { width: '100%', flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pusherScreen: { flex: 1, backgroundColor: '#0B0F17' },
  pusherCabinet: { width: '100%', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#2A3346', backgroundColor: '#101724' },
  pusherPlate: { height: 22, backgroundColor: '#28324A', alignItems: 'center', justifyContent: 'center' },
  pusherPlateText: { color: '#8E9AAC', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  pusherBed: { height: 320, backgroundColor: '#152033', position: 'relative', overflow: 'hidden' },
  pusherBall: { width: 22, height: 22, marginLeft: -11, marginTop: -11, borderRadius: 11, backgroundColor: '#E0587B', borderColor: '#9C2F4C' },
  pusherBar: { width: 26, height: 15, marginLeft: -13, marginTop: -8, borderRadius: 3, backgroundColor: '#E8C062', borderColor: '#8A6414' },
  // 벽이 끝나는 자리. 이 앞부터 동전이 옆으로 밀리고 바닥 구멍에 빠질 수 있습니다.
  pusherWallEnd: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#2A3346' },
  pusherAimLine: { position: 'absolute', top: 0, bottom: 0, width: 2, marginLeft: -1, backgroundColor: 'rgba(209,166,60,0.28)' },
  pusherLaneRow: { width: '100%', flexDirection: 'row', gap: 5 },
  pusherLane: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9, backgroundColor: 'rgba(16,22,34,0.72)', borderWidth: 1, borderColor: '#2A3346' },
  pusherLaneActive: { borderColor: colors.gold, backgroundColor: 'rgba(42,34,14,0.8)' },
  pusherLaneText: { color: '#8E9AAC', fontSize: 13, fontWeight: '800' },
  pusherLaneTextActive: { color: colors.gold },
  pusherCoin: { position: 'absolute', width: 20, height: 20, marginLeft: -10, marginTop: -10, borderRadius: 10, backgroundColor: '#C9CFD8', borderWidth: 1, borderColor: '#79828F', alignItems: 'center', justifyContent: 'center' },
  pusherGold: { backgroundColor: colors.gold, borderColor: '#8A6414' },
  pusherGoldMark: { color: '#3A2C08', fontSize: 9, fontWeight: '900' },
  pusherCoinLost: { opacity: 0.35 },
  pusherCoinTray: { position: 'relative', marginLeft: 0, marginTop: 0 },
  pusherLip: { height: 16, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  pusherLipText: { color: '#3A2C08', fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  pusherTray: { minHeight: 40, flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignItems: 'center', justifyContent: 'center', padding: 9, backgroundColor: '#0A0E16' },
  pusherTrayEmpty: { color: '#5D6675', fontSize: 12, fontWeight: '700' },
  pusherPayout: { color: colors.gold, fontSize: 20, fontWeight: '900' },
  bigTwoSeats: { width: '100%', flexDirection: 'row', gap: 8 },
  bigTwoSeat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 9, borderRadius: 10, backgroundColor: 'rgba(16,22,34,0.72)', borderWidth: 1, borderColor: '#2A3346' },
  bigTwoSeatActive: { borderColor: colors.gold, backgroundColor: 'rgba(42,34,14,0.72)' },
  bigTwoSeatWon: { borderColor: '#3FA96A' },
  bigTwoSeatName: { color: '#9AA6B8', fontSize: 11, fontWeight: '800' },
  bigTwoSeatCount: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', fontVariant: ['tabular-nums'] },
  bigTwoTable: { width: '100%', gap: 8, padding: 12, borderRadius: 14, backgroundColor: 'rgba(16,22,34,0.72)', borderWidth: 1, borderColor: '#2A3346' },
  bigTwoTableLabel: { color: colors.gold, fontSize: 13, fontWeight: '800' },
  bigTwoLog: { width: '100%', gap: 2, paddingHorizontal: 2 },
  bigTwoLogLine: { color: '#8E9AAC', fontSize: 12, fontWeight: '600' },
  tujeonRow: { width: '100%', flexDirection: 'row', gap: 7, flexWrap: 'wrap', alignItems: 'center' },
  // 투전목은 길고 좁은 종이패라 서양 카드보다 홀쭉하게 그립니다.
  tujeonCard: { width: 52, height: 96, borderRadius: 7, backgroundColor: '#F3E7CE', borderWidth: 1, borderColor: '#C6B189', alignItems: 'center', paddingVertical: 6, gap: 2 },
  tujeonCardBand: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tujeonCardMark: { color: '#FBF3E2', fontSize: 17, fontWeight: '900' },
  tujeonCardNumber: { color: '#2A2118', fontSize: 24, fontWeight: '900', lineHeight: 28 },
  tujeonCardSuit: { color: '#6B5B45', fontSize: 10, fontWeight: '800' },
  tujeonCardBack: { backgroundColor: '#2A1C1C', borderColor: '#7A3B36', justifyContent: 'center' },
  tujeonCardBackMark: { color: '#C8A06A', fontSize: 24, fontWeight: '900' },
  tujeonHandLabel: { color: colors.gold, fontSize: 20, fontWeight: '900' },
  tujeonAdvice: { color: '#9AA6B8', fontSize: 13, fontWeight: '700' },
  paiGowWarning: { color: '#FFB39D', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  racingPickBanner: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 16, backgroundColor: '#332A12', borderWidth: 2, borderColor: '#E4BB4D' },
  racingPickCopy: { flex: 1 },
  racingPickEyebrow: { color: '#E4BB4D', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  racingPickText: { color: '#FFF4C8', fontSize: 12, lineHeight: 18, fontWeight: '900', marginTop: 2 },
  racingStartButton: { minWidth: 104, minHeight: 46, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#D5A92D' },
  racingStartButtonText: { color: '#201604', fontSize: 13, fontWeight: '900' },
  racingSelectedTag: { color: '#231700', fontSize: 9, fontWeight: '900', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 9, overflow: 'hidden', backgroundColor: '#FFD75C' },
  racingChosenLane: { backgroundColor: 'rgba(255,215,92,.18)', borderTopWidth: 1, borderTopColor: '#FFD75C', borderBottomColor: '#FFD75C' },
  racingTrackPick: { position: 'absolute', right: -3, top: -2, color: '#211600', fontSize: 7, fontWeight: '900', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 6, overflow: 'hidden', backgroundColor: '#FFD75C' },
  bullScreen: { flex: 1, backgroundColor: '#17120D' },
  bullStatus: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 12, backgroundColor: '#332313', borderWidth: 1, borderColor: '#C58A42' },
  bullStatusText: { color: '#FFD99A', fontSize: 11, fontWeight: '900' },
  bullArena: { marginTop: 16, padding: 13, borderRadius: 22, backgroundColor: '#8D5931', borderWidth: 4, borderColor: '#D8B374' },
  bullArenaRing: { minHeight: 150, alignItems: 'center', justifyContent: 'center', borderRadius: 75, backgroundColor: '#C98B4B', borderWidth: 3, borderColor: '#F1D29B' },
  bullArenaTitle: { color: '#321D0C', fontSize: 15, fontWeight: '900' },
  bullFaceoff: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  bullFace: { fontSize: 46 },
  bullImpact: { color: '#FFF0A2', fontSize: 25, fontWeight: '900', textShadowColor: '#8B2D10', textShadowRadius: 6 },
  bullActionText: { color: '#4A250F', fontSize: 10, lineHeight: 15, fontWeight: '900', marginTop: 4 },
  bullHealthRow: { width: '88%', flexDirection: 'row', gap: 10, marginTop: 10 },
  bullHealthBox: { flex: 1 },
  bullHealthName: { color: '#4A250F', fontSize: 9, fontWeight: '900', textAlign: 'center', marginBottom: 3 },
  bullHealthTrack: { height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: '#5B2A17', borderWidth: 1, borderColor: '#F4D18F' },
  bullHealthFill: { height: '100%', borderRadius: 4, backgroundColor: '#F4D13D' },
  bullVs: { color: '#FFF3D5', fontSize: 10, fontWeight: '900', backgroundColor: '#6B3518', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9, overflow: 'hidden' },
  bullGrid: { gap: 8 },
  bullCard: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, borderRadius: 14, backgroundColor: '#2B2119', borderWidth: 1, borderColor: '#6F5238' },
  bullCardActive: { backgroundColor: '#49331D', borderColor: '#F0BD68', borderWidth: 2 },
  bullFigure: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 26, backgroundColor: '#110E0B', position: 'relative' },
  bullEmoji: { fontSize: 40, fontWeight: '900' },
  bullBand: { position: 'absolute', right: -3, bottom: -2, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#FFF0C8' },
  bullBandText: { color: '#FFF', fontSize: 9, fontWeight: '900', textShadowColor: '#000', textShadowRadius: 2 },
  bullCopy: { flex: 1 },
  bullName: { color: '#FFF0D0', fontSize: 14, fontWeight: '900' },
  bullStats: { color: '#CDB99E', fontSize: 9, marginTop: 4 },
  bullOdds: { color: '#F7C878', fontSize: 12, fontWeight: '900', marginTop: 3 },
  bullSeed: { color: '#FFE0A4', fontSize: 8, fontWeight: '900', backgroundColor: '#62411F', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 7, overflow: 'hidden' },
  bullTicket: { marginTop: 14, padding: 14, borderRadius: 15, backgroundColor: '#362515', borderWidth: 1, borderColor: '#9E6A31' },
  bullBracket: { marginTop: 14, padding: 14, borderRadius: 17, backgroundColor: '#2C2118', borderWidth: 1, borderColor: '#74543A', gap: 7 },
  bullMatch: { minHeight: 54, padding: 9, borderRadius: 11, backgroundColor: '#3B2C21', borderLeftWidth: 4, borderLeftColor: '#A97842' },
  bullFinal: { backgroundColor: '#4A351B', borderLeftColor: '#F0BD54' },
  bullRound: { color: '#E3B978', fontSize: 8, fontWeight: '900' },
  bullMatchText: { color: '#FFF0D7', fontSize: 11, fontWeight: '800', marginTop: 2 },
  bullWinner: { color: '#F1CA88', fontSize: 9, fontWeight: '900', marginTop: 2 },
  bullChampion: { color: '#FFE18A', fontSize: 20, fontWeight: '900', textAlign: 'center', marginVertical: 8 },
  carRaceScreen: { flex: 1, backgroundColor: '#090D14' },
  carStatus: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 12, backgroundColor: '#221E16', borderWidth: 1, borderColor: '#E1B84A' },
  carStatusText: { color: '#FFE18A', fontSize: 11, fontWeight: '900' },
  carTrack: { marginTop: 15, paddingVertical: 6, borderRadius: 18, overflow: 'hidden', backgroundColor: '#242931', borderWidth: 4, borderColor: '#5C626C' },
  carLane: { height: 53, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#626873' },
  carLaneBadge: { width: 28, height: 28, marginHorizontal: 5, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: '#F4F0E6' },
  carLaneNumber: { color: '#15171A', fontSize: 13, fontWeight: '900' },
  carLaneCourse: { flex: 1, height: 49, justifyContent: 'center', position: 'relative', borderLeftWidth: 1, borderLeftColor: '#777', borderRightWidth: 1, borderRightColor: '#777' },
  carDistance: { minWidth: 42, height: 38, justifyContent: 'center', alignItems: 'flex-end' },
  carFinishLine: { position: 'absolute', right: 7, width: 5, height: 49, backgroundColor: '#FFF', borderLeftWidth: 2, borderLeftColor: '#111' },
  carPlace: { width: 36, color: '#FFF3C3', fontSize: 11, fontWeight: '900', textAlign: 'center' },
  formulaCar: { width: 73, height: 30, position: 'relative', justifyContent: 'center' },
  formulaCarSmall: { transform: [{scale:.82}], transformOrigin: 'left center' },
  formulaRearWing: { position: 'absolute', left: 0, top: 5, width: 10, height: 20, borderRadius: 2 },
  formulaBody: { position: 'absolute', left: 8, top: 8, width: 39, height: 15, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,.42)' },
  formulaCockpit: { position: 'absolute', right: 5, top: -7, width: 13, height: 7, borderLeftWidth: 5, borderRightWidth: 5, borderBottomWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  formulaNumber: { color: '#FFF', fontSize: 8, lineHeight: 13, fontWeight: '900', marginLeft: 6, textShadowColor: '#000', textShadowRadius: 2 },
  formulaNose: { position: 'absolute', left: 45, top: 10, width: 0, height: 0, borderTopWidth: 6, borderBottomWidth: 6, borderLeftWidth: 18, borderTopColor: 'transparent', borderBottomColor: 'transparent' },
  formulaFrontWing: { position: 'absolute', right: 0, top: 7, width: 5, height: 17, borderRadius: 2 },
  formulaWheel: { position: 'absolute', width: 9, height: 7, borderRadius: 2, backgroundColor: '#080808' },
  formulaWheelBack: { left: 11, bottom: 1 },
  formulaWheelFront: { right: 9, bottom: 1 },
  carLivePanel: { marginTop: 10, padding: 12, borderRadius: 13, backgroundColor: '#172131', borderWidth: 1, borderColor: '#4E719E' },
  carLiveTitle: { color: '#82B9F4', fontSize: 11, fontWeight: '900' },
  carLiveText: { color: '#F4F7FB', fontSize: 12, fontWeight: '800', marginTop: 4 },
  carGrid: { gap: 9 },
  carCard: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 9, borderRadius: 15, backgroundColor: '#171D27', borderWidth: 1, borderColor: '#3A4657' },
  carCardActive: { backgroundColor: '#292614', borderColor: '#F0C24B', borderWidth: 2 },
  carLogoPlate: { width: 55, height: 51, padding: 5, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#10151D', borderWidth: 2 },
  carLogo: { width: '100%', height: '100%' },
  carCardCopy: { flex: 1 },
  carName: { color: '#FFF5D7', fontSize: 13, fontWeight: '900' },
  carStats: { color: '#AEB8C7', fontSize: 8, marginTop: 4 },
  carOdds: { color: '#FFD86B', fontSize: 12, fontWeight: '900', marginTop: 3 },
  carTicket: { marginTop: 14, padding: 14, borderRadius: 15, backgroundColor: '#211D13', borderWidth: 1, borderColor: '#B98C26' },
  carTicketText: { color: '#FFF3C5', fontSize: 12, fontWeight: '800', marginTop: 4 },
  carResult: { marginTop: 12, padding: 16, borderRadius: 17, backgroundColor: '#171E29', borderWidth: 1, borderColor: '#53677F' },
  horseScreen: { flex: 1, backgroundColor: '#091D16' },
  horsePage: { padding: 14, paddingBottom: 42, gap: 13 },
  horseTrack: { paddingVertical: 8, borderRadius: 20, overflow: 'hidden', backgroundColor: '#8B5A32', borderWidth: 5, borderColor: '#D3B477' },
  horseLane: { height: 54, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.25)' },
  horseLaneNumber: { width: 32, height: 32, marginHorizontal: 5, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: '#F7F1E3' },
  horseLaneNumberText: { color: '#161616', fontSize: 15, fontWeight: '900' },
  horseLaneCourse: { flex: 1, height: 48, justifyContent: 'center', position: 'relative' },
  horseDistance: { height: 42, justifyContent: 'center', alignItems: 'flex-end' },
  horseRunner: { fontSize: 28 },
  horseFinishLine: { position: 'absolute', right: 8, width: 4, height: 48, backgroundColor: '#F7F1E3', borderLeftWidth: 2, borderLeftColor: '#161616' },
  horsePlace: { width: 38, color: '#FFF4CE', fontSize: 12, fontWeight: '900' },
  horseBetTypeRow: { flexDirection: 'row', gap: 6 },
  horseBetType: { flex: 1, minHeight: 62, alignItems: 'center', justifyContent: 'center', padding: 5, borderRadius: 12, backgroundColor: '#142B22', borderWidth: 1, borderColor: '#3E5A4E' },
  horseBetTypeActive: { backgroundColor: '#473713', borderColor: '#F0C75B', borderWidth: 2 },
  horseBetTypeTitle: { color: '#FFF3C8', fontSize: 14, fontWeight: '900' },
  horseBetTypeDetail: { color: '#AFC4BA', fontSize: 8, marginTop: 4, textAlign: 'center' },
  horseCards: { gap: 7 },
  horseCard: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, borderRadius: 14, backgroundColor: '#14251F', borderWidth: 1, borderColor: '#385247' },
  horseCardActive: { backgroundColor: '#352D17', borderColor: '#F0C75B', borderWidth: 2 },
  horseNumberBadge: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, borderWidth: 2, borderColor: '#FFF' },
  horseNumberText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  horseInfo: { flex: 1 },
  horseName: { color: '#FFF4D4', fontSize: 14, fontWeight: '900', marginBottom: 4 },
  horseStats: { color: '#AAC0B5', fontSize: 9, lineHeight: 14 },
  horseOdds: { color: '#FFD96B', fontSize: 14, fontWeight: '900', textAlign: 'right' },
  horsePickOrder: { color: '#F2C85B', fontSize: 9, fontWeight: '800', textAlign: 'right', marginTop: 3 },
  horseTicket: { padding: 14, borderRadius: 16, backgroundColor: '#F1E3BC', borderWidth: 2, borderColor: '#B98A2D' },
  horseTicketTitle: { color: '#FFE080', fontSize: 18, fontWeight: '900', marginBottom: 7 },
  horseExpected: { color: '#E6C765', fontSize: 13, fontWeight: '800', marginTop: 7 },
  horseResultPanel: { padding: 16, borderRadius: 18, backgroundColor: '#132C23', borderWidth: 1, borderColor: '#527665' },
  horsePodium: { color: '#FFF2C0', fontSize: 17, fontWeight: '900', textAlign: 'center', marginVertical: 12 },
  cycleScreen: { flex: 1, backgroundColor: '#101B27' },
  cycleTrack: { paddingVertical: 8, borderRadius: 24, overflow: 'hidden', backgroundColor: '#326A91', borderWidth: 6, borderColor: '#B8C7D2' },
  cycleLane: { height: 49, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.32)' },
  cycleJersey: { width: 31, height: 31, marginHorizontal: 6, alignItems: 'center', justifyContent: 'center', borderRadius: 5, borderWidth: 2, borderColor: '#D7E2E9' },
  cycleJerseyLarge: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 2, borderColor: '#D7E2E9' },
  cycleRider: { fontSize: 27, transform: [{ scaleX: -1 }] },
  cycleBell: { padding: 12, borderRadius: 14, backgroundColor: '#3A2F12', borderWidth: 1, borderColor: '#E0B949' },
  cycleBellTitle: { color: '#FFE071', fontSize: 15, fontWeight: '900', marginBottom: 4 },
  cycleNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cycleStyle: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, overflow: 'hidden', color: '#BDE3FF', backgroundColor: '#24475E', fontSize: 9, fontWeight: '900' },
  cycleTicket: { padding: 14, borderRadius: 16, backgroundColor: '#172B3A', borderWidth: 2, borderColor: '#6BA2C7' },
  cycleTicketText: { color: '#E7F4FC', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  boatScreen: { flex: 1, backgroundColor: '#071D2A' },
  boatCourse: { paddingVertical: 7, borderRadius: 22, overflow: 'hidden', backgroundColor: '#087AA0', borderWidth: 5, borderColor: '#84D9E9' },
  boatLane: { height: 52, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.38)' },
  boatLaneBadge: { width: 32, height: 32, marginHorizontal: 6, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  boatWater: { flex: 1, height: 48, justifyContent: 'center', position: 'relative', backgroundColor: 'rgba(32,190,219,.13)' },
  boatWake: { color: '#BCEEF6', fontSize: 15, fontWeight: '900' },
  boatRunner: { fontSize: 27 },
  boatFinishLine: { position: 'absolute', right: 8, width: 4, height: 48, backgroundColor: '#FF6B45', borderLeftWidth: 2, borderLeftColor: '#FFF' },
  boatPlace: { width: 38, color: '#E6FBFF', fontSize: 12, fontWeight: '900' },
  boatMarkPanel: { padding: 12, borderRadius: 14, backgroundColor: '#0C4053', borderWidth: 1, borderColor: '#4ED1E6' },
  boatMarkTitle: { color: '#79EBFA', fontSize: 15, fontWeight: '900', marginBottom: 4 },
  boatMarkText: { color: '#D6F8FC', fontSize: 11, lineHeight: 17, fontWeight: '700' },
  boatBetTypeActive: { backgroundColor: '#064A60', borderColor: '#5DE8F4', borderWidth: 2 },
  boatCard: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, borderRadius: 14, backgroundColor: '#0E3040', borderWidth: 1, borderColor: '#317287' },
  boatCardActive: { backgroundColor: '#124E5E', borderColor: '#61E9F3', borderWidth: 2 },
  boatLargeBadge: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 23, borderWidth: 3, borderColor: '#FFF' },
  boatName: { color: '#E9FCFF', fontSize: 14, fontWeight: '900' },
  boatStyle: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, overflow: 'hidden', color: '#7CF0FB', backgroundColor: '#075166', fontSize: 9, fontWeight: '900' },
  boatStats: { color: '#A9D7DF', fontSize: 9, lineHeight: 14, marginTop: 4 },
  boatOdds: { color: '#77EFF7', fontSize: 14, fontWeight: '900', textAlign: 'right' },
  boatPickOrder: { color: '#A8F7FC', fontSize: 9, fontWeight: '800', textAlign: 'right', marginTop: 3 },
  boatTicket: { padding: 14, borderRadius: 16, backgroundColor: '#0C3B4B', borderWidth: 2, borderColor: '#46BED2' },
  boatTicketText: { color: '#E3FBFE', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  boatResultPanel: { padding: 16, borderRadius: 18, backgroundColor: '#0B3545', borderWidth: 1, borderColor: '#4ACADD' },
  greyhoundScreen: { flex: 1, backgroundColor: '#17111D' },
  greyhoundTrack: { paddingVertical: 8, borderRadius: 24, overflow: 'hidden', backgroundColor: '#75523A', borderWidth: 6, borderColor: '#BFC6CC' },
  greyhoundLane: { height: 51, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.25)' },
  greyhoundTrap: { width: 33, height: 33, marginHorizontal: 6, alignItems: 'center', justifyContent: 'center', borderRadius: 4, borderWidth: 2, borderColor: '#FFF' },
  greyhoundCourse: { flex: 1, height: 48, justifyContent: 'center', position: 'relative', backgroundColor: 'rgba(72,43,28,.25)' },
  greyhoundRunner: { fontSize: 28, transform: [{ scaleX: -1 }] },
  greyhoundFinish: { position: 'absolute', right: 8, width: 4, height: 48, backgroundColor: '#FFF', borderLeftWidth: 2, borderLeftColor: '#111' },
  greyhoundPlace: { width: 38, color: '#FFF1DB', fontSize: 12, fontWeight: '900' },
  greyhoundBend: { padding: 12, borderRadius: 14, backgroundColor: '#35263D', borderWidth: 1, borderColor: '#B992CD' },
  greyhoundBendTitle: { color: '#E5BFFF', fontSize: 15, fontWeight: '900', marginBottom: 4 },
  greyhoundBendText: { color: '#F0DEF7', fontSize: 11, lineHeight: 17, fontWeight: '700' },
  greyhoundBetActive: { backgroundColor: '#51375E', borderColor: '#D5A2ED', borderWidth: 2 },
  greyhoundCard: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, borderRadius: 14, backgroundColor: '#2A202F', borderWidth: 1, borderColor: '#614D69' },
  greyhoundCardActive: { backgroundColor: '#493452', borderColor: '#D1A0E7', borderWidth: 2 },
  greyhoundVest: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 7, borderWidth: 3, borderColor: '#FFF' },
  greyhoundName: { color: '#FFF0D9', fontSize: 14, fontWeight: '900' },
  greyhoundLine: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, overflow: 'hidden', color: '#E7C5F4', backgroundColor: '#51375E', fontSize: 9, fontWeight: '900' },
  greyhoundStats: { color: '#C5B3C9', fontSize: 9, lineHeight: 14, marginTop: 4 },
  greyhoundOdds: { color: '#E0AFE9', fontSize: 14, fontWeight: '900', textAlign: 'right' },
  greyhoundPick: { color: '#E1B7ED', fontSize: 9, fontWeight: '800', textAlign: 'right', marginTop: 3 },
  greyhoundTicket: { padding: 14, borderRadius: 16, backgroundColor: '#32243A', borderWidth: 2, borderColor: '#A478B8' },
  greyhoundTicketText: { color: '#F9EFFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  greyhoundResult: { padding: 16, borderRadius: 18, backgroundColor: '#302338', borderWidth: 1, borderColor: '#AD7DC2' },
  sevenPokerTable: { minHeight: 570 },
  highLowResultRow: { width: '100%', flexDirection: 'row', gap: 7 },
  highLowResult: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.34)', borderWidth: 1, borderColor: '#B8933B' },
  highLowResultTitle: { color: '#FFE080', fontSize: 12, fontWeight: '900', marginBottom: 4 },
  mahjongGuide: { padding: 18, borderRadius: 20, backgroundColor: '#16352C', borderWidth: 1, borderColor: '#6C8D70' },
  mahjongHeroTiles: { color: '#FFF4D4', fontSize: 35, textAlign: 'center', marginBottom: 12 },
  mahjongBeginner: { marginTop: 14, borderRadius: 18, overflow: 'hidden', backgroundColor: '#101E1A', borderWidth: 1, borderColor: '#678573' },
  mahjongGlossary: { marginTop: 14, borderRadius: 18, overflow: 'hidden', backgroundColor: '#111B24', borderWidth: 1, borderColor: '#657A91' },
  mahjongGlossaryGrid: { paddingHorizontal: 13, paddingVertical: 8 },
  mahjongGlossaryRow: { paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#273746' },
  mahjongGlossaryTerm: { color: '#FFE080', fontSize: 13, fontWeight: '900', marginBottom: 3 },
  mahjongGlossaryDetail: { color: '#D6E0E8', fontSize: 11, lineHeight: 17 },
  mahjongTileBasics: { marginTop: 14, borderRadius: 18, overflow: 'hidden', backgroundColor: '#13211D', borderWidth: 1, borderColor: '#6D8B79' },
  mahjongTileBasicsBody: { padding: 12, gap: 10 },
  mahjongTileGroup: { padding: 10, borderRadius: 11, backgroundColor: '#1B3029', borderWidth: 1, borderColor: '#38584B' },
  mahjongTileGroupName: { color: '#FFE080', fontSize: 12, fontWeight: '900', marginBottom: 6 },
  mahjongTileLine: { color: '#FFF7DF', fontSize: 21, lineHeight: 29, letterSpacing: 1, marginBottom: 5 },
  mahjongTileGroupDetail: { color: '#D5E4DC', fontSize: 10, lineHeight: 16 },
  mahjongShapeExample: { padding: 11, borderRadius: 12, backgroundColor: '#2B2012', borderWidth: 1, borderColor: '#8A6D35' },
  mahjongShapeTitle: { color: '#FFD96B', fontSize: 12, fontWeight: '900', marginBottom: 7 },
  mahjongShapeTiles: { color: '#FFF7DF', fontSize: 19, lineHeight: 28, marginBottom: 5 },
  riichiYakuGuide: { marginTop: 14, borderRadius: 18, overflow: 'hidden', backgroundColor: '#171E2A', borderWidth: 1, borderColor: '#596A87' },
  riichiYakuBody: { padding: 11, gap: 9 },
  riichiNoYakuWarning: { padding: 11, borderRadius: 11, backgroundColor: '#351C1F', borderWidth: 1, borderColor: '#914C53' },
  riichiNoYakuTitle: { color: '#FFB7A8', fontSize: 12, fontWeight: '900', marginBottom: 4 },
  riichiYakuCard: { padding: 11, borderRadius: 12, backgroundColor: '#222C3B', borderWidth: 1, borderColor: '#43536C' },
  riichiYakuHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  riichiYakuName: { color: '#FFE080', fontSize: 14, fontWeight: '900' },
  riichiYakuHan: { color: '#9FD2B8', fontSize: 9, fontWeight: '900' },
  riichiYakuTiles: { color: '#FFF8E8', fontSize: 17, lineHeight: 26, marginVertical: 7 },
  riichiYakuDetail: { color: '#D9E1EC', fontSize: 10, lineHeight: 16 },
  mahjongModeComparison: { marginTop: 14, borderRadius: 18, overflow: 'hidden', backgroundColor: '#171D25', borderWidth: 1, borderColor: '#68788B' },
  mahjongModeBody: { padding: 11, gap: 9 },
  mahjongModeCommon: { padding: 11, borderRadius: 11, backgroundColor: '#193128', borderWidth: 1, borderColor: '#416D59' },
  mahjongModeCommonTitle: { color: '#9FE0BE', fontSize: 12, fontWeight: '900', marginBottom: 4 },
  mahjongModeText: { color: '#DCE7E1', fontSize: 10, lineHeight: 16 },
  mahjongModeCard: { padding: 11, borderRadius: 12, backgroundColor: '#222B38', borderWidth: 1, borderColor: '#3E5067' },
  mahjongModeHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 8 },
  mahjongModeIcon: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#AA2833', color: '#FFF3C7', textAlign: 'center', lineHeight: 34, fontSize: 18, fontWeight: '900' },
  mahjongModeName: { color: '#FFE080', fontSize: 13, fontWeight: '900' },
  mahjongModeRegion: { color: '#AAB8CA', fontSize: 9, marginTop: 2 },
  mahjongModeFacts: { gap: 4 },
  mahjongModeFact: { color: '#DCE4EE', fontSize: 9, lineHeight: 14 },
  mahjongModeLabel: { color: '#8FD8B2', fontWeight: '900' },
  mahjongGuideHeader: { minHeight: 70, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1B3A30' },
  mahjongGuideEyebrow: { color: '#C5A957', fontSize: 8, fontWeight: '900', letterSpacing: 2 },
  mahjongGuideTitle: { color: '#FFF4CF', fontSize: 15, fontWeight: '900', marginTop: 3 },
  mahjongGuideToggle: { color: '#FFE080', fontSize: 11, fontWeight: '900' },
  mahjongGuideBody: { padding: 13, gap: 11 },
  mahjongLesson: { flexDirection: 'row', gap: 10, paddingBottom: 11, borderBottomWidth: 1, borderBottomColor: '#29453B' },
  mahjongLessonNumber: { width: 27, height: 27, color: '#221A06', fontSize: 13, lineHeight: 27, fontWeight: '900', textAlign: 'center', overflow: 'hidden', borderRadius: 14, backgroundColor: '#E1BC52' },
  mahjongLessonCopy: { flex: 1 },
  mahjongLessonTitle: { color: '#FFF0B5', fontSize: 13, fontWeight: '900', marginBottom: 4 },
  mahjongLessonText: { color: '#D6E0DA', fontSize: 11, lineHeight: 18 },
  mahjongStrong: { color: '#FFE080', fontWeight: '900' },
  mahjongExample: { color: '#FFFFFF', fontSize: 23, lineHeight: 31, textAlign: 'center', marginTop: 8 },
  mahjongCurrentRule: { padding: 12, borderRadius: 12, backgroundColor: '#25341A', borderWidth: 1, borderColor: '#829047' },
  mahjongCurrentTitle: { color: '#E7D76E', fontSize: 12, fontWeight: '900', marginBottom: 5 },
  mahjongPage: { padding: 12, paddingBottom: 44 },
  mahjongTable: { minHeight: 590, padding: 12, borderRadius: 34, backgroundColor: '#0A5940', borderWidth: 7, borderColor: '#5C321B', justifyContent: 'space-between' },
  mahjongOpponent: { alignItems: 'center', minHeight: 72 },
  mahjongSeat: { color: '#FFF0B6', fontSize: 10, fontWeight: '900', textAlign: 'center', marginBottom: 5 },
  mahjongBacks: { flexDirection: 'row', justifyContent: 'center', gap: 1 },
  mahjongBack: { width: 18, height: 28, borderRadius: 3, backgroundColor: '#183D71', borderWidth: 1, borderColor: '#D8B95E' },
  mahjongMiddle: { minHeight: 210, flexDirection: 'row', alignItems: 'center', gap: 7 },
  mahjongSide: { flex: 1, minHeight: 130, padding: 7, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.16)' },
  mahjongCenter: { minWidth: 104, maxWidth: 132, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#E5D7A8', borderWidth: 3, borderColor: '#8E7137' },
  mahjongRound: { color: '#8B1F25', fontSize: 22, fontWeight: '900' },
  mahjongRulesToggle: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#3A4450', backgroundColor: '#141A22', marginBottom: 8 },
  mahjongRulesToggleText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  mahjongRuleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 7 },
  mahjongRuleBox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#3A4450', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  mahjongRuleBoxOn: { borderColor: '#E0A93C', backgroundColor: '#2A2317' },
  mahjongRuleCheck: { color: '#E0A93C', fontSize: 12, fontWeight: '900' },
  mahjongRuleText: { flex: 1 },
  mahjongRuleName: { color: colors.text, fontSize: 13, fontWeight: '700' },
  mahjongRuleDetail: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 1 },
  mahjongTileRed: { borderColor: '#C0453F' },
  mahjongGlyphRed: { color: '#C0453F' },
  mahjongRedMark: { position: 'absolute', top: 1, right: 3, color: '#C0453F', fontSize: 8, fontWeight: '900' },
  mahjongVoidRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  mahjongVoidButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#3A4450', backgroundColor: '#141A22' },
  mahjongVoidButtonActive: { borderColor: '#E0A93C', backgroundColor: '#2A2317' },
  mahjongVoidButtonText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  mahjongVoidCount: { color: colors.muted, fontSize: 11, marginTop: 2 },
  mahjongVoidNote: { color: '#E0A93C', fontSize: 11, fontWeight: '800', marginTop: 2 },
  mahjongWall: { color: '#3D3726', fontSize: 9, fontWeight: '800', marginTop: 3, textAlign: 'center' },
  mahjongPot: { color: '#6D5117', fontSize: 9, fontWeight: '900', marginTop: 3 },
  mahjongPoints: { color: '#8B1F25', fontSize: 9, fontWeight: '900', marginTop: 2, textAlign: 'center' },
  mahjongRiver: { color: '#FFF8DC', fontSize: 20, lineHeight: 27, textAlign: 'center' },
  mahjongPlayerRiver: { minHeight: 70, padding: 6, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.14)' },
  mahjongRiichiMarker: { color: '#FFD966', fontSize: 9, fontWeight: '900', textAlign: 'center', marginTop: 2 },
  mahjongMeldArea: { alignItems: 'center', paddingVertical: 5 },
  mahjongMeldLabel: { color: '#D9E9D4', fontSize: 9, fontWeight: '800', marginBottom: 3 },
  mahjongMeldRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5 },
  mahjongOpenMeld: { flexDirection: 'row', paddingHorizontal: 4, paddingVertical: 3, borderRadius: 6, backgroundColor: '#EADDAF', borderWidth: 1, borderColor: '#D0AD54' },
  mahjongMeldGlyph: { color: '#17130D', fontSize: 20, lineHeight: 24 },
  mahjongOpponentMeldRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 3, marginTop: 4, maxWidth: 150 },
  mahjongOpponentOpenMeld: { flexDirection: 'row', paddingHorizontal: 2, paddingVertical: 1, borderRadius: 4, backgroundColor: '#EADDAF', borderWidth: 1, borderColor: '#D0AD54' },
  mahjongOpponentMeldGlyph: { color: '#17130D', fontSize: 13, lineHeight: 16 },
  mahjongResultPanel: { width: '100%', padding: 12, borderRadius: 12, backgroundColor: '#132D24', borderWidth: 1, borderColor: '#D0AD54', marginBottom: 10, alignItems: 'center' },
  mahjongResultTitle: { color: '#FFE28A', fontSize: 18, fontWeight: '900', marginBottom: 8 },
  mahjongResultTiles: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 2, marginBottom: 7 },
  mahjongResultTile: { color: '#17130D', backgroundColor: '#F5EEDC', borderColor: '#D8C9A4', borderWidth: 1, borderRadius: 4, fontSize: 17, lineHeight: 23, paddingHorizontal: 3, paddingVertical: 2 },
  mahjongResultGrade: { color: '#FFF0B6', fontSize: 14, fontWeight: '900', textAlign: 'center', marginTop: 7 },
  mahjongResultYaku: { color: '#DDEBDD', fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  mahjongResultScore: { color: '#7EE2A8', fontSize: 13, fontWeight: '900', textAlign: 'center', marginTop: 5 },
  mahjongMessage: { color: '#FFF4C7', fontSize: 13, fontWeight: '900', textAlign: 'center', marginVertical: 8 },
  mahjongTurnGuide: { marginVertical: 8, padding: 11, borderRadius: 12, backgroundColor: '#102B25', borderWidth: 1, borderColor: '#5F9B81' },
  mahjongTurnStep: { color: '#8EDDB7', fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 3 },
  mahjongTurnTitle: { color: '#FFF1B6', fontSize: 13, fontWeight: '900', marginBottom: 4 },
  mahjongTurnDetail: { color: '#D7E8DF', fontSize: 10, lineHeight: 16 },
  mahjongYakuHintPanel: { marginVertical: 8, padding: 10, borderRadius: 12, backgroundColor: '#20293A', borderWidth: 1, borderColor: '#697B9A' },
  mahjongYakuHintTitle: { color: '#FFE080', fontSize: 12, fontWeight: '900', marginBottom: 2 },
  mahjongYakuHintCaution: { color: '#AAB9CE', fontSize: 8, lineHeight: 13, marginBottom: 7 },
  mahjongYakuHintRow: { paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#35435A' },
  mahjongYakuHintName: { color: '#9FE0BE', fontSize: 10, fontWeight: '900', marginBottom: 2 },
  mahjongYakuHintReason: { color: '#E1E7F0', fontSize: 9, lineHeight: 14 },
  mahjongPlayHelpToggle: { marginTop: 2, paddingVertical: 8, paddingHorizontal: 11, borderRadius: 9, backgroundColor: '#18243A', alignItems: 'center' },
  mahjongPlayHelpToggleText: { color: '#BFD6FF', fontSize: 10, fontWeight: '900' },
  mahjongPlayHelp: { marginTop: 7, padding: 10, borderRadius: 12, backgroundColor: '#142735', borderWidth: 1, borderColor: '#557A92' },
  mahjongPlayHelpTitle: { color: '#FFE080', fontSize: 12, fontWeight: '900', marginBottom: 5 },
  mahjongStatusRow: { flexDirection: 'row', gap: 8, paddingVertical: 5, borderTopWidth: 1, borderTopColor: '#29404E' },
  mahjongStatusLabel: { width: 43, color: '#8ED8B3', fontSize: 9, fontWeight: '900' },
  mahjongStatusText: { flex: 1, color: '#E0EAF0', fontSize: 9, lineHeight: 14 },
  mahjongStatusWarning: { color: '#FFB8A8', fontWeight: '900' },
  mahjongDiscardGuide: { marginVertical: 8, padding: 10, borderRadius: 12, backgroundColor: '#242616', borderWidth: 1, borderColor: '#858A48' },
  mahjongDiscardGuideTitle: { color: '#FFF09A', fontSize: 12, fontWeight: '900' },
  mahjongDiscardGuideCaution: { color: '#BFC19E', fontSize: 8, lineHeight: 13, marginTop: 2, marginBottom: 6 },
  mahjongDiscardGuideRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 7, paddingHorizontal: 5, borderTopWidth: 1, borderTopColor: '#414329' },
  mahjongDiscardGuideBest: { backgroundColor: 'rgba(228,195,78,0.09)', borderRadius: 8 },
  mahjongDiscardGuideRank: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#655927' },
  mahjongDiscardGuideRankText: { color: '#FFF6C5', fontSize: 9, fontWeight: '900' },
  mahjongDiscardGuideTile: { color: '#FFF8E8', fontSize: 23 },
  mahjongDiscardGuideText: { flex: 1 },
  mahjongDiscardGuideName: { color: '#FFF0A5', fontSize: 10, fontWeight: '900', marginBottom: 2 },
  mahjongDiscardGuideReason: { color: '#E4E4CD', fontSize: 8, lineHeight: 13 },
  mahjongCallAdvice: { marginVertical: 8, padding: 11, borderRadius: 12, backgroundColor: '#36251E', borderWidth: 1, borderColor: '#9A6B4A' },
  mahjongCallAdviceTitle: { color: '#FFD18B', fontSize: 11, fontWeight: '900', marginBottom: 4 },
  mahjongCallAdviceText: { color: '#F0DACA', fontSize: 9, lineHeight: 15 },
  mahjongDefensePanel: { marginVertical: 8, padding: 10, borderRadius: 12, backgroundColor: '#211F2B', borderWidth: 1, borderColor: '#77698E' },
  mahjongDefenseTitle: { color: '#FFE080', fontSize: 12, fontWeight: '900', marginBottom: 3 },
  mahjongDefenseIntro: { color: '#C8BDD7', fontSize: 8, lineHeight: 13, marginBottom: 7 },
  mahjongDefenseRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, borderTopWidth: 1, borderTopColor: '#3A3448' },
  mahjongDefenseLabel: { width: 35, textAlign: 'center', fontSize: 8, fontWeight: '900', paddingVertical: 3, borderRadius: 5, overflow: 'hidden' },
  mahjongDefenseSafe: { color: '#B9F4D0', backgroundColor: '#24523A' },
  mahjongDefenseCaution: { color: '#FFE39A', backgroundColor: '#5E4B20' },
  mahjongDefenseDanger: { color: '#FFC0C0', backgroundColor: '#652E35' },
  mahjongDefenseTiles: { flex: 1, color: '#FFF8E8', fontSize: 17, lineHeight: 24 },
  mahjongWaitPanel: { padding: 7, borderRadius: 9, backgroundColor: 'rgba(20,20,20,0.4)', marginBottom: 7 },
  mahjongWaitTitle: { color: '#FFE080', fontSize: 10, fontWeight: '900', textAlign: 'center', marginBottom: 3 },
  mahjongWaitText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', textAlign: 'center', lineHeight: 16 },
  mahjongHand: { minHeight: 112, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'center', gap: 2 },
  mahjongTile: { width: 26, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: '#FFF7DC', borderWidth: 1, borderColor: '#C9B98A', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 2 },
  mahjongTileRecommended: { borderWidth: 2, borderColor: '#88D89D', backgroundColor: '#ECFFD9' },
  mahjongTileDrawn: { transform: [{ translateY: -7 }], borderWidth: 2, borderColor: '#FFD45B', backgroundColor: '#FFF0AE' },
  mahjongGlyph: { color: '#17130D', fontSize: 25, lineHeight: 30 },
  mahjongRecommendMark: { position: 'absolute', bottom: -10, color: '#B8F3C6', backgroundColor: '#205B35', fontSize: 6, fontWeight: '900', paddingHorizontal: 3, borderRadius: 4, overflow: 'hidden' },
  mahjongActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  mahjongRiichiButton: { flex: 0.8, minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#9E2029', borderWidth: 2, borderColor: '#F0C75B' },
  mahjongCallPanel: { marginTop: 10, padding: 10, borderRadius: 14, backgroundColor: '#173E31', borderWidth: 1, borderColor: '#D6B95D' },
  mahjongCallTitle: { color: '#FFF0B5', fontSize: 12, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  mahjongCallButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  mahjongCallButton: { minHeight: 44, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#28614D' },
  mahjongRonButton: { minHeight: 44, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#B3232C', borderWidth: 1, borderColor: '#F0C75B' },
  mahjongPassButton: { minHeight: 44, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#39444A' },
  mahjongKanButton: { minHeight: 44, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#8C6A2A', backgroundColor: '#2A2113' },
  mahjongSortButton: { flex: 0.8, minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#244B63' },
  mahjongTsumoButton: { flex: 1.2, minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#B3232C', borderWidth: 2, borderColor: '#F0C75B' },
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
  slotMachineSpinning: { borderColor:'#FFF09A', shadowColor:'#FFCF48', shadowOpacity:0.95, shadowRadius:18 },
  slotBulbRow: { width:'100%', flexDirection:'row', justifyContent:'space-around', marginBottom:8 },
  slotBulb: { width:8, height:8, borderRadius:4, backgroundColor:'#8B542B' },
  slotBulbHot: { backgroundColor:'#FFF09A', shadowColor:'#FFE057', shadowOpacity:1, shadowRadius:7 },
  slotMarquee: { width:'100%', alignItems:'center', paddingVertical:10, marginBottom:9, borderRadius:12, backgroundColor:'#851C3B', borderWidth:2, borderColor:'#F5C956' },
  slotMarqueeSmall: { color:'#FFD969', fontSize:9, fontWeight:'900', letterSpacing:2 },
  slotMeters: { width:'100%', flexDirection:'row', gap:6, marginBottom:10 },
  slotMeter: { flex:1, alignItems:'center', paddingVertical:6, borderRadius:7, backgroundColor:'#150A11', borderWidth:1, borderColor:'#7C5A31' },
  slotMeterLabel: { color:'#B58B66', fontSize:7, fontWeight:'900' },
  slotMeterValue: { color:'#FFE269', fontSize:12, fontWeight:'900' },
  slotReelWindow: { width:'100%', padding:5, borderRadius:18, backgroundColor:'#190A12', borderWidth:3, borderColor:'#F0D178' },
  slotGhostSymbol: { position:'absolute', top:-17, color:'rgba(120,49,73,0.16)', fontSize:34 },
  slotDecorControls: { width:'100%', flexDirection:'row', gap:6, marginTop:12 },
  slotDecorButton: { flex:1, minHeight:30, alignItems:'center', justifyContent:'center', borderRadius:15, backgroundColor:'#23131A', borderWidth:1, borderColor:'#B58B45' },
  slotDecorText: { color:'#EACB78', fontSize:7, fontWeight:'900' },
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

  yutScreen: { flex: 1, backgroundColor: '#12100A' },
  yutMat: { marginTop: 16, padding: 18, borderRadius: 20, alignItems: 'center', backgroundColor: '#2A2415', borderWidth: 2, borderColor: '#8A6E2F' },
  yutStickRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  yutStick: { width: 34, height: 116, borderRadius: 17, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 8, borderWidth: 2 },
  yutStickFlat: { backgroundColor: '#EFE0C0', borderColor: '#B79A63' },
  yutStickRound: { backgroundColor: '#6B4A25', borderColor: '#3E2A13' },
  yutStickTumbling: { opacity: .72 },
  yutStickMark: { position: 'absolute', top: 16, width: 12, height: 12, borderRadius: 6, backgroundColor: '#B1382F' },
  yutStickFaceText: { fontSize: 11, fontWeight: '900' },
  yutStickFaceFlatText: { color: '#6B4A25' },
  yutStickFaceRoundText: { color: '#D9C39A' },
  yutOutcomeText: { color: '#FFE28A', fontSize: 46, fontWeight: '900' },
  yutOutcomeWin: { color: '#7BE495' },
  yutOutcomeDetail: { color: '#D8CDAE', fontSize: 12, marginTop: 4, textAlign: 'center' },
  yutChoiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  yutChoice: { width: '31.5%', minHeight: 96, alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 14, backgroundColor: '#221E14', borderWidth: 1, borderColor: '#574C30' },
  yutChoiceActive: { borderWidth: 3, borderColor: '#F0C24B', backgroundColor: '#3B3116' },
  yutChoiceHit: { backgroundColor: '#1F3A25', borderColor: '#7BE495' },
  yutChoiceName: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  yutChoiceDetail: { color: '#C7BC9E', fontSize: 9, marginTop: 3, textAlign: 'center' },
  yutChoiceOdds: { color: '#FFD75C', fontSize: 13, fontWeight: '900', marginTop: 5 },
  yutChoiceChance: { color: '#9C927A', fontSize: 9, marginTop: 2 },
  yutHistory: { marginTop: 16, padding: 14, borderRadius: 15, backgroundColor: '#1B1810', borderWidth: 1, borderColor: '#4A4028' },
  yutHistoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  yutHistoryChip: { color: '#E6DCC0', fontSize: 12, fontWeight: '800', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9, overflow: 'hidden', backgroundColor: '#2F2818' },
  yutHistoryChipRare: { color: '#231700', backgroundColor: '#FFD75C' },

  shellScreen: { flex: 1, backgroundColor: '#0D1420' },
  shellTable: { marginTop: 16, paddingVertical: 24, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#16283B', borderWidth: 2, borderColor: '#2F5875' },
  shellCupRow: { flexDirection: 'row', justifyContent: 'space-between' },
  shellCupSlot: { width: '31%', alignItems: 'center', paddingVertical: 8, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  shellCupSlotPickable: { borderColor: '#4E85AE', backgroundColor: 'rgba(78,133,174,.16)' },
  shellCupSlotChosen: { borderColor: '#FFD75C', backgroundColor: 'rgba(255,215,92,.16)' },
  shellCup: { width: 72, height: 84, borderTopLeftRadius: 34, borderTopRightRadius: 34, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 8, borderWidth: 2, borderColor: 'rgba(0,0,0,.35)' },
  shellCupLifted: { transform: [{ translateY: -26 }] },
  shellCupLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  shellCupLabelText: { color: '#FFFFFF' },
  shellBallSlot: { height: 26, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  shellBall: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F5D76E', borderWidth: 2, borderColor: '#B08C1E' },
  shellBallShadow: { width: 34, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,.28)' },
  shellHint: { color: '#BFD4E5', fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 18 },

  fishScreen: { flex: 1, backgroundColor: '#06202B' },
  fishTank: { paddingVertical: 8, borderRadius: 20, overflow: 'hidden', backgroundColor: '#0E4A63', borderWidth: 5, borderColor: '#1D7FA1' },
  fishLane: { height: 52, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.18)' },
  fishBadge: { width: 30, height: 30, marginHorizontal: 6, alignItems: 'center', justifyContent: 'center', borderRadius: 15, borderWidth: 2, borderColor: '#FFFFFF' },
  fishBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  fishCourse: { flex: 1, height: 46, justifyContent: 'center', position: 'relative', backgroundColor: 'rgba(6,40,55,.35)' },
  fishWeeds: { position: 'absolute', left: 0, right: 14, flexDirection: 'row', justifyContent: 'space-around' },
  fishWeedText: { fontSize: 15, opacity: .5 },
  fishSwim: { height: 42, justifyContent: 'center', alignItems: 'flex-end' },
  fishRunner: { fontSize: 25 },
  fishFinish: { position: 'absolute', right: 6, width: 5, height: 44, backgroundColor: '#F2A0A0', borderRadius: 2 },
  fishPlace: { width: 40, color: '#FFE28A', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  fishEventPanel: { padding: 12, borderRadius: 14, backgroundColor: '#0B2E3D', borderWidth: 1, borderColor: '#1D7FA1' },
  fishEventTitle: { color: '#8FE3F5', fontSize: 13, fontWeight: '900', marginBottom: 5 },
  fishEventText: { color: '#CFE9F2', fontSize: 11, lineHeight: 18 },
  fishCard: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 9, borderRadius: 15, backgroundColor: '#0D2E3C', borderWidth: 1, borderColor: '#255E76' },
  fishCardActive: { backgroundColor: '#123F4F', borderColor: '#F0C24B', borderWidth: 2 },
  fishCardBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,.7)' },
  fishCardEmoji: { fontSize: 22 },
  fishName: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  fishStats: { color: '#A9C9D6', fontSize: 11, marginTop: 3 },
  fishOdds: { color: '#FFD75C', fontSize: 15, fontWeight: '900', textAlign: 'right' },

  luckyFishScreen: { flex: 1, backgroundColor: '#071A2B' },
  luckyReef: { minHeight: 250, marginTop: 16, padding: 14, borderRadius: 20, backgroundColor: '#0C3350', borderWidth: 2, borderColor: '#1E6E96', position: 'relative' },
  luckyFishSwimmer: { position: 'absolute', zIndex: 3, marginLeft: -14 },
  luckyFishEmoji: { fontSize: 26 },
  luckyForkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  luckyForkCell: { width: `${100/6}%`, alignItems: 'center' },
  luckyForkDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: 'rgba(255,255,255,.28)' },
  luckyForkDotPassed: { backgroundColor: '#FFD75C' },
  luckyMouthRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  luckyMouth: { width: '86%', height: 26, borderTopLeftRadius: 13, borderTopRightRadius: 13, alignItems: 'center', justifyContent: 'center', opacity: .65 },
  luckyMouthLanded: { opacity: 1, borderWidth: 2, borderColor: '#7BE495' },
  luckyMouthText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  luckyReefHint: { color: '#BBDCEC', fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 16 },
  luckyCaveRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 16 },
  luckyCave: { width: '31.5%', minHeight: 104, alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 14, backgroundColor: '#0E2A40', borderWidth: 2 },
  luckyCaveActive: { backgroundColor: '#1B4462', borderColor: '#FFD75C' },
  luckyCaveLanded: { backgroundColor: '#1F4A31', borderColor: '#7BE495' },
  luckyCaveMouth: { width: 34, height: 22, borderTopLeftRadius: 17, borderTopRightRadius: 17, marginBottom: 6 },
  luckyCaveName: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', textAlign: 'center' },
  luckyCaveOdds: { color: '#FFD75C', fontSize: 15, fontWeight: '900', marginTop: 4 },
  luckyCaveChance: { color: '#8FA9BC', fontSize: 9, marginTop: 2 },

  sicboPage: { padding: 18, paddingBottom: 46 },
  sicboBowl: { minHeight: 230, alignItems: 'center', justifyContent: 'center', marginTop: 18, borderRadius: 115, backgroundColor: '#621B22', borderWidth: 5, borderColor: '#D8B451' },
  sicboDiceRow: { flexDirection: 'row', gap: 8, marginTop: 22, transform: [{ scale: 0.75 }] },
  sicboResult: { fontSize: 16, fontWeight: '900', marginTop: -4 },
  yahtzeeDieButton: { alignItems:'center', gap:5, padding:4, borderRadius:12, borderWidth:2, borderColor:'transparent' },
  yahtzeeHeld: { backgroundColor:'rgba(225,182,63,0.22)', borderColor:'#E1B63F', transform:[{translateY:-8}] },
  yahtzeeHoldText: { color:'#F3D77B', fontSize:9, fontWeight:'900' },
  yahtzeeSummary: { marginVertical:14, padding:14, borderRadius:14, backgroundColor:'#101C27', borderWidth:1, borderColor:'#314355' },
  yahtzeeBigNumber: { color:'#FFE28A',fontSize:72,fontWeight:'900' },
  yahtzeeNumberGrid: { flexDirection:'row',flexWrap:'wrap',gap:6,justifyContent:'center' },
  yahtzeeNumber: { width:38,height:38,borderRadius:19,alignItems:'center',justifyContent:'center',backgroundColor:'#162332',borderWidth:1,borderColor:'#394B5D' },
  yahtzeeScratchGrid: { flexDirection:'row',flexWrap:'wrap',gap:10,justifyContent:'center',marginVertical:26 },
  yahtzeeScratchCell: { width:'29%',aspectRatio:1,alignItems:'center',justifyContent:'center',borderRadius:16,backgroundColor:'#D7B142',borderWidth:3,borderColor:'#FFE69A' },
  yahtzeeScratchSymbol: { color:'#211703',fontSize:34,fontWeight:'900' },
  scratchInstruction: { color:'#FFE69A', fontSize:13, lineHeight:20, fontWeight:'800', textAlign:'center', marginTop:12 },
  scratchCoating: { position:'absolute', left:0, right:0, top:0, bottom:0, alignItems:'center', justifyContent:'center', borderRadius:13, backgroundColor:'#B9BEC3', borderWidth:2, borderColor:'#EEF1F3', overflow:'hidden' },
  scratchCoatingText: { color:'#60666B', fontSize:20, fontWeight:'900', textShadowColor:'#FFFFFF', textShadowRadius:2 },
  scratchDust: { position:'absolute', left:5, right:5, top:'48%', height:2, backgroundColor:'rgba(255,255,255,0.58)', transform:[{rotate:'-18deg'}] },
  scratchProgress: { color:'#D8CDA6', fontSize:11, fontWeight:'800', textAlign:'center', marginTop:-10, marginBottom:12 },
  scratchTicketPreview: { alignItems:'center', padding:20, marginVertical:18, borderRadius:18, backgroundColor:'#B7283C', borderWidth:4, borderColor:'#F2CD69' },
  scratchTicketTitle: { color:'#FFF2B0', fontSize:23, fontWeight:'900', letterSpacing:2 },
  scratchTicketPrize: { color:'#FFFFFF', fontSize:15, fontWeight:'900', marginTop:7 },
  scratchTicketHint: { color:'#F9D7D9', fontSize:10, marginTop:6 },
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
  dieRolling: { borderColor:'#FFE28A', shadowColor:'#FFD257', shadowOpacity:1, shadowRadius:12 },
  diceTableRolling: { shadowColor:'#FFE791', shadowOpacity:0.9, shadowRadius:18 },
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
  rouletteStage: { height: 330, alignItems: 'center', justifyContent: 'center' },
  rouletteMarker: { position: 'absolute', zIndex: 6, top: 2, width: 0, height: 0, borderLeftWidth: 12, borderRightWidth: 12, borderTopWidth: 24, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#FFE39A' },
  rouletteBall: { position: 'absolute', zIndex: 6, top: 30, width: 13, height: 13, borderRadius: 7, backgroundColor: '#FFFDF5', borderWidth: 1, borderColor: '#B99B4E', shadowColor: '#000000', shadowOpacity: 0.5, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  rouletteWheel: { width: 316, height: 316, alignItems: 'center', justifyContent: 'center', borderRadius: 158, backgroundColor: '#6F541C', borderWidth: 8, borderColor: '#D8B85C', shadowColor: '#000000', shadowOpacity: 0.55, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  rouletteWheelSpinning: { borderColor: '#FFE39A' },
  rouletteWheelRing: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#141C1A', borderWidth: 2, borderColor: '#E0C276' },
  rouletteSpokes: { position: 'absolute', top: 60, left: 60, width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: 'rgba(224,194,118,0.22)' },
  roulettePocket: { position: 'absolute', width: 34, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 5, borderWidth: 1, borderColor: 'rgba(232,217,170,0.85)' },
  roulettePocketRed: { backgroundColor: '#B4323D' },
  roulettePocketBlack: { backgroundColor: '#121519' },
  roulettePocketGreen: { backgroundColor: '#14754F' },
  roulettePocketText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', lineHeight: 15 },
  rouletteBowl: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center', borderRadius: 75, backgroundColor: '#0A392B', borderWidth: 8, borderColor: '#B68D33' },
  rouletteHub: { position: 'absolute', top: 18, width: 22, height: 22, borderRadius: 11, backgroundColor: '#E9CD7A', borderWidth: 4, borderColor: '#725619' },
  rouletteResultNumber: { color: colors.text, fontSize: 44, fontWeight: '900', marginTop: 12, fontVariant: ['tabular-nums'] },
  rouletteNumberTicking: { opacity: 0.92 },
  rouletteGreenText: { color: '#5FD6A4' },
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
  chart: { height: 72, flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 16 },
  chartSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 72 },
  chartBar: { width: 14, minHeight: 6, borderRadius: 3, backgroundColor: colors.gold },
  chartBarEmpty: { width: 14, height: 3, borderRadius: 2, backgroundColor: '#232A36' },
  chartCaption: { color: colors.muted, fontSize: 11, marginTop: 6 },
  chartBarLoss: { backgroundColor: colors.red },
  errorScreen: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  errorMark: { color: colors.gold, fontSize: 40 },
  errorTitle: { color: colors.text, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  errorText: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 21 },
  errorDetailBox: { backgroundColor: colors.panel, borderRadius: 12, padding: 12, width: '100%', borderWidth: 1, borderColor: colors.border },
  errorDetail: { color: colors.muted, fontSize: 12 },
  errorSecondary: { paddingVertical: 12 },
  errorSecondaryText: { color: colors.goldLight, fontSize: 14, fontWeight: '600' },
  importConfirm: { backgroundColor: '#1B1608', borderRadius: 14, padding: 14, gap: 8, borderWidth: 1, borderColor: colors.gold, marginTop: 10 },
  importConfirmTitle: { color: colors.goldLight, fontSize: 15, fontWeight: '700' },
  importConfirmSummary: { color: colors.text, fontSize: 14 },
  importConfirmRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  importCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: colors.panel2 },
  numberHistoryPanel: { marginTop:16, padding:14, borderRadius:15, backgroundColor:'#141D28', borderWidth:1, borderColor:'#3A4A5C' },
  numberHistoryRow: { flexDirection:'row', flexWrap:'wrap', gap:7, marginTop:10 },
  numberHistoryBall: { width:38, height:44, alignItems:'center', justifyContent:'center', borderRadius:19, borderWidth:2 },
  oddHistoryBall: { backgroundColor:'#742D3B', borderColor:'#D55A70' },
  evenHistoryBall: { backgroundColor:'#1E4B68', borderColor:'#4D9AC4' },
  numberHistoryValue: { color:'#FFFFFF', fontSize:13, fontWeight:'900' },
  numberHistoryKind: { color:'#E9E4D8', fontSize:7, fontWeight:'900' },
  lottoMatchedPick: { backgroundColor:'#88650E', borderColor:'#FFE36C' },
  lottoMissedPick: { opacity:0.42 },
  lottoResultPanel: { marginTop:18, padding:16, borderRadius:16, backgroundColor:'#142235', borderWidth:1, borderColor:'#49617D' },
  lottoBallRow: { flexDirection:'row', flexWrap:'wrap', alignItems:'center', gap:7, marginVertical:10 },
  lottoBall: { width:38, height:38, borderRadius:19, alignItems:'center', justifyContent:'center', backgroundColor:'#314156', borderWidth:2, borderColor:'#70839B' },
  lottoBallMatch: { backgroundColor:'#A77713', borderColor:'#FFE280', transform:[{translateY:-4}] },
  lottoBallText: { color:'#FFFFFF', fontSize:12, fontWeight:'900' },
  lottoBallCheck: { position:'absolute', right:-2, top:-7, color:'#FFF0A0', fontSize:10, fontWeight:'900' },
  lottoPlus: { color:'#D5C89A', fontSize:15, fontWeight:'900' },
  lottoBonusBall: { backgroundColor:'#6C315F', borderColor:'#CE7FBD' },
  lottoMatchSummary: { color:'#FFE287', fontSize:13, lineHeight:21, fontWeight:'900' },
  tableDeckArea: { alignItems:'center', justifyContent:'center', minHeight:80, marginVertical:8 },
  tableDeckShadow: { position:'absolute', width:50, height:69, borderRadius:7, backgroundColor:'rgba(0,0,0,0.35)', transform:[{translateX:5},{translateY:5},{rotate:'4deg'}] },
  tableDeckCard: { width:50, height:69, borderRadius:7, alignItems:'center', justifyContent:'center', backgroundColor:'#182847', borderWidth:3, borderColor:'#E2D7B0', transform:[{rotate:'-2deg'}] },
  tableDeckLabel: { color:'#D8CC9B', fontSize:8, fontWeight:'900', letterSpacing:1, marginTop:4 },
  hwatuHand: { flexDirection: 'row', flexWrap:'wrap', gap: 3, justifyContent: 'center', marginVertical: 6 },
  hwatuCard: { width: 52, height: 78, borderRadius: 4, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'flex-end', borderWidth: 0, paddingBottom: 0, overflow: 'hidden' },
  hwatuCardImage: { position:'absolute', left:0, top:0, right:0, bottom:0, width:'100%', height:'100%' },
  hwatuCardCaption: { position:'absolute', left:2, right:2, bottom:1, height:15, borderRadius:4, backgroundColor:'rgba(18,24,20,0.88)', flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:4 },
  hwatuBright: { backgroundColor: '#FBF1CE', borderColor: colors.gold },
  // 그림이 있는 광 카드는 크림색 바탕을 깔지 않습니다. 카드 그림이 틀보다 좁아서(가로 비율 0.44~0.53,
  // 틀은 0.67) 바탕을 깔면 그림 양옆에 흰 띠가 그대로 보입니다. 대신 금색 테두리로만 광을 표시합니다.
  hwatuBrightEdge: { borderWidth: 1, borderColor: colors.gold },
  hwatuHidden: { backgroundColor: '#1A2233', borderWidth:2, borderColor: '#D12B32' },
  hwatuDeckStack: { alignItems:'center', justifyContent:'center', width:64, minHeight:86 },
  hwatuDeckLayer: { position:'absolute', width:50, height:75, borderRadius:4, backgroundColor:'#171C29', borderWidth:2, borderColor:'#D42C35' },
  hwatuDeckMark: { color:'#E33B43', fontSize:18, fontWeight:'900' },
  hwatuDeckCount: { color:'#E8D9B3', fontSize:8, fontWeight:'900', marginTop:63, zIndex:5 },
  hwatuFloorBoard: { minHeight:190, alignItems:'center', justifyContent:'center', paddingVertical:6, marginVertical:6, borderRadius:60, backgroundColor:'#0C4B32', borderWidth:2, borderColor:'#8B6429' },
  hwatuFloorRow: { minHeight:79, flexDirection:'row', flexWrap:'wrap', gap:3, alignItems:'center', justifyContent:'center', paddingHorizontal:4 },
  hwatuCapturedGroups: { gap:7, marginVertical:6 },
  hwatuCapturedGroup: { padding:6, borderRadius:9, backgroundColor:'rgba(5,30,20,0.72)', borderWidth:1, borderColor:'#37644F' },
  hwatuCapturedLabel: { color:'#F2D580', fontSize:9, fontWeight:'900', marginBottom:4 },
  hwatuCapturedCards: { flexDirection:'row', flexWrap:'wrap', gap:2 },
  hwatuLastCapture: { marginVertical:8, padding:9, borderRadius:11, backgroundColor:'#402326', borderWidth:1, borderColor:'#A65A57' },
  hwatuLastCaptureTitle: { color:'#FFD89A', fontSize:10, fontWeight:'900', textAlign:'center', marginBottom:5 },
  hwatuCompactRow: { flexDirection:'row', flexWrap:'wrap', gap:2, justifyContent:'center' },
  hwatuHiddenMark: { color: colors.muted, fontSize: 22 },
  hwatuMonth: { position: 'absolute', left: 4, top: 2, zIndex: 3, color: '#171A1F', fontSize: 16, fontWeight: '900', lineHeight: 19, backgroundColor: 'rgba(255,255,255,0.78)', borderRadius: 4, paddingHorizontal: 2 },
  hwatuPicture: { position: 'absolute', left: 4, right: 4, top: 4, height: 58, borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: '#3B3428' },
  hwatuBranch: { position: 'absolute', width: 50, height: 4, left: 5, top: 30, borderRadius: 3, transform: [{rotate:'-28deg'}] },
  hwatuBranchSecond: { width: 35, left: 20, top: 22, transform: [{rotate:'34deg'}] },
  hwatuBlossom: { position: 'absolute', width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: '#F7E8D5' },
  hwatuMoon: { position: 'absolute', width: 25, height: 25, borderRadius: 13, right: 3, top: 3, backgroundColor: '#FFF0A1', borderWidth: 2, borderColor: '#D8B84A' },
  hwatuPlant: { position: 'absolute', left: 4, bottom: 2, color: '#FFF4D6', fontSize: 7, fontWeight: '900', textShadowColor: '#000', textShadowRadius: 2 },
  hwatuFigureBadge: { position: 'absolute', right: 2, bottom: 2, minWidth: 18, paddingHorizontal: 2, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(10,10,10,0.78)', alignItems: 'center' },
  hwatuFigure: { color: '#FFF1B8', fontSize: 7, fontWeight: '900' },
  hwatuKind: { color: '#7A4A1E', fontSize: 10, lineHeight: 12, fontWeight: '900' },
  hwatuName: { color: '#5E574B', fontSize: 8, lineHeight: 10, fontWeight: '700' },
  hwatuMonthGuide: { marginTop: 18, padding: 15, borderRadius: 17, backgroundColor: '#211A11', borderWidth: 1, borderColor: '#80652E' },
  hwatuMonthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 13, marginTop: 12 },
  hwatuMonthGuideItem: { width: '31%', alignItems: 'center', gap: 4 },
  hwatuMonthGuideLabel: { color: '#E8D8B1', fontSize: 9, fontWeight: '800', textAlign: 'center' },
  seotdaStrengthGuide: { marginTop: 14, padding: 15, borderRadius: 17, backgroundColor: '#271419', borderWidth: 1, borderColor: '#8A4A57' },
  seotdaStrengthText: { color: '#FFE5A0', fontSize: 11, lineHeight: 19, fontWeight: '800' },
  seotdaMyHand: { color: colors.goldLight, fontSize: 15, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  doriHint: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 2 },
  importApply: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: colors.gold },
  levelCard: { backgroundColor: colors.panel, borderRadius: 16, padding: 16, gap: 8, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  levelHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelBadge: { color: colors.goldLight, fontSize: 20, fontWeight: '700' },
  pokerContribution: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 2 },
  pokerOpponentNote: { color: colors.goldLight, fontSize: 13, textAlign: 'center', marginTop: 8, fontWeight: '600' },
  analysisHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  analysisBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  analysisBackText: { color: colors.goldLight, fontSize: 26, lineHeight: 26 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  filterChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.panel2, borderWidth: 1, borderColor: 'transparent' },
  filterChipActive: { borderColor: colors.gold, backgroundColor: '#211B0D' },
  filterChipText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: colors.goldLight },
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
