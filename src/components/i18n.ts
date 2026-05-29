// モジュール8: 画面内文言（JA/EN）。バンドル tram-data.js の I18N から、
// 本番で使う文言のみ移植。系統名・電停名は一次データ(stops/routes)を正とする。

export type Lang = "ja" | "en";

export interface Strings {
  appName: string;
  from: string;
  to: string;
  pickFrom: string;
  pickTo: string;
  useNearest: string;
  near: string;
  searchPh: string;
  swap: string;
  recent: string;
  allStops: string;
  soon: string;
  min: string;
  now: string;
  depart: string;
  arrive: string;
  via: string;
  more: string;
  less: string;
  fare: string;
  adult: string;
  child: string;
  flat: string;
  cash: string;
  ic: string;
  status: string;
  official: string;
  about: string;
  unofficial: string;
  estimateNote2: string;
  dataBasis: string;
  estNote: string;
  selectBoth: string;
  sameTitle: string;
  sameBody: string;
  noneTitle: string;
  noneBody: string;
  suspendedTitle: string;
  suspendedBody: string;
  endedTitle: string;
  endedBody: string;
  noNextService: string;
  tomorrow: string;
  firstTrain: string;
  beforeFirstTitle: string;
  beforeFirstBody: string;
  locDenied: string;
  locDeniedBody: string;
  noMatch: string;
}

export const STRINGS: Record<Lang, Strings> = {
  ja: {
    appName: "松山市内電車ナビ",
    from: "出発",
    to: "到着",
    pickFrom: "出発電停を選ぶ",
    pickTo: "到着電停を選ぶ",
    useNearest: "現在地の最寄りから",
    near: "最寄り",
    searchPh: "電停を検索（名前・かな・ローマ字）",
    swap: "入れ替え",
    recent: "よく使う電停",
    allStops: "すべての電停",
    soon: "あと",
    min: "分",
    now: "まもなく",
    depart: "発",
    arrive: "着",
    via: "経由",
    more: "これ以降の便を見る",
    less: "閉じる",
    fare: "運賃",
    adult: "大人",
    child: "小児",
    flat: "市内均一",
    cash: "現金",
    ic: "IC",
    status: "運行情報を見る",
    official: "伊予鉄道 公式",
    about: "このページについて",
    unofficial:
      "本アプリは伊予鉄道の非公式ツールです。運行する伊予鉄道とは関係ありません。",
    estimateNote2:
      "表示時刻は目安です。正確・最新の時刻や運行状況は公式サイトでご確認ください。",
    dataBasis: "データ基準：時刻 2023年11月1日改正／運賃 2026年4月1日改定",
    estNote: "到着・所要は途中電停からの推定値です",
    selectBoth: "出発と到着を選ぶと、次に乗れる電車が表示されます。",
    sameTitle: "同じ電停です",
    sameBody: "出発と到着に別の電停を選んでください。",
    noneTitle: "経路が見つかりません",
    noneBody: "直通の系統がありません。乗り換えが必要です（乗換案内は今後対応）。",
    suspendedTitle: "本日は運休です",
    suspendedBody: "本町線（⑥番）は土曜・日曜・祝日は終日運休です。これらの電停を結ぶ系統は本町線のみのため、本日は運行していません。",
    endedTitle: "本日の運行は終了しました",
    endedBody: "翌日の始発をご案内します。",
    noNextService: "翌日も運行がありません。",
    tomorrow: "翌日",
    firstTrain: "始発",
    beforeFirstTitle: "始発前です",
    beforeFirstBody: "本日の始発便をご案内します。",
    locDenied: "位置情報が使えません",
    locDeniedBody: "出発電停を手動で選んでください。",
    noMatch: "該当する電停がありません",
  },
  en: {
    appName: "Matsuyama Tram Navi",
    from: "From",
    to: "To",
    pickFrom: "Choose departure",
    pickTo: "Choose arrival",
    useNearest: "From nearest stop",
    near: "Nearest",
    searchPh: "Search stops (name · kana · romaji)",
    swap: "Swap",
    recent: "Frequent stops",
    allStops: "All stops",
    soon: "in",
    min: "min",
    now: "now",
    depart: "dep",
    arrive: "arr",
    via: "Via",
    more: "Show later departures",
    less: "Show less",
    fare: "Fare",
    adult: "Adult",
    child: "Child",
    flat: "Flat fare",
    cash: "Cash",
    ic: "IC",
    status: "Service status",
    official: "Iyo Railway official",
    about: "About this page",
    unofficial:
      "This is an unofficial tool and is not affiliated with Iyo Railway.",
    estimateNote2:
      "Times shown are estimates. Please check the official site for accurate, up-to-date times and service status.",
    dataBasis: "Data: timetable rev. 2023-11-01 / fares rev. 2026-04-01",
    estNote: "Arrival & duration are estimates from intermediate stops",
    selectBoth: "Pick a departure and arrival to see the next trams you can catch.",
    sameTitle: "Same stop",
    sameBody: "Please choose different departure and arrival stops.",
    noneTitle: "No route found",
    noneBody: "No line directly connects these stops. A transfer is required (transfer guidance coming soon).",
    suspendedTitle: "Not operating today",
    suspendedBody: "The Hommachi Line (Route 6) does not run on Saturdays, Sundays, or holidays. These stops are connected only by the Hommachi Line, so there is no service today.",
    endedTitle: "Today's service has ended",
    endedBody: "Showing tomorrow's first trains.",
    noNextService: "No service tomorrow either.",
    tomorrow: "Tomorrow",
    firstTrain: "first train",
    beforeFirstTitle: "Before first train",
    beforeFirstBody: "Showing today's first departures.",
    locDenied: "Location unavailable",
    locDeniedBody: "Please choose a departure stop manually.",
    noMatch: "No matching stops",
  },
};
