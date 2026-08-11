import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

type Tab = '홈' | '게임' | '지갑' | '기록' | '설정';
type AppScreen = 'tabs' | 'casinoCatalog' | 'blackjackSetup';

const difficultyOptions = [
  { name: '입문', min: 10, max: 100, bets: [10, 25, 50, 100] },
  { name: '쉬움', min: 50, max: 500, bets: [50, 100, 250, 500] },
  { name: '보통', min: 100, max: 2000, bets: [100, 500, 1000, 2000] },
  { name: '어려움', min: 500, max: 10000, bets: [500, 1000, 5000, 10000] },
  { name: '전문가', min: 1000, max: 50000, bets: [1000, 5000, 10000, 50000] },
];

const casinoGames = [
  { name: '블랙잭', icon: 'A♠', description: '카드 합계 21에 도전하는 테이블 게임', available: true },
  { name: '바카라', icon: '◆', description: '플레이어와 뱅커 중 승리할 쪽을 선택', available: false },
  { name: '룰렛', icon: '◎', description: '숫자와 색상에 코인을 거는 휠 게임', available: false },
  { name: '크랩스', icon: '⚄', description: '두 개의 주사위 결과를 예측하는 게임', available: false },
  { name: '식보', icon: '⚂', description: '세 개의 주사위 조합을 예측하는 게임', available: false },
  { name: '슬롯', icon: '7', description: '같은 그림 조합을 완성하는 머신 게임', available: false },
];

const STORAGE_KEYS = {
  coins: 'world-casino.coins',
  difficulty: 'world-casino.difficulty',
};

const tabs: { name: Tab; icon: string }[] = [
  { name: '홈', icon: '⌂' },
  { name: '게임', icon: '♠' },
  { name: '지갑', icon: '◈' },
  { name: '기록', icon: '▥' },
  { name: '설정', icon: '⚙' },
];

const categories = [
  { name: '한국 전통', icon: '花', detail: '고스톱 · 맞고 · 섰다' },
  { name: '카지노', icon: '◆', detail: '블랙잭 · 룰렛 · 바카라' },
  { name: '포커·카드', icon: '♠', detail: '홀덤 · 오마하 · 포커' },
  { name: '마작', icon: '發', detail: '리치 · 중국식 마작' },
  { name: '레이싱', icon: '⚑', detail: '경마 · 경륜 · 경정' },
  { name: '세계 게임', icon: '◎', detail: '세계 전통 게임' },
];

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
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.coins),
      AsyncStorage.getItem(STORAGE_KEYS.difficulty),
    ]).then(([savedCoins, savedDifficulty]) => {
      if (savedCoins) {
        setCoins(Number(savedCoins));
      } else {
        AsyncStorage.setItem(STORAGE_KEYS.coins, '10000');
      }
      if (savedDifficulty) setDifficulty(savedDifficulty);
      setLoaded(true);
    });
  }, []);

  const saveDifficulty = async (value: string) => {
    setDifficulty(value);
    const option = difficultyOptions.find((item) => item.name === value);
    if (option) setSelectedBet(option.bets[Math.min(1, option.bets.length - 1)]);
    await AsyncStorage.setItem(STORAGE_KEYS.difficulty, value);
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
        {appScreen === 'casinoCatalog' && (
          <CasinoCatalogScreen onBack={() => setAppScreen('tabs')} onOpenBlackjack={() => setAppScreen('blackjackSetup')} />
        )}
        {appScreen === 'blackjackSetup' && (
          <BlackjackSetupScreen
            coins={coins}
            difficulty={difficulty}
            selectedBet={selectedBet}
            onBack={() => setAppScreen('casinoCatalog')}
            onDifficultyChange={saveDifficulty}
            onBetChange={setSelectedBet}
          />
        )}
        {appScreen === 'tabs' && renderTab(tab, difficulty, saveDifficulty, sound, setSound, vibration, setVibration, () => setAppScreen('casinoCatalog'), () => setAppScreen('blackjackSetup'))}
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
  onOpenCasino: () => void,
  onOpenBlackjack: () => void,
) {
  if (tab === '게임') return <GamesScreen onOpenCasino={onOpenCasino} />;
  if (tab === '지갑') return <WalletScreen />;
  if (tab === '기록') return <RecordsScreen />;
  if (tab === '설정') {
    return <SettingsScreen difficulty={difficulty} saveDifficulty={saveDifficulty} sound={sound} setSound={setSound} vibration={vibration} setVibration={setVibration} />;
  }
  return <HomeScreen difficulty={difficulty} onOpenBlackjack={onOpenBlackjack} />;
}

function Page({ children }: { children: React.ReactNode }) {
  return <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>{children}</ScrollView>;
}

function HomeScreen({ difficulty, onOpenBlackjack }: { difficulty: string; onOpenBlackjack: () => void }) {
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
        <Row title="블랙잭" subtitle="오늘 19:42 · 보통" value="+500 WC" positive />
        <View style={styles.separator} />
        <Row title="룰렛" subtitle="어제 22:10 · 쉬움" value="-100 WC" />
      </View>

      <Text style={styles.sectionTitle}>오늘의 미션</Text>
      <View style={styles.panel}>
        <Row title="게임 3판 플레이" subtitle="1 / 3 완료" value="+300 WC" positive />
        <View style={styles.progressTrack}><View style={styles.progressValue} /></View>
      </View>
    </Page>
  );
}

