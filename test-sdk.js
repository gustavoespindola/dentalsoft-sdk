#!/usr/bin/env node

require("dotenv").config();
const DentalSoftSDK = require("./dentalsoft-sdk");

// Test configuration - using the same config from the original file
const TEST_CONFIG = {
	clientId: process.env.CLIENT_ID,
	clientSecret: process.env.CLIENT_SECRET,
	businessRut: process.env.BUSINESS_RUT,
};

// Test results tracking
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function logTest(testName, status, message = "") {
	testsRun++;
	const symbol = status === "PASS" ? "✅" : "❌";
	const statusColor = status === "PASS" ? "\x1b[32m" : "\x1b[31m";
	const resetColor = "\x1b[0m";

	console.log(
		`${symbol} ${statusColor}[${status}]${resetColor} ${testName}${
			message ? ": " + message : ""
		}`
	);

	if (status === "PASS") {
		testsPassed++;
	} else {
		testsFailed++;
	}
}

function logInfo(message) {
	console.log(`ℹ️  ${message}`);
}

function logError(message) {
	console.log(`🔥 ${message}`);
}

async function testAuthentication(sdk) {
	console.log("\n🔐 Testing Authentication...");

	try {
		const authResult = await sdk.authenticate();

		if (authResult.token) {
			logTest(
				"Authentication",
				"PASS",
				`Token received (${authResult.token.substring(0, 20)}...)`
			);

			if (authResult.expiresIn) {
				logInfo(`Token expires in ${authResult.expiresIn} seconds`);
			}

			if (sdk.isTokenValid()) {
				logTest("Token validation", "PASS", "Token is valid");
			} else {
				logTest(
					"Token validation",
					"FAIL",
					"Token should be valid after authentication"
				);
			}

			return true;
		} else {
			logTest("Authentication", "FAIL", "No token received");
			return false;
		}
	} catch (error) {
		logTest("Authentication", "FAIL", error.message);
		return false;
	}
}

async function testProfessionals(sdk) {
	console.log("\n👨‍⚕️ Testing Professionals API...");

	try {
		const professionals = await sdk.getProfessionals();

		if (Array.isArray(professionals)) {
			logTest(
				"Get professionals",
				"PASS",
				`Found ${professionals.length} professionals`
			);

			if (professionals.length > 0) {
				const firstProf = professionals[0];
				if (firstProf.id_profesional && firstProf.nombre_completo) {
					logTest(
						"Professional data structure",
						"PASS",
						"Contains required fields"
					);
					logInfo(
						`Sample: ${firstProf.id_profesional} - ${firstProf.nombre_completo}`
					);

					// Test search functionality
					const searchResults = await sdk.searchProfessional("doctor");
					logTest(
						"Professional search",
						"PASS",
						`Search returned ${searchResults.length} results`
					);

					return professionals[0].id_profesional;
				} else {
					logTest(
						"Professional data structure",
						"FAIL",
						"Missing required fields"
					);
				}
			} else {
				logTest("Professional data", "FAIL", "No professionals found");
			}
		} else {
			logTest("Get professionals", "FAIL", "Response is not an array");
		}

		return null;
	} catch (error) {
		logTest("Get professionals", "FAIL", error.message);
		return null;
	}
}

async function testAvailability(sdk, professionalId) {
	if (!professionalId) {
		logError("Skipping availability tests - no professional ID available");
		return;
	}

	console.log("\n📅 Testing Availability API...");

	try {
		// Test monthly availability
		const currentDate = new Date();
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth() + 1;

		const monthlyData = await sdk.getMonthlyAvailability(
			professionalId,
			year,
			month,
			1,
			2
		);

		if (Array.isArray(monthlyData)) {
			logTest(
				"Monthly availability",
				"PASS",
				`Found ${monthlyData.length} days`
			);

			const availableDays = monthlyData.filter(
				(day) => day.bloques_disponibles
			);
			logInfo(`${availableDays.length} days have availability`);

			// Test daily availability if we have available days
			if (availableDays.length > 0) {
				const testDate = availableDays[0].fecha;
				const dailySlots = await sdk.getDailyAvailability(
					professionalId,
					testDate,
					1,
					2
				);

				if (Array.isArray(dailySlots)) {
					logTest(
						"Daily availability",
						"PASS",
						`Found ${dailySlots.length} slots for ${testDate}`
					);

					if (dailySlots.length > 0) {
						const slot = dailySlots[0];
						if (slot.inicio && slot.fin && slot.nom_sala) {
							logTest(
								"Slot data structure",
								"PASS",
								"Contains required fields"
							);
							logInfo(
								`Sample slot: ${slot.inicio} - ${slot.fin} (${slot.nom_sala})`
							);
						} else {
							logTest("Slot data structure", "FAIL", "Missing required fields");
						}
					}
				} else {
					logTest("Daily availability", "FAIL", "Response is not an array");
				}

				// Test convenience method
				const availableSlots = await sdk.findAvailableSlots(
					professionalId,
					year,
					month,
					1,
					2
				);
				if (Array.isArray(availableSlots)) {
					logTest(
						"Find available slots (convenience)",
						"PASS",
						`Found slots for ${availableSlots.length} days`
					);
				} else {
					logTest(
						"Find available slots (convenience)",
						"FAIL",
						"Response is not an array"
					);
				}
			} else {
				logInfo("No available days found for testing daily availability");
			}
		} else {
			logTest("Monthly availability", "FAIL", "Response is not an array");
		}
	} catch (error) {
		logTest("Availability API", "FAIL", error.message);
	}
}

