/**
 * エフェクト管理モジュール
 * タップエフェクト、星座エフェクト、ミクの画像の切り替えを管理する
 */

import { canvas, currentStars, currentStarLines, clearConstellationEffects } from "./starManager.js";

/**
 * タップエフェクトを格納する配列
 * @type {Array<Object>}
 */
const tapEffects = [];

/**
 * 星座エフェクトを格納する配列
 * @type {Array<Object>}
 */
export const constellationEffects = [];

/**
 * 星座作成時のエフェクト実行中かどうかのフラグ
 * @type {boolean}
 */
export let isCreateConstellationEffect = false;

/**
 * エフェクト管理オブジェクト
 * 各種エフェクトの作成、描画、更新を担当する
 */
export const effects = {
  /**
   * タップエフェクトを作成する
   * 円形エフェクトとパーティクルエフェクトを生成する
   * @param {number} x - エフェクト発生場所のX座標
   * @param {number} y - エフェクト発生場所のY座標
   */
  createTapEffect(x, y) {
    tapEffects.push({
      type: "circle", x, y, radius: 0, maxRadius: 20, alpha: 0.4, lineWidth: 3, color: "rainbow", speed: 1.2
    });
    const particleCount = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      tapEffects.push({
        type: "particle", x, y,
        vx: Math.cos(angle) * (1.5 + Math.random() * 2),
        vy: Math.sin(angle) * (1.5 + Math.random() * 2),
        size: 1 + Math.random(), maxSize: (1 + Math.random()) * 1.5,
        alpha: 0.9, life: 15 + Math.random() * 15, maxLife: 15 + Math.random() * 15,
        hue: Math.random() * 60, gravity: 0.05, rotation: 0, rotationSpeed: 0
      });
    }
  },

  /**
   * タップエフェクトを描画する
   * 円形エフェクトとパーティクルエフェクトをキャンバスに描画する
   * @param {CanvasRenderingContext2D} ctx - 描画対象のキャンバスコンテキスト
   */
  drawTapEffects(ctx) {
    if (!ctx || !tapEffects.length) return;
    const time = performance.now() / 1000;
    for (let i = tapEffects.length - 1; i >= 0; i--) {
      const ef = tapEffects[i];
      if (ef.type === "circle") effects.drawCircleEffect(ctx, ef, time);
      else if (ef.type === "particle") effects.drawParticleEffect(ctx, ef);
      effects.updateEffect(ef, i);
    }
  },

  /**
   * 星座エフェクトを描画する
   * 全画面に広がる光のエフェクトを描画し、ミクの画像を変更する
   * @param {CanvasRenderingContext2D} ctx - 描画対象のキャンバスコンテキスト
   */
  drawConstellationEffects(ctx) {
    if (!ctx || !constellationEffects.length) return;

    const now = performance.now();

    for (let i = constellationEffects.length - 1; i >= 0; i--) {
      const effect = constellationEffects[i];

      if (effect.type === "fullscreen") {
        const elapsed = now - effect.started;
        const progress = Math.min(1.0, elapsed / effect.duration);

        // エフェクトの進行に応じて描画
        ctx.save();

        // 1. 星座の線がぴかぴかと2回光ってから消える処理
        if (currentStarLines.length > 0) {
          const elapsed = now - effect.started;
          const totalDuration = effect.duration;

          // 2回光るタイミングを計算
          const firstGlowTime = totalDuration * 0.1;
          const secondGlowTime = totalDuration * 0.2;
          // 光る時間の長さ
          const glowDuration = totalDuration * 0.15;

          currentStarLines.forEach(line => {
            const originalOpacity = line.opacity;
            const originalWidth = line.width;
            const originalColor = line.color;

            // 1回目の光るエフェクト
            const firstGlowFactor = Math.max(0, 1 - Math.abs(elapsed - firstGlowTime) / (glowDuration / 2));

            // 2回目の光るエフェクト
            const secondGlowFactor = Math.max(0, 1 - Math.abs(elapsed - secondGlowTime) / (glowDuration / 2));

            // 最終的なフェードアウト（70%以降で徐々に消える)
            const fadeOutStart = totalDuration * 0.5;
            const fadeOutFactor = elapsed < fadeOutStart ?
              1 : Math.max(0, 1 - (elapsed - fadeOutStart) / (totalDuration * 0.3));

            // 合成したglow効果と最終的な透明度を計算
            const glowFactor = Math.max(firstGlowFactor, secondGlowFactor);

            // 光る効果の強さに応じて線の色や太さなどを変更
            if (glowFactor > 0.1) {
              // 光っているとき
              line.width = originalWidth * (1 + glowFactor * 3);
              line.opacity = originalOpacity * Math.min(1, fadeOutFactor + glowFactor);
              line.color = `rgba(255, 255, 220, ${Math.min(1, line.opacity)})`;

              // 特別な光るエフェクト（線の周りにオーラを描画）
              if (glowFactor > 0.5) {
                ctx.save();
                ctx.shadowColor = "rgba(255, 255, 200, 0.8)";
                ctx.shadowBlur = line.width * 2;
                line.draw(ctx);
                ctx.restore();
              }
            } else {
              // 光っていないとき
              line.opacity = originalOpacity * fadeOutFactor;
              line.width = originalWidth;
            }

            // 線を描画
            line.draw(ctx);

            // 元の値に戻しておく
            line.opacity = originalOpacity;
            line.width = originalWidth;
            line.color = originalColor;
          });
        }

        // 2. 中央から広がる魔法の波
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        for (const wave of effect.waves) {
          const waveElapsed = now - wave.startTime;
          if (waveElapsed <= 0) continue;

          // 波の広がり方を計算
          const waveProgress = Math.min(1.0, waveElapsed / 2000); // 2秒で最大半径に達する
          wave.radius = wave.maxRadius * this.easeOutQuad(waveProgress);
          wave.opacity = Math.max(0, 0.4 * (1 - waveProgress));
          if (wave.opacity > 0) {

            // 波の輪郭も同様にフェードアウト
            ctx.beginPath();
            ctx.arc(centerX, centerY, wave.radius, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            const edgeFade = wave.radius > wave.maxRadius * 0.7 ?
              (1 - (wave.radius - wave.maxRadius * 0.7) / (wave.maxRadius * 0.3)) : 1;
            ctx.strokeStyle = `rgba(255, 255, 220, ${wave.opacity * 0.3 * edgeFade})`;
            ctx.stroke();
          }
        }

        // 3. キラキラした粒子
        effect.phase += 0.01;

        for (const p of effect.particles) {
          // 点滅効果
          p.twinklePhase += p.twinkleSpeed;
          const twinkle = 0.3 + 0.7 * Math.sin(p.twinklePhase) * Math.sin(p.twinklePhase);

          // 粒子の移動（ゆっくりと漂う）
          p.x += Math.cos(p.angle) * p.speed * 0.2;
          p.y += Math.sin(p.angle) * p.speed * 0.2;

          // フェードイン/アウト
          const particleOpacity = p.opacity * twinkle *
                                (progress < 0.3 ? progress / 0.3 :
                                  progress > 0.7 ? (1 - progress) / 0.3 : 1);

          if (particleOpacity > 0) {
            ctx.save();

            // グロー効果
            ctx.shadowColor = `rgba(255, 255, 200, ${particleOpacity})`;
            ctx.shadowBlur = p.size * 3;

            // 粒子本体
            ctx.fillStyle = `rgba(255, 255, 220, ${particleOpacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * twinkle, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }
        }

        // 4. 星座に使われているの星の周りの星屑
        for (let j = effect.sparkles.length - 1; j >= 0; j--) {
          const sparkle = effect.sparkles[j];

          // 星屑の移動と寿命の更新
          sparkle.x += Math.cos(sparkle.angle) * sparkle.speed;
          sparkle.y += Math.sin(sparkle.angle) * sparkle.speed;
          sparkle.life -= 0.01;

          if (sparkle.life <= 0) {
            effect.sparkles.splice(j, 1);
            continue;
          }

          const sparkleOpacity = sparkle.opacity * sparkle.life *
                               (progress < 0.3 ? progress / 0.3 : 1);

          if (sparkleOpacity > 0) {
            ctx.save();

            // グロー効果
            ctx.shadowColor = `hsla(${sparkle.hue}, 100%, 70%, ${sparkleOpacity})`;
            ctx.shadowBlur = sparkle.size * 2;

            // 星屑本体
            ctx.fillStyle = `hsla(${sparkle.hue}, 100%, 80%, ${sparkleOpacity})`;
            ctx.beginPath();
            ctx.arc(sparkle.x, sparkle.y, sparkle.size * sparkle.life, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }
        }

        // 5. 五芒星と五角形の魔法陣
        if (progress > 0.1 && progress < 0.95) {
          const decorSize = Math.min(canvas.width, canvas.height) * 0.4;
          // よりスムーズなフェードアウトのために計算式を調整
          let decorOpacity;
          if (progress < 0.4) {
            // フェードイン段階
            decorOpacity = Math.min(0.4, progress * 1.0);
          } else if (progress < 0.7) {
            // ピーク維持段階
            decorOpacity = 0.4;
          } else {
            // フェードアウト段階（より長く、なめらかに）
            const fadeProgress = (progress - 0.7) / 0.25; // 0.7-0.95の範囲を0-1にマップ
            decorOpacity = 0.4 * (1 - fadeProgress * fadeProgress); // 二次関数でなめらかに減衰
          }

          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(effect.phase);

          // 外側の円
          ctx.beginPath();
          ctx.arc(0, 0, decorSize, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 200, ${decorOpacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, decorSize * 0.95, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 200, ${decorOpacity * 0.4})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // 五角形の各辺を中点で内側に折り曲げた形の星（大）
          const indentDepth = decorSize * 0.1;
          this.drawIndentedPentagon(
            ctx,
            decorSize * 0.75,
            indentDepth,
            `rgba(255, 255, 200, ${decorOpacity})`,
            1
          );

          // 五角形の各辺を中点で内側に折り曲げた形の星（小）
          this.drawIndentedPentagon(
            ctx,
            decorSize * 0.7,
            indentDepth,
            `rgba(255, 255, 200, ${decorOpacity * 0.4})`,
            1
          );

          // 折り曲げ星に外接する五角形（36度回転）
          const circumscribedRadius = decorSize * 0.95;
          this.drawPentagon(
            ctx,
            circumscribedRadius,
            Math.PI / 5, // 36度回転
            `rgba(255, 255, 200, ${decorOpacity * 0.4})`,
            1
          );

          // 通常の五角形
          this.drawPentagon(
            ctx,
            circumscribedRadius,
            0, // 回転なし
            `rgba(255, 255, 200, ${decorOpacity * 0.4})`,
            1
          );

          ctx.restore();
        }

        ctx.restore();

        // エフェクトの終了判定
        if (elapsed >= effect.duration) {
          constellationEffects.splice(i, 1);
          // エフェクト終了時にフラグをリセット
          clearConstellationEffects();
          // エフェクト実行中のフラグをリセット
          isCreateConstellationEffect = false;
          // Mikuの画像を元に戻す
          updateMikuImage();
        }
      }
    }
  },

  /**
   * イージング関数（二次関数の逆関数）
   * スムーズな減速アニメーションを作成する
   * @param {number} t - 進行率（0-1の範囲）
   * @returns {number} イージング適用後の値
   */
  easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
  },

  /**
   * イージング関数（二次関数のイン・アウト）
   * スムーズな加速・減速アニメーションを作成する
   * @param {number} t - 進行率（0-1の範囲）
   * @returns {number} イージング適用後の値
   */
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  },

  /**
   * 円形エフェクトを描画する
   * レインボーカラーと歪みエフェクトを持つ円を描画する
   * @param {CanvasRenderingContext2D} ctx - 描画対象のキャンバスコンテキスト
   * @param {Object} ef - エフェクトオブジェクト
   * @param {number} time - 現在時刻（秒）
   */
  drawCircleEffect(ctx, ef, time) {
    ctx.save();
    if (ef.color === "rainbow") {
      const gradient = ctx.createLinearGradient(ef.x - ef.radius, ef.y - ef.radius, ef.x + ef.radius, ef.y + ef.radius);
      const hueOffset = (time * 30) % 360;
      gradient.addColorStop(0, `hsla(${hueOffset}, 100%, 70%, ${ef.alpha})`);
      gradient.addColorStop(0.5, `hsla(${(hueOffset + 60) % 360}, 100%, 70%, ${ef.alpha})`);
      gradient.addColorStop(1, `hsla(${(hueOffset + 120) % 360}, 100%, 70%, ${ef.alpha})`);
      ctx.strokeStyle = gradient;
    } else ctx.strokeStyle = `rgba(255,255,255,${ef.alpha})`;
    ctx.lineWidth = ef.lineWidth;
    ctx.beginPath();
    const distortion = 1 + Math.sin(time * 5) * 0.03;
    ctx.ellipse(ef.x, ef.y, ef.radius, ef.radius * distortion, time % (Math.PI * 2), 0, Math.PI * 2);
    ctx.stroke();
    if (ef.radius > 10) {
      const dotCount = Math.floor(ef.radius / 5);
      for (let i = 0; i < dotCount; i++) {
        const dotAngle = Math.PI * 2 * i / dotCount + time;
        const dotDist = ef.radius * 0.7 * Math.random();
        ctx.beginPath();
        ctx.arc(ef.x + Math.cos(dotAngle) * dotDist, ef.y + Math.sin(dotAngle) * dotDist, 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${ef.alpha * 0.7})`;
        ctx.fill();
      }
    }
    ctx.restore();
  },

  /**
   * パーティクルエフェクトを描画する
   * HSLカラーとシャドウ効果を持つパーティクルを描画する
   * @param {CanvasRenderingContext2D} ctx - 描画対象のキャンバスコンテキスト
   * @param {Object} ef - エフェクトオブジェクト
   */
  drawParticleEffect(ctx, ef) {
    ctx.save();
    ctx.translate(ef.x, ef.y);
    const brightness = Math.min(1, ef.life / (ef.maxLife * 0.3));
    ctx.fillStyle = `hsla(${ef.hue},80%,${70 + brightness * 30}%,${ef.alpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, ef.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = `hsla(${ef.hue},100%,70%,${ef.alpha})`;
    ctx.shadowBlur = ef.size * 2;
    ctx.fill();
    ctx.restore();
  },

  /**
   * エフェクトの状態を更新する
   * エフェクトの位置、サイズ、透明度などを時間経過に応じて更新する
   * @param {Object} ef - 更新対象のエフェクトオブジェクト
   * @param {number} index - エフェクト配列内のインデックス
   */
  updateEffect(ef, index) {
    if (ef.type === "circle") {
      const progress = ef.radius / ef.maxRadius;
      ef.radius += (10 * Math.pow(1 - progress, 2) + 1) * ef.speed;
      ef.alpha -= 0.02 + progress * 0.08;
      if (ef.alpha <= 0 || ef.radius >= ef.maxRadius) tapEffects.splice(index, 1);
    } else if (ef.type === "particle") {
      ef.x += ef.vx; ef.y += ef.vy; ef.vy += ef.gravity;
      ef.rotation += ef.rotationSpeed; ef.life -= 2;
      const lifeProgress = ef.life / ef.maxLife;
      ef.alpha = lifeProgress * 0.9;
      ef.size = ef.maxSize * Math.min(1, lifeProgress * 2);
      if (ef.life <= 0) tapEffects.splice(index, 1);
    }
  },

  /**
   * 五角形を描画する
   * @param {CanvasRenderingContext2D} ctx - 描画対象のキャンバスコンテキスト
   * @param {number} radius - 五角形の半径
   * @param {number} rotationOffset - 回転オフセット（ラジアン）
   * @param {string} strokeStyle - 線の色
   * @param {number} lineWidth - 線の太さ
   */
  drawPentagon(ctx, radius, rotationOffset, strokeStyle, lineWidth) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2 + rotationOffset;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  },

  /**
   * 五角形の各辺を中点で内側に折り曲げた形の星を描画する
   * @param {CanvasRenderingContext2D} ctx - 描画対象のキャンバスコンテキスト
   * @param {number} radius - 五角形の半径
   * @param {number} indentDepth - 内側への折り曲げの深さ
   * @param {string} strokeStyle - 線の色
   * @param {number} lineWidth - 線の太さ
   */
  drawIndentedPentagon(ctx, radius, indentDepth, strokeStyle, lineWidth) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const currentAngle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const nextAngle = ((i + 1) * Math.PI * 2) / 5 - Math.PI / 2;

      // 現在の頂点
      const currentX = Math.cos(currentAngle) * radius;
      const currentY = Math.sin(currentAngle) * radius;

      // 次の頂点
      const nextX = Math.cos(nextAngle) * radius;
      const nextY = Math.sin(nextAngle) * radius;

      // 辺の中点
      const midX = (currentX + nextX) / 2;
      const midY = (currentY + nextY) / 2;

      // 中点から中心への方向ベクトルを計算して内側に折り曲げる点を作る
      const centerDirection = Math.atan2(midY, midX);
      const indentX = midX - Math.cos(centerDirection) * indentDepth;
      const indentY = midY - Math.sin(centerDirection) * indentDepth;

      if (i === 0) {
        ctx.moveTo(currentX, currentY);
      }

      // 現在の頂点から折り曲げ点へ
      ctx.lineTo(indentX, indentY);
      // 折り曲げ点から次の頂点へ
      ctx.lineTo(nextX, nextY);
    }
    ctx.closePath();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
};

/**
 * 星座エフェクトを作成する
 * 全画面に広がる魔法のエフェクトを初期化し、ミクの画像を切り替える
 */
export function createConstellationEffect() {
  // エフェクト実行中のフラグを設定
  isCreateConstellationEffect = true;

  // Mikuの画像を更新
  updateMikuImage();

  // キャンバス全体に広がる魔法のエフェクトを作成
  constellationEffects.push({
    type: "fullscreen",
    started: performance.now(),
    duration: 3500, // ミリ秒単位のエフェクト持続時間
    waves: [], // 広がる波
    particles: [], // キラキラした粒子
    sparkles: [], // 星屑
    phase: 0, // アニメーションフェーズ
    completed: false
  });

  // 波を数個生成（時間差で広がっていく）
  const effect = constellationEffects[constellationEffects.length - 1];
  const waveCount = 3;
  for (let i = 0; i < waveCount; i++) {
    effect.waves.push({
      radius: 0,
      maxRadius: Math.max(canvas.width, canvas.height) * 1.5,
      startTime: effect.started + i * 400, // 時間差で発生
      opacity: 0.8
    });
  }

  // キラキラした粒子をランダムに配置
  const particleCount = 80;
  for (let i = 0; i < particleCount; i++) {
    effect.particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 1 + Math.random() * 3,
      opacity: 0.1 + Math.random() * 0.5,
      speed: 0.2 + Math.random() * 0.8,
      angle: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.02 + Math.random() * 0.05,
      twinklePhase: Math.random() * Math.PI * 2
    });
  }

  // 星座の星の位置に輝きを追加
  currentStars.filter(star => star.isClicked).forEach(star => {
    const x = star.xRatio * canvas.width;
    const y = star.yRatio * canvas.height;

    // 星座を構成する星の周りに星屑を生成
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 5 + Math.random() * 50;
      effect.sparkles.push({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        size: 2 + Math.random() * 3,
        opacity: 0.6 + Math.random() * 0.4,
        speed: 0.5 + Math.random() * 1.5,
        angle: angle,
        life: 1.0,
        hue: 40 + Math.random() * 20
      });
    }
  });
}

/**
 * 現在表示すべきミクの画像ファイル名を取得する
 * 星座エフェクト中はmiku_smile、通常時はmiku_defaultを返す
 * @returns {string} ミクの画像ファイル名（拡張子なし）
 */
export function getCurrentMikuCharacter() {
  return isCreateConstellationEffect ? "miku_smile" : "miku_default";
}

/**
 * ミクの画像を現在の状態に応じて更新する
 * DOM要素のsrc属性を変更して画像を切り替える
 */
export function updateMikuImage() {
  const mikuElement = document.getElementById("miku");
  if (mikuElement) {
    const currentCharacter = getCurrentMikuCharacter();
    mikuElement.src = `./assets/${currentCharacter}.png`;
  }
}
