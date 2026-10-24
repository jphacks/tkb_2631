# Firebase の設定と確認

このアプリは `share.js` にある Firebase プロジェクト `tanboru-2da31` を使います。別のプロジェクトで運用するときは、Firebase Console の「プロジェクトの設定 → マイアプリ → ウェブアプリ」から取得した設定値に差し替えてください。ウェブアプリの `apiKey` は公開用の識別子です。Firebase Admin の秘密鍵はこのリポジトリに置きません。

## 必須設定

1. [Firebase Console](https://console.firebase.google.com/) で対象プロジェクトを開く。
2. 「Authentication → Sign-in method → 匿名」を有効にする。アプリ利用者は名前だけを入力します。匿名認証はFirestoreルールを適用するための端末セッションで、名前による本人確認ではありません。
3. 「Firestore Database」を作成済みか確認する。未作成ならデータベースを作成する。`users`、`user_states`、`rooms` コレクションはアプリの初回書き込み時に作られます。手入力は不要です。
4. 「Firestore Database → ルール」に [`firestore.rules`](firestore.rules) の内容を貼って公開する。既存ルールは置き換わるため、同じプロジェクトを使う別アプリがあれば影響を確認してください。CLI が使える場合は `firebase deploy --only firestore:rules --project tanboru-2da31` でも適用できます。`firebase.json` はこのファイルを参照しています。
5. 公開先で Firebase Authentication のドメイン制限に遭遇した場合は、「Authentication → Settings → Authorized domains」に公開サイトのドメインを追加する。

ルールを公開するまでは、名前登録や作業場の作成が `permission-denied` になることがあります。設定後はブラウザを再読み込みしてください。

## 保存先

| コレクション | 内容 |
| --- | --- |
| `users/{nameId}` | 名前、アバター、大学、学部、学年。`nameId` は正規化した名前のSHA-256から作成するため、別端末でも同じ名前は同じIDになる |
| `user_states/{nameId}` | タスク、ポイント、収穫、料理、設定、仲間、集中履歴。変更を別端末へ配信する |
| `rooms/{roomId}` | 作業場、主催者、時刻、定員、参加者の入退室。終了後も履歴判定のため残す |
| `rooms/{roomId}/reactions/{reactionId}` | 実際に送られた拍手とスタンプ |

写真の画像と一覧は端末の IndexedDB / localStorage に残し、Firebase にはアップロードしません。以前の `tanboru-v1` のサンプルデータは新しいユーザーに自動移行しません。

## 2台で確認する

1. PCで名前Aを登録し、タスクを1件追加する。同じ名前Aでスマホから入り、タスクが表示されることを確認する。
2. スマホでは別の名前Bで入り直し、PCのAが作った作業場へ参加する。双方の参加者表示と定員が更新されることを確認する。
3. Bからスタンプを送り、A側に表示されることを確認する。
4. 1分以上一緒に集中してから終了し、両者の「仲間」タブの水路と集中履歴を確認する。

名前しか確認しないため、同じ名前を入力した第三者もその人の記録を開けます。Firestoreルールは匿名セッションと入力形式を検査しますが、本人確認はできません。公開デモには実名・個人情報・秘密のタスクを入力しないでください。同じユーザーを2台から同時編集すると、`user_states` は最後に保存した内容が優先されます。
