"""
End-to-End Data Simulation Suite
=================================
Generates 2 years (730 days) of realistic lab history by calling Backend APIs.
Acts as a Frontend client: every operation goes through HTTP, ensuring all side
effects (audit logs, triggers, status updates) are handled by application logic.

Requires:
  - The backend server running with SIMULATION_MODE=true
  - Users and test catalog already seeded (run init_db first with --include-config, or ensure users/tests exist)

Usage (from backend directory):
  # Terminal 1: start the server in simulation mode
  SIMULATION_MODE=true PYTHONPATH=. poetry run uvicorn app.main:app --port 8000

  # Terminal 2: run the simulation
  PYTHONPATH=. poetry run python db_scripts/simulate_history.py [--base-url http://localhost:8000] [--seed 42]
"""
from __future__ import annotations

import argparse
import math
import random
import sys
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SIMULATION_DAYS = 730  # 2 years
TARGET_ORDERS_PER_DAY = 10
MIN_ORDERS_PER_PATIENT = 1
MAX_ORDERS_PER_PATIENT = 10
MIN_TESTS_PER_ORDER = 1
MAX_TESTS_PER_ORDER = 5
PAID_ORDER_PERCENTAGE = 0.6  # 60% of orders get a payment

# Auto-calculate patient count to hit ~TARGET_ORDERS_PER_DAY
_AVG_ORDERS_PER_PATIENT = (MIN_ORDERS_PER_PATIENT + MAX_ORDERS_PER_PATIENT) / 2
_TOTAL_ORDERS_NEEDED = TARGET_ORDERS_PER_DAY * SIMULATION_DAYS
NUM_PATIENTS = math.ceil(_TOTAL_ORDERS_NEEDED / _AVG_ORDERS_PER_PATIENT)  # ~1327

# Workflow destiny weights
DESTINY_NORMAL = 0.80
DESTINY_TECH_REJECTION = 0.10
DESTINY_SAMPLE_REJECTION = 0.05
DESTINY_ESCALATION = 0.05

# Time deltas (hours)
COLLECTION_DELAY_MIN = 1
COLLECTION_DELAY_MAX = 8
RESULT_DELAY_MIN = 2
RESULT_DELAY_MAX = 48
VALIDATION_DELAY_MIN = 0.5
VALIDATION_DELAY_MAX = 24

# Simulated date header
SIM_HEADER = "X-Simulated-Date"

# User credentials (from generate_users.py)
USERS = {
    "admin": {"username": "admin", "password": "admin123"},
    "receptionist": {"username": "receptionist", "password": "recept123"},
    "labtech": {"username": "labtech", "password": "lab123"},
    "labtech_plus": {"username": "labtech_plus", "password": "labplus123"},
}

