package usershandlers

import (
	"testing"

	"socialpredict/models"
	"socialpredict/models/modelstesting"
)

func TestApplyTransactionToUser(t *testing.T) {
	db := modelstesting.NewFakeDB(t)

	startingBalance := int64(100)
	user := modelstesting.GenerateUser("testuser", startingBalance)
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("failed to create user: %v", err)
	}

	type testCase struct {
		txType        string
		amount        int64
		expectBalance int64
		expectErr     bool
	}

	testCases := []testCase{
		{TransactionWin, 50, 150, false},
		{TransactionRefund, 25, 175, false},
		{TransactionSale, 20, 195, false},
		{TransactionBuy, 40, 155, false},
		{TransactionFee, 10, 145, false},
		{"UNKNOWN", 10, 145, true}, // balance should not change
	}

	for _, tc := range testCases {
		err := ApplyTransactionToUser(user.Username, tc.amount, db, tc.txType, BalanceTypeVirtual)
		var updated models.User
		if err := db.Where("username = ?", user.Username).First(&updated).Error; err != nil {
			t.Fatalf("failed to fetch user after update: %v", err)
		}
		if tc.expectErr {
			if err == nil {
				t.Errorf("expected error for type %s but got nil", tc.txType)
			}
			continue
		}
		if err != nil {
			t.Errorf("unexpected error for type %s: %v", tc.txType, err)
		}
		if updated.VirtualBalance != tc.expectBalance {
			t.Errorf("after %s, expected balance %d, got %d", tc.txType, tc.expectBalance, updated.VirtualBalance)
		}
	}
}

func TestApplyTransactionToUser_UserNotFound(t *testing.T) {
	db := modelstesting.NewFakeDB(t)
	// Do NOT insert any user — username does not exist in the DB

	err := ApplyTransactionToUser("ghost_user", 50, db, TransactionWin, BalanceTypeVirtual)
	if err == nil {
		t.Fatal("expected error for non-existent user, got nil")
	}
}

func TestApplyTransactionToUser_RealBalance(t *testing.T) {
	db := modelstesting.NewFakeDB(t)

	user := modelstesting.GenerateUser("realbalanceuser", 100)
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("failed to create user: %v", err)
	}

	if err := ApplyTransactionToUser(user.Username, 75, db, TransactionWin, BalanceTypeReal); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var updated models.User
	if err := db.Where("username = ?", user.Username).First(&updated).Error; err != nil {
		t.Fatalf("failed to fetch user after update: %v", err)
	}
	if updated.VirtualBalance != 100 {
		t.Fatalf("expected virtual balance to remain 100, got %d", updated.VirtualBalance)
	}
	if updated.RealBalance != 75 {
		t.Fatalf("expected real balance 75, got %d", updated.RealBalance)
	}
}

func TestApplyTransactionToUser_UnknownBalanceType(t *testing.T) {
	db := modelstesting.NewFakeDB(t)

	user := modelstesting.GenerateUser("badbalancetypeuser", 100)
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("failed to create user: %v", err)
	}

	err := ApplyTransactionToUser(user.Username, 75, db, TransactionWin, "mystery")
	if err == nil {
		t.Fatal("expected error for unknown balance type, got nil")
	}
}
