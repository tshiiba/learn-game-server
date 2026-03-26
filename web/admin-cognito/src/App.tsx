import { useState, type FormEvent } from 'react'
import { cognitoConfig } from './config'
import { signIn, type SignInResult } from './auth/localCognitoAuth'
import './App.css'

function App() {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed.'
      setErrorMessage(message)
      setResult(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Local Cognito Verification</p>
        <h1>SDK v3 で local Cognito に直接サインインする</h1>
        <p className="lead">
          `cognito-local` に対して `USER_PASSWORD_AUTH` を実行し、返却 token をそのまま確認します。
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

      <section className="surface">
        <div className="surface-header">
          <div>
            <p className="section-label">Sign In</p>
            <h2>Test user で認証確認</h2>
          </div>
          <span className="status-pill">{isSubmitting ? 'Authenticating' : 'Ready'}</span>
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
            {isSubmitting ? 'Signing in...' : 'Sign in with SDK v3'}
          </button>
        </form>

        {errorMessage ? (
          <div className="message error" role="alert">
            {errorMessage}
          </div>
        ) : null}

        {result ? (
          <div className="result-stack">
            <div className="message success">Authentication succeeded.</div>

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
          <div className="empty-state">
            Sign in が成功すると token がここに表示されます。
          </div>
        )}
      </section>
    </main>
  )
}

export default App
