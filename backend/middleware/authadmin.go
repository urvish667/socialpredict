package middleware

import (
	"net/http"
	"gorm.io/gorm"
)

// ValidateAdminToken checks if the authenticated user is an admin
// It returns error if not an admin or if any validation fails
func ValidateAdminToken(r *http.Request, db *gorm.DB) error {
	user, httpErr := ValidateVerifiedTokenAndGetUser(r, db)
	if httpErr != nil {
		return httpErr
	}

	if user.MustChangePassword {
		return &HTTPError{StatusCode: http.StatusForbidden, Message: "Password change required"}
	}

	if !IsAdmin(user) {
		return &HTTPError{StatusCode: http.StatusForbidden, Message: "Admin access required"}
	}

	return nil
}
