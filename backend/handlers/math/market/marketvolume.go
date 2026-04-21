package marketmath

import (
	"log"
	rawvolume "socialpredict/handlers/math/marketvolume"
	"socialpredict/models"
	"socialpredict/setup"
)

// appConfig holds the loaded application configuration accessible within the package
var appConfig *setup.EconomicConfig

func init() {
	// Load configuration
	var err error
	appConfig, err = setup.LoadEconomicsConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}
}

// getMarketVolume returns the total volume of trades for a given market
func GetMarketVolume(bets []models.Bet) int64 {
	return rawvolume.GetMarketVolume(bets)
}

// returns the market volume + subsidization added into pool,
// subsidzation in pool could be paid out after resolution but not sold mid-market
func GetEndMarketVolume(bets []models.Bet) int64 {

	return GetMarketVolume(bets) + appConfig.Economics.MarketCreation.InitialMarketSubsidization

}
