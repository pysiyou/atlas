"""
End-to-End Data Simulation Suite
=================================
Generates 2 years (730 days) of realistic lab history by calling Backend APIs.
Acts as a Frontend client: every operation goes through HTTP, ensuring all side
effects (audit logs, triggers, status updates) are handled by application logic.

3-Phase Approach:
  Phase 1: Patient Generation  — 500 patients with weighted daily distribution
  Phase 2: Order Generation    — 7300 orders (min 5/day), 2–5 tests each
  Phase 3: Workflow Simulation — lifecycle per test (80/10/5/5 destiny split)

Requires:
  - The backend server running with SIMULATION_MODE=true
  - Users and test catalog already seeded

Usage (from backend directory):
  # Terminal 1: start the server in simulation mode
  SIMULATION_MODE=true PYTHONPATH=. poetry run uvicorn app.main:app --port 8000

  # Terminal 2: run the simulation
  PYTHONPATH=. poetry run python db_scripts/simulate_history.py [--base-url http://localhost:8000] [--seed 42]
"""
from __future__ import annotations

import argparse
import random
import sys
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

import requests

# ---------------------------------------------------------------------------
# Configuration Constants
# ---------------------------------------------------------------------------
SIMULATION_DAYS = 730
TARGET_PATIENTS = 500
TARGET_ORDERS = 7300
MIN_ORDERS_PER_DAY = 5
MIN_TESTS_PER_ORDER = 2
MAX_TESTS_PER_ORDER = 5
PAID_ORDER_PERCENTAGE = 0.80

# Workflow destiny weights
DESTINY_NORMAL = 0.80
DESTINY_TECH_REJECTION = 0.10
DESTINY_SAMPLE_REJECTION = 0.05
DESTINY_ESCALATION = 0.05

# Time deltas (hours) between workflow steps
COLLECTION_DELAY_HOURS = (1, 8)
RESULT_DELAY_HOURS = (2, 48)
VALIDATION_DELAY_HOURS = (0.5, 24)

# Simulated date header key
SIM_HEADER = "X-Simulated-Date"

# User credentials
USERS = {
    "admin":        {"username": "admin",        "password": "admin123"},
    "receptionist": {"username": "receptionist", "password": "recept123"},
    "labtech":      {"username": "labtech",      "password": "lab123"},
    "labtech_plus": {"username": "labtech_plus", "password": "labplus123"},
}

# ---------------------------------------------------------------------------
# Realistic Patient Data Pools
# ---------------------------------------------------------------------------
FIRST_NAMES_MALE = [
    "Kwame", "Kofi", "Yaw", "Kojo", "Osei", "Mensah", "Adjei",
    "Ibrahim", "Mohammed", "Amadou", "Ousmane", "Moussa", "Sekou", "Boubacar",
    "Chidi", "Emeka", "Obinna", "Ikenna", "Uche", "Nnamdi", "Onyeka",
    "Thierno", "Abdoulaye", "Mamadou", "Samba", "Cheikh", "Modou",
    "Jean-Pierre", "Olivier", "Claude", "Patrick", "Emmanuel", "Samuel",
    "David", "Daniel", "Joseph", "Michael", "Robert", "James",
]
FIRST_NAMES_FEMALE = [
    "Ama", "Akua", "Adwoa", "Afia", "Efua", "Yaa", "Abena",
    "Fatou", "Aminata", "Mariama", "Aissatou", "Kadiatou", "Fanta",
    "Ngozi", "Chioma", "Adaeze", "Nneka", "Obioma", "Chiamaka",
    "Mariam", "Aisha", "Halima", "Safiatou", "Ramatoulaye",
    "Marie", "Josephine", "Patricia", "Grace", "Sarah", "Rebecca",
    "Amina", "Zainab", "Hauwa", "Hadiza", "Binta", "Salamatu",
]
LAST_NAMES = [
    "Mensah", "Asante", "Boateng", "Adjei", "Osei", "Appiah", "Owusu",
    "Diallo", "Bah", "Barry", "Sow", "Camara", "Keita", "Conde",
    "Okafor", "Eze", "Nwachukwu", "Obi", "Uzoma", "Anyanwu",
    "Traore", "Coulibaly", "Toure", "Konate", "Diarra",
    "Ndiaye", "Fall", "Gueye", "Diouf", "Mbaye", "Sarr",
    "Kimura", "Mwangi", "Odhiambo", "Njoroge", "Wanjiku",
]
CITIES = [
    "Accra", "Kumasi", "Tamale", "Conakry", "Dakar", "Abidjan",
    "Lagos", "Nairobi", "Dar es Salaam", "Kampala", "Addis Ababa",
    "Bamako", "Ouagadougou", "Niamey", "Freetown", "Monrovia",
]
RELATIONSHIPS = ["spouse", "parent", "sibling", "child", "friend", "other"]
CHRONIC_CONDITIONS = [
    "Hypertension", "Type 2 Diabetes", "Asthma (mild)", "Sickle Cell Disease",
    "HIV Infection", "Chronic Kidney Disease Stage 2", "Osteoarthritis",
    "Hyperlipidemia", "Iron Deficiency Anemia", "Peptic Ulcer Disease",
]
MEDICATIONS = [
    "Metformin", "Amlodipine", "Lisinopril", "Atorvastatin", "Omeprazole",
    "Paracetamol", "Ibuprofen", "Amoxicillin", "Hydrochlorothiazide",
    "Artemether-Lumefantrine", "Tenofovir", "Dolutegravir", "Levothyroxine",
]
ALLERGIES = ["None", "Penicillin", "Aspirin", "Sulfa drugs", "NSAIDs", "Latex"]
REJECTION_REASONS_TECH = [
    "Instrument calibration error",
    "Reagent expired",
    "QC out of range",
    "Sample evaporation during analysis",
    "Incorrect dilution factor applied",
]
REJECTION_REASONS_SAMPLE = [
    "Hemolyzed specimen",
    "Lipemic specimen",
    "Clotted specimen (EDTA tube)",
    "Insufficient volume (QNS)",
    "Wrong container used",
]