# Patient data generation helpers
FIRST_NAMES_MALE = [
    "Kwame", "Kofi", "Yaw", "Ama", "Kojo", "Osei", "Mensah", "Adjei",
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


# ---------------------------------------------------------------------------
# API Client
# ---------------------------------------------------------------------------
class LabAPIClient:
    """HTTP client that acts as the Frontend, sending requests to the backend."""

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.api = f"{self.base_url}/api/v1"
        self.tokens: Dict[str, str] = {}  # role -> access_token
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})

    def _url(self, path: str) -> str:
        return f"{self.api}{path}"

    def _headers(self, role: str, simulated_date: Optional[datetime] = None) -> Dict:
        headers = {"Authorization": f"Bearer {self.tokens[role]}"}
        if simulated_date:
            headers[SIM_HEADER] = simulated_date.isoformat()
        return headers

    # ---- Auth ----
    def login(self, role: str) -> None:
        creds = USERS[role]
        resp = self.session.post(
            self._url("/auth/login"),
            json={"username": creds["username"], "password": creds["password"]},
        )
        if resp.status_code != 200:
            raise RuntimeError(f"Login failed for {role}: {resp.status_code} {resp.text}")
        data = resp.json()
        self.tokens[role] = data["access_token"]

    def refresh_token(self, role: str) -> None:
        """Re-login to get a fresh token (simpler than refresh flow for simulation)."""
        self.login(role)

    def login_all(self) -> None:
        for role in USERS:
            self.login(role)
            print(f"  Logged in as: {role}")

    # ---- Patients ----
    def create_patient(self, patient_data: Dict, sim_date: datetime) -> Dict:
        resp = self.session.post(
            self._url("/patients"),
            json=patient_data,
            headers=self._headers("receptionist", sim_date),
        )
        if resp.status_code == 401:
            self.refresh_token("receptionist")
            resp = self.session.post(
                self._url("/patients"),
                json=patient_data,
                headers=self._headers("receptionist", sim_date),
            )
        if resp.status_code not in (200, 201):
            raise RuntimeError(f"Create patient failed: {resp.status_code} {resp.text[:300]}")
        return resp.json()

    # ---- Orders ----
    def create_order(self, patient_id: int, test_codes: List[str], sim_date: datetime) -> Dict:
        payload = {
            "patientId": patient_id,
            "tests": [{"testCode": tc} for tc in test_codes],
            "priority": random.choice(["low", "medium", "high"]),
        }
        resp = self.session.post(
            self._url("/orders"),
            json=payload,
            headers=self._headers("receptionist", sim_date),
        )
        if resp.status_code == 401:
            self.refresh_token("receptionist")
            resp = self.session.post(
                self._url("/orders"),
                json=payload,
                headers=self._headers("receptionist", sim_date),
            )
        if resp.status_code not in (200, 201):
            raise RuntimeError(f"Create order failed: {resp.status_code} {resp.text[:300]}")
        return resp.json()

    # ---- Samples ----
    def collect_sample(self, sample_id: int, sim_date: datetime) -> Dict:
        payload = {
            "collectedVolume": round(random.uniform(3.0, 10.0), 1),
            "actualContainerType": "tube",
            "actualContainerColor": random.choice(["red", "purple", "blue", "green", "gray"]),
        }
        resp = self.session.patch(
            self._url(f"/samples/{sample_id}/collect"),
            json=payload,
            headers=self._headers("labtech", sim_date),
        )
        if resp.status_code == 401:
            self.refresh_token("labtech")
            resp = self.session.patch(
                self._url(f"/samples/{sample_id}/collect"),
                json=payload,
                headers=self._headers("labtech", sim_date),
            )
        if resp.status_code not in (200, 201):
            raise RuntimeError(f"Collect sample {sample_id} failed: {resp.status_code} {resp.text[:300]}")
        return resp.json()

    def reject_and_recollect_sample(self, sample_id: int, sim_date: datetime) -> Dict:
        payload = {
            "rejectionReasons": [random.choice(["hemolyzed", "clotted", "qns", "wrong_container"])],
            "rejectionNotes": "Simulation: sample quality issue",
            "recollectionReason": "Sample rejected - recollection needed",
        }
        resp = self.session.post(
            self._url(f"/samples/{sample_id}/reject-and-recollect"),
            json=payload,
            headers=self._headers("labtech", sim_date),
        )
        if resp.status_code == 401:
            self.refresh_token("labtech")
            resp = self.session.post(
                self._url(f"/samples/{sample_id}/reject-and-recollect"),
                json=payload,
                headers=self._headers("labtech", sim_date),
            )
        if resp.status_code not in (200, 201):
            raise RuntimeError(
                f"Reject+recollect sample {sample_id} failed: {resp.status_code} {resp.text[:300]}"
            )
        return resp.json()

    # ---- Results ----
    def enter_results(
        self, order_id: int, test_code: str, results: Dict, sim_date: datetime
    ) -> Dict:
        payload = {"results": results, "technicianNotes": "Simulation entry"}
        resp = self.session.post(
            self._url(f"/results/{order_id}/tests/{test_code}"),
            json=payload,
            headers=self._headers("labtech", sim_date),
        )
        if resp.status_code == 401:
            self.refresh_token("labtech")
            resp = self.session.post(
                self._url(f"/results/{order_id}/tests/{test_code}"),
                json=payload,
                headers=self._headers("labtech", sim_date),
            )
        if resp.status_code not in (200, 201):
            raise RuntimeError(
                f"Enter results {order_id}/{test_code} failed: {resp.status_code} {resp.text[:300]}"
            )
        return resp.json()

    def validate_result(self, order_id: int, test_code: str, sim_date: datetime) -> Dict:
        payload = {"decision": "approved", "validationNotes": "Simulation validation"}
        resp = self.session.post(
            self._url(f"/results/{order_id}/tests/{test_code}/validate"),
            json=payload,
            headers=self._headers("labtech_plus", sim_date),
        )
        if resp.status_code == 401:
            self.refresh_token("labtech_plus")
            resp = self.session.post(
                self._url(f"/results/{order_id}/tests/{test_code}/validate"),
                json=payload,
                headers=self._headers("labtech_plus", sim_date),
            )
        if resp.status_code not in (200, 201):
            raise RuntimeError(
                f"Validate result {order_id}/{test_code} failed: {resp.status_code} {resp.text[:300]}"
            )
        return resp.json()

    def reject_result(
        self,
        order_id: int,
        test_code: str,
        rejection_type: str,
        reason: str,
        sim_date: datetime,
    ) -> Dict:
        payload = {
            "rejectionReason": reason,
            "rejectionType": rejection_type,
        }
        resp = self.session.post(
            self._url(f"/results/{order_id}/tests/{test_code}/reject"),
            json=payload,
            headers=self._headers("labtech_plus", sim_date),
        )
        if resp.status_code == 401:
            self.refresh_token("labtech_plus")
            resp = self.session.post(
                self._url(f"/results/{order_id}/tests/{test_code}/reject"),
                json=payload,
                headers=self._headers("labtech_plus", sim_date),
            )
        if resp.status_code not in (200, 201):
            raise RuntimeError(
                f"Reject result {order_id}/{test_code} ({rejection_type}) failed: "
                f"{resp.status_code} {resp.text[:300]}"
            )
        return resp.json()

    # ---- Test Catalog ----
    def get_tests(self) -> List[Dict]:
        resp = self.session.get(self._url("/tests"), headers=self._headers("admin"))
        if resp.status_code == 401:
            self.refresh_token("admin")
            resp = self.session.get(self._url("/tests"), headers=self._headers("admin"))
        if resp.status_code != 200:
            raise RuntimeError(f"Get tests failed: {resp.status_code}")
        return resp.json()

    # ---- Payments (normal workflow: POST /payments → PaymentService creates Payment + updates order) ----
    def create_payment(
        self,
        order_id: int,
        amount: float,
        sim_date: datetime,
        payment_method: str = "cash",
    ) -> Dict:
        """POST /payments — create payment record; PaymentService updates orders.payment_status when fully paid."""
        payload: Dict[str, Any] = {
            "orderId": order_id,
            "amount": amount,
            "paymentMethod": payment_method,
        }
        resp = self.session.post(
            self._url("/payments"),
            json=payload,
            headers=self._headers("receptionist", sim_date),
        )
        if resp.status_code == 401:
            self.refresh_token("receptionist")
            resp = self.session.post(
                self._url("/payments"),
                json=payload,
                headers=self._headers("receptionist", sim_date),
            )
        if resp.status_code not in (200, 201):
            raise RuntimeError(
                f"Create payment for order {order_id} failed: {resp.status_code} {resp.text[:300]}"
            )
        return resp.json()

    # ---- Order Detail ----
    def get_order(self, order_id: int) -> Dict:
        resp = self.session.get(
            self._url(f"/orders/{order_id}"),
            headers=self._headers("receptionist"),
        )
        if resp.status_code == 401:
            self.refresh_token("receptionist")
            resp = self.session.get(
                self._url(f"/orders/{order_id}"),
                headers=self._headers("receptionist"),
            )
        if resp.status_code != 200:
            raise RuntimeError(f"Get order {order_id} failed: {resp.status_code}")
        return resp.json()

    # ---- Samples by order ----
    def get_samples(self, order_id: int) -> List[Dict]:
        resp = self.session.get(
            self._url(f"/samples?orderId={order_id}"),
            headers=self._headers("labtech"),
        )
        if resp.status_code == 401:
            self.refresh_token("labtech")
            resp = self.session.get(
                self._url(f"/samples?orderId={order_id}"),
                headers=self._headers("labtech"),
            )
        if resp.status_code != 200:
            raise RuntimeError(f"Get samples for order {order_id} failed: {resp.status_code}")
        data = resp.json()
        # Handle both list and paginated response
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and "data" in data:
            return data["data"]
        return data


