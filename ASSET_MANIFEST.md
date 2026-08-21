# SKYBREAK Asset Manifest

ゲーム画像はリポジトリのルート直下に `assets/` フォルダを作成して配置します。

現在の戦闘基盤では、キャラクターと主要エフェクトは透過PNGを使用し、ステージのみWebPを使用します。過去のWebPキャラクター素材にはスプライト切り出し時の断片が混入していたため、現行コードでは使用しません。

```text
skybreak/
├─ index.html
├─ style.css
├─ game.js
├─ README.md
├─ DEVELOPMENT.md
├─ ASSET_MANIFEST.md
├─ .nojekyll
├─ .github/
└─ assets/
   ├─ aion_hit.png
   ├─ aion_idle0.png
   ├─ fx_blast_fire.png
   ├─ fx_blue_slash.png
   ├─ fx_hit_orange.png
   ├─ rex_fall.png
   ├─ rex_idle0.png
   ├─ rex_idle1.png
   ├─ rex_jump.png
   ├─ rex_run0.png
   ├─ rex_run1.png
   └─ stage.webp
```

## 注意

- `assets/assets/...` の二重階層にしないこと。
- 上記ファイル名は変更しないこと。`index.html` と `game.js` がこのパスを参照します。
- 旧 `rex_attack*.webp` / `rex_special.webp` は現行戦闘基盤では使用しません。攻撃モーションはキャラクター本体と独立したVFXで構成します。
- 画像追加後に `main` へpushすると、GitHub Pages Workflowが必要画像をすべて確認し、揃っている場合のみ公開処理を実行します。
