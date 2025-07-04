/**
 * TextAlive Player管理モジュール
 * 楽曲の再生、一時停止、歌詞表示、星の更新を制御する
 */

// TextAlive処理
import { Player } from "textalive-app-api";

// 他のモジュールからのインポート
import { showLoading, hideLoading, enableClearConstellationButton, resetUI } from "./ui.js";
import { updateLyrics } from "./lyric.js";
import { updateStars, isFFTDataLoading } from "./starManager.js";
import { textAliveConfig } from "../config/config.js";

/**
 * TextAlive Playerインスタンスをグローバルに保持
 * @type {Player|null}
 */
let player = null;

/**
 * 再生が終了したかどうかのフラグ
 * @type {boolean}
 */
let ended = false;

/**
 * 再生開始時刻(終了判定の誤検知防止に使用)
 * @type {Date|null}
 */
let playBackStartedAt = null;

/**
 * 再生開始を確認するための最小再生時間
 * 10秒未満での終了は無視する
 * @type {number}
 */
const MIN__PLAYBACK_TIME = 10000; // 10秒（ミリ秒）

/**
 * 最後に表示したフレーズを保持
 * @type {Object|null}
 */
let lastPhrase = null;

/**
 * 何ミリ秒先の歌詞を読み込むか
 * @type {number}
 */
const PHRASE_PREVIEW_MS = 150;

/**
 * TextAlive Playerを初期化する
 * イベントリスナーの登録と各種設定を行う
 */
export function initPlayer() {
  if (!player) {
    player = new Player({
      app: { token: textAliveConfig.token },
      mediaElement: document.querySelector("#media")
    });

    player.volume = 60; // 音量を設定
    player.addListener({
      onAppReady: (app) => {
        // 初期化時の処理
        if (app.managed) {
          console.error("このアプリはTextAliveホストに対応していません");
          // エラーメッセージを表示
          displayHostErrorMessage();
        }
        // 選曲ボタンを活性化
        const selectBtn = document.getElementById("song-list");
        if (selectBtn) selectBtn.disabled = false;
      },
      onTimerReady: () => {
        // 動画を再生するための Timer の準備が整ったときに呼ばれる
        // 再生ボタンを活性化
        const playBtn = document.getElementById("playBtn");
        if (playBtn) playBtn.disabled = false;
        // クリアボタンを活性化
        enableClearConstellationButton();

        // FFTデータのロードが完了するまで待機
        const fftLoadPromise = isFFTDataLoading();
        if (fftLoadPromise) {
          fftLoadPromise
            .then(() => {
              // ローディングオーバーレイを非表示
              hideLoading();
              // 楽曲を再生開始
              playSong();
              // 再生開始時刻を記録
              playBackStartedAt = Date.now();
            });
        }
      },

      onPlay: () => {
        // 再生開始時の処理
        document.dispatchEvent(new CustomEvent("player:play"));
      },

      onPause: () => {
        // 一時停止時の処理
        document.dispatchEvent(new CustomEvent("player:pause"));
      },

      onTimeUpdate: (position) => {
        // 再生終了をチェック
        if (!player.video || ended) return;
        // 終了判定が上手くいかないことがあるため、曲の長さ - 0.5秒 で終了判定
        // 楽曲再生開始直後にposition === player.video.durationとなることがあるため、
        // 再生開始からの経過時間を確認
        const elapsed = Date.now() - playBackStartedAt;
        if (position >= player.video.duration - 500 && elapsed >= MIN__PLAYBACK_TIME) {
          ended = true;
          document.dispatchEvent(new CustomEvent("player:ended"));
          return;
        }
        // シークバーの更新
        updateSeekBar(position);
        // 歌詞の更新
        updateCurrentPhrase(position);
        // 星の描画を更新
        updateStars(position, player.findChord(position));
      }
    });
  }

  // 変数を初期化
  ended = false;
}

/**
 * 曲URLをセットして楽曲を読み込む
 * @param {Object} song - 楽曲オブジェクト
 * @param {string} song.url - 楽曲のURL
 * @param {number} song.beatId - ビートID
 * @param {number} song.chordId - コードID
 * @param {number} song.repetitiveSegmentId - 繰り返し区間のID
 * @param {number} song.lyricId - 歌詞ID
 * @param {number} song.lyricDiffId - 歌詞差分ID
 */
export function setSong(song) {
  if (!player) return;
  // ローディングオーバーレイ表示
  showLoading();
  // 表示をリセット
  resetUI();

  player.createFromSongUrl(song.url, {
    video: {
      // 音楽地図訂正
      beatId: song.beatId,
      chordId: song.chordId,
      repetitiveSegmentId: song.repetitiveSegmentId,
      lyricId: song.lyricId,
      lyricDiffId: song.lyricDiffId
    }
  });
  // 曲が変更されたので終了フラグをリセット
  ended = false;
}

/**
 * 楽曲を再生する
 */
export function playSong() {
  if (!player) return;
  player.requestPlay();
}

/**
 * 楽曲を一時停止する
 */
export function pauseSong() {
  if (player) player.requestPause();
}

/**
 * 楽曲を停止する
 */
export function stopSong() {
  if (player) player.requestStop();
}

/**
 * 楽曲が再生中かどうかを取得する
 * @returns {boolean} 再生中の場合true
 */
export function isPlaying() {
  return player ? player.isPlaying : false;
}

/**
 * シークバーの表示を現在の再生位置に更新する
 * @param {number} position - 現在の再生位置（ミリ秒）
 */
export function updateSeekBar(position) {
  if (!player || !player.video) return;
  const seekBar = document.getElementById("seek-bar");
  if (seekBar) {
    seekBar.value = position;
    seekBar.max = player.video.duration;
  }
}

/**
 * 現在の再生位置に応じて歌詞を更新する
 * プレビュー機能により少し先の歌詞を表示する
 * @param {number} position - 現在の再生位置（ミリ秒）
 */
export function updateCurrentPhrase(position) {
  if (!player.video) return;

  // 現在位置とプレビュー位置での歌詞を取得
  const currentPhrase = player.video.findPhrase(position);
  const previewPhrase = player.video.findPhrase(position + PHRASE_PREVIEW_MS);

  // 表示すべき歌詞を決定（プレビュー優先）
  const phraseToShow = previewPhrase || currentPhrase;

  // 表示すべき歌詞がなかったり、前回と同じなら何もしない
  if (!phraseToShow || phraseToShow === lastPhrase) return;

  // 新しい歌詞を取得した
  lastPhrase = phraseToShow;

  // 歌詞を表示
  updateLyrics(phraseToShow);
}

/**
 * TextAliveホスト利用時のエラーメッセージを表示する
 * ホスト環境では動作しないことをユーザーに通知する
 */
function displayHostErrorMessage() {
  const errorMessage = document.getElementById("error-message");
  if (errorMessage) {
    errorMessage.classList.remove("hidden");
  }
}