# Backend physiologic limits (must match result_validator.py for clamping)
PHYSIOLOGIC_LIMITS: Dict[str, Dict[str, float]] = {
    'pH': {'min': 6.5, 'max': 8.0},
    'pCO2': {'min': 5, 'max': 150},
    'pO2': {'min': 0, 'max': 700},
    'HCO3': {'min': 1, 'max': 60},
    'Na': {'min': 90, 'max': 200},
    'K': {'min': 1.0, 'max': 12.0},
    'Cl': {'min': 60, 'max': 150},
    'Ca': {'min': 2.0, 'max': 20.0},
    'Mg': {'min': 0.3, 'max': 10.0},
    'P': {'min': 0.5, 'max': 20.0},
    'Phosphorus': {'min': 0.5, 'max': 20.0},
    'Glucose': {'min': 5, 'max': 2000},
    'GLU': {'min': 5, 'max': 2000},
    'BUN': {'min': 0, 'max': 300},
    'Creatinine': {'min': 0.1, 'max': 50},
    'Cr': {'min': 0.1, 'max': 50},
    'eGFR': {'min': 0, 'max': 200},
    'AST': {'min': 0, 'max': 10000},
    'ALT': {'min': 0, 'max': 10000},
    'ALP': {'min': 0, 'max': 5000},
    'Bilirubin': {'min': 0, 'max': 100},
    'TBil': {'min': 0, 'max': 100},
    'DBil': {'min': 0, 'max': 50},
    'Albumin': {'min': 0.5, 'max': 10},
    'Protein': {'min': 1, 'max': 20},
    'WBC': {'min': 0.1, 'max': 500},
    'RBC': {'min': 0.5, 'max': 12},
    'Hemoglobin': {'min': 1, 'max': 30},
    'Hgb': {'min': 1, 'max': 30},
    'HGB': {'min': 1, 'max': 30},
    'Hematocrit': {'min': 5, 'max': 80},
    'Hct': {'min': 5, 'max': 80},
    'HCT': {'min': 5, 'max': 80},
    'Platelets': {'min': 1, 'max': 2000},
    'PLT': {'min': 1, 'max': 2000},
    'MCV': {'min': 30, 'max': 200},
    'MCH': {'min': 10, 'max': 60},
    'MCHC': {'min': 20, 'max': 50},
    'RDW': {'min': 5, 'max': 40},
    'PT': {'min': 5, 'max': 200},
    'INR': {'min': 0.5, 'max': 20},
    'PTT': {'min': 10, 'max': 250},
    'aPTT': {'min': 10, 'max': 250},
    'Fibrinogen': {'min': 20, 'max': 2000},
    'Troponin': {'min': 0, 'max': 1000},
    'TnI': {'min': 0, 'max': 1000},
    'TnT': {'min': 0, 'max': 1000},
    'BNP': {'min': 0, 'max': 100000},
    'CK': {'min': 0, 'max': 50000},
    'CK-MB': {'min': 0, 'max': 5000},
    'TSH': {'min': 0, 'max': 500},
    'T3': {'min': 0, 'max': 1000},
    'T4': {'min': 0, 'max': 50},
    'FT3': {'min': 0, 'max': 50},
    'FT4': {'min': 0, 'max': 20},
    'Cholesterol': {'min': 20, 'max': 1000},
    'TotalCholesterol': {'min': 20, 'max': 1000},
    'Triglycerides': {'min': 10, 'max': 10000},
    'HDL': {'min': 5, 'max': 200},
    'LDL': {'min': 5, 'max': 500},
    'UrineSpecificGravity': {'min': 1.000, 'max': 1.060},
    'SG': {'min': 1.000, 'max': 1.060},
    'CRP': {'min': 0, 'max': 500},
    'ESR': {'min': 0, 'max': 200},
    'Procalcitonin': {'min': 0, 'max': 1000},
    'Temperature': {'min': 85, 'max': 115},
    'TemperatureC': {'min': 25, 'max': 45},
}


