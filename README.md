# DentalSoft SDK (Refactored)

This is a refactored version of the official JavaScript SDK for the DentalSoft API. It provides a cleaner, more consistent, and developer-friendly interface for interacting with the DentalSoft platform.

## Key Improvements

- **Consistent Naming Convention**: All methods, parameters, and properties now use `camelCase` for consistency and readability.
- **Standardized Data Transformation**: The SDK consistently translates the API's `snake_case` responses into a `camelCase` format.
- **Updated Method Signatures**: All method signatures have been updated to accept parameters in `camelCase`, aligning with modern JavaScript standards.

## Installation

```bash
npm install @dentalsoft/sdk
```

## Quick Start

```javascript
const DentalSoftSDK = require("./dentalsoft-sdk.refactored.js");

const sdk = new DentalSoftSDK({
	clientId: "your_client_id",
	clientSecret: "your_client_secret",
	businessRut: "your_business_rut",
});

async function example() {
	try {
		await sdk.authenticate();
		const professionals = await sdk.getProfessionals();
		console.log("Available Professionals:", professionals);
	} catch (error) {
		console.error("Error:", error.message);
	}
}

example();
```

## API Reference

### Configuration

```javascript
const sdk = new DentalSoftSDK({
	clientId: "your_client_id", // Required
	clientSecret: "your_client_secret", // Required
	businessRut: "your_business_rut", // Required
	baseUrl: "https://api.dentalsoft.cl/external", // Optional
});
```

### Authentication

```javascript
// Authenticate (also called automatically)
const authResponse = await sdk.authenticate();
console.log(authResponse.token);

// Check if the token is still valid
const isValid = sdk.isTokenValid();
console.log("Is token valid?", isValid);
```

### Agenda

- **`getAppointment(appointmentId)`**: Get detailed information for a specific appointment.
  ```json
  // Response -> Appointment
  {
    "appointmentId": 123,
    "patientId": 456,
    "professionalId": 789,
    "branchId": 1,
    "roomId": 2,
    "startTime": "10:00",
    "endTime": "10:30",
    "date": "2025-12-01",
    "blocks": 1,
    "durationInMinutes": 30,
    "statusId": 1,
    "statusText": "Scheduled",
    "isConfirmable": true,
    "notes": "Regular check-up.",
    "patient": { ... },
    "room": { ... }
  }
  ```
- **`getAppointmentBlockLength()`**: Get the configured duration of an appointment block.
  ```json
  // Response
  {
  	"largo": 30,
  	"unidad": "minuto"
  }
  ```
- **`getMonthlyAvailability(professionalId, year, month, branchId, blocks)`**: Get monthly availability for a professional.
  ```json
  // Response -> MonthlyAvailability[]
  [
  	{
  		"date": "2025-12-01",
  		"dayOfWeek": 1,
  		"hasAvailableBlocks": true,
  		"dayName": "Lunes"
  	}
  ]
  ```
- **`getDailyAvailability(professionalId, date, branchId, duration)`**: Get daily availability for a professional.
  ```json
  // Response -> DailyAvailability[]
  [
  	{
  		"startTime": "10:00",
  		"endTime": "10:30",
  		"professionalId": 789,
  		"roomCode": "A1",
  		"roomName": "Room 1"
  	}
  ]
  ```
- **`createAppointment(appointmentData)`**: Create a new appointment.
  ```json
  // Response -> CreateAppointmentResponse
  {
  	"message": "Appointment created successfully.",
  	"appointmentId": 123
  }
  ```
- **`updateAppointmentStatus(appointmentId, status)`**: Modify the status of an existing appointment.
  ```json
  // Response
  {
  	"mensaje": "Status updated successfully.",
  	"id": 123
  }
  ```
- **`getDailyAppointments(date, branchId)`**: Get all appointments for a specific day and branch.
  ```json
  // Response -> Appointment[]
  [ ... ]
  ```
- **`getEffectiveHours(startDate, endDate, options)`**: Get a report of effective hours.
  ```json
  // Response -> { data: EffectiveHours[] }
  {
    "data": [ ... ]
  }
  ```

### Patient

