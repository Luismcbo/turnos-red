# TurnosRed API

API REST (Node.js + TypeScript + Express) que centraliza los turnos de distintos centros médicos y los vincula con sus
profesionales. Expone recursos para **Turnos**, **Médicos**, **Especialidades** y **Profesionales**; valida todo lo que
recibe, responde **todos los errores con un único formato JSON** y notifica en tiempo real, por **Socket.IO**, cada vez
que se crea, actualiza o elimina un turno.

> Este README documenta **toda la API**: cómo instalarla y correrla, las variables de entorno, cada endpoint con sus
> parámetros, cuerpos y respuestas (éxito y error), la colección de Postman y la estructura del proyecto. El módulo
> **Pacientes y Turnos Médicos** está solo _diseñado_ (aún sin implementar) en [`pacientes-turnos.md`](pacientes-turnos.md).

## Tabla de contenidos

1. [Requisitos previos](#requisitos-previos)
2. [Instalación y ejecución](#instalación-y-ejecución)
3. [Variables de entorno](#variables-de-entorno)
4. [Scripts npm](#scripts-npm)
5. [Convenciones de la API](#convenciones-de-la-api)
6. [Referencia de endpoints](#referencia-de-endpoints)
7. [Eventos en tiempo real (Socket.IO)](#eventos-en-tiempo-real-socketio)
8. [Colección de Postman](#colección-de-postman)
9. [Estructura de carpetas](#estructura-de-carpetas)
10. [Arquitectura y decisiones de diseño](#arquitectura-y-decisiones-de-diseño)
11. [Módulo Pacientes y Turnos Médicos (propuesta)](#módulo-pacientes-y-turnos-médicos-propuesta)
12. [Uso de Inteligencia Artificial](#uso-de-inteligencia-artificial)
13. [Historial del proyecto y repositorio](#historial-del-proyecto-y-repositorio)

## Requisitos previos

| Herramienta | Versión                                          | Para qué                                              |
| ----------- | ------------------------------------------------ | ----------------------------------------------------- |
| Node.js     | LTS (ver [`.nvmrc`](.nvmrc), Node 22 o superior) | Ejecutar el servidor                                  |
| npm         | El que trae Node                                 | Instalar dependencias (**solo npm**, sin yarn)        |
| Git         | Cualquiera reciente                              | Clonar el repositorio                                 |
| Postman     | Opcional                                         | Importar la colección (o usar `npm run test:postman`) |

## Instalación y ejecución

**1. Clonar el repositorio**

```bash
git clone https://github.com/Luismcbo/turnos-red.git
cd turnos-red
```

**2. Usar la versión de Node del proyecto** (opcional, si usás `nvm`)

```bash
nvm use
```

**3. Instalar dependencias**

```bash
npm install
```

**4. Crear el archivo de variables de entorno** a partir de la plantilla (`.env` **no se versiona**; `.env.example` sí)

```bash
cp .env.example .env
```

En Windows (PowerShell): `Copy-Item .env.example .env`. Los valores por defecto ya funcionan (ver
[Variables de entorno](#variables-de-entorno)).

**5. Levantar el servidor en modo desarrollo** (recarga automática)

```bash
npm run dev
```

Si todo está bien, la consola muestra:

```text
[medicos] Carga inicial: 5 aceptados, 0 rechazados (de 5 registros leidos).
[turnos] Carga inicial: 4 aceptados, 3 rechazados (de 7 registros leidos).
[server] TurnosRed escuchando en http://localhost:3000
[server] Cliente de prueba Socket.IO en http://localhost:3000/socket-client/
```

> Los 3 turnos "rechazados" son intencionales: `data/turnos.json` incluye registros inválidos (id no positivo, id no
> numérico, paciente vacío) para demostrar la normalización y validación de la carga inicial.

**6. Probar que responde**

```bash
curl http://localhost:3000/
```

```json
{
  "message": "Hello World - API de TurnosRed"
}
```

**7. (Opcional) Compilar y correr en modo producción**

```bash
npm run build   # compila src/ a dist/
npm start       # node dist/index.js
```

**8. (Opcional) Correr la colección de Postman por consola** (con el servidor levantado)

```bash
npm run test:postman
```

## Variables de entorno

Se leen del archivo `.env` (plantilla: [`.env.example`](.env.example)).

| Variable            | Obligatoria | Valor por defecto     | Descripción                                                          |
| ------------------- | :---------: | --------------------- | -------------------------------------------------------------------- |
| `PORT`              |     No      | `3000`                | Puerto donde escucha el servidor HTTP y Socket.IO                    |
| `TURNOS_DATA_PATH`  |     Sí      | `./data/turnos.json`  | Archivo con los turnos crudos de la sede (se normalizan al arrancar) |
| `MEDICOS_DATA_PATH` |     No      | `./data/medicos.json` | Archivo con los médicos semilla (validado con Zod al arrancar)       |

Los datos de **Especialidades** y **Profesionales** viven en [`src/data/`](src/data) y se cargan como módulos JSON (no
usan variable de entorno). En Postman, la URL base es la variable `baseUrl` (por defecto `http://localhost:3000`, igual
al `PORT` del `.env`).

## Scripts npm

| Script                  | Qué hace                                                                    |
| ----------------------- | --------------------------------------------------------------------------- |
| `npm run dev`           | Levanta el servidor en modo desarrollo con recarga automática (`tsx watch`) |
| `npm run build`         | Compila TypeScript (`src/`) a JavaScript en `dist/`                         |
| `npm start`             | Corre la app compilada desde `dist/` (requiere `npm run build` antes)       |
| `npm run lint`          | Corre ESLint sobre todo el proyecto                                         |
| `npm run lint:fix`      | Corre ESLint y corrige automáticamente lo que pueda                         |
| `npm run format`        | Formatea el código y los documentos con Prettier                            |
| `npm run format:check`  | Verifica el formato sin modificar archivos                                  |
| `npm run test:postman`  | Corre la colección de Postman con Newman (el servidor debe estar levantado) |
| `npm run demo:callback` | Módulo comparativo de lectura de archivos con callbacks (`node:fs`)         |

## Convenciones de la API

- **URL base:** `http://localhost:3000` (según `PORT`). Todas las peticiones y respuestas usan `application/json`.
- **Estado en memoria:** los datos se cargan al arrancar y se pierden al reiniciar (los JSON son solo datos semilla).
- **Ids:** enteros positivos asignados por el servidor.
- **Formatos:** fecha `DD/MM/YYYY` o `YYYY-MM-DD` (siempre se devuelve `YYYY-MM-DD`); hora `HH:mm` o `HH.mm` (se devuelve
  `HH:mm`).
- **Especialidades válidas** en el body de Turnos y Médicos (escritura **exacta**, con mayúsculas y tildes):
  `Clínica médica`, `Pediatría`, `Odontología`, `Nutrición`. En los **filtros** por query se tolera cualquier
  combinación de mayúsculas y tildes (`Pediatria`, `PEDIATRÍA`).
- **`PUT` actualiza solo los campos enviados** (al menos uno); un body vacío es un `400`.
- **`DELETE` exitoso responde `204 No Content`** sin cuerpo; repetirlo devuelve `404`.

### Códigos de estado

| Código | Significado           | Cuándo se usa                                                                           |
| :----: | --------------------- | --------------------------------------------------------------------------------------- |
|  200   | OK                    | Lectura o actualización correcta                                                        |
|  201   | Created               | Recurso creado                                                                          |
|  204   | No Content            | Eliminación correcta (sin cuerpo)                                                       |
|  400   | Bad Request           | Body, query o params inválidos, JSON mal formado, duplicados o referencias inexistentes |
|  404   | Not Found             | El recurso (id) o la ruta no existen                                                    |
|  500   | Internal Server Error | Fallo inesperado (el detalle interno solo se registra en el log)                        |

### Formato estándar de error

**Toda** falla (validación, recurso o ruta inexistente, JSON mal formado, error interno) responde con esta estructura:

```json
{
  "status": 400,
  "message": "Descripción legible del problema",
  "code": "VALIDATION_ERROR",
  "details": [
    { "location": "body", "field": "especialidad", "message": "Qué está mal en ese campo" }
  ]
}
```

| Campo     | Descripción                                                                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status`  | Mismo código HTTP de la respuesta                                                                                                                     |
| `message` | Descripción legible del error                                                                                                                         |
| `code`    | `VALIDATION_ERROR` (400), `INVALID_JSON` (400), `NOT_FOUND` (404) o `INTERNAL_ERROR` (500)                                                            |
| `details` | Arreglo de `{ location, field, message }` con **qué campo falló y por qué** (`location`: `body`, `query` o `params`); `[]` si no hay un campo puntual |

Errores comunes a todos los recursos (los ejemplos se repiten por recurso más abajo):

```json
{
  "status": 404,
  "message": "No existe un turno con id 999999",
  "code": "NOT_FOUND",
  "details": []
}
```

```json
{
  "status": 400,
  "message": "La peticion contiene datos invalidos (1 error)",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "location": "params",
      "field": "id",
      "message": "Debe ser un entero positivo"
    }
  ]
}
```

```json
{
  "status": 400,
  "message": "El cuerpo de la peticion no es un JSON valido",
  "code": "INVALID_JSON",
  "details": []
}
```

## Referencia de endpoints

| Recurso        | Endpoints                                                                                                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| General        | [`GET /`](#get-) · cualquier ruta inexistente → [404](#ruta-inexistente-404)                                                                                                                                                                                       |
| Turnos         | [`GET /turnos`](#get-turnos) · [`GET /turnos/:id`](#get-turnosid) · [`POST /turnos`](#post-turnos) · [`PUT /turnos/:id`](#put-turnosid) · [`DELETE /turnos/:id`](#delete-turnosid)                                                                                 |
| Médicos        | [`GET /medicos`](#get-medicos) · [`GET /medicos/:id`](#get-medicosid) · [`POST /medicos`](#post-medicos) · [`PUT /medicos/:id`](#put-medicosid) · [`DELETE /medicos/:id`](#delete-medicosid)                                                                       |
| Especialidades | [`GET /especialidades`](#get-especialidades) · [`GET /especialidades/:id`](#get-especialidadesid) · [`POST /especialidades`](#post-especialidades) · [`PUT /especialidades/:id`](#put-especialidadesid) · [`DELETE /especialidades/:id`](#delete-especialidadesid) |
| Profesionales  | [`GET /profesionales`](#get-profesionales) · [`GET /profesionales/:id`](#get-profesionalesid) · [`POST /profesionales`](#post-profesionales) · [`PUT /profesionales/:id`](#put-profesionalesid) · [`DELETE /profesionales/:id`](#delete-profesionalesid)           |

### General

#### `GET /`

Endpoint de bienvenida (`general.controller`). Sin parámetros.

| Status | Cuándo  |
| :----: | ------- |
|  200   | Siempre |

```json
{
  "message": "Hello World - API de TurnosRed"
}
```

#### Ruta inexistente (404)

Cualquier petición que no coincida con una ruta la atiende el middleware final `notFound` con el formato estándar:

```json
{
  "status": 404,
  "message": "Ruta no encontrada: GET /ruta-inexistente",
  "code": "NOT_FOUND",
  "details": []
}
```

---

### Turnos

Un turno asocia un paciente (por ahora como texto) con una especialidad, una fecha y hora, y opcionalmente un médico.

| Campo           | Tipo    | Descripción                                    |
| --------------- | ------- | ---------------------------------------------- |
| `id`            | integer | Asignado por el servidor                       |
| `paciente`      | string  | Nombre del paciente                            |
| `documento`     | string  | Documento (formato libre)                      |
| `especialidad`  | string  | Una de las 4 especialidades (escritura exacta) |
| `fecha`         | string  | `YYYY-MM-DD`                                   |
| `hora`          | string  | `HH:mm`                                        |
| `confirmado`    | boolean | Si el turno está confirmado                    |
| `observaciones` | string  | Opcional                                       |
| `medicoId`      | integer | Opcional; id de un médico existente            |

#### `GET /turnos`

Lista los turnos. Sin filtros devuelve todos. Los filtros son opcionales y se combinan con AND.

**Query params**

| Param          | Tipo    | Descripción                                             | Ejemplo                  |
| -------------- | ------- | ------------------------------------------------------- | ------------------------ |
| `especialidad` | string  | Una de las 4 especialidades; tolera mayúsculas y tildes | `Pediatria`, `PEDIATRÍA` |
| `fecha`        | string  | `DD/MM/YYYY` o `YYYY-MM-DD` (fecha real del calendario) | `14/08/2026`             |
| `medicoId`     | integer | Entero positivo                                         | `1`                      |

**Respuestas**

| Status | Cuándo                                                      |
| :----: | ----------------------------------------------------------- |
|  200   | Arreglo de turnos (`[]` si ningún turno cumple los filtros) |
|  400   | Algún filtro tiene un valor inválido (`location: "query"`)  |

`200 OK` — `GET /turnos?especialidad=Pediatria&fecha=14/08/2026&medicoId=1`

```json
[
  {
    "id": 102,
    "paciente": "Carlos Ruiz",
    "documento": "31654210",
    "especialidad": "Pediatría",
    "fecha": "2026-08-14",
    "hora": "10:00",
    "confirmado": true,
    "medicoId": 1
  }
]
```

`400 Bad Request` — `GET /turnos?especialidad=Cardiologia&medicoId=abc`

```json
{
  "status": 400,
  "message": "La peticion contiene datos invalidos (2 errores)",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "location": "query",
      "field": "especialidad",
      "message": "Especialidad desconocida. Valores admitidos (sin distinguir mayúsculas ni tildes): Clínica médica, Pediatría, Odontología, Nutrición"
    },
    {
      "location": "query",
      "field": "medicoId",
      "message": "Debe ser un entero positivo"
    }
  ]
}
```

#### `GET /turnos/:id`

Obtiene un turno por id.

**Path params:** `id` (integer positivo).

| Status | Cuándo                          |
| :----: | ------------------------------- |
|  200   | Devuelve el turno               |
|  400   | `id` no es un entero positivo   |
|  404   | No existe un turno con ese `id` |

`200 OK` — `GET /turnos/102`

```json
{
  "id": 102,
  "paciente": "Carlos Ruiz",
  "documento": "31654210",
  "especialidad": "Pediatría",
  "fecha": "2026-08-14",
  "hora": "10:00",
  "confirmado": true,
  "medicoId": 1
}
```

`404 Not Found` — `GET /turnos/999999`

```json
{
  "status": 404,
  "message": "No existe un turno con id 999999",
  "code": "NOT_FOUND",
  "details": []
}
```

#### `POST /turnos`

Crea un turno. El cuerpo se normaliza (fecha → ISO, hora → `HH:mm`, espacios del paciente colapsados). Los campos que no
figuran abajo se rechazan (`"Campo no permitido"`).

**Body (JSON)**

| Campo           | Tipo              | Obligatorio | Regla                                                                         |
| --------------- | ----------------- | :---------: | ----------------------------------------------------------------------------- |
| `paciente`      | string            |     Sí      | No vacío                                                                      |
| `documento`     | string            |     Sí      | Texto de formato libre, 1–30 caracteres (`31654210`, `31.654.210`, `DNI 123`) |
| `especialidad`  | string            |     Sí      | **Exactamente** `Clínica médica`, `Pediatría`, `Odontología` o `Nutrición`    |
| `fecha`         | string            |     Sí      | `DD/MM/YYYY` o `YYYY-MM-DD`, fecha real                                       |
| `hora`          | string            |     Sí      | `HH:mm` o `HH.mm` (00:00 a 23:59)                                             |
| `confirmado`    | boolean \| string |     No      | `true`/`false` o `"si"`/`"no"`. Por defecto `false`                           |
| `observaciones` | string            |     No      | Hasta 500 caracteres                                                          |
| `medicoId`      | integer           |     No      | Entero positivo de un médico **existente** (si no existe → `400`)             |

```json
{
  "paciente": "Ana Lopez",
  "documento": "39.887.766",
  "especialidad": "Nutrición",
  "fecha": "20/08/2026",
  "hora": "11.00",
  "confirmado": true,
  "observaciones": "Primera consulta",
  "medicoId": 3
}
```

**Respuestas**

| Status | Cuándo                                                                                                                      |
| :----: | --------------------------------------------------------------------------------------------------------------------------- |
|  201   | Turno creado (devuelve el turno con su `id`)                                                                                |
|  400   | Campo faltante, tipo o formato inválido, especialidad mal escrita, campo desconocido, JSON inválido, `medicoId` inexistente |

`201 Created`

```json
{
  "id": 106,
  "paciente": "Ana Lopez",
  "documento": "39.887.766",
  "especialidad": "Nutrición",
  "fecha": "2026-08-20",
  "hora": "11:00",
  "confirmado": true,
  "observaciones": "Primera consulta",
  "medicoId": 3
}
```

`400 Bad Request` — especialidad `PEDIATRÍA` (no exacta) y fecha inexistente

```json
{
  "status": 400,
  "message": "La peticion contiene datos invalidos (2 errores)",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "location": "body",
      "field": "especialidad",
      "message": "Debe ser exactamente uno de: \"Clínica médica\", \"Pediatría\", \"Odontología\", \"Nutrición\" (respetando mayúsculas y tildes)"
    },
    {
      "location": "body",
      "field": "fecha",
      "message": "Fecha inválida. Use DD/MM/YYYY o YYYY-MM-DD y una fecha real del calendario"
    }
  ]
}
```

#### `PUT /turnos/:id`

Actualiza **solo los campos enviados** (mismas reglas que `POST`, todos opcionales, al menos uno). `medicoId: null`
desvincula al médico.

**Path params:** `id` (integer positivo). **Body:** cualquier subconjunto de los campos de `POST /turnos`.

```json
{
  "hora": "15:30",
  "confirmado": false
}
```

| Status | Cuándo                                            |
| :----: | ------------------------------------------------- |
|  200   | Turno actualizado (devuelve el turno completo)    |
|  400   | `id` inválido, body vacío, o algún campo inválido |
|  404   | No existe un turno con ese `id`                   |

`200 OK`

```json
{
  "id": 106,
  "paciente": "Ana Lopez",
  "documento": "39.887.766",
  "especialidad": "Nutrición",
  "fecha": "2026-08-20",
  "hora": "15:30",
  "confirmado": false,
  "observaciones": "Primera consulta",
  "medicoId": 3
}
```

`400 Bad Request` — body vacío (`PUT /turnos/102` con `{}`)

```json
{
  "status": 400,
  "message": "La peticion contiene datos invalidos (1 error)",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "location": "body",
      "field": "(root)",
      "message": "Debe enviar al menos un campo para actualizar"
    }
  ]
}
```

#### `DELETE /turnos/:id`

Elimina un turno.

**Path params:** `id` (integer positivo).

| Status | Cuándo                                                       |
| :----: | ------------------------------------------------------------ |
|  204   | Eliminado (sin cuerpo en la respuesta)                       |
|  400   | `id` no es un entero positivo                                |
|  404   | No existe un turno con ese `id` (incluye borrarlo dos veces) |

---

### Médicos

| Campo          | Tipo    | Descripción                                    |
| -------------- | ------- | ---------------------------------------------- |
| `id`           | integer | Asignado por el servidor                       |
| `nombre`       | string  | Nombre                                         |
| `apellido`     | string  | Apellido                                       |
| `matricula`    | string  | Matrícula profesional                          |
| `especialidad` | string  | Una de las 4 especialidades (escritura exacta) |
| `disponible`   | boolean | Si atiende actualmente                         |
| `email`        | string  | Opcional                                       |

#### `GET /medicos`

Lista médicos. Filtros opcionales, combinados con AND.

**Query params**

| Param          | Tipo    | Descripción                                             | Ejemplo       |
| -------------- | ------- | ------------------------------------------------------- | ------------- |
| `especialidad` | string  | Una de las 4 especialidades; tolera mayúsculas y tildes | `Odontologia` |
| `disponible`   | boolean | `true` o `false`                                        | `true`        |

| Status | Cuándo                                            |
| :----: | ------------------------------------------------- |
|  200   | Arreglo de médicos (`[]` si no hay coincidencias) |
|  400   | Filtro con valor inválido                         |

`200 OK` — `GET /medicos?especialidad=Odontologia&disponible=true`

```json
[
  {
    "id": 2,
    "nombre": "Martín",
    "apellido": "Suárez",
    "matricula": "MP-1002",
    "especialidad": "Odontología",
    "disponible": true,
    "email": "martin.suarez@turnosred.test"
  }
]
```

#### `GET /medicos/:id`

Obtiene un médico. **Path params:** `id` (integer positivo).

| Status | Cuándo                           |
| :----: | -------------------------------- |
|  200   | Devuelve el médico               |
|  400   | `id` no es un entero positivo    |
|  404   | No existe un médico con ese `id` |

`200 OK` — `GET /medicos/1`

```json
{
  "id": 1,
  "nombre": "Laura",
  "apellido": "Benítez",
  "matricula": "MP-1001",
  "especialidad": "Pediatría",
  "disponible": true,
  "email": "laura.benitez@turnosred.test"
}
```

`404 Not Found` — `GET /medicos/999999`

```json
{
  "status": 404,
  "message": "No existe un medico con id 999999",
  "code": "NOT_FOUND",
  "details": []
}
```

#### `POST /medicos`

Crea un médico. Campos no listados se rechazan.

**Body (JSON)**

| Campo          | Tipo    | Obligatorio | Regla                                                                      |
| -------------- | ------- | :---------: | -------------------------------------------------------------------------- |
| `nombre`       | string  |     Sí      | No vacío, hasta 60 caracteres                                              |
| `apellido`     | string  |     Sí      | No vacío, hasta 60 caracteres                                              |
| `matricula`    | string  |     Sí      | No vacío, hasta 20 caracteres                                              |
| `especialidad` | string  |     Sí      | **Exactamente** `Clínica médica`, `Pediatría`, `Odontología` o `Nutrición` |
| `disponible`   | boolean |     No      | Por defecto `true`                                                         |
| `email`        | string  |     No      | Formato de correo válido, hasta 120 caracteres                             |

```json
{
  "nombre": "Julia",
  "apellido": "Fernández",
  "matricula": "MP-2001",
  "especialidad": "Pediatría",
  "email": "julia.fernandez@turnosred.test"
}
```

| Status | Cuándo                                                     |
| :----: | ---------------------------------------------------------- |
|  201   | Médico creado (devuelve el médico con su `id`)             |
|  400   | Campo faltante, tipo o formato inválido, campo desconocido |

`201 Created`

```json
{
  "id": 6,
  "nombre": "Julia",
  "apellido": "Fernández",
  "matricula": "MP-2001",
  "especialidad": "Pediatría",
  "disponible": true,
  "email": "julia.fernandez@turnosred.test"
}
```

`400 Bad Request` — `{ "nombre": "", "email": "no-es-un-mail", "especialidad": "Cardiología" }`

```json
{
  "status": 400,
  "message": "La peticion contiene datos invalidos (5 errores)",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "location": "body",
      "field": "nombre",
      "message": "No puede estar vacío"
    },
    {
      "location": "body",
      "field": "apellido",
      "message": "Entrada inválida: se esperaba texto, recibido indefinido"
    },
    {
      "location": "body",
      "field": "matricula",
      "message": "Entrada inválida: se esperaba texto, recibido indefinido"
    },
    {
      "location": "body",
      "field": "especialidad",
      "message": "Debe ser exactamente uno de: \"Clínica médica\", \"Pediatría\", \"Odontología\", \"Nutrición\" (respetando mayúsculas y tildes)"
    },
    {
      "location": "body",
      "field": "email",
      "message": "Inválido dirección de correo electrónico"
    }
  ]
}
```

#### `PUT /medicos/:id`

Actualiza **solo los campos enviados** (mismas reglas que `POST`, al menos uno). **Path params:** `id`.

```json
{
  "disponible": false
}
```

| Status | Cuándo                                     |
| :----: | ------------------------------------------ |
|  200   | Médico actualizado                         |
|  400   | `id` inválido, body vacío o campo inválido |
|  404   | No existe un médico con ese `id`           |

`200 OK`

```json
{
  "id": 6,
  "nombre": "Julia",
  "apellido": "Fernández",
  "matricula": "MP-2001",
  "especialidad": "Pediatría",
  "disponible": false,
  "email": "julia.fernandez@turnosred.test"
}
```

#### `DELETE /medicos/:id`

Elimina un médico. Sus turnos **no se borran**: quedan sin `medicoId` y se emite `turno:actualizado` por Socket.IO.

| Status | Cuándo                           |
| :----: | -------------------------------- |
|  204   | Eliminado (sin cuerpo)           |
|  400   | `id` no es un entero positivo    |
|  404   | No existe un médico con ese `id` |

---

### Especialidades

| Campo         | Tipo    | Descripción                       |
| ------------- | ------- | --------------------------------- |
| `id`          | integer | Asignado por el servidor          |
| `nombre`      | string  | Nombre de la especialidad (único) |
| `descripcion` | string  | Opcional                          |

> Esta especialidad-recurso es independiente del texto `especialidad` de Turnos y Médicos: se usa para clasificar
> **Profesionales** (`especialidadId`).

#### `GET /especialidades`

Lista especialidades. **Query params:** `nombre` (string, opcional): devuelve las que **contienen** el texto, sin distinguir
mayúsculas ni tildes.

| Status | Cuándo                                                   |
| :----: | -------------------------------------------------------- |
|  200   | Arreglo de especialidades (`[]` si no hay coincidencias) |
|  400   | `nombre` vacío o repetido (`?nombre=a&nombre=b`)         |

`200 OK` — `GET /especialidades?nombre=pedia`

```json
[
  {
    "id": 2,
    "nombre": "Pediatría",
    "descripcion": "Atención de niños y adolescentes"
  }
]
```

#### `GET /especialidades/:id`

Obtiene una especialidad. **Path params:** `id` (integer positivo).

| Status | Cuándo                                  |
| :----: | --------------------------------------- |
|  200   | Devuelve la especialidad                |
|  400   | `id` no es un entero positivo           |
|  404   | No existe una especialidad con ese `id` |

`200 OK` — `GET /especialidades/2`

```json
{
  "id": 2,
  "nombre": "Pediatría",
  "descripcion": "Atención de niños y adolescentes"
}
```

`400 Bad Request` — `GET /especialidades/abc`

```json
{
  "status": 400,
  "message": "El id de la especialidad debe ser un entero positivo",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "location": "params",
      "field": "id",
      "message": "Debe ser un entero positivo"
    }
  ]
}
```

`404 Not Found` — `GET /especialidades/999999`

```json
{
  "status": 404,
  "message": "No existe una especialidad con id 999999",
  "code": "NOT_FOUND",
  "details": []
}
```

#### `POST /especialidades`

Crea una especialidad. Campos no listados se rechazan.

**Body (JSON)**

| Campo         | Tipo   | Obligatorio | Regla                                                                 |
| ------------- | ------ | :---------: | --------------------------------------------------------------------- |
| `nombre`      | string |     Sí      | No vacío, hasta 60 caracteres. **Único** (ignora mayúsculas y tildes) |
| `descripcion` | string |     No      | No vacío si se envía, hasta 200 caracteres                            |

```json
{
  "nombre": "Cardiología",
  "descripcion": "Salud cardiovascular"
}
```

| Status | Cuándo                                                                             |
| :----: | ---------------------------------------------------------------------------------- |
|  201   | Especialidad creada                                                                |
|  400   | Campo faltante, tipo inválido, campo desconocido, JSON inválido o nombre duplicado |

`201 Created`

```json
{
  "id": 5,
  "nombre": "Cardiología",
  "descripcion": "Salud cardiovascular"
}
```

`400 Bad Request` — tipos inválidos y campo desconocido (`{ "nombre": 123, "descripcion": true, "extra": "x" }`)

```json
{
  "status": 400,
  "message": "Los datos de la especialidad no son válidos (3 errores)",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "location": "body",
      "field": "extra",
      "message": "Campo no permitido"
    },
    {
      "location": "body",
      "field": "nombre",
      "message": "Debe ser un texto (string)"
    },
    {
      "location": "body",
      "field": "descripcion",
      "message": "Debe ser un texto (string)"
    }
  ]
}
```

`400 Bad Request` — nombre duplicado (`{ "nombre": "Pediatria" }` ya existe como "Pediatría")

```json
{
  "status": 400,
  "message": "Ya existe una especialidad con ese nombre",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "location": "body",
      "field": "nombre",
      "message": "Ya existe una especialidad llamada \"Pediatria\""
    }
  ]
}
```

#### `PUT /especialidades/:id`

Actualiza **solo los campos enviados** (al menos uno; `nombre` sigue siendo único). **Path params:** `id`.

```json
{
  "descripcion": "Cuidado del corazón"
}
```

| Status | Cuándo                                                       |
| :----: | ------------------------------------------------------------ |
|  200   | Especialidad actualizada                                     |
|  400   | `id` inválido, body vacío, campo inválido o nombre duplicado |
|  404   | No existe una especialidad con ese `id`                      |

`200 OK`

```json
{
  "id": 5,
  "nombre": "Cardiología",
  "descripcion": "Cuidado del corazón"
}
```

#### `DELETE /especialidades/:id`

Elimina una especialidad **que no tenga profesionales asociados**.

| Status | Cuándo                                                         |
| :----: | -------------------------------------------------------------- |
|  204   | Eliminada (sin cuerpo)                                         |
|  400   | `id` inválido, o la especialidad tiene profesionales asociados |
|  404   | No existe una especialidad con ese `id`                        |

`400 Bad Request` — `DELETE /especialidades/2` (tiene profesionales)

```json
{
  "status": 400,
  "message": "No se puede eliminar una especialidad con profesionales asociados",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "location": "params",
      "field": "id",
      "message": "Tiene 2 profesional(es) asociado(s)"
    }
  ]
}
```

---

### Profesionales

| Campo            | Tipo    | Descripción                          |
| ---------------- | ------- | ------------------------------------ |
| `id`             | integer | Asignado por el servidor             |
| `nombre`         | string  | Nombre                               |
| `apellido`       | string  | Apellido                             |
| `matricula`      | string  | Matrícula (única)                    |
| `especialidadId` | integer | Id de una especialidad **existente** |
| `email`          | string  | Opcional                             |
| `activo`         | boolean | Por defecto `true`                   |

#### `GET /profesionales`

Lista profesionales. Filtros opcionales, combinados con AND.

**Query params**

| Param            | Tipo    | Descripción                                    | Ejemplo   |
| ---------------- | ------- | ---------------------------------------------- | --------- |
| `especialidadId` | integer | Entero positivo                                | `2`       |
| `activo`         | boolean | `true` o `false`                               | `true`    |
| `apellido`       | string  | Contiene el texto (ignora mayúsculas y tildes) | `fernand` |

| Status | Cuándo                                                  |
| :----: | ------------------------------------------------------- |
|  200   | Arreglo de profesionales (`[]` si no hay coincidencias) |
|  400   | Filtro con valor inválido (`location: "query"`)         |

`200 OK` — `GET /profesionales?especialidadId=5&activo=true&apellido=fernand`

```json
[
  {
    "id": 6,
    "activo": true,
    "nombre": "Julia",
    "apellido": "Fernández",
    "matricula": "PR-2001",
    "especialidadId": 5,
    "email": "julia@turnosred.test"
  }
]
```

`400 Bad Request` — `GET /profesionales?especialidadId=abc&activo=quizas`

```json
{
  "status": 400,
  "message": "Los filtros enviados no son válidos (2 errores)",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "location": "query",
      "field": "especialidadId",
      "message": "Debe ser un entero positivo"
    },
    {
      "location": "query",
      "field": "activo",
      "message": "Debe ser \"true\" o \"false\""
    }
  ]
}
```

#### `GET /profesionales/:id`

Obtiene un profesional. **Path params:** `id` (integer positivo).

| Status | Cuándo                                |
| :----: | ------------------------------------- |
|  200   | Devuelve el profesional               |
|  400   | `id` no es un entero positivo         |
|  404   | No existe un profesional con ese `id` |

`200 OK` — `GET /profesionales/1`

```json
{
  "id": 1,
  "nombre": "Laura",
  "apellido": "Benítez",
  "matricula": "PR-1001",
  "especialidadId": 2,
  "email": "laura.benitez@turnosred.test",
  "activo": true
}
```

`404 Not Found` — `GET /profesionales/999999`

```json
{
  "status": 404,
  "message": "No existe un profesional con id 999999",
  "code": "NOT_FOUND",
  "details": []
}
```

#### `POST /profesionales`

Crea un profesional. Campos no listados se rechazan.

**Body (JSON)**

| Campo            | Tipo    | Obligatorio | Regla                                                        |
| ---------------- | ------- | :---------: | ------------------------------------------------------------ |
| `nombre`         | string  |     Sí      | No vacío, hasta 60 caracteres                                |
| `apellido`       | string  |     Sí      | No vacío, hasta 60 caracteres                                |
| `matricula`      | string  |     Sí      | No vacío, hasta 20 caracteres. **Única** (ignora mayúsculas) |
| `especialidadId` | integer |     Sí      | Entero positivo de una especialidad **existente**            |
| `email`          | string  |     No      | Formato de correo, hasta 120 caracteres                      |
| `activo`         | boolean |     No      | Por defecto `true`                                           |

```json
{
  "nombre": "Julia",
  "apellido": "Fernández",
  "matricula": "PR-2001",
  "especialidadId": 5,
  "email": "julia@turnosred.test"
}
```

| Status | Cuándo                                                                                           |
| :----: | ------------------------------------------------------------------------------------------------ |
|  201   | Profesional creado                                                                               |
|  400   | Campo faltante, tipo inválido, campo desconocido, especialidad inexistente o matrícula duplicada |

`201 Created`

```json
{
  "id": 6,
  "activo": true,
  "nombre": "Julia",
  "apellido": "Fernández",
  "matricula": "PR-2001",
  "especialidadId": 5,
  "email": "julia@turnosred.test"
}
```

`400 Bad Request` — tipos inválidos (`{ "nombre": 1, "apellido": "", "matricula": null, "especialidadId": "abc", "email": "no-es-un-mail", "activo": "si" }`)

```json
{
  "status": 400,
  "message": "Los datos del profesional no son válidos (6 errores)",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "location": "body",
      "field": "nombre",
      "message": "Debe ser un texto (string)"
    },
    {
      "location": "body",
      "field": "apellido",
      "message": "No puede estar vacío"
    },
    {
      "location": "body",
      "field": "matricula",
      "message": "Debe ser un texto (string)"
    },
    {
      "location": "body",
      "field": "email",
      "message": "Debe tener formato de correo electrónico"
    },
    {
      "location": "body",
      "field": "especialidadId",
      "message": "Debe ser un número entero positivo"
    },
    {
      "location": "body",
      "field": "activo",
      "message": "Debe ser booleano (true o false)"
    }
  ]
}
```

`400 Bad Request` — `especialidadId` inexistente

```json
{
  "status": 400,
  "message": "La especialidad indicada no existe",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "location": "body",
      "field": "especialidadId",
      "message": "No existe una especialidad con id 999999"
    }
  ]
}
```

#### `PUT /profesionales/:id`

Actualiza **solo los campos enviados** (mismas reglas que `POST`, al menos uno). **Path params:** `id`.

```json
{
  "activo": false
}
```

| Status | Cuándo                                                                                    |
| :----: | ----------------------------------------------------------------------------------------- |
|  200   | Profesional actualizado                                                                   |
|  400   | `id` inválido, body vacío, campo inválido, especialidad inexistente o matrícula duplicada |
|  404   | No existe un profesional con ese `id`                                                     |

`200 OK`

```json
{
  "id": 6,
  "activo": false,
  "nombre": "Julia",
  "apellido": "Fernández",
  "matricula": "PR-2001",
  "especialidadId": 5,
  "email": "julia@turnosred.test"
}
```

#### `DELETE /profesionales/:id`

Elimina un profesional.

| Status | Cuándo                                |
| :----: | ------------------------------------- |
|  204   | Eliminado (sin cuerpo)                |
|  400   | `id` no es un entero positivo         |
|  404   | No existe un profesional con ese `id` |

## Eventos en tiempo real (Socket.IO)

Cada operación exitosa sobre turnos emite un evento en un `EventEmitter` interno (`src/events/eventBus.ts`) y Socket.IO
(`src/sockets/socket.ts`) lo retransmite a todos los clientes conectados, **sin polling**.

| Acción                                          | Evento interno      | Evento hacia los clientes |
| ----------------------------------------------- | ------------------- | ------------------------- |
| `POST /turnos`                                  | `turno:creado`      | `turno:nuevo`             |
| `PUT /turnos/:id` · borrar un médico con turnos | `turno:actualizado` | `turno:actualizado`       |
| `DELETE /turnos/:id`                            | `turno:eliminado`   | `turno:eliminado`         |

Cada evento lleva el turno como payload. Cliente de prueba: <http://localhost:3000/socket-client/>
([`public/index.html`](public/index.html)); muestra los eventos en vivo mientras se hacen `POST/PUT/DELETE` sobre `/turnos`.

## Colección de Postman

Archivos en [`postman/`](postman):

- [`turnos-red.postman_collection.json`](postman/turnos-red.postman_collection.json): colección **TurnosRed API**
  (71 requests en 7 carpetas).
- [`turnos-red.postman_environment.json`](postman/turnos-red.postman_environment.json): environment **TurnosRed - Local**.

**Variable `baseUrl`.** **Todas** las URLs (requests y ejemplos guardados) usan `{{baseUrl}}`, definida en la colección y en
el environment con el valor `http://localhost:3000` (el `PORT` del `.env`). Para apuntar a otro puerto, servidor o a un
Mock Server basta con cambiar esa variable; no hay URLs fijas.

