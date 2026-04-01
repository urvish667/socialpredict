package models

import (
	"time"

	"gorm.io/gorm"
)

type Market struct {
	gorm.Model
	ID                      int64     `json:"id" gorm:"primary_key"`
	Slug                    string    `json:"slug" gorm:"index"`
	QuestionTitle           string    `json:"questionTitle" gorm:"not null"`
	Description             string    `json:"description" gorm:"not null"`
	OutcomeType             string    `json:"outcomeType" gorm:"not null"`
	ResolutionDateTime      time.Time `json:"resolutionDateTime" gorm:"not null"`
	FinalResolutionDateTime time.Time `json:"finalResolutionDateTime"`
	UTCOffset               int       `json:"utcOffset"`
	IsResolved              bool      `json:"isResolved"`
	ResolutionResult        string    `json:"resolutionResult"`
	Status                  string    `json:"status" gorm:"not null;default:ACTIVE"`
	InitialProbability      float64   `json:"initialProbability" gorm:"not null"`
	YesLabel                string    `json:"yesLabel" gorm:"default:YES"`
	NoLabel                 string    `json:"noLabel" gorm:"default:NO"`
	Category                string    `json:"category" gorm:"default:other"`
	CreatorID               int64     `json:"creatorId" gorm:"index"`
	CreatorUsername          string    `json:"creatorUsername" gorm:"not null"`
	ResolvedBy              *int64    `json:"resolvedBy,omitempty" gorm:"index"`
	Creator                 User      `gorm:"foreignKey:CreatorUsername;references:Username"`
	Options                 []MarketOption `json:"options,omitempty" gorm:"foreignKey:MarketID"`
}

const (
	MarketStatusActive            = "ACTIVE"
	MarketStatusPendingResolution = "PENDING_RESOLUTION"
	MarketStatusFinalized         = "FINALIZED"

	OutcomeTypeBinary         = "BINARY"
	OutcomeTypeMultipleChoice = "MULTIPLE_CHOICE"
)

func (m Market) GetOwnerID() int64 {
	return m.CreatorID
}
