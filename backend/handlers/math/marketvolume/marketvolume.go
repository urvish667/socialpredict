package marketvolume

import "socialpredict/models"

// GetMarketVolume returns the raw sum of bet amounts for a market.
func GetMarketVolume(bets []models.Bet) int64 {
	var totalVolume int64
	for _, bet := range bets {
		totalVolume += bet.Amount
	}
	return totalVolume
}