# ---------------------------------------------------------------------------
# API Client
# ---------------------------------------------------------------------------
class LabAPIClient:
    """HTTP client that acts as the Frontend, sending requests to the backend."""

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.api = f"{self.base_url}/api/v1"
        self.tokens: Dict[str, str] = {}
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})

    def _url(self, path: str) -> str:
        return f"{self.api}{path}"

    def _headers(self, role: str, sim_date: Optional[datetime] = None) -> Dict:
        h = {"Authorization": f"Bearer {self.tokens[role]}"}
        if sim_date:
            h[SIM_HEADER] = sim_date.isoformat()
        return h

    def _request(
        self,
        method: str,
        path: str,
        role: str,
        sim_date: Optional[datetime] = None,
        json_body: Optional[Dict] = None,
        ok_codes: Tuple[int, ...] = (200, 201),
        label: str = "",
    ) -> Dict | List:
        """Centralized request with automatic token refresh on 401."""
        url = self._url(path)
        headers = self._headers(role, sim_date)
        resp = self.session.request(method, url, json=json_body, headers=headers)
        if resp.status_code == 401:
            self.login(role)
            headers = self._headers(role, sim_date)
            resp = self.session.request(method, url, json=json_body, headers=headers)
        if resp.status_code not in ok_codes:
            raise RuntimeError(f"{label or path} failed: {resp.status_code} {resp.text[:400]}")
        return resp.json()

    # ---- Auth ----
    def login(self, role: str) -> None:
        creds = USERS[role]
        resp = self.session.post(
            self._url("/auth/login"),
            json={"username": creds["username"], "password": creds["password"]},
        )
        if resp.status_code != 200:
            raise RuntimeError(f"Login failed for {role}: {resp.status_code} {resp.text}")
        self.tokens[role] = resp.json()["access_token"]

    def login_all(self) -> None:
        for role in USERS:
            self.login(role)

    # ---- Patients ----
    def create_patient(self, payload: Dict, sim_date: datetime) -> Dict:
        return self._request("POST", "/patients", "receptionist", sim_date, payload, label="create_patient")

    # ---- Tests Catalog ----
    def get_tests(self) -> List[Dict]:
        return self._request("GET", "/tests", "admin", label="get_tests")

    # ---- Orders ----
    def create_order(self, patient_id: int, test_codes: List[str], sim_date: datetime) -> Dict:
        payload = {
            "patientId": patient_id,
            "tests": [{"testCode": tc} for tc in test_codes],
            "priority": random.choice(["low", "medium", "high"]),
        }
        return self._request("POST", "/orders", "receptionist", sim_date, payload, label=f"create_order(p={patient_id})")

    def get_order(self, order_id: int) -> Dict:
        return self._request("GET", f"/orders/{order_id}", "receptionist", label=f"get_order({order_id})")

    # ---- Samples ----
    def get_samples(self, order_id: int) -> List[Dict]:
        data = self._request("GET", f"/samples?orderId={order_id}", "labtech", label=f"get_samples({order_id})")
        if isinstance(data, dict) and "data" in data:
            return data["data"]
        return data

    def collect_sample(self, sample_id: int, sim_date: datetime) -> Dict:
        payload = {
            "collectedVolume": round(random.uniform(3.0, 10.0), 1),
            "actualContainerType": "tube",
            "actualContainerColor": random.choice(["red", "purple", "blue", "green", "gray"]),
        }
        return self._request("PATCH", f"/samples/{sample_id}/collect", "labtech", sim_date, payload,
                             label=f"collect_sample({sample_id})")

    # ---- Results ----
    def enter_results(self, order_id: int, test_code: str, results: Dict, sim_date: datetime) -> Dict:
        payload = {"results": results, "technicianNotes": "Simulation entry"}
        return self._request("POST", f"/results/{order_id}/tests/{test_code}", "labtech", sim_date, payload,
                             label=f"enter_results({order_id}/{test_code})")

    def validate_result(self, order_id: int, test_code: str, sim_date: datetime) -> Dict:
        payload = {"decision": "approved", "validationNotes": "Simulation validation"}
        return self._request("POST", f"/results/{order_id}/tests/{test_code}/validate", "labtech_plus", sim_date,
                             payload, label=f"validate({order_id}/{test_code})")

    def reject_result(self, order_id: int, test_code: str, rejection_type: str, reason: str,
                      sim_date: datetime) -> Dict:
        payload = {"rejectionReason": reason, "rejectionType": rejection_type}
        return self._request("POST", f"/results/{order_id}/tests/{test_code}/reject", "labtech_plus", sim_date,
                             payload, label=f"reject({order_id}/{test_code},{rejection_type})")

    def resolve_escalation(self, order_id: int, test_code: str, action: str, sim_date: datetime,
                           notes: str = "", reason: str = "") -> Dict:
        payload: Dict[str, Any] = {"action": action}
        if notes:
            payload["validationNotes"] = notes
        if reason:
            payload["rejectionReason"] = reason
        return self._request("POST", f"/results/{order_id}/tests/{test_code}/escalation/resolve", "labtech_plus",
                             sim_date, payload, label=f"resolve_escalation({order_id}/{test_code},{action})")

    # ---- Payments ----
    def create_payment(self, order_id: int, amount: float, sim_date: datetime) -> Dict:
        payload = {"orderId": order_id, "amount": amount, "paymentMethod": "cash"}
        return self._request("POST", "/payments", "receptionist", sim_date, payload,
                             label=f"payment({order_id})")


# ---------------------------------------------------------------------------
# Data Generation Helpers
# ---------------------------------------------------------------------------
def generate_patient_payload(rng: random.Random) -> Dict:
    gender = rng.choice(["male", "female"])
    first = rng.choice(FIRST_NAMES_MALE if gender == "male" else FIRST_NAMES_FEMALE)
    last = rng.choice(LAST_NAMES)
    age = rng.randint(1, 85)
    dob = (datetime.now() - timedelta(days=age * 365 + rng.randint(0, 364))).strftime("%Y-%m-%d")
    phone = f"+{rng.randint(200, 299)}{rng.randint(100000000, 999999999)}"

    payload: Dict[str, Any] = {
        "fullName": f"{first} {last}",
        "dateOfBirth": dob,
        "gender": gender,
        "phone": phone,
        "email": f"{first.lower()}.{last.lower()}{rng.randint(1, 999)}@example.com",
        "height": round(rng.uniform(150, 195), 1) if age >= 18 else round(rng.uniform(60, 170), 1),
        "weight": round(rng.uniform(45, 110), 1) if age >= 18 else round(rng.uniform(5, 70), 1),
        "address": {
            "street": f"{rng.randint(1, 500)} {rng.choice(['Main', 'Market', 'Independence', 'Liberation', 'Unity'])} Street",
            "city": rng.choice(CITIES),
            "postalCode": str(rng.randint(10000, 99999)),
        },
        "emergencyContact": {
            "fullName": f"{rng.choice(FIRST_NAMES_MALE + FIRST_NAMES_FEMALE)} {rng.choice(LAST_NAMES)}",
            "relationship": rng.choice(RELATIONSHIPS),
            "phone": f"+{rng.randint(200, 299)}{rng.randint(100000000, 999999999)}",
        },
        "medicalHistory": {
            "chronicConditions": rng.sample(CHRONIC_CONDITIONS, rng.randint(0, 3)),
            "currentMedications": rng.sample(MEDICATIONS, rng.randint(0, 3)),
            "allergies": rng.sample(ALLERGIES, rng.randint(0, 2)),
            "previousSurgeries": [],
            "familyHistory": [],
            "lifestyle": {"smoking": rng.random() < 0.15, "alcohol": rng.random() < 0.25},
        },
    }
    if rng.random() < 0.6:
        payload["vitalSigns"] = {
            "temperature": round(rng.uniform(36.0, 38.0), 1),
            "heartRate": rng.randint(55, 100),
            "systolicBP": rng.randint(100, 150),
            "diastolicBP": rng.randint(60, 95),
            "respiratoryRate": rng.randint(12, 22),
            "oxygenSaturation": rng.randint(94, 100),
        }
    return payload


def _get_backend_physiologic_limit(item_code: str) -> Optional[Dict[str, float]]:
    """Replicate backend's partial-match logic for physiologic limits."""
    if item_code in PHYSIOLOGIC_LIMITS:
        return PHYSIOLOGIC_LIMITS[item_code]
    ic_upper = item_code.upper()
    for key, limit in PHYSIOLOGIC_LIMITS.items():
        if key.upper() == ic_upper:
            return limit
    for key, limit in PHYSIOLOGIC_LIMITS.items():
        if key.lower() in item_code.lower() or item_code.lower() in key.lower():
            return limit
    return None


