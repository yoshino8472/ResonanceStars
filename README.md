# Resonance Stars
「Resonance Stars」は、[初音ミク「マジカルミライ 2025」プログラミング・コンテスト](https://magicalmirai.com/2025/procon/)の応募作品です。

TextAlive APIを利用した楽曲再生機能を組み込み、楽曲の再生に合わせた星の瞬きや歌詞の表示を行います。
歌詞を基に星座名を決め、星々をつないで自分だけの星座を作ることができます。

## 目次

- [開発・制作](#開発・制作)
- [アピールポイント](#アピールポイント)
- [使用技術・ライブラリ](#使用技術ライブラリ)
- [実行環境の構築](#実行環境の構築)
- [動作環境](#動作環境)
- [素材と権利関係](#素材と権利関係)
- [フォルダ構成](#フォルダ構成)
- [ライセンス](#ライセンス)

## 開発・制作
- **開発**: よしの
- **イラスト協力**: botan

## アピールポイント
### 投稿者コメント(300字以内)
Vocaloidの魅力のひとつは、誰もが創作に参加できる文化だと思います。このアプリでも、「誰でも何かを作れる」ことを目指して、歌詞をもとに星座を作る仕組みを取り入れました。
星の配置は毎回少し変わるので、二度と同じ星座を作ることはできません。その瞬間にしかできない体験を、楽しんでもらえたらと思います。
曲の再生中に表示される星の瞬きは、事前に音楽を分析した結果を基にしており、曲の音量や、その時になっている音に合わせて表示されます。
素敵な楽曲に耳を澄ませながら、星の瞬きにも注目してみてください。

### 音楽の周波数解析による星空生成
このアプリでは、星の瞬きを音楽と同期させるために、高速フーリエ変換(FFT)を使用した音響解析データを独自に作成して使用しています。
この音響解析はPythonスクリプトで事前に行うため、Webアプリには含まれません。
楽曲解析に使用したスクリプトは、`python/fft.py`に格納しています。

各星が1つの音階に対応し、その音階の音が大きく鳴っていれば表示する仕様で、楽曲に合わせた星の瞬きを表現しています。

星の瞬きは、人間の耳の聞こえ方に合わせるために、等間隔な周波数ごとに音量を計算するのではなく、音階ごとの計算を行っています。
また、音量の計算時に、A特性という、人の耳の聞こえ方に合わせる重みづけを行うことで、より人の聞こえ方に合わせた星の瞬きを実現しています。

楽曲の分析方法として、FFTのほかに定Q変換やメルスペクトログラムなども試しましたが、最も星の瞬きがきれいに見えるという理由から、FFTによる分析を採用しました。
将来的に、採譜AIの発展や、さらに良い分析方法を見つけることができれば、より楽曲に合わせた表現を行うこともできるようになると考えています。

### TextAlive APIの活用
本アプリでは、TextAliveの歌詞表示機能を含め、以下のようなAPIを活用しています。
- **歌詞表示**: 楽曲の再生に合わせて、phraseごとに歌詞を表示します。
- **品詞情報**: 星座名として使用できる語句を選別する際に、品詞情報を活用しています。
- **コード情報**: コード進行の情報を活用して、一部の星の色を変化させ、楽曲の雰囲気に合わせて星空へアクセントを加えています。

### UIデザインのこだわり
アプリの背景である、夜空に合わせたUI部品のデザインや、星空をタップしたとき、星座を作成したときに表示されるエフェクトにもこだわり、
ユーザが思わず触りたくなる操作感やアプリ全体での世界観を作っています。

## 使用技術・ライブラリ
### コア技術
- HTML5
- CSS3 (Tailwind CSS)
- JavaScript (ES6+)
- Canvas API

### 使用ライブラリ
- **TextAlive App API** (v0.4.0) © AIST（MIT License）  
  https://github.com/TextAliveJp/textalive-app-api
- **Tailwind CSS** (v4.1.8) © Tailwind Labs（MIT License）  
  https://github.com/tailwindlabs/tailwindcss
- **Vite** (v6.3.5) © Evan You（MIT License）  
  https://github.com/vitejs/vite


### 開発ツール
- [Jest](https://jestjs.io/) - テスト用フレームワーク
- [ESLint](https://eslint.org/) - コード品質管理
- [ChatGPT](https://chatgpt.com/) - コード支援 
- [GitHub Copilot](https://github.com/features/copilot) - コード支援 

## 実行環境の構築

### 前提条件
- [Node.js](https://nodejs.org/) (v20.10.0)
- [npm](https://www.npmjs.com/) (10.2.3)

上記がインストールされていない場合は、[Node.js公式](https://nodejs.org/ja/)からダウンロード、インストールしてください。

インストール後、以下のコマンドでバージョンを確認できます。
```
node -v
npm -v
```

### インストール手順

1. リポジトリをクローン
   ```bash
   git clone https://github.com/yoshino8472/ResonanceStars.git
   cd ResonanceStars
   ```

2. 依存パッケージをインストール
   ```bash
   npm install
   ```

3. 開発サーバーを起動
   ```bash
   npm run dev
   ```

4. ブラウザで `http://localhost:5173/` にアクセス

### ビルド方法

本番用ビルドを作成するには:

```bash
npm run build
```

ビルド結果は `dist` ディレクトリに出力されます。

## 動作環境

### 動作確認済環境
- デスクトップPC(Windows 10) Google Chrome 138.0.7204.97（Official Build） （64 ビット）
- HUAWEI nova 5T(EMUI 11.0.0)  Chrome 138.0.7204.63

### 推奨環境
- **ブラウザ**: Chrome
- **ウィンドウサイズ**: 最小 375x667px、推奨 1920x1080px

### フォルダ構成
主要ファイルの配置場所
```
ResonanceStars/
├─public/
│  ├─assets/  # アプリで使用する画像を格納
│  └─fft/     # 楽曲の解析データを格納
├─python/     # 楽曲解析用スクリプトを格納
├─src/        # JavaScriptファイル、cssを格納    
│  ├─config/ 
│  │  └─config.js # TextAlive APIトークンを記載するファイル
│  ├─scripts/
│  │  ├─constellations.js # ユーザが作成した星座情報を格納するクラス
│  │  ├─effectManager.js  # canvas(星空)操作時のエフェクトを管理するスクリプト
│  │  ├─fftLoader.js      # 楽曲解析データの読み込みを行うスクリプト
│  │  ├─lyric.js          # 歌詞の表示を行うスクリプト
│  │  ├─main.js           # アプリ起動時に読み込まれるスクリプト
│  │  ├─musicList.js      # 楽曲情報をまとめたスクリプト
│  │  ├─player.js         # TextAlivePlayerの実行に関するスクリプト
│  │  ├─router.js         # アプリの表示画面を制御するスクリプト
│  │  ├─star.js           # アプリで表示する星の情報を格納するクラス
│  │  ├─starLine.js       # 星と星をつなぐ線の情報を格納するクラス
│  │  ├─starManager.js    # 星の表示等を管理するスクリプト
│  │  └─ui.js             # UI部品の表示、UI部品操作時の処理を行うスクリプト
│  └─styles/  # TailWindコンパイル前のcssを格納
└─index.html  # アプリで読み込むhtml
```


## 素材と権利関係
### 楽曲
- ストリートライト (加賀（ネギシャワーP）さん)
- アリフレーション (雨良 Amala さん)
- インフォーマルダイブ (r99piano さん)
- ハロー、フェルミ。 (ど～ぱみん さん)
- パレードレコード (きさら さん)
- ロンリーラン (海風太陽 さん)

収録楽曲は[TextAlive App API](https://developer.textalive.jp/)を通じて提供されるものを使用しています。

### キャラクターイラスト
- 本作品は[ピアプロ・キャラクター・ライセンス](https://piapro.jp/license/pcl/summary)に基づいてクリプトン・フューチャー・メディア株式会社のキャラクター「初音ミク」を描いたイラストを含みます。

### 画像・デザイン素材
- アイコン素材: [icooon-mono](https://icooon-mono.com/) (フリー利用可)

### フォント
- M PLUS Rounded 1c - Google Fonts, [Open Font License (OFL)](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL)
- Quicksand - Google Fonts, [Open Font License (OFL)](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL)
- Raleway - Google Fonts, [Open Font License (OFL)](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL)
- Zen Maru Gothic - Google Fonts, [Open Font License (OFL)](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL)
