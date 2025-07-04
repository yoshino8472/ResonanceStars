/**
 * 星と星をつなぐ線を表すクラス
 * 2つの星の間に線を描画し、スタイル設定を管理する
 */
export class StarLine {
  // デフォルト値
  static DEFAULT_COLOR = "#fff";
  static DEFAULT_OPACITY = 0.3;
  static DEFAULT_LINE_WIDTH = 1;
  static DEFAULT_SHADOW_BLUR = 2;

  /**
   * StarLineのコンストラクタ
   * @param {Star} star1 - 始点の星
   * @param {Star} star2 - 終点の星
   * @param {Object} [options={}] - 線のスタイル設定（オプション）
   * @param {string} [options.color] - 線の色（デフォルト: "#fff"）
   * @param {number} [options.opacity] - 線の透明度（デフォルト: 0.3）
   * @param {number} [options.lineWidth] - 線の太さ（デフォルト: 1）
   * @param {number} [options.shadowBlur] - 影のぼかし（デフォルト: 2）
   */
  constructor(star1, star2, options = {}) {
    this.star1 = star1;
    this.star2 = star2;

    // オプション設定（渡されていなければデフォルト値を使用）
    this.color = options.color || StarLine.DEFAULT_COLOR;
    this.opacity = options.opacity !== undefined ? options.opacity : StarLine.DEFAULT_OPACITY;
    this.lineWidth = options.lineWidth || StarLine.DEFAULT_LINE_WIDTH;
    this.shadowBlur = options.shadowBlur !== undefined ? options.shadowBlur : StarLine.DEFAULT_SHADOW_BLUR;
  }

  /**
   * 星同士をつなぐ線をキャンバスに描画する
   * @param {CanvasRenderingContext2D} ctx - 描画対象のキャンバスコンテキスト
   */
  draw(ctx) {
    // キャンバスのサイズから星の座標を計算
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const star1X = this.star1.xRatio * width;
    const star1Y = this.star1.yRatio * height;
    const star2X = this.star2.xRatio * width;
    const star2Y = this.star2.yRatio * height;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.beginPath();
    ctx.moveTo(star1X, star1Y);
    ctx.lineTo(star2X, star2Y);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.shadowBlur;
    ctx.stroke();
    ctx.restore();
  }
}
