"""
Generate realistic patient data with African names using NiaFaker
"""
import random
from datetime import datetime, timedelta, timezone
from faker import Faker
import niafaker
from app.models.patient import Patient
from app.schemas.enums import Gender, Relationship

# Initialize Faker with standard locale (we'll use custom African names)
fake = Faker('en_US')

CHRONIC_CONDITIONS = [
    'Hypertension',
    'Type 1 Diabetes',
    'Type 2 Diabetes',
    'Gestational Diabetes',
    'Asthma (mild)',
    'Asthma (moderate)',
    'Asthma (severe)',
    'Chronic Obstructive Pulmonary Disease',
    'Rheumatoid Arthritis',
    'Osteoarthritis',
    'Psoriatic Arthritis',
    'Systemic Lupus Erythematosus',
    'Chronic Kidney Disease Stage 1',
    'Chronic Kidney Disease Stage 2',
    'Chronic Kidney Disease Stage 3',
    'Chronic Kidney Disease Stage 4',
    'Chronic Kidney Disease Stage 5',
    'End Stage Renal Disease',
    'Polycystic Kidney Disease',
    'Coronary Artery Disease',
    'Congestive Heart Failure',
    'Atrial Fibrillation',
    'Ischemic Heart Disease',
    'Peripheral Artery Disease',
    'Hyperlipidemia',
    'Metabolic Syndrome',
    'Obesity',
    'Morbid Obesity',
    'Sleep Apnea',
    'Stroke History',
    'Transient Ischemic Attack',
    'Parkinson Disease',
    'Alzheimer Disease',
    'Vascular Dementia',
    'Epilepsy',
    'Multiple Sclerosis',
    'Migraine Disorder',
    'Chronic Tension Headache',
    'Major Depressive Disorder',
    'Generalized Anxiety Disorder',
    'Bipolar Disorder',
    'Schizophrenia',
    'Post Traumatic Stress Disorder',
    'Hypothyroidism',
    'Hyperthyroidism',
    'Graves Disease',
    'Hashimoto Thyroiditis',
    'Cushing Syndrome',
    'Addison Disease',
    'Osteoporosis',
    'Osteopenia',
    'Gout',
    'Fibromyalgia',
    'Chronic Fatigue Syndrome',
    'Irritable Bowel Syndrome',
    'Crohn Disease',
    'Ulcerative Colitis',
    'Gastroesophageal Reflux Disease',
    'Peptic Ulcer Disease',
    'Chronic Liver Disease',
    'Cirrhosis',
    'Nonalcoholic Fatty Liver Disease',
    'Hepatitis B Chronic',
    'Hepatitis C Chronic',
    'HIV Infection',
    'AIDS',
    'Tuberculosis (latent)',
    'Tuberculosis (active)',
    'Sickle Cell Disease',
    'Thalassemia',
    'Hemophilia',
    'Iron Deficiency Anemia',
    'Pernicious Anemia',
    'Chronic Myeloid Leukemia',
    'Breast Cancer',
    'Prostate Cancer',
    'Lung Cancer',
    'Colorectal Cancer',
    'Melanoma',
    'Chronic Pancreatitis',
    'Type 3c Diabetes',
    'Benign Prostatic Hyperplasia',
    'Chronic Sinusitis',
    'Allergic Rhinitis',
    'Atopic Dermatitis',
    'Psoriasis',
    'Vitiligo',
    'None'
]


