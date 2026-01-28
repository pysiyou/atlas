# Validation Rules Documentation

Central reference for validation constraints across frontend and backend.

## Table of Contents

- [Patient Validation](#patient-validation)
- [Order Validation](#order-validation)
- [Payment Validation](#payment-validation)
- [Common Field Validations](#common-field-validations)

---

## Patient Validation

### Required Fields (Create)

- `fullName` (string, 2-100 characters)
- `dateOfBirth` (ISO date string)
- `gender` (enum: `male` | `female`)
- `phone` (string, 10-20 characters, pattern: `^[\d\s\-\+\(\)]+$`)
- `address` (object)
  - `street` (string, 1-200 characters)
  - `city` (string, 1-100 characters)
  - `postalCode` (string, 1-20 characters, pattern: `^[\w\s-]+$`)
- `emergencyContact` (object)
  - `fullName` (string, 2-100 characters)
  - `relationship` (enum: `spouse` | `parent` | `sibling` | `child` | `friend` | `other`)
  - `phone` (string, 10-20 characters)

### Optional Fields

- `email` (string, max 254 characters, valid email format)
- `height` (number, 30-250 cm)
- `weight` (number, 1-500 kg)
- `emergencyContact.email` (string, valid email format)
- `medicalHistory` (object, all fields optional)
  - `chronicConditions` (array of strings)
  - `currentMedications` (array of strings)
  - `allergies` (array of strings)
  - `previousSurgeries` (array of strings)
  - `familyHistory` (array of strings or semicolon-separated string)
  - `lifestyle.smoking` (boolean)
  - `lifestyle.alcohol` (boolean)
- `affiliation` (object)
  - `assuranceNumber` (string, 1-50 characters) - auto-generated if only duration provided
  - `startDate` (ISO date string) - defaults to today if not provided
  - `endDate` (ISO date string) - calculated from startDate + duration
  - `duration` (enum: `6` | `12` | `24` months)
- `vitalSigns` (object, **all fields optional** - partial vital signs allowed)
  - `temperature` (number, 30.0-45.0°C)
  - `heartRate` (number, 30-250 BPM)
  - `systolicBP` (number, 50-250 mmHg)
  - `diastolicBP` (number, 30-150 mmHg)
  - `respiratoryRate` (number, 4-60 breaths/min)
  - `oxygenSaturation` (number, 50-100%)
  - **Note**: You can provide any combination of vital signs. Missing fields are stored as `null` in backend.

### Update Fields

**All fields are optional for updates** - only send changed fields.

### Custom Validations

- **Affiliation**: `endDate` must be after `startDate`
- **Vital Signs**: `systolicBP` must be greater than `diastolicBP` (when both provided)

### Backend Auto-generation

- When `affiliation.duration` is provided without `assuranceNumber` or dates:
  - `assuranceNumber` generated as: `ASS-YYYYMMDD-XXX`
  - `startDate` defaults to today
  - `endDate` calculated from `startDate + duration` months

---

## Order Validation

### Required Fields (Create)

- `patientId` (positive integer, must exist in database)
- `tests` (array, min 1 test required)
  - `testCode` (string, 1-50 characters, must exist in test catalog)
  - No duplicate test codes allowed

### Optional Fields

- `priority` (enum: `routine` | `urgent` | `stat`, default: `routine`)
- `referringPhysician` (string, max 200 characters)
- `clinicalNotes` (string, max 2000 characters)
- `specialInstructions` (array of strings)
- `patientPrepInstructions` (string, max 1000 characters)

### Update Fields

**All fields are optional for updates** - only send changed fields.

**Special handling for `tests` field:**
- New tests: added with `PENDING` status, samples auto-generated
- Removed tests: only allowed if status is `PENDING` and no results entered
- Cannot remove tests with results or in-progress status
- Total price recalculated after test changes

### Business Rules

- Total price calculated from test catalog prices
- Payment status defaults to `UNPAID`
- Order status defaults to `ORDERED`
- Samples automatically generated for all tests in order

---

## Payment Validation

### Required Fields (Create)

- `orderId` (string or number, converted to positive integer)
- `amount` (number, min 0.01)
- `paymentMethod` (enum: `cash` | `credit-card` | `debit-card` | `insurance` | `bank-transfer` | `mobile-money`)

### Optional Fields

- `notes` (string)

### Update Fields

Not applicable - payments are not typically updated after creation.

---

## Common Field Validations

### String Constraints

| Field | Min | Max | Pattern | Notes |
|-------|-----|-----|---------|-------|
| `fullName` | 2 | 100 | - | Patient/emergency contact names |
| `phone` | 10 | 20 | `^[\d\s\-\+\(\)]+$` | International format with spaces/dashes/parens allowed |
| `email` | - | 254 | Valid email | Unicode allowed in local part, ASCII only for domain |
| `street` | 1 | 200 | - | Address street |
| `city` | 1 | 100 | - | Address city |
| `postalCode` | 1 | 20 | `^[\w\s-]+$` | Alphanumeric with spaces/hyphens |

### Numeric Constraints

| Field | Min | Max | Unit | Notes |
|-------|-----|-----|------|-------|
| `height` | 30 | 250 | cm | Patient height |
| `weight` | 1 | 500 | kg | Patient weight |
| `temperature` | 30.0 | 45.0 | °C | Vital sign |
| `heartRate` | 30 | 250 | BPM | Vital sign |
| `systolicBP` | 50 | 250 | mmHg | Vital sign |
| `diastolicBP` | 30 | 150 | mmHg | Vital sign |
| `respiratoryRate` | 4 | 60 | breaths/min | Vital sign |
| `oxygenSaturation` | 50 | 100 | % | Vital sign (SpO2) |

### Enum Types

#### Gender
- `male`
- `female`

#### Relationship
- `spouse`
- `parent`
- `sibling`
- `child`
- `friend`
- `other`

#### Affiliation Duration
- `6` (months)
- `12` (months)
- `24` (months)

#### Priority Level
- `routine`
- `urgent`
- `stat`

#### Order Status
- `ordered`
- `in-progress`
- `completed`
- `cancelled`

#### Payment Status
- `unpaid`
- `paid`
- `refunded`

#### Test Status
- `pending`
- `sample-collected`
- `in-progress`
- `resulted`
- `validated`
- `rejected`
- `superseded`
- `removed`

#### Payment Method
- `cash`
- `credit-card`
- `debit-card`
- `insurance`
- `bank-transfer`
- `mobile-money`

---

## Schema Organization

### Frontend Schemas

**Create vs Update:**
- `*CreateSchema` - Full validation with all required fields enforced
- `*UpdateSchema` - Partial validation (all fields optional) using `.partial()`

**Location:**
- Patient: `/src/features/patient/schemas/patient.schema.ts`
- Order: `/src/features/order/schemas/order.schema.ts`
- Payment: `/src/features/payment/schemas/payment.schema.ts`
- Common: `/src/shared/schemas/common.schema.ts`

### Backend Schemas

**Location:**
- Patient: `/backend/app/schemas/patient.py`
- Order: `/backend/app/schemas/order.py`
- Payment: (embedded in API routes)

---

## Partial Updates

### How They Work

1. **Frontend**: Use `*UpdateSchema` (partial) for edit forms
2. **Validation**: Only validates fields that are provided
3. **API**: Pydantic `exclude_unset=True` includes only sent fields
4. **Backend**: Updates only provided fields, leaves others unchanged

### Example: Update Patient Phone Only

```typescript
// Frontend sends minimal payload
{
  phone: "1234567890"
}

// Backend updates only phone field
// All other patient fields remain unchanged
```

---

## Validation Mode

### Form Validation

- **Mode**: `onBlur` (validates when user leaves field)
- **Create forms**: Validate all required fields before submission
- **Edit forms**: Validate only changed fields
- **Optional fields**: Never block submission if empty

### API Validation

- **Service hooks** parse input with appropriate schema before API call
- **Zod handles** type coercion where safe (e.g., string to number for orderId)
- **Backend validates** final payload with Pydantic schemas

---

## Common Issues & Solutions

### Issue: Required field blocks partial update
**Solution**: Use `patientUpdateSchema` instead of `patientCreateSchema` for edit forms

### Issue: Frontend and backend validation differ
**Solution**: Check this document - frontend should match backend constraints exactly

### Issue: Optional field shows as required
**Solution**: Use `.optional()` or `.nullish()` in Zod schema, ensure backend accepts null/undefined

### Issue: Partial data rejected by backend
**Solution**: Backend schemas should use `| None` for optional fields, use `exclude_unset=True` in updates

### Issue: Response parsing fails with "expected string, received null"
**Solution**: Backend returns `null` for optional fields, not `undefined`. Use `.nullable()` in response schemas:
```typescript
// Response schema (parsing backend data)
email: emailSchema.nullable()  // Backend can return null
height: z.number().nullable().optional()  // Backend can return null

// Form schema (for user input)
email: emailSchema  // User provides string or empty
height: z.number().optional()  // User provides number or omits
```

### Issue: Backend validation error "Invalid email format: missing @" for empty string
**Solution**: Both frontend and backend now handle empty strings:
- Backend: Treats empty string `''` as `None` in email validator
- Frontend: Transforms empty string to `undefined` before sending to API
- This ensures empty email fields are stored as `null` in database, not `''`

### Issue: Form validation error "expected number, received null" for partial vital signs
**Scenario**: Editing patient with partial vitals (some fields are `null` from backend)
**Root cause**: Backend returns `null` for unrecorded vitals, but form schema expects `number | undefined`
**Solution**: Transform `null` to `undefined` when loading patient data into form:
```typescript
// In patientToFormInput
vitalSigns: patient.vitalSigns ? {
  temperature: patient.vitalSigns.temperature ?? undefined,  // null → undefined
  heartRate: patient.vitalSigns.heartRate ?? undefined,
  // ... other vitals
} : undefined
```
**Why**: Form schemas use `.optional()` (accepts `undefined`), not `.nullable()` (accepts `null`)

---

## Testing Checklist

- [ ] Patient create: all required fields enforced
- [ ] Patient update: partial fields accepted
- [ ] Patient update: clearing optional fields works
- [ ] Order create: tests submitted correctly
- [ ] Order update: test changes applied correctly
- [ ] Payment: orderId type handled correctly (string or number)
- [ ] No duplicate saves on rapid clicks
- [ ] Form state preserved on error
- [ ] Backend validation errors displayed properly
- [ ] Medical history arrays preserve formatting
- [ ] Affiliation partial submission works (duration only)
- [ ] Vital signs partial updates work
