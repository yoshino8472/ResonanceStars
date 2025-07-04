/**
 * 歌詞表示と星座名選択機能を管理するモジュール
 * 歌詞のアニメーション表示と、クリック可能な単語の処理を行う
 */

import { adjustFontSizeToFit } from "./ui";
import { setConstellationName } from "./starManager";

/**
 * 星座の名前として使える品詞の配列
 * TextAlive APIの品詞タグに基づいて定義
 * @type {string[]}
 */
const VALID_POS = ["N", "PN", "V", "R", "J", "A", "F", "D", "I", "U", "S", "X"];

/**
 * 歌詞を更新してアニメーション表示する
 * フェードアウト/フェードインアニメーションを適用し、
 * クリック可能な単語に星座名選択機能を追加する
 * @param {Object} phrase - TextAlive APIから取得したフレーズオブジェクト
 * @param {Object} phrase._data - フレーズの内部データ
 * @param {Array} phrase._data.words - 単語の配列
 */
export function updateLyrics(phrase) {
  const prevElem = document.getElementById("lyrics-prev");
  const currElem = document.getElementById("lyrics-current");
  const lyricsContainer = document.getElementById("lyrics");

  // アニメーション中も処理を継続するよう変更
  // アニメーション中なら更新をスキップする代わりに古いアニメーションをクリア
  if (lyricsContainer && lyricsContainer.classList.contains("lyrics-animating")) {
    // 進行中のアニメーションをキャンセル
    if (currElem) {
      currElem.classList.remove("lyrics-fade-out", "lyrics-fade-in");
    }
    if (prevElem) {
      prevElem.classList.remove("lyrics-fade-out", "lyrics-fade-in-prev");
    }
  }

  // アニメーション開始のフラグを設定
  if (lyricsContainer) {
    lyricsContainer.classList.add("lyrics-animating");
  }

  // 現在の歌詞をフェードアウト
  if (currElem) {
    currElem.classList.remove("lyrics-fade-in");
    void currElem.offsetWidth;
    currElem.classList.add("lyrics-fade-out");
  }

  // 前の歌詞もフェードアウト
  if (prevElem) {
    prevElem.classList.remove("lyrics-fade-in-prev");
    void prevElem.offsetWidth;
    prevElem.classList.add("lyrics-fade-out");
  }

  // アニメーションの時間を短縮（100ms）
  setTimeout(() => {
    // 前回の内容をコピー
    if (prevElem && currElem) {
      prevElem.innerHTML = currElem.innerHTML;
      // prevElem内のspanにもクリックイベントを付与
      Array.from(prevElem.querySelectorAll("span")).forEach(span => {
        // 言葉の品詞に応じてクリック処理を登録
        if (span.className.includes("cursor-pointer")) {
          span.addEventListener("click", () => {
            onLyricClick(span.textContent);
          });
        }
      });
    }

    if (!currElem) {
      return;
    }
    if (!phrase) {
      return;
    }

    const words = phrase._data.words;
    let prevWord = null;
    let prevWordText = "";

    // 現在の歌詞を更新
    currElem.innerHTML = "";
    currElem.classList.remove("lyrics-fade-out"); // フェードアウト解除

    // 今回のphraseのwordを1つずつspanで描画
    words.forEach((word) => {
      let text = "";

      // wordの前にスペースを付ける
      // 現在のwordの言語が日本語以外かつ、記号でもなく、かつ、前のWordが存在し、'('でない場合、
      // または、前のwordが日本語ではなく、かつ、現在のwordが日本語で、記号でもない場合
      if ((word && word.language && word.language !== "ja" && word.pos !== "S"
          && prevWordText && prevWordText !== "（" && prevWordText !== "(") ||
        (prevWord && prevWord.language && prevWord.language !== "ja"
          && word.language === "ja" && word.pos !== "S")
      ) {
        const span = document.createElement("span");
        currElem.appendChild(span);
        span.textContent = "\u00A0"; // 空白を追加
      }

      // characters配列から文字列を生成
      text += word.characters.map(c => c.char).join("");
      const span = document.createElement("span");

      // spanのテキストを設定
      span.textContent = text;

      // 言葉の品詞に応じてクリック処理を登録
      if (word.pos && VALID_POS.includes(word.pos)) {
        span.className = "cursor-pointer hover:underline";
        span.addEventListener("click", () => {
          onLyricClick(text);
        });
      }

      // wordのposをログに出力
      // console.log(`Selected word: ${text.trim()}, pos: ${word.pos}`);

      currElem.appendChild(span);

      prevWord = word;
      prevWordText = text;
    });

    // 新しい歌詞にフェードイン効果を適用
    if (currElem) {
      prevElem.classList.remove("lyrics-fade-out");
      void currElem.offsetWidth;
      currElem.classList.add("lyrics-fade-in");
    }

    // 前の歌詞にもフェードイン効果を適用
    if (prevElem) {
      prevElem.classList.remove("lyrics-fade-out");
      void prevElem.offsetWidth;
      prevElem.classList.add("lyrics-fade-in-prev");
    }

    // 文字サイズを自動調整
    if (prevElem) adjustFontSizeToFit(prevElem, 3);
    if (currElem) adjustFontSizeToFit(currElem, 3);

    // アニメーション完了後に状態をリセット
    setTimeout(() => {
      if (currElem) {
        currElem.classList.remove("lyrics-fade-in");
      }
      if (prevElem) {
        prevElem.classList.remove("lyrics-fade-in-prev");
      }
      if (lyricsContainer) {
        lyricsContainer.classList.remove("lyrics-animating");
      }
    }, 50);

  }, 50);
}

/**
 * 歌詞をクリックしたときの処理
 * クリックされた単語を星座名として設定し、
 * UI表示用のテキストを更新する
 * @param {string} text - クリックされた単語のテキスト
 */
export function onLyricClick(text) {
  // 星座名を内部的に設定
  const wordText = text.trim();
  setConstellationName(wordText);

  const selectedWordElem = document.getElementById("constellation-name");

  // UI表示用のテキストを設定
  if (selectedWordElem) {
    selectedWordElem.textContent = `「${wordText}座」を作ろう！`;
    // 文字サイズを自動調整
    adjustFontSizeToFit(selectedWordElem, 3);
  }
}
