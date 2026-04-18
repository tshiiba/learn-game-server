# admin-cognito

`cognito-local` に対して SDK v3 で直接サインインするための検証用フロントエンドです。起動直後はログイン画面を表示し、認証成功後に token を確認する管理画面へ切り替わります。

## 前提

- リポジトリ直下で `docker compose up -d cognito-local` が起動していること
- ローカル User Pool / App Client / test user が作成済みであること
- デフォルト値はこのリポジトリで作成済みの local resource を指しています

## 環境変数

```bash
cp .env.example .env.local
```

必要に応じて以下を上書きできます。

- `VITE_COGNITO_ENDPOINT`
- `VITE_COGNITO_REGION`
- `VITE_COGNITO_USER_POOL_ID`
- `VITE_COGNITO_CLIENT_ID`

通常は `VITE_COGNITO_ENDPOINT=/cognito` のまま使います。
Vite dev server が `http://localhost:9229` へ proxy するため、ブラウザから直接 local Cognito を叩かずに済みます。

## 開発

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開くと、最初にログイン画面が表示されます。以下の test user でログインしてください。

- email: `test-user@example.com`
- password: `TestPass123!`

## 実装メモ

- 認証 API 呼び出しは `src/auth/localCognitoAuth.ts` に隔離しています
- 認証フローは `USER_PASSWORD_AUTH` です
- 成功時は管理画面へ遷移し、`idToken` / `accessToken` / `refreshToken` を表示します
- token 永続化はまだ入れていないため、再読み込みするとログイン画面から始まります