**Cómo usarla**

1. Levantar el servidor: `npm run dev`.
2. En Postman: **Import** → seleccionar los dos archivos → elegir el environment _TurnosRed - Local_.
3. Abrir la colección → **Run** (Collection Runner) y ejecutar todo **en orden**. Por consola: `npm run test:postman`.

**Qué incluye**

- Tests `pm.test` en cada request: status code (200/201/204/400/404), `Content-Type`, esquema JSON de la respuesta
  (`pm.response.to.have.jsonSchema`) y reglas de negocio (314 assertions).
- Variables dinámicas (`medicoId`, `turnoId`, `especialidadId`, `profesionalId`) guardadas entre requests con
  `pm.environment.set(...)` (también como variable de colección, para que funcione sin environment activo).
- **Happy path y unhappy path**: body incompleto, tipos inválidos, campos desconocidos, JSON mal formado, duplicados,
  referencias inexistentes, filtros inválidos, ids no numéricos (400), ids inexistentes y rutas inexistentes (404).
- **Saved Responses**: cada request tiene un ejemplo guardado con la respuesta real, listo para un Mock Server.

Orden de ejecución: `0. General` → `1. Médicos` → `2. Turnos` → `3. Limpieza y errores generales` →
`4. Especialidades` → `5. Profesionales` → `6. Limpieza de Especialidades y Profesionales`.