# ---------------------------------------------------------------------------
# Data Generation Helpers
# ---------------------------------------------------------------------------
def generate_patient_payload(rng: random.Random) -> Dict:
    """Generate a realistic patient payload for the POST /patients API."""
    gender = rng.choice(["male", "female"])
    if gender == "male":
        first = rng.choice(FIRST_NAMES_MALE)
    else:
        first = rng.choice(FIRST_NAMES_FEMALE)
    last = rng.choice(LAST_NAMES)

    age = rng.randint(1, 85)
    dob = (datetime.now() - timedelta(days=age * 365 + rng.randint(0, 364))).strftime("%Y-%m-%d")
    phone = f"+{rng.randint(200, 299)}{rng.randint(100000000, 999999999)}"

    city = rng.choice(CITIES)

    payload: Dict[str, Any] = {
        "fullName": f"{first} {last}",
        "dateOfBirth": dob,
        "gender": gender,
        "phone": phone,
        "email": f"{first.lower()}.{last.lower()}{rng.randint(1,999)}@example.com",
        "height": round(rng.uniform(150, 195), 1) if age >= 18 else round(rng.uniform(60, 170), 1),
        "weight": round(rng.uniform(45, 110), 1) if age >= 18 else round(rng.uniform(5, 70), 1),
        "address": {
            "street": f"{rng.randint(1, 500)} {rng.choice(['Main', 'Market', 'Independence', 'Liberation', 'Unity'])} Street",
            "city": city,
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
            "lifestyle": {
                "smoking": rng.random() < 0.15,
                "alcohol": rng.random() < 0.25,
            },
        },
    }

    # 60% have vital signs
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
    """Replicate the backend's _get_physiologic_limit() partial-match logic exactly.

    The backend (result_validator.py) matches item codes using:
    1. Direct match
    2. Case-insensitive exact match
    3. Partial match: key.lower() in item_code.lower() OR item_code.lower() in key.lower()

    This causes false positives like PLAT matching 'P' (Phosphorus, max 20),
    PREALBUM matching 'P', LIPASE matching 'P', EGFR_VALUE matching 'eGFR', etc.
    We replicate the same logic here to clamp generated values below the limits
    the backend will enforce.
    """
    # Direct match
    if item_code in PHYSIOLOGIC_LIMITS:
        return PHYSIOLOGIC_LIMITS[item_code]

    # Case-insensitive exact match
    item_code_upper = item_code.upper()
    for key, limit in PHYSIOLOGIC_LIMITS.items():
        if key.upper() == item_code_upper:
            return limit

    # Partial match (same as backend - first match wins)
    for key, limit in PHYSIOLOGIC_LIMITS.items():
        if key.lower() in item_code.lower() or item_code.lower() in key.lower():
            return limit

    return None