def generate_result_values(result_items: List[Dict], rng: random.Random) -> Dict[str, Any]:
    """Generate realistic result values clamped within physiologic limits."""
    results: Dict[str, Any] = {}
    for item in result_items:
        code = item.get("item_code")
        if not code:
            continue
        value_type = (item.get("value_type") or "NUMERIC").upper()
        ref = item.get("reference_range") or {}

        low, high = None, None
        for _k, v in ref.items():
            if isinstance(v, dict) and "low" in v and "high" in v:
                low, high = float(v["low"]), float(v["high"])
                break

        if value_type == "NUMERIC":
            if low is not None and high is not None:
                decimals = item.get("decimals_suggested", 1)
                phys = _get_backend_physiologic_limit(code)
                if phys:
                    effective_low = max(low, phys['min'])
                    effective_high = min(high, phys['max'])
                    precision = 10 ** (-decimals)
                    margin = max((effective_high - effective_low) * 0.02, precision)
                    effective_low += margin
                    effective_high -= margin
                    if effective_low >= effective_high:
                        effective_low = phys['min'] + (phys['max'] - phys['min']) * 0.3
                        effective_high = phys['min'] + (phys['max'] - phys['min']) * 0.7
                    val = round(rng.uniform(effective_low, effective_high), decimals)
                else:
                    val = round(rng.uniform(low, high), decimals)
            else:
                val = round(rng.uniform(1, 10), 2)
            results[code] = val
        elif value_type in ("TEXT", "SELECT"):
            options = item.get("options") or ["Negative", "Positive", "Normal"]
            results[code] = rng.choice(options)
        else:
            results[code] = rng.choice(["Negative", "Positive", "Normal"])
    return results


# ---------------------------------------------------------------------------
# Phase 1: Patient Generation
# ---------------------------------------------------------------------------
def generate_daily_patient_counts(rng: random.Random, total_days: int, total_patients: int) -> List[int]:
    """
    Distribute patients across days with a weighted random distribution:
      - Some days have 0 registrations
      - Most days have 1–3
      - Peak days have up to 10
    Uses a Poisson-like draw then normalises to hit the exact target.
    """
    raw: List[float] = []
    for _ in range(total_days):
        r = rng.random()
        if r < 0.15:
            raw.append(0)           # 15% chance of 0
        elif r < 0.80:
            raw.append(rng.uniform(1, 3))   # 65% chance of 1–3
        elif r < 0.95:
            raw.append(rng.uniform(3, 6))   # 15% chance of 3–6
        else:
            raw.append(rng.uniform(6, 10))  # 5% chance of 6–10

    # Scale to exact target
    raw_sum = sum(raw)
    if raw_sum == 0:
        raw = [1.0] * total_days
        raw_sum = float(total_days)

    counts = [int(v / raw_sum * total_patients) for v in raw]

    # Distribute remainder
    remainder = total_patients - sum(counts)
    indices = list(range(total_days))
    rng.shuffle(indices)
    for i in range(abs(remainder)):
        idx = indices[i % total_days]
        counts[idx] += 1 if remainder > 0 else -1
        counts[idx] = max(0, counts[idx])

    # Final safety: ensure exact count
    while sum(counts) < total_patients:
        counts[rng.randint(0, total_days - 1)] += 1
    while sum(counts) > total_patients:
        positives = [i for i, c in enumerate(counts) if c > 0]
        if positives:
            counts[rng.choice(positives)] -= 1

    return counts


def run_phase1(
    client: LabAPIClient,
    rng: random.Random,
    start_date: datetime,
    now: datetime,
) -> List[Dict]:
    """
    Phase 1: Create exactly TARGET_PATIENTS patients spread across SIMULATION_DAYS.
    Returns list of {id, reg_date} dicts.
    """
    print(f"\n{'='*70}")
    print("  Phase 1: Patient Generation ({} patients)".format(TARGET_PATIENTS))
    print(f"{'='*70}")

    daily_counts = generate_daily_patient_counts(rng, SIMULATION_DAYS, TARGET_PATIENTS)
    patients: List[Dict] = []
    errors = 0
    t0 = time.time()

    for day_offset, count in enumerate(daily_counts):
        day = start_date + timedelta(days=day_offset)
        for _ in range(count):
            sim_date = day + timedelta(hours=rng.randint(7, 18), minutes=rng.randint(0, 59))
            payload = generate_patient_payload(rng)
            try:
                resp = client.create_patient(payload, sim_date)
                patients.append({"id": resp["id"], "reg_date": sim_date})
            except Exception as e:
                errors += 1
                print(f"  [ERROR] Patient creation: {e}")

        if len(patients) > 0 and len(patients) % 100 == 0:
            print(f"  ... {len(patients)}/{TARGET_PATIENTS} patients created ({time.time()-t0:.0f}s)")

    elapsed = time.time() - t0
    print(f"  Created {len(patients)} patients in {elapsed:.1f}s (errors: {errors})")
    return patients


# ---------------------------------------------------------------------------
# Phase 2: Order Generation
# ---------------------------------------------------------------------------
def generate_daily_order_counts(rng: random.Random, total_days: int, total_orders: int,
                                min_per_day: int) -> List[int]:
    """
    Distribute orders across days guaranteeing >= min_per_day each day.
    Remaining orders distributed with a natural variance.
    """
    # Start with minimum
    counts = [min_per_day] * total_days
    remaining = total_orders - (min_per_day * total_days)
    if remaining < 0:
        raise ValueError(f"Cannot fit {total_orders} orders with minimum {min_per_day}/day over {total_days} days")

    # Distribute remaining with weighted randomness
    weights = [rng.uniform(0.5, 3.0) for _ in range(total_days)]
    weight_sum = sum(weights)
    for i in range(total_days):
        extra = int(weights[i] / weight_sum * remaining)
        counts[i] += extra

    # Distribute remainder one-by-one
    shortfall = total_orders - sum(counts)
    indices = list(range(total_days))
    rng.shuffle(indices)
    for i in range(shortfall):
        counts[indices[i % total_days]] += 1

    return counts


