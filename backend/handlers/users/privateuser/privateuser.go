package privateuser

import (
	"encoding/json"
	"net/http"
	"socialpredict/handlers/users/publicuser"
	"socialpredict/middleware"
	"socialpredict/models"
	"socialpredict/util"
)

type CombinedUserResponse struct {
	// Private fields
	models.PrivateUser
	// Public fields
	Username              string `json:"username"`
	DisplayName           string `json:"displayname"`
	FullName              string `json:"fullName"`
	DateOfBirth           string `json:"dateOfBirth"`
	Gender                string `json:"gender"`
	StreetAddress         string `json:"streetAddress"`
	Country               string `json:"country"`
	State                 string `json:"state"`
	City                  string `json:"city"`
	PostalCode            string `json:"postalCode"`
	Role                  string `json:"role"`
	UserType              string `json:"usertype"`
	IsVerified            bool   `json:"isVerified"`
	InitialAccountBalance int64  `json:"initialAccountBalance"`
	VirtualBalance        int64  `json:"virtualBalance"`
	RealBalance           int64  `json:"realBalance"`
	ReferralCode          string `json:"referralCode"`
	CurrentStreak         int    `json:"currentStreak"`
}

func GetPrivateProfileUserResponse(w http.ResponseWriter, r *http.Request) {
	// Use database connection
	db := util.GetDB()

	// Validate the token and get the user
	user, httperr := middleware.ValidateTokenAndGetUser(r, db)
	if httperr != nil {
		http.Error(w, "Invalid token: "+httperr.Error(), http.StatusUnauthorized)
		return
	}

	// The username is extracted from the token
	username := user.Username

	// Just-in-time generation of referral code for existing users who don't have one
	if user.ReferralCode == "" {
		code, err := models.GenerateUniqueReferralCode(db)
		if err == nil {
			user.ReferralCode = code
			db.Save(&user)
		}
	}

	publicInfo := publicuser.GetPublicUserInfo(db, username)

	response := CombinedUserResponse{
		// Private fields
		PrivateUser: user.PrivateUser,
		// Public fields
		Username:              publicInfo.Username,
		DisplayName:           publicInfo.DisplayName,
		FullName:              publicInfo.FullName,
		DateOfBirth:           publicInfo.DateOfBirth,
		Gender:                publicInfo.Gender,
		StreetAddress:         publicInfo.StreetAddress,
		Country:               publicInfo.Country,
		State:                 publicInfo.State,
		City:                  publicInfo.City,
		PostalCode:            publicInfo.PostalCode,
		Role:                  user.Role,
		UserType:              user.Role,
		IsVerified:            user.IsVerified,
		InitialAccountBalance: publicInfo.InitialAccountBalance,
		VirtualBalance:        publicInfo.VirtualBalance,
		RealBalance:           publicInfo.RealBalance,
		ReferralCode:          publicInfo.ReferralCode,
		CurrentStreak:         publicInfo.CurrentStreak,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
