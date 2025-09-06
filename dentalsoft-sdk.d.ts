export interface DentalSoftConfig {
  baseUrl?: string;
  clientId: string;
  clientSecret: string;
  businessRut: string | number;
}

export interface AuthResponse {
  token: string;
  expiresIn?: number;
  tokenType?: string;
  expiryDate?: Date;
}

export interface TimeSlot {
  inicio: string;
  fin: string;
  id_profesional: string;
  cod_sala: string;
  nom_sala: string;
}

export interface MonthlyAvailabilityDay {
  fecha: string;
  dia: number;
  isodow: number;
  bloques_disponibles: boolean;
}

export interface Professional {
  id_profesional: string;
  nombre_completo: string;
  rut?: string;
}

export interface Patient {
  id_paciente?: string;
  rut: string;
  nombre: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  direccion?: string;
  [key: string]: any;
}

export interface DailySlots {
  date: string;
  dayName: string;
  slots: TimeSlot[];
}

export interface Appointment {
  [key: string]: any;
}

declare class DentalSoftSDK {
  constructor(config: DentalSoftConfig);
  
  authenticate(): Promise<AuthResponse>;
  isTokenValid(): boolean;
  
  // Agenda API Methods
  getMonthlyAvailability(
    professionalId: string | number,
    year: number,
    month: number,
    branchId: string | number,
    blocks: number
  ): Promise<MonthlyAvailabilityDay[]>;
  
  getDailyAvailability(
    professionalId: string | number,
    date: string,
    branchId: string | number,
    duration: number
  ): Promise<TimeSlot[]>;
  
  getDailyAppointments(
    date: string,
    branchId: string | number
  ): Promise<Appointment[]>;
  
  // Professional API Methods
  getProfessionals(): Promise<Professional[]>;
  
  // Patient API Methods
  getPatientByRut(rut: string | number, tipoCedulaTexto?: "rut" | "dni"): Promise<Patient>;
  getPatientByCedula(cedula: string | number, tipoCedulaTexto?: "rut" | "dni"): Promise<Patient>;
  getPatientInfo(patientId: string | number, tipoCedulaTexto?: "rut" | "dni"): Promise<Patient>;
  searchPatients(searchTerm: string, tipoCedulaTexto?: "rut" | "dni"): Promise<Patient[]>;
  getPatientAppointmentHistory(patientId: string | number, branchId: string | number, limitDays?: number, maxAppointments?: number): Promise<Appointment[]>;
  
  // Utility Methods
  formatDate(year: number, month: number, day: number): string;
  formatRut(rut: string | number): string;
  normalizeRut(rut: string | number): string;
  validateRutDigit(rut: string | number): boolean;
  getDayName(isodow: number): string;
  
  // High-level convenience methods
  findAvailableSlots(
    professionalId: string | number,
    year: number,
    month: number,
    branchId: string | number,
    duration?: number
  ): Promise<DailySlots[]>;
  
  searchProfessional(rut: string | number): Promise<Professional[]>;
  searchProfessionalByRut(rut: string | number): Promise<Professional[]>;
}

export default DentalSoftSDK;