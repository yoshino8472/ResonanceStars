/**
 * 星と星座の管理を行うモジュール
 * 星の描画、クリック処理、星座の作成・表示を管理する
 */

import { Star } from "./star.js";
import { StarLine } from "./starLine.js";
import { Constellation } from "./constellation.js";
import { fetchFFTData } from "./fftLoader.js";
import { enableCreateConstellationButton, disableCreateConstellationButton, enableClearConstellationButton, disableClearConstellationButton, clearEndTitle, adjustFontSizeToFit } from "./ui.js";
import { effects, createConstellationEffect, constellationEffects } from "./effectManger.js";

/**
 * メインキャンバス要素
 * @type {HTMLCanvasElement|null}
 */
export let canvas = null;

/**
 * メインキャンバスの2Dコンテキスト
 * @type {CanvasRenderingContext2D|null}
 */
export let ctx = null;

/**
 * 現在表示されている星の配列
 * @type {Star[]}
 */
export let currentStars = [];

/**
 * FFTデータ（音響解析データ）
 * @type {Array}
 */
let fftData = [];

/**
 * FFTデータ読み込み中のPromise
 * @type {Promise|null}
 */
let currentFFTLoadPromise = null;

/**
 * 現在選択中の星
 * @type {Star|null}
 */
export let currentSelectedStar = null;

/**
 * 現在描画されている星をつなぐ線の配列
 * @type {StarLine[]}
 */
export let currentStarLines = [];

/**
 * 作成済み星座の配列
 * @type {Constellation[]}
 */
let createdConstellations = [];

/**
 * 星の配置の行数
 * @type {number}
 */
const ROWS = 5;

/**
 * 星の配置の列数
 * @type {number}
 */
const COLS = 12;

/**
 * デフォルトの星座名表示テキスト
 * @type {string}
 */
export const defaultConstellationName = "歌詞をクリックしてね！";

/**
 * 現在設定されている星座名
 * @type {string}
 */
export let currentConstellationName = "";

/**
 * 星がクリック可能かどうかのフラグ
 * @type {boolean}
 */
let isStarClickable = true;

/**
 * FFTデータを読み込む
 * @param {string} id - FFTファイルのID
 * @returns {Promise<boolean>} 読み込み完了時にtrueを返すPromise
 */
export async function initializeFFTData(id) {
  currentFFTLoadPromise = fetchFFTData(id).then(data => {
    fftData = data;
    return true;
  }).catch(error => {
    console.error("データファイルの読み込み中にエラーが発生しました。:", error);
    currentFFTLoadPromise = null;
    throw error;
  });
  return currentFFTLoadPromise;
}

/**
 * FFTデータが読み込み中かどうかを確認する
 * @returns {Promise|null} 読み込み中のPromise、または読み込み完了時にnull
 */
export function isFFTDataLoading() { return currentFFTLoadPromise; }

/**
 * 星管理システムを初期化する
 * キャンバスの設定、星の配置、イベントリスナーの登録を行う
 */
export function initStarManager() {
  canvas = document.getElementById("star-canvas");
  if (!canvas) return;
  ctx = canvas.getContext("2d");
  const width = canvas.clientWidth, height = canvas.clientHeight;
  canvas.width = width; canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  currentStars = [], currentStarLines = [], currentSelectedStar = null, createdConstellations = [];
  let noteNumber = 48;
  for (let row = ROWS - 1; row >= 0; row--) {
    for (let col = 0; col < COLS; col++) {
      let x = ((col + 0.5) * width) / COLS, y = ((row + 0.5) * height) / ROWS;
      x += (Math.random() * 0.6 - 0.3) * (width / COLS);
      y += (Math.random() * 0.6 - 0.3) * (height / ROWS);
      const note = `n${noteNumber++}`;
      const star = new Star({ xRatio: x / width, yRatio: y / height, note, createdAt: performance.now() });
      star.isVisible = true; star.opacity = 0.0; star.draw(ctx);
      currentStars.push(star);
    }
  }
  document.addEventListener("player:pause", () => { isStarClickable = false; });
  document.addEventListener("player:play", () => { isStarClickable = true; });
}

/**
 * 星の描画を更新する
 * FFTデータとコード進行に基づいて星の表示状態を更新し、エフェクトを描画する
 * @param {number} position - 現在の再生位置（ミリ秒）
 * @param {Object} chord - 現在のコード情報
 * @param {string} chord.name - コード名
 */