MEDICATIONS = [
    'Lisinopril',
    'Enalapril',
    'Ramipril',
    'Losartan',
    'Valsartan',
    'Amlodipine',
    'Nifedipine',
    'Diltiazem',
    'Verapamil',
    'Hydrochlorothiazide',
    'Chlorthalidone',
    'Furosemide',
    'Spironolactone',
    'Metformin',
    'Insulin Glargine',
    'Insulin Lispro',
    'Insulin Aspart',
    'Glyburide',
    'Glipizide',
    'Sitagliptin',
    'Empagliflozin',
    'Canagliflozin',
    'Atorvastatin',
    'Rosuvastatin',
    'Simvastatin',
    'Pravastatin',
    'Ezetimibe',
    'Aspirin',
    'Clopidogrel',
    'Warfarin',
    'Apixaban',
    'Rivaroxaban',
    'Heparin',
    'Albuterol Inhaler',
    'Salmeterol',
    'Fluticasone Inhaler',
    'Budesonide',
    'Montelukast',
    'Prednisone',
    'Methotrexate',
    'Sulfasalazine',
    'Hydroxychloroquine',
    'Adalimumab',
    'Etanercept',
    'Ibuprofen',
    'Naproxen',
    'Diclofenac',
    'Paracetamol',
    'Codeine',
    'Tramadol',
    'Morphine',
    'Gabapentin',
    'Pregabalin',
    'Sertraline',
    'Fluoxetine',
    'Citalopram',
    'Venlafaxine',
    'Duloxetine',
    'Amitriptyline',
    'Lithium',
    'Valproic Acid',
    'Carbamazepine',
    'Levetiracetam',
    'Lamotrigine',
    'Levothyroxine',
    'Methimazole',
    'Propylthiouracil',
    'Omeprazole',
    'Pantoprazole',
    'Esomeprazole',
    'Ranitidine',
    'Famotidine',
    'Tenofovir',
    'Efavirenz',
    'Dolutegravir',
    'Lamivudine',
    'Rifampin',
    'Isoniazid',
    'Ethambutol',
    'Pyrazinamide',
    'Artemether-Lumefantrine',
    'Chloroquine',
    'Azithromycin',
    'Amoxicillin',
    'Ceftriaxone',
    'Vancomycin',
    'None'
]


ALLERGIES = [
    'None',
    'Penicillin',
    'Amoxicillin',
    'Cephalosporins',
    'Sulfa drugs',
    'Trimethoprim',
    'Aspirin',
    'Ibuprofen',
    'Naproxen',
    'Diclofenac',
    'Paracetamol',
    'Codeine',
    'Morphine',
    'Tramadol',
    'Heparin',
    'Insulin',
    'Latex',
    'Chlorhexidine',
    'Iodine',
    'Contrast Media',
    'Local Anesthetics',
    'General Anesthetics',
    'Nickel',
    'Cobalt',
    'Chromium',
    'Peanuts',
    'Tree Nuts',
    'Almonds',
    'Walnuts',
    'Cashews',
    'Shellfish',
    'Shrimp',
    'Crab',
    'Lobster',
    'Fish',
    'Eggs',
    'Milk',
    'Cheese',
    'Yogurt',
    'Soy',
    'Wheat',
    'Gluten',
    'Sesame',
    'Mustard',
    'Celery',
    'Corn',
    'Strawberries',
    'Bananas',
    'Kiwi',
    'Pollen',
    'Grass Pollen',
    'Tree Pollen',
    'Ragweed',
    'Dust Mites',
    'Animal Dander',
    'Cat Dander',
    'Dog Dander',
    'Mold',
    'Bee Venom',
    'Wasp Venom',
    'Ant Venom',
    'Mosquito Bites',
    'Sunlight',
    'Cold Exposure',
    'Heat Exposure',
    'Perfumes',
    'Cosmetics',
    'Hair Dye',
    'Cleaning Agents',
    'Detergents',
    'Formaldehyde',
    'Epoxy Resin',
    'Acrylics',
    'Rubber',
    'Adhesives',
    'Vaccines',
    'Antibiotics (unspecified)',
    'NSAIDs',
    'Opioids',
    'Steroids',
    'Chemotherapy Agents',
    'Biologic Agents'
]


