package auth

import (
	"context"
	"fmt"
	"strings"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

type claimsContextKey struct{}

func NewUnaryAuthInterceptor(verifier *Verifier) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		if strings.HasPrefix(info.FullMethod, "/grpc.reflection.") {
			return handler(ctx, req)
		}

		token, err := bearerTokenFromContext(ctx)
		if err != nil {
			return nil, status.Error(codes.Unauthenticated, err.Error())
		}

		claims, err := verifier.VerifyTokenString(ctx, token)
		if err != nil {
			return nil, status.Error(codes.Unauthenticated, err.Error())
		}

		ctx = context.WithValue(ctx, claimsContextKey{}, claims)
		return handler(ctx, req)
	}
}

func ClaimsFromContext(ctx context.Context) (*Claims, bool) {
	claims, ok := ctx.Value(claimsContextKey{}).(*Claims)
	return claims, ok
}

func bearerTokenFromContext(ctx context.Context) (string, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return "", fmt.Errorf("missing request metadata")
	}

	headers := md.Get("authorization")
	if len(headers) == 0 {
		return "", fmt.Errorf("missing authorization header")
	}

	parts := strings.SplitN(headers[0], " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || strings.TrimSpace(parts[1]) == "" {
		return "", fmt.Errorf("authorization header must use Bearer token")
	}

	return strings.TrimSpace(parts[1]), nil
}