- **`getPatientByRut(rut, documentType)`**: Search for a patient by RUT.
  ```json
  // Response -> Patient
  {
  	"patientId": 456,
  	"fullName": "John Doe",
  	"rut": "12345678-9",
  	"phone": "987654321",
  	"email": "john.doe@example.com",
  	"gender": "M",
  	"birthDate": "1990-01-01",
  	"documentType": 1,
  	"status": 1
  }
  ```
- **`getPatientByCedula(cedula, documentType)`**: Search for a patient by another document ID.
- **`getPatientInfo(patientId, documentType)`**: Get information for a specific patient.
- **`searchPatients(searchTerm, documentType)`**: Search for patients by a search term.
- **`createPatient(patientData)`**: Create a new patient.
  ```json
  // Response -> CreatePatientResponse
  {
  	"message": "Patient created successfully.",
  	"patientId": 456
  }
  ```
- **`getPatientAppointmentHistory(patientId, branchId, limitDays, maxAppointments)`**: Get a patient's appointment history.

### Professional

- **`getProfessionals()`**: Get a list of all enabled professionals.
  ```json
  // Response -> Professional[]
  [
  	{
  		"professionalId": 789,
  		"fullName": "Dr. Jane Smith",
  		"rut": "98765432-1"
  	}
  ]
  ```
- **`searchProfessionalByRut(rut)`**: Search for a professional by RUT.
- **`searchProfessionalById(professionalId)`**: Search for a professional by ID.

### Sucursal (Branch)

- **`getBranches()`**: Get a list of all available branches.
  ```json
  // Response -> Branch[]
  [
  	{
  		"branchId": 1,
  		"name": "Main Branch",
  		"phone": "123456789",
  		"address": "123 Main St",
  		"status": 1,
  		"statusText": "Active"
  	}
  ]
  ```

### Reports

- **`getBudgetReport(startDate, endDate, options)`**: Get budget report data.
- **`getPaymentReport(startDate, endDate, options)`**: Get a detailed income report.

## Data Normalization

The SDK automatically normalizes API responses to provide a consistent and predictable data structure.

### Example: Professional Data

```javascript
// Raw API Response
{
    "id_profesional": 12345,
    "nombre_completo": "Dr. John Smith"
}

// SDK Response
{
    "professionalId": 12345678,
    "fullName": "Dr. John Smith"
}
```

### Example: Appointment Data

```javascript
// SDK Response
{
    "appointmentId": 10321,
    "patientId": 1228,
    "professionalId": "18577092",
    "branchId": 1,
    "roomId": 1,
    "startTime": "16:00",
    "endTime": "17:00", // Calculated
    "date": "2025-09-03",
    "blocks": 2,
    "durationInMinutes": 60, // Calculated
    "statusText": "Atendido",
    "patient": { /* normalized patient data */ },
    "room": { /* normalized room data */ }
}
```

## Testing

The SDK includes a comprehensive test suite that can be run from the command line.

### Running All Tests

To run all available tests, use the `--all` flag:

```bash
node test-sdk.js --all
```

### Running Individual Tests

You can also run specific tests by providing the corresponding flag:

- `--auth`: Tests the authentication method.
- `--professionals`: Tests the `getProfessionals` method.
- `--branches`: Tests the `getBranches` method.
- `--availability`: Tests the monthly and daily availability methods.
- `--patient`: Tests the `getPatientByRut` method.
- `--create-patient`: Tests the `createPatient` method.

**Example:**

```bash
node test-sdk.js --patient
```

## TypeScript Support

The SDK is fully typed and includes detailed TypeScript definitions for all methods and data structures.

```typescript
import DentalSoftSDK, {
	SdkConfig,
	Professional,
	Patient,
	Appointment,
} from "./dentalsoft-sdk.refactored";

const config: SdkConfig = {
	clientId: "your_client_id",
	clientSecret: "your_client_secret",
	businessRut: "your_business_rut",
};

const sdk = new DentalSoftSDK(config);

async function getProfessionals(): Promise<void> {
	const professionals: Professional[] = await sdk.getProfessionals();
	console.log(professionals);
}
```

## License

MIT