export function updateStars(position, chord) {
  if (!ctx) return;

  let fftEntry = null;
  if (fftData && fftData.length > 0) {
    const fps = 60;
    let frameIndex = Math.floor(position / 1000 * fps);
    frameIndex = Math.max(0, Math.min(frameIndex, fftData.length - 1));
    fftEntry = fftData[frameIndex];
  }
  if (!fftEntry) return;
  let topNotes = [];
  if (fftEntry.notes) {
    const volume = fftEntry.volume || 0;
    const n = Math.floor(volume / 5);
    topNotes = Object.entries(fftEntry.notes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([note]) => note);

    // 最も強いノートを取得
    const strongestNote = topNotes.length > 0 ? topNotes[0] : null;

    // コードから星の色を決定
    let color = "#fff"; // デフォルトの色
    if (chord.name.includes("m")) color = "#87ceeb";
    if (chord.name.includes("7")) color = "#ffd700";
    if (chord.name.includes("dim")) color = "#AA66FF";

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const star of currentStars) {
      if (constellationEffects.length > 0) {
        // constellationEffectsが存在する場合は全星を徐々にフェードアウト
        if (star.isVisible) {
          star.opacity -= 0.03;
          if (star.opacity < 0) { star.opacity = 0; star.isVisible = false; }
          star.isClicked = false;
        }
      } else {
        // 星がクリックされている場合はその星を描画
        if (star.isClicked) { star.draw(ctx); continue; }
        const note = star.note;
        if (topNotes.includes(note)) {
          star.opacity = fftEntry.notes[note] ?? 1.0;
          if (strongestNote === note) {
            star.color = color;
          } else {
            // 他の星はデフォルトの色に戻す
            star.color = "#fff";
          }
          star.isVisible = true;
        } else {
          star.opacity -= 0.02;
          if (star.opacity < 0) { star.opacity = 0; star.isVisible = false; }
        }
      }
      star.draw(ctx);
    }
  }
  if (currentSelectedStar && constellationEffects.length === 0) currentSelectedStar.highlight(ctx);
  if (constellationEffects.length === 0) currentStarLines.forEach(line => line.draw(ctx));
  effects.drawTapEffects(ctx);
  effects.drawConstellationEffects(ctx);
}

/**
 * 星がクリックされたときの処理を行う
 * クリック位置から最寄りの星を特定し、選択状態の切り替えや線の描画を行う
 * @param {number} x - クリック位置のX座標
 * @param {number} y - クリック位置のY座標
 */
export function handleStarClick(x, y) {
  if (!currentStars.length || !ctx || !isStarClickable) {
    return;
  }
  const width = canvas.width, height = canvas.height;
  let minDist = Infinity, clickedStar = null;
  // クリックされた位置から最も近い星を探す
  for (const star of currentStars) {
    if (!star.isVisible) continue;
    const dx = (star.xRatio * width) - x, dy = (star.yRatio * height) - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < canvas.width / COLS && dist < minDist) { minDist = dist; clickedStar = star; }
  }
  // クリックされた星があれば処理を行う
  if (clickedStar) {
    clickedStar.isClicked = true;
    if (!currentSelectedStar) {
      // 現在選択中の星がなければ、選択中にする
      currentSelectedStar = clickedStar;
    } else {
      // 既に選択中の星のnotesが、clicedStarのnotesと同じならば何もしない
      if (currentSelectedStar.note === clickedStar.note) return;
      // 星座の線の個数が上限に達している場合は、星の選択を解除
      if (currentStarLines.length >= 100) {
        const constellationNameElement = document.getElementById("constellation-name");
        constellationNameElement.textContent = "線の数が多すぎます！";
        adjustFontSizeToFit(constellationNameElement);
        currentSelectedStar.isClicked = false;
        currentSelectedStar = null;
        return;
      }
      // 既に選択中の星があれば、選択中の星と線でつなぐ
      currentStarLines.push(new StarLine(currentSelectedStar, clickedStar));
      currentSelectedStar = null;
    }
    effects.createTapEffect(clickedStar.xRatio * width, clickedStar.yRatio * height);
  }

  // 星座が完成していたら、「星座にする」ボタンを有効化
  enableCreateConstellationButton();
}

