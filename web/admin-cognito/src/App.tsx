import { useState, type FormEvent } from 'react'
import { cognitoConfig } from './config'
import { signIn, type SignInResult } from './auth/localCognitoAuth'
import './App.css'

function App() {
  const [screen, setScreen] = useState<'login' | 'dashboard'>('login')
  const [email, setEmail] = useState('test-user@example.com')
  const [password, setPassword] = useState('TestPass123!')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [result, setResult] = useState<SignInResult | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const nextResult = await signIn({ username: email, password })
      setResult(nextResult)
      setScreen('dashboard')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed.'
      setErrorMessage(message)
      setResult(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignOut = () => {
    setScreen('login')
    setResult(null)
    setErrorMessage(null)
    setPassword('')
  }

  return (
    <main className="app-shell">
      {screen === 'login' ? (
        <>
          <section className="hero-panel hero-panel-login">
            <p className="eyebrow">Admin Entry</p>
            <h1>管理画面に入る前に local Cognito でログインする</h1>
            <p className="lead">
              admin-cognito の起動直後はこのログイン画面を表示し、認証が成功したときだけ
              管理画面へ遷移します。
            </p>

            <dl className="config-grid">
              <div>
                <dt>Endpoint</dt>
                <dd>{cognitoConfig.endpoint}</dd>
              </div>
              <div>
                <dt>Region</dt>
                <dd>{cognitoConfig.region}</dd>
              </div>
              <div>
                <dt>User Pool</dt>
                <dd>{cognitoConfig.userPoolId}</dd>
              </div>
              <div>
                <dt>Client ID</dt>
                <dd>{cognitoConfig.clientId}</dd>
              </div>
            </dl>
          </section>

          <section className="surface login-surface">
            <div className="surface-header">
              <div>
                <p className="section-label">Login</p>
                <h2>Test user でサインイン</h2>
              </div>
              <span className="status-pill">{isSubmitting ? 'Authenticating' : 'Awaiting credentials'}</span>
            </div>

            <form className="sign-in-form" onSubmit={handleSubmit}>
              <label>
                <span>Email</span>
                <input
                  autoComplete="username"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="test-user@example.com"
                />
              </label>

              <label>
                <span>Password</span>
                <input
                  autoComplete="current-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="TestPass123!"
                />
              </label>

              <button className="submit-button" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Signing in...' : 'Open admin dashboard'}
              </button>
            </form>

            {errorMessage ? (
              <div className="message error" role="alert">
                {errorMessage}
              </div>
            ) : null}

            <div className="login-note">
              認証成功後は token を確認できる管理画面へ切り替わります。ページ再読み込み時は
              再度ログイン画面から始まります。
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="hero-panel hero-panel-dashboard">
            <p className="eyebrow">Authenticated</p>
            <h1>local Cognito での認証に成功しました</h1>
            <p className="lead">
              ここから access token / id token / refresh token を確認し、他の管理画面や API 検証へ
              使えます。
            </p>

            <div className="dashboard-actions">
              <div className="message success compact-message">Authentication succeeded.</div>
              <button className="secondary-button" onClick={handleSignOut} type="button">
                Sign out
              </button>
            </div>
          </section>

          <section className="surface dashboard-surface">
            <div className="surface-header">
              <div>
                <p className="section-label">Admin Dashboard</p>
                <h2>認証済み token 一覧</h2>
              </div>
              <span className="status-pill">Signed in</span>
            </div>

            {result ? (
              <div className="result-stack">
                <article className="token-card">
                  <div className="token-header">
                    <h3>ID Token</h3>
                    <span>{result.expiresIn}s</span>
                  </div>
                  <pre>{result.idToken}</pre>
                </article>

                <article className="token-card">
                  <div className="token-header">
                    <h3>Access Token</h3>
                    <span>{result.tokenType}</span>
                  </div>
                  <pre>{result.accessToken}</pre>
                </article>

                <article className="token-card">
                  <div className="token-header">
                    <h3>Refresh Token</h3>
                  </div>
                  <pre>{result.refreshToken}</pre>
                </article>
              </div>
            ) : (
              <div className="empty-state">認証結果が見つかりません。もう一度ログインしてください。</div>
            )}
          </section>
        </>
      )}
    </main>
  )
}

export default App
