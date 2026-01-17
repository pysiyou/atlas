# PROMPT FOR CODE AGENT: Medical Analysis Center Software - Frontend Prototype

## PROJECT OVERVIEW
You are tasked with building a complete frontend-only prototype for a Medical Analysis Center (diagnostic laboratory) management system. This software simulates the entire patient workflow from registration to result delivery. There is NO BACKEND - all data will be stored in browser localStorage and state management. The application must be fully functional and demonstrate all workflows even without a real database.

## TECHNOLOGY STACK
- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API or Zustand
- **Routing**: React Router v6
- **Data Storage**: Browser localStorage (simulate database)
- **Date/Time**: date-fns or dayjs
- **Forms**: React Hook Form with validation
- **UI Components**: Build custom components (buttons, modals, tables, forms)
- **Icons**: lucide-react or heroicons
- **PDF Generation**: jsPDF or react-pdf (for reports)
- **Notifications**: react-hot-toast or similar

## APPLICATION STRUCTURE

### Core Modules
1. **Laboratory Information System (LIS)** - 60% of functionality
2. **Practice/Clinic Management** - 40% of functionality

### User Roles (simulated via role selection on login)
- **Receptionist**: Patient registration, appointments, billing
- **Lab Technician**: Sample collection, result entry, quality control
- **Pathologist/Doctor**: Result validation, report approval
- **Administrator**: View all data, manage test catalog, system overview

## DETAILED REQUIREMENTS

### 1. AUTHENTICATION & USER MANAGEMENT

#### Login Screen
- Simple login form with username/password
- Role selection dropdown (Receptionist, Lab Technician, Pathologist, Administrator)
- No real authentication - just store selected role in state
- Pre-populate with demo users for each role

#### User Context
- Store current user info: name, role, login timestamp
- Display current user and role in header
- Logout functionality (clear session)

---

### 2. LABORATORY INFORMATION SYSTEM (LIS)

#### 2.1 PATIENT MANAGEMENT

**Patient Registration Form**
- **Fields**:
  - Patient ID (auto-generated: PAT-YYYYMMDD-XXX)
  - Full Name (required)
  - Date of Birth (required, date picker)
  - Gender (Male/Female/Other)
  - Phone Number (required)
  - Email (optional)
  - Address (street, city, postal code)
  - Insurance Provider (dropdown with options: None, Blue Cross, United Health, Aetna, Medicare, Other)
  - Insurance Number
  - Emergency Contact (name, phone)
  - Medical History (textarea for notes)
  
- **Functionality**:
  - Form validation (required fields, phone format, email format)
  - Save to localStorage as patients array
  - Success notification after registration
  - Clear form after submission
  - Option to "Register and Create Order" (redirect to order creation)

**Patient Search & List**
- Search bar (search by name, patient ID, phone)
- Patient list table with columns: Patient ID, Name, DOB, Phone, Registration Date, Actions
- Actions: View Details, Edit, Create Order
- Pagination (10 patients per page)
- Filter by registration date range

**Patient Detail View**
- Display all patient information
- Show all previous orders and test results
- Edit patient information button
- Create new order button

#### 2.2 TEST CATALOG MANAGEMENT

**Test Catalog** (pre-populated with common tests)
- Store in localStorage as tests array
- Each test has:
  - Test Code (e.g., CBC-001, GLU-002)
  - Test Name (e.g., Complete Blood Count, Glucose Fasting)
  - Category (Hematology, Biochemistry, Microbiology, Serology, Urinalysis, Imaging)
  - Price (in your currency)
  - Turnaround Time (in hours: 2, 24, 48, 72)
  - Specimen Type (Blood, Urine, Stool, Swab, Tissue)
  - Specimen Volume (e.g., 5ml, 10ml)
  - Special Requirements (e.g., "Fasting required", "Refrigerate immediately")
  - Reference Ranges (object with ranges by gender/age if applicable)

