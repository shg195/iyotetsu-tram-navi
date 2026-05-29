#!/usr/bin/env python3
"""伊予鉄市内電車データセットの検証スクリプト。
JSON妥当性・時刻の単調増加・電停id参照整合・運休便集計を行う。
使い方: python3 validate.py
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
    valid_ids = set(stop_ids) | {"matsuyamashi-eki-arr"}  # 環状線の到着用エイリアス

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
