"""
Generate 100 patients with African names using Faker
Run with: poetry run python generate_patients.py
"""
import random
from datetime import datetime, timedelta
from faker import Faker
from app.database import SessionLocal
from app.models.patient import Patient
from app.models.order import Order, OrderTest
from app.models.sample import Sample
from app.schemas.enums import Gender, AffiliationDuration

# Initialize Faker with standard locale (we'll use custom African names)
fake = Faker('en_US')

# Additional African names to supplement Faker
AFRICAN_FIRST_NAMES = {
    'male': [
        'Kwame', 'Kofi', 'Yaw', 'Kojo', 'Kwesi', 'Kwabena', 'Kwaku',  # Akan (Ghana)
        'Chike', 'Emeka', 'Nnamdi', 'Obinna', 'Chibueze', 'Ikenna',  # Igbo (Nigeria)
        'Babatunde', 'Oluwaseun', 'Adebayo', 'Oluwatobi', 'Ayodeji',  # Yoruba (Nigeria)
        'Juma', 'Baraka', 'Rashidi', 'Jabari', 'Kamau', 'Kendi',  # Swahili (East Africa)
        'Tendai', 'Tafadzwa', 'Tinashe', 'Takudzwa', 'Tapiwanashe',  # Shona (Zimbabwe)
        'Thabo', 'Sipho', 'Mandla', 'Bongani', 'Sello', 'Tshepo',  # South African
    ],
    'female': [
        'Ama', 'Akua', 'Abena', 'Afia', 'Efua', 'Adwoa', 'Yaa',  # Akan (Ghana)
        'Chioma', 'Ngozi', 'Adaeze', 'Chiamaka', 'Nneka', 'Amara',  # Igbo (Nigeria)
        'Folake', 'Omolara', 'Titilayo', 'Adeola', 'Funmilayo',  # Yoruba (Nigeria)
        'Amina', 'Zainab', 'Fatima', 'Aisha', 'Halima', 'Mariam',  # Hausa (Nigeria)
        'Zawadi', 'Neema', 'Asha', 'Subira', 'Amani', 'Furaha',  # Swahili (East Africa)
        'Thandiwe', 'Nomsa', 'Zanele', 'Lindiwe', 'Nandi', 'Precious',  # South African
    ]
}

AFRICAN_LAST_NAMES = [
    # West African
    'Mensah', 'Osei', 'Asante', 'Boateng', 'Owusu', 'Agyeman',  # Ghana
    'Okonkwo', 'Nwosu', 'Eze', 'Okeke', 'Okafor', 'Udoh',  # Nigeria (Igbo)
    'Adeyemi', 'Olayinka', 'Afolabi', 'Ogunleye', 'Adebisi',  # Nigeria (Yoruba)
    'Bello', 'Ibrahim', 'Mohammed', 'Usman', 'Abdullahi',  # Nigeria (Hausa)
    # East African
    'Mwangi', 'Kamau', 'Njoroge', 'Wanjiru', 'Ochieng', 'Otieno',  # Kenya
    'Nyerere', 'Mkapa', 'Kikwete', 'Magufuli', 'Hassan',  # Tanzania
    'Museveni', 'Obote', 'Amin', 'Ssemwogerere', 'Kizza',  # Uganda
    # Southern African
    'Mandela', 'Zuma', 'Ramaphosa', 'Mbeki', 'Sisulu', 'Tambo',  # South Africa
    'Mugabe', 'Mnangagwa', 'Ncube', 'Moyo', 'Sibanda',  # Zimbabwe
    'Khama', 'Masire', 'Mogae', 'Seretse', 'Tshekedi',  # Botswana
]

AFRICAN_CITIES = [
    # Major African cities
    {'city': 'Lagos', 'country': 'Nigeria'},
    {'city': 'Nairobi', 'country': 'Kenya'},
    {'city': 'Accra', 'country': 'Ghana'},
    {'city': 'Johannesburg', 'country': 'South Africa'},
    {'city': 'Cape Town', 'country': 'South Africa'},
    {'city': 'Dar es Salaam', 'country': 'Tanzania'},
    {'city': 'Kampala', 'country': 'Uganda'},
    {'city': 'Addis Ababa', 'country': 'Ethiopia'},
    {'city': 'Kigali', 'country': 'Rwanda'},
    {'city': 'Harare', 'country': 'Zimbabwe'},
    {'city': 'Lusaka', 'country': 'Zambia'},
    {'city': 'Maputo', 'country': 'Mozambique'},
]

CHRONIC_CONDITIONS = [
    'Hypertension', 'Type 2 Diabetes', 'Asthma', 'Arthritis', 
    'Sickle Cell Disease', 'HIV/AIDS', 'Tuberculosis', 'Malaria',
    'Hepatitis B', 'Chronic Kidney Disease'
]

MEDICATIONS = [
    'Lisinopril', 'Metformin', 'Amlodipine', 'Atorvastatin',
    'Albuterol', 'Hydrochlorothiazide', 'Aspirin', 'Ibuprofen',
    'Antiretroviral therapy', 'Antimalarial medication'
]