SURGERIES = [
    'None',
    'Appendectomy',
    'Laparoscopic Appendectomy',
    'Open Appendectomy',
    'Cesarean Section',
    'Emergency Cesarean Section',
    'Elective Cesarean Section',
    'Hernia Repair',
    'Inguinal Hernia Repair',
    'Umbilical Hernia Repair',
    'Hiatal Hernia Repair',
    'Tonsillectomy',
    'Adenoidectomy',
    'Cholecystectomy',
    'Laparoscopic Cholecystectomy',
    'Open Cholecystectomy',
    'Hysterectomy',
    'Total Hysterectomy',
    'Partial Hysterectomy',
    'Radical Hysterectomy',
    'Oophorectomy',
    'Salpingectomy',
    'Knee Arthroscopy',
    'Shoulder Arthroscopy',
    'Hip Arthroscopy',
    'Anterior Cruciate Ligament Reconstruction',
    'Total Knee Replacement',
    'Partial Knee Replacement',
    'Total Hip Replacement',
    'Spinal Fusion',
    'Lumbar Discectomy',
    'Cervical Discectomy',
    'Laminectomy',
    'Carpal Tunnel Release',
    'Trigger Finger Release',
    'Cataract Surgery',
    'Laser Eye Surgery',
    'Corneal Transplant',
    'Retinal Detachment Repair',
    'Vitrectomy',
    'Coronary Artery Bypass Grafting',
    'Percutaneous Coronary Intervention',
    'Angioplasty',
    'Stent Placement',
    'Pacemaker Implantation',
    'Implantable Cardioverter Defibrillator',
    'Heart Valve Replacement',
    'Heart Valve Repair',
    'Aortic Aneurysm Repair',
    'Varicose Vein Surgery',
    'Thyroidectomy',
    'Parathyroidectomy',
    'Prostatectomy',
    'Transurethral Resection of Prostate',
    'Nephrectomy',
    'Partial Nephrectomy',
    'Kidney Transplant',
    'Liver Transplant',
    'Pancreatectomy',
    'Splenectomy',
    'Gastric Bypass',
    'Sleeve Gastrectomy',
    'Fundoplication',
    'Colectomy',
    'Hemicolectomy',
    'Colostomy',
    'Ileostomy',
    'Mastectomy',
    'Lumpectomy',
    'Breast Reconstruction',
    'Skin Graft',
    'Burn Debridement',
    'Amputation (minor)',
    'Amputation (major)',
    'Craniotomy',
    'Brain Tumor Resection',
    'Deep Brain Stimulation',
    'ENT Surgery',
    'Sinus Surgery',
    'Septoplasty',
    'Tympanoplasty',
    'Cochlear Implant',
    'Dental Extraction',
    'Orthognathic Surgery'
]

