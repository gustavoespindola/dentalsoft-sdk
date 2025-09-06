class DentalSoftSDK {
	constructor(config = {}) {
		this.baseUrl = config.baseUrl || "https://api.dentalsoft.cl/external";
		this.clientId = config.clientId;
		this.clientSecret = config.clientSecret;
		this.businessRut = config.businessRut;
		this.token = null;
		this.tokenExpiry = null;
	}

	async authenticate() {
		if (!this.clientId || !this.clientSecret || !this.businessRut) {
			throw new Error(
				"Missing required configuration: clientId, clientSecret, or businessRut"
			);
		}

		try {
			const params = new URLSearchParams();
			params.append("grant_type", "client_credentials");
			params.append("client_id", this.clientId);
			params.append("client_secret", this.clientSecret);
			params.append("scope", this.businessRut);

			const response = await fetch(`${this.baseUrl}/access_token`, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: params,
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`Authentication failed: ${response.status} - ${errorText}`
				);
			}

			const data = await response.json();
			this.token = data.access_token;

			if (data.expires_in) {
				this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
			}

			return {
				token: this.token,
				expiresIn: data.expires_in,
				tokenType: data.token_type,
				expiryDate: this.tokenExpiry,
			};
		} catch (error) {
			throw new Error(`Authentication error: ${error.message}`);
		}
	}

	isTokenValid() {
		if (!this.token) return false;
		if (!this.tokenExpiry) return true;
		return new Date() < this.tokenExpiry;
	}

	async ensureAuthenticated() {
		if (!this.isTokenValid()) {
			await this.authenticate();
		}
	}

	async makeRequest(endpoint, options = {}) {
		await this.ensureAuthenticated();

		const url = `${this.baseUrl}${endpoint}`;
		const defaultHeaders = {
			Authorization: `Bearer ${this.token}`,
			"Content-Type": "application/json",
		};

		const requestOptions = {
			...options,
			headers: {
				...defaultHeaders,
				...options.headers,
			},
		};

		const response = await fetch(url, requestOptions);

		if (response.status === 401 && this.token) {
			this.token = null;
			this.tokenExpiry = null;
			await this.authenticate();

			requestOptions.headers.Authorization = `Bearer ${this.token}`;
			const retryResponse = await fetch(url, requestOptions);

			if (!retryResponse.ok) {
				const errorBody = await retryResponse.text();
				throw new Error(
					`Request failed after retry: ${retryResponse.status} - ${errorBody}`
				);
			}

			return await retryResponse.json();
		}

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(
				`Request failed: ${response.status} - ${response.statusText} - ${errorBody}`
			);
		}

		return await response.json();
	}

	// Agenda API Methods
	/**
	 * Gets the monthly availability for a professional.
	 * @param {number} professionalId - The ID of the professional.
	 * @param {number} year - The year to check.
	 * @param {number} month - The month to check.
	 * @param {number} branchId - The ID of the branch.
	 * @param {number} blocks - The number of blocks required.
	 * @returns {Promise<MonthlyAvailability[]>}
	 * @example
	 * // returns
	 * [
	 *   {
	 *     "date": "2025-10-01",
	 *     "dayOfWeek": 3,
	 *     "hasAvailableBlocks": true,
	 *     "dayName": "Miércoles"
	 *   }
	 * ]
	 */
	async getMonthlyAvailability(professionalId, year, month, branchId, blocks) {
		const endpoint = `/agenda/disponibilidad/mensual/${professionalId}/${year}/${month}/${branchId}/${blocks}`;
		const monthlyData = await this.makeRequest(endpoint);
		return Array.isArray(monthlyData)
			? monthlyData.map((day) => this.normalizeMonthlyAvailabilityFields(day))
			: [];
	}

	/**
	 * Gets the daily availability for a professional.
	 * @param {number} professionalId - The ID of the professional.
	 * @param {string} date - The date to check (YYYY-MM-DD).
	 * @param {number} branchId - The ID of the branch.
	 * @param {number} duration - The duration in blocks.
	 * @returns {Promise<DailyAvailability[]>}
	 * @example
	 * // returns
	 * [
	 *   {
	 *     "startTime": "10:00",
	 *     "endTime": "10:30",
	 *     "professionalId": 123,
	 *     "roomCode": "S1",
	 *     "roomName": "Sillón 1"
	 *   }
	 * ]
	 */
	async getDailyAvailability(professionalId, date, branchId, duration) {
		const endpoint = `/agenda/disponibilidad/diaria/${professionalId}/${date}/${branchId}/${duration}`;
		const availabilitySlots = await this.makeRequest(endpoint);
		return Array.isArray(availabilitySlots)
			? availabilitySlots.map((slot) => this.normalizeAvailabilityFields(slot))
			: [];
	}

	/**
	 * Gets all appointments for a specific day and branch.
	 * @param {string} date - The date to check (YYYY-MM-DD).
	 * @param {number} branchId - The ID of the branch.
	 * @returns {Promise<Appointment[]>}
	 */
	async getDailyAppointments(date, branchId) {
		const endpoint = `/agenda/dia_sucursal/${date}/${branchId}`;
		const appointments = await this.makeRequest(endpoint);
		return Array.isArray(appointments)
			? appointments.map((appt) => this.normalizeAppointmentFields(appt))
			: [];
	}

	/**
	 * Gets a report of effective hours.
	 * @param {string} startDate - The start date (YYYY-MM-DD).
	 * @param {string} endDate - The end date (YYYY-MM-DD).
	 * @param {object} [options] - Optional parameters.
	 * @param {number} [options.branchId] - The ID of the branch.
	 * @param {string} [options.attendance] - Filter by attendance ("asistida" or "inasistencia").
	 * @returns {Promise<any>}
	 */
	async getEffectiveHours(startDate, endDate, options = {}) {
		const { branchId, attendance } = options;
		let endpoint = `/agenda/informes/horas/efectivas/${startDate}/${endDate}`;

		const queryParams = new URLSearchParams();
		if (branchId) {
			queryParams.append("id_sucursal", branchId);
		}
		if (attendance) {
			queryParams.append("asistencia", attendance);
		}

		if (queryParams.toString()) {
			endpoint += `?${queryParams.toString()}`;
		}

		const response = await this.makeRequest(endpoint);

		if (response.data) {
			response.data = response.data.map((item) =>
				this.normalizeEffectiveHoursFields(item)
			);
		}

		return response;
	}

	/**
	 * Gets detailed information for a specific appointment.
	 * @param {number} appointmentId - The ID of the appointment.
	 * @returns {Promise<Appointment>}
	 */
	async getAppointment(appointmentId) {
		const endpoint = `/agenda/cita/${appointmentId}`;
		const appointment = await this.makeRequest(endpoint);
		return this.normalizeAppointmentFields(appointment);
	}

	/**
	 * Gets the configured duration of an appointment block.
	 * @returns {Promise<{largo: number, unidad: string}>}
	 * @example
	 * // returns
	 * {
	 *   "largo": 30,
	 *   "unidad": "minuto"
	 * }
	 */
	async getAppointmentBlockLength() {
		const endpoint = "/agenda/bloque/largo";
		return await this.makeRequest(endpoint);
	}

	/**
	 * Modifies the status of an existing appointment.
	 * @param {number} appointmentId - The ID of the appointment.
	 * @param {string} status - The new status ("confirmar" or "cancelar").
	 * @returns {Promise<any>}
	 */
	async updateAppointmentStatus(appointmentId, status) {
		const endpoint = "/agenda/cita/cambia_estado";
		const translatedData = {
			id: appointmentId,
			estado: status,
		};
		return await this.makeRequest(endpoint, {
			method: "PUT",
			body: JSON.stringify(translatedData),
		});
	}

	/**
	 * Creates a new appointment.
	 * @param {CreateAppointmentData} appointmentData - The appointment data.
	 * @returns {Promise<CreateAppointmentResponse>}
	 */
	async createAppointment(appointmentData) {
		const endpoint = "/agenda/cita";
		// Translate SDK fields to original API fields
		const translatedData = {
			sucursal: appointmentData.branchId,
			profesional: appointmentData.professionalId,
			sala: appointmentData.roomId,
			paciente: appointmentData.patientId,
			fecha: appointmentData.date,
			inicio: appointmentData.startTime,
			bloques: appointmentData.blocks,
		};
		const response = await this.makeRequest(endpoint, {
			method: "POST",
			body: JSON.stringify(translatedData),
		});
		return this.normalizeCreateAppointmentResponse(response);
	}

	// Professional API Methods
	/**
	 * Gets a list of all enabled professionals.
	 * @returns {Promise<Professional[]>}
	 */
	async getProfessionals() {
		const endpoint = "/profesional/listado";
		const professionals = await this.makeRequest(endpoint);
		return professionals.map((prof) => this.normalizeProfessionalFields(prof));
	}

	// Patient API Methods
	/**
	 * Searches for a patient by RUT.
	 * @param {string} rut - The RUT of the patient.
	 * @param {string} [documentType="rut"] - The type of document.
	 * @returns {Promise<Patient>}
	 */
	async getPatientByRut(rut, documentType = "rut") {
		const cedulaCompleta = rut.toString().replace(/\D/g, "");
		const endpoint = `/paciente/datos?cedula=${cedulaCompleta}&tipo_cedula_texto=${documentType}`;
		const patient = await this.makeRequest(endpoint);
		return this.normalizePatientFields(patient);
	}

	/**
	 * Searches for a patient by another document ID.
	 * @param {string} cedula - The document ID.
	 * @param {string} [documentType="rut"] - The type of document.
	 * @returns {Promise<Patient>}
	 */
	async getPatientByCedula(cedula, documentType = "rut") {
		const endpoint = `/paciente/datos?cedula=${cedula}&tipo_cedula_texto=${documentType}`;
		const patient = await this.makeRequest(endpoint);
		return this.normalizePatientFields(patient);
	}

	/**
	 * Searches for patients by a search term.
	 * @param {string} searchTerm - The search term.
	 * @param {string} [documentType="rut"] - The type of document.
	 * @returns {Promise<Patient[]|Patient>}
	 */
	async searchPatients(searchTerm, documentType = "rut") {
		const endpoint = `/paciente/buscar?q=${encodeURIComponent(
			searchTerm
		)}&tipo_cedula_texto=${documentType}`;
		const patients = await this.makeRequest(endpoint);
		return Array.isArray(patients)
			? patients.map((p) => this.normalizePatientFields(p))
			: this.normalizePatientFields(patients);
	}

	/**
	 * Gets a patient's appointment history.
	 * @param {number} patientId - The ID of the patient.
	 * @param {number} branchId - The ID of the branch.
	 * @param {number} [limitDays=90] - The number of days to look back.
	 * @param {number} [maxAppointments=3] - The maximum number of appointments to return.
	 * @returns {Promise<Appointment[]>}
	 */
	async getPatientAppointmentHistory(
		patientId,
		branchId,
		limitDays = 90,
		maxAppointments = 3
	) {
		const appointments = [];
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(endDate.getDate() - limitDays);

		let currentDate = new Date(endDate);
		let checkedDays = 0;
		const maxDaysToCheck = Math.min(limitDays, 60);

		while (
			currentDate >= startDate &&
			appointments.length < maxAppointments &&
			checkedDays < maxDaysToCheck
		) {
			const dateString = this.formatDate(
				currentDate.getFullYear(),
				currentDate.getMonth() + 1,
				currentDate.getDate()
			);

			try {
				const dailyAppointments = await this.getDailyAppointments(
					dateString,
					branchId
				);

				const patientAppointments = dailyAppointments.filter(
					(appointment) => appointment.patientId == patientId
				);

				if (patientAppointments.length > 0) {
					appointments.push(...patientAppointments);
					if (appointments.length >= maxAppointments) {
						break;
					}
				}
			} catch (error) {
				if (error.message && !error.message.includes("404")) {
					console.error(
						`Error fetching appointments for ${dateString}: ${error.message}`
					);
				}
			}

			currentDate.setDate(currentDate.getDate() - 1);
			checkedDays++;
		}

		return appointments
			.sort((a, b) => new Date(b.date) - new Date(a.date))
			.slice(0, maxAppointments);
	}

	// Utility Methods
	formatDate(year, month, day) {
		const paddedMonth = month.toString().padStart(2, "0");
		const paddedDay = day.toString().padStart(2, "0");
		return `${year}-${paddedMonth}-${paddedDay}`;
	}

	formatRut(rut) {
		const rutLimpio = rut.toString().replace(/[^0-9kK]/gi, "");
		if (rutLimpio.length < 2) return rut;
		const cuerpo = rutLimpio.slice(0, -1);
		const dv = rutLimpio.slice(-1).toLowerCase();
		const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
		return `${cuerpoFormateado}-${dv}`;
	}

	normalizeRut(rut) {
		return rut.toString().replace(/[.\-\s]/g, "");
	}

	validateRutDigit(rut) {
		const rutClean = this.normalizeRut(rut);
		if (rutClean.length < 2) return false;
		const body = rutClean.slice(0, -1);
		const dv = rutClean.slice(-1).toLowerCase();
		let sum = 0;
		let multiplier = 2;
		for (let i = body.length - 1; i >= 0; i--) {
			sum += parseInt(body[i]) * multiplier;
			multiplier = multiplier < 7 ? multiplier + 1 : 2;
		}
		const remainder = sum % 11;
		const expectedDv =
			remainder < 2
				? remainder.toString()
				: remainder === 10
				? "k"
				: (11 - remainder).toString();
		return dv === expectedDv;
	}

	getDayName(isodow) {
		const days = {
			1: "Lunes",
			2: "Martes",
			3: "Miércoles",
			4: "Jueves",
			5: "Viernes",
			6: "Sábado",
			7: "Domingo",
		};
		return days[isodow] || "Unknown";
	}

	// High-level convenience methods
	async findAvailableSlots(
		professionalId,
		year,
		month,
		branchId,
		duration = 2
	) {
		const monthlyData = await this.getMonthlyAvailability(
			professionalId,
			year,
			month,
			branchId,
			duration
		);
		const availableDays = monthlyData.filter((day) => day.hasAvailableBlocks);

		const slotsPromises = availableDays.map(async (day) => {
			const daySlots = await this.getDailyAvailability(
				professionalId,
				day.date,
				branchId,
				duration
			);
			return {
				date: day.date,
				dayName: this.getDayName(day.dayOfWeek),
				slots: daySlots,
			};
		});

		return await Promise.all(slotsPromises);
	}

	/**
	 * Searches for a professional by RUT.
	 * @param {string} rut - The RUT of the professional.
	 * @returns {Promise<Professional[]>}
	 */
	async searchProfessionalByRut(rut) {
		if (!this.validateRutDigit(rut)) {
			throw new Error(`RUT inválido: ${rut}. Verificar dígito verificador.`);
		}
		const normalizedSearchRut = this.normalizeRut(rut);
		const professionals = await this.getProfessionals();
		return professionals.filter((prof) => {
			if (!prof.rut) return false;
			const normalizedProfRut = this.normalizeRut(prof.rut);
			return normalizedProfRut === normalizedSearchRut;
		});
	}

	async searchProfessional(rut) {
		return await this.searchProfessionalByRut(rut);
	}

	/**
	 * Searches for a professional by ID.
	 * @param {number|string} professionalId - The ID of the professional.
	 * @returns {Promise<Professional|undefined>}
	 */
	async searchProfessionalById(professionalId) {
		const professionals = await this.getProfessionals();
		const normalizedId = professionalId.toString();
		return professionals.find(
			(prof) => prof.professionalId.toString() === normalizedId
		);
	}

	/**
	 * Gets budget report data.
	 * @param {string} startDate - The start date (YYYY-MM-DD).
	 * @param {string} endDate - The end date (YYYY-MM-DD).
	 * @param {object} [options] - Optional parameters.
	 * @param {number} [options.branchId] - The ID of the branch.
	 * @returns {Promise<any>}
	 */
	async getBudgetReport(startDate, endDate, options = {}) {
		const { branchId } = options;
		let endpoint = `/presupuesto/informes/datos/gestion/${startDate}/${endDate}`;
		if (branchId) {
			endpoint += `?id_sucursal=${branchId}`;
		}
		return await this.makeRequest(endpoint);
	}

	/**
	 * Gets a detailed income report.
	 * @param {string} startDate - The start date (YYYY-MM-DD).
	 * @param {string} endDate - The end date (YYYY-MM-DD).
	 * @param {object} [options] - Optional parameters.
	 * @param {number} [options.branchId] - The ID of the branch.
	 * @returns {Promise<any>}
	 */
	async getPaymentReport(startDate, endDate, options = {}) {
		const { branchId } = options;
		let endpoint = `/pago/informes/ingreso/detallado/${startDate}/${endDate}`;
		if (branchId) {
			endpoint += `?id_sucursal=${branchId}`;
		}
		return await this.makeRequest(endpoint);
	}

	/**
	 * Gets a list of all available branches.
	 * @returns {Promise<Branch[]>}
	 */
	async getBranches() {
		const endpoint = "/sucursal/listado";
		const branches = await this.makeRequest(endpoint);
		return Array.isArray(branches)
			? branches.map((branch) => this.normalizeBranchFields(branch))
			: [];
	}

	/**
	 * Creates a new patient.
	 * @param {CreatePatientData} patientData - The patient data.
	 * @returns {Promise<CreatePatientResponse>}
	 */
	async createPatient(patientData) {
		const endpoint = "/paciente/nuevo";
		const translatedData = {
			cedula: patientData.documentId,
			tipo_cedula_texto: patientData.documentType,
			nombre: patientData.name,
			apellido_paterno: patientData.lastName,
			apellido_materno: patientData.secondLastName,
			email: patientData.email,
			celular: patientData.mobilePhone,
			id_referencia: patientData.referenceId,
		};
		const response = await this.makeRequest(endpoint, {
			method: "POST",
			body: JSON.stringify(translatedData),
		});
		return this.normalizeCreatePatientResponse(response);
	}

	// Utility methods for field normalization
	normalizeProfessionalFields(professional) {
		if (!professional) return professional;
		return {
			professionalId: professional.id_profesional,
			fullName: professional.nombre_completo,
		};
	}

	normalizePatientFields(patient) {
		if (!patient) return patient;
		return {
			patientId: patient.id_paciente || patient.id,
			fullName: patient.nombre_completo || patient.nombre,
			rut: patient.cedula,
			phone: patient.celular || patient.telefono,
			email: patient.email || patient.correo,
			gender: patient.sexo,
			birthDate: patient.fecha_nacimiento,
			documentType: patient.tipo_cedula,
			status: patient.estado,
		};
	}

	normalizeCreatePatientResponse(response) {
		if (!response) return response;
		return {
			message: response.mensaje,
			patientId: response.paciente,
		};
	}

	normalizeAppointmentFields(appointment) {
		if (!appointment) return appointment;
		const startTime = appointment.inicio || appointment.hora_inicio;
		const blocks = appointment.bloques;
		let endTime = appointment.hora_fin;

		if (startTime && blocks && !endTime) {
			const [hours, minutes] = startTime.split(":").map(Number);
			const startMinutes = hours * 60 + minutes;
			const endMinutes = startMinutes + blocks * 30;
			const endHours = Math.floor(endMinutes / 60);
			const endMins = endMinutes % 60;
			endTime = `${endHours.toString().padStart(2, "0")}:${endMins
				.toString()
				.padStart(2, "0")}`;
		}

		return {
			appointmentId: appointment.id_cita || appointment.id,
			patientId: appointment.id_paciente,
			professionalId: appointment.id_profesional,
			branchId: appointment.id_sucursal,
			roomId: appointment.id_sala,
			startTime: startTime,
			endTime: endTime,
			date: appointment.fecha,
			blocks: blocks,
			durationInMinutes: blocks ? blocks * 30 : null,
			statusId: appointment.estado,
			statusText: appointment.estado_texto,
			isConfirmable: appointment.confirmable,
			notes: appointment.observaciones || appointment.notas,
			patient: appointment.paciente
				? this.normalizePatientFields(appointment.paciente)
				: null,
			room: appointment.sala
				? this.normalizeRoomFields(appointment.sala)
				: null,
		};
	}

	async getDailyAppointmentsWithProfessionals(date, branchId) {
		const appointments = await this.getDailyAppointments(date, branchId);
		const professionals = await this.getProfessionals();
		const professionalMap = new Map(
			professionals.map((p) => [p.professionalId, p])
		);
		return appointments.map((appointment) => ({
			...appointment,
			professional: professionalMap.get(appointment.professionalId) || null,
		}));
	}

	normalizeAvailabilityFields(slot) {
		if (!slot) return slot;
		return {
			startTime: slot.inicio,
			endTime: slot.fin,
			professionalId: slot.id_profesional,
			roomCode: slot.cod_sala,
			roomName: slot.nom_sala,
		};
	}

	normalizeMonthlyAvailabilityFields(day) {
		if (!day) return day;
		return {
			date: day.fecha,
			dayOfWeek: day.isodow,
			hasAvailableBlocks: day.bloques_disponibles,
			dayName: this.getDayName(day.isodow),
		};
	}

	normalizeRoomFields(room) {
		if (!room) return room;
		return {
			roomId: room.id_sala || room.id,
			name: room.nom_sala || room.nombre,
			code: room.cod_sala || room.codigo,
		};
	}

	normalizeEffectiveHoursFields(item) {
		if (!item) return item;
		return {
			appointmentId: item.id_cita,
			appointmentDate: item.fecha_cita,
			appointmentTime: item.hora_cita,
			appointmentBlocks: item.bloques_cita,
			roomName: item.nombre_sala,
			branchId: item.id_sucursal,
			isBlock: item.es_bloqueo,
			branchName: item.nombre_sucursal,
			roomLocation: item.ubicacion_sala,
			appointmentStatusId: item.id_estado_cita,
			attentionTypeId: item.id_tipo_atencion,
			attentionType: item.tipo_atencion,
			arrivalTime: item.hora_llegada,
			waitingListEntryTime: item.hora_ingreso_lista_espera,
			waitingTime: item.tiempo_espera,
			dischargeTime: item.hora_alta,
			timeInBox: item.tiempo_en_box,
			attendance: item.asistencia,
			nextAppointmentDate: item.fecha_proxima_cita,
			nextAppointmentTime: item.hora_proxima_cita,
			desiredDate: item.fecha_deseada,
			isDeleted: item.eliminada,
			webReservationReason: item.motivo_consulta_reserva_web,
			webReservationPayment: item.valor_pago_reserva_web,
			webReservationPaymentStatus: item.estado_pago_reserva_web,
			professionalNumericId: item.identificador_numerico_profesional,
			professionalVerificationDigit: item.digito_verificador_profesional,
			professionalName: item.nombre_profesional,
			professionalLastName: item.apellido_paterno_profesional,
			professionalMothersLastName: item.apellido_materno_profesional,
			patientId: item.id_paciente,
			patientName: item.nombre_paciente,
			patientLastName: item.apellido_paterno_paciente,
			patientMothersLastName: item.apellido_materno_paciente,
			patientBirthDate: item.fecha_nacimiento_paciente,
			patientInsurance: item.prevision_paciente,
			patientGender: item.sexo_paciente,
			patientEmail: item.mail_paciente,
			patientAddress1: item.direccion1_paciente,
			patientAddress2: item.direccion2_paciente,
			patientCountryCode: item.codigo_pais_paciente,
			patientCommune: item.comuna_paciente,
			patientHomePhone: item.telefono_casa_paciente,
			patientMobilePhone: item.telefono_movil_paciente,
			patientIdType: item.tipo_identificador_paciente,
			patientIdentifier: item.identificador_paciente,
			patientAgreementId: item.id_convenio_paciente,
			patientAgreement: item.convenio_paciente,
			patientReference: item.referencia_paciente,
			creationDate: item.fecha_creacion,
			creationUserId: item.id_usuario_creacion,
			creationUserType: item.tipo_usuario_creacion,
			appointmentStatus: item.estado_cita,
			creationUserName: item.nombre_usuario_creacion,
			creationUserLastName: item.apellido_paterno_usuario_creacion,
			creationUserMothersLastName: item.apellido_materno_usuario_creacion,
		};
	}

	normalizeCreateAppointmentResponse(response) {
		if (!response) return response;
		return {
			message: response.mensaje,
			appointmentId: response.id_cita,
		};
	}

	normalizeBranchFields(branch) {
		if (!branch) return branch;
		return {
			branchId: branch.id,
			name: branch.nombre,
			phone: branch.telefono,
			address: branch.direccion,
			status: branch.estado,
			statusText: branch.estado_texto,
		};
	}
}

module.exports = DentalSoftSDK;
