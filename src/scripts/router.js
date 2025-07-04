/**
 * 画面遷移とルーティングを管理するモジュール
 * 各画面間の遷移制御とイベントハンドラーの登録を行う
 */

import { restartApp } from "./main.js";
import { pauseSong } from "./player.js";
import { initStarManager } from "./starManager.js";

/**
 * 画面遷移の追跡用の変数
 * 前の画面のIDを保持し、戻るボタンで使用する
 * @type {string}
 */
let previousScreen = "select-screen"; // デフォルトは選択画面

/**
 * 指定されたIDの画面に遷移する
 * アクティブクラスの切り替えと前画面の記憶を行う
 * @param {string} id - 遷移先の画面要素のID
 */
export function showScreen(id) {
  // 現在のアクティブな画面を記憶
  const currentScreen = document.querySelector(".screen.active");
  if (currentScreen && (id === "howto-screen" || id === "credits-screen")) {
    previousScreen = currentScreen.id;
  }

  // すべての.screenからactiveを外す
  document.querySelectorAll(".screen").forEach(el => {
    el.classList.remove("active");
  });

  // 指定IDの要素にactiveを付与
  const target = document.getElementById(id);
  if (target) target.classList.add("active");
}

/**
 * 画面遷移のイベントリスナーを初期化する
 * 各ボタンやカスタムイベントに遷移処理を登録する
 */
export function initRouter() {
  // タイトル→選択
  document.getElementById("go-to-select")?.addEventListener("click", () => {
    showScreen("select-screen");
  });

  // 選択→遊び方
  document.getElementById("go-to-howto")?.addEventListener("click", () => {
    showScreen("howto-screen");
  });

  // 曲再生画面→遊び方
  document.getElementById("play-go-to-howto")?.addEventListener("click", () => {
    pauseSong(); // 曲を一時停止してから画面遷移
    showScreen("howto-screen");
  });

  // 遊び方→前の画面
  document.getElementById("go-back-select")?.addEventListener("click", () => {
    showScreen(previousScreen);
  });

  // 曲選択→再生（例: song-listのliクリックで遷移する場合）
  document.addEventListener("song:selected", () => {
    showScreen("play-screen");
    // 星の管理を初期化(このタイミングで行わないと、canvasのサイズが取得できない)
    initStarManager();
  });

  // 楽曲再生終了時に終了画面を表示
  document.addEventListener("player:ended", () => {
    showScreen("end-screen");
  });

  // 終了→タイトル（例: restart-buttonで遷移）
  document.getElementById("restart-button")?.addEventListener("click", () => {
    showScreen("title-screen");
    // アプリをリスタート
    restartApp();
  });

  // クレジット画面を表示
  document.getElementById("show-credits")?.addEventListener("click", (e) => {
    e.preventDefault();
    showScreen("credits-screen");
  });

  // クレジット画面から戻る
  document.getElementById("credits-back")?.addEventListener("click", () => {
    showScreen(previousScreen);
  });
}
