package auth

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Config struct {
	Enabled  bool
	Issuer   string
	JWKSURL  string
	ClientID string
}

type Claims struct {
	jwt.RegisteredClaims
	ClientID string `json:"client_id,omitempty"`
	TokenUse string `json:"token_use,omitempty"`
	Username string `json:"cognito:username,omitempty"`
	Scope    string `json:"scope,omitempty"`
}

type Verifier struct {
	issuer     string
	jwksURL    string
	clientID   string
	httpClient *http.Client

	mu   sync.RWMutex
	keys map[string]*rsa.PublicKey
}

type jwksDocument struct {
	Keys []jwkKey `json:"keys"`
}

type jwkKey struct {
	Kty string `json:"kty"`
	Kid string `json:"kid"`
	Use string `json:"use"`
	Alg string `json:"alg"`
	N   string `json:"n"`
	E   string `json:"e"`
}

func LoadConfigFromEnv() Config {
	issuer := getenv("COGNITO_ISSUER", "http://localhost:9229/local_7Bsq4uKe")
	jwksURL := getenv("COGNITO_JWKS_URL", issuer+"/.well-known/jwks.json")

	return Config{
		Enabled:  strings.EqualFold(os.Getenv("COGNITO_AUTH_ENABLED"), "true"),
		Issuer:   issuer,
		JWKSURL:  jwksURL,
		ClientID: getenv("COGNITO_CLIENT_ID", "2esekcy0c1amp6057k4k4l81k"),
	}
}

func NewVerifier(config Config) (*Verifier, error) {
	if config.Issuer == "" {
		return nil, fmt.Errorf("issuer is required")
	}
	if config.JWKSURL == "" {
		return nil, fmt.Errorf("jwks url is required")
	}
	if config.ClientID == "" {
		return nil, fmt.Errorf("client id is required")
	}

	return &Verifier{
		issuer:   config.Issuer,
		jwksURL:  config.JWKSURL,
		clientID: config.ClientID,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
		keys: make(map[string]*rsa.PublicKey),
	}, nil
}

func (v *Verifier) VerifyTokenString(ctx context.Context, rawToken string) (*Claims, error) {
	claims := &Claims{}
	parsedToken, err := jwt.ParseWithClaims(rawToken, claims, v.keyFunc(ctx), jwt.WithValidMethods([]string{"RS256"}), jwt.WithIssuer(v.issuer))
	if err != nil {
		return nil, fmt.Errorf("verify jwt: %w", err)
	}
	if !parsedToken.Valid {
		return nil, fmt.Errorf("verify jwt: token is invalid")
	}
	if !claims.matchesClientID(v.clientID) {
		return nil, fmt.Errorf("verify jwt: token audience does not match client id")
	}
	if claims.TokenUse != "access" && claims.TokenUse != "id" {
		return nil, fmt.Errorf("verify jwt: unsupported token_use %q", claims.TokenUse)
	}

	return claims, nil
}

func (v *Verifier) keyFunc(ctx context.Context) jwt.Keyfunc {
	return func(token *jwt.Token) (any, error) {
		kid, _ := token.Header["kid"].(string)
		if kid == "" {
			return nil, fmt.Errorf("verify jwt: missing key id")
		}

		if key, ok := v.getKey(kid); ok {
			return key, nil
		}

		if err := v.refreshKeys(ctx); err != nil {
			return nil, err
		}

		key, ok := v.getKey(kid)
		if !ok {
			return nil, fmt.Errorf("verify jwt: jwks key %q not found", kid)
		}

		return key, nil
	}
}

func (v *Verifier) getKey(kid string) (*rsa.PublicKey, bool) {
	v.mu.RLock()
	defer v.mu.RUnlock()

	key, ok := v.keys[kid]
	return key, ok
}

func (v *Verifier) refreshKeys(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, v.jwksURL, nil)
	if err != nil {
		return fmt.Errorf("build jwks request: %w", err)
	}

	resp, err := v.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("fetch jwks: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("fetch jwks: unexpected status %d", resp.StatusCode)
	}

	var document jwksDocument
	if err := json.NewDecoder(resp.Body).Decode(&document); err != nil {
		return fmt.Errorf("decode jwks: %w", err)
	}

	keys := make(map[string]*rsa.PublicKey, len(document.Keys))
	for _, key := range document.Keys {
		if key.Kty != "RSA" || key.Kid == "" {
			continue
		}

		publicKey, err := decodeRSAPublicKey(key)
		if err != nil {
			return fmt.Errorf("decode jwks key %q: %w", key.Kid, err)
		}

		keys[key.Kid] = publicKey
	}

	v.mu.Lock()
	v.keys = keys
	v.mu.Unlock()

	return nil
}

func decodeRSAPublicKey(key jwkKey) (*rsa.PublicKey, error) {
	modulusBytes, err := base64.RawURLEncoding.DecodeString(key.N)
	if err != nil {
		return nil, fmt.Errorf("decode modulus: %w", err)
	}

	exponentBytes, err := base64.RawURLEncoding.DecodeString(key.E)
	if err != nil {
		return nil, fmt.Errorf("decode exponent: %w", err)
	}

	modulus := new(big.Int).SetBytes(modulusBytes)
	exponent := new(big.Int).SetBytes(exponentBytes)
	if exponent.Sign() <= 0 {
		return nil, fmt.Errorf("invalid exponent")
	}

	return &rsa.PublicKey{
		N: modulus,
		E: int(exponent.Int64()),
	}, nil
}

func (c *Claims) matchesClientID(clientID string) bool {
	if c.ClientID == clientID {
		return true
	}

	for _, audience := range c.Audience {
		if audience == clientID {
			return true
		}
	}

	return false
}

func getenv(name, fallback string) string {
	value := strings.TrimSpace(os.Getenv(name))
	if value == "" {
		return fallback
	}

	return value
}
