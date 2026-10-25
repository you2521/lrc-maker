# LRC Maker for WatchLyrics 🎵⏱️

スマートウォッチ歌詞表示アプリ「WatchLyrics」等で使える、タイムスタンプ付きLRCテキストをスマートフォン上で直感的に作成できるWebツールです。

---

## 🌟 特徴
1. **完全ブラウザ完結・通信ゼロ（著作権完全クリア）**
   - 入力された歌詞テキストや音楽ファイルは、一切外部サーバーに送信・保存されません。
   - お手持ちのブラウザ（端末メモリ）内のみで処理されるため、安心してご利用いただけます。
2. **スマホ片手で操作できる特大タップボタン**
   - 音楽のリズム・歌い出しに合わせて画面下の巨大ボタンをタップするだけで、自動的にミリ秒単位の時刻が記録されます。
3. **柔軟な音源スタイル**
   - **外部プレイヤー連携**：YouTube MusicやSpotifyを裏で流しながらストップウォッチ感覚で記録。
   - **音楽ファイル再生**：端末内のMP3 / M4A / WAVファイルを読み込み、サイト内で直接再生＆シークしながら記録。
4. **充実のリカバリー＆微調整機能**
   - 押し間違えてもすぐ直せる「1行戻す（Undo）」ボタン。
   - 完成後に全体を一括シフトできる「全体オフセット（±0.1s 〜 ±0.5s）」。
   - 行ごとの「-0.2s / +0.2s」個別アジャスト。
5. **PWA対応**
   - スマホの「ホーム画面に追加」を行うことで、ブラウザバーのない全画面ネイティブアプリ感覚で起動できます。

---

## 🚀 GitHub Pagesでの無料公開手順（3分で完了）

1. **GitHubで新規リポジトリを作成**
   - リポジトリ名例: `lrc-maker`（Publicで作成）
2. **本フォルダのファイルをプッシュ**
   ```bash
   cd c:\AI_google\newappidea\lrc-maker
   git init
   git add .
   git commit -m "Initial commit of LRC Maker"
   git branch -M main
   git remote add origin https://github.com/あなたのユーザー名/lrc-maker.git
   git push -u origin main
   ```
3. **GitHub Pagesを有効化**
   - リポジトリの **Settings** > **Pages** を開く。
   - **Build and deployment** の Branch で `main` / `/(root)` を選択して **Save**。
4. **公開完了！**
   - 数十秒後に `https://あなたのユーザー名.github.io/lrc-maker/` で世界中に公開されます。

---

## 💻 PC/スマホのローカルで今すぐ確認する方法

PowerShell等で以下のコマンドを実行すると、ローカルサーバーが立ち上がりブラウザで確認できます。

```powershell
cd c:\AI_google\newappidea\lrc-maker
python -m http.server 8000
```
ブラウザで `http://localhost:8000` を開きます。
