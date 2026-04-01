package migrations

import (
	"fmt"
	"log"
	"math/rand"
	"regexp"
	"strings"
	"time"

	"socialpredict/logger"
	"socialpredict/migration"
	"socialpredict/models"

	"gorm.io/gorm"
)

func init() {
	err := migration.Register("20260330060001", func(db *gorm.DB) error {
		// 1. Ensure schema is up to date
		if err := db.AutoMigrate(&models.Market{}, &models.MarketOption{}); err != nil {
			return fmt.Errorf("auto-migrate failed: %w", err)
		}

		// 2. Backfill slugs for existing markets that have no slug
		var markets []models.Market
		if err := db.Where("slug IS NULL OR slug = ''").Find(&markets).Error; err != nil {
			return fmt.Errorf("failed to fetch markets for slug backfill: %w", err)
		}

		rng := rand.New(rand.NewSource(time.Now().UnixNano()))

		for _, m := range markets {
			slug := generateMigrationSlug(m.QuestionTitle, rng)
			if err := db.Model(&m).Update("slug", slug).Error; err != nil {
				return fmt.Errorf("failed to set slug for market %d: %w", m.ID, err)
			}
			log.Printf("migration - backfilled slug '%s' for market %d", slug, m.ID)
		}

		// 3. Create MarketOption records for existing binary markets that don't have options yet
		var marketsWithoutOptions []models.Market
		if err := db.Where("id NOT IN (SELECT DISTINCT market_id FROM market_options)").Find(&marketsWithoutOptions).Error; err != nil {
			// Table might not exist yet if this is the first run — that's okay, AutoMigrate above should have created it
			log.Printf("migration - note: could not check for markets without options (table may be new): %v", err)
			marketsWithoutOptions = markets // Fallback: process all markets
		}

		for _, m := range marketsWithoutOptions {
			yesLabel := m.YesLabel
			if yesLabel == "" {
				yesLabel = "YES"
			}
			noLabel := m.NoLabel
			if noLabel == "" {
				noLabel = "NO"
			}

			yesOpt := models.MarketOption{MarketID: m.ID, Label: yesLabel, DisplayOrder: 0}
			noOpt := models.MarketOption{MarketID: m.ID, Label: noLabel, DisplayOrder: 1}

			if err := db.Create(&yesOpt).Error; err != nil {
				return fmt.Errorf("failed to create YES option for market %d: %w", m.ID, err)
			}
			if err := db.Create(&noOpt).Error; err != nil {
				return fmt.Errorf("failed to create NO option for market %d: %w", m.ID, err)
			}
			log.Printf("migration - backfilled options for market %d (%s/%s)", m.ID, yesLabel, noLabel)
		}

		return nil
	})

	if err != nil {
		logger.LogError("migrations", "init", err)
		log.Fatalf("Failed to register migration 20260330060001: %v", err)
	}
}

// generateMigrationSlug creates a URL-friendly slug from a title + random suffix.
func generateMigrationSlug(title string, rng *rand.Rand) string {
	slug := strings.ToLower(title)
	re := regexp.MustCompile(`[^a-z0-9]+`)
	slug = re.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	if len(slug) > 60 {
		slug = slug[:60]
		if idx := strings.LastIndex(slug, "-"); idx > 30 {
			slug = slug[:idx]
		}
	}
	suffix := rng.Intn(90000) + 10000
	return fmt.Sprintf("%s-%d", slug, suffix)
}