FAMILY_HISTORY = [
    'No significant family history',
    'Family history of hypertension',
    'Family history of type 1 diabetes',
    'Family history of type 2 diabetes',
    'Family history of gestational diabetes',
    'Family history of coronary artery disease',
    'Family history of ischemic heart disease',
    'Family history of heart failure',
    'Family history of atrial fibrillation',
    'Family history of stroke',
    'Family history of transient ischemic attack',
    'Family history of hyperlipidemia',
    'Family history of obesity',
    'Family history of metabolic syndrome',
    'Family history of chronic kidney disease',
    'Family history of end stage renal disease',
    'Family history of polycystic kidney disease',
    'Family history of asthma',
    'Family history of chronic obstructive pulmonary disease',
    'Family history of allergic rhinitis',
    'Family history of atopic dermatitis',
    'Family history of rheumatoid arthritis',
    'Family history of osteoarthritis',
    'Family history of osteoporosis',
    'Family history of gout',
    'Family history of systemic lupus erythematosus',
    'Family history of multiple sclerosis',
    'Family history of Parkinson disease',
    'Family history of Alzheimer disease',
    'Family history of vascular dementia',
    'Family history of epilepsy',
    'Family history of migraine',
    'Family history of major depressive disorder',
    'Family history of bipolar disorder',
    'Family history of schizophrenia',
    'Family history of anxiety disorders',
    'Family history of substance use disorder',
    'Family history of alcohol dependence',
    'Family history of smoking-related illness',
    'Family history of lung cancer',
    'Family history of breast cancer',
    'Family history of ovarian cancer',
    'Family history of prostate cancer',
    'Family history of colorectal cancer',
    'Family history of pancreatic cancer',
    'Family history of liver cancer',
    'Family history of melanoma',
    'Family history of leukemia',
    'Family history of lymphoma',
    'Family history of thyroid cancer',
    'Family history of thyroid disease',
    'Family history of hypothyroidism',
    'Family history of hyperthyroidism',
    'Family history of Hashimoto thyroiditis',
    'Family history of Graves disease',
    'Family history of celiac disease',
    'Family history of inflammatory bowel disease',
    'Family history of Crohn disease',
    'Family history of ulcerative colitis',
    'Family history of irritable bowel syndrome',
    'Family history of gastroesophageal reflux disease',
    'Family history of peptic ulcer disease',
    'Family history of chronic liver disease',
    'Family history of cirrhosis',
    'Family history of nonalcoholic fatty liver disease',
    'Family history of hepatitis B',
    'Family history of hepatitis C',
    'Family history of HIV infection',
    'Family history of tuberculosis',
    'Family history of sickle cell disease',
    'Family history of thalassemia',
    'Family history of hemophilia',
    'Family history of iron deficiency anemia',
    'Family history of pernicious anemia',
    'Family history of blood clots',
    'Family history of deep vein thrombosis',
    'Family history of pulmonary embolism',
    'Family history of bleeding disorders',
    'Family history of congenital heart disease',
    'Family history of sudden cardiac death',
    'Family history of autoimmune disease',
    'Family history of genetic disorder',
    'Family history of birth defects',
    'Family history of developmental delay',
    'Family history of infertility',
    'Family history of pregnancy complications',
    'Family history of early menopause',
    'Family history of chronic pain disorders'
]


def generate_african_name(gender: str) -> tuple[str, str]:
    """Generate an African first and last name using NiaFaker"""
    try:
        # Try to use gender parameter if supported
        full_name = niafaker.generate_name(gender)
    except Exception:
        # Fallback if specific gender call fails or signature mismatches
        try:
             full_name = niafaker.generate_name()
        except:
             full_name = fake.name()
        
    parts = full_name.split()
    if len(parts) >= 2:
        return parts[0], parts[-1]
    return parts[0], "Doe"


FIXED_PATIENT_IDS = [
    "PAT-20260118-001",
    "PAT-20260118-002",
    "PAT-20260118-003",
    "PAT-20260118-004",
    "PAT-20260118-005",
    "PAT-20260118-006",
    "PAT-20260118-007",
    "PAT-20260118-008",
    "PAT-20260118-009",
    "PAT-20260118-010"
]

