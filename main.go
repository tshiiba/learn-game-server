package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	adminv1 "github.com/tshiiba/learn-game-server/gen/go/admin/v1"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {
	addr := os.Getenv("GRPC_ADDR")
	if addr == "" {
		addr = ":50051"
	}

	lis, err := net.Listen("tcp", addr)
	if err != nil {
		log.Fatalf("failed to listen on %s: %v", addr, err)
	}

	grpcServer := grpc.NewServer()
	adminv1.RegisterSampleServiceServer(grpcServer, &sampleService{})
	reflection.Register(grpcServer)

	errCh := make(chan error, 1)
	go func() {
		log.Printf("gRPC server listening on %s", addr)
		errCh <- grpcServer.Serve(lis)
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-sigCh:
		log.Printf("received signal %s; shutting down", sig)
		stopWithTimeout(grpcServer, 5*time.Second)
	case err := <-errCh:
		log.Fatalf("gRPC server stopped: %v", err)
	}
}

type sampleService struct {
	adminv1.UnimplementedSampleServiceServer
}

func (s *sampleService) Hello(ctx context.Context, req *adminv1.HelloRequest) (*adminv1.HelloResponse, error) {
	name := req.GetName()
	if name == "" {
		name = "world"
	}
	return &adminv1.HelloResponse{Message: fmt.Sprintf("Hello, %s", name)}, nil
}

func stopWithTimeout(s *grpc.Server, timeout time.Duration) {
	done := make(chan struct{})
	go func() {
		s.GracefulStop()
		close(done)
	}()

	select {
	case <-done:
		return
	case <-time.After(timeout):
		s.Stop()
		return
	}
}

func add(x int, y int) int {
	return x + y
}
