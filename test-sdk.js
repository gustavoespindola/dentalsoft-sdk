const DentalSoftSDK = require("./dentalsoft-sdk.js");
require("dotenv").config();

const config = {
	clientId: process.env.DENTALSOFT_CLIENT_ID,
	clientSecret: process.env.DENTALSOFT_CLIENT_SECRET,
	businessRut: process.env.DENTALSOFT_BUSINESS_RUT,
};

const sdk = new DentalSoftSDK(config);

async function testAuth() {
	console.log("Running test: Authentication");
	const authResponse = await sdk.authenticate();
	if (authResponse.token) {
		console.log("Authentication successful.");
	} else {
		console.error("Authentication failed.");
	}
}

async function testGetProfessionals() {
	console.log("\nRunning test: Get Professionals");
	const professionals = await sdk.getProfessionals();
	if (professionals && professionals.length > 0) {
		console.log(`Found ${professionals.length} professionals:`);
		console.log(professionals);
	} else {
		console.error("Failed to get professionals.");
	}
}

async function testGetBranches() {
	console.log("\nRunning test: Get Branches");
	const branches = await sdk.getBranches();
	if (branches && branches.length > 0) {
		console.log(`Found ${branches.length} branches.`);
	} else {
		console.error("Failed to get branches.");
	}
}

async function testAvailability() {
	console.log("\nRunning test: Availability");
	const professionals = await sdk.getProfessionals();
	const branches = await sdk.getBranches();

	if (
		professionals &&
		professionals.length > 0 &&
		branches &&
		branches.length > 0
	) {
		const firstProfessional = professionals[0];
		const firstBranch = branches[0];
		const testDate = "2025-10-01";
		const testYear = 2025;
		const testMonth = 10;

		console.log("\nRunning test: Get Monthly Availability");
		const availability = await sdk.getMonthlyAvailability(
			firstProfessional.professionalId,
			testYear,
			testMonth,
			firstBranch.branchId,
			1
		);
		console.log(
			`Monthly availability for professional ${firstProfessional.professionalId} in branch ${firstBranch.branchId}:`,
			availability
		);

		console.log("\nRunning test: Get Daily Availability");
		const dailyAvailability = await sdk.getDailyAvailability(
			firstProfessional.professionalId,
			testDate,
			firstBranch.branchId,
			1
		);
		console.log(
			`Daily availability for professional ${firstProfessional.professionalId} in branch ${firstBranch.branchId} on ${testDate}:`,
			dailyAvailability
		);
	}
}

async function testGetPatientByRut() {
	console.log("\nRunning test: Get Patient by RUT");
	const patient = await sdk.getPatientByRut("169386420");
	if (patient && patient.patientId) {
		console.log("Found patient by RUT:", patient);
	} else {
		console.error("Failed to get patient by RUT.");
	}
}

async function testCreatePatient() {
	console.log("\nRunning test: Create Patient");
	const patientData = {
		documentId: "11111111-1",
		documentType: "rut",
		name: "Test",
		lastName: "Patient",
		email: "test.patient.delete@example.com",
		mobilePhone: "123456789",
	};
	const newPatient = await sdk.createPatient(patientData);
	if (newPatient.patientId) {
		console.log("Patient created successfully:", newPatient);
	} else {
		console.error("Failed to create patient.");
	}
}

async function runAllTests() {
	await testAuth();
	await testGetProfessionals();
	await testGetBranches();
	await testAvailability();
	await testGetPatientByRut();
	await testCreatePatient();
}

const args = process.argv.slice(2);

if (args.length === 0) {
	console.log(
		"Usage: node test-sdk.js [--all|--auth|--professionals|--branches|--availability|--patient|--create-patient]"
	);
} else {
	args.forEach((arg) => {
		switch (arg) {
			case "--all":
				runAllTests();
				break;
			case "--auth":
				testAuth();
				break;
			case "--professionals":
				testGetProfessionals();
				break;
			case "--branches":
				testGetBranches();
				break;
			case "--availability":
				testAvailability();
				break;
			case "--patient":
				testGetPatientByRut();
				break;
			case "--create-patient":
				testCreatePatient();
				break;
			default:
				console.log(`Unknown argument: ${arg}`);
		}
	});
}
