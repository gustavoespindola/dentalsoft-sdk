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
	async getMonthlyAvailability(professionalId, year, month, branchId, blocks) {
		// Normalize professional ID to handle both string and number
		const normalizedId = this.normalizeProfessionalId(professionalId);
		const endpoint = `/agenda/disponibilidad/mensual/${normalizedId}/${year}/${month}/${branchId}/${blocks}`;
		const monthlyData = await this.makeRequest(endpoint);

		// Normalize field names for consistency
		return Array.isArray(monthlyData)
			? monthlyData.map((day) => this.normalizeMonthlyAvailabilityFields(day))
			: [];
	}

	async getDailyAvailability(professionalId, date, branchId, duration) {
		// Normalize professional ID to handle both string and number
		const normalizedId = this.normalizeProfessionalId(professionalId);
		const endpoint = `/agenda/disponibilidad/diaria/${normalizedId}/${date}/${branchId}/${duration}`;
		const availabilitySlots = await this.makeRequest(endpoint);

		// Normalize field names for consistency
		return Array.isArray(availabilitySlots)
			? availabilitySlots.map((slot) => this.normalizeAvailabilityFields(slot))
			: [];
	}

	async getDailyAppointments(date, branchId) {
		const endpoint = `/agenda/dia_sucursal/${date}/${branchId}`;
		const appointments = await this.makeRequest(endpoint);

		// Normalize field names for consistency
		return Array.isArray(appointments)
			? appointments.map((appt) => this.normalizeAppointmentFields(appt))
			: [];
	}

	async getEffectiveHours(fecha_desde, fecha_hasta, options = {}) {
		const { id_sucursal, asistencia } = options;
		let endpoint = `/agenda/informes/horas/efectivas/${fecha_desde}/${fecha_hasta}`;

		const queryParams = new URLSearchParams();
		if (id_sucursal) {
			queryParams.append("id_sucursal", id_sucursal);
		}
		if (asistencia) {
			queryParams.append("asistencia", asistencia);
		}

		if (queryParams.toString()) {
			endpoint += `?${queryParams.toString()}`;
		}

		const response = await this.makeRequest(endpoint);

		// Normalize the response data
		if (response.data) {
			response.data = response.data.map((item) =>
				this.normalizeEffectiveHoursFields(item)
			);
		}

		return response;
	}

	async createAppointment(appointmentData) {
		const endpoint = "/agenda/cita";
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
	async getProfessionals() {
		const endpoint = "/profesional/listado";
		const professionals = await this.makeRequest(endpoint);

		// Normalize field names for consistency
		return professionals.map((prof) => ({
			...prof,
			id: prof.id_profesional || prof.id,
			professionalId: prof.id_profesional || prof.professionalId,
			name: prof.nombre_completo || prof.name,
			fullName: prof.nombre_completo || prof.fullName,
			// Keep original fields as fallback
			id_profesional: prof.id_profesional,
			nombre_completo: prof.nombre_completo,
		}));
	}

	// Patient API Methods (endpoint correcto confirmado)
	async getPatientByRut(rut, tipoCedulaTexto = "rut") {
		// IMPORTANTE: La API requiere el RUT COMPLETO con dígito verificador
		const cedulaCompleta = rut.toString().replace(/\D/g, ""); // Solo quitar puntos y guion, mantener DV
		const endpoint = `/paciente/datos?cedula=${cedulaCompleta}&tipo_cedula_texto=${tipoCedulaTexto}`;
		const patient = await this.makeRequest(endpoint);

		// Normalize field names for consistency
		return this.normalizePatientFields(patient);
	}

	async getPatientByCedula(cedula, tipoCedulaTexto = "rut") {
		const endpoint = `/paciente/datos?cedula=${cedula}&tipo_cedula_texto=${tipoCedulaTexto}`;
		const patient = await this.makeRequest(endpoint);
		return this.normalizePatientFields(patient);
	}

	async getPatientInfo(patientId, tipoCedulaTexto = "rut") {
		const endpoint = `/paciente/info/${patientId}?tipo_cedula_texto=${tipoCedulaTexto}`;
		const patient = await this.makeRequest(endpoint);
		return this.normalizePatientFields(patient);
	}

	async searchPatients(searchTerm, tipoCedulaTexto = "rut") {
		const endpoint = `/paciente/buscar?q=${encodeURIComponent(
			searchTerm
		)}&tipo_cedula_texto=${tipoCedulaTexto}`;
		const patients = await this.makeRequest(endpoint);
		return Array.isArray(patients)
			? patients.map((p) => this.normalizePatientFields(p))
			: this.normalizePatientFields(patients);
	}

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

		// Optimización: buscar hacia atrás desde la fecha actual
		// y parar cuando encontremos suficientes citas o hayamos buscado suficiente
		let currentDate = new Date(endDate);
		let checkedDays = 0;
		const maxDaysToCheck = Math.min(limitDays, 60); // Limitar a máximo 2 meses para evitar timeouts

		console.log(
			`🔍 Buscando citas desde ${this.formatDate(
				currentDate.getFullYear(),
				currentDate.getMonth() + 1,
				currentDate.getDate()
			)} hacia atrás...`
		);

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

				// Filtrar citas del paciente específico
				const patientAppointments = dailyAppointments.filter(
					(appointment) =>
						(appointment.id_paciente || appointment.patientId) == patientId
				);

				if (patientAppointments.length > 0) {
					console.log(
						`   ✅ ${patientAppointments.length} cita(s) encontrada(s) en ${dateString}`
					);
					appointments.push(...patientAppointments);

					// Si ya tenemos suficientes citas, podemos parar
					if (appointments.length >= maxAppointments) {
						console.log(
							`   🎯 Se alcanzó el límite de ${maxAppointments} citas`
						);
						break;
					}
				}
			} catch (error) {
				// Continuar con la siguiente fecha si hay error (silenciosamente para no saturar logs)
				if (error.message && !error.message.includes("404")) {
					console.log(`   ⚠️ Error en ${dateString}: ${error.message}`);
				}
			}

			currentDate.setDate(currentDate.getDate() - 1);
			checkedDays++;

			// Pausa pequeña para no saturar la API
			if (checkedDays % 10 === 0) {
				console.log(
					`   📊 Revisados ${checkedDays} días, ${appointments.length} citas encontradas...`
				);
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		}

		console.log(
			`📈 Búsqueda completada: ${appointments.length} citas en ${checkedDays} días revisados`
		);

		// Ordenar por fecha más reciente primero y limitar al número máximo
		return appointments
			.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
			.slice(0, maxAppointments);
	}

	// Utility Methods
	formatDate(year, month, day) {
		const paddedMonth = month.toString().padStart(2, "0");
		const paddedDay = day.toString().padStart(2, "0");
		return `${year}-${paddedMonth}-${paddedDay}`;
	}

	formatRut(rut) {
		// Keep only digits and 'k/K' for check digit
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
		const normalizedId = this.normalizeProfessionalId(professionalId);
		const monthlyData = await this.getMonthlyAvailability(
			normalizedId,
			year,
			month,
			branchId,
			duration
		);
		const availableDays = monthlyData.filter((day) => day.bloques_disponibles);

		const slotsPromises = availableDays.map(async (day) => {
			const daySlots = await this.getDailyAvailability(
				normalizedId,
				day.fecha,
				branchId,
				duration
			);
			return {
				date: day.fecha,
				dayName: this.getDayName(day.isodow),
				slots: daySlots,
			};
		});

		return await Promise.all(slotsPromises);
	}

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

	// Utility methods for field normalization
	normalizePatientFields(patient) {
		if (!patient) return patient;

		return {
			...patient,
			// Normalized field names
			id: patient.id_paciente || patient.id,
			patientId: patient.id_paciente || patient.patientId,
			name: patient.nombre_completo || patient.nombre || patient.name,
			fullName: patient.nombre_completo || patient.fullName,
			rut: patient.cedula || patient.rut,
			phone: patient.celular || patient.telefono || patient.phone,
			email: patient.email || patient.correo,
			gender: patient.sexo || patient.gender,
			birthDate: patient.fecha_nacimiento || patient.birthDate,
			documentType: patient.tipo_cedula || patient.documentType,
			status: patient.estado || patient.status,
			// Keep original fields as fallback
			id_paciente: patient.id_paciente,
			nombre_completo: patient.nombre_completo || patient.nombre,
			cedula: patient.cedula,
			celular: patient.celular,
			sexo: patient.sexo,
			fecha_nacimiento: patient.fecha_nacimiento,
			tipo_cedula: patient.tipo_cedula,
			estado: patient.estado,
			correo: patient.email,
		};
	}

	normalizeAppointmentFields(appointment) {
		if (!appointment) return appointment;

		// Calculate end time from start time and blocks (assuming 30 min per block)
		let endTime = null;
		const startTime =
			appointment.inicio || appointment.hora_inicio || appointment.startTime;
		const blocks = appointment.bloques || appointment.blocks;

		if (startTime && blocks) {
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
			...appointment,
			// Normalized field names
			id: appointment.id_cita || appointment.id,
			appointmentId:
				appointment.id_cita || appointment.id || appointment.appointmentId,
			patientId: appointment.id_paciente || appointment.patientId,
			professionalId: appointment.id_profesional || appointment.professionalId,
			branchId: appointment.id_sucursal || appointment.branchId,
			roomId: appointment.id_sala || appointment.roomId,
			startTime: startTime,
			endTime: endTime || appointment.hora_fin || appointment.endTime,
			date: appointment.fecha || appointment.date,
			blocks: blocks,
			duration: blocks ? blocks * 30 : null, // Duration in minutes
			status: appointment.estado || appointment.status,
			statusText: appointment.estado_texto || appointment.statusText,
			confirmable:
				appointment.confirmable !== undefined ? appointment.confirmable : null,
			notes:
				appointment.observaciones || appointment.notas || appointment.notes,
			// Normalized nested data
			patient: appointment.paciente
				? this.normalizePatientFields(appointment.paciente)
				: null,
			room: appointment.sala
				? this.normalizeRoomFields(appointment.sala)
				: null,
			// Keep original fields as fallback
			id_cita: appointment.id_cita || appointment.id,
			id_paciente: appointment.id_paciente,
			id_profesional: appointment.id_profesional,
			id_sucursal: appointment.id_sucursal,
			id_sala: appointment.id_sala,
			inicio: appointment.inicio,
			bloques: appointment.bloques,
			estado: appointment.estado,
			estado_texto: appointment.estado_texto,
			hora_inicio: startTime,
			hora_fin: endTime || appointment.hora_fin,
			fecha: appointment.fecha,
			observaciones: appointment.observaciones,
			// Additional nested data (original)
			paciente: appointment.paciente,
			sala: appointment.sala,
		};
	}

	// Helper method to normalize professional ID
	normalizeProfessionalId(professionalId) {
		// Convert to string to handle both string and number inputs consistently
		return professionalId.toString();
	}

	// Helper method to find professional by ID with flexible matching
	findProfessionalById(professionals, targetId) {
		const normalizedTargetId = this.normalizeProfessionalId(targetId);

		return professionals.find((prof) => {
			const profId = prof.id || prof.id_profesional;
			const normalizedProfId = this.normalizeProfessionalId(profId);
			return normalizedProfId === normalizedTargetId;
		});
	}

	// Enhanced method to get daily appointments with professional information
	async getDailyAppointmentsWithProfessionals(date, branchId) {
		const appointments = await this.getDailyAppointments(date, branchId);
		const professionals = await this.getProfessionals();

		// For each appointment, try to find the professional by checking availability
		const enhancedAppointments = await Promise.all(
			appointments.map(async (appointment) => {
				let assignedProfessional = null;

				// Try to find which professional has this time slot booked
				for (const professional of professionals) {
					try {
						const profId = professional.id || professional.id_profesional;
						const dailySlots = await this.getDailyAvailability(
							profId,
							date,
							branchId,
							1
						);

						// If professional has no availability at this time, they might be booked
						if (!dailySlots || dailySlots.length === 0) {
							continue;
						}

						// Check if the appointment time conflicts with available slots
						const appointmentStart = appointment.startTime;
						if (appointmentStart) {
							const hasConflict = !dailySlots.some(
								(slot) =>
									(slot.startTime || slot.hora_inicio) <= appointmentStart &&
									appointmentStart < (slot.endTime || slot.hora_fin)
							);

							if (hasConflict) {
								// This professional is likely booked at this time
								assignedProfessional = professional;
								break;
							}
						}
					} catch (error) {
						// Continue with next professional if there's an error
						continue;
					}
				}

				return {
					...appointment,
					professional: assignedProfessional,
					professionalName:
						assignedProfessional?.name ||
						assignedProfessional?.nombre_completo ||
						"Unknown",
					professionalId:
						assignedProfessional?.id ||
						assignedProfessional?.id_profesional ||
						null,
				};
			})
		);

		return enhancedAppointments;
	}

	// Helper method to normalize availability slot fields
	normalizeAvailabilityFields(slot) {
		if (!slot) return slot;

		return {
			...slot,
			// Normalized field names
			id: slot.id || slot.id_profesional,
			startTime: slot.inicio || slot.startTime,
			endTime: slot.fin || slot.endTime,
			professionalId: slot.id_profesional || slot.professionalId,
			roomCode: slot.cod_sala || slot.roomCode,
			roomName: slot.nom_sala || slot.roomName,
			// Keep original fields as fallback
			inicio: slot.inicio,
			fin: slot.fin,
			id_profesional: slot.id_profesional,
			cod_sala: slot.cod_sala,
			nom_sala: slot.nom_sala,
			// Legacy compatibility
			hora_inicio: slot.inicio || slot.hora_inicio,
			hora_fin: slot.fin || slot.hora_fin,
		};
	}

	// Helper method to normalize monthly availability fields
	normalizeMonthlyAvailabilityFields(day) {
		if (!day) return day;

		return {
			...day,
			// Normalized field names
			date: day.fecha || day.date,
			dayOfWeek: day.isodow || day.dayOfWeek,
			availableBlocks: day.bloques_disponibles || day.availableBlocks,
			dayName: this.getDayName(day.isodow) || day.dayName,
			// Keep original fields as fallback
			fecha: day.fecha,
			isodow: day.isodow,
			bloques_disponibles: day.bloques_disponibles,
		};
	}

	// Helper method to normalize room fields
	normalizeRoomFields(room) {
		if (!room) return room;

		return {
			...room,
			// Normalized field names
			id: room.id_sala || room.id,
			roomId: room.id_sala || room.roomId,
			name: room.nom_sala || room.nombre || room.name,
			roomName: room.nom_sala || room.roomName,
			code: room.cod_sala || room.codigo || room.code,
			roomCode: room.cod_sala || room.roomCode,
			// Keep original fields as fallback
			id_sala: room.id_sala || room.id,
			nom_sala: room.nom_sala || room.nombre,
			cod_sala: room.cod_sala,
			nombre: room.nombre,
		};
	}

	normalizeEffectiveHoursFields(item) {
		if (!item) return item;

		return {
			...item,
			// Normalized field names
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
			...response,
			message: response.mensaje,
			appointmentId: response.id_cita,
		};
	}
}

module.exports = DentalSoftSDK;
