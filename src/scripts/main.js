/**
 * メインアプリケーションモジュール
 * アプリケーションの起動処理、初期化、再起動を管理する
 */

// 起動処理、初期化
import { initRouter } from "./router.js";
import { initUI, resetUI } from "./ui.js";
import { initPlayer } from "./player.js";


/**
 * アプリケーションを初期化する
 * TextAlive Player、ルーター、UIの初期化を順次実行する
 */
export function initApp() {
  // TextAlive Player 初期化
  initPlayer();
  // 画面遷移の準備（ハンドラ登録など）
  initRouter();
  // UIの初期化、曲選択画面等の作成
  initUI();
}

/**
 * アプリケーションを再起動する
 * 必要なモジュールの再初期化を行う
 */
export function restartApp() {
  // 必要なモジュールの再初期化
  resetUI();
}

// DOMが読み込まれたら開始
window.addEventListener("DOMContentLoaded", initApp);
