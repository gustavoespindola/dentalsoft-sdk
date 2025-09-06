# Análisis de Consistencia de Atributos en la API de Dentalsoft

Este documento analiza la consistencia en la nomenclatura de atributos para los mismos conceptos a lo largo de la API de Dentalsoft, con el objetivo de identificar áreas de mejora.

## Pregunta: ¿Los atributos de un mismo concepto tienen el mismo nombre en toda la API?

**Respuesta corta: No.**

Se han identificado varias inconsistencias en la nomenclatura de atributos para conceptos clave como "Sucursal", "Profesional", "Paciente" y "Cita". Estas variaciones ocurren en parámetros de ruta, cuerpos de solicitud y respuestas, utilizando diferentes convenciones de nomenclatura (snake_case vs. camelCase) y nombres distintos para referirse al mismo identificador.

## Análisis Detallado de Inconsistencias

A continuación, se detallan las inconsistencias encontradas para cada concepto principal.

### 1. Concepto: Sucursal (Branch)

El identificador de la sucursal se representa de múltiples maneras a lo largo de la API:

- **`id_sucursal` (snake_case):**

  - `GET /agenda/cita/{id}` (Respuesta)
  - `GET /agenda/disponibilidad/mensual/.../{id_sucursal}/...` (Parámetro de ruta)
  - `GET /agenda/dia_sucursal/{fecha}/{idSucursal}` (Respuesta, inconsistente con el parámetro de ruta)
  - `GET /agenda/informes/horas/efectivas/...` (Parámetro de consulta y respuesta)
  - `GET /presupuesto/informes/datos/gestion/...` (Parámetro de consulta)
  - `GET /pago/informes/ingreso/detallado/...` (Parámetro de consulta y respuesta)

- **`idSucursal` (camelCase):**

  - `GET /agenda/disponibilidad/diaria/.../{idSucursal}/...` (Parámetro de ruta)
  - `GET /agenda/dia_sucursal/{fecha}/{idSucursal}` (Parámetro de ruta)

- **`sucursal` (nombre simple):**
  - `POST /agenda/cita` (Cuerpo de la solicitud)

### 2. Concepto: Profesional (Professional)

El identificador del profesional también presenta variaciones:

- **`id_profesional` (snake_case):**

  - `GET /agenda/disponibilidad/mensual/{id_profesional}/...` (Parámetro de ruta)
  - `GET /agenda/disponibilidad/diaria/{id_profesional}/...` (Parámetro de ruta y respuesta)
  - `GET /profesional/listado` (Respuesta)

- **`profesional` (nombre simple):**

  - `POST /agenda/cita` (Cuerpo de la solicitud)

- **`identificador_numerico_profesional`:**
  - `GET /agenda/informes/horas/efectivas/...` (Respuesta)

### 3. Concepto: Paciente (Patient)

El identificador del paciente es mayormente consistente, pero existen diferencias en campos relacionados.

- **`id_paciente` (snake_case):**

  - `GET /agenda/cita/{id}` (Respuesta)
  - `GET /agenda/dia_sucursal/...` (Respuesta)
  - `GET /agenda/informes/horas/efectivas/...` (Respuesta)
  - `GET /presupuesto/informes/datos/gestion/...` (Respuesta)
  - `GET /pago/informes/ingreso/detallado/...` (Respuesta)

- **`paciente` (nombre simple):**

  - `POST /agenda/cita` (Cuerpo de la solicitud)
  - `POST /paciente/nuevo` (Respuesta, se refiere al ID del paciente creado)

- **Identificador de documento (`cedula`):**
  - `GET /paciente/datos` (Parámetro de consulta y respuesta)
  - `POST /paciente/nuevo` (Cuerpo de la solicitud)
  - En otros endpoints, se usa `identificador_paciente` para el mismo concepto (`GET /presupuesto/informes/datos/gestion/...`, `GET /pago/informes/ingreso/detallado/...`).

### 4. Concepto: Cita (Appointment)

El identificador de la cita es inconsistente entre la respuesta de un informe y el parámetro para obtener una cita individual.

- **`id`:**

  - `GET /agenda/cita/{id}` (Parámetro de ruta y respuesta)
  - `PUT /agenda/cita/cambia_estado` (Cuerpo de la solicitud y respuesta)

- **`id_cita`:**
  - `GET /agenda/informes/horas/efectivas/...` (Respuesta)

### 5. Concepto: Sala (Room)

- **`id_sala`:**

  - `GET /agenda/cita/{id}` (Respuesta)
  - `GET /agenda/disponibilidad/diaria/...` (Respuesta)

- **`sala`:**
  - `POST /agenda/cita` (Cuerpo de la solicitud)

## Conclusión y Recomendaciones

La API presenta inconsistencias notables en la nomenclatura de atributos, mezclando `snake_case`, `camelCase` y nombres simplificados para referirse a los mismos identificadores de conceptos.

**Recomendaciones:**

1.  **Estandarizar una convención de nomenclatura:** Elegir una única convención (`snake_case` parece ser la más predominante) y aplicarla de manera uniforme en todos los parámetros de ruta, consulta, cuerpos de solicitud y respuestas.
2.  **Unificar nombres de identificadores:** Utilizar el mismo nombre para el identificador de un concepto en toda la API. Por ejemplo, el ID de la sucursal debería ser siempre `id_sucursal`.
3.  **Publicar una nueva versión de la API (v2):** Dado que estos cambios romperían la compatibilidad con las integraciones existentes, se recomienda introducir estas correcciones en una nueva versión de la API para permitir una transición gradual a los consumidores.
4.  **Actualizar la documentación:** La documentación debe reflejar con precisión la estructura de la API. Una vez estandarizada, la documentación será más clara y fácil de seguir.

Mejorar la consistencia reducirá la curva de aprendizaje para los desarrolladores que integren la API, disminuirá la probabilidad de errores y hará que el código sea más predecible y mantenible.