**Pre-populated Tests** (minimum 20 tests):
- Hematology: CBC, Hemoglobin, Platelet Count, WBC Count
- Biochemistry: Glucose, Creatinine, Urea, Liver Function Panel, Lipid Profile
- Serology: HIV Test, Hepatitis Panel, COVID-19 PCR
- Urinalysis: Routine Urine, Urine Culture
- Microbiology: Blood Culture, Stool Culture
- Imaging: X-Ray Chest, Ultrasound Abdomen

**Test Catalog Interface** (Admin only)
- View all tests in a table
- Add new test form
- Edit existing test
- Activate/Deactivate tests (don't delete, just mark inactive)

#### 2.3 TEST ORDER MANAGEMENT

**Create Order Form**
- **Patient Selection**: Search and select existing patient (autocomplete)
- **Referring Physician**: Name and contact (optional)
- **Test Selection**: 
  - Multi-select from test catalog
  - Show test details (price, specimen type, requirements) on selection
  - Display total price
  - Option to create test panels (e.g., "Diabetes Panel" = Glucose + HbA1c)
- **Priority Level**: 
  - Routine (default)
  - Urgent (24h)
  - STAT (2h, immediate)
- **Clinical Notes**: Textarea for clinical indication/reason for test
- **Order Date/Time**: Auto-filled with current date/time
- **Generate Order**: Create order with unique Order ID (ORD-YYYYMMDD-XXX)

**Order Detail Structure** (in localStorage):
```javascript
{
  orderId: "ORD-20250109-001",
  patientId: "PAT-20250109-001",
  patientName: "John Doe",
  orderDate: "2025-01-09T10:30:00",
  referringPhysician: "Dr. Smith",
  tests: [
    {
      testCode: "CBC-001",
      testName: "Complete Blood Count",
      status: "ordered", // ordered -> collected -> in-progress -> completed -> validated -> reported
      price: 25.00,
      specimenType: "Blood",
      collectionDate: null,
      resultEntryDate: null,
      validationDate: null,
      results: null
    }
  ],
  priority: "routine",
  clinicalNotes: "Routine checkup",
  totalPrice: 25.00,
  paymentStatus: "pending", // pending, partial, paid
  overallStatus: "ordered", // ordered -> in-progress -> completed -> delivered
  createdBy: "receptionist_mary",
  createdAt: "2025-01-09T10:30:00"
}
```

**Orders List View**
- Table showing all orders
- Columns: Order ID, Patient Name, Order Date, Tests Count, Priority, Status, Total Price, Actions
- Color coding by status:
  - Ordered: Blue
  - In Progress: Yellow
  - Completed: Green
  - Delivered: Gray
- Filter by:
  - Status
  - Priority
  - Date range
  - Patient name
- Search by Order ID or Patient Name
- Actions: View Details, Print Order Form, Track Progress

**Order Detail View**
- Display all order information
- Show each test with its individual status
- Timeline/progress tracker showing workflow stages
- Status update buttons (role-based access)
- Print order form button
- Add results button (for lab tech)
- Validate results button (for pathologist)
- Generate report button

#### 2.4 SAMPLE COLLECTION & TRACKING

**Sample Collection Interface** (Lab Technician)
- List of orders awaiting sample collection (status = "ordered")
- For each order, show:
  - Patient name and ID
  - Tests requiring collection
  - Specimen types needed
  - Special handling requirements
  - Collection instructions

**Sample Collection Form**
- Select order
- For each specimen type required:
  - Generate barcode/label (unique: SMP-YYYYMMDD-XXX)
  - Record collection date/time
  - Record collector name (current user)
  - Collection notes (e.g., "difficult draw", "hemolyzed")
  - Mark specimen as collected
- Update order status to "collected" when all samples collected
- Print sample labels (simulate with modal showing label details)

**Sample Tracking View**
- List all collected samples
- Show: Sample ID, Order ID, Patient, Specimen Type, Collection Date, Current Location, Status
- Status: Collected → In Lab → Testing → Completed
- Update sample location (Reception → Lab → Storage)
- Flag samples with issues (insufficient quantity, contaminated, etc.)

#### 2.5 RESULT ENTRY & MANAGEMENT

**Result Entry Interface** (Lab Technician)
- List orders with status "collected" or "in-progress"
- Select order to enter results
- For each test in the order:
  - Display test name, reference ranges
  - Result entry fields (varies by test type):
    - **Numeric**: Input field with unit (e.g., 5.2 mmol/L)
    - **Text**: Textarea (e.g., microscopy findings)
    - **Qualitative**: Dropdown (Positive/Negative/Indeterminate)
    - **Multi-parameter**: Multiple fields (e.g., CBC has 10+ parameters)
  - Flag abnormal results automatically (compare with reference ranges)
  - Add technician notes/comments
  - Mark test as completed
- Save results (not yet validated)
- Update order status to "completed" when all tests have results

**Result Structure Example**:
```javascript
{
  testCode: "CBC-001",
  testName: "Complete Blood Count",
  results: {
    hemoglobin: { value: 14.5, unit: "g/dL", referenceRange: "13.5-17.5", status: "normal" },
    wbc: { value: 11.2, unit: "x10^9/L", referenceRange: "4.5-11.0", status: "high" },
    platelets: { value: 250, unit: "x10^9/L", referenceRange: "150-400", status: "normal" }
  },
  resultEnteredBy: "tech_john",
  resultEntryDate: "2025-01-09T14:30:00",
  status: "completed",
  flags: ["WBC elevated"],
  technicianNotes: "Sample processed normally"
}
```

**Results Review Dashboard**
- Show all completed orders awaiting validation
- Display critical/abnormal values prominently (red flag icon)
- Quick view of all test results
- Filter by abnormal results only

#### 2.6 RESULT VALIDATION & APPROVAL

**Validation Interface** (Pathologist/Doctor)
- List of completed orders awaiting validation
- For each order:
  - Display patient demographics
  - Show all test results with reference ranges
  - Highlight abnormal values
  - Show previous results for comparison (if available)
  - View clinical notes from order
  
**Validation Actions**:
- **Approve**: Mark results as validated
- **Reject**: Send back to lab tech with rejection reason
- **Request Repeat**: Flag test for repeat analysis
- **Add Interpretation**: Textarea for pathologist comments/interpretation
- **Critical Value Notification**: Flag critical values requiring immediate physician contact

**Validation Record**:
```javascript
{
  validatedBy: "dr_johnson",
  validationDate: "2025-01-09T16:00:00",
  validationStatus: "approved", // approved, rejected, repeat-required
  pathologistComments: "Results consistent with mild anemia. Recommend iron studies.",
  criticalValuesNotified: false
}
```

#### 2.7 REPORT GENERATION & DELIVERY

**Report Generator**
- Automatically generate PDF report after validation
- Report should include:
  - Lab header (clinic name, address, contact, logo placeholder)
  - Patient demographics
  - Order ID and date
  - Referring physician
  - Test results table (test name, result, unit, reference range, status)
  - Abnormal results highlighted
  - Pathologist interpretation
  - Validated by (pathologist name and signature placeholder)
  - Report generation date
  - Lab certification info (placeholder)

**Report Delivery Options**:
- **Print**: Generate and show print dialog
- **Email**: Simulate email (show success message "Report sent to patient@email.com")
- **Patient Portal**: Mark as "Available in portal"
- **Download PDF**: Allow user to download

**Reports Dashboard**
- List all generated reports
- Filter by date, patient, status (sent, pending delivery)
- Resend report option
- View report history

---

### 3. PRACTICE/CLINIC MANAGEMENT

#### 3.1 APPOINTMENT SCHEDULING

**Appointment Calendar**
- Weekly or daily calendar view
- Time slots from 8:00 AM to 6:00 PM (30-minute intervals)
- Color-coded appointments by type:
  - Sample Collection (blue)
  - Consultation (green)
  - Result Discussion (yellow)

**Create Appointment Form**
- Select patient (existing or quick add)
- Appointment type (Sample Collection, Consultation, Result Discussion)
- Date and time picker
- Duration (15, 30, 45, 60 minutes)
- Purpose/notes
- Reminder preferences (SMS, Email, None)
- Save appointment

**Appointment List**
- Today's appointments view
- Upcoming appointments
- Appointment status: Scheduled, Confirmed, Completed, Cancelled, No-Show
- Actions: Check-in, Reschedule, Cancel, Mark as Completed

**Appointment Check-in**
- Mark patient as arrived
- Update appointment status
- Option to create order directly from appointment

#### 3.2 BILLING & FINANCIAL MANAGEMENT

**Invoice Generation** (automatic from order)
- Invoice ID: INV-YYYYMMDD-XXX
- Patient details
- Itemized list of tests with prices
- Subtotal
- Discount (percentage or fixed amount)
- Tax (if applicable)
- Total amount
- Payment status

**Payment Processing Screen**
- Display invoice details
- Payment method selection:
  - Cash
  - Credit/Debit Card
  - Insurance
  - Bank Transfer
  - Partial Payment
- Amount tendered
- Change calculation (for cash)
- Receipt generation
- Update payment status in order

**Payment Record**:
```javascript
{
  paymentId: "PAY-20250109-001",
  orderId: "ORD-20250109-001",
  invoiceId: "INV-20250109-001",
  amount: 25.00,
  paymentMethod: "cash",
  paymentDate: "2025-01-09T10:45:00",
  receivedBy: "receptionist_mary",
  receiptGenerated: true
}
```

**Billing Dashboard**
- Today's revenue
- Pending payments
- Completed payments
- Payment method breakdown (pie chart)
- Outstanding invoices list
- Filter by date range, payment status

**Outstanding Payments Management**
- List all unpaid or partially paid invoices
- Send payment reminders (simulate)
- Record partial payments
- Payment plans (store installment info)

#### 3.3 INSURANCE MANAGEMENT

**Insurance Provider Database**
- List of insurance providers
- Add/Edit provider information:
  - Provider name
  - Contact details
  - Coverage details (which tests covered, coverage percentage)
  - Pre-authorization requirements

**Insurance Claims**
- For orders with insurance:
  - Display insurance info
  - Coverage verification status (mock verification)
  - Claim submission (simulate - show success message)
  - Claim status tracking (Submitted, Processing, Approved, Denied, Paid)
  - Denial reasons and appeals process

**Insurance Coverage Check**
- Enter patient insurance info
- Select tests to check coverage
- Display coverage results (covered/not covered, percentage, co-pay)

#### 3.4 BASIC ELECTRONIC HEALTH RECORD (EHR)

**Patient Health Dashboard**
- Patient demographics
- Test history timeline
- All previous test results (sortable, filterable)
- Result trends (line graphs for repeated tests)
- Uploaded documents (prescription, referral letters) - just file names, no actual upload
- Medication list (simple text list)
- Allergies and special notes
- Visit history (appointments and orders)

**Medical History Form** (part of patient record)
- Chronic conditions (checkboxes: Diabetes, Hypertension, Heart Disease, etc.)
- Current medications (text list)
- Known allergies
- Previous surgeries
- Family medical history
- Lifestyle factors (smoking, alcohol)

#### 3.5 ADMINISTRATIVE FEATURES

**Dashboard Overview** (Administrator role)
- **Today's Statistics**:
  - Total patients registered today
  - Total orders created
  - Total revenue
  - Pending validations
  - Appointments scheduled
  
- **Charts/Graphs**:
  - Orders by status (pie chart)
  - Revenue over last 7 days (line chart)
  - Most ordered tests (bar chart)
  - Appointment types breakdown

**User Activity Log** (simulated)
- List of all actions taken: "receptionist_mary created order ORD-20250109-001 at 10:30 AM"
- Filter by user, action type, date range

**System Settings** (mock settings page)
- Lab information (name, address, contact, logo upload placeholder)
- Business hours
- Tax settings
- Currency settings
- Default reference ranges
- Report templates

---

## COMPLETE PATIENT WORKFLOW SIMULATION

### WORKFLOW: Walk-in Patient for Blood Test

**STEP 1: Patient Arrival & Registration** (Receptionist)
1. Receptionist clicks "New Patient Registration"
2. Fills in patient form (name, DOB, phone, insurance)
3. Saves patient → Patient ID generated: PAT-20250109-001
4. Success notification displayed

**STEP 2: Create Order** (Receptionist)
1. Click "Create Order" from patient detail view
2. Select tests: CBC, Glucose, Lipid Profile
3. Set priority: Routine
4. Enter clinical notes: "Annual health checkup"
5. Calculate total: $75.00
6. Save order → Order ID generated: ORD-20250109-001
7. Order status: "Ordered"

**STEP 3: Payment** (Receptionist)
1. Invoice automatically generated: INV-20250109-001
2. Select payment method: Cash
3. Enter amount tendered: $80.00
4. Calculate change: $5.00
5. Generate receipt
6. Payment status updated: "Paid"

**STEP 4: Sample Collection** (Lab Technician)
1. Lab tech logs in, sees pending collections
2. Selects order ORD-20250109-001
3. Generates sample labels:
   - SMP-20250109-001 (Blood - 5ml EDTA tube for CBC)
   - SMP-20250109-002 (Blood - 5ml SST tube for Glucose, Lipids)
4. Records collection time: 11:00 AM
5. Marks samples as collected
6. Order status updated: "Collected"
7. Prints labels (simulate with modal)

**STEP 5: Sample Processing & Result Entry** (Lab Technician)
1. After processing (simulate time passing or manual time entry)
2. Lab tech selects order ORD-20250109-001
3. Enters results for CBC:
   - Hemoglobin: 13.2 g/dL (Reference: 13.5-17.5) → LOW
   - WBC: 7.5 x10^9/L (Reference: 4.5-11.0) → NORMAL
   - Platelets: 220 x10^9/L (Reference: 150-400) → NORMAL
4. Enters results for Glucose: 5.8 mmol/L (Reference: 3.9-6.1) → NORMAL
5. Enters results for Lipid Profile:
   - Total Cholesterol: 6.2 mmol/L (Reference: <5.2) → HIGH
   - LDL: 4.1 mmol/L (Reference: <3.4) → HIGH
   - HDL: 1.2 mmol/L (Reference: >1.0) → NORMAL
   - Triglycerides: 1.8 mmol/L (Reference: <1.7) → HIGH
6. System flags abnormal results (Low Hemoglobin, High Cholesterol)
7. Adds technician note: "All samples processed normally"
8. Saves results
9. Order status updated: "Completed"

**STEP 6: Result Validation** (Pathologist)
1. Pathologist logs in, sees order awaiting validation
2. Reviews all results
3. Sees flagged abnormal values
4. Adds interpretation: "Mild anemia noted. Elevated lipid profile suggests dietary modification and follow-up in 3 months. Recommend iron studies to investigate anemia cause."
5. Marks critical values: None (no life-threatening results)
6. Approves results
7. Validation recorded with pathologist name and timestamp
8. Order status updated: "Validated"

**STEP 7: Report Generation & Delivery** (Automatic/Pathologist)
1. System automatically generates PDF report
2. Report includes:
   - Patient: John Doe, PAT-20250109-001
   - All test results with highlighted abnormals
   - Pathologist interpretation
   - Validated by: Dr. Johnson
   - Report date: 2025-01-09
3. Pathologist selects delivery method: Email + Patient Portal
4. System simulates sending email
5. Order status updated: "Delivered"
6. Success notification: "Report sent successfully"

**STEP 8: Patient Portal/Result Pickup** (Patient View - Optional)
1. Patient logs in (simple patient portal view)
2. Sees available report
3. Downloads PDF report
4. Views result history and trends

---

## TECHNICAL IMPLEMENTATION DETAILS

### LocalStorage Structure
```javascript
// Store data in separate keys
localStorage.setItem('medlab_patients', JSON.stringify(patients));
localStorage.setItem('medlab_orders', JSON.stringify(orders));
localStorage.setItem('medlab_tests', JSON.stringify(testCatalog));
localStorage.setItem('medlab_appointments', JSON.stringify(appointments));
localStorage.setItem('medlab_payments', JSON.stringify(payments));
localStorage.setItem('medlab_samples', JSON.stringify(samples));
localStorage.setItem('medlab_users', JSON.stringify(users));
```

### State Management Structure

Create contexts for:
- **AuthContext**: Current user, role, login/logout
- **PatientsContext**: All patient data, CRUD operations
- **OrdersContext**: All order data, status updates, CRUD
- **TestsContext**: Test catalog, filtering
- **AppointmentsContext**: Calendar data, scheduling
- **BillingContext**: Invoices, payments

### Component Structure
```
src/
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Alert.tsx
│   │   └── SearchBar.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── DashboardLayout.tsx
│   │   └── Footer.tsx
│   ├── patients/
│   │   ├── PatientRegistrationForm.tsx
│   │   ├── PatientList.tsx
│   │   ├── PatientDetail.tsx
│   │   └── PatientSearch.tsx
│   ├── orders/
│   │   ├── CreateOrderForm.tsx
│   │   ├── OrdersList.tsx
│   │   ├── OrderDetail.tsx
│   │   └── OrderTracking.tsx
│   ├── laboratory/
│   │   ├── SampleCollection.tsx
│   │   ├── ResultEntry.tsx
│   │   ├── ResultValidation.tsx
│   │   ├── SampleTracking.tsx
│   │   └── TestCatalog.tsx
│   ├── reports/
│   │   ├── ReportGenerator.tsx
│   │   ├── ReportPreview.tsx
│   │   └── ReportsList.tsx
│   ├── appointments/
│   │   ├── Calendar.tsx
│   │   ├── AppointmentForm.tsx
│   │   └── AppointmentsList.tsx
│   ├── billing/
│   │   ├── InvoiceView.tsx
│   │   ├── PaymentForm.tsx
│   │   ├── BillingDashboard.tsx
│   │   └── OutstandingPayments.tsx
│   ├── admin/
│   │   ├── AdminDashboard.tsx
│   │   ├── UserManagement.tsx
│   │   └── SystemSettings.tsx
│   └── auth/
│       └── LoginForm.tsx
├── contexts/
│   ├── AuthContext.tsx
│   ├── PatientsContext.tsx
│   ├── OrdersContext.tsx
│   ├── TestsContext.tsx
│   ├── AppointmentsContext.tsx
│   └── BillingContext.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Patients.tsx
│   ├── Orders.tsx
│   ├── Laboratory.tsx
│   ├── Appointments.tsx
│   ├── Billing.tsx
│   ├── Reports.tsx
│   └── Admin.tsx
├── utils/
│   ├── generateId.ts
│   ├── formatDate.ts
│   ├── calculateAge.ts
│   ├── checkReferenceRange.ts
│   ├── localStorage.ts
│   └── pdfGenerator.ts
├── types/
│   ├── patient.types.ts
│   ├── order.types.ts
│   ├── test.types.ts
│   └── appointment.types.ts
├── hooks/
│   ├── useLocalStorage.ts
│   └── useAuth.ts
├── App.tsx
└── main.tsx
```

### Routing Structure
```javascript
/login
/dashboard
/patients
  /new
  /list
  /:id
/orders
  /new
  /list
  /:id
/laboratory
  /sample-collection
  /result-entry
  /validation
  /tracking
/appointments
  /calendar
  /new
  /list
/billing
  /invoices
  /payments
  /outstanding
/reports
  /generate
  /list
/admin
  /dashboard
  /users
  /tests
  /settings
```

### Key Utility Functions
```typescript
// Generate unique IDs
generatePatientId(): string // PAT-20250109-001
generateOrderId(): string // ORD-20250109-001
generateSampleId(): string // SMP-20250109-001
generateInvoiceId(): string // INV-20250109-001

// Validation
checkReferenceRange(value: number, range: string, gender?: string): 'normal' | 'high' | 'low'
validatePhoneNumber(phone: string): boolean
validateEmail(email: string): boolean

// Formatting
formatCurrency(amount: number): string
formatDateTime(date: Date): string
calculateAge(dob: Date): number

// PDF Generation
generateLabReport(order: Order): Blob
generateInvoice(payment: Payment): Blob
```

### Mock Data (Seed Data)

Create initial mock data:
- 5 demo users (1 per role + 1 extra tech)
- 20 test catalog items (as specified earlier)
- 10 sample patients with varying data
- 5 completed orders with results
- 3 pending orders
- 8 appointments for current week
- 3 insurance providers

### UI/UX Requirements

**Design Principles**:
- Clean, professional medical interface
- Easy navigation with clear role-based views
- Status indicators with color coding
- Confirmation modals for destructive actions
- Loading states for all operations
- Success/error notifications for all actions
- Responsive design (desktop-first, but mobile-friendly)

**Color Scheme**:
- Primary: Medical blue (#0284C7)
- Success: Green (#10B981)
- Warning: Yellow/Orange (#F59E0B)
- Danger: Red (#EF4444)
- Neutral: Gray shades

**Accessibility**:
- Proper ARIA labels
- Keyboard navigation support
- Sufficient color contrast
- Clear focus indicators

### Data Validation Rules

**Patient Registration**:
- Name: required, min 2 characters
- DOB: required, must be in the past, max age 150 years
- Phone: required, valid format
- Email: valid format if provided

**Order Creation**:
- Must select at least one test
- Patient must be selected
- Priority must be set

**Result Entry**:
- Numeric results must be within plausible ranges
- All test parameters must be filled
- Reference ranges must be checked

**Payment**:
- Amount must be > 0
- Cannot pay more than invoice total (unless overpayment intentional)
- Payment method must be selected

### Special Features to Implement

1. **Critical Value Alert System**
   - Pop-up modal when critical values entered
   - Requires acknowledgment before proceeding
   - Logs who acknowledged

2. **Result Trends Visualization**
   - Line charts for repeated tests (e.g., show glucose trend over last 6 months)
   - Color-coded based on normal/abnormal ranges

3. **Print Functionality**
   - Sample labels (barcode simulation)
   - Order forms
   - Reports
   - Invoices/receipts

4. **Quick Actions**
   - From patient detail: Quick create order button
   - From order detail: Quick collect sample button
   - Keyboard shortcuts for common actions

5. **Statistics & Analytics**
   - Real-time dashboard updates
   - Charts for revenue, order volume, test frequency
   - Exportable data (CSV download simulation)

## DELIVERABLES

Please provide:

1. **Complete React/TypeScript Application**
   - All components as specified
   - Full routing setup
   - Context providers with CRUD operations
   - LocalStorage persistence

2. **Seed Data Script**
   - Function to populate localStorage with demo data
   - Include at least 10 patients, 20 tests, 5 orders with results

3. **README.md**
   - Setup instructions
   - How to run the application
   - Login credentials for each role
   - Overview of features
   - Known limitations (no backend, localStorage only)

4. **Code Quality**
   - TypeScript types for all data structures
   - Proper component decomposition
   - Clean, commented code
   - Consistent naming conventions
   - Form validation throughout

5. **Testing Instructions**
   - Step-by-step guide to test complete patient workflow
   - How to switch between roles
   - How to reset demo data

## SUCCESS CRITERIA

The application is successful if:
- ✅ A user can complete the entire patient workflow from registration to report delivery
- ✅ All roles can access their appropriate features
- ✅ Data persists across browser refresh (localStorage)
- ✅ Forms validate properly
- ✅ Status updates flow correctly through the system
- ✅ Reports generate with proper formatting
- ✅ UI is clean, intuitive, and professional
- ✅ No console errors
- ✅ Responsive design works on desktop

## CONSTRAINTS

- No backend API calls (everything is frontend)
- No real authentication (role selection is enough)
- No real PDF generation needed if complex (can simulate or use simple library)
- No real email sending (show success notifications)
- No file uploads (just store file names)
- Focus on workflow functionality over pixel-perfect design

## NOTES

- This is a PROTOTYPE/DEMO, not production software
- Security is not a concern (no real data)
- Performance optimization is secondary to functionality
- Use placeholder text/images where appropriate
- Add helpful tooltips and inline help text
- Include a "Demo Mode" indicator in the header

BEGIN IMPLEMENTATION. Create a fully functional Medical Analysis Center management system as specified above.Claude è un'AI e può commettere errori. Verifica le risposte.