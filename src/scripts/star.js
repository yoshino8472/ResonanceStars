/**
 * 星を表すクラス
 * 画面上の星の位置、表示、音階情報、状態を管理する
 */
export class Star {
  /**
   * 星のコンストラクタ
   * @param {Object} params - 星の初期化パラメータ
   * @param {number} params.xRatio - 画面幅に対する相対的なX座標（0-1の範囲）
   * @param {number} params.yRatio - 画面高さに対する相対的なY座標（0-1の範囲）
   * @param {string} params.note - 音階情報（例: "n52"）
   * @param {number} [params.opacity=1.0] - 星の透明度（0-1の範囲）
   * @param {string} [params.color="#fff"] - 星の色（CSS色表記）
   */
  constructor({ xRatio, yRatio, note, opacity = 1.0, color = "#fff" }) {
    // 位置と描画
    this.xRatio = xRatio;
    this.yRatio = yRatio;
    this.opacity = opacity;
    this.color = color;

    // 音階情報
    this.note = note;

    // 状態管理
    this.isClicked = false; // クリックされたかどうか
    this.isVisible = false; // 星が表示されているかどうか
  }

  /**
   * 星をキャンバスに描画する
   * @param {CanvasRenderingContext2D} ctx - 描画対象のキャンバスコンテキスト
   */
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;

    // 星の中心座標とサイズ
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const x = this.xRatio * width;
    const y = this.yRatio * height;
    const r = width / 300;

    // 星本体（白い円）
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 4;
    ctx.fill();

    // 星の影
    ctx.beginPath();
    ctx.arc(x, y, r * 2, 0, 2.5 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.shadowColor = "transparent";
    ctx.fill();

    ctx.restore();
  }

  /**
   * 星を強調表示する
   * 星を円で囲み、時間ベースのアニメーションで変化させる
   * @param {CanvasRenderingContext2D} ctx - 描画対象のキャンバスコンテキスト
   */
  highlight(ctx) {
    // 星の中心座標とサイズ
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const x = this.xRatio * width;
    const y = this.yRatio * height;
    const r = width / 70;

    // 時間ベースのアニメーション用
    const time = performance.now() / 1000;

    ctx.save();

    // 光のサイズを時間で変化させる
    const glowRadius = r * (1.2 + Math.sin(time * 2) * 0.2);
    const glow = ctx.createRadialGradient(
      x, y, r * 0.2,
      x, y, glowRadius
    );

    // 時間変化するカラー
    const hue = (time * 15) % 360;
    glow.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.7)`);
    glow.addColorStop(0.7, `hsla(${hue}, 100%, 70%, 0.3)`);
    glow.addColorStop(1, `hsla(${hue}, 100%, 70%, 0)`);

    // 円のサイズを時間で変化させる
    const pulseSize = r * (1.5 + Math.sin(time * 3) * 0.2);

    ctx.beginPath();
    ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
    ctx.lineWidth = width / 600;
    ctx.strokeStyle = `hsla(${hue}, 100%, 80%, 0.6)`;

    // ぼかし効果を追加
    ctx.shadowBlur = width / 200;
    ctx.shadowColor = `hsla(${hue}, 100%, 80%, 0.8)`;

    ctx.stroke();

    ctx.restore();
  }
}
