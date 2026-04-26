package main

import (
	"fmt"
	"log"
	"socialpredict/models"
	"socialpredict/util"
)

func main() {
	if err := util.GetEnv(); err != nil {
		log.Printf("env: warning loading environment: %v", err)
	}

	util.InitDB()
	db := util.GetDB()

	var user models.User
	result := db.Where("username = ?", "admin").First(&user)
	if result.Error != nil {
		fmt.Printf("Admin user not found: %v\n", result.Error)
		return
	}

	user.IsVerified = true
	user.UserType = "ADMIN"
	user.Role = "ADMIN"
	db.Save(&user)
	fmt.Println("Admin user verified and role set to ADMIN successfully")
}