# Copy of backend's PHYSIOLOGIC_LIMITS for clamping generated values
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


def generate_result_values(result_items: List[Dict], rng: random.Random) -> Dict[str, Any]:
    """Generate realistic result values from a test's result_items catalog.

    Values are generated within the INTERSECTION of the catalog reference range
    and the backend's physiologic limits (including its partial-match logic).
    This avoids all physiologic validation false positives.
    """
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

                # Clamp to physiologic limits the backend would enforce
                phys = _get_backend_physiologic_limit(code)
                if phys:
                    # Use the intersection of [ref_low, ref_high] and [phys_min, phys_max]
                    effective_low = max(low, phys['min'])
                    effective_high = min(high, phys['max'])
                    # Margin must exceed rounding precision to avoid round() producing boundary values
                    precision = 10 ** (-decimals)  # 1.0 for 0 decimals, 0.1 for 1, etc.
                    margin = max((effective_high - effective_low) * 0.02, precision)
                    effective_low = effective_low + margin
                    effective_high = effective_high - margin
                    if effective_low >= effective_high:
                        # Range collapsed; use physiologic midpoint
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


def pick_destiny(rng: random.Random) -> str:
    """Pick a workflow destiny for a test based on configured weights."""
    roll = rng.random()
    if roll < DESTINY_NORMAL:
        return "normal"
    elif roll < DESTINY_NORMAL + DESTINY_TECH_REJECTION:
        return "tech_rejection"
    elif roll < DESTINY_NORMAL + DESTINY_TECH_REJECTION + DESTINY_SAMPLE_REJECTION:
        return "sample_rejection"
    else:
        return "escalation"