**Verificación de `{{baseUrl}}`** (Newman): con el environment normal, con el servidor en otro puerto
(`PORT=3005` + `baseUrl=http://localhost:3005`) y sin environment, las 71 requests pasan (314/314
assertions); con un `baseUrl` inexistente fallan las 71 requests, lo que confirma que ninguna usa una URL fija.

## Estructura de carpetas

```text
turnos-red/
├── data/                              # Datos semilla de Turnos y Médicos (rutas por variable de entorno)
│   ├── turnos.json                    #   turnos crudos (formato inconsistente a propósito)
│   └── medicos.json
├── docs/                              # Informes técnicos (PDF) y evidencias de cada actividad
│   ├── evidencia/                     #   Actividad 1
│   ├── actividad-2/
│   ├── actividad-3/
│   └── actividad-4/capturas/          #   capturas de la Actividad 4
├── postman/
│   ├── turnos-red.postman_collection.json
│   └── turnos-red.postman_environment.json
├── public/
│   └── index.html                     # Cliente de prueba de Socket.IO (se sirve en /socket-client/)
├── src/
│   ├── config/                        # env.ts (variables de entorno) y zod.ts (mensajes en español)
│   ├── controllers/                   # Capa HTTP: una función async por endpoint
│   │   ├── especialidades.controller.ts
│   │   ├── general.controller.ts      #   GET / y middleware 404 final
│   │   ├── medico.controller.ts
│   │   ├── profesionales.controller.ts
│   │   └── turno.controller.ts
│   ├── data/                          # Datos semilla de Especialidades y Profesionales (JSON ficticios)
│   │   ├── especialidades.json
│   │   └── profesionales.json
│   ├── errors/AppError.ts             # AppError, ErrorCode y formato de error
│   ├── events/eventBus.ts             # EventEmitter interno (turno:* y medico:eliminado)
│   ├── legacy/readTurnosCallback.ts   # Lectura con callbacks (comparativo)
│   ├── middlewares/                   # errorHandler, validate (Zod) y zodErrorHandler
│   ├── models/                        # Tipos de dominio
│   │   ├── especialidad.ts, especialidades.model.ts, medico.model.ts,
│   │   │   profesionales.model.ts, turno.model.ts
│   │   └── pacientes.model.ts, turnos-medicos.model.ts   # mockup (solo tipos)
│   ├── routes/                        # Solo mapean verbo + path a la función del controller
│   │   ├── especialidades.routes.ts, medico.routes.ts,
│   │   └── profesionales.routes.ts, turno.routes.ts
│   ├── schemas/                       # Schemas de Zod (Turnos y Médicos)
│   ├── services/                      # Acceso a datos en memoria (async) y lógica de negocio
│   ├── sockets/socket.ts              # Socket.IO sobre el servidor HTTP
│   ├── utils/                         # normalizers.ts y httpErrors.ts
│   ├── validators/                    # Validación manual (Especialidades y Profesionales)
│   ├── app.ts                         # App Express: middlewares, rutas y cadena de errores
│   └── index.ts                       # Punto de entrada
├── .env.example                       # Plantilla de variables de entorno (SÍ se versiona)
├── .gitignore                         # Excluye node_modules, dist y .env
├── pacientes-turnos.md                # Propuesta de diseño del módulo Pacientes y Turnos Médicos
├── package.json
└── tsconfig.json
```