ALLERGIES = [
    'Penicillin', 'Sulfa drugs', 'Aspirin', 'Ibuprofen',
    'Latex', 'Peanuts', 'Shellfish', 'Eggs', 'Milk', 'None'
]

SURGERIES = [
    'Appendectomy', 'Cesarean section', 'Hernia repair',
    'Tonsillectomy', 'Cholecystectomy', 'Hysterectomy',
    'Knee arthroscopy', 'Cataract surgery'
]


def generate_african_name(gender: str) -> tuple[str, str]:
    """Generate an African first and last name"""
    first_name = random.choice(AFRICAN_FIRST_NAMES[gender])
    last_name = random.choice(AFRICAN_LAST_NAMES)
    return first_name, last_name


def generate_patient_data(index: int) -> dict:
    """Generate realistic patient data with African names"""
    
    # Random gender
    gender = random.choice(['male', 'female'])
    gender_enum = Gender.MALE if gender == 'male' else Gender.FEMALE
    
    # Generate African name
    first_name, last_name = generate_african_name(gender)
    full_name = f"{first_name} {last_name}"
    
    # Generate age between 1 and 90
    age = random.randint(1, 90)
    date_of_birth = (datetime.now() - timedelta(days=age*365 + random.randint(0, 364))).strftime('%Y-%m-%d')
    
    # Generate phone number
    phone = f"+254{random.randint(700000000, 799999999)}"  # Kenyan format
    
    # Generate email (optional)
    email = f"{first_name.lower()}.{last_name.lower()}@example.com" if random.random() > 0.3 else None
    
    # Generate address
    city_data = random.choice(AFRICAN_CITIES)
    street = f"{random.randint(1, 999)} {fake.street_name()}"
    postalCode = f"{random.randint(10000, 99999)}"

    address = {
        'street': street,
        'city': city_data['city'],
        'postalCode': postalCode
    }

    # Emergency contact
    emergency_gender = random.choice(['male', 'female'])
    emergency_first, emergency_last = generate_african_name(emergency_gender)
    emergencyContact = {
        'name': f"{emergency_first} {emergency_last}",
        'phone': f"+254{random.randint(700000000, 799999999)}"
    }

    # Medical history
    num_conditions = random.randint(0, 3)
    chronicConditions = random.sample(CHRONIC_CONDITIONS, num_conditions) if num_conditions > 0 else []

    num_medications = random.randint(0, 4)
    currentMedications = random.sample(MEDICATIONS, num_medications) if num_medications > 0 else []

    num_allergies = random.randint(0, 2)
    allergies = random.sample(ALLERGIES, num_allergies) if num_allergies > 0 else ['None']

    num_surgeries = random.randint(0, 2)
    previousSurgeries = random.sample(SURGERIES, num_surgeries) if num_surgeries > 0 else []

    familyHistory = random.choice([
        'No significant family history',
        'Family history of hypertension',
        'Family history of diabetes',
        'Family history of heart disease',
        'Family history of cancer',
        'Family history of sickle cell disease'
    ])

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

    # Patient ID
    patient_id = f"PAT-{registrationDate.strftime('%Y%m%d')}-{index+1:03d}"

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
        'affiliation': affiliation,
        'registrationDate': registrationDate,
        'createdBy': 'USR-00000000-001',  # admin user
        'createdAt': registrationDate,
        'updatedAt': registrationDate,
        'updatedBy': 'USR-00000000-001'
    }


def generate_patients(count: int = 10):
    """Generate and insert patients into the database"""
    db = SessionLocal()
    
    try:
        print(f"🌍 Generating {count} patients with African names...")
        
        # Delete existing patients (and their orders)
        print("🗑️ Deleting existing data...")
        try:
            # Delete children first
            print("  • Deleting samples...")
            db.query(Sample).delete()
            
            print("  • Deleting order tests...")
            db.query(OrderTest).delete()
            
            # Delete orders 
            print("  • Deleting orders...")
            db.query(Order).delete()
            
            # Delete patients
            print("  • Deleting patients...")
            db.query(Patient).delete()
            
            db.commit()
            print("✓ Deleted existing data")
        except Exception as e:
            print(f"⚠️ Could not delete existing data: {e}")
            db.rollback()
        
        patients_created = 0
        
        for i in range(count):
            patient_data = generate_patient_data(i)
            
            # Create patient model
            patient = Patient(**patient_data)
            
            db.add(patient)
            patients_created += 1
            
            if (i + 1) % 10 == 0:
                print(f"  ✓ Created {i + 1}/{count} patients...")
        
        db.commit()
        print(f"\n✅ Successfully created {patients_created} patients!")
        
        # Show some examples
        print("\n📋 Sample patients created:")
        sample_patients = db.query(Patient).limit(5).all()
        for p in sample_patients:
            insurance = "✓" if p.affiliation else "✗"
            print(f"  • {p.fullName} ({p.gender.value}) - {p.phone} - Insurance: {insurance}")
        
    except Exception as e:
        print(f"\n❌ Error generating patients: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("  Atlas Lab - African Patient Data Generator")
    print("=" * 60)
    print()
    
    generate_patients(10)
    
    print()
    print("=" * 60)
    print("  Generation Complete!")
    print("=" * 60)
