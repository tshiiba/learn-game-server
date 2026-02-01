package main

import "testing"

func TestAdd(t *testing.T) {
	tests := []struct {
		name     string
		x        int
		y        int
		expected int
	}{
		{"positive numbers", 3, 5, 8},
		{"negative numbers", -3, -5, -8},
		{"mixed numbers", 10, -5, 5},
		{"with zero", 5, 0, 5},
		{"zero with zero", 0, 0, 0},
		{"large numbers", 1000000, 2000000, 3000000},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := add(tt.x, tt.y)
			if result != tt.expected {
				t.Errorf("add(%d, %d) = %d; want %d", tt.x, tt.y, result, tt.expected)
			}
		})
	}
}
