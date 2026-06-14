#!/usr/bin/env python3
"""伊予鉄市内電車データセットの検証スクリプト。
JSON妥当性・時刻の単調増加・電停id参照整合・運休便集計に加え、
主要OD×期待系統（カバレッジ回帰）と補間区間の並び整合（補間単調性）を検査する。
使い方: python validate.py
"""
import json
import glob
import os
import sys

DATA_DIR = os.path.dirname(os.path.abspath(__file__))


def hm(t):
    h, m = t.split(":")
    return int(h) * 60 + int(m)


def main():
    errors = []
    warnings = []

    # 1. 全JSONパース
    files = sorted(glob.glob(os.path.join(DATA_DIR, "*.json")))
    data = {}
    for f in files:
        try:
            data[os.path.basename(f)] = json.load(open(f, encoding="utf-8"))
        except Exception as e:
            errors.append(f"{os.path.basename(f)}: JSONパースエラー: {e}")

    # 2. 電停idの集合
    stops = data["stops.json"]["stops"]
    stop_ids = [s["id"] for s in stops]
    dup = sorted({x for x in stop_ids if stop_ids.count(x) > 1})
    if dup:
        errors.append(f"stops.json: 重複id {dup}")
    valid_ids = set(stop_ids) | {
        "matsuyamashi-eki-arr",  # 周回の終点（起点 松山市駅へ戻る）
        "minami-horibata-arr",   # 南堀端の2回目通過（環状線で2回通る）
    }

    # 3. 各便の検証
    trip_count = 0
    suspended_count = 0

    def check_trip(trip, ctx):
        nonlocal trip_count, suspended_count
        trip_count += 1
        if trip.get("saturday_holiday_suspended"):
            suspended_count += 1
        st = trip.get("stops", {})
        # 電停id参照チェック
        for sid in st.keys():
            if sid not in valid_ids:
                errors.append(f"{ctx} {trip.get('trip')}: 未知の電停id '{sid}'")
        # 時刻単調増加チェック
        times = [hm(v) for v in st.values()]
        for i in range(1, len(times)):
            if times[i] < times[i - 1]:
                warnings.append(
                    f"{ctx} {trip.get('trip')}: 時刻が減少 {list(st.values())}"
                )
                break

    def walk(obj, ctx):
        if isinstance(obj, dict):
            for k in ["early_morning_trips", "night_trips", "trips"]:
                if isinstance(obj.get(k), list):
                    for t in obj[k]:
                        check_trip(t, f"{ctx}/{k}")
            for k, v in obj.items():
                if isinstance(v, (dict, list)):
                    walk(v, f"{ctx}/{k}")
        elif isinstance(obj, list):
            for x in obj:
                walk(x, ctx)

    for fname, d in data.items():
        if fname.startswith("timetable_route"):
            walk(d, fname)

    # 4. daytime_patternのoffset電停参照チェック
    def check_offsets(obj, ctx):
        if isinstance(obj, dict):
            if "segment_offsets_from_origin" in obj:
                for sid in obj["segment_offsets_from_origin"]:
                    if sid not in valid_ids:
                        errors.append(f"{ctx}: offset未知電停 '{sid}'")
            for k, v in obj.items():
                if isinstance(v, (dict, list)):
                    check_offsets(v, f"{ctx}/{k}")
        elif isinstance(obj, list):
            for x in obj:
                check_offsets(x, ctx)

    for fname, d in data.items():
        if fname.startswith("timetable_route"):
            check_offsets(d, fname)

    # ===== 回帰チェック共通: timetable から区間順(stops_in_order)を取り出す =====
    # data.ts normalizedSections と同じ規則: ループ系統(①②)は top-level stops_in_order、
    # 双方向系統(③⑤⑥)は directions.<key>.stops_in_order。time-resolver/route-search が
    # 参照する順序の源泉に一致させる（routes.json ではなく timetable 側）。
    ROUTE_MARU = {"1": "①", "2": "②", "3": "③", "5": "⑤", "6": "⑥"}
    ROUTE_IDS = ["1", "2", "3", "5", "6"]

    def sections_of(route_id):
        d = data.get("timetable_route%s.json" % route_id)
        if not d:
            return []
        if isinstance(d.get("stops_in_order"), list):
            return [("loop", d["stops_in_order"])]
        out = []
        for key, dir_ in (d.get("directions") or {}).items():
            order = dir_.get("stops_in_order")
            if isinstance(order, list):
                out.append((key, order))
        return out

    sections_by_route = {r: sections_of(r) for r in ROUTE_IDS}

    def fmt_routes(s):
        return "".join(ROUTE_MARU.get(x, x) for x in sorted(s)) or "(なし)"

    # 5. 主要OD×期待系統（カバレッジ回帰）
    #    乗換なしで from→to を通す系統 = ある区間順で idx(from) < idx(to) を満たす系統。
    #    電停カバレッジ欠落（旧F-1類）や継ぎ目跨ぎの取りこぼしを回帰検出する。
    #    ※ ①②の継ぎ目跨ぎ(loop-wrap)は実装しない方針(確定)＝期待集合に含めない。
    # 周回末尾の合成電停は実電停IDへ寄せて照合する（route-search の canonicalStopId と同じ）。
    LOOP_ARR = {
        "matsuyamashi-eki-arr": "matsuyamashi-eki",
        "minami-horibata-arr": "minami-horibata",
    }

    def canon(s):
        return LOOP_ARR.get(s, s)

    def serving_routes(frm, to):
        served = set()
        for r in ROUTE_IDS:
            for _key, order in sections_by_route[r]:
                fi_list = [i for i, s in enumerate(order) if canon(s) == frm]
                if not fi_list:
                    continue
                fi = fi_list[0]
                if any(canon(s) == to and i > fi for i, s in enumerate(order)):
                    served.add(r)
                    break
        return served

    expected_od = [
        ("katsuyamacho", "jr-matsuyama-ekimae", {"2", "5"}),    # 原バグ: 勝山町→JR松山=②⑤(確定)
        ("keisatsusho-mae", "jr-matsuyama-ekimae", {"2", "5"}),  # 警察署前も同様
        ("katsuyamacho", "dogo-onsen", {"3", "5"}),             # 勝山町が③⑤で道後到達(見立て1)
        ("keisatsusho-mae", "dogo-onsen", {"3", "5"}),
        ("matsuyamashi-eki", "dogo-onsen", {"3"}),
        ("jr-matsuyama-ekimae", "dogo-onsen", {"5"}),
        ("dogo-onsen", "jr-matsuyama-ekimae", {"5"}),
        ("dogo-onsen", "matsuyamashi-eki", {"3"}),
        # F-1解消（環状線①②への欠落4電停追加）の回帰ロック
        ("matsuyamashi-eki", "miyatacho", {"1", "2"}),          # 宮田町が到達可能に(旧F-1)
        ("matsuyamashi-eki", "kayamachi-roku", {"1", "2"}),     # 萱町六丁目が到達可能に(旧F-1)
        ("matsuyamashi-eki", "otemachi-ekimae", {"1", "2"}),    # 大手町駅前が環状線に
        ("otemachi-ekimae", "matsuyamashi-eki", {"1", "2"}),    # 周回末(南堀端2回目跨ぎ)で松山市駅へ
        ("katsuyamacho", "minami-horibata", {"1", "2", "3", "5"}),  # 南堀端2回目通過(合成ID)を①②で拾う＋③⑤
        # 下り方向（道後温泉→松山/JR）の南町・道後公園カバレッジ（監査F-A回帰ロック）
        ("dogo-onsen", "minamimachi", {"3", "5"}),              # 道後温泉→南町(inbound)
        ("dogo-onsen", "dogo-koen", {"3", "5"}),                # 道後温泉→道後公園(inbound)
        ("minamimachi", "matsuyamashi-eki", {"3"}),             # 南町→松山市駅(③のみ・⑤はJR行き)
        ("dogo-koen", "okaido", {"3", "5"}),                    # 道後公園→大街道(inbound)
    ]
    for frm, to, exp in expected_od:
        got = serving_routes(frm, to)
        if got != exp:
            errors.append(
                "OD %s→%s: 期待系統 %s だが実際 %s" % (frm, to, fmt_routes(exp), fmt_routes(got))
            )

    # 6. 補間区間の整合（補間単調性の回帰検出）
    #    time-resolver は idx(a)<idx(b) の向きの便にだけ区間[a,b]を適用し中間電停を補間する。
    #    中間電停 m が idx(a)<idx(m)<idx(b) を満たさないと、補間時刻が並び順と逆転し単調性違反になる。
    seg_by_route = {
        ip["route_id"]: ip["segments"]
        for ip in data["segments.json"]["interpolations"]
    }
    for r in ROUTE_IDS:
        for seg in seg_by_route.get(r, []):
            a, b = seg["between"]
            mids = [m["stop"] for m in seg.get("intermediate", [])]
            if not mids:
                continue
            for _key, order in sections_by_route[r]:
                if a not in order or b not in order:
                    continue
                ai, bi = order.index(a), order.index(b)
                if ai >= bi:
                    continue  # この向きの便には適用されない区間（双方向系統の逆区間）
                for m in mids:
                    mi = order.index(m) if m in order else -1
                    if not (ai < mi < bi):
                        loc = "未収載" if mi < 0 else "idx %d (区間 %d..%d)" % (mi, ai, bi)
                        warnings.append(
                            "%s番 区間[%s→%s] 中間電停 %s が区間順の外側: %s。補間時刻が逆転=単調性違反"
                            % (ROUTE_MARU.get(r, r), a, b, m, loc)
                        )

    # 6b. 補間カバレッジ（方向別）の回帰検出（監査F-Aクラス）
    #    双方向系統で「往き向きだけ区間を定義し逆向き区間を忘れる」と、逆向き便で
    #    中間電停が一度も補間されず脱落する（time-resolver は ai<bi の向きの便にだけ
    #    区間[a,b]を適用するため）。脱落電停は stops_in_order には載るので serving_routes
    #    / 単調性チェックでは検出できない（旧F-A=道後公園/南町 inbound脱落）。
    #    各方向の stops_in_order 上にある補間対象電停が、その方向で適用される区間に
    #    必ず覆われることを検査する。
    for r in ROUTE_IDS:
        segs = seg_by_route.get(r, [])
        interp_stops = {
            m["stop"] for seg in segs for m in seg.get("intermediate", [])
        }
        for key, order in sections_by_route[r]:
            covered = set()
            for seg in segs:
                a, b = seg["between"]
                if a not in order or b not in order:
                    continue
                if order.index(a) >= order.index(b):
                    continue  # この向きの便には適用されない区間（逆区間）
                for m in seg.get("intermediate", []):
                    covered.add(m["stop"])
            for s in order:
                if s in interp_stops and s not in covered:
                    errors.append(
                        "%s番 %s: 補間対象電停 %s がこの方向の適用区間で覆われず脱落"
                        "（補間なし=経路なし誤案内）"
                        % (ROUTE_MARU.get(r, r), key, s)
                    )

    # 結果出力
    print(f"検証ファイル数: {len(files)}")
    print(f"電停数: {len(stops)} (ユニーク: {len(set(stop_ids))})")
    print(f"明示便総数: {trip_count}")
    print(f"うち土日祝運休便: {suspended_count}")
    print(f"\nエラー: {len(errors)}")
    for e in errors:
        print(f"  [ERROR] {e}")
    print(f"警告: {len(warnings)}")
    for w in warnings:
        print(f"  [WARN] {w}")

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
