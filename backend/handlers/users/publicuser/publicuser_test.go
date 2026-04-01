package publicuser

import (
	"socialpredict/models"
	"socialpredict/models/modelstesting"

	"testing"
)

func TestGetPublicUserInfo(t *testing.T) {

	db := modelstesting.NewFakeDB(t)

	user := models.User{
		PublicUser: models.PublicUser{
			Username:              "testuser",
			DisplayName:           "Test User",
			UserType:              "regular",
			InitialAccountBalance: 1000,
			AccountBalance:        500,
		},
		PrivateUser: models.PrivateUser{
			Email:    "testuser@example.com",
			APIKey:   "whatever123",
			Password: "whatever123",
		},
	}

	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("Failed to save user to database: %v", err)
	}

	retrievedUser := GetPublicUserInfo(db, "testuser")

	expectedUser := models.PublicUser{
		Username:              "testuser",
		DisplayName:           "Test User",
		UserType:              "regular",
		InitialAccountBalance: 1000,
		AccountBalance:        500,
	}

	if retrievedUser != expectedUser {
		t.Errorf("GetPublicUserInfo(db, 'testuser') = %+v, want %+v", retrievedUser, expectedUser)
	}
}
