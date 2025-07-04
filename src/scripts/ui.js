/**
 * UI管理モジュール
 * ユーザーインターフェースの初期化、イベント処理、画面リサイズ、ボタン制御を管理する
 */

import { SONGS } from "./musicList.js";
import { setSong, playSong, pauseSong, isPlaying } from "./player.js";
import { initializeFFTData, handleStarClick, createConstellation, displayConstellations, defaultConstellationName, clearCurrentConstellation, currentStarLines, currentConstellationName } from "./starManager.js";
import { isCreateConstellationEffect } from "./effectManger.js";

/**
 * ビューポートの高さを設定する
 * モバイル端末でのビューポート高さの問題を解決するためのカスタムプロパティを設定
 */
function setViewportHeight() {
  // ビューポートの実際の高さを取得
  const vh = window.innerHeight * 0.01;
  // CSSカスタムプロパティとして設定
  document.documentElement.style.setProperty("--vh", `${vh}px`);
  document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`);
}

/**
 * UIの初期設定を行う
 * イベントリスナーの登録、キャンバスクリック処理の登録、ボタン処理の設定を行う
 */
export function initUI() {
  // ビューポート設定を初期化
  setViewportHeight();

  // リサイズとオリエンテーション変更時にビューポートを更新
  window.addEventListener("resize", setViewportHeight);
  window.addEventListener("orientationchange", setViewportHeight);

  // 画面サイズの取得とアプリのリサイズを登録
  window.addEventListener("load", resizeApp);
  window.addEventListener("resize", resizeApp);

  // star-canvasクリック時にhandleStarClickを呼び出す
  const canvas = document.getElementById("star-canvas");
  if (canvas) {
    canvas.addEventListener("click", (e) => {
      // クリック位置を取得
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      handleStarClick(x, y);
    });
  }

  // 星座の初期化をする処理の登録
  const clearConstellationBtn = document.getElementById("clear-constellation-btn");
  if (clearConstellationBtn) {
    clearConstellationBtn.addEventListener("click", () => {
      clearCurrentConstellation();
    });
  }

  // 星を作る処理の登録
  const createBtn = document.getElementById("create-constellation-btn");
  if (createBtn) {
    createBtn.addEventListener("click", () => {
      createConstellation();
    });
  }

  // 再生処理の登録
  const playBtn = document.getElementById("play-pause-btn");
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      if (isPlaying()) {
        pauseSong();
      } else {
        playSong();
      }
    });
  }

  // 再生/一時停止の状態に応じてボタンの表示を更新
  document.addEventListener("player:play", () => {
    const btn = document.getElementById("play-pause-btn");
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-pause"></i>'; // 再生中 → 一時停止アイコン
    }

    // 再生時に星座が完成していたら、「星座にする」ボタンを有効化
    enableCreateConstellationButton();
    // 再生時に「クリア」ボタンを有効化
    enableClearConstellationButton();
  });

  document.addEventListener("player:pause", () => {
    const btn = document.getElementById("play-pause-btn");
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-play"></i>'; // 停止中 → 再生アイコン
    }

    // 一時停止時に「星座にする」ボタンを無効化
    disableCreateConstellationButton();
    // 一時停止時に「クリア」ボタンを無効化
    disableClearConstellationButton();
  });

  // CustomEvent("player:ended")のリスナー登録
  document.addEventListener("player:ended", () => {
    displayConstellations();
  });

  // クレジット画面に楽曲リストを表示
  renderSongCredits();

  // 表示をリセット
  resetUI();
}

/**
 * UIの表示をリセットする
 * 星座名、歌詞表示をデフォルト状態に戻す
 */
export function resetUI() {
  setViewportHeight();
  // 表示をクリア
  document.getElementById("constellation-name").textContent = defaultConstellationName;
  adjustFontSizeToFit(document.getElementById("constellation-name"));
  document.getElementById("lyrics-prev").innerHTML = "";
  document.getElementById("lyrics-current").innerHTML = "";
}

/**
 * 「星座にする」ボタンを有効化する
 * 星座名と星の線が存在し、エフェクト実行中でない場合のみ有効化
 */
export function enableCreateConstellationButton() {
  const createBtn = document.getElementById("create-constellation-btn");
  if (createBtn && currentConstellationName && currentStarLines.length !== 0 && !isCreateConstellationEffect) {
    createBtn.classList.remove("disabled");
    createBtn.disabled = false;
  }
}

/**
 * 「星座にする」ボタンを無効化する
 */
export function disableCreateConstellationButton() {
  const createBtn = document.getElementById("create-constellation-btn");
  if (createBtn) {
    createBtn.classList.add("disabled");
    createBtn.disabled = true;
  }
}

/**
 * 「クリア」ボタンを有効化する
 * エフェクト実行中でない場合のみ有効化
 */
export function enableClearConstellationButton() {
  const clearBtn = document.getElementById("clear-constellation-btn");
  if (clearBtn && !isCreateConstellationEffect) {
    clearBtn.classList.remove("disabled");
    clearBtn.disabled = false;
  }
}

/**
 * 「クリア」ボタンを無効化する
 */
export function disableClearConstellationButton() {
  const clearBtn = document.getElementById("clear-constellation-btn");
  if (clearBtn) {
    clearBtn.classList.add("disabled");
    clearBtn.disabled = true;
  }
}

/**
 * 楽曲リストを画面に表示する
 * 楽曲選択画面で使用される楽曲一覧を動的に生成
 */
export function renderSongList() {
  const songList = document.getElementById("song-list");
  if (!songList) return;
  songList.innerHTML = "";

  // オーバーフロー処理を追加
  songList.style.overflowY = "auto";

  // app-containerから高さを取得
  // song-listはこの時点で表示されていないため、高さを取得できない
  const appContainer = document.getElementById("app-container");
  const songListHeight = appContainer ? appContainer.offsetHeight * 0.8 : 100;

  // ダミーからクラス名を取得
  const dummyLi = document.getElementById("dummy-song-li");
  const liClass = dummyLi ? dummyLi.className : "";
  const dummyTitle = document.getElementById("dummy-song-title");
  const titleClass = dummyTitle ? dummyTitle.className : "";
  const dummyArtist = document.getElementById("dummy-song-artist");
  const artistClass = dummyArtist ? dummyArtist.className : "";
  // 文字サイズを作成
  const titleSize = songListHeight > 0 ? songListHeight / 25 : 24; // 高さに応じてタイトルのサイズを決定
  const artistSize = songListHeight > 0 ? songListHeight / 40 : 16;

  SONGS.forEach((song, idx) => {
    const li = document.createElement("li");
    li.className = liClass;

    // タイトルを1行目に大きく表示
    const titleElement = document.createElement("div");
    titleElement.className = titleClass;
    titleElement.style.fontSize = `${titleSize}px`;
    titleElement.textContent =  `${song.title}`;

    // アーティストを2行目に小さめに表示
    const artistElement = document.createElement("div");
    artistElement.className = artistClass;
    artistElement.style.fontSize = `${artistSize}px`;
    artistElement.textContent = `${song.artist} さん`;

    // 両方の要素をliに追加
    li.appendChild(titleElement);
    li.appendChild(artistElement);

    li.dataset.songIndex = idx;
    li.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("song:selected"));
      // 曲選択時にsetSongを呼ぶ
      setSong(song);
      // 曲タイトルを再生画面に反映
      const titleElem = document.getElementById("song-title");
      if (titleElem) titleElem.textContent = song.title;
      // 終了画面に曲タイトルを反映
      const endTitleElem = document.getElementById("end-title");
      if (endTitleElem) {
        endTitleElem.innerHTML = `あなたが${song.title}<br>から見つけた星座`;
        endTitleElem.style.fontSize = "1rem";
      }
      // 対応するfftDataを読み込み
      initializeFFTData(song.analyze);
    });
    songList.appendChild(li);
  });
}

/**
 * 終了画面のタイトルを消去する
 */
export function clearEndTitle() {
  const endTitleElem = document.getElementById("end-title");
  if (endTitleElem) endTitleElem.innerHTML = "";
}

/**
 * 要素のフォントサイズを内容に合わせて調整する
 * テキストが要素からはみ出さないよう自動調整
 * @param {HTMLElement} element - フォントサイズを調整する要素
 * @param {number} [fontSize=3] - 初期フォントサイズ（vh単位）
 */
export function adjustFontSizeToFit(element, fontSize = 3) {
  const minSize = 0.1;

  element.style.fontSize = `${fontSize}vh`;
  element.style.lineHeight = "1.2";

  const lineHeight = parseFloat(getComputedStyle(element).lineHeight);

  while (element.offsetHeight > lineHeight * 1.2 && fontSize > minSize) {
    fontSize -= 0.2;
    element.style.fontSize = `${fontSize}vh`;
  }
}


/**
 * アプリケーション全体のサイズを調整する
 * 9:16のアスペクト比を保ちながら画面サイズに合わせてリサイズ
 * リサイズが必要な要素のサイズを更新
 */
function resizeApp() {
  const container = document.getElementById("app-container");
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // 画面サイズに合わせて、9:16を保ちつつ最大サイズを決定
  const targetRatio = 9 / 16;
  let width = windowWidth;
  let height = width / targetRatio;

  if (height > windowHeight) {
    height = windowHeight;
    width = height * targetRatio;
  }

  // サイズと位置を適用
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.left = `${(windowWidth - width) / 2}px`;
  container.style.top = `${(windowHeight - height) / 2}px`;

  // キャンバスのリサイズ処理
  const canvas = document.getElementById("star-canvas");
  if (canvas) {
    // CSS上の表示サイズを取得
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    // 表示サイズが有効な値の場合のみ内部サイズを更新
    if (displayWidth > 0 && displayHeight > 0) {
      // キャンバスの内部サイズを表示サイズに合わせる
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }
  }

  // 曲リストの表示
  renderSongList();
}

/**
 * ローディングオーバーレイを表示する
 */
export function showLoading() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) overlay.classList.add("visible");
}

/**
 * ローディングオーバーレイを非表示にする
 */
export function hideLoading() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) overlay.classList.remove("visible");
}

/**
 * クレジット画面に楽曲リストを表示する
 * 使用楽曲の情報をクレジット画面に動的に挿入
 */
export function renderSongCredits() {
  const creditsContainer = document.getElementById("song-credits-container");
  if (!creditsContainer) return;

  // 楽曲情報をHTMLで構築
  let songsHtml = "";
  SONGS.forEach((song) => {
    songsHtml += `<p class="mb-1">「${song.title}」 ${song.artist} さん</p>`;
  });

  creditsContainer.innerHTML = songsHtml;
}
