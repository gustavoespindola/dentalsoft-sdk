// dentalsoft-sdk.refactored.d.ts

export interface SdkConfig {
	baseUrl?: string;
	clientId: string;
	clientSecret: string;
	businessRut: string;
}

export interface SdkAuthResponse {
	token: string;
	expiresIn: number;
	tokenType: string;
	expiryDate: Date;
}

export interface MonthlyAvailability {
	date: string;
	dayOfWeek: number;
	hasAvailableBlocks: boolean;
	dayName: string;
}

export interface DailyAvailability {
	startTime: string;
	endTime: string;
	professionalId: number;
	roomCode: string;
	roomName: string;
}

export interface Appointment {
	appointmentId: number;
	patientId: number;
	professionalId: number;
	branchId: number;
	roomId: number;
	startTime: string;
	endTime: string;
	date: string;
	blocks: number;
	durationInMinutes: number | null;
	statusId: number;
	statusText: string;
	isConfirmable: boolean;
	notes: string;
	patient: Patient | null;
	room: Room | null;
}

export interface Professional {
	professionalId: number;
	fullName: string;
	rut: string;
}

export interface Patient {
	patientId: number;
	fullName: string;
	rut: string;
	phone: string;
	email: string;
	gender: string;
	birthDate: string;
	documentType: number;
	status: number;
}

export interface Room {
	roomId: number;
	name: string;
	code: string;
}

export interface EffectiveHours {
	appointmentId: number;
	appointmentDate: string;
	appointmentTime: string;
	appointmentBlocks: number;
	roomName: string;
	branchId: number;
	isBlock: boolean;
	branchName: string;
	roomLocation: string;
	appointmentStatusId: number;
	attentionTypeId: number;
	attentionType: string;
	arrivalTime: string;
	waitingListEntryTime: string;
	waitingTime: string;
	dischargeTime: string;
	timeInBox: string;
	attendance: string;
	nextAppointmentDate: string;
	nextAppointmentTime: string;
	desiredDate: string;
	isDeleted: boolean;
	webReservationReason: string;
	webReservationPayment: string;
	webReservationPaymentStatus: string;
	professionalNumericId: number;
	professionalVerificationDigit: string;
	professionalName: string;
	professionalLastName: string;
	professionalMothersLastName: string;
	patientId: number;
	patientName: string;
	patientLastName: string;
	patientMothersLastName: string;
	patientBirthDate: string;
	patientInsurance: string;
	patientGender: string;
	patientEmail: string;
	patientAddress1: string;
	patientAddress2: string;
	patientCountryCode: string;
	patientCommune: string;
	patientHomePhone: string;
	patientMobilePhone: string;
	patientIdType: number;
	patientIdentifier: string;
	patientAgreementId: number;
	patientAgreement: string;
	patientReference: string;
	creationDate: string;
	creationUserId: number;
	creationUserType: string;
	appointmentStatus: string;
	creationUserName: string;
	creationUserLastName: string;
	creationUserMothersLastName: string;
}

export interface CreateAppointmentData {
	branchId: number;
	professionalId: number;
	roomId: number;
	patientId: number;
	date: string;
	startTime: string;
	blocks: number;
}

export interface CreateAppointmentResponse {
	message: string;
	appointmentId: number;
}

export interface CreatePatientData {
	documentId: string;
	documentType: "rut" | "dni";
	name: string;
	lastName: string;
	secondLastName?: string;
	email: string;
	mobilePhone: string;
	referenceId?: number;
}

export interface CreatePatientResponse {
	message: string;
	patientId: number;
}

export interface Branch {
	branchId: number;
	name: string;
	phone: string;
	address: string;
	status: number;
	statusText: string;
}

declare class DentalSoftSDK {
	constructor(config: SdkConfig);

	authenticate(): Promise<SdkAuthResponse>;

	getMonthlyAvailability(
		professionalId: number,
		year: number,
		month: number,
		branchId: number,
		blocks: number
	): Promise<MonthlyAvailability[]>;

	getDailyAvailability(
		professionalId: number,
		date: string,
		branchId: number,
		duration: number
	): Promise<DailyAvailability[]>;

	getDailyAppointments(date: string, branchId: number): Promise<Appointment[]>;

	getEffectiveHours(
		startDate: string,
		endDate: string,
		options?: { branchId?: number; attendance?: string }
	): Promise<{ data: EffectiveHours[] }>;

	getAppointment(appointmentId: number): Promise<Appointment>;

	getAppointmentBlockLength(): Promise<{ largo: number; unidad: string }>;

	updateAppointmentStatus(
		appointmentId: number,
		status: "confirmar" | "cancelar"
	): Promise<{ mensaje: string; id: number }>;

	createAppointment(
		appointmentData: CreateAppointmentData
	): Promise<CreateAppointmentResponse>;

	createPatient(patientData: CreatePatientData): Promise<CreatePatientResponse>;

	getProfessionals(): Promise<Professional[]>;

	getPatientByRut(rut: string, documentType?: string): Promise<Patient>;

	getPatientByCedula(cedula: string, documentType?: string): Promise<Patient>;

	getPatientInfo(patientId: number, documentType?: string): Promise<Patient>;

	searchPatients(
		searchTerm: string,
		documentType?: string
	): Promise<Patient[] | Patient>;

	getPatientAppointmentHistory(
		patientId: number,
		branchId: number,
		limitDays?: number,
		maxAppointments?: number
	): Promise<Appointment[]>;

	findAvailableSlots(
		professionalId: number,
		year: number,
		month: number,
		branchId: number,
		duration?: number
	): Promise<{ date: string; dayName: string; slots: DailyAvailability[] }[]>;

	searchProfessionalByRut(rut: string): Promise<Professional[]>;

	searchProfessionalById(
		professionalId: number | string
	): Promise<Professional | undefined>;

	searchProfessional(rut: string): Promise<Professional[]>;

	getDailyAppointmentsWithProfessionals(
		date: string,
		branchId: number
	): Promise<Appointment[]>;

	getBudgetReport(
		startDate: string,
		endDate: string,
		options?: { branchId?: number }
	): Promise<any>;

	getPaymentReport(
		startDate: string,
		endDate: string,
		options?: { branchId?: number }
	): Promise<any>;

	getBranches(): Promise<Branch[]>;
}

export default DentalSoftSDK;
