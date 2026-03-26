package auth

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"math/big"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestVerifyTokenString(t *testing.T) {
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate private key: %v", err)
	}

	issuer := "http://issuer.example.local/pool"
	clientID := "local-client-id"
	kid := "test-key"

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"keys": []map[string]string{buildJWK(kid, &privateKey.PublicKey)},
		})
	}))
	defer server.Close()

	verifier, err := NewVerifier(Config{
		Issuer:   issuer,
		JWKSURL:  server.URL,
		ClientID: clientID,
	})
	if err != nil {
		t.Fatalf("new verifier: %v", err)
	}

	t.Run("accepts valid access token", func(t *testing.T) {
		token := signToken(t, privateKey, kid, jwt.MapClaims{
			"iss":       issuer,
			"sub":       "user-123",
			"client_id": clientID,
			"token_use": "access",
			"scope":     "admin",
			"exp":       time.Now().Add(5 * time.Minute).Unix(),
			"iat":       time.Now().Add(-1 * time.Minute).Unix(),
		})

		claims, err := verifier.VerifyTokenString(context.Background(), token)
		if err != nil {
			t.Fatalf("verify token: %v", err)
		}

		if claims.ClientID != clientID {
			t.Fatalf("client id = %q, want %q", claims.ClientID, clientID)
		}
		if claims.TokenUse != "access" {
			t.Fatalf("token use = %q, want access", claims.TokenUse)
		}
	})

	t.Run("rejects wrong issuer", func(t *testing.T) {
		token := signToken(t, privateKey, kid, jwt.MapClaims{
			"iss":       "http://other-issuer",
			"sub":       "user-123",
			"client_id": clientID,
			"token_use": "access",
			"exp":       time.Now().Add(5 * time.Minute).Unix(),
			"iat":       time.Now().Add(-1 * time.Minute).Unix(),
		})

		if _, err := verifier.VerifyTokenString(context.Background(), token); err == nil {
			t.Fatal("expected issuer validation error")
		}
	})

	t.Run("rejects wrong audience", func(t *testing.T) {
		token := signToken(t, privateKey, kid, jwt.MapClaims{
			"iss":       issuer,
			"sub":       "user-123",
			"aud":       clientID + "-other",
			"token_use": "id",
			"exp":       time.Now().Add(5 * time.Minute).Unix(),
			"iat":       time.Now().Add(-1 * time.Minute).Unix(),
		})

		if _, err := verifier.VerifyTokenString(context.Background(), token); err == nil {
			t.Fatal("expected audience validation error")
		}
	})
}

func buildJWK(kid string, publicKey *rsa.PublicKey) map[string]string {
	return map[string]string{
		"kty": "RSA",
		"kid": kid,
		"use": "sig",
		"alg": "RS256",
		"n":   base64.RawURLEncoding.EncodeToString(publicKey.N.Bytes()),
		"e":   base64.RawURLEncoding.EncodeToString(big.NewInt(int64(publicKey.E)).Bytes()),
	}
}

func signToken(t *testing.T, privateKey *rsa.PrivateKey, kid string, claims jwt.MapClaims) string {
	t.Helper()

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	token.Header["kid"] = kid

	signed, err := token.SignedString(privateKey)
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}

	return signed
}
