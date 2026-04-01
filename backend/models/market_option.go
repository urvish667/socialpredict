package models

import (
	"gorm.io/gorm"
)

// MarketOption represents one selectable outcome in a multiple choice market.
// For binary markets, two options are auto-created (YES / NO).
type MarketOption struct {
	gorm.Model
	ID           uint   `json:"id" gorm:"primary_key"`
	MarketID     int64  `json:"marketId" gorm:"index;not null"`
	Label        string `json:"label" gorm:"not null"`
	DisplayOrder int    `json:"displayOrder" gorm:"not null;default:0"`
}
