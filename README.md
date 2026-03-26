# learn-game-server
ゲームサーバー勉強用リポジトリ

## Local Cognito Emulator

ローカルで Cognito 相当の認証フローを試すために、`cognito-local` を使います。
まずは React や Go サーバーをまだつながずに、Cognito エミュレータの起動と User Pool / App Client の作成までを確認します。

### 1. エミュレータを起動する

```bash
docker compose up -d cognito-local
```

起動確認:

```bash
docker compose ps
```

### 2. AWS CLI 用のダミー認証情報を設定する

`cognito-local` は AWS CLI の形式で操作しますが、実際の AWS 認証情報は不要です。
ローカル用にダミー値を入れて操作します。

```bash
export AWS_ACCESS_KEY_ID=local
export AWS_SECRET_ACCESS_KEY=local
export AWS_DEFAULT_REGION=ap-northeast-1
```

### 3. User Pool を作成する

```bash
aws \
	--endpoint-url http://localhost:9229 \
	cognito-idp create-user-pool \
	--pool-name local-user-pool
```

返ってきた JSON の `Id` が `UserPoolId` です。
以降の手順で使うので控えてください。

### 4. App Client を作成する

```bash
aws \
	--endpoint-url http://localhost:9229 \
	cognito-idp create-user-pool-client \
	--user-pool-id <USER_POOL_ID> \
	--client-name local-web-client \
	--explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH
```

返ってきた JSON の `ClientId` が React アプリ側から使う `App Client ID` です。

### 5. 作成できたか確認する

User Pool 一覧:

```bash
aws \
	--endpoint-url http://localhost:9229 \
	cognito-idp list-user-pools \
	--max-results 10
```

App Client 一覧:

```bash
aws \
	--endpoint-url http://localhost:9229 \
	cognito-idp list-user-pool-clients \
	--user-pool-id <USER_POOL_ID> \
	--max-results 10
```

### 6. ここまでで確認できること

- ローカルの Cognito エミュレータが起動する
- User Pool を作成できる
- App Client を作成できる
- `.cognito/db/` に状態が保存されるので、再起動後も残る

### 次のステップ

次は以下の順で進めると切り分けしやすいです。

1. テストユーザーを作成する
2. CLI でサインアップとログインを確認する
3. React から同じ User Pool / App Client に対してログインする
4. Go 側で JWT を検証する

## React Login Example

`web/admin-cognito` 配下にローカル認証確認用の React アプリを追加しています。
このアプリは SDK v3 の `@aws-sdk/client-cognito-identity-provider` を使って `cognito-local` に直接ログインします。

### 1. Node.js を mise で入れる

```bash
mise install node
```

### 2. 依存関係をインストールする

```bash
cd web/admin-cognito
npm install
```

### 3. 必要なら接続先を上書きする

`web/admin-cognito/.env.example` をベースに環境変数を設定できます。

```bash
cp web/admin-cognito/.env.example web/admin-cognito/.env.local
```

既定値は、ここまでの手順で作成したローカル User Pool / App Client を指しています。

### 4. 開発サーバーを起動する

```bash
cd web/admin-cognito
npm run dev
```

ブラウザで `http://localhost:5173` を開くと、テストユーザーでログインできます。

### 5. ログインに使う値

- email: `test-user@example.com`
- password: `TestPass123!`

### 6. 実装上のポイント

- ブラウザから `http://localhost:9229` を直接叩く代わりに、Vite の proxy で `/cognito` に流しています
- これにより、ローカル開発中の CORS 問題を避けています
- 認証には `USER_PASSWORD_AUTH` を使っています
- ログイン成功後は `id_token` / `access_token` / `refresh_token` を画面に表示します

## Backend JWT Verification

Go の gRPC サーバーには Cognito JWT を検証する interceptor を追加しています。
ただし既存の疎通を壊さないよう、認証はデフォルトで無効です。

### 有効化する環境変数

```bash
export COGNITO_AUTH_ENABLED=true
export COGNITO_ISSUER=http://localhost:9229/local_7Bsq4uKe
export COGNITO_JWKS_URL=http://localhost:9229/local_7Bsq4uKe/.well-known/jwks.json
export COGNITO_CLIENT_ID=2esekcy0c1amp6057k4k4l81k
```

`COGNITO_JWKS_URL` を省略した場合は `COGNITO_ISSUER/.well-known/jwks.json` を既定値として使います。

### 現在の挙動

- `COGNITO_AUTH_ENABLED=true` の時だけ gRPC unary interceptor が有効になります
- `authorization: Bearer <token>` metadata が必須です
- token の署名、issuer、client id を検証します
- `token_use` は `access` または `id` を受け付けます
- gRPC reflection は開発用に認証対象外です

### 検証コマンド

```bash
go test ./...
```

`web/admin` 側の Route Handler は、受け取った `Authorization` header をそのまま Go gRPC 呼び出しへ転送できる状態です。