def run_phase2(
    client: LabAPIClient,
    rng: random.Random,
    patients: List[Dict],
    test_codes: List[str],
    start_date: datetime,
    now: datetime,
) -> List[Dict]:
    """
    Phase 2: Create exactly TARGET_ORDERS orders spread across SIMULATION_DAYS.
    Each day gets at least MIN_ORDERS_PER_DAY. Each order has 2–5 tests.
    Returns list of {order_id, order_date, total_price, tests: [{test_code, sample_id}]} dicts.
    """
    print(f"\n{'='*70}")
    print("  Phase 2: Order Generation ({} orders, min {}/day)".format(TARGET_ORDERS, MIN_ORDERS_PER_DAY))
    print(f"{'='*70}")

    daily_counts = generate_daily_order_counts(rng, SIMULATION_DAYS, TARGET_ORDERS, MIN_ORDERS_PER_DAY)
    orders: List[Dict] = []
    errors = 0
    t0 = time.time()

    # Build patient lookup by registration day offset for fast eligible-patient queries
    # Precompute: for each day, the pool of patients registered on or before that day
    patient_by_day: List[List[Dict]] = [[] for _ in range(SIMULATION_DAYS)]
    for p in patients:
        p_offset = (p["reg_date"] - start_date).days
        p_offset = max(0, min(p_offset, SIMULATION_DAYS - 1))
        patient_by_day[p_offset].append(p)

    # Cumulative pool: patients eligible on day d are all registered on days 0..d
    cumulative_pool: List[List[Dict]] = []
    running: List[Dict] = []
    for d in range(SIMULATION_DAYS):
        running = running + patient_by_day[d]
        cumulative_pool.append(running[:])  # copy

    refresh_counter = 0

    for day_offset, count in enumerate(daily_counts):
        day = start_date + timedelta(days=day_offset)
        eligible = cumulative_pool[day_offset]

        if not eligible:
            # No patients registered yet — skip (shouldn't happen often)
            errors += count
            continue

        for _ in range(count):
            refresh_counter += 1
            if refresh_counter % 500 == 0:
                try:
                    client.login_all()
                except Exception:
                    pass

            patient = rng.choice(eligible)
            sim_date = day + timedelta(hours=rng.randint(7, 17), minutes=rng.randint(0, 59))
            num_tests = rng.randint(MIN_TESTS_PER_ORDER, min(MAX_TESTS_PER_ORDER, len(test_codes)))
            selected = rng.sample(test_codes, num_tests)

            try:
                resp = client.create_order(patient["id"], selected, sim_date)
                order_id = resp["orderId"]
                total_price = resp.get("totalPrice", 0.0)

                # Fetch samples to map test_code -> sample_id
                samples = client.get_samples(order_id)
                test_sample_map: Dict[str, int] = {}
                for s in samples:
                    for tc in s.get("testCodes", []):
                        test_sample_map[tc] = s["sampleId"]

                test_infos = []
                for tc in selected:
                    test_infos.append({"test_code": tc, "sample_id": test_sample_map.get(tc)})

                orders.append({
                    "order_id": order_id,
                    "order_date": sim_date,
                    "total_price": total_price,
                    "tests": test_infos,
                })
            except Exception as e:
                errors += 1
                print(f"  [ERROR] Order creation day {day_offset}: {e}")

        if len(orders) > 0 and len(orders) % 1000 == 0:
            elapsed = time.time() - t0
            print(f"  ... {len(orders)}/{TARGET_ORDERS} orders created ({elapsed:.0f}s)")

    elapsed = time.time() - t0
    print(f"  Created {len(orders)} orders in {elapsed:.1f}s (errors: {errors})")
    return orders


