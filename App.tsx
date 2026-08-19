import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
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

type Tab = '홈' | '게임' | '지갑' | '기록' | '설정';
type AppScreen = 'tabs' | 'categoryCatalog' | 'gamePreview' | 'blackjackSetup' | 'blackjackGame' | 'rouletteGame';

type CatalogGame = { name: string; icon: string; description: string; status: 'playable' | 'planned' };
type GameCategory = { name: string; icon: string; detail: string; eyebrow: string; games: CatalogGame[] };

type GameRecord = {
  id: string;
  game: '블랙잭' | '룰렛';
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
    { name: '바카라', icon: '◆', description: '플레이어와 뱅커 중 승리할 쪽을 선택', status: 'planned' },
    { name: '룰렛', icon: '◎', description: '숫자와 색상에 코인을 거는 휠 게임', status: 'playable' },
    { name: '크랩스', icon: '⚄', description: '두 개의 주사위 결과를 예측하는 게임', status: 'planned' },
    { name: '식보', icon: '⚂', description: '세 개의 주사위 조합을 예측하는 게임', status: 'planned' },
    { name: '슬롯', icon: '7', description: '같은 그림 조합을 완성하는 머신 게임', status: 'planned' },
  ]},
  { name: '포커·카드', icon: '♠', detail: '홀덤 · 오마하 · 포커', eyebrow: 'POKER & CARDS', games: [
    { name: '텍사스 홀덤', icon: 'H', description: '공용 카드 다섯 장으로 만드는 포커', status: 'planned' },
    { name: '오마하', icon: 'O', description: '네 장의 개인 카드를 받는 포커', status: 'planned' },
    { name: '세븐 포커', icon: '7♠', description: '일곱 장 중 최고의 다섯 장을 선택', status: 'planned' },
    { name: '파이브 카드 드로우', icon: '5', description: '카드를 교환해 족보를 완성', status: 'planned' },
    { name: '비디오 포커', icon: 'VP', description: '기계와 즐기는 빠른 포커', status: 'planned' },
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
    { name: '식보', icon: '⚂', description: '동아시아의 세 주사위 게임', status: 'planned' },
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

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.coins),
      AsyncStorage.getItem(STORAGE_KEYS.difficulty),
      AsyncStorage.getItem(STORAGE_KEYS.records),
    ]).then(([savedCoins, savedDifficulty, savedRecords]) => {
      if (savedCoins) {
        setCoins(Number(savedCoins));
      } else {
        AsyncStorage.setItem(STORAGE_KEYS.coins, '10000');
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

  if (!entered) {
    return (
      <SafeAreaView style={styles.splash}>
        <StatusBar style="light" />
        <View style={styles.splashGlow} />
        <Text style={styles.splashEyebrow}>WELCOME TO</Text>
        <Text style={styles.splashTitle}>WORLD CASINO</Text>
        <Text style={styles.splashSubtitle}>하나의 코인으로 즐기는 세계의 게임</Text>
        <View style={styles.doors}>
          <View style={[styles.door, styles.leftDoor]}>
            <View style={styles.doorLine} />
            <View style={styles.doorHandle} />
          </View>
          <View style={[styles.door, styles.rightDoor]}>
            <View style={styles.doorLine} />
            <View style={styles.doorHandle} />
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          onPress={() => setEntered(true)}
        >
          <Text style={styles.primaryButtonText}>입장하기</Text>
        </Pressable>
        <Text style={styles.disclaimer}>게임 전용 코인 · 현금 환전 불가</Text>
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
              setAppScreen(game.name === '블랙잭' ? 'blackjackSetup' : game.name === '룰렛' ? 'rouletteGame' : 'gamePreview');
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
        {appScreen === 'tabs' && renderTab(tab, difficulty, saveDifficulty, sound, setSound, vibration, setVibration, coins, records, (category) => {
          setSelectedCategory(category);
          setAppScreen('categoryCatalog');
        }, () => {
          setSelectedCategory(gameCategories[1]);
          setAppScreen('blackjackSetup');
        }, (category, game) => {
          setSelectedCategory(category);
          setSelectedCatalogGame(game);
          setAppScreen(game.name === '블랙잭' ? 'blackjackSetup' : game.name === '룰렛' ? 'rouletteGame' : 'gamePreview');
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
    return <SettingsScreen difficulty={difficulty} saveDifficulty={saveDifficulty} sound={sound} setSound={setSound} vibration={vibration} setVibration={setVibration} />;
  }
  return <HomeScreen difficulty={difficulty} records={records} onOpenBlackjack={onOpenBlackjack} />;
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

function HomeScreen({ difficulty, records, onOpenBlackjack }: { difficulty: string; records: GameRecord[]; onOpenBlackjack: () => void }) {
  return (
    <Page>
      <Text style={styles.eyebrow}>오늘도 즐거운 한 판</Text>
      <Text style={styles.pageTitle}>메인 로비</Text>

      <Text style={styles.sectionTitle}>이어서 하기</Text>
      <View style={styles.heroCard}>
        <View style={styles.blackjackMark}><Text style={styles.cardSuit}>A♠</Text><Text style={styles.cardSuit}>K♥</Text></View>
        <View style={styles.heroCopy}>
          <Text style={styles.muted}>최근 플레이</Text>
          <Text style={styles.cardTitle}>블랙잭</Text>
          <Text style={styles.smallText}>{difficulty} · 베팅 500 WC</Text>
        </View>
        <Pressable style={styles.smallButton} onPress={onOpenBlackjack}><Text style={styles.smallButtonText}>계속</Text></Pressable>
      </View>

      <Text style={styles.sectionTitle}>최근 플레이</Text>
      <View style={styles.panel}>
        {records.length === 0 && <Text style={styles.emptyText}>아직 완료한 게임이 없습니다.</Text>}
        {records.slice(0, 2).map((record, index) => (
          <React.Fragment key={record.id}>
            <Row
              title={`${record.game} · ${resultLabel(record.result)}`}
              subtitle={`${record.detail ? `${record.detail} · ` : ''}${formatPlayedAt(record.playedAt)} · ${record.difficulty}`}
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
          <View style={styles.heroCopy}><Text style={styles.muted}>지금 플레이 가능</Text><Text style={styles.cardTitle}>블랙잭</Text><Text style={styles.smallText}>난이도와 베팅 금액을 선택해 시작</Text></View>
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
                  <Text style={styles.gameListTitle}>{game.name}</Text>
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
                  <Text style={styles.gameListTitle}>{game.name}</Text>
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
      <ScreenHeader title="블랙잭 설정" onBack={props.onBack} />
      <ScrollView contentContainerStyle={styles.detailPage} showsVerticalScrollIndicator={false}>
        <View style={styles.blackjackIntro}>
          <View style={styles.blackjackIntroCards}><Text style={styles.introCard}>A♠</Text><Text style={styles.introCard}>K♥</Text></View>
          <View style={styles.blackjackIntroCopy}>
            <Text style={styles.eyebrow}>BLACKJACK</Text>
            <Text style={styles.detailLead}>21에 가장 가까이</Text>
            <Text style={styles.gameListDescription}>딜러보다 21에 가까운 카드 합계를 만드세요.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>난이도</Text>
        <View style={styles.setupOptions}>
          {difficultyOptions.map((option) => {
            const selected = props.difficulty === option.name;
            return (
              <Pressable key={option.name} style={[styles.setupOption, selected && styles.setupOptionActive]} onPress={() => props.onDifficultyChange(option.name)}>
                <Text style={[styles.setupOptionTitle, selected && styles.setupOptionTitleActive]}>{option.name}</Text>
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
            return (
              <Pressable
                key={bet}
                disabled={disabled}
                style={[styles.betButton, selected && styles.betButtonActive, disabled && styles.disabledCard]}
                onPress={() => props.onBetChange(bet)}
              >
                <Text style={[styles.betButtonText, selected && styles.betButtonTextActive]}>{bet.toLocaleString()} WC</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.setupSummary}>
          <Row title="보유 코인" value={`${props.coins.toLocaleString()} WC`} />
          <View style={styles.separator} />
          <Row title="선택 난이도" value={props.difficulty} />
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
      <ScreenHeader title={game.name} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.detailPage} showsVerticalScrollIndicator={false}>
        <View style={styles.previewHero}>
          <View style={styles.previewIcon}><Text style={styles.previewIconText}>{game.icon}</Text></View>
          <Text style={styles.eyebrow}>{category.eyebrow}</Text>
          <Text style={styles.previewTitle}>{game.name}</Text>
          <Text style={styles.previewDescription}>{game.description}</Text>
        </View>
        <Text style={styles.sectionTitle}>공통 게임 구조</Text>
        <View style={styles.panel}>
          <Row title="카테고리" value={category.name} />
          <View style={styles.separator} />
          <Row title="기본 난이도" value={difficulty} />
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

function PlayingCard({ card, hidden = false }: { card: Card; hidden?: boolean }) {
  if (hidden) {
    return <View style={[styles.playingCard, styles.hiddenCard]}><Text style={styles.hiddenCardMark}>◆</Text></View>;
  }
  const red = card.suit === '♥' || card.suit === '♦';
  return (
    <View style={styles.playingCard}>
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
        <Text style={styles.gameTopTitle}>BLACKJACK</Text>
        <View style={styles.gameBetPill}><Text style={styles.gameBetText}>베팅 {totalBet.toLocaleString()} WC</Text></View>
      </View>

      <ScrollView contentContainerStyle={styles.tableContent} showsVerticalScrollIndicator={false}>
        <View style={styles.handHeader}>
          <Text style={styles.handTitle}>딜러</Text>
          <Text style={styles.scoreBadge}>{dealerScore}</Text>
        </View>
        <View style={styles.cardRow}>
          {dealer.map((card, index) => <PlayingCard key={`${card.id}-${index}`} card={card} hidden={phase === 'player' && index === 1} />)}
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
          {player.map((card, index) => <PlayingCard key={`${card.id}-${index}`} card={card} />)}
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

        <Text style={styles.gameFooter}>난이도 {props.difficulty} · 게임 전용 가상 코인</Text>
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
      <ScreenHeader title="유럽식 룰렛" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.roulettePage} showsVerticalScrollIndicator={false}>
        <View style={styles.rouletteStatusRow}>
          <View><Text style={styles.eyebrow}>ROULETTE</Text><Text style={styles.rouletteBalance}>{coins.toLocaleString()} WC</Text></View>
          <View style={styles.difficultyBadge}><Text style={styles.difficultyBadgeText}>{difficulty}</Text></View>
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

        <Text style={styles.sectionTitle}>바깥 베팅</Text>
        <View style={styles.rouletteBetGrid}>
          {outsideBets.map((item) => {
            const active = bet.type === item.bet.type;
            return <Pressable key={item.bet.type} disabled={phase === 'spinning'} onPress={() => { setBet(item.bet); setPhase('betting'); }} style={[styles.rouletteBetButton, item.color ? { backgroundColor: item.color } : null, active && styles.rouletteBetActive]}><Text style={styles.rouletteBetText}>{item.label}</Text><Text style={styles.rouletteOdds}>{item.bet.type.startsWith('dozen') ? '2:1' : '1:1'}</Text></Pressable>;
          })}
        </View>

        <Text style={styles.sectionTitle}>숫자 하나 선택 · 35:1</Text>
        <View style={styles.numberGrid}>
          {Array.from({ length: 37 }, (_, number) => {
            const active = bet.type === 'straight' && bet.number === number;
            const color = rouletteColor(number);
            return <Pressable key={number} disabled={phase === 'spinning'} onPress={() => { setBet({ type: 'straight', number }); setPhase('betting'); }} style={[styles.numberCell, color === 'red' ? styles.numberRed : color === 'black' ? styles.numberBlack : styles.numberGreen, active && styles.numberActive]}><Text style={styles.numberText}>{number}</Text></Pressable>;
          })}
        </View>

        <Text style={styles.sectionTitle}>베팅 금액</Text>
        <View style={styles.setupOptions}>
          {difficultyOption.bets.map((amount) => <Pressable key={amount} disabled={phase === 'spinning'} style={[styles.rouletteChip, selectedBet === amount && styles.rouletteChipActive]} onPress={() => onBetChange(amount)}><Text style={[styles.setupOptionTitle, selectedBet === amount && styles.setupOptionTitleActive]}>{amount.toLocaleString()}</Text><Text style={styles.rouletteChipUnit}>WC</Text></Pressable>)}
        </View>

        <Pressable accessibilityRole="button" disabled={phase === 'spinning' || selectedBet > coins} style={[styles.primaryButton, styles.rouletteSpinButton, (phase === 'spinning' || selectedBet > coins) && styles.disabledCard]} onPress={spin}>
          <Text style={styles.primaryButtonText}>{phase === 'spinning' ? '회전 중…' : `${betLabel}에 ${selectedBet.toLocaleString()} WC 베팅`}</Text>
        </Pressable>
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
        <Row title="난이도별 수익률" value="보기  ›" />
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
              title={`${record.game} · ${resultLabel(record.result)}`}
              subtitle={`${record.detail ? `${record.detail} · ` : ''}${record.difficulty} · 베팅 ${record.bet.toLocaleString()} WC · ${formatPlayedAt(record.playedAt)}`}
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
}) {
  return (
    <Page>
      <Text style={styles.pageTitle}>설정</Text>
      <Text style={styles.sectionTitle}>기본 난이도</Text>
      <View style={styles.difficultyRow}>
        {difficultyOptions.map((option) => (
          <Pressable key={option.name} style={[styles.difficultyButton, props.difficulty === option.name && styles.difficultyActive]} onPress={() => props.saveDifficulty(option.name)}>
            <Text style={[styles.difficultyText, props.difficulty === option.name && styles.difficultyActiveText]}>{option.name}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.helperText}>게임마다 난이도에 맞는 베팅 범위가 적용됩니다.</Text>
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
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, paddingHorizontal: 28, overflow: 'hidden' },
  splashGlow: { position: 'absolute', top: 150, width: 300, height: 300, borderRadius: 150, backgroundColor: '#2A1E08', opacity: 0.55 },
  splashEyebrow: { color: colors.gold, letterSpacing: 5, fontSize: 12, fontWeight: '700' },
  splashTitle: { color: colors.goldLight, fontSize: 35, fontWeight: '800', marginTop: 10, letterSpacing: 1 },
  splashSubtitle: { color: colors.muted, fontSize: 14, marginTop: 8 },
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
  betGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  betButton: { width: '48%', minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  betButtonActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  betButtonText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  betButtonTextActive: { color: '#171107' },
  setupSummary: { marginTop: 20, paddingHorizontal: 14, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  fullWidthButton: { width: '100%', marginTop: 18 },
  setupNotice: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 10 },
  blackjackTable: { flex: 1, backgroundColor: '#07251D' },
  gameTopBar: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 17, borderBottomWidth: 1, borderBottomColor: '#2E594C', backgroundColor: '#081B17' },
  gameTopTitle: { color: colors.goldLight, fontSize: 18, fontWeight: '900', letterSpacing: 1.5 },
  gameBetPill: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 18, backgroundColor: '#2A2312', borderWidth: 1, borderColor: '#806526' },
  gameBetText: { color: colors.goldLight, fontSize: 12, fontWeight: '800' },
  tableContent: { padding: 18, paddingBottom: 38 },
  handHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 10 },
  handTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  scoreBadge: { minWidth: 34, height: 28, textAlign: 'center', lineHeight: 28, overflow: 'hidden', borderRadius: 14, color: '#171107', backgroundColor: colors.goldLight, fontSize: 14, fontWeight: '900' },
  cardRow: { minHeight: 126, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  playingCard: { width: 72, height: 108, borderRadius: 10, padding: 8, justifyContent: 'space-between', backgroundColor: '#F7F1E3', borderWidth: 1, borderColor: '#D4C9B2' },
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
  rouletteBetButton: { width: '31%', minHeight: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.panel2, borderWidth: 1, borderColor: colors.border },
  rouletteBetActive: { borderColor: colors.goldLight, borderWidth: 3 },
  rouletteBetText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  rouletteOdds: { color: '#CDD3D8', fontSize: 9, marginTop: 3 },
  numberGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  numberCell: { width: '12%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#59616A' },
  numberRed: { backgroundColor: '#9D3038' },
  numberBlack: { backgroundColor: '#20242B' },
  numberGreen: { backgroundColor: '#16714D' },
  numberActive: { borderColor: colors.goldLight, borderWidth: 3 },
  numberText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  rouletteChip: { width: '23%', minHeight: 62, alignItems: 'center', justifyContent: 'center', borderRadius: 31, backgroundColor: '#232A34', borderWidth: 2, borderColor: '#4B5563' },
  rouletteChipActive: { backgroundColor: '#4A3812', borderColor: colors.goldLight },
  rouletteChipUnit: { color: colors.muted, fontSize: 9, marginTop: 2 },
  rouletteSpinButton: { width: '100%', marginTop: 24 },
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
  difficultyText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
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
