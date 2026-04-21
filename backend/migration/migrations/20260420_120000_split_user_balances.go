package migrations

import (
	"log"

	"socialpredict/logger"
	"socialpredict/migration"
	"socialpredict/models"

	"gorm.io/gorm"
)

func init() {
	err := migration.Register("20260420120000", func(db *gorm.DB) error {
		hasAccountBalance := db.Migrator().HasColumn(&models.User{}, "account_balance")
		hasVirtualBalance := db.Migrator().HasColumn(&models.User{}, "virtual_balance")

		if hasAccountBalance && !hasVirtualBalance {
			if err := db.Migrator().RenameColumn(&models.User{}, "account_balance", "virtual_balance"); err != nil {
				return err
			}
		}

		if err := db.AutoMigrate(&models.User{}); err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		logger.LogError("migrations", "init", err)
		log.Fatalf("Failed to register migration 20260420120000: %v", err)
	}
}
