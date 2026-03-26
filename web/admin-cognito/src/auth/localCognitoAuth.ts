import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { cognitoConfig } from '../config'

type SignInParams = {
  username: string
  password: string
}

export type SignInResult = {
  accessToken: string
  idToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
}

const client = new CognitoIdentityProviderClient({
  endpoint: cognitoConfig.endpoint,
  region: cognitoConfig.region,
})

export async function signIn({ username, password }: SignInParams): Promise<SignInResult> {
  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: cognitoConfig.clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  })

  try {
    const response = await client.send(command)
    const authenticationResult = response.AuthenticationResult

    if (
      !authenticationResult?.AccessToken ||
      !authenticationResult.IdToken ||
      !authenticationResult.RefreshToken ||
      !authenticationResult.ExpiresIn ||
      !authenticationResult.TokenType
    ) {
      throw new Error('Cognito returned an incomplete authentication result.')
    }

    return {
      accessToken: authenticationResult.AccessToken,
      idToken: authenticationResult.IdToken,
      refreshToken: authenticationResult.RefreshToken,
      expiresIn: authenticationResult.ExpiresIn,
      tokenType: authenticationResult.TokenType,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(normalizeErrorMessage(error))
    }

    throw new Error('Unexpected authentication error.')
  }
}

function normalizeErrorMessage(error: Error) {
  switch (error.name) {
    case 'NotAuthorizedException':
      return 'Invalid email or password.'
    case 'UserNotFoundException':
      return 'The user does not exist in the local user pool.'
    case 'InvalidParameterException':
      return 'Cognito request parameters are invalid. Check App Client settings.'
    default:
      return error.message
    }
}