def _create_single_patient_data(patient_id: str) -> dict:
    """Internal helper to generate realistic patient data"""
    
    # Random gender
    gender = random.choice(['male', 'female'])
    gender_enum = Gender.MALE if gender == 'male' else Gender.FEMALE
    
    # Generate African name
    first_name, last_name = generate_african_name(gender)
    full_name = f"{first_name} {last_name}"
    
    # Generate age between 1 and 90
    age = random.randint(1, 90)
    date_of_birth = (datetime.now() - timedelta(days=age*365 + random.randint(0, 364))).strftime('%Y-%m-%d')
    
    # Generate phone number using NiaFaker
    try:
        phone = niafaker.generate_phone_number()
    except:
        phone = f"+254{random.randint(700000000, 799999999)}"
    
    # Generate email (optional)
    email = f"{first_name.lower()}.{last_name.lower()}@example.com" if random.random() > 0.3 else None
    
    # Generate address
    city = 'Unknown'
    try:
        city = niafaker.generate_city()
    except Exception:
        # Fallback if niafaker doesn't support city
        city = fake.city()

    street_address = "Unknown Street"
    try:
        street_address = niafaker.generate_address()
    except:
        street_address = fake.street_address()

    address = {
        'street': street_address,
        'city': city, 
        'postalCode': f"{random.randint(10000, 99999)}"
    }

    # Emergency contact
    emergency_gender = random.choice(['male', 'female'])
    emergency_first, emergency_last = generate_african_name(emergency_gender)
    emergency_phone = "+254700000000"
    try:
        emergency_phone = niafaker.generate_phone_number()
    except:
        pass

    # Random relationship
    relationship = random.choice([r.value for r in Relationship])

    # Optional email for emergency contact (50% chance)
    emergency_email = None
    if random.random() > 0.5:
        emergency_email = f"{emergency_first.lower()}.{emergency_last.lower()}@example.com"

    emergencyContact = {
        'fullName': f"{emergency_first} {emergency_last}",
        'relationship': relationship,
        'phone': emergency_phone,
        'email': emergency_email
    }

    # Medical history
    num_conditions = random.randint(0, 5)
    chronicConditions = random.sample(CHRONIC_CONDITIONS, num_conditions) if num_conditions > 0 else []

    num_medications = random.randint(0, 5)
    currentMedications = random.sample(MEDICATIONS, num_medications) if num_medications > 0 else []

    num_allergies = random.randint(0, 5)
    allergies = random.sample(ALLERGIES, num_allergies) if num_allergies > 0 else ['None']

    num_surgeries = random.randint(0, 2)
    previousSurgeries = random.sample(SURGERIES, num_surgeries) if num_surgeries > 0 else []

    num_family_history = random.randint(0, 5)
    familyHistory = random.sample(FAMILY_HISTORY, num_family_history) if num_family_history > 0 else []

    lifestyle = {
        'smoking': random.random() < 0.15,  # 15% smokers
        'alcohol': random.random() < 0.25   # 25% alcohol consumers
    }

    medicalHistory = {
        'chronicConditions': chronicConditions,
        'currentMedications': currentMedications,
        'allergies': allergies,
        'previousSurgeries': previousSurgeries,
        'familyHistory': familyHistory,
        'lifestyle': lifestyle
    }

    # Vital Signs - 60% of patients have recorded vital signs
    vitalSigns = None
    if random.random() < 0.6:
        vitalSigns = {
            'temperature': round(random.uniform(36.0, 38.5), 1),  # Celsius
            'heartRate': random.randint(55, 110),                 # BPM
            'systolicBP': random.randint(100, 150),               # mmHg
            'diastolicBP': random.randint(60, 95),                # mmHg
            'respiratoryRate': random.randint(12, 22),            # breaths/min
            'oxygenSaturation': random.randint(94, 100)           # SpO2 %
        }

    # Affiliation (insurance) - 70% have insurance
    affiliation = None
    if random.random() < 0.7:
        duration_months = random.choice([3, 6, 12, 24])
        startDate = datetime.now() - timedelta(days=random.randint(0, 365))
        endDate = startDate + timedelta(days=duration_months * 30)

        affiliation = {
            'assuranceNumber': f"INS-{random.randint(100000, 999999)}",
            'startDate': startDate.strftime('%Y-%m-%d'),
            'endDate': endDate.strftime('%Y-%m-%d'),
            'duration': duration_months
        }

    # Registration date (within last 2 years)
    registrationDate = datetime.now() - timedelta(days=random.randint(0, 730))

    return {
        'id': patient_id,
        'fullName': full_name,
        'dateOfBirth': date_of_birth,
        'gender': gender_enum,
        'phone': phone,
        'email': email,
        'address': address,
        'emergencyContact': emergencyContact,
        'medicalHistory': medicalHistory,
        'vitalSigns': vitalSigns,
        'affiliation': affiliation,
        'registrationDate': registrationDate,
        'createdBy': 'USR-00000000-001',  # admin user
        'createdAt': registrationDate,
        'updatedAt': registrationDate,
        'updatedBy': 'USR-00000000-001'
    }

