import { useState } from 'react'
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from 'amazon-cognito-identity-js'
import './App.css'

const config = {
  endpoint: import.meta.env.VITE_COGNITO_ENDPOINT ?? '/cognito',
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ?? 'local_7Bsq4uKe',
  clientId:
    import.meta.env.VITE_COGNITO_CLIENT_ID ?? '2esekcy0c1amp6057k4k4l81k',
}

const defaultCredentials = {
  username: 'test-user@example.com',
  password: 'TestPass123!',
}

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(window.atob(normalized))
  } catch {
    return null
  }
}

function createUserPool() {
  return new CognitoUserPool({
    UserPoolId: config.userPoolId,
    ClientId: config.clientId,
    endpoint: config.endpoint,
  })
}

function App() {
  const [form, setForm] = useState(defaultCredentials)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('未ログイン')
  const [tokens, setTokens] = useState(null)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setStatus('submitting')
    setMessage('Cognito に認証を依頼しています...')
    setTokens(null)

    const authentication = new AuthenticationDetails({
      Username: form.username,
      Password: form.password,
    })

    const cognitoUser = new CognitoUser({
      Username: form.username,
      Pool: createUserPool(),
    })

    cognitoUser.authenticateUser(authentication, {
      onSuccess: (session) => {
        const accessToken = session.getAccessToken().getJwtToken()
        const idToken = session.getIdToken().getJwtToken()
        const refreshToken = session.getRefreshToken().getToken()

        setStatus('success')
        setMessage('ログイン成功。id_token / access_token / refresh_token を取得しました。')
        setTokens({
          accessToken,
          idToken,
          refreshToken,
          idTokenClaims: decodeJwt(idToken),
        })
      },
      onFailure: (error) => {
        setStatus('error')
        setMessage(error.message || 'ログインに失敗しました。')
      },
      newPasswordRequired: () => {
        setStatus('error')
        setMessage('初回パスワード変更が必要なユーザーです。')
      },
    })
  }

  const statusClassName = `status status-${status}`

  return (
    <main className="shell">
      <section className="intro-panel">
        <p className="eyebrow">Local Cognito Lab</p>
        <h1>React から local Cognito へログインする</h1>
        <p className="lede">
          `amazon-cognito-identity-js` を使って、Vite の開発サーバー経由で
          `cognito-local` に直接ログインします。
        </p>

        <dl className="config-list">
          <div>
            <dt>Endpoint</dt>
            <dd>{config.endpoint}</dd>
          </div>
          <div>
            <dt>User Pool</dt>
            <dd>{config.userPoolId}</dd>
          </div>
          <div>
            <dt>App Client</dt>
            <dd>{config.clientId}</dd>
          </div>
        </dl>

        <div className={statusClassName}>{message}</div>
      </section>

      <section className="card-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="card-head">
            <p className="card-kicker">Step 1</p>
            <h2>テストユーザーでサインイン</h2>
          </div>

          <label>
            <span>Email</span>
            <input
              name="username"
              type="email"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              disabled={status === 'submitting'}
            />
          </label>

          <label>
            <span>Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              disabled={status === 'submitting'}
            />
          </label>

          <button type="submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <section className="result-card">
          <div className="card-head">
            <p className="card-kicker">Step 2</p>
            <h2>取得したトークンを確認</h2>
          </div>

          <p className="result-text">
            ログインに成功すると `id_token` のクレームと各トークン文字列を表示します。
          </p>

          {tokens ? (
            <>
              <div className="token-block">
                <h3>ID Token Claims</h3>
                <pre>{JSON.stringify(tokens.idTokenClaims, null, 2)}</pre>
              </div>
              <div className="token-block">
                <h3>Access Token</h3>
                <textarea readOnly value={tokens.accessToken} rows={6} />
              </div>
              <div className="token-block">
                <h3>ID Token</h3>
                <textarea readOnly value={tokens.idToken} rows={6} />
              </div>
              <div className="token-block">
                <h3>Refresh Token</h3>
                <textarea readOnly value={tokens.refreshToken} rows={4} />
              </div>
            </>
          ) : (
            <div className="placeholder">
              まだトークンはありません。左のフォームからログインしてください。
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
