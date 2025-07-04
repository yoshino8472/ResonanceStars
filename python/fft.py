import numpy as np
import json
import librosa
import math
import argparse

# A特性のdB値を返す（人間の耳の感度補正）
def a_weighting_db(f):
    """A特性のdB値を返す"""
    if f == 0:
        return -np.inf
    ra = (
        (12200**2 * f**4)
        / ((f**2 + 20.6**2)
           * math.sqrt((f**2 + 107.7**2) * (f**2 + 737.9**2))
           * (f**2 + 12200**2))
    )
    return 2.00 + 20 * math.log10(ra)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="FFT analysis with A-weighting")
    parser.add_argument("audio", type=str, help="Input audio file path (without .wav extension)")
    args = parser.parse_args()
    input_audio_path = args.audio

    # 音声ファイルのロード
    # srはサンプリング周波数
    y, sr = librosa.load(input_audio_path + ".wav", sr=None)

    # FFT設定
    # n_fftは窓のサイズ
    n_fft = 16384
    # hop_lengthは窓の移動幅
    hop_length = int(sr / 60)  # 60FPSに合わせる

    # 振幅スペクトルをdBに変換
    S = np.abs(librosa.stft(y, n_fft=n_fft, hop_length=hop_length)) 
    S_db = librosa.amplitude_to_db(S) 

    # 出力用データ（frameごとにdict）
    result = []

    # 各フレームごとに処理
    for frame_idx, frame in enumerate(S_db.T):
        note_bins = {}
        midi_bins = {}
        for i, db in enumerate(frame):
            freq = i * sr / n_fft
            if freq < 50 or freq > 4000:
                continue

            # MIDI番号
            midi = 69 + 12 * np.log2(freq / 440)
            midi_int = int(round(midi))
            key = f"n{midi_int}"

            # A特性のdB値を加算
            a_db = a_weighting_db(freq)
            weighted_db = max(db + a_db, 0) # dBがマイナスの場合は、0にクリップ

            midi_bins[key] = midi_bins.get(key, [0, 0])
            midi_bins[key][0] += weighted_db
            midi_bins[key][1] += 1

        # 平均化（dB）
        averaged = {
            k: float(round(v[0] / v[1], 3))
            for k, v in midi_bins.items()
            if v[1] > 0
        }

        # フレーム音量の平均(volume出力のために計算)
        if midi_bins:
            total_db = sum([v[0] for v in midi_bins.values()])
            count = sum([v[1] for v in midi_bins.values()])
            avg_db = float(total_db / count)
            if avg_db < 0:
                avg_db = 0
        else:
            avg_db = float(0)

        result.append({
            "volume": round(avg_db, 3),
            "notes": averaged
        })

    # 正規化処理
    # 全値を集めて最大・最小を取得
    all_values = [v for frame in result for v in frame["notes"].values()]
    if all_values:
        max_val = max(all_values)
        min_val = min(all_values)
        range_val = max_val - min_val if max_val != min_val else 1
        for frame in result:
            for key in frame["notes"]:
                frame["notes"][key] = round((frame["notes"][key] - min_val) / range_val, 4)

    # JSON出力
    output_json_path = f"../public/fft/{input_audio_path}_fft.json"
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, separators=(",", ":"))

    print(f"出力完了: {output_json_path}")
