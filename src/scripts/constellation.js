/**
 * 星座を表すクラス
 * 星座の名前、線、星の情報を管理する
 */
export class Constellation {
  /**
   * 星座のコンストラクタ
   * @param {string} name - 星座の名前
   * @param {Array} starLines - StarLinesインスタンスの配列（星座の線を構成する）
   * @param {Array} stars - Starインスタンスの配列（星座を構成する星）
   */
  constructor(name, starLines = [], stars = []) {
    this.name = name;
    this.starLines = starLines;
    this.stars = stars;
    this.createdAt = Date.now();
  }

  /**
   * 星座をキャンバスに描画する
   * @param {CanvasRenderingContext2D} ctx - 描画対象のキャンバスコンテキスト
   */
  draw(ctx) {
    // 星を描画
    this.stars.forEach(star => star.draw(ctx));

    // 線を描画
    this.starLines.forEach(line => line.draw(ctx));
  }

  /**
   * 星座が有効かどうかを判定する（線があり、名前が設定されている）
   * @returns {boolean} 有効な星座かどうか
   */
  isValid() {
    return this.starLines.length > 0 && this.name && this.name.trim() !== "";
  }

  /**
   * 星座に使用されている星の数を取得する
   * @returns {number} クリックされた星の数
   */
  getStarCount() {
    return this.stars.filter(star => star.isClicked).length;
  }

  /**
   * 星座の複製を作成する
   * @returns {Constellation} 複製された星座
   */
  clone() {
    return new Constellation(
      this.name,
      [...this.starLines],
      this.stars.map(star => ({ ...star }))
    );
  }

  /**
   * 星座をJSON形式でシリアライズする
   * @returns {Object} シリアライズされたデータ
   */
  serialize() {
    return {
      name: this.name,
      starLines: this.starLines.map(line => line.serialize()),
      stars: this.stars.map(star => star.serialize()),
      createdAt: this.createdAt
    };
  }

  /**
   * JSON形式のデータから星座を復元する
   * @param {Object} data - シリアライズされたデータ
   * @returns {Constellation} 復元された星座
   */
  static deserialize(data) {
    // この実装は StarLine や Star クラスにも serialize/deserialize メソッドが必要
    return new Constellation(
      data.name,
      data.starLines || [],
      data.stars || []
    );
  }
}
