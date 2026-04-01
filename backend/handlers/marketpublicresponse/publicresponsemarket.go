package marketpublicresponse

import (
	"errors"
	"socialpredict/models"
	"time"

	"gorm.io/gorm"
)

// PublicResponseMarketOption is the public view of a market option.
type PublicResponseMarketOption struct {
	ID           uint   `json:"id"`
	Label        string `json:"label"`
	DisplayOrder int    `json:"displayOrder"`
}

type PublicResponseMarket struct {
	ID                      int64                        `json:"id"`
	Slug                    string                       `json:"slug"`
	QuestionTitle           string                       `json:"questionTitle"`
	Description             string                       `json:"description"`
	OutcomeType             string                       `json:"outcomeType"`
	ResolutionDateTime      time.Time                    `json:"resolutionDateTime"`
	FinalResolutionDateTime time.Time                    `json:"finalResolutionDateTime"`
	UTCOffset               int                          `json:"utcOffset"`
	IsResolved              bool                         `json:"isResolved"`
	ResolutionResult        string                       `json:"resolutionResult"`
	Status                  string                       `json:"status"`
	InitialProbability      float64                      `json:"initialProbability"`
	CreatorID               int64                        `json:"creatorId"`
	CreatorUsername          string                       `json:"creatorUsername"`
	ResolvedBy              *int64                       `json:"resolvedBy,omitempty"`
	CreatedAt               time.Time                    `json:"createdAt"`
	YesLabel                string                       `json:"yesLabel"`
	NoLabel                 string                       `json:"noLabel"`
	Category                string                       `json:"category"`
	Options                 []PublicResponseMarketOption `json:"options,omitempty"`
}

// GetPublicResponseMarketByID retrieves a market by its ID using an existing database connection,
// and constructs a PublicResponseMarket.
func GetPublicResponseMarketByID(db *gorm.DB, marketId string) (PublicResponseMarket, error) {
	if db == nil {
		return PublicResponseMarket{}, errors.New("database connection is nil")
	}

	var market models.Market
	result := db.Where("ID = ?", marketId).First(&market)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return PublicResponseMarket{}, result.Error // Market not found
		}
		return PublicResponseMarket{}, result.Error // Error fetching market
	}

	// Fetch options for the market
	var options []models.MarketOption
	db.Where("market_id = ?", market.ID).Order("display_order ASC").Find(&options)

	return buildPublicResponse(market, options), nil
}

// GetPublicResponseMarketBySlug retrieves a market by its slug.
func GetPublicResponseMarketBySlug(db *gorm.DB, slug string) (PublicResponseMarket, error) {
	if db == nil {
		return PublicResponseMarket{}, errors.New("database connection is nil")
	}

	var market models.Market
	result := db.Where("slug = ?", slug).First(&market)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return PublicResponseMarket{}, result.Error
		}
		return PublicResponseMarket{}, result.Error
	}

	var options []models.MarketOption
	db.Where("market_id = ?", market.ID).Order("display_order ASC").Find(&options)

	return buildPublicResponse(market, options), nil
}

// buildPublicResponse constructs a PublicResponseMarket from a Market model and its options.
func buildPublicResponse(market models.Market, options []models.MarketOption) PublicResponseMarket {
	var pubOptions []PublicResponseMarketOption
	for _, opt := range options {
		pubOptions = append(pubOptions, PublicResponseMarketOption{
			ID:           opt.ID,
			Label:        opt.Label,
			DisplayOrder: opt.DisplayOrder,
		})
	}

	return PublicResponseMarket{
		ID:                      market.ID,
		Slug:                    market.Slug,
		QuestionTitle:           market.QuestionTitle,
		Description:             market.Description,
		OutcomeType:             market.OutcomeType,
		ResolutionDateTime:      market.ResolutionDateTime,
		FinalResolutionDateTime: market.FinalResolutionDateTime,
		UTCOffset:               market.UTCOffset,
		IsResolved:              market.IsResolved,
		ResolutionResult:        market.ResolutionResult,
		Status:                  market.Status,
		InitialProbability:      market.InitialProbability,
		CreatorID:               market.CreatorID,
		CreatorUsername:          market.CreatorUsername,
		ResolvedBy:              market.ResolvedBy,
		CreatedAt:               market.CreatedAt,
		YesLabel:                market.YesLabel,
		NoLabel:                 market.NoLabel,
		Category:                market.Category,
		Options:                 pubOptions,
	}
}
