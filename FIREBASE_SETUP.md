# Firebase の設定と確認

このアプリは `share.js` にある Firebase プロジェクト `tanboru-2da31` を使います。別のプロジェクトで運用するときは、Firebase Console の「プロジェクトの設定 → マイアプリ → ウェブアプリ」から取得した設定値に差し替えてください。ウェブアプリの `apiKey` は公開用の識別子です。Firebase Admin の秘密鍵はこのリポジトリに置きません。

## 必須設定

1. [Firebase Console](https://console.firebase.google.com/) で対象プロジェクトを開く。
2. 「Authentication → Sign-in method → 匿名」を有効にする。アプリ利用者は名前だけを入力します。匿名認証はFirestoreルールを適用するための端末セッションで、名前による本人確認ではありません。
3. 「Firestore Database」を作成済みか確認する。未作成ならデータベースを作成する。`users`、`user_states`、`rooms` コレクションはアプリの初回書き込み時に作られます。手入力は不要です。
4. 「Firestore Database → ルール」に [`firestore.rules`](firestore.rules) の内容を公開する。既存ルールを置き換えるため、同じプロジェクトの別アプリがあれば影響を確認する。下記の CLI コマンドでも適用できる。
5. 「Hosting」を開き、未設定なら「始める」から同じプロジェクトの Hosting を有効にする。
6. 公開先で Firebase Authentication のドメイン制限に遭遇した場合は、「Authentication → Settings → Authorized domains」に `tanboru-2da31.web.app` を追加する。

ルールを公開するまでは、名前登録や作業場の作成が `permission-denied` になることがあります。設定後はブラウザを再読み込みしてください。

## Firebase Hosting へ公開する

このリポジトリのルートディレクトリで実行します。Firebase CLI が未導入なら、Node.js を用意して `npm install -g firebase-tools` で導入してください。Firebase Console で対象プロジェクトにアクセスできる Google アカウントを使います。

```sh
firebase login
firebase deploy --only hosting,firestore:rules --project tanboru-2da31
```

デプロイが成功すると Hosting の URL が表示されます。通常は `https://tanboru-2da31.web.app` です。CLI を使わずに Firestore ルールだけ Console で先に公開しても構いませんが、Hosting のファイル公開には上記の CLI が必要です。`firebase.json` はリポジトリ直下の `index.html`、JavaScript、CSS、`assets`、`manifest.webmanifest`、`robots.txt` を公開し、開発用ファイルを除外します。

公開後は URL を PC とスマホで開き、以下の手順を確認してください。旧 Vercel サイトは自動停止しません。Firebase Hosting 側の確認が終わったら Vercel の GitHub 連携と公開を停止し、共有している URL を Firebase Hosting のものに変更してください。Firestore のデータは公開先を切り替えても同じプロジェクトに残ります。

## 保存先

| コレクション | 内容 |
| --- | --- |
| `users/{nameId}` | 名前、アバター、大学、学部、学年。`nameId` は正規化した名前のSHA-256から作成するため、別端末でも同じ名前は同じIDになる |
| `user_states/{nameId}` | タスク、ポイント、収穫、料理、設定、仲間、集中履歴。変更を別端末へ配信する |
| `rooms/{roomId}` | 作業場、主催者、時刻、定員、参加者の入退室。終了後も履歴判定のため残す |
| `rooms/{roomId}/reactions/{reactionId}` | 実際に送られた拍手とスタンプ |

写真の画像と一覧は端末の IndexedDB / localStorage に残し、Firebase にはアップロードしません。したがって写真は別端末に表示されません。がんばりレポートの集中履歴・完了したタスクは Firestore に保存した状態から表示します。以前の `tanboru-v1` のサンプルデータは新しいユーザーに自動移行しません。

## 2台で確認する

1. PCで名前Aを登録し、タスクを1件追加する。同じ名前Aでスマホから入り、タスクが表示されることを確認する。
2. スマホでは別の名前Bで入り直し、PCのAが作った作業場へ参加する。双方の参加者表示と定員が更新されることを確認する。
3. Bからスタンプを送り、A側に表示されることを確認する。
4. 1分以上一緒に集中してから終了し、両者の「仲間」タブの水路と集中履歴を確認する。

名前しか確認しないため、同じ名前を入力した第三者もその人の記録を開けます。Firestore ルールは匿名セッションと入力形式を検査しますが、本人確認はできません。公開デモには実名・個人情報・秘密のタスクを入力しないでください。同じユーザーを2台から同時編集すると、`user_states` は最後に保存した内容が優先されます。
