package marketmath

import (
	"fmt"
	"socialpredict/models"
	"socialpredict/models/modelstesting"
	"testing"
	"time"
)

func TestGetMarketVolumeWithDust(t *testing.T) {
	tests := []struct {
		name             string
		bets             []models.Bet
		expectedBase     int64
		expectedWithDust int64
	}{
		{
			name:             "empty market",
			bets:             []models.Bet{},
			expectedBase:     0,
			expectedWithDust: 0,
		},
		{
			name: "only buy bets - no dust",
			bets: []models.Bet{
				modelstesting.GenerateBet(100, "YES", "user1", 1, 0),
				modelstesting.GenerateBet(200, "NO", "user2", 1, time.Minute),
			},
			expectedBase:     300,
			expectedWithDust: 300, // No sells, so no dust
		},
		{
			name: "mixed buys and sells - with recorded dust",
			bets: []models.Bet{
				modelstesting.GenerateBet(100, "YES", "user1", 1, 0),
				modelstesting.GenerateBet(200, "NO", "user2", 1, time.Minute),
				generateSellBetForDust(-50, 53, "YES", "user1", 1, 2*time.Minute),
				generateSellBetForDust(-75, 76, "NO", "user2", 1, 3*time.Minute),
			},
			expectedBase:     175, // 100 + 200 - 50 - 75
			expectedWithDust: 176, // Base + replayed sell dust
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			baseVolume := GetMarketVolume(test.bets)
			if baseVolume != test.expectedBase {
				t.Errorf("expected base volume %d, got %d", test.expectedBase, baseVolume)
			}

			volumeWithDust := GetMarketVolumeWithDust(test.bets)
			if volumeWithDust != test.expectedWithDust {
				t.Errorf("expected volume with dust %d, got %d", test.expectedWithDust, volumeWithDust)
			}
		})
	}
}

func TestCalculateDustStack(t *testing.T) {
	tests := []struct {
		name         string
		bets         []models.Bet
		expectedDust int64
	}{
		{
			name:         "no bets",
			bets:         []models.Bet{},
			expectedDust: 0,
		},
		{
			name: "only buy bets",
			bets: []models.Bet{
				modelstesting.GenerateBet(100, "YES", "user1", 1, 0),
				modelstesting.GenerateBet(200, "NO", "user2", 1, time.Minute),
			},
			expectedDust: 0,
		},
		{
			name: "only sell bets cannot infer dust without a pre-sale position",
			bets: []models.Bet{
				generateSellBetForDust(-50, 50, "YES", "user1", 1, 0),
				generateSellBetForDust(-75, 75, "NO", "user2", 1, time.Minute),
			},
			expectedDust: 0,
		},
		{
			name: "mixed bets - chronological order matters",
			bets: []models.Bet{
				modelstesting.GenerateBet(100, "YES", "user1", 1, 0),
				generateSellBetForDust(-50, 53, "YES", "user1", 1, time.Minute),
				modelstesting.GenerateBet(200, "NO", "user2", 1, 2*time.Minute),
				generateSellBetForDust(-75, 76, "NO", "user2", 1, 3*time.Minute),
			},
			expectedDust: 3,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			dust := calculateDustStack(test.bets)
			if dust != test.expectedDust {
				t.Errorf("expected dust %d, got %d", test.expectedDust, dust)
			}
		})
	}
}

func TestGetMarketDust(t *testing.T) {
	bets := []models.Bet{
		modelstesting.GenerateBet(100, "YES", "user1", 1, 0),
		generateSellBetForDust(-50, 52, "YES", "user1", 1, time.Minute),
		generateSellBetForDust(-25, 25, "NO", "user2", 1, 2*time.Minute),
	}

	dust := GetMarketDust(bets)
	expectedDust := int64(2)

	if dust != expectedDust {
		t.Errorf("expected dust %d, got %d", expectedDust, dust)
	}
}

func TestCalculateDustForSell(t *testing.T) {
	sellBet := generateSellBetForDust(-50, 52, "YES", "user1", 1, time.Minute)
	buyBet := modelstesting.GenerateBet(100, "YES", "user1", 1, 0)

	allBets := []models.Bet{buyBet, sellBet}

	dust := calculateDustForSell(sellBet, allBets)
	if dust != 2 {
		t.Errorf("expected 2 dust for sell bet, got %d", dust)
	}

	dust = calculateDustForSell(buyBet, allBets)
	if dust != 0 {
		t.Errorf("expected 0 dust for buy bet, got %d", dust)
	}

	legacySellBet := modelstesting.GenerateBet(-50, "YES", "user1", 1, 2*time.Minute)
	dust = calculateDustForSell(legacySellBet, []models.Bet{buyBet, legacySellBet})
	if dust != 0 {
		t.Errorf("expected 0 dust when requested credits are not recorded, got %d", dust)
	}
}

func TestCurrencyConservationInvariant(t *testing.T) {
	// Test that GetMarketVolumeWithDust always returns >= GetMarketVolume
	testCases := [][]models.Bet{
		{}, // Empty
		{modelstesting.GenerateBet(100, "YES", "user1", 1, 0)}, // Only buys
		{modelstesting.GenerateBet(-50, "YES", "user1", 1, 0)}, // Only sells
		{ // Mixed
			modelstesting.GenerateBet(100, "YES", "user1", 1, 0),
			modelstesting.GenerateBet(-50, "YES", "user1", 1, time.Minute),
			modelstesting.GenerateBet(200, "NO", "user2", 1, 2*time.Minute),
			modelstesting.GenerateBet(-75, "NO", "user2", 1, 3*time.Minute),
		},
	}

	for i, bets := range testCases {
		t.Run(fmt.Sprintf("invariant_test_%d", i), func(t *testing.T) {
			baseVolume := GetMarketVolume(bets)
			volumeWithDust := GetMarketVolumeWithDust(bets)

			if volumeWithDust < baseVolume {
				t.Errorf("currency conservation violated: volumeWithDust (%d) < baseVolume (%d)",
					volumeWithDust, baseVolume)
			}

			// Dust should be non-negative
			dust := volumeWithDust - baseVolume
			if dust < 0 {
				t.Errorf("dust cannot be negative, got %d", dust)
			}
		})
	}
}

func generateSellBetForDust(amount, requestedAmount int64, outcome, username string, marketID uint, offset time.Duration) models.Bet {
	bet := modelstesting.GenerateBet(amount, outcome, username, marketID, offset)
	bet.RequestedAmount = requestedAmount
	return bet
}
