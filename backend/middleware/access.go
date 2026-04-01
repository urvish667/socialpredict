package middleware

import "socialpredict/models"

type OwnedResource interface {
	GetOwnerID() int64
}

func IsAdmin(user *models.User) bool {
	return user != nil && user.Role == models.RoleAdmin
}

func IsOwner(user *models.User, resource OwnedResource) bool {
	return user != nil && resource != nil && user.ID == resource.GetOwnerID()
}

func CanResolveMarket(user *models.User) bool {
	return IsAdmin(user)
}

func CanSuggestMarketResolution(user *models.User, market *models.Market) bool {
	if user == nil || market == nil {
		return false
	}
	if market.CreatorID != 0 {
		return IsOwner(user, market)
	}
	return market.CreatorUsername == user.Username
}