**Qué se versiona.** `.gitignore` excluye `node_modules/`, `dist/` y los archivos `.env*` (secretos locales), pero
**mantiene versionado `.env.example`**. Sí se versionan `src/` completo (con `src/data/`), `package.json`,
`pacientes-turnos.md` y este `README.md`.

## Arquitectura y decisiones de diseño

Flujo de una petición: `routes → (validación) → controllers → services → datos en memoria`.

- **Turnos y Médicos** validan con **Zod** (`src/schemas` + middleware `validate`); un `ZodError` lo convierte
  `zodErrorHandler` al error estándar.
- **Especialidades y Profesionales** usan **controllers `async`** con validación previa (`src/validators`): cada método
  calcula una variable `status` (200/201/204, 400/404, 500), si algo falla la fija y hace
  `throw new Error("mensaje")`, y el `catch` responde siempre con `return res.status(status).json(...)`.
- Cadena de errores al final de `app.ts`: `generalController.notFound` (404) → `zodErrorHandler` → `errorHandler`.
- **`PUT` actualiza los campos enviados; `DELETE` responde `204`**.
- **Referencia inválida en el body** (`medicoId` o `especialidadId` inexistente) → `400`; **id inexistente en la ruta** → `404`.
- Los servicios son `async` aunque los datos estén en arrays: el día que se integre una base de datos, los controllers
  no cambian.