# ---------------------------------------------------------------------------
# Phase 3: Workflow Simulation
# ---------------------------------------------------------------------------
class WorkflowExecutor:
    """Drives individual test lifecycles through the API."""

    def __init__(self, client: LabAPIClient, rng: random.Random,
                 result_items_by_code: Dict[str, List[Dict]]):
        self.client = client
        self.rng = rng
        self.result_items_by_code = result_items_by_code
        self.collected_samples: set = set()
        self.stats = {
            "normal": 0,
            "tech_rejection": 0,
            "sample_rejection": 0,
            "escalation": 0,
            "pending": 0,
            "errors": 0,
        }

    def _collect_if_needed(self, sample_id: int, sim_date: datetime) -> None:
        if sample_id and sample_id not in self.collected_samples:
            try:
                self.client.collect_sample(sample_id, sim_date)
            except RuntimeError as e:
                if "500" in str(e) or "already" in str(e).lower() or "collected" in str(e).lower():
                    # Sample was already collected (e.g. by another process or a previous attempt)
                    pass
                else:
                    raise
            self.collected_samples.add(sample_id)

    def _find_pending_sample(self, order_id: int, test_code: str) -> Optional[Dict]:
        samples = self.client.get_samples(order_id)
        for s in samples:
            if s.get("status") == "pending" and test_code in s.get("testCodes", []):
                return s
        for s in samples:
            if s.get("status") == "pending":
                return s
        return None

    def _ensure_sample_collected(self, order_id: int, test_code: str, sim_date: datetime) -> None:
        """Re-collect if a shared-sample recollection reset this test's sample to PENDING."""
        samples = self.client.get_samples(order_id)
        for s in samples:
            if test_code in s.get("testCodes", []) and s.get("status") == "pending":
                sid = s["sampleId"]
                if sid not in self.collected_samples:
                    self.client.collect_sample(sid, sim_date)
                    self.collected_samples.add(sid)
                return

    def _enter_results_safe(self, order_id: int, test_code: str, results: Dict, sim_date: datetime) -> None:
        """Enter results with recovery from shared-sample 404 errors."""
        try:
            self.client.enter_results(order_id, test_code, results, sim_date)
        except RuntimeError as e:
            if "404" in str(e) or "sample-collected" in str(e).lower():
                self._ensure_sample_collected(order_id, test_code, sim_date)
                self.client.enter_results(order_id, test_code, results, sim_date)
            else:
                raise

    def _gen_results(self, test_code: str) -> Dict[str, Any]:
        items = self.result_items_by_code.get(test_code, [])
        return generate_result_values(items, self.rng)

    def _advance_time(self, base: datetime, hours_range: Tuple[float, float]) -> datetime:
        return base + timedelta(hours=self.rng.uniform(*hours_range))

    # ---- Workflow: Normal (80%) ----
    def run_normal(self, order_id: int, test_code: str, sample_id: int, order_date: datetime) -> None:
        """Collection -> Result Entry -> Validation."""
        t = self._advance_time(order_date, COLLECTION_DELAY_HOURS)
        self._collect_if_needed(sample_id, t)

        t = self._advance_time(t, RESULT_DELAY_HOURS)
        self._enter_results_safe(order_id, test_code, self._gen_results(test_code), t)

        t = self._advance_time(t, VALIDATION_DELAY_HOURS)
        self.client.validate_result(order_id, test_code, t)
        self.stats["normal"] += 1

    # ---- Workflow: Technical Rejection (10%) ----
    def run_tech_rejection(self, order_id: int, test_code: str, sample_id: int, order_date: datetime) -> None:
        """Collection -> Entry -> Reject(re-test) -> Entry -> Validation."""
        t = self._advance_time(order_date, COLLECTION_DELAY_HOURS)
        self._collect_if_needed(sample_id, t)

        # First entry + rejection
        t = self._advance_time(t, RESULT_DELAY_HOURS)
        self._enter_results_safe(order_id, test_code, self._gen_results(test_code), t)

        t = self._advance_time(t, (1, 4))
        reason = self.rng.choice(REJECTION_REASONS_TECH)
        self.client.reject_result(order_id, test_code, "re-test", reason, t)

        # Second entry + validation
        t = self._advance_time(t, (2, 6))
        self._enter_results_safe(order_id, test_code, self._gen_results(test_code), t)

        t = self._advance_time(t, VALIDATION_DELAY_HOURS)
        self.client.validate_result(order_id, test_code, t)
        self.stats["tech_rejection"] += 1

    # ---- Workflow: Sample Rejection (5%) ----
    def run_sample_rejection(self, order_id: int, test_code: str, sample_id: int, order_date: datetime) -> None:
        """Collection -> Entry -> Reject(re-collect) -> New Collection -> Entry -> Validation.
        Falls back to re-test if re-collect fails (shared sample conflict)."""
        t = self._advance_time(order_date, COLLECTION_DELAY_HOURS)
        self._collect_if_needed(sample_id, t)

        # First entry
        t = self._advance_time(t, RESULT_DELAY_HOURS)
        self._enter_results_safe(order_id, test_code, self._gen_results(test_code), t)

        # Reject with re-collect (fallback to re-test)
        t = self._advance_time(t, (1, 4))
        reason = self.rng.choice(REJECTION_REASONS_SAMPLE)
        try:
            self.client.reject_result(order_id, test_code, "re-collect", reason, t)
        except RuntimeError:
            # Shared sample already rejected — fall back to retest
            self.client.reject_result(order_id, test_code, "re-test", reason, t)
            t = self._advance_time(t, (2, 6))
            self._enter_results_safe(order_id, test_code, self._gen_results(test_code), t)
            t = self._advance_time(t, VALIDATION_DELAY_HOURS)
            self.client.validate_result(order_id, test_code, t)
            self.stats["sample_rejection"] += 1
            return

        # Collect new sample
        t = self._advance_time(t, (4, 24))
        new_sample = self._find_pending_sample(order_id, test_code)
        if new_sample:
            new_sid = new_sample["sampleId"]
            self.client.collect_sample(new_sid, t)
            self.collected_samples.add(new_sid)

        # Re-enter + validate
        t = self._advance_time(t, RESULT_DELAY_HOURS)
        self._enter_results_safe(order_id, test_code, self._gen_results(test_code), t)

        t = self._advance_time(t, VALIDATION_DELAY_HOURS)
        self.client.validate_result(order_id, test_code, t)
        self.stats["sample_rejection"] += 1

    # ---- Workflow: Escalation (5%) ----
    def run_escalation(self, order_id: int, test_code: str, sample_id: int, order_date: datetime) -> None:
        """Exhaust both retest limit (3) AND recollection limit (3), then escalate -> force_validate.
        Backend requires BOTH limits exhausted before 'escalate' action becomes available.

        Flow: 3× re-test rejections, then 3× re-collect rejections (each with new sample
        collection + result entry), then final escalate + resolve."""
        t = self._advance_time(order_date, COLLECTION_DELAY_HOURS)
        self._collect_if_needed(sample_id, t)

        # Phase 1: Exhaust retest limit (3 rounds of enter → reject(re-test))
        for i in range(3):
            t = self._advance_time(t, RESULT_DELAY_HOURS)
            self._enter_results_safe(order_id, test_code, self._gen_results(test_code), t)

            t = self._advance_time(t, (1, 4))
            reason = f"Retest #{i+1} - {self.rng.choice(REJECTION_REASONS_TECH)}"
            self.client.reject_result(order_id, test_code, "re-test", reason, t)

        # Phase 2: Exhaust recollection limit (3 rounds of enter → reject(re-collect) → collect new)
        for i in range(3):
            t = self._advance_time(t, RESULT_DELAY_HOURS)
            self._enter_results_safe(order_id, test_code, self._gen_results(test_code), t)

            t = self._advance_time(t, (1, 4))
            reason = f"Recollect #{i+1} - {self.rng.choice(REJECTION_REASONS_SAMPLE)}"
            try:
                self.client.reject_result(order_id, test_code, "re-collect", reason, t)
            except RuntimeError:
                # If re-collect fails (shared sample conflict), skip remaining recollections
                break

            # Collect the new sample
            t = self._advance_time(t, (2, 8))
            new_sample = self._find_pending_sample(order_id, test_code)
            if new_sample:
                new_sid = new_sample["sampleId"]
                self.client.collect_sample(new_sid, t)
                self.collected_samples.add(new_sid)

        # Phase 3: Final entry + escalate
        t = self._advance_time(t, RESULT_DELAY_HOURS)
        self._enter_results_safe(order_id, test_code, self._gen_results(test_code), t)

        t = self._advance_time(t, (1, 4))
        try:
            self.client.reject_result(order_id, test_code, "escalate",
                                      "All retest and recollection options exhausted", t)
        except RuntimeError:
            # Escalate not available — limits may not be fully exhausted; validate instead
            try:
                self.client.validate_result(order_id, test_code, t)
            except RuntimeError:
                pass
            self.stats["escalation"] += 1
            return

        # Phase 4: Resolve escalation via force_validate
        t = self._advance_time(t, (2, 12))
        try:
            self.client.resolve_escalation(order_id, test_code, "force_validate", t,
                                           notes="Escalation resolved - results accepted by supervisor")
        except RuntimeError:
            try:
                self.client.validate_result(order_id, test_code, t)
            except RuntimeError:
                pass

        self.stats["escalation"] += 1

    # ---- Workflow: Pending (leave incomplete) ----
    def run_pending(self, order_id: int, test_code: str, sample_id: int, order_date: datetime,
                    stop_at: str) -> None:
        """Leave test at a specific incomplete stage for realism."""
        if stop_at == "pending_collection":
            # Don't collect — leave as pending
            self.stats["pending"] += 1
            return

        t = self._advance_time(order_date, COLLECTION_DELAY_HOURS)
        self._collect_if_needed(sample_id, t)

        if stop_at == "pending_result":
            # Collected but no result entered
            self.stats["pending"] += 1
            return

        # pending_validation: enter results but don't validate
        t = self._advance_time(t, RESULT_DELAY_HOURS)
        self._enter_results_safe(order_id, test_code, self._gen_results(test_code), t)
        self.stats["pending"] += 1


