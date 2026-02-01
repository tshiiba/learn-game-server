package main

import "fmt"

func main(){
	added := add(3, 5)
	fmt.Println("3 + 5 =", added)
}

func add(x int, y int) int {
	return x + y
}