- `GET /` devuelve el `Hello World`; por eso el cliente de Socket.IO se sirve en `/socket-client/`.

## Módulo Pacientes y Turnos Médicos (propuesta)

Hoy un turno guarda al paciente como texto suelto (`paciente` + `documento`). El documento
[`pacientes-turnos.md`](pacientes-turnos.md) propone el siguiente paso, **sin implementarlo todavía** (solo existen las
interfaces en [`src/models/pacientes.model.ts`](src/models/pacientes.model.ts) y
[`src/models/turnos-medicos.model.ts`](src/models/turnos-medicos.model.ts)) para que el equipo de Frontend avance en paralelo:

- Modelo de **Paciente** (DNI, nombre, apellido, fecha de nacimiento, contacto, obra social) y de **Turno médico**
  vinculado por `pacienteId` y `profesionalId`, con estados (`PENDIENTE`, `CONFIRMADO`, `ATENDIDO`, `CANCELADO`, `AUSENTE`).
- Dos endpoints propuestos, con request/response en JSON: `POST /pacientes` y `GET /pacientes/:id/turnos`.

## Uso de Inteligencia Artificial

Herramienta principal de esta actividad: **Claude Code** (Claude Sonnet 5) trabajando sobre el repositorio.
Las filas siguientes son ejemplos ya completados con lo que Claude Code generó en esta sesión; la columna
**Ajuste manual aplicado** registra lo que aportó quien entrega el trabajo (se puede ampliar con más detalle
y agregar más filas).

