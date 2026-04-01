package betutils

import (
	"errors"
	"fmt"
	"socialpredict/models"

	"gorm.io/gorm"
)

func ValidateBuy(db *gorm.DB, bet *models.Bet) error {
	var user models.User
	var market models.Market

	// Check if username exists
	if err := db.First(&user, "username = ?", bet.Username).Error; err != nil {
		return errors.New("invalid username")
	}

	// Check if market exists and is open
	if err := db.First(&market, "id = ? AND is_resolved = false", bet.MarketID).Error; err != nil {
		return errors.New("invalid or closed market")
	}

	// Check for valid amount: it should be greater than or equal to 1
	if bet.Amount < 1 {
		return errors.New("Buy amount must be greater than or equal to 1")
	}

	// Validate bet outcome based on market type
	if err := validateOutcome(db, &market, bet.Outcome); err != nil {
		return err
	}

	return nil
}

func ValidateSale(db *gorm.DB, bet *models.Bet) error {
	var user models.User
	var market models.Market

	// Check if username exists
	if err := db.First(&user, "username = ?", bet.Username).Error; err != nil {
		return errors.New("invalid username")
	}

	// Check if market exists and is open
	if err := db.First(&market, "id = ? AND is_resolved = false", bet.MarketID).Error; err != nil {
		return errors.New("invalid or closed market")
	}

	// Check for valid amount: it should be less than or equal to -1
	if bet.Amount > -1 {
		return errors.New("Sale amount must be greater than or equal to 1")
	}

	// Validate bet outcome based on market type
	if err := validateOutcome(db, &market, bet.Outcome); err != nil {
		return err
	}

	return nil
}

// validateOutcome checks that the bet outcome is valid for the given market.
// For BINARY markets: must be YES or NO.
// For MULTIPLE_CHOICE markets: must match one of the market's option labels.
func validateOutcome(db *gorm.DB, market *models.Market, outcome string) error {
	if market.OutcomeType == models.OutcomeTypeMultipleChoice {
		// Lookup valid options from the database
		var options []models.MarketOption
		if err := db.Where("market_id = ?", market.ID).Find(&options).Error; err != nil {
			return errors.New("failed to fetch market options")
		}
		for _, opt := range options {
			if opt.Label == outcome {
				return nil
			}
		}
		return fmt.Errorf("invalid outcome '%s' for this market", outcome)
	}

	// Binary market: only YES or NO
	if outcome != "YES" && outcome != "NO" {
		return errors.New("bet outcome must be 'YES' or 'NO'")
	}
	return nil
}
