type CognitoConfig = {
  endpoint: string
  region: string
  userPoolId: string
  clientId: string
}

function readEnv(name: keyof ImportMetaEnv, fallback: string) {
  const value = import.meta.env[name]
  if (typeof value === 'string' && value.trim() !== '') {
    return value
  }

  return fallback
}

export const cognitoConfig: CognitoConfig = {
  endpoint: readEnv('VITE_COGNITO_ENDPOINT', '/cognito'),
  region: readEnv('VITE_COGNITO_REGION', 'ap-northeast-1'),
  userPoolId: readEnv('VITE_COGNITO_USER_POOL_ID', 'local_7Bsq4uKe'),
  clientId: readEnv('VITE_COGNITO_CLIENT_ID', '2esekcy0c1amp6057k4k4l81k'),
}
