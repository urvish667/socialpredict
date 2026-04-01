package marketshandlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"socialpredict/models"
	"socialpredict/models/modelstesting"
	"socialpredict/util"
	"strconv"
	"testing"

	"github.com/gorilla/mux"
)

func TestMain(m *testing.M) {
	os.Setenv("JWT_SIGNING_KEY", "test-secret-key-for-testing")
	code := m.Run()
	os.Exit(code)
}

func resolveRequest(t *testing.T, router *mux.Router, token string, marketID int64, outcome string) *httptest.ResponseRecorder {
	t.Helper()

	reqBody := map[string]string{}
	if outcome != "" {
		reqBody["outcome"] = outcome
	}
	jsonBody, _ := json.Marshal(reqBody)

	req := httptest.NewRequest("POST", "/v0/market/"+strconv.FormatInt(marketID, 10)+"/resolve", bytes.NewBuffer(jsonBody))
	req = mux.SetURLVars(req, map[string]string{"marketId": strconv.FormatInt(marketID, 10)})
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	return w
}

func setupResolveRouter() *mux.Router {
	router := mux.NewRouter()
	router.HandleFunc("/v0/market/{marketId}/resolve", ResolveMarketHandler).Methods("POST")
	return router
}

func TestResolveMarketHandler_CreatorSuggestsAndAdminFinalizes(t *testing.T) {
	db := modelstesting.NewFakeDB(t)
	util.DB = db

	creator := modelstesting.GenerateUser("creator", 0)
	admin := modelstesting.GenerateUser("admin", 0)
	admin.Role = models.RoleAdmin
	admin.UserType = models.RoleAdmin
	bettor := modelstesting.GenerateUser("bettor", 0)
	db.Create(&creator)
	db.Create(&admin)
	db.Create(&bettor)

	market := modelstesting.GenerateMarket(1, "creator")
	market.CreatorID = creator.ID
	db.Create(&market)

	bet := modelstesting.GenerateBet(100, "YES", "bettor", uint(market.ID), 0)
	db.Create(&bet)

	router := setupResolveRouter()

	creatorToken := modelstesting.GenerateValidJWT("creator")
	suggestResp := resolveRequest(t, router, creatorToken, market.ID, "N/A")
	if suggestResp.Code != http.StatusOK {
		t.Fatalf("expected suggestion status 200, got %d body=%s", suggestResp.Code, suggestResp.Body.String())
	}

	var pendingMarket models.Market
	db.First(&pendingMarket, market.ID)
	if pendingMarket.Status != models.MarketStatusPendingResolution {
		t.Fatalf("expected market status %s, got %s", models.MarketStatusPendingResolution, pendingMarket.Status)
	}
	if pendingMarket.IsResolved {
		t.Fatal("market should not be finalized after creator suggestion")
	}

	adminToken := modelstesting.GenerateValidJWT("admin")
	finalizeResp := resolveRequest(t, router, adminToken, market.ID, "")
	if finalizeResp.Code != http.StatusOK {
		t.Fatalf("expected finalize status 200, got %d body=%s", finalizeResp.Code, finalizeResp.Body.String())
	}

	var resolvedMarket models.Market
	db.First(&resolvedMarket, market.ID)
	if !resolvedMarket.IsResolved {
		t.Fatal("market should be finalized")
	}
	if resolvedMarket.Status != models.MarketStatusFinalized {
		t.Fatalf("expected finalized status, got %s", resolvedMarket.Status)
	}
	if resolvedMarket.ResolutionResult != "N/A" {
		t.Fatalf("expected resolution result N/A, got %s", resolvedMarket.ResolutionResult)
	}
	if resolvedMarket.ResolvedBy == nil || *resolvedMarket.ResolvedBy != admin.ID {
		t.Fatalf("expected resolvedBy to be admin id %d", admin.ID)
	}

	var updatedBettor models.User
	db.Where("username = ?", "bettor").First(&updatedBettor)
	if updatedBettor.AccountBalance != 100 {
		t.Fatalf("expected bettor balance 100 after refund, got %d", updatedBettor.AccountBalance)
	}
}

func TestResolveMarketHandler_UnauthorizedUserCannotSuggest(t *testing.T) {
	db := modelstesting.NewFakeDB(t)
	util.DB = db

	creator := modelstesting.GenerateUser("creator", 0)
	otherUser := modelstesting.GenerateUser("other", 0)
	db.Create(&creator)
	db.Create(&otherUser)

	market := modelstesting.GenerateMarket(4, "creator")
	market.CreatorID = creator.ID
	db.Create(&market)

	token := modelstesting.GenerateValidJWT("other")
	router := setupResolveRouter()
	resp := resolveRequest(t, router, token, market.ID, "YES")

	if resp.Code != http.StatusForbidden {
		t.Fatalf("expected status 403, got %d body=%s", resp.Code, resp.Body.String())
	}

	var marketCheck models.Market
	db.First(&marketCheck, market.ID)
	if marketCheck.Status != models.MarketStatusActive {
		t.Fatalf("market should remain active, got %s", marketCheck.Status)
	}
}

func TestResolveMarketHandler_InvalidOutcome(t *testing.T) {
	db := modelstesting.NewFakeDB(t)
	util.DB = db

	creator := modelstesting.GenerateUser("creator", 0)
	db.Create(&creator)

	market := modelstesting.GenerateMarket(5, "creator")
	market.CreatorID = creator.ID
	db.Create(&market)

	token := modelstesting.GenerateValidJWT("creator")
	router := setupResolveRouter()
	resp := resolveRequest(t, router, token, market.ID, "MAYBE")

	if resp.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", resp.Code)
	}
}

func TestResolveMarketHandler_AdminCannotFinalizeActiveMarket(t *testing.T) {
	db := modelstesting.NewFakeDB(t)
	util.DB = db

	creator := modelstesting.GenerateUser("creator", 0)
	admin := modelstesting.GenerateUser("admin", 0)
	admin.Role = models.RoleAdmin
	admin.UserType = models.RoleAdmin
	db.Create(&creator)
	db.Create(&admin)

	market := modelstesting.GenerateMarket(6, "creator")
	market.CreatorID = creator.ID
	db.Create(&market)

	token := modelstesting.GenerateValidJWT("admin")
	router := setupResolveRouter()
	resp := resolveRequest(t, router, token, market.ID, "")

	if resp.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d body=%s", resp.Code, resp.Body.String())
	}
}
