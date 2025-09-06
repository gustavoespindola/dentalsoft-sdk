// dentalsoft-sdk.d.ts

// ============================================================================
//   ANTES: Definiciones basadas en la API Original de Dentalsoft
// ============================================================================

/**
 * @deprecated Utilizar DentalSoftConfigV2 en su lugar.
 */
export interface DentalSoftConfig {
	baseUrl?: string;
	clientId: string;
	clientSecret: string;
	scope: string | number; // En la API original, 'scope' es el ID de la clínica
}

/**
 * @deprecated Utilizar AuthResponseV2 en su lugar.
 */
export interface AuthResponse {
	token_type: string;
	expires_in: string;
	access_token: string;
}

/**
 * @deprecated Utilizar AppointmentV2 en su lugar.
 */
export interface Cita {
	id: number;
	fecha: string;
	id_paciente: number;
	id_sucursal: number;
	inicio: string;
	bloques: number;
	estado: number;
	estado_texto: string;
	id_sala: number;
	paciente: any; // Puede ser un objeto o nulo
	sala: {
		id: number;
		nombre: string;
	};
	confirmable: boolean;
}

/**
 * @deprecated Utilizar ProfessionalV2 en su lugar.
 */
export interface Profesional {
	id_profesional: number;
	nombre_completo: string;
}

/**
 * @deprecated Utilizar PatientV2 en su lugar.
 */
export interface Paciente {
	id: number;
	cedula: string;
	tipo_cedula: number;
	celular: string | null;
	sexo: string | null;
	fecha_nacimiento: string | null;
	estado: number;
	nombre: string;
	email: string;
}

/**
 * @deprecated Utilizar BranchV2 en su lugar.
 */
export interface Sucursal {
	id: number;
	nombre: string;
	telefono: string;
	direccion: string;
	estado: number;
	estado_texto: string;
}

// ============================================================================
//   DESPUÉS: Definiciones Mejoradas y Estandarizadas para el SDK
// ============================================================================

export interface SdkConfig {
	baseUrl?: string;
	clientId: string;
	clientSecret: string;
	clinicId: string | number;
}

export interface SdkAuthResponse {
	tokenType: string;
	expiresIn: number;
	accessToken: string;
}

export interface Appointment {
	appointmentId: number;
	date: string;
	patientId: number;
	branchId: number;
	startTime: string;
	blocks: number;
	statusId: number;
	statusText: string;
	roomId: number;
	patient: any; // Debería ser de tipo Patient si se expande
	room: {
		roomId: number;
		name: string;
	};
	isConfirmable: boolean;
}

export interface Professional {
	professionalId: number;
	fullName: string;
}

export interface Patient {
	patientId: number;
	documentId: string;
	documentType: number;
	mobilePhone: string | null;
	gender: string | null;
	birthDate: string | null;
	status: number;
	name: string;
	email: string;
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

	// Métodos de la API con nombres y parámetros estandarizados
	getAppointment(appointmentId: number): Promise<Appointment>;
	getMonthlyAvailability(
		professionalId: number,
		year: number,
		month: number,
		branchId: number,
		blocks: number
	): Promise<any[]>;
	getDailyAvailability(
		professionalId: number,
		date: string,
		branchId: number,
		duration: number
	): Promise<any[]>;
	createAppointment(data: {
		branchId: number;
		professionalId: number;
		roomId: number;
		patientId: number;
		date: string;
		startTime: string;
		blocks: number;
	}): Promise<{ appointmentId: string }>;

	getProfessionals(): Promise<Professional[]>;
	getPatient(documentId: string, documentType: "rut" | "dni"): Promise<Patient>;
	createPatient(data: {
		documentId: string;
		documentType: "rut" | "dni";
		name: string;
		lastName: string;
		secondLastName?: string;
		email: string;
		mobilePhone: string;
	}): Promise<{ patientId: number }>;

	getBranches(): Promise<Branch[]>;
}

export default DentalSoftSDK;
