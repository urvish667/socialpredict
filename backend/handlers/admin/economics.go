package adminhandlers

import (
	"encoding/json"
	"net/http"
	"socialpredict/setup"
)

// GetEconomicsHandler returns the current economic configuration
func GetEconomicsHandler(w http.ResponseWriter, r *http.Request) {
	config := setup.EconomicsConfig()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(config)
}

// UpdateEconomicsHandler updates the economic configuration
func UpdateEconomicsHandler(w http.ResponseWriter, r *http.Request) {
	var newConfig setup.EconomicConfig
	if err := json.NewDecoder(r.Body).Decode(&newConfig); err != nil {
		http.Error(w, "Invalid input: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Basic validation (can be expanded)
	if newConfig.Economics.MarketCreation.MinTradesRequired < 0 {
		http.Error(w, "Min trades required cannot be negative", http.StatusBadRequest)
		return
	}
	if newConfig.Economics.MarketIncentives.CreateMarketCost < 0 {
		http.Error(w, "Create market cost cannot be negative", http.StatusBadRequest)
		return
	}
	if newConfig.Economics.MarketCreation.MinAccountAgeDays < 0 {
		http.Error(w, "Min account age cannot be negative", http.StatusBadRequest)
		return
	}
	if newConfig.Economics.MarketCreation.MaxMarketsPerDay < 1 {
		http.Error(w, "Max markets per day must be at least 1", http.StatusBadRequest)
		return
	}

	setup.UpdateEconomicsConfig(&newConfig)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Economic configuration updated successfully"})
}