# ---------------------------------------------------------------------------
# Workflow Executor
# ---------------------------------------------------------------------------
class WorkflowExecutor:
    """Executes test workflows through the API, tracking collected samples."""

    def __init__(self, client: LabAPIClient, rng: random.Random):
        self.client = client
        self.rng = rng
        self.collected_samples: set = set()  # track sample_ids already collected
        self.stats = {
            "patients": 0,
            "orders": 0,
            "tests_normal": 0,
            "tests_tech_reject": 0,
            "tests_sample_reject": 0,
            "tests_escalated": 0,
            "tests_pending": 0,
            "errors": 0,
        }

    def _collect_if_needed(self, sample_id: int, sim_date: datetime) -> None:
        """Collect a sample only if it hasn't been collected yet."""
        if sample_id not in self.collected_samples:
            self.client.collect_sample(sample_id, sim_date)
            self.collected_samples.add(sample_id)

    def _find_pending_sample_for_test(self, order_id: int, test_code: str) -> Optional[Dict]:
        """Find the pending sample that contains the given test_code."""
        samples = self.client.get_samples(order_id)
        # Prefer a pending recollection sample containing this test
        for s in samples:
            if s.get("status") == "pending" and test_code in s.get("testCodes", []):
                return s
        # Fallback: any pending sample (older orders may have simpler structure)
        for s in samples:
            if s.get("status") == "pending":
                return s
        return None

    def _ensure_sample_collected(self, order_id: int, test_code: str, sim_date: datetime) -> None:
        """Re-collect the sample for a test if a shared-sample recollection reset it to PENDING.

        When another test on the same sample triggers a re-collect, ALL tests on that
        sample get reset to PENDING. This method detects that scenario and re-collects
        the new pending sample so the test can proceed.
        """
        samples = self.client.get_samples(order_id)
        for s in samples:
            test_codes_on_sample = s.get("testCodes", [])
            if test_code in test_codes_on_sample and s.get("status") == "pending":
                new_sid = s["sampleId"]
                if new_sid not in self.collected_samples:
                    self.client.collect_sample(new_sid, sim_date)
                    self.collected_samples.add(new_sid)
                return

    def _enter_results_with_recovery(
        self, order_id: int, test_code: str, results: Dict, sim_date: datetime
    ) -> None:
        """Enter results with automatic recovery from shared-sample 404 errors."""
        try:
            self.client.enter_results(order_id, test_code, results, sim_date)
        except RuntimeError as e:
            if "404" in str(e) and "sample-collected" in str(e):
                # Shared sample was recollected by another test; re-collect and retry
                self._ensure_sample_collected(order_id, test_code, sim_date)
                self.client.enter_results(order_id, test_code, results, sim_date)
            else:
                raise

    def run_normal_workflow(
        self,
        order_id: int,
        test_code: str,
        sample_id: int,
        result_items: List[Dict],
        order_date: datetime,
    ) -> None:
        """Normal: Collect -> Enter Result -> Validate."""
        t_collect = order_date + timedelta(hours=self.rng.uniform(COLLECTION_DELAY_MIN, COLLECTION_DELAY_MAX))
        t_result = t_collect + timedelta(hours=self.rng.uniform(RESULT_DELAY_MIN, RESULT_DELAY_MAX))
        t_validate = t_result + timedelta(hours=self.rng.uniform(VALIDATION_DELAY_MIN, VALIDATION_DELAY_MAX))

        self._collect_if_needed(sample_id, t_collect)
        results = generate_result_values(result_items, self.rng)
        self._enter_results_with_recovery(order_id, test_code, results, t_result)
        self.client.validate_result(order_id, test_code, t_validate)
        self.stats["tests_normal"] += 1

    def run_tech_rejection_workflow(
        self,
        order_id: int,
        test_code: str,
        sample_id: int,
        result_items: List[Dict],
        order_date: datetime,
    ) -> None:
        """Tech Rejection: Collect -> Enter -> Reject(retest) -> Enter -> Validate."""
        t = order_date + timedelta(hours=self.rng.uniform(COLLECTION_DELAY_MIN, COLLECTION_DELAY_MAX))
        self._collect_if_needed(sample_id, t)

        # First entry + rejection
        t += timedelta(hours=self.rng.uniform(RESULT_DELAY_MIN, RESULT_DELAY_MAX))
        results = generate_result_values(result_items, self.rng)
        self._enter_results_with_recovery(order_id, test_code, results, t)

        t += timedelta(hours=self.rng.uniform(1, 4))
        reason = self.rng.choice(REJECTION_REASONS_TECH)
        self.client.reject_result(order_id, test_code, "re-test", reason, t)

        # Second entry + validation
        t += timedelta(hours=self.rng.uniform(2, 6))
        results = generate_result_values(result_items, self.rng)
        self._enter_results_with_recovery(order_id, test_code, results, t)

        t += timedelta(hours=self.rng.uniform(VALIDATION_DELAY_MIN, VALIDATION_DELAY_MAX))
        self.client.validate_result(order_id, test_code, t)
        self.stats["tests_tech_reject"] += 1

    def run_sample_rejection_workflow(
        self,
        order_id: int,
        test_code: str,
        sample_id: int,
        result_items: List[Dict],
        order_date: datetime,
    ) -> None:
        """Sample Rejection: Collect -> Enter -> Reject(recollect) -> new sample -> Enter -> Validate.

        If the re-collect rejection fails (e.g., shared sample already rejected),
        falls back to a retest workflow instead.
        """
        t = order_date + timedelta(hours=self.rng.uniform(COLLECTION_DELAY_MIN, COLLECTION_DELAY_MAX))
        self._collect_if_needed(sample_id, t)

        # First entry
        t += timedelta(hours=self.rng.uniform(RESULT_DELAY_MIN, RESULT_DELAY_MAX))
        results = generate_result_values(result_items, self.rng)
        self._enter_results_with_recovery(order_id, test_code, results, t)

        # Try rejection with recollect; fall back to retest if it fails
        t += timedelta(hours=self.rng.uniform(1, 4))
        reason = self.rng.choice(REJECTION_REASONS_SAMPLE)
        try:
            self.client.reject_result(order_id, test_code, "re-collect", reason, t)
        except RuntimeError:
            # Shared sample may already be rejected by another test's workflow.
            # Fall back to retest path.
            self.client.reject_result(order_id, test_code, "re-test", reason, t)
            t += timedelta(hours=self.rng.uniform(2, 6))
            results = generate_result_values(result_items, self.rng)
            self._enter_results_with_recovery(order_id, test_code, results, t)
            t += timedelta(hours=self.rng.uniform(VALIDATION_DELAY_MIN, VALIDATION_DELAY_MAX))
            self.client.validate_result(order_id, test_code, t)
            self.stats["tests_sample_reject"] += 1
            return

        # Collect the new sample (find the one containing this test)
        t += timedelta(hours=self.rng.uniform(4, 24))
        new_sample = self._find_pending_sample_for_test(order_id, test_code)
        if new_sample:
            new_sid = new_sample["sampleId"]
            self.client.collect_sample(new_sid, t)
            self.collected_samples.add(new_sid)

        # Re-enter results and validate
        t += timedelta(hours=self.rng.uniform(RESULT_DELAY_MIN, RESULT_DELAY_MAX))
        results = generate_result_values(result_items, self.rng)
        self._enter_results_with_recovery(order_id, test_code, results, t)

        t += timedelta(hours=self.rng.uniform(VALIDATION_DELAY_MIN, VALIDATION_DELAY_MAX))
        self.client.validate_result(order_id, test_code, t)
        self.stats["tests_sample_reject"] += 1

    def run_escalation_workflow(
        self,
        order_id: int,
        test_code: str,
        sample_id: int,
        result_items: List[Dict],
        order_date: datetime,
    ) -> None:
        """Heavy rejection workflow: 3 retests + optional recollections + final validation.

        Builds rich rejection history. If re-collect fails (shared sample already
        rejected by another test), falls back to completing with validation only.
        """
        t = order_date + timedelta(hours=self.rng.uniform(COLLECTION_DELAY_MIN, COLLECTION_DELAY_MAX))
        self._collect_if_needed(sample_id, t)

        # Phase 1: 3 rounds of enter+reject(retest) to exhaust retests
        for i in range(3):
            t += timedelta(hours=self.rng.uniform(RESULT_DELAY_MIN, RESULT_DELAY_MAX))
            results = generate_result_values(result_items, self.rng)
            self._enter_results_with_recovery(order_id, test_code, results, t)

            t += timedelta(hours=self.rng.uniform(1, 4))
            reason = f"Retest attempt {i + 1} - {self.rng.choice(REJECTION_REASONS_TECH)}"
            self.client.reject_result(order_id, test_code, "re-test", reason, t)

        # Phase 2: Try 2 rounds of re-collect; skip on failure (shared sample issue)
        recollect_succeeded = True
        for i in range(2):
            t += timedelta(hours=self.rng.uniform(RESULT_DELAY_MIN, RESULT_DELAY_MAX))
            results = generate_result_values(result_items, self.rng)
            self._enter_results_with_recovery(order_id, test_code, results, t)

            t += timedelta(hours=self.rng.uniform(1, 4))
            reason = f"Recollect attempt {i + 1} - {self.rng.choice(REJECTION_REASONS_SAMPLE)}"
            try:
                self.client.reject_result(order_id, test_code, "re-collect", reason, t)
            except RuntimeError:
                # Shared sample already rejected - fall back to retest and finish
                try:
                    self.client.reject_result(order_id, test_code, "re-test", reason, t)
                except RuntimeError:
                    pass  # If even retest fails, just validate what we have
                recollect_succeeded = False
                break

            # Collect the new sample (find the one containing this test)
            t += timedelta(hours=self.rng.uniform(4, 12))
            try:
                new_sample = self._find_pending_sample_for_test(order_id, test_code)
                if new_sample:
                    new_sid = new_sample["sampleId"]
                    self.client.collect_sample(new_sid, t)
                    self.collected_samples.add(new_sid)
            except RuntimeError:
                recollect_succeeded = False
                break

        # Phase 3: Final entry and validation
        t += timedelta(hours=self.rng.uniform(RESULT_DELAY_MIN, RESULT_DELAY_MAX))
        results = generate_result_values(result_items, self.rng)
        try:
            self.client.enter_results(order_id, test_code, results, t)
        except RuntimeError:
            # Test may not be in sample-collected state after recollection issues;
            # skip final result entry - the test still has rich rejection history
            self.stats["tests_escalated"] += 1
            return

        t += timedelta(hours=self.rng.uniform(VALIDATION_DELAY_MIN, VALIDATION_DELAY_MAX))
        self.client.validate_result(order_id, test_code, t)
        self.stats["tests_escalated"] += 1

    def run_pending_workflow(
        self,
        order_id: int,
        test_code: str,
        sample_id: int,
        result_items: List[Dict],
        order_date: datetime,
        stop_at: str,
    ) -> None:
        """Leave workflow incomplete at a specific stage."""
        now = datetime.now(timezone.utc)
        if stop_at == "pending_collection":
            self.stats["tests_pending"] += 1
            return

        t_collect = order_date + timedelta(hours=self.rng.uniform(COLLECTION_DELAY_MIN, COLLECTION_DELAY_MAX))
        if t_collect > now:
            self.stats["tests_pending"] += 1
            return
        self._collect_if_needed(sample_id, t_collect)

        if stop_at == "pending_result":
            self.stats["tests_pending"] += 1
            return

        t_result = t_collect + timedelta(hours=self.rng.uniform(RESULT_DELAY_MIN, RESULT_DELAY_MAX))
        if t_result > now:
            self.stats["tests_pending"] += 1
            return
        results = generate_result_values(result_items, self.rng)
        self._enter_results_with_recovery(order_id, test_code, results, t_result)
        self.stats["tests_pending"] += 1