| Tarea                                                                                     | Herramienta            | Prompt                                                                                                                                                                                                                                                                                                                    | Respuesta generada                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Ajuste manual aplicado                                                                                                 |
| ----------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Refactor de errores: formato único y middleware centralizado                              | Claude Code (Sonnet 5) | "Implementá un middleware de manejo de errores centralizado (error-handling middleware de Express, al final de la cadena) que devuelva SIEMPRE este formato JSON en cualquier falla: `{ status, message, code, details }`. Definí códigos de error consistentes… agregá 204 donde falte, ej. DELETE exitoso."             | `src/errors/AppError.ts` (clase `AppError` + `ErrorCode`), `src/middlewares/errorHandler.ts` (`notFoundHandler` y `errorHandler` al final de la cadena, cubre también JSON mal formado y 500 sin filtrar detalles internos), servicios que lanzan `NOT_FOUND`, controladores sin `try/catch`, `DELETE` → 204. Verificado con `curl` sobre 404, ruta inexistente, id inválido y JSON roto.                                                                                                                     | Definí los requisitos y el orden de las etapas (commits separados) y pedí publicar el repo en GitHub.                  |
| Validación con Zod, con `especialidad` exacta y errores por campo                         | Claude Code (Sonnet 5) | "Creá schemas de Zod en `src/schemas` para Turno y Médico… `especialidad`: validar que venga en Title Case exacto (rechazar `PEDIATRÍA`)… Middleware que intercepte los `ZodError` y los transforme al formato estándar de error (400), con `details` mostrando exactamente qué campo falló y por qué."                   | `common.schema.ts` (enum exacto), `turno.schema.ts` y `medico.schema.ts` (objetos `strict`, transformaciones de fecha/hora/confirmado), `validate.ts` (valida params/query/body) y `zodErrorHandler.ts` (ZodError → 400 con `details` por campo). Se detectó al probar que el mensaje personalizado de `confirmado` no se aplicaba con `z.union` y se reemplazó por `z.custom`; también que `curl` en Windows enviaba las tildes en ANSI, por lo que las pruebas con acentos se hicieron con `fetch` de Node. | Definí los requisitos y el orden de las etapas (commits separados) y pedí publicar el repo en GitHub.                  |
| Colección de Postman con tests y ejemplos guardados                                       | Claude Code (Sonnet 5) | "Generá `turnos-red.postman_collection.json` exportable, con variables de entorno, scripts de test (`pm.test`) que verifiquen status code y validez del esquema JSON, casos happy path y de error, y Saved Responses para poder usarlos como Mock Server."                                                                | Un script generador que ejecutó cada request contra el servidor real para guardar respuestas auténticas como ejemplos, más la colección (31 requests, 136 assertions) y el environment. Se corrió completa con Newman: **0 fallas**, con y sin environment seleccionado.                                                                                                                                                                                                                                      | Definí los requisitos y el orden de las etapas (commits separados) y pedí publicar el repo en GitHub.                  |
| Refactor de Especialidades y Profesionales a controllers async con validaciones previas   | Claude Code (Sonnet 5) | "Refactorizar hacia Clean Architecture: controllers por entidad, cada método `async` con una variable `status` dinámica, validaciones previas con `throw new Error` y `return res.status(status).json(...)` siempre, try/catch robusto con el formato `{ status, message, code, details }`."                              | Como no existía la base, se creó primero una versión tradicional (rutas inline) y luego se migró en commits separados: controllers, services, controller general (`hello` y 404 final), validators y colección de Postman. Se comparó el camino feliz contra la base (15/19 idénticas; 4 diferencias intencionales) y se corrió la colección con Newman (314 assertions, 0 fallas; 94 fallan contra la base).                                                                                                 | Definí los requisitos y el orden de las etapas (commits separados) y pedí publicar el repo en GitHub.                  |
| Diseño del módulo Pacientes y Turnos (mockup), `{{baseUrl}}` en Postman y README integral | Claude Code (Sonnet 5) | "Diseñar las interfaces TypeScript de Paciente y Turno, documentarlas en `pacientes-turnos.md` con dos endpoints propuestos, reemplazar las URLs fijas de la colección por `{{baseUrl}}`, re-correr toda la colección y armar un README que documente toda la API leyendo el código real (routes, controllers, schemas)." | Interfaces en `src/models` validadas con `tsc` contra los ejemplos JSON del documento; auditoría de la colección (71 requests ya usaban `{{baseUrl}}`, pero los 71 ejemplos guardados tenían la URL fija y se corrigieron); corridas de Newman con distintos `baseUrl` (incluida una con URL inexistente para probar que no queda ninguna fija); README generado con las respuestas reales capturadas de cada endpoint; capturas de pantalla de la evidencia.                                                 | Definí los requisitos y el orden de las etapas (commits separados) y pedí generar capturas de pantalla como evidencia. |

## Historial del proyecto y repositorio

Repositorio: <https://github.com/Luismcbo/turnos-red>. El historial se organiza por actividad:

- **Actividad 1**: lectura async, normalización, CRUD de turnos, EventEmitter y Socket.IO.
  Informe: [docs/evidencia/informe-tecnico-turnosred.pdf](docs/evidencia/informe-tecnico-turnosred.pdf).
- **Actividad 2**: errores centralizados, recurso Médico, validación con Zod, filtros y colección de Postman.
  Informe: [docs/actividad-2/informe-tecnico-actividad-2.pdf](docs/actividad-2/informe-tecnico-actividad-2.pdf).
- **Actividad 3**: Especialidades y Profesionales con controllers `async`, validaciones con retorno anticipado y estado
  dinámico. Informe: [docs/actividad-3/informe-tecnico-actividad-3.pdf](docs/actividad-3/informe-tecnico-actividad-3.pdf).
- **Actividad 4**: diseño del módulo Pacientes y Turnos Médicos ([`pacientes-turnos.md`](pacientes-turnos.md)),
  `{{baseUrl}}` en toda la colección de Postman y este README integral.
