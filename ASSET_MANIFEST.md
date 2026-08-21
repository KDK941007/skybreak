# SKYBREAK Asset Manifest

ゲーム画像はリポジトリのルート直下に `assets/` フォルダを作成して配置します。

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
   ├─ aion_hit.webp
   ├─ aion_idle0.webp
   ├─ fx_blast_fire.webp
   ├─ fx_fire_slash.webp
   ├─ fx_hit_orange.webp
   ├─ rex_attack0.webp
   ├─ rex_attack1.webp
   ├─ rex_fall.webp
   ├─ rex_idle0.webp
   ├─ rex_idle1.webp
   ├─ rex_jump.webp
   ├─ rex_run0.webp
   ├─ rex_run1.webp
   ├─ rex_special.webp
   └─ stage.webp
```

## 注意

- `assets/assets/...` の二重階層にしないこと。
- ファイル名は変更しないこと。`index.html` と `game.js` が上記パスを参照しています。
- 画像追加後に `main` へpushすると、GitHub Pages Workflowが画像の存在を確認し、公開処理を実行します。