def generate_dev_patients(db):
    """Generate specific developer example patients"""
    print("🌱 Generating developer example patients...")
    
    # Create example patients
    patients_data = [
        {
            "id": "PAT-20260117-001",
            "fullName": "John Smith",
            "dateOfBirth": "1985-03-15",
            "gender": Gender.MALE,
            "phone": "+1-555-0101",
            "email": "john.smith@email.com",
            "address": {"street": "123 Main St", "city": "New York", "postalCode": "10001"},
            "emergencyContact": {
                "fullName": "Jane Smith",
                "relationship": Relationship.SPOUSE.value,
                "phone": "+1-555-0102",
                "email": "jane.smith@email.com"
            },
            "medicalHistory": {
                "chronicConditions": ["Hypertension"],
                "currentMedications": ["Lisinopril 10mg"],
                "allergies": ["Penicillin"],
                "previousSurgeries": [],
                "familyHistory": ["Father had diabetes"],
                "lifestyle": {"smoking": False, "alcohol": False}
            },
            "vitalSigns": {
                "temperature": 36.8,
                "heartRate": 72,
                "systolicBP": 128,
                "diastolicBP": 82,
                "respiratoryRate": 16,
                "oxygenSaturation": 98
            },
            "registrationDate": datetime.now(timezone.utc),
            "createdBy": "USR-00000000-001",
            "updatedBy": "USR-00000000-001",
        },
        {
            "id": "PAT-20260117-002",
            "fullName": "Maria Garcia",
            "dateOfBirth": "1992-07-22",
            "gender": Gender.FEMALE,
            "phone": "+1-555-0201",
            "email": "maria.garcia@email.com",
            "address": {"street": "456 Oak Ave", "city": "Los Angeles", "postalCode": "90001"},
            "emergencyContact": {
                "fullName": "Carlos Garcia",
                "relationship": Relationship.SIBLING.value,
                "phone": "+1-555-0202",
                "email": None
            },
            "medicalHistory": {
                "chronicConditions": [],
                "currentMedications": [],
                "allergies": [],
                "previousSurgeries": ["Appendectomy 2015"],
                "familyHistory": ["None reported"],
                "lifestyle": {"smoking": False, "alcohol": True}
            },
            "vitalSigns": {
                "temperature": 36.5,
                "heartRate": 68,
                "systolicBP": 118,
                "diastolicBP": 76,
                "respiratoryRate": 14,
                "oxygenSaturation": 99
            },
            "registrationDate": datetime.now(timezone.utc),
            "createdBy": "USR-00000000-002",
            "updatedBy": "USR-00000000-002",
        },
    ]

    for patient_data in patients_data:
        existing = db.query(Patient).filter(Patient.id == patient_data["id"]).first()
        if not existing:
            patient = Patient(**patient_data)
            db.add(patient)
            print(f"  ✓ Created patient: {patient_data['fullName']} ({patient_data['id']})")
    
    db.commit()


def generate_patients(db, count: int = 10):
    """Generate and insert patients into the database"""
    
    # Ignore count parameter if using fixed list, or use it to limit the fixed list if needed.
    # But user asked for THESE IDs specifically.
    
    try:
        print(f"🌍 Generating patients from fixed list ({len(FIXED_PATIENT_IDS)})...")
        
        patients_created = 0
        
        for patient_id in FIXED_PATIENT_IDS:
            # Check if patient exists to avoid duplicates if re-running
            existing = db.query(Patient).filter(Patient.id == patient_id).first()
            if existing:
                print(f"  • Skipping existing patient: {patient_id}")
                continue

            patient_data = _create_single_patient_data(patient_id)
            
            # Create patient model
            patient = Patient(**patient_data)
            
            db.add(patient)
            patients_created += 1
            print(f"  ✓ Created patient: {patient_data['fullName']} ({patient_id})")
        
        db.commit()
        print(f"\n✅ Successfully created {patients_created} patients!")
        
        # Show some examples
        print("\n📋 Sample patients create/found:")
        sample_patients = db.query(Patient).filter(Patient.id.in_(FIXED_PATIENT_IDS)).all()
        for p in sample_patients:
            insurance = "✓" if p.affiliation else "✗"
            print(f"  • {p.fullName} ({p.gender.value}) - ID: {p.id}")
        
    except Exception as e:
        print(f"\n❌ Error generating patients: {e}")
        raise