async function testAppointments(sdk) {
	console.log("\n📋 Testing Appointments API...");

	try {
		// Test with a future date
		const testDate = "2025-01-15";
		const appointments = await sdk.getDailyAppointments(testDate, 1);

		if (Array.isArray(appointments)) {
			logTest(
				"Daily appointments",
				"PASS",
				`Found ${appointments.length} appointments for ${testDate}`
			);
		} else {
			logTest("Daily appointments", "FAIL", "Response is not an array");
		}
	} catch (error) {
		logTest("Daily appointments", "FAIL", error.message);
	}
}

async function testUtilities(sdk) {
	console.log("\n🛠️ Testing Utility Methods...");

	try {
		// Test date formatting
		const formattedDate = sdk.formatDate(2025, 1, 15);
		if (formattedDate === "2025-01-15") {
			logTest("Date formatting", "PASS", `Formatted: ${formattedDate}`);
		} else {
			logTest(
				"Date formatting",
				"FAIL",
				`Expected 2025-01-15, got ${formattedDate}`
			);
		}

		// Test day name conversion
		const dayName = sdk.getDayName(1);
		if (dayName === "Lunes") {
			logTest("Day name conversion", "PASS", `Day 1 = ${dayName}`);
		} else {
			logTest("Day name conversion", "FAIL", `Expected Lunes, got ${dayName}`);
		}
	} catch (error) {
		logTest("Utility methods", "FAIL", error.message);
	}
}

async function testErrorHandling(sdk) {
	console.log("\n🚨 Testing Error Handling...");

	try {
		// Test with invalid professional ID
		await sdk.getMonthlyAvailability("invalid-id", 2025, 1, 1, 2);
		logTest(
			"Invalid professional ID handling",
			"FAIL",
			"Should have thrown an error"
		);
	} catch (error) {
		logTest(
			"Invalid professional ID handling",
			"PASS",
			"Correctly threw error"
		);
	}

	try {
		// Test with invalid date
		await sdk.getDailyAvailability("18577092", "invalid-date", 1, 2);
		logTest("Invalid date handling", "FAIL", "Should have thrown an error");
	} catch (error) {
		logTest("Invalid date handling", "PASS", "Correctly threw error");
	}
}

async function runAllTests() {
	console.log("🚀 Starting DentalSoft SDK Automated Tests\n");
	console.log("=" + "=".repeat(50));

	const sdk = new DentalSoftSDK(TEST_CONFIG);

	// Test authentication first
	const authSuccess = await testAuthentication(sdk);

	if (authSuccess) {
		// Test all other endpoints
		const professionalId = await testProfessionals(sdk);
		await testAvailability(sdk, professionalId);
		await testAppointments(sdk);
		await testUtilities(sdk);
		await testErrorHandling(sdk);
	} else {
		logError("Authentication failed - skipping other tests");
	}

	// Print summary
	console.log("\n" + "=" + "=".repeat(50));
	console.log("📊 Test Summary");
	console.log("=" + "=".repeat(50));
	console.log(`Total tests run: ${testsRun}`);
	console.log(`✅ Tests passed: ${testsPassed}`);
	console.log(`❌ Tests failed: ${testsFailed}`);

	const successRate =
		testsRun > 0 ? ((testsPassed / testsRun) * 100).toFixed(1) : 0;
	console.log(`📈 Success rate: ${successRate}%`);

	if (testsFailed === 0) {
		console.log("\n🎉 All tests passed! SDK is working correctly.");
	} else {
		console.log(
			`\n⚠️  ${testsFailed} test(s) failed. Please check the output above.`
		);
	}

	// Exit with appropriate code
	process.exit(testsFailed > 0 ? 1 : 0);
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
	console.error("🔥 Unhandled promise rejection:", error);
	process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
	runAllTests().catch((error) => {
		console.error("🔥 Test runner error:", error);
		process.exit(1);
	});
}

module.exports = { runAllTests };