# ---------------------------------------------------------------------------
# Main Simulation
# ---------------------------------------------------------------------------
def simulate_history(
    base_url: str,
    seed: Optional[int] = None,
    num_patients: int = NUM_PATIENTS,
    daily_volume: int = TARGET_ORDERS_PER_DAY,
) -> None:
    """
    Generate 2 years of realistic lab history by calling backend APIs.
    """
    rng = random.Random(seed)
    client = LabAPIClient(base_url)

    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=SIMULATION_DAYS)

    print("=" * 70)
    print("  Atlas Lab - 2-Year History Simulation")
    print("=" * 70)
    print(f"  Period:        {start_date.strftime('%Y-%m-%d')} to {now.strftime('%Y-%m-%d')}")
    print(f"  Patients:      {num_patients}")
    print(f"  Target volume: ~{daily_volume} orders/day")
    print(f"  Seed:          {seed or 'random'}")
    print("=" * 70)

    # ---- Step 1: Authenticate ----
    print("\n[1/5] Authenticating...")
    client.login_all()

    # ---- Step 2: Fetch test catalog ----
    print("\n[2/5] Loading test catalog...")
    all_tests = client.get_tests()
    test_codes = [t["code"] for t in all_tests]
    # Build result_items lookup by test code
    result_items_by_code: Dict[str, List[Dict]] = {}
    for t in all_tests:
        code = t["code"]
        result_items_by_code[code] = t.get("resultItems") or []
    print(f"  Found {len(test_codes)} tests in catalog")

    # ---- Step 3: Plan patients and orders ----
    print("\n[3/5] Planning simulation...")

    # Generate registration dates for each patient
    patient_plans: List[Dict] = []
    for i in range(num_patients):
        reg_date = start_date + timedelta(
            days=rng.randint(0, SIMULATION_DAYS - 30)  # register at least 30 days before end
        )
        num_orders = rng.randint(MIN_ORDERS_PER_PATIENT, MAX_ORDERS_PER_PATIENT)
        patient_plans.append({
            "index": i,
            "reg_date": reg_date,
            "num_orders": num_orders,
            "payload": generate_patient_payload(rng),
        })

    total_orders = sum(p["num_orders"] for p in patient_plans)
    print(f"  Planned {num_patients} patients with {total_orders} total orders")
    print(f"  Target daily volume: ~{total_orders / SIMULATION_DAYS:.1f} orders/day")

    # ---- Step 4: Execute patient-first loop ----
    print("\n[4/5] Running simulation...")
    executor = WorkflowExecutor(client, rng)
    start_time = time.time()
    token_refresh_interval = 500  # refresh tokens every N orders to avoid expiry
    orders_created_for_payment: List[tuple] = []  # (order_id, total_price, order_date)

    for pi, plan in enumerate(patient_plans):
        reg_date = plan["reg_date"]

        # Create patient
        try:
            patient_resp = client.create_patient(plan["payload"], reg_date)
            patient_id = patient_resp["id"]
            executor.stats["patients"] += 1
        except Exception as e:
            print(f"  [ERROR] Patient {pi}: {e}")
            executor.stats["errors"] += 1
            continue

        # Generate orders for this patient
        for oi in range(plan["num_orders"]):
            # Refresh tokens periodically
            if executor.stats["orders"] > 0 and executor.stats["orders"] % token_refresh_interval == 0:
                try:
                    client.login_all()
                except Exception:
                    pass

            # Order date: between registration and now
            days_available = (now - reg_date).days
            if days_available < 1:
                days_available = 1
            order_day_offset = rng.randint(0, days_available - 1)
            order_date = reg_date + timedelta(days=order_day_offset, hours=rng.randint(7, 17))

            # Select random tests
            num_tests = rng.randint(MIN_TESTS_PER_ORDER, min(MAX_TESTS_PER_ORDER, len(test_codes)))
            selected_tests = rng.sample(test_codes, num_tests)

            try:
                order_resp = client.create_order(patient_id, selected_tests, order_date)
                order_id = order_resp["orderId"]
                total_price = order_resp.get("totalPrice", 0.0)
                executor.stats["orders"] += 1
                orders_created_for_payment.append((order_id, total_price, order_date))
            except Exception as e:
                print(f"  [ERROR] Order for patient {patient_id}: {e}")
                executor.stats["errors"] += 1
                continue

            # Get samples for this order
            try:
                samples = client.get_samples(order_id)
            except Exception as e:
                print(f"  [ERROR] Get samples for order {order_id}: {e}")
                executor.stats["errors"] += 1
                continue

            # Build test_code -> sample_id mapping
            test_to_sample: Dict[str, int] = {}
            for sample in samples:
                for tc in sample.get("testCodes", []):
                    test_to_sample[tc] = sample["sampleId"]

            # Determine "Pending" logic based on order age
            days_ago = (now - order_date).days

            # Assign destinies upfront for all tests, then enforce shared-sample constraints:
            # Only ONE disruptive workflow (sample_rejection/escalation) per shared sample.
            # This prevents re-collect on one test from disrupting another test on the same sample.
            test_destinies: Dict[str, str] = {}
            samples_with_disruptive: set = set()  # sample_ids that already have a disruptive workflow

            for test_code in selected_tests:
                sample_id = test_to_sample.get(test_code)
                if not sample_id:
                    continue

                if days_ago <= 1:
                    test_destinies[test_code] = "pending_early"
                    continue
                if days_ago <= 7 and rng.random() < 0.3:
                    test_destinies[test_code] = "pending_recent"
                    continue

                destiny = pick_destiny(rng)

                # If this is a disruptive workflow and the shared sample already has one,
                # downgrade to tech_rejection (still interesting, but doesn't touch the sample)
                if destiny in ("sample_rejection", "escalation"):
                    if sample_id in samples_with_disruptive:
                        destiny = "tech_rejection"
                    else:
                        samples_with_disruptive.add(sample_id)

                test_destinies[test_code] = destiny

            # Process tests in two passes:
            # Pass 1: non-disruptive (normal, tech_rejection, pending) — these complete cleanly
            # Pass 2: disruptive (sample_rejection, escalation) — may re-collect shared samples
            pass1 = []
            pass2 = []
            for test_code in selected_tests:
                destiny = test_destinies.get(test_code)
                if not destiny:
                    continue
                if destiny in ("sample_rejection", "escalation"):
                    pass2.append((test_code, destiny))
                else:
                    pass1.append((test_code, destiny))

            for test_code, destiny in pass1 + pass2:
                sample_id = test_to_sample.get(test_code)
                if not sample_id:
                    continue
                result_items = result_items_by_code.get(test_code, [])

                try:
                    if destiny == "pending_early":
                        stop_at = rng.choice(["pending_collection", "pending_result", "pending_validation"])
                        executor.run_pending_workflow(
                            order_id, test_code, sample_id, result_items, order_date, stop_at
                        )
                    elif destiny == "pending_recent":
                        stop_at = rng.choice(["pending_result", "pending_validation"])
                        executor.run_pending_workflow(
                            order_id, test_code, sample_id, result_items, order_date, stop_at
                        )
                    elif destiny == "normal":
                        executor.run_normal_workflow(
                            order_id, test_code, sample_id, result_items, order_date
                        )
                    elif destiny == "tech_rejection":
                        executor.run_tech_rejection_workflow(
                            order_id, test_code, sample_id, result_items, order_date
                        )
                    elif destiny == "sample_rejection":
                        executor.run_sample_rejection_workflow(
                            order_id, test_code, sample_id, result_items, order_date
                        )
                    elif destiny == "escalation":
                        executor.run_escalation_workflow(
                            order_id, test_code, sample_id, result_items, order_date
                        )
                except Exception as e:
                    print(f"  [ERROR] {destiny} workflow {order_id}/{test_code}: {e}")
                    executor.stats["errors"] += 1

            # Progress report
            total_tests = (
                executor.stats["tests_normal"]
                + executor.stats["tests_tech_reject"]
                + executor.stats["tests_sample_reject"]
                + executor.stats["tests_escalated"]
                + executor.stats["tests_pending"]
            )
            if executor.stats["orders"] % 500 == 0:
                elapsed = time.time() - start_time
                print(
                    f"  Progress: {executor.stats['orders']}/{total_orders} orders, "
                    f"{total_tests} tests, "
                    f"{executor.stats['errors']} errors, "
                    f"{elapsed:.0f}s elapsed"
                )

    # ---- Step 4b: Mark a percentage of orders as paid ----
    to_mark_paid = int(len(orders_created_for_payment) * PAID_ORDER_PERCENTAGE)
    if to_mark_paid > 0:
        print(f"\n  Recording payments for {to_mark_paid} orders (POST /payments)...")
        for order_id, total_price, order_date in orders_created_for_payment[:to_mark_paid]:
            try:
                pay_at = order_date + timedelta(hours=rng.uniform(1, 24))
                client.create_payment(order_id, total_price, pay_at)
            except Exception as e:
                print(f"  [ERROR] Create payment for order {order_id}: {e}")
                executor.stats["errors"] += 1

    # ---- Step 5: Summary ----
    elapsed = time.time() - start_time
    print("\n" + "=" * 70)
    print("  Simulation Complete")
    print("=" * 70)
    print(f"  Duration:            {elapsed:.1f}s")
    print(f"  Patients created:    {executor.stats['patients']}")
    print(f"  Orders created:      {executor.stats['orders']}")
    print(f"  Orders marked paid:  {to_mark_paid}")
    print(f"  Tests - Normal:      {executor.stats['tests_normal']}")
    print(f"  Tests - Tech Reject: {executor.stats['tests_tech_reject']}")
    print(f"  Tests - Sample Rej:  {executor.stats['tests_sample_reject']}")
    print(f"  Tests - Escalated:   {executor.stats['tests_escalated']}")
    print(f"  Tests - Pending:     {executor.stats['tests_pending']}")
    print(f"  Errors:              {executor.stats['errors']}")
    total_tests = (
        executor.stats["tests_normal"]
        + executor.stats["tests_tech_reject"]
        + executor.stats["tests_sample_reject"]
        + executor.stats["tests_escalated"]
        + executor.stats["tests_pending"]
    )
    print(f"  Total tests:         {total_tests}")
    if total_tests > 0:
        print(f"  Avg tests/order:     {total_tests / max(executor.stats['orders'], 1):.1f}")
        print(f"  Avg orders/day:      {executor.stats['orders'] / SIMULATION_DAYS:.1f}")
    print("=" * 70)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Simulate 2 years of lab history via backend APIs."
    )
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000",
        help="Backend server URL (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Random seed for reproducibility",
    )
    parser.add_argument(
        "--patients",
        type=int,
        default=None,
        help="Override number of patients (auto-calculated from daily volume if omitted)",
    )
    parser.add_argument(
        "--daily-volume",
        type=int,
        default=TARGET_ORDERS_PER_DAY,
        help=f"Target orders per day (default: {TARGET_ORDERS_PER_DAY})",
    )
    args = parser.parse_args()

    # Auto-calculate patient count from target daily volume
    if args.patients is None:
        avg_orders = (MIN_ORDERS_PER_PATIENT + MAX_ORDERS_PER_PATIENT) / 2
        args.patients = math.ceil(args.daily_volume * SIMULATION_DAYS / avg_orders)

    # Quick health check
    try:
        resp = requests.get(f"{args.base_url}/health", timeout=5)
        if resp.status_code != 200:
            print(f"Server health check failed: {resp.status_code}")
            sys.exit(1)
    except requests.ConnectionError:
        print(f"Cannot connect to server at {args.base_url}")
        print("Start the server with: SIMULATION_MODE=true poetry run uvicorn app.main:app --port 8000")
        sys.exit(1)

    simulate_history(
        base_url=args.base_url,
        seed=args.seed,
        num_patients=args.patients,
        daily_volume=args.daily_volume,
    )


if __name__ == "__main__":
    main()