def pick_destiny(rng: random.Random) -> str:
    roll = rng.random()
    if roll < DESTINY_NORMAL:
        return "normal"
    elif roll < DESTINY_NORMAL + DESTINY_TECH_REJECTION:
        return "tech_rejection"
    elif roll < DESTINY_NORMAL + DESTINY_TECH_REJECTION + DESTINY_SAMPLE_REJECTION:
        return "sample_rejection"
    else:
        return "escalation"


def run_phase3(
    client: LabAPIClient,
    rng: random.Random,
    orders: List[Dict],
    result_items_by_code: Dict[str, List[Dict]],
    now: datetime,
) -> Dict[str, int]:
    """
    Phase 3: Iterate through every test and simulate its lifecycle.

    Realism Filter:
      - Order from today or yesterday → stop early (pending)
      - Order > 7 days ago → must be fully resolved (no stuck pending)
      - 2–7 days ago → 30% chance of pending
    """
    print(f"\n{'='*70}")
    print("  Phase 3: Workflow Simulation")
    print(f"{'='*70}")

    executor = WorkflowExecutor(client, rng, result_items_by_code)
    total_tests = sum(len(o["tests"]) for o in orders)
    processed = 0
    t0 = time.time()
    refresh_counter = 0

    for oi, order in enumerate(orders):
        order_id = order["order_id"]
        order_date = order["order_date"]
        days_ago = (now - order_date).days

        # Assign destinies, respecting shared-sample constraints
        test_destinies: Dict[str, str] = {}
        samples_with_disruptive: set = set()

        for t_info in order["tests"]:
            tc = t_info["test_code"]
            sid = t_info["sample_id"]

            # Realism filter
            if days_ago <= 1:
                test_destinies[tc] = "pending_early"
                continue
            if 2 <= days_ago <= 7 and rng.random() < 0.3:
                test_destinies[tc] = "pending_recent"
                continue

            # > 7 days ago: must be fully resolved
            destiny = pick_destiny(rng)

            # Only one disruptive workflow per shared sample
            if destiny in ("sample_rejection", "escalation") and sid:
                if sid in samples_with_disruptive:
                    destiny = "tech_rejection"
                else:
                    samples_with_disruptive.add(sid)

            test_destinies[tc] = destiny

        # Process non-disruptive first, then disruptive
        pass1 = []  # normal, tech_rejection, pending
        pass2 = []  # sample_rejection, escalation
        for t_info in order["tests"]:
            tc = t_info["test_code"]
            destiny = test_destinies.get(tc, "normal")
            if destiny in ("sample_rejection", "escalation"):
                pass2.append(t_info)
            else:
                pass1.append(t_info)

        for t_info in pass1 + pass2:
            tc = t_info["test_code"]
            sid = t_info["sample_id"]
            destiny = test_destinies.get(tc, "normal")

            refresh_counter += 1
            if refresh_counter % 500 == 0:
                try:
                    client.login_all()
                except Exception:
                    pass

            try:
                if destiny == "pending_early":
                    stop = rng.choice(["pending_collection", "pending_result", "pending_validation"])
                    executor.run_pending(order_id, tc, sid, order_date, stop)
                elif destiny == "pending_recent":
                    stop = rng.choice(["pending_result", "pending_validation"])
                    executor.run_pending(order_id, tc, sid, order_date, stop)
                elif destiny == "normal":
                    executor.run_normal(order_id, tc, sid, order_date)
                elif destiny == "tech_rejection":
                    executor.run_tech_rejection(order_id, tc, sid, order_date)
                elif destiny == "sample_rejection":
                    executor.run_sample_rejection(order_id, tc, sid, order_date)
                elif destiny == "escalation":
                    executor.run_escalation(order_id, tc, sid, order_date)
            except Exception as e:
                executor.stats["errors"] += 1
                print(f"  [ERROR] {destiny} {order_id}/{tc}: {e}")

            processed += 1

        if (oi + 1) % 500 == 0:
            elapsed = time.time() - t0
            print(
                f"  ... {oi+1}/{len(orders)} orders, {processed}/{total_tests} tests "
                f"({elapsed:.0f}s, {executor.stats['errors']} errors)"
            )

    elapsed = time.time() - t0
    print(f"\n  Workflow simulation complete in {elapsed:.1f}s")
    print(f"  Normal:           {executor.stats['normal']}")
    print(f"  Tech Rejection:   {executor.stats['tech_rejection']}")
    print(f"  Sample Rejection: {executor.stats['sample_rejection']}")
    print(f"  Escalation:       {executor.stats['escalation']}")
    print(f"  Pending:          {executor.stats['pending']}")
    print(f"  Errors:           {executor.stats['errors']}")
    return executor.stats


# ---------------------------------------------------------------------------
# Payments
# ---------------------------------------------------------------------------
def run_payments(
    client: LabAPIClient,
    rng: random.Random,
    orders: List[Dict],
) -> int:
    """Mark ~60% of orders as paid via POST /payments."""
    to_pay = int(len(orders) * PAID_ORDER_PERCENTAGE)
    shuffled = orders[:]
    rng.shuffle(shuffled)
    paid = 0
    errors = 0

    print(f"\n  Recording payments for {to_pay}/{len(orders)} orders...")
    for order in shuffled[:to_pay]:
        try:
            pay_date = order["order_date"] + timedelta(hours=rng.uniform(0.5, 24))
            client.create_payment(order["order_id"], order["total_price"], pay_date)
            paid += 1
        except Exception as e:
            errors += 1
            if errors <= 5:
                print(f"  [ERROR] Payment for order {order['order_id']}: {e}")

    print(f"  Payments recorded: {paid} (errors: {errors})")
    return paid


