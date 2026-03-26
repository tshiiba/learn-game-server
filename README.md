# learn-game-server
ゲームサーバー勉強用リポジトリ

## 概要

ローカルで Cognito 認証を試すために、以下の最小構成を作っています。

- `cognito-local` で Cognito 相当の認証基盤を起動
- `web/admin-cognito` で SDK v3 を使った直接ログインを確認
- Go gRPC サーバーで Cognito JWT を検証
- `web/admin` の Route Handler から `Authorization` header を Go gRPC へ転送

現時点では Hosted UI や OIDC リダイレクトではなく、`USER_PASSWORD_AUTH` を使ったローカル疎通確認に寄せています。

## 現在のローカル設定

- Cognito endpoint: `http://localhost:9229`
- Region: `ap-northeast-1`
- User Pool ID: `local_7Bsq4uKe`
- App Client ID: `2esekcy0c1amp6057k4k4l81k`
- Test user email: `test-user@example.com`
- Test user password: `TestPass123!`

`cognito-local` が発行する token の `iss` は `http://0.0.0.0:9229/local_7Bsq4uKe` になります。
Go 側の JWT 検証はこの値に合わせています。

## 構成

- `docker-compose.yaml`: `cognito-local` と MySQL の起動
- `web/admin-cognito`: SDK v3 で local Cognito にログインする検証用 UI
- `web/admin`: Next.js 側の管理画面。Route Handler から Go gRPC を呼ぶ
- `internal/auth`: Go 側の Cognito JWT verifier と gRPC interceptor
- `main.go`: gRPC サーバー起動。`COGNITO_AUTH_ENABLED=true` のときだけ認証を有効化

## セットアップ

### 1. Cognito emulator を起動

```bash
docker compose up -d cognito-local
docker compose ps cognito-local
```

### 2. frontend 依存を入れる

```bash
cd web/admin-cognito
npm install

cd ../admin
npm install
```

### 3. admin-cognito の env を必要に応じて作成

```bash
cd /home/t-shiiba/dev/learn-game-server
cp web/admin-cognito/.env.example web/admin-cognito/.env.local
```

通常は `.env.example` の既定値のままで動きます。

## 起動方法

### admin-cognito

```bash
cd web/admin-cognito
npm run dev
```

`http://localhost:5173` で開きます。

### admin

```bash
cd web/admin
npm run dev
```

`http://localhost:3000` で開きます。

### Go gRPC server

認証を有効にする場合:

```bash
cd /home/t-shiiba/dev/learn-game-server
COGNITO_AUTH_ENABLED=true go run .
```

必要なら明示的に以下を上書きできます。

```bash
export COGNITO_ISSUER=http://0.0.0.0:9229/local_7Bsq4uKe
export COGNITO_JWKS_URL=http://localhost:9229/local_7Bsq4uKe/.well-known/jwks.json
export COGNITO_CLIENT_ID=2esekcy0c1amp6057k4k4l81k
```

## 動作確認方法

### 1. SDK v3 でログインできることを確認

1. `http://localhost:5173` を開く
2. `test-user@example.com` / `TestPass123!` でサインインする
3. 画面に `idToken` / `accessToken` / `refreshToken` が表示されることを確認する

### 2. CLI で access token を取得できることを確認

```bash
export AWS_ACCESS_KEY_ID=local
export AWS_SECRET_ACCESS_KEY=local
export AWS_DEFAULT_REGION=ap-northeast-1

aws \
  --endpoint-url http://localhost:9229 \
  cognito-idp initiate-auth \
  --client-id 2esekcy0c1amp6057k4k4l81k \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=test-user@example.com,PASSWORD=TestPass123!
```

### 3. backend の未認証拒否を確認

前提:

- `docker compose up -d cognito-local`
- `COGNITO_AUTH_ENABLED=true go run .`
- `cd web/admin && npm run dev`

未認証リクエスト:

```bash
curl -sS http://127.0.0.1:3000/api/hello?name=guest
```

期待結果:

```json
{"error":"16 UNAUTHENTICATED: missing authorization header"}
```

### 4. backend の認証成功を確認

```bash
TOKEN=$(AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local AWS_DEFAULT_REGION=ap-northeast-1 \
  aws --no-cli-pager --endpoint-url http://localhost:9229 cognito-idp initiate-auth \
  --client-id 2esekcy0c1amp6057k4k4l81k \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=test-user@example.com,PASSWORD=TestPass123! \
  --query 'AuthenticationResult.AccessToken' \
  --output text)

curl -sS -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:3000/api/hello?name=guest
```

期待結果:

```json
{"message":"Hello, guest"}
```

### 5. `web/admin` の簡易画面で確認

1. `http://localhost:5173` の `admin-cognito` でログインする
2. 表示された `accessToken` をコピーする
3. `http://localhost:3000/hello` を開く
4. token を貼り付けて `Call with auth` を押す

未認証の確認は `Call without auth` を押します。

## 補足

- `web/admin-cognito` は token を表示するだけで、永続化はまだしていません
- `web/admin` は受け取った `Authorization` header をそのまま Go gRPC metadata に転送します
- Go 側の認証は gRPC reflection にはかかりません
