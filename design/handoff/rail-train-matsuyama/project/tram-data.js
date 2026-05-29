/* ───────────────────────────────────────────────────────────────
   伊予鉄道 市内電車 — データ層 (realistic dummy data)
   Matsuyama city tram: 29 stops, 5 lines, schedule + route planning.
   Exposed as window.TRAM. Detailed real timetables get swapped in later;
   this layer models the shape the UI needs.
─────────────────────────────────────────────────────────────── */
(function () {
  // ── Lines (系統) ──────────────────────────────────────────────
  // colors: ①緑 ②赤 ③橙 ⑤青 ⑥黒
  const LINES = {
    1: { no: '①', color: '#0a9d54', ja: '環状線（右回り）', en: 'Loop · clockwise', loop: true, loopVia: 'jr' },
    2: { no: '②', color: '#d8262c', ja: '環状線（左回り）', en: 'Loop · counter-clockwise', loop: true, loopVia: 'okaido' },
    3: { no: '③', color: '#ef8200', ja: '城南線', en: 'Jōnan Line', loop: false },
    5: { no: '⑤', color: '#1572bf', ja: '大手町線', en: 'Ōtemachi Line', loop: false },
    6: { no: '⑥', color: '#2b2b2b', ja: '本町線', en: 'Honmachi Line', loop: false, weekdayOnly: true },
  };

  // ── Stops (電停) ──────────────────────────────────────────────
  // id, ja, kana, romaji, alias[] (通称・略称)
  const S = (id, ja, kana, romaji, alias) => ({ id, ja, kana, romaji, alias: alias || [] });
  const STOPS = [
    S('matsuyamashi', '松山市駅', 'まつやましえき', 'matsuyamashi', ['いよてつ', '市駅', 'shieki', 'iyotetsu']),
    S('shiyakusho', '市役所前', 'しやくしょまえ', 'shiyakushomae', ['市役所']),
    S('kencho', '県庁前', 'けんちょうまえ', 'kenchomae', ['県庁']),
    S('okaido', '大街道', 'おおかいどう', 'okaido', ['アーケード', 'arcade']),
    S('katsuyama', '勝山町', 'かつやまちょう', 'katsuyamacho', []),
    S('keisatsu', '警察署前', 'けいさつしょまえ', 'keisatsushomae', ['警察署']),
    S('kamiichiman', '上一万', 'かみいちまん', 'kamiichiman', []),
    S('teppo', '鉄砲町', 'てっぽうちょう', 'teppocho', []),
    S('shimizu', '清水町', 'しみずまち', 'shimizumachi', []),
    S('takasago', '高砂町', 'たかさごちょう', 'takasagocho', []),
    S('kiyamachi', '木屋町', 'きやちょう', 'kiyacho', []),
    S('kayamachi', '萱町六丁目', 'かやまちろくちょうめ', 'kayamachi', ['萱町']),
    S('komachi', '古町', 'こまち', 'komachi', ['こまち駅', 'komachi station']),
    S('miyata', '宮田町', 'みやたまち', 'miyatamachi', []),
    S('jr', 'JR松山駅前', 'じぇいあーるまつやまえきまえ', 'jr matsuyama', ['JR', 'JR駅', 'jr eki', 'jreki']),
    S('otemachi', '大手町駅前', 'おおてまちえきまえ', 'otemachi', ['大手町']),
    S('nishihoribata', '西堀端', 'にしほりばた', 'nishihoribata', []),
    S('minamihoribata', '南堀端', 'みなみほりばた', 'minamihoribata', []),
    S('heiwadori', '平和通一丁目', 'へいわどおりいっちょうめ', 'heiwadori', ['平和通', '大学前', '愛大', 'university']),
    S('sekijuji', '赤十字病院前', 'せきじゅうじびょういんまえ', 'sekijujibyoin', ['日赤', '赤十字', 'red cross']),
    S('minamimachi', '南町', 'みなみまち', 'minamimachi', ['県美術館', 'art museum']),
    S('dogokoen', '道後公園', 'どうごこうえん', 'dogokoen', ['道後公園', '湯築城']),
    S('dogo', '道後温泉', 'どうごおんせん', 'dogo onsen', ['道後', 'dogo', 'onsen', '温泉', 'spa']),
    S('honmachi1', '本町一丁目', 'ほんまちいっちょうめ', 'honmachi 1', ['本町1']),
    S('honmachi2', '本町二丁目', 'ほんまちにちょうめ', 'honmachi 2', ['本町2']),
    S('honmachi3', '本町三丁目', 'ほんまちさんちょうめ', 'honmachi 3', ['本町3']),
    S('honmachi4', '本町四丁目', 'ほんまちよんちょうめ', 'honmachi 4', ['本町4']),
    S('honmachi5', '本町五丁目', 'ほんまちごちょうめ', 'honmachi 5', ['本町5']),
    S('honmachi6', '本町六丁目', 'ほんまちろくちょうめ', 'honmachi 6', ['本町6', '本町']),
  ];
  const STOP_BY_ID = Object.fromEntries(STOPS.map(s => [s.id, s]));

  // ── Segment times between adjacent stops (minutes, undirected) ─
  const SEG = {};
  const seg = (a, b, m) => { SEG[a + '|' + b] = m; SEG[b + '|' + a] = m; };
  // loop ring
  seg('matsuyamashi', 'shiyakusho', 1);
  seg('shiyakusho', 'kencho', 2);
  seg('kencho', 'okaido', 1);
  seg('okaido', 'katsuyama', 2);
  seg('katsuyama', 'keisatsu', 1);
  seg('keisatsu', 'kamiichiman', 2);
  seg('kamiichiman', 'teppo', 2);
  seg('teppo', 'shimizu', 1);
  seg('shimizu', 'takasago', 2);
  seg('takasago', 'kiyamachi', 1);
  seg('kiyamachi', 'kayamachi', 2);
  seg('kayamachi', 'komachi', 1);
  seg('komachi', 'miyata', 2);
  seg('miyata', 'jr', 2);
  seg('jr', 'otemachi', 2);
  seg('otemachi', 'nishihoribata', 2);
  seg('nishihoribata', 'minamihoribata', 1);
  seg('minamihoribata', 'matsuyamashi', 1);
  // Dōgo spur
  seg('kamiichiman', 'heiwadori', 1);
  seg('heiwadori', 'sekijuji', 2);
  seg('sekijuji', 'minamimachi', 1);
  seg('minamimachi', 'dogokoen', 2);
  seg('dogokoen', 'dogo', 2);
  // Honmachi spur
  seg('nishihoribata', 'honmachi1', 2);
  seg('honmachi1', 'honmachi2', 1);
  seg('honmachi2', 'honmachi3', 1);
  seg('honmachi3', 'honmachi4', 1);
  seg('honmachi4', 'honmachi5', 1);
  seg('honmachi5', 'honmachi6', 2);

  // ── Line paths ────────────────────────────────────────────────
  const RING = [
    'matsuyamashi', 'shiyakusho', 'kencho', 'okaido', 'katsuyama', 'keisatsu',
    'kamiichiman', 'teppo', 'shimizu', 'takasago', 'kiyamachi', 'kayamachi',
    'komachi', 'miyata', 'jr', 'otemachi', 'nishihoribata', 'minamihoribata',
  ];
  const PATHS = {
    1: RING.slice(),
    2: RING.slice().reverse(),
    3: ['matsuyamashi', 'shiyakusho', 'kencho', 'okaido', 'katsuyama', 'keisatsu',
        'kamiichiman', 'heiwadori', 'sekijuji', 'minamimachi', 'dogokoen', 'dogo'],
    5: ['jr', 'otemachi', 'nishihoribata', 'minamihoribata', 'matsuyamashi', 'shiyakusho',
        'kencho', 'okaido', 'katsuyama', 'keisatsu', 'kamiichiman', 'heiwadori',
        'sekijuji', 'minamimachi', 'dogokoen', 'dogo'],
    6: ['honmachi6', 'honmachi5', 'honmachi4', 'honmachi3', 'honmachi2', 'honmachi1',
        'nishihoribata', 'minamihoribata', 'matsuyamashi', 'shiyakusho', 'kencho',
        'okaido', 'katsuyama', 'keisatsu', 'kamiichiman', 'heiwadori', 'sekijuji',
        'minamimachi', 'dogokoen', 'dogo'],
  };

  // cumulative minutes along a path
  function cumOf(path, loop) {
    const cum = [0];
    for (let i = 1; i < path.length; i++) cum[i] = cum[i - 1] + (SEG[path[i - 1] + '|' + path[i]] || 2);
    if (loop) {
      const closing = SEG[path[path.length - 1] + '|' + path[0]] || 2;
      cum.total = cum[cum.length - 1] + closing;
    } else {
      cum.total = cum[cum.length - 1];
    }
    return cum;
  }
  const META = {};
  Object.keys(PATHS).forEach(id => {
    const L = LINES[id];
    META[id] = { path: PATHS[id], cum: cumOf(PATHS[id], L.loop), idx: Object.fromEntries(PATHS[id].map((s, i) => [s, i])) };
  });

  // ── Service config ────────────────────────────────────────────
  const SERVICE = {
    1: { start: 360, end: 1335, headway: 11, phase: 0 },
    2: { start: 365, end: 1340, headway: 11, phase: 5 },
    3: { start: 372, end: 1320, headway: 13, phase: 3 },
    5: { start: 368, end: 1320, headway: 14, phase: 8 },
    6: { start: 420, end: 1230, headway: 18, phase: 2 }, // weekday only, shorter span
  };

  // ── Helpers ───────────────────────────────────────────────────
  const pad = n => String(n).padStart(2, '0');
  function fmtTime(min) {
    const m = ((min % 1440) + 1440) % 1440;
    return Math.floor(m / 60) + ':' + pad(m % 60);
  }

  // travel minutes A→B on a line, in the direction that actually reaches B
  function travelOn(id, a, b) {
    const M = META[id], L = LINES[id];
    const ia = M.idx[a], ib = M.idx[b];
    if (ia == null || ib == null) return null;
    if (ia === ib) return null;
    if (L.loop) {
      const t = (M.cum[ib] - M.cum[ia] + M.cum.total) % M.cum.total;
      return t === 0 ? null : t;
    }
    return Math.abs(M.cum[ib] - M.cum[ia]);
  }

  // generate departure minutes (at origin a, heading toward b) on a line
  function departuresOn(id, a, b, fromMin, horizon, dayType) {
    const L = LINES[id], cfg = SERVICE[id], M = META[id];
    if (L.weekdayOnly && dayType === 'weekend') return [];
    const ia = M.idx[a], ib = M.idx[b];
    if (ia == null || ib == null || ia === ib) return [];

    // offset of origin from the run's start, in the relevant direction
    let originOffset;
    if (L.loop) {
      originOffset = M.cum[ia]; // runs start at path[0], circulate
    } else {
      const forward = ib > ia;
      originOffset = forward ? M.cum[ia] : (M.cum.total - M.cum[ia]);
    }
    const travel = travelOn(id, a, b);
    if (travel == null) return [];

    const out = [];
    const H = cfg.headway;
    // earliest run start such that it reaches origin at/after start window
    // departure at origin = cfg.start + cfg.phase + originOffset + k*H
    const base = cfg.start + cfg.phase + originOffset;
    let k = Math.max(0, Math.ceil((fromMin - base) / H));
    while (true) {
      const dep = base + k * H;
      const runStart = dep - originOffset;
      if (runStart > cfg.end) break;          // no more runs today
      if (dep > fromMin + horizon) break;
      if (dep >= fromMin) out.push({ lineId: id, departMin: dep, arriveMin: dep + travel, travelMin: travel });
      k++;
      if (out.length > 40) break;
    }
    return out;
  }

  // ── Fuzzy stop search ─────────────────────────────────────────
  function norm(s) {
    return (s || '').toString().toLowerCase().replace(/[\s\u3000・,.\-]/g, '');
  }
  function searchStops(q) {
    const n = norm(q);
    if (!n) return STOPS.slice();
    const scored = [];
    for (const s of STOPS) {
      const fields = [s.ja, s.kana, s.romaji, ...s.alias].map(norm);
      let best = -1;
      for (const f of fields) {
        if (!f) continue;
        if (f === n) { best = Math.max(best, 100); }
        else if (f.startsWith(n)) { best = Math.max(best, 70); }
        else if (f.includes(n)) { best = Math.max(best, 40); }
      }
      if (best >= 0) scored.push({ s, best });
    }
    scored.sort((a, b) => b.best - a.best);
    return scored.map(x => x.s);
  }

  // ── Nearest stop (simulated geolocation) ──────────────────────
  // Demo: user is in the 大街道(Ōkaidō) arcade area.
  function nearestStops() {
    return [
      { id: 'okaido', dist: 120 },
      { id: 'kencho', dist: 340 },
      { id: 'katsuyama', dist: 410 },
    ];
  }

  // ── Fare (均一運賃) ───────────────────────────────────────────
  const FARE = { flat: true, adultCash: 200, adultIC: 200, child: 100 };

  // ── Top-level planner ─────────────────────────────────────────
  // returns { status, routes, fare, nextService }
  function plan(originId, destId, opts) {
    opts = opts || {};
    const nowMin = opts.nowMin != null ? opts.nowMin : 9 * 60 + 41;
    const dayType = opts.dayType || 'weekday';
    const limit = opts.limit || 4;

    if (!originId || !destId) return { status: 'incomplete', routes: [], fare: FARE };
    if (originId === destId) return { status: 'same', routes: [], fare: FARE };

    // collect candidates from all lines, today
    let all = [];
    for (const id of Object.keys(SERVICE)) {
      all = all.concat(departuresOn(id, originId, destId, nowMin, 240, dayType));
    }
    all.sort((a, b) => a.departMin - b.departMin || a.travelMin - b.travelMin);

    if (all.length === 0) {
      // service ended today (or none). find tomorrow's first departures.
      let tmr = [];
      for (const id of Object.keys(SERVICE)) {
        tmr = tmr.concat(departuresOn(id, originId, destId, 0, 1440, dayType === 'weekday' ? 'weekday' : 'weekday'));
      }
      tmr.sort((a, b) => a.departMin - b.departMin);
      if (tmr.length === 0) return { status: 'none', routes: [], fare: FARE };
      const first = tmr[0];
      return {
        status: 'ended',
        nextService: { ...first, line: LINES[first.lineId] },
        routes: tmr.slice(0, limit).map(decorate(nowMin, true)),
        fare: FARE,
      };
    }

    return {
      status: 'ok',
      routes: all.slice(0, limit).map(decorate(nowMin, false)),
      total: all.length,
      fare: FARE,
    };
  }

  function decorate(nowMin, nextDay) {
    return (r) => {
      const L = LINES[r.lineId];
      return {
        ...r,
        line: L,
        waitMin: nextDay ? null : Math.max(0, r.departMin - nowMin),
        estimate: true, // intermediate-stop arrival is computed → 目安
      };
    };
  }

  // ── i18n ──────────────────────────────────────────────────────
  const I18N = {
    ja: {
      appName: '松山市内電車ナビ',
      appSub: '松山・伊予鉄道',
      from: '出発', to: '到着',
      pickFrom: '出発電停を選ぶ', pickTo: '到着電停を選ぶ',
      useNearest: '現在地の最寄りから', near: '最寄り',
      searchPh: '電停を検索（名前・かな・ローマ字）',
      swap: '入れ替え', recent: 'よく使う電停', allStops: 'すべての電停',
      next: 'まもなく発車', soon: 'あと', min: '分', now: 'まもなく',
      depart: '発', arrive: '着', ride: '乗車', est: '目安',
      estNote: '到着・所要は途中電停からの推定値です',
      more: 'これ以降の便を見る', less: '閉じる', fare: '運賃', adult: '大人', child: '小児',
      flat: '市内均一', cash: '現金', ic: 'IC', forEach: '／回',
      status: '運行情報を見る', official: '伊予鉄道 公式',
      about: 'このページについて', unofficial: '本アプリは伊予鉄道の非公式ツールです。運行する伊予鉄道とは関係ありません。',
      estimateNote2: '表示時刻は目安です。正確・最新の時刻や運行状況は公式サイトでご確認ください。',
      dataBasis: 'データ基準：時刻 2023年11月1日改正／運賃 2026年4月1日改定',
      sameTitle: '同じ電停です', sameBody: '出発と到着に別の電停を選んでください。',
      endedTitle: '本日の運行は終了しました', endedBody: '翌日の始発をご案内します。',
      noneTitle: '経路が見つかりません', noneBody: 'この区間を直接つなぐ系統がありません。',
      locDenied: '位置情報が使えません', locDeniedBody: '出発電停を手動で選んでください。',
      tomorrow: '翌日', firstTrain: '始発',
      to_dest: '行き', via: '経由', direct: '途中の電停はありません', lines: '系統', selectBoth: '出発と到着を選ぶと、次に乗れる電車が表示されます。',
    },
    en: {
      appName: 'Matsuyama Tram Navi',
      appSub: 'Matsuyama · Iyo Railway',
      from: 'From', to: 'To',
      pickFrom: 'Choose departure', pickTo: 'Choose arrival',
      useNearest: 'From nearest stop', near: 'Nearest',
      searchPh: 'Search stops (name · kana · romaji)',
      swap: 'Swap', recent: 'Frequent stops', allStops: 'All stops',
      next: 'Departing soon', soon: 'in', min: 'min', now: 'now',
      depart: 'dep', arrive: 'arr', ride: 'ride', est: 'est.',
      estNote: 'Arrival & duration are estimates from intermediate stops',
      more: 'Show later departures', less: 'Show less', fare: 'Fare', adult: 'Adult', child: 'Child',
      flat: 'Flat fare', cash: 'Cash', ic: 'IC', forEach: '/ ride',
      status: 'Service status', official: 'Iyo Railway official',
      about: 'About this page', unofficial: 'This is an unofficial tool and is not affiliated with Iyo Railway.',
      estimateNote2: 'Times shown are estimates. Please check the official site for accurate, up-to-date times and service status.',
      dataBasis: 'Data: timetable rev. 2023-11-01 / fares rev. 2026-04-01',
      sameTitle: 'Same stop', sameBody: 'Please choose different departure and arrival stops.',
      endedTitle: "Today's service has ended", endedBody: "Showing tomorrow's first trains.",
      noneTitle: 'No route found', noneBody: 'No line directly connects these stops.',
      locDenied: 'Location unavailable', locDeniedBody: 'Please choose a departure stop manually.',
      tomorrow: 'Tomorrow', firstTrain: 'first train',
      to_dest: 'toward', via: 'Via', direct: 'No stops in between', lines: 'lines', selectBoth: 'Pick a departure and arrival to see the next trams you can catch.',
    },
  };

  function name(stop, lang) {
    if (!stop) return '';
    const s = typeof stop === 'string' ? STOP_BY_ID[stop] : stop;
    if (!s) return '';
    return lang === 'en' ? toTitle(s.romaji) : s.ja;
  }
  function toTitle(r) { return r.replace(/\b\w/g, c => c.toUpperCase()); }

  // Roll-sign / 方向幕 label — what the rider sees on the actual tram.
  // Linear lines (③⑤⑥): "{terminus}行" toward the direction of travel.
  // Loop lines (①②): "環状線 {経由地}まわり" since they return to 松山市駅.
  function rollSign(lineId, originId, destId, lang) {
    const L = LINES[lineId], M = META[lineId];
    if (!L || !M) return '';
    if (L.loop) {
      const via = name(L.loopVia, lang);
      return lang === 'en' ? `Loop · via ${via}` : `環状線 ${via}まわり`;
    }
    const ia = M.idx[originId], ib = M.idx[destId];
    if (ia == null || ib == null) return lang === 'en' ? L.en : L.ja;
    const termId = ib > ia ? M.path[M.path.length - 1] : M.path[0];
    const term = name(termId, lang);
    return lang === 'en' ? `Bound for ${term}` : `${term}行`;
  }

  // intermediate stops between origin and dest on a line (in travel direction)
  function viaStops(lineId, originId, destId, lang) {
    const L = LINES[lineId], M = META[lineId];
    if (!L || !M) return [];
    const ia = M.idx[originId], ib = M.idx[destId];
    if (ia == null || ib == null) return [];
    const out = [];
    if (L.loop) {
      const n = M.path.length;
      let i = (ia + 1) % n;
      while (i !== ib) { out.push(M.path[i]); i = (i + 1) % n; }
    } else if (ib > ia) {
      for (let i = ia + 1; i < ib; i++) out.push(M.path[i]);
    } else {
      for (let i = ia - 1; i > ib; i--) out.push(M.path[i]);
    }
    return out.map(id => name(id, lang));
  }

  window.TRAM = {
    LINES, STOPS, STOP_BY_ID, PATHS, META, FARE, I18N,
    plan, searchStops, nearestStops, travelOn, departuresOn,
    fmtTime, name, rollSign, viaStops,
  };
})();
