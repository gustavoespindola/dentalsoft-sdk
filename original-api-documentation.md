# Documentación API Dentalsoft 10 (v1.2.0)

Esta documentación describe la API de Dentalsoft para la comunicación con aplicaciones externas a través del protocolo OAuth 2.0.

**URL Base:** \`https://api.dentalsoft.cl/external\`

---

## Autenticación

La API utiliza el flujo de **OAuth 2.0 Client Credentials** para la autenticación. Todas las solicitudes a los endpoints protegidos deben incluir un token de acceso en el encabezado de autorización.

- **Tipo de Esquema de Seguridad:** HTTP
- **Esquema de Autorización:** Bearer Token
- **Formato del Token:** JWT

### Obtención de Token de Acceso

Para utilizar la API, primero debes obtener un token de acceso.

#### `POST /access_token`

Obtiene un token de acceso para la utilización de la API.

**URL Completa:** \`https://api.dentalsoft.cl/external/access_token\`

##### Cuerpo de la Solicitud (`application/x-www-form-urlencoded`)

| Parámetro         | Requerido | Tipo    | Descripción                                           |
| ----------------- | --------- | ------- | ----------------------------------------------------- |
| \`grant_type\`    | Sí        | string  | Tipo de solicitud. Debe ser \`"client_credentials"\`. |
| \`client_id\`     | Sí        | string  | ID de acceso de la aplicación cliente.                |
| \`client_secret\` | Sí        | string  | Contraseña de acceso de la aplicación cliente.        |
| \`scope\`         | Sí        | integer | ID de la clínica a la que se desea acceder.           |

##### Respuestas

- **`200 OK`**: Token de acceso generado exitosamente.
- **`400 Bad Request`**: La solicitud es inválida.
- **`401 Unauthorized`**: Sin autorización para el usuario o la aplicación cliente.
- **`500 Internal Server Error`**: Error interno del servidor.

##### Ejemplo de Respuesta (200)

\`\`\`json
{
"token_type": "string",
"expires_in": "string",
"access_token": "string"
}
\`\`\`

---

## Endpoints

### Agenda

Endpoints para la gestión de la agenda y citas.

#### `GET /agenda/cita/{id}`

Obtiene la información detallada de una cita específica, incluyendo los datos del paciente agendado.

- **Autorización:** Requiere Token OAuth 2.0.
- **URL Completa:** \`https://api.dentalsoft.cl/external/agenda/cita/{id}\`

##### Parámetros de Ruta

| Parámetro | Requerido | Tipo    | Descripción          |
| --------- | --------- | ------- | -------------------- |
| \`id\`    | Sí        | integer | ID único de la cita. |

##### Respuestas

- **`200 OK`**: Solicitud procesada exitosamente.
- **`400 Bad Request`**: La solicitud es inválida.
- **`401 Unauthorized`**: Token no válido o expirado.
- **`500 Internal Server Error`**: Error interno del servidor.

##### Ejemplo de Respuesta (200)

\`\`\`json
{
"id": 0,
"fecha": "2021-11-11",
"id_paciente": 0,
"id_sucursal": 0,
"inicio": "10:30,",
"bloques": 0,
"estado": 0,
"estado_texto": "Iniciada",
"id_sala": 0,
"paciente": null,
"sala": {
"id": 1,
"nombre": "string"
},
"confirmable": true
}
\`\`\`

---

#### `GET /agenda/bloque/largo`

Obtiene la duración (en minutos) de un bloque de agenda configurado para la clínica.

- **Autorización:** Requiere Token OAuth 2.0.
- **URL Completa:** \`https://api.dentalsoft.cl/external/agenda/bloque/largo\`

##### Respuestas

- **`200 OK`**: Solicitud procesada exitosamente.
- **`400 Bad Request`**: La solicitud es inválida.
- **`401 Unauthorized`**: Token no válido o expirado.
- **`500 Internal Server Error`**: Error interno del servidor.

##### Ejemplo de Respuesta (200)

\`\`\`json
{
"largo": 5,
"unidad": "minuto"
}
\`\`\`

---

#### `GET /agenda/disponibilidad/mensual/{id_profesional}/{año}/{mes}/{id_sucursal}/{bloques}`

Busca los días con disponibilidad para un profesional en un mes y sucursal específicos.

- **Autorización:** Requiere Token OAuth 2.0.
- **URL Completa:** \`https://api.dentalsoft.cl/external/agenda/disponibilidad/mensual/{id_profesional}/{año}/{mes}/{id_sucursal}/{bloques}\`

##### Parámetros de Ruta

| Parámetro          | Requerido | Tipo    | Descripción                                              |
| ------------------ | --------- | ------- | -------------------------------------------------------- |
| \`id_profesional\` | Sí        | integer | RUT (sin puntos/guion/dv) o DNI del profesional. Mín: 1. |
| \`año\`            | Sí        | integer | Año a consultar. Mín: 1.                                 |
| \`mes\`            | Sí        | integer | Mes a consultar (1-12).                                  |
| \`id_sucursal\`    | Sí        | integer | ID de la sucursal. Mín: 1.                               |
| \`bloques\`        | Sí        | integer | Cantidad de bloques que ocupará la cita. Mín: 1.         |

##### Respuestas

- **`200 OK`**: Listado de días del mes con su disponibilidad.
- **`400 Bad Request`**: Parámetros inválidos.
- **`401 Unauthorized`**: Token no válido o expirado.
- **`500 Internal Server Error`**: Error interno del servidor.

##### Ejemplo de Respuesta (200)

\`\`\`json
[
{
"fecha": "2021-11-10",
"isodow": 1,
"dia": 1,
"bloques_disponibles": true,
"mes": 1
}
]
\`\`\`

---

#### `GET /agenda/disponibilidad/diaria/{id_profesional}/{fecha}/{idSucursal}/{duracion}`

Obtiene los horarios disponibles para un profesional en una fecha específica.

- **Autorización:** Requiere Token OAuth 2.0.
- **URL Completa:** \`https://api.dentalsoft.cl/external/agenda/disponibilidad/diaria/{id_profesional}/{fecha}/{idSucursal}/{duracion}\`

##### Parámetros de Ruta

| Parámetro          | Requerido | Tipo    | Descripción                                              |
| ------------------ | --------- | ------- | -------------------------------------------------------- |
| \`id_profesional\` | Sí        | integer | RUT (sin puntos/guion/dv) o DNI del profesional. Mín: 1. |
| \`fecha\`          | Sí        | string  | Fecha a consultar en formato \`YYYY-MM-DD\`.             |
| \`idSucursal\`     | Sí        | integer | ID de la sucursal. Mín: 1.                               |
| \`duracion\`       | Sí        | integer | Duración de la cita en bloques. Mín: 1.                  |

##### Respuestas

- **`200 OK`**: Listado de horarios disponibles.
- **`400 Bad Request`**: Parámetros inválidos.
- **`401 Unauthorized`**: Token no válido o expirado.
- **`500 Internal Server Error`**: Error interno del servidor.

##### Ejemplo de Respuesta (200)

\`\`\`json
[
{
"inicio": "10:30",
"fin": "11:00",
"id_profesional": 0,
"id_sala": 0,
"nombre_sala": "string"
}
]
\`\`\`

---

#### `POST /agenda/cita`

Crea una nueva cita en la agenda.

- **Autorización:** Requiere Token OAuth 2.0.
- **URL Completa:** \`https://api.dentalsoft.cl/external/agenda/cita\`

##### Cuerpo de la Solicitud (`application/json`)

| Parámetro       | Requerido | Tipo    | Descripción                                 |
| --------------- | --------- | ------- | ------------------------------------------- |
| \`sucursal\`    | Sí        | integer | ID de la sucursal.                          |
| \`profesional\` | Sí        | integer | ID del profesional (RUT numérico).          |
| \`sala\`        | Sí        | integer | ID de la sala.                              |
| \`paciente\`    | Sí        | integer | ID del paciente.                            |
| \`fecha\`       | Sí        | string  | Fecha de la cita en formato \`YYYY-MM-DD\`. |
| \`inicio\`      | Sí        | string  | Hora de inicio en formato \`HH:MM\`.        |
| \`bloques\`     | Sí        | integer | Cantidad de bloques a utilizar. Mín: 1.     |

##### Ejemplo de Solicitud

\`\`\`json
{
"sucursal": 0,
"profesional": 0,
"sala": 0,
"paciente": 0,
"fecha": "2021-11-16",
"inicio": "14:30",
"bloques": 1
}
\`\`\`

##### Respuestas

- **`200 OK`**: Cita creada exitosamente. Devuelve el ID de la cita creada.
- **`400 Bad Request`**: Datos inválidos o falta de disponibilidad.
- **`401 Unauthorized`**: Token no válido o expirado.
- **`500 Internal Server Error`**: Error interno del servidor.

##### Ejemplo de Respuesta (200)

\`\`\`json
"string"
\`\`\`

---

#### `PUT /agenda/cita/cambia_estado`

Modifica el estado de una cita existente (ej: confirmar o cancelar).

- **Autorización:** Requiere Token OAuth 2.0.
- **URL Completa:** \`https://api.dentalsoft.cl/external/agenda/cita/cambia_estado\`

##### Cuerpo de la Solicitud (`application/json`)

| Parámetro  | Requerido | Tipo    | Descripción                                                     |
| ---------- | --------- | ------- | --------------------------------------------------------------- |
| \`id\`     | Sí        | integer | ID de la cita a modificar.                                      |
| \`estado\` | Sí        | string  | Nuevo estado. Valores posibles: \`"confirmar"`, \`"cancelar"\`. |

##### Ejemplo de Solicitud

\`\`\`json
{
"id": 0,
"estado": "confirmar"
}
\`\`\`

##### Respuestas

- **`200 OK`**: Estado modificado correctamente.
- **`400 Bad Request`**: Datos inválidos.
- **`401 Unauthorized`**: Token no válido o expirado.
- **`500 Internal Server Error`**: Error interno del servidor.

##### Ejemplo de Respuesta (200)

\`\`\`json
{
"mensaje": "Operación realizada con éxito",
"id": 1234
}
\`\`\`

---

#### `GET /agenda/dia_sucursal/{fecha}/{idSucursal}`

Obtiene el listado de todas las citas de un día en una sucursal específica.

- **Autorización:** Requiere Token OAuth 2.0.
- **URL Completa:** \`https://api.dentalsoft.cl/external/agenda/dia_sucursal/{fecha}/{idSucursal}\`

##### Parámetros de Ruta

| Parámetro      | Requerido | Tipo    | Descripción                                  |
| -------------- | --------- | ------- | -------------------------------------------- |
| \`fecha\`      | Sí        | string  | Fecha a consultar en formato \`YYYY-MM-DD\`. |
| \`idSucursal\` | Sí        | integer | ID de la sucursal. Mín: 1.                   |

##### Respuestas

- **`200 OK`**: Listado de citas.
- **`400 Bad Request`**: Parámetros inválidos.
- **`401 Unauthorized`**: Token no válido o expirado.
- **`500 Internal Server Error`**: Error interno del servidor.

##### Ejemplo de Respuesta (200)

\`\`\`json
[
{
"id": 0,
"fecha": "2021-11-11",
"id_paciente": 0,
"id_sucursal": 0,
"inicio": "10:30,",
"bloques": 0,
"estado": 0,
"estado_texto": "Iniciada",
"id_sala": 0,
"paciente": null,
"sala": {
"id": 1,
"nombre": "string"
},
"confirmable": true
}
]
\`\`\`

---

#### `GET /agenda/informes/horas/efectivas/{fecha_desde}/{fecha_hasta}`

Obtiene un informe detallado y paginado de las citas en un rango de fechas.

- **Autorización:** Requiere Token OAuth 2.0.
- **URL Completa:** \`https://api.dentalsoft.cl/external/agenda/informes/horas/efectivas/{fecha_desde}/{fecha_hasta}\`

##### Parámetros de Ruta

| Parámetro       | Requerido | Tipo   | Descripción                                |
| --------------- | --------- | ------ | ------------------------------------------ |
| \`fecha_desde\` | Sí        | string | Fecha de inicio en formato \`YYYY-MM-DD\`. |
| \`fecha_hasta\` | Sí        | string | Fecha de fin en formato \`YYYY-MM-DD\`.    |

##### Parámetros de Consulta (Query)

| Parámetro       | Requerido | Tipo    | Descripción                                                        |
| --------------- | --------- | ------- | ------------------------------------------------------------------ |
| \`id_sucursal\` | No        | integer | Filtra los resultados por una sucursal específica. Mín: 1.         |
| \`asistencia\`  | No        | string  | Filtra por asistencia. Valores: \`"asistida"`, \`"inasistencia"\`. |

##### Respuestas

- **`200 OK`**: Datos del informe.
- **`400 Bad Request`**: Parámetros inválidos.
- **`401 Unauthorized`**: Token no válido o expirado.
- **`500 Internal Server Error`**: Error interno del servidor.

##### Ejemplo de Respuesta (200)

\`\`\`json
{
"data": {
"id_cita": 0,
"fecha_cita": "2023-11-16",
"hora_cita": "10:30",
"bloques_cita": 0,
"nombre_sala": "string",
"id_sucursal": 0,
"es_bloqueo": true,
"nombre_sucursal": "string",
"ubicacion_sala": "string",
"id_estado_cita": 0,
"id_tipo_atencion": 0,
"tipo_atencion": "string",
"hora_llegada": "10:30",
"hora_ingreso_lista_espera": "10:30",
"tiempo_espera": "01:30:00",
"hora_alta": "10:30",
"tiempo_en_box": "00:30:00",
"asistencia": "",
"fecha_proxima_cita": "2023-11-16",
"hora_proxima_cita": "10:30",
"fecha_deseada": "2023-11-16",
"eliminada": true,
"motivo_consulta_reserva_web": "string",
"valor_pago_reserva_web": 0,
"estado_pago_reserva_web": "Cancelada",
"identificador_numerico_profesional": 0,
"digito_verificador_profesional": "string",
"nombre_profesional": "string",
"apellido_paterno_profesional": "string",
"apellido_materno_profesional": "string",
"id_paciente": 0,
"nombre_paciente": "string",
"apellido_paterno_paciente": "string",
"apellido_materno_paciente": "string",
"fecha_nacimiento_paciente": "2023-11-16",
"prevision_paciente": "string",
"sexo_paciente": "Masculino",
"mail_paciente": "string",
"direccion1_paciente": "string",
"direccion2_paciente": "string",
"codigo_pais_paciente": "string",
"comuna_paciente": "string",
"telefono_casa_paciente": "string",
"telefono_movil_paciente": "string",
"tipo_identificador_paciente": "string",
"identificador_paciente": "string",
"id_convenio_paciente": 0,
"convenio_paciente": "string",
"referencia_paciente": "string",
"fecha_creacion": "2023-11-16",
"id_usuario_creacion": 0,
"tipo_usuario_creacion": "string",
"estado_cita": "string",
"nombre_usuario_creacion": "string",
"apellido_paterno_usuario_creacion": "string",
"apellido_materno_usuario_creacion": "string"
},
"pagination": {
"siguiente": "string",
"por_pagina": 0,
"total_pagina": 0
}
}
\`\`\`

---

### Paciente

Endpoints para la gestión de la información de pacientes.

#### `GET /paciente/datos`

Busca un paciente por su documento de identidad.

- **Autorización:** Requiere Token OAuth 2.0.
- **URL Completa:** \`https://api.dentalsoft.cl/external/paciente/datos\`

##### Parámetros de Consulta (Query)

| Parámetro             | Requerido | Tipo   | Descripción                                      |
| --------------------- | --------- | ------ | ------------------------------------------------ |
| \`cedula\`            | Sí        | string | RUT o DNI del paciente. Mín: 5 caracteres.       |
| \`tipo_cedula_texto\` | Sí        | string | Tipo de documento. Valores: \`"rut"`, \`"dni"\`. |

##### Respuestas

- **`200 OK`**: Datos del paciente encontrado.
- **`400 Bad Request`**: Parámetros inválidos.
- **`401 Unauthorized`**: Token no válido o expirado.
- **`500 Internal Server Error`**: Error interno del servidor.

##### Ejemplo de Respuesta (200)

\`\`\`json
{
"id": 0,
"cedula": "string",
"tipo_cedula": 1,
"celular": "string",
"sexo": "string",
"fecha_nacimiento": "2021-11-11",
"estado": 0,
"nombre": "string",
"email": "string"
}
\`\`\`

---

#### `POST /paciente/nuevo`

Crea un nuevo paciente en el sistema.

- **Autorización:** Requiere Token OAuth 2.0.
- **URL Completa:** \`https://api.dentalsoft.cl/external/paciente/nuevo\`

##### Cuerpo de la Solicitud (`application/json`)

| Parámetro             | Requerido | Tipo    | Descripción                                          |
| --------------------- | --------- | ------- | ---------------------------------------------------- |
| \`cedula\`            | Sí        | string  | Identificador del paciente (RUT/DNI).                |
| \`tipo_cedula_texto\` | Sí        | string  | Tipo de identificador. Valores: \`"rut"`, \`"dni"\`. |
| \`nombre\`            | Sí        | string  | Nombre(s) del paciente.                              |
| \`apellido_paterno\`  | Sí        | string  | Apellido paterno del paciente.                       |
| \`apellido_materno\`  | No        | string  | Apellido materno del paciente.                       |
| \`email\`             | Sí        | string  | Email de contacto.                                   |
| \`celular\`           | Sí        | string  | Teléfono celular (formato numérico).                 |
| \`id_referencia\`     | No        | integer | ID de referencia externo.                            |

##### Ejemplo de Solicitud

\`\`\`json
{
"cedula": "string",
"tipo_cedula_texto": "rut",
"nombre": "string",
"apellido_paterno": "string",
"apellido_materno": "string",
"email": "string",
"celular": "56977889900",
"id_referencia": 1
}
\`\`\`

##### Respuestas

- **`200 OK`**: Paciente creado con éxito.
- **`400 Bad Request`**: Datos inválidos o paciente ya existe.
- **`401 Unauthorized`**: Token no válido o expirado.
- **`500 Internal Server Error`**: Error interno del servidor.

##### Ejemplo de Respuesta (200)

\`\`\`json
{
"mensaje": "string",
"paciente": 0
}
\`\`\`

---

### Profesional

Endpoints para obtener información de los profesionales de la clínica.

#### `GET /profesional/listado`

Obtiene un listado de todos los profesionales habilitados para agendar en la clínica.

- **Autorización:** Requiere Token OAuth 2.0.
- **URL Completa:** \`https://api.dentalsoft.cl/external/profesional/listado\`

##### Respuestas

- **`200 OK`**: Listado de profesionales.
- **`400 Bad Request`**: Parámetros inválidos.
- **`401 Unauthorized`**: Token no válido o expirado.
- **`500 Internal Server Error`**: Error interno del servidor.

##### Ejemplo de Respuesta (200)

\`\`\`json
{
"id_profesional": 0,
"nombre_completo": "string"
}
\`\`\`

---

### Presupuesto

Endpoints para obtención de información de presupuestos.

#### `GET /presupuesto/informes/datos/gestion/{fecha_desde}/{fecha_hasta}`

Obtiene datos generales paginados de un presupuesto en un rango de fechas.

- **Autorización:** Requiere Token OAuth 2.0.
- **URL Completa:** \`https://api.dentalsoft.cl/external/presupuesto/informes/datos/gestion/{fecha_desde}/{fecha_hasta}\`

##### Parámetros de Ruta

| Parámetro       | Requerido | Tipo   | Descripción                                |
| --------------- | --------- | ------ | ------------------------------------------ |
| \`fecha_desde\` | Sí        | string | Fecha de inicio en formato \`YYYY-MM-DD\`. |
| \`fecha_hasta\` | Sí        | string | Fecha de fin en formato \`YYYY-MM-DD\`.    |

##### Parámetros de Consulta (Query)

| Parámetro       | Requerido | Tipo    | Descripción                                                |
| --------------- | --------- | ------- | ---------------------------------------------------------- |
| \`id_sucursal\` | No        | integer | Filtra los resultados por una sucursal específica. Mín: 1. |

##### Respuestas

- **`200 OK`**: Datos del informe de presupuestos.
- **`400 Bad Request`**: Parámetros inválidos.
- **`401 Unauthorized`**: Token no válido o expirado.
- **`500 Internal Server Error`**: Error interno del servidor.

##### Ejemplo de Respuesta (200)

\`\`\`json
{
"data": {
"id_presupuesto": 0,
"nombre_especialidad": "string",
"nombre_convenio": "string",
"nombre_aseguradora": "string",
"fecha_presupuesto": "2023-11-16 17:53:00",
"confirmado": true,
"cerrado": true,
"id_paciente": 0,
"tipo_identificador_paciente": "DNI",
"identificador_paciente": "string",
"nombre_paciente": "string",
"apellido_paterno_paciente": "string",
"apellido_materno_paciente": "string",
"mail_paciente": "string",
"telefono_paciente": "string",
"telefono_movil_paciente": "string",
"referencia_paciente": "string",
"nombre_sucursal": "string",
"proxima_cita_paciente": "2023-11-16",
"inicio_proxima_cita_paciente": "17:30:00",
"identificador_numerico_diagnosticador": 0,
"digito_verificador_diagnosticador": "string",
"nombre_diagnosticador": "string",
"apellido_paterno_diagnosticador": "string",
"apellido_materno_diagnosticador": "string",
"identificador_numerico_asistente": 0,
"digito_verificador_asistente": "string",
"nombre_asistente": "string",
"apellido_paterno_asistente": "string",
"apellido_materno_asistente": "string",
"monto_total_presupuesto": 0,
"descuento_adicional_presupuesto": 0,
"cargos_presupuesto": 0,
"abonado_presupuesto": 0,
"fecha_ultimo_abono_presupuesto": "2023-11-16 12:30",
"devoluciones_presupuesto": 0,
"id_tratamiento": 0,
"prestaciones_tratadas": 0,
"fecha_ultimo_tratamiento": "2023-11-16 12:30",
"ultima_evolucion_presupuesto": "string",
"fecha_ultima_evolucion_presupuesto": "2023-11-16 11:30",
"identificador_numerico_profesional_evolucion": 0,
"digito_verificador_profesional_evolucion": "string",
"nombre_profesional_evolucion": "string",
"apellido_paterno_profesional_evolucion": "string",
"apellido_materno_profesional_evolucion": "string",
"ultima_observacion_paciente": "string"
},
"pagination": {
"siguiente": "string",
"por_pagina": 0,
"total_pagina": 0
}
}
\`\`\`

---

### Pago

Endpoints para obtención de información de pagos.

#### `GET /pago/informes/ingreso/detallado/{fecha_desde}/{fecha_hasta}`

Obtiene un informe detallado y paginado de los ingresos (pagos) en un rango de fechas.

- **Autorización:** Requiere Token OAuth 2.0.
- **URL Completa:** \`https://api.dentalsoft.cl/external/pago/informes/ingreso/detallado/{fecha_desde}/{fecha_hasta}\`

##### Parámetros de Ruta

| Parámetro       | Requerido | Tipo   | Descripción                                |
| --------------- | --------- | ------ | ------------------------------------------ |
| \`fecha_desde\` | Sí        | string | Fecha de inicio en formato \`YYYY-MM-DD\`. |
| \`fecha_hasta\` | Sí        | string | Fecha de fin en formato \`YYYY-MM-DD\`.    |

##### Parámetros de Consulta (Query)

| Parámetro       | Requerido | Tipo    | Descripción                                                |
| --------------- | --------- | ------- | ---------------------------------------------------------- |
| \`id_sucursal\` | No        | integer | Filtra los resultados por una sucursal específica. Mín: 1. |

##### Respuestas

- **`200 OK`**: Datos del informe de pagos.
- **`400 Bad Request`**: Parámetros inválidos.
- **`401 Unauthorized`**: Token no válido o expirado.
- **`500 Internal Server Error`**: Error interno del servidor.

##### Ejemplo de Respuesta (200)

\`\`\`json
{
"data": {
"id_comprobante": 0,
"id_movimiento": 0,
"movimiento_activo": true,
"fecha_movimiento": "string",
"glosa_movimiento": "string",
"id_sucursal": 0,
"sucursal": "string",
"id_presupuesto": 0,
"id_convenio_presupuesto": 0,
"convenio_presupuesto": 0,
"especialidad_presupuesto": 0,
"porcentaje_descuento_presupuesto": 0,
"id_paciente": 0,
"tipo_identificador_paciente": "DNI",
"identificador_paciente": "string",
"nombre_paciente": "string",
"apellido_paterno_paciente": "string",
"apellido_materno_paciente": "string",
"convenio_paciente": "string",
"institucion_paciente": "string",
"identificador_numerico_diagnosticador": 0,
"digito_verificador_diagnosticador": "string",
"nombre_diagnosticador": "string",
"apellido_paterno_diagnosticador": "string",
"apellido_materno_diagnosticador": "string",
"numero_boleta_electronica": "string",
"id_caja": "string",
"caja": "string",
"id_banco": "string",
"banco": "string",
"numero_documento_referencia": "string",
"fecha_vencimiento_documento": "2023-11-16 11:30",
"id_forma_pago": "string",
"forma_pago": 0,
"valor_total_movimiento": 0,
"porcentaje_comision_movimiento": 0,
"valor_comision_movimiento": 0,
"valor_ajuste_movimiento": 0,
"id_usuario_receptor": 0,
"nombre_receptor": "string",
"apellido_paterno_receptor": "string",
"apellido_materno_receptor": "string"
},
"pagination": {
"siguiente": "string",
"por_pagina": 0,
"total_pagina": 0
}
}
\`\`\`

---

### Sucursal

Endpoints para obtener información de las sucursales.

#### `GET /sucursal/listado`

Obtiene un listado detallado de todas las sucursales disponibles.

- **Autorización:** Requiere Token OAuth 2.0.
- **URL Completa:** \`https://api.dentalsoft.cl/external/sucursal/listado\`

##### Respuestas

- **`200 OK`**: Listado de sucursales.
- **`400 Bad Request`**: Parámetros inválidos.
- **`401 Unauthorized`**: Token no válido o expirado.
- **`500 Internal Server Error`**: Error interno del servidor.

##### Ejemplo de Respuesta (200)

\`\`\`json
[
{
"id": 0,
"nombre": "string",
"telefono": "string",
"direccion": "string",
"estado": 0,
"estado_texto": "string"
}
]
\`\`\`

---

## Modelos de Datos

### Modelo Cita

| Campo            | Tipo        | Descripción                                                                                        |
| ---------------- | ----------- | -------------------------------------------------------------------------------------------------- |
| \`id\`           | integer     | ID único de la cita.                                                                               |
| \`fecha\`        | string      | Fecha de la cita en formato \`YYYY-MM-DD\`.                                                        |
| \`id_paciente\`  | integer     | ID del paciente asociado.                                                                          |
| \`id_sucursal\`  | integer     | ID de la sucursal.                                                                                 |
| \`inicio\`       | string      | Hora de inicio en formato \`HH:MM\`.                                                               |
| \`bloques\`      | integer     | Cantidad de bloques que ocupa la cita.                                                             |
| \`estado\`       | integer     | ID del estado de la cita (0: Iniciada, 2: Confirmada, 3: En Box, 4: Cancelada, 5: Atendido, etc.). |
| \`estado_texto\` | string      | Descripción textual del estado.                                                                    |
| \`id_sala\`      | integer     | ID de la sala.                                                                                     |
| \`paciente\`     | object/null | Objeto con datos del paciente (si se solicita).                                                    |
| \`sala\`         | object      | Objeto con datos de la sala.                                                                       |
| \`confirmable\`  | boolean     | Indica si la cita puede ser confirmada.                                                            |

##### Ejemplo de Objeto

\`\`\`json
{
"id": 0,
"fecha": "2021-11-11",
"id_paciente": 0,
"id_sucursal": 0,
"inicio": "10:30,",
"bloques": 0,
"estado": 0,
"estado_texto": "Iniciada",
"id_sala": 0,
"paciente": null,
"sala": {
"id": 1,
"nombre": "string"
},
"confirmable": true
}
\`\`\`

### Modelo Paciente

| Campo                | Tipo        | Descripción                                    |
| -------------------- | ----------- | ---------------------------------------------- |
| \`id\`               | integer     | ID interno del paciente.                       |
| \`cedula\`           | string      | RUT/DNI del paciente.                          |
| \`tipo_cedula\`      | integer     | ID del tipo de cédula (1: RUT, 2: DNI).        |
| \`celular\`          | string/null | Teléfono celular.                              |
| \`sexo\`             | string/null | Sexo del paciente.                             |
| \`fecha_nacimiento\` | string/null | Fecha de nacimiento en formato \`YYYY-MM-DD\`. |
| \`estado\`           | integer     | Estado del paciente (0: Inactivo, 1: Activo).  |
| \`nombre\`           | string      | Nombre completo del paciente.                  |
| \`email\`            | string      | Email del paciente.                            |

##### Ejemplo de Objeto

\`\`\`json
{
"id": 0,
"cedula": "string",
"tipo_cedula": 1,
"celular": "string",
"sexo": "string",
"fecha_nacimiento": "2021-11-11",
"estado": 0,
"nombre": "string",
"email": "string"
}
\`\`\`

### Modelo Profesional

| Campo               | Tipo    | Descripción                         |
| ------------------- | ------- | ----------------------------------- |
| \`id_profesional\`  | integer | ID del profesional (RUT numérico).  |
| \`nombre_completo\` | string  | Nombre y apellidos del profesional. |

##### Ejemplo de Objeto

\`\`\`json
{
"id_profesional": 0,
"nombre_completo": "string"
}
\`\`\`

### Modelo Sucursal

| Campo            | Tipo    | Descripción                                     |
| ---------------- | ------- | ----------------------------------------------- |
| \`id\`           | integer | ID de la sucursal.                              |
| \`nombre\`       | string  | Nombre de la sucursal.                          |
| \`telefono\`     | string  | Teléfono de contacto.                           |
| \`direccion\`    | string  | Dirección de la sucursal.                       |
| \`estado\`       | integer | Estado de la sucursal (0: Inactiva, 1: Activa). |
| \`estado_texto\` | string  | Descripción textual del estado.                 |

##### Ejemplo de Objeto

\`\`\`json
{
"id": 0,
"nombre": "string",
"telefono": "string",
"direccion": "string",
"estado": 0,
"estado_texto": "string"
}
\`\`\`
