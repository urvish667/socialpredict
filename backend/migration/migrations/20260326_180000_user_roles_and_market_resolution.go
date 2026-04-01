package migrations

import (
	"log"

	"socialpredict/logger"
	"socialpredict/migration"
	"socialpredict/models"

	"gorm.io/gorm"
)

func init() {
	err := migration.Register("20260326180000", func(db *gorm.DB) error {
		if err := db.AutoMigrate(&models.User{}, &models.Market{}); err != nil {
			return err
		}

		if err := db.Exec(
			"UPDATE users SET role = CASE WHEN UPPER(COALESCE(user_type, '')) = 'ADMIN' THEN ? ELSE ? END WHERE role IS NULL OR role = ''",
			models.RoleAdmin,
			models.RoleUser,
		).Error; err != nil {
			return err
		}

		if err := db.Exec(
			"UPDATE users SET user_type = role WHERE user_type IS NULL OR user_type = '' OR user_type <> role",
		).Error; err != nil {
			return err
		}

		if err := db.Exec(
			"UPDATE users SET is_verified = TRUE WHERE is_verified = FALSE AND (email_verified = TRUE OR phone_verified = TRUE OR role = ?)",
			models.RoleAdmin,
		).Error; err != nil {
			return err
		}

		if err := db.Exec(
			"UPDATE markets SET status = CASE WHEN is_resolved = TRUE THEN ? ELSE ? END WHERE status IS NULL OR status = ''",
			models.MarketStatusFinalized,
			models.MarketStatusActive,
		).Error; err != nil {
			return err
		}

		if err := db.Exec(
			"UPDATE markets SET creator_id = users.id FROM users WHERE markets.creator_id = 0 AND markets.creator_username = users.username",
		).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		logger.LogError("migrations", "init", err)
		log.Fatalf("Failed to register migration 20260326180000: %v", err)
	}
}
