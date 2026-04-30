package adminhandlers

import (
	"encoding/json"
	"net/http"
	"socialpredict/models"
	"socialpredict/util"
	"strconv"

	"github.com/gorilla/mux"
)

// ListUsersHandler returns a filtered list of all users
func ListUsersHandler(w http.ResponseWriter, r *http.Request) {
	db := util.GetDB()
	var users []models.User

	query := db.Model(&models.User{})

	// Filters
	if verified := r.URL.Query().Get("verified"); verified != "" {
		v, _ := strconv.ParseBool(verified)
		query = query.Where("is_verified = ?", v)
	}
	if role := r.URL.Query().Get("role"); role != "" {
		query = query.Where("role = ?", role)
	}
	if banned := r.URL.Query().Get("banned"); banned != "" {
		b, _ := strconv.ParseBool(banned)
		query = query.Where("is_banned = ?", b)
	}

	if err := query.Find(&users).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

// GetUserDetailHandler returns full details of a specific user
func GetUserDetailHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]
	db := util.GetDB()

	var user models.User
	if err := db.Where("username = ?", username).First(&user).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// UpdateUserRoleHandler promotes or demotes a user
func UpdateUserRoleHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]
	db := util.GetDB()

	var input struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if input.Role != models.RoleAdmin && input.Role != models.RoleUser {
		http.Error(w, "Invalid role", http.StatusBadRequest)
		return
	}

	if err := db.Model(&models.User{}).Where("username = ?", username).Update("role", input.Role).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// UpdateUserBanHandler bans or unbans a user
func UpdateUserBanHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]
	db := util.GetDB()

	var input struct {
		IsBanned bool `json:"isBanned"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if err := db.Model(&models.User{}).Where("username = ?", username).Update("is_banned", input.IsBanned).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// ListMarketsHandler returns all markets with optional filters
func ListMarketsHandler(w http.ResponseWriter, r *http.Request) {
	db := util.GetDB()
	var markets []models.Market

	query := db.Model(&models.Market{})

	if status := r.URL.Query().Get("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Find(&markets).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(markets)
}

// DeleteMarketHandler removes a market (abusive content)
func DeleteMarketHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	marketID := vars["id"]
	db := util.GetDB()

	if err := db.Delete(&models.Market{}, marketID).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ListBetsHandler returns a global audit log of all bets
func ListBetsHandler(w http.ResponseWriter, r *http.Request) {
	db := util.GetDB()
	var bets []models.Bet

	if err := db.Order("placed_at desc").Limit(100).Find(&bets).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bets)
}

// ExtendedHealthHandler provides more detailed system metrics
func ExtendedHealthHandler(w http.ResponseWriter, r *http.Request) {
	db := util.GetDB()
	
	var userCount int64
	var marketCount int64
	var betCount int64

	db.Model(&models.User{}).Count(&userCount)
	db.Model(&models.Market{}).Count(&marketCount)
	db.Model(&models.Bet{}).Count(&betCount)

	health := map[string]interface{}{
		"status": "ok",
		"stats": map[string]int64{
			"total_users":   userCount,
			"total_markets": marketCount,
			"total_bets":    betCount,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(health)
}
