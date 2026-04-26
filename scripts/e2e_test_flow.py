import requests
import json
import time
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8080/v0"
CREATOR = "test1"
BETTOR_YES = "test3"
BETTOR_NO = "test4"
PASSWORD = "123Urvi$h456"
ADMIN = "admin"
ADMIN_PASSWORD = "123Urvi$h456"

def login(username, password):
    print(f"[*] Logging in as {username}...")
    url = f"{BASE_URL}/login"
    payload = {"username": username, "password": password}
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        data = response.json()
        print(f"[+] Login successful for {username}")
        return data["token"]
    else:
        print(f"[-] Login failed for {username}: {response.text}")
        return None

def get_balance(username, token):
    url = f"{BASE_URL}/privateprofile"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        balance = response.json().get("virtualBalance")
        print(f"    [Balance] {username}: {balance}")
        return balance
    else:
        print(f"    [-] Failed to get balance for {username}: {response.text}")
        return None

def create_market(token):
    print("[*] Creating market...")
    url = f"{BASE_URL}/create"
    headers = {"Authorization": f"Bearer {token}"}
    
    # Resolution date: 2 hours from now
    res_date = (datetime.utcnow() + timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    payload = {
        "questionTitle": f"E2E Test Market {int(time.time())}",
        "description": "Programmatic A to Z test market.",
        "outcomeType": "BINARY",
        "resolutionDateTime": res_date,
        "category": "other",
        "yesLabel": "YES",
        "noLabel": "NO"
    }
    response = requests.post(url, json=payload, headers=headers)
    if response.status_code == 201:
        market_id = response.json()["id"]
        print(f"[+] Market created with ID: {market_id}")
        return market_id
    else:
        print(f"[-] Market creation failed: {response.text}")
        return None

def place_bet(username, token, market_id, amount, outcome):
    print(f"[*] {username} placing bet of {amount} on {outcome}...")
    url = f"{BASE_URL}/bet"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "marketId": market_id,
        "amount": amount,
        "outcome": outcome
    }
    response = requests.post(url, json=payload, headers=headers)
    if response.status_code == 201:
        print(f"[+] Bet placed by {username}")
        return True
    else:
        print(f"[-] Bet placement failed for {username}: {response.text}")
        return False

def suggest_resolution(token, market_id, outcome):
    print(f"[*] Suggesting resolution: {outcome}...")
    url = f"{BASE_URL}/resolve/{market_id}"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"outcome": outcome}
    response = requests.post(url, json=payload, headers=headers)
    if response.status_code == 200:
        print("[+] Resolution suggested")
        return True
    else:
        print(f"[-] Resolution suggestion failed: {response.text}")
        return False

def finalize_resolution(token, market_id, outcome):
    print(f"[*] Admin finalizing resolution: {outcome}...")
    url = f"{BASE_URL}/resolve/{market_id}"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"outcome": outcome}
    response = requests.post(url, json=payload, headers=headers)
    if response.status_code == 200:
        print("[+] Resolution finalized by Admin")
        return True
    else:
        print(f"[-] Admin finalization failed: {response.text}")
        return False

def run_test():
    print("=== SOCIALPREDICT E2E PROGRAMMATIC TEST ===")
    
    # 1. Login all participants
    creator_token = login(CREATOR, PASSWORD)
    bettor_yes_token = login(BETTOR_YES, PASSWORD)
    bettor_no_token = login(BETTOR_NO, PASSWORD)
    admin_token = login(ADMIN, ADMIN_PASSWORD)
    
    if not all([creator_token, bettor_yes_token, bettor_no_token, admin_token]):
        print("[-] Aborting: Login failures")
        return

    print("\n--- PHASE 1: INITIAL BALANCES ---")
    b0_creator = get_balance(CREATOR, creator_token)
    b0_yes = get_balance(BETTOR_YES, bettor_yes_token)
    b0_no = get_balance(BETTOR_NO, bettor_no_token)

    print("\n--- PHASE 2: MARKET CREATION ---")
    market_id = create_market(creator_token)
    if not market_id: return
    b1_creator = get_balance(CREATOR, creator_token)
    print(f"    [Audit] Creator balance changed by: {b1_creator - b0_creator if b0_creator is not None and b1_creator is not None else 'N/A'}")

    print("\n--- PHASE 3: BETTING ---")
    if not place_bet(BETTOR_YES, bettor_yes_token, market_id, 500, "YES"): return
    if not place_bet(BETTOR_NO, bettor_no_token, market_id, 500, "NO"): return
    
    b1_yes = get_balance(BETTOR_YES, bettor_yes_token)
    b1_no = get_balance(BETTOR_NO, bettor_no_token)
    
    print("\n--- PHASE 4: RESOLUTION (Standard Flow) ---")
    if not suggest_resolution(creator_token, market_id, "YES"): return
    if not finalize_resolution(admin_token, market_id, "YES"): return

    print("\n--- PHASE 5: SECOND MARKET (Direct Admin Resolution) ---")
    market_id_2 = create_market(creator_token)
    if market_id_2:
        if not place_bet(BETTOR_NO, bettor_no_token, market_id_2, 100, "NO"): pass
        # Admin resolves directly without suggestion
        if not finalize_resolution(admin_token, market_id_2, "NO"):
            print("[-] Direct Admin Resolution failed (maybe backend not restarted?)")
        else:
            print("[+] Direct Admin Resolution successful!")

    print("\n--- PHASE 6: FINAL AUDIT ---")
    time.sleep(2) # Give a moment for background processing if any
    b2_yes = get_balance(BETTOR_YES, bettor_yes_token)
    b2_no = get_balance(BETTOR_NO, bettor_no_token)
    
    print("\n[RESULT SUMMARY]")
    if b0_yes is not None and b2_yes is not None:
        print(f"Winner ({BETTOR_YES}): {b0_yes} -> {b1_yes} (bet) -> {b2_yes} (final)")
        print(f"Net Profit: {b2_yes - b0_yes}")
    
    if b0_no is not None and b2_no is not None:
        print(f"Loser ({BETTOR_NO}): {b0_no} -> {b1_no} (bet) -> {b2_no} (final)")
        print(f"Net Loss: {b2_no - b0_no}")

    print("===========================================")

if __name__ == "__main__":
    run_test()