function GamesScreen({ onOpenCasino }: { onOpenCasino: () => void }) {
  return (
    <Page>
      <Text style={styles.pageTitle}>게임</Text>
      <View style={styles.searchBox}><Text style={styles.muted}>⌕  게임 이름 검색</Text></View>
      <View style={styles.chipRow}>
        <View style={[styles.chip, styles.chipActive]}><Text style={styles.chipActiveText}>전체</Text></View>
        <View style={styles.chip}><Text style={styles.chipText}>즐겨찾기</Text></View>
        <View style={styles.chip}><Text style={styles.chipText}>플레이 가능</Text></View>
      </View>
      <Text style={styles.sectionTitle}>6개 카테고리</Text>
      <View style={styles.categoryGrid}>
        {categories.map((category, index) => (
          <Pressable
            key={category.name}
            style={({ pressed }) => [styles.categoryCard, index === 1 && pressed && styles.pressed]}
            onPress={index === 1 ? onOpenCasino : undefined}
            accessibilityRole="button"
            accessibilityState={{ disabled: index !== 1 }}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.categoryDetail}>{category.detail}</Text>
            {index !== 1 && <Text style={styles.comingSoon}>준비 중</Text>}
          </Pressable>
        ))}
      </View>
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

function CasinoCatalogScreen({ onBack, onOpenBlackjack }: { onBack: () => void; onOpenBlackjack: () => void }) {
  return (
    <View style={styles.detailScreen}>
      <ScreenHeader title="카지노" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.detailPage} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>CASINO GAMES</Text>
        <Text style={styles.detailLead}>원하는 게임을 선택하세요</Text>
        <View style={styles.searchBox}><Text style={styles.muted}>⌕  카지노 게임 검색</Text></View>
        <View style={styles.catalogList}>
          {casinoGames.map((game) => (
            <Pressable
              key={game.name}
              accessibilityRole="button"
              accessibilityState={{ disabled: !game.available }}
              onPress={game.available ? onOpenBlackjack : undefined}
              style={({ pressed }) => [styles.gameListCard, !game.available && styles.disabledCard, pressed && game.available && styles.pressed]}
            >
              <View style={styles.gameListIcon}><Text style={styles.gameListIconText}>{game.icon}</Text></View>
              <View style={styles.gameListCopy}>
                <View style={styles.gameTitleRow}>
                  <Text style={styles.gameListTitle}>{game.name}</Text>
                  <Text style={game.available ? styles.availableBadge : styles.comingSoonBadge}>{game.available ? '플레이 가능' : '준비 중'}</Text>
                </View>
                <Text style={styles.gameListDescription}>{game.description}</Text>
              </View>
              <Text style={styles.chevron}>{game.available ? '›' : ''}</Text>
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
}) {
  const selectedDifficulty = difficultyOptions.find((item) => item.name === props.difficulty) ?? difficultyOptions[2];
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

        <Pressable disabled style={[styles.primaryButton, styles.fullWidthButton, styles.disabledCard]}>
          <Text style={styles.primaryButtonText}>게임 시작 · 준비 중</Text>
        </Pressable>
        <Text style={styles.setupNotice}>현재는 설정 화면까지 작동합니다. 실제 블랙잭 게임판은 다음 제작 단계에서 연결됩니다.</Text>
      </ScrollView>
    </View>
  );
}

function WalletScreen() {
  return (
    <Page>
      <Text style={styles.pageTitle}>지갑</Text>
      <View style={styles.balanceCard}>
        <Text style={styles.muted}>전체 자산</Text>
        <Text style={styles.balance}>10,000 WC</Text>
        <Text style={styles.positive}>이번 달 +2,450 WC (+24.5%)</Text>
        <View style={styles.chart}>
          {[30, 42, 36, 55, 48, 72, 64, 88].map((height, index) => <View key={index} style={[styles.chartBar, { height }]} />)}
        </View>
      </View>
      <Text style={styles.sectionTitle}>카테고리별 비교</Text>
      <View style={styles.panel}>
        {categoryResults.map(([name, value, positive], index) => (
          <React.Fragment key={name}>
            <Row title={name} value={value} positive={positive} />
            {index < categoryResults.length - 1 && <View style={styles.separator} />}
          </React.Fragment>
        ))}
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

function RecordsScreen() {
  return (
    <Page>
      <Text style={styles.pageTitle}>기록</Text>
      <View style={styles.statsGrid}>
        <Stat label="전체 플레이" value="12판" />
        <Stat label="승률" value="58.3%" />
        <Stat label="최고 연승" value="3연승" />
        <Stat label="총 손익" value="+2,450" positive />
      </View>
      <Text style={styles.sectionTitle}>최근 경기</Text>
      <View style={styles.panel}>
        <Row title="블랙잭 · 승리" subtitle="보통 · 베팅 500 WC" value="+500 WC" positive />
        <View style={styles.separator} />
        <Row title="룰렛 · 패배" subtitle="쉬움 · 베팅 100 WC" value="-100 WC" />
        <View style={styles.separator} />
        <Row title="블랙잭 · 승리" subtitle="보통 · 베팅 300 WC" value="+300 WC" positive />
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
  separator: { height: 1, backgroundColor: colors.border },
  progressTrack: { height: 7, marginBottom: 16, borderRadius: 4, backgroundColor: '#252D39', overflow: 'hidden' },
  progressValue: { width: '33%', height: '100%', backgroundColor: colors.gold },
  searchBox: { height: 48, borderRadius: 14, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', paddingHorizontal: 15 },
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
  gameListCard: { minHeight: 96, flexDirection: 'row', alignItems: 'center', padding: 13, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
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