/**
 * 星座の名前を設定する
 * @param {string} name - 設定する星座名（「座」は自動で付加される）
 * @returns {string} 設定された完全な星座名
 */
export function setConstellationName(name) {
  currentConstellationName = `${name}座`;
  // 星座が完成していたら、「星座にする」ボタンを有効化
  enableCreateConstellationButton();
  return currentConstellationName;
}

/**
 * 現在の星座を作成して保存する
 * 作成した星座を配列に追加し、星座エフェクトを表示する
 */
export function createConstellation() {
  const constellationNameElement = document.getElementById("constellation-name");
  if (!currentConstellationName || currentStarLines.length === 0) return;
  if (createdConstellations.length > 30) {
    constellationNameElement.textContent = "星座の数が多すぎます！";
    adjustFontSizeToFit(constellationNameElement);
    return;
  }

  // Constellationクラスを使用して星座を作成
  const constellation = new Constellation(
    currentConstellationName,
    [...currentStarLines],
    currentStars.map(star => new Star({
      xRatio: star.xRatio,
      yRatio: star.yRatio,
      note: star.note,
      opacity: star.opacity,
      color: star.color
    }))
  );

  // 星座が有効かチェック
  if (!constellation.isValid()) {
    return;
  }

  createdConstellations.push(constellation);

  createConstellationEffect();

  currentSelectedStar = null;
  currentStars.forEach(star => { star.isClicked = false; });
  constellationNameElement.textContent = defaultConstellationName;
  adjustFontSizeToFit(constellationNameElement);
  currentConstellationName = "";
  // 「星座にする」ボタン、「クリア」ボタンを無効化
  disableCreateConstellationButton();
  disableClearConstellationButton();
}

/**
 * 現在作成中の星座をクリアする
 * 線と選択状態をリセットし、ボタンの状態を更新する
 */
export function clearCurrentConstellation() {
  currentStarLines = [];
  currentSelectedStar = null;
  currentStars.forEach(star => { star.isClicked = false; });
  //「星座にする」ボタンを無効化
  disableCreateConstellationButton();
}

/**
 * 星座作成エフェクト終了時に呼び出される関数
 * 星座線をクリアし、ボタンの状態を更新する
 */
export function clearConstellationEffects() {
  // 現在の星座線をクリア
  currentStarLines = [];
  // 「クリア」ボタンを有効化
  enableClearConstellationButton();
}

/**
 * 作成済みの星座を一覧表示する
 * 終了画面で星座の一覧をキャンバス付きで表示する
 */
export function displayConstellations() {
  const container = document.getElementById("constellation-container");
  const list = document.getElementById("constellation-list");
  if (!list) return;

  // スクロール位置を一番上にリセット
  container.scrollTop = 0;
  list.scrollTop = 0;

  list.innerHTML = "";

  if (createdConstellations.length >= 2) {
    container.style.overflowY = "auto";
    container.style.maxHeight = "80%";
    container.style.width = "100%";
  } else {
    container.style.overflowY = "";
    container.style.height = "80%";
    container.style.width = "100%";
    list.style.height = "100%";
  }
  if (createdConstellations.length === 0) {
    const wrapper = document.createElement("div");
    wrapper.className = "no-constellations-message";

    const message = document.createElement("div");
    message.textContent = "遊んでくれてありがとう！";
    message.className = "no-constellations-text";

    const mikuImage = document.createElement("img");
    mikuImage.src = "./assets/miku_smile.png";
    mikuImage.alt = "ミク";
    mikuImage.className = "no-constellations-image";

    wrapper.appendChild(message);
    wrapper.appendChild(mikuImage);
    list.appendChild(wrapper);
    clearEndTitle();
    return;
  }
  createdConstellations.forEach((constellation) => {
    const wrapper = document.createElement("div");
    wrapper.className = "constellation-card";

    // canvasコンテナ（アスペクト比を保持するため）
    const canvasContainer = document.createElement("div");
    canvasContainer.className = "constellation-canvas-container";

    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    canvas.className = "constellation-canvas";

    canvasContainer.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    // Constellationクラスのdrawメソッドを使用
    constellation.draw(ctx);

    const nameDiv = document.createElement("div");
    nameDiv.textContent = constellation.name;
    nameDiv.className = "constellation-name";

    wrapper.appendChild(canvasContainer);
    wrapper.appendChild(nameDiv);
    list.appendChild(wrapper);
  });
}
