# Mejoras de la API para el SDK de Dentalsoft

## Introducción

Este documento describe las mejoras y cambios que se implementarán en el SDK para la API de Dentalsoft. El objetivo principal es mejorar la consistencia, usabilidad y mantenibilidad de la API, creando una capa de abstracción (SDK) que solucione las inconsistencias existentes sin modificar el código de la API original.

A continuación, se detallan los problemas de consistencia identificados y las soluciones propuestas.

---

## 1. Estandarización de la Convención de Nomenclatura

### Problema

La API actual utiliza diferentes convenciones de nomenclatura para los parámetros, lo que dificulta su uso y reduce la predictibilidad del código. Por ejemplo, algunos parámetros usan `camelCase` (`idSucursal`) mientras que otros usan `snake_case` (`id_profesional`).

### Solución

El SDK estandarizará todos los nombres de parámetros (en rutas, consultas y cuerpos de solicitud/respuesta) a **`snake_case`**.

#### Antes

- `GET /agenda/disponibilidad/diaria/{id_profesional}/{fecha}/{idSucursal}/{duracion}`
- `GET /agenda/dia_sucursal/{fecha}/{idSucursal}`

#### Después (en el SDK)

- `GET /agenda/disponibilidad/diaria/{professional_id}/{date}/{branch_id}/{duration}`
- `GET /agenda/dia_sucursal/{date}/{branch_id}`

---

## 2. Unificación de Nombres de Identificadores

### Problema

El mismo concepto de identificador tiene diferentes nombres en distintas partes de la API. Por ejemplo, el ID de la sucursal se llama `id_sucursal`, `idSucursal` y `sucursal`.

### Solución

El SDK unificará los nombres de los identificadores para que sean consistentes en toda la API. Además, se utilizarán nombres en inglés para mayor claridad.

#### Antes

- ID de Sucursal: `id_sucursal`, `idSucursal`, `sucursal`
- ID de Profesional: `id_profesional`, `profesional`
- ID de Paciente: `id_paciente`, `paciente`

#### Después (en el SDK)

- ID de Sucursal: `branch_id`
- ID de Profesional: `professional_id`
- ID de Paciente: `patient_id`

---

## 3. Unificación y Traducción de Nombres de Atributos

### Problema

Los nombres de los atributos en los modelos de datos no son consistentes y están en español. Por ejemplo, en el modelo `Profesional`, el nombre completo se llama `nombre_completo` y su ID es `id_profesional`.

### Solución

El SDK estandarizará y traducirá los nombres de los atributos al inglés para mantener la consistencia y seguir las convenciones de desarrollo de software.

#### Antes (Modelo `Profesional`)

```json
{
	"id_profesional": 0,
	"nombre_completo": "string"
}
```

#### Después (Modelo `Professional` en el SDK)

```json
{
	"professional_id": 0,
	"full_name": "string"
}
```

#### Antes (Modelo `Cita`)

```json
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
```

#### Después (Modelo `Appointment` en el SDK)

```json
{
	"appointment_id": 0,
	"date": "2021-11-11",
	"patient_id": 0,
	"branch_id": 0,
	"start_time": "10:30",
	"blocks": 0,
	"status_id": 0,
	"status_text": "Iniciada",
	"room_id": 0,
	"patient": null,
	"room": {
		"room_id": 1,
		"name": "string"
	},
	"is_confirmable": true
}
```