# ---------------------------------------------------------------------------
# Database Reset (clean_db)
# ---------------------------------------------------------------------------
def clean_db(base_url: str) -> None:
    """Reset the database by calling the reset script programmatically.
    Falls back to direct DB truncation if available."""
    print("\n  Resetting database...")
    try:
        from app.database import engine
        from sqlalchemy import text

        tables = [
            "lab_operation_logs", "aliquots", "reports", "insurance_claims",
            "payments", "invoices", "order_tests", "samples", "orders", "patients",
        ]

        with engine.connect() as conn:
            conn.execute(text("DROP RULE IF EXISTS prevent_audit_delete ON lab_operation_logs CASCADE;"))
            conn.execute(text("DROP RULE IF EXISTS prevent_audit_update ON lab_operation_logs CASCADE;"))
            conn.execute(text("DROP TRIGGER IF EXISTS enforce_result_immutability ON order_tests CASCADE;"))

            for table in tables:
                try:
                    conn.execute(text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE;"))
                    print(f"    Truncated: {table}")
                except Exception as e:
                    print(f"    Skip {table}: {e}")

            # Re-apply rules
            conn.execute(text("""
                CREATE OR REPLACE RULE prevent_audit_delete AS
                ON DELETE TO lab_operation_logs DO INSTEAD NOTHING;
            """))
            conn.execute(text("""
                CREATE OR REPLACE RULE prevent_audit_update AS
                ON UPDATE TO lab_operation_logs DO INSTEAD NOTHING;
            """))
            conn.execute(text("""
                CREATE OR REPLACE FUNCTION prevent_validated_result_update()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF OLD.status = 'VALIDATED' AND (
                        (NEW.results::text IS DISTINCT FROM OLD.results::text) OR
                        (NEW.status IS DISTINCT FROM OLD.status)
                    ) THEN
                        RAISE EXCEPTION 'Cannot modify validated results. Create an amended report instead.';
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            """))
            conn.execute(text("""
                CREATE TRIGGER enforce_result_immutability
                BEFORE UPDATE ON order_tests
                FOR EACH ROW EXECUTE FUNCTION prevent_validated_result_update();
            """))
            conn.commit()

        print("  Database reset complete.\n")
    except ImportError:
        print("  WARNING: Could not import app.database — skipping DB reset.")
        print("  Run `PYTHONPATH=. poetry run python db_scripts/reset_lab_data.py` manually first.\n")


# ---------------------------------------------------------------------------
# Main Orchestrator
# ---------------------------------------------------------------------------
def simulate_history(base_url: str, seed: Optional[int] = None, skip_reset: bool = False) -> None:
    rng = random.Random(seed)
    # Also seed the module-level random for client helpers that use random.choice
    random.seed(seed)

    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=SIMULATION_DAYS)

    print("=" * 70)
    print("  Atlas Lab — 2-Year History Simulation (3-Phase)")
    print("=" * 70)
    print(f"  Period:      {start_date.strftime('%Y-%m-%d')} → {now.strftime('%Y-%m-%d')}")
    print(f"  Patients:    {TARGET_PATIENTS}")
    print(f"  Orders:      {TARGET_ORDERS} (min {MIN_ORDERS_PER_DAY}/day)")
    print(f"  Tests/Order: {MIN_TESTS_PER_ORDER}–{MAX_TESTS_PER_ORDER}")
    print(f"  Seed:        {seed or 'random'}")
    print("=" * 70)

    # ---- Reset DB ----
    if not skip_reset:
        clean_db(base_url)

    # ---- Auth ----
    client = LabAPIClient(base_url)
    print("\n  Authenticating...")
    client.login_all()
    print("  All roles authenticated.")

    # ---- Load test catalog ----
    print("  Loading test catalog...")
    all_tests = client.get_tests()
    test_codes = [t["code"] for t in all_tests]
    result_items_by_code: Dict[str, List[Dict]] = {}
    for t in all_tests:
        result_items_by_code[t["code"]] = t.get("resultItems") or []
    print(f"  Found {len(test_codes)} active tests.")

    t_total = time.time()

    # ---- Phase 1 ----
    patients = run_phase1(client, rng, start_date, now)

    # ---- Phase 2 ----
    orders = run_phase2(client, rng, patients, test_codes, start_date, now)

    # ---- Phase 3 ----
    stats = run_phase3(client, rng, orders, result_items_by_code, now)

    # ---- Payments ----
    paid_count = run_payments(client, rng, orders)

    # ---- Final Summary ----
    total_time = time.time() - t_total
    total_tests = sum(v for k, v in stats.items() if k != "errors")
    print(f"\n{'='*70}")
    print("  SIMULATION COMPLETE")
    print(f"{'='*70}")
    print(f"  Total Time:        {total_time:.1f}s")
    print(f"  Patients:          {len(patients)}")
    print(f"  Orders:            {len(orders)}")
    print(f"  Tests Processed:   {total_tests}")
    print(f"    Normal (80%):    {stats['normal']}")
    print(f"    Tech Reject:     {stats['tech_rejection']}")
    print(f"    Sample Reject:   {stats['sample_rejection']}")
    print(f"    Escalation:      {stats['escalation']}")
    print(f"    Pending:         {stats['pending']}")
    print(f"  Payments:          {paid_count}")
    print(f"  Errors:            {stats['errors']}")
    print(f"  Avg Tests/Order:   {total_tests / max(len(orders), 1):.1f}")
    print(f"  Avg Orders/Day:    {len(orders) / SIMULATION_DAYS:.1f}")
    print(f"{'='*70}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Simulate 2 years of lab history via backend APIs.")
    parser.add_argument("--base-url", default="http://localhost:8000", help="Backend server URL")
    parser.add_argument("--seed", type=int, default=42, help="Random seed (default: 42)")
    parser.add_argument("--skip-reset", action="store_true", help="Skip database reset (append to existing data)")
    args = parser.parse_args()

    # Health check
    try:
        resp = requests.get(f"{args.base_url}/health", timeout=5)
        if resp.status_code != 200:
            print(f"Server health check failed: {resp.status_code}")
            sys.exit(1)
    except requests.ConnectionError:
        print(f"Cannot connect to server at {args.base_url}")
        print("Start the server with: SIMULATION_MODE=true PYTHONPATH=. poetry run uvicorn app.main:app --port 8000")
        sys.exit(1)

    simulate_history(base_url=args.base_url, seed=args.seed, skip_reset=args.skip_reset)


if __name__ == "__main__":
    main()
