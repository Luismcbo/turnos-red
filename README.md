# TurnosRed

API REST que centraliza turnos de distintos centros médicos (clínica médica, pediatría,
odontología, nutrición) y los vincula con sus profesionales. Cada sede exporta un
`turnos.json` con formato inconsistente (tipos mezclados, fechas y horas con distinto
formato, campos con espacios, etc.); TurnosRed lo lee, **normaliza y valida** los datos,
expone una API REST con CRUD de **Turnos**, **Médicos**, **Especialidades** y **Profesionales**, valida todo lo que entra con
**Zod**, responde los errores con **un único formato estándar** y notifica en tiempo real
por **Socket.IO** cada vez que se crea, actualiza o elimina un turno.

- **Actividad 1**: lectura async, normalización, CRUD de turnos, EventEmitter y Socket.IO.
  Informe técnico: [docs/evidencia/informe-tecnico-turnosred.pdf](docs/evidencia/informe-tecnico-turnosred.pdf)
- **Actividad 2** (esta versión): refactor de errores, recurso Médico, validación con Zod,
  filtros por query params y colección de Postman.
  Informe técnico: [docs/actividad-2/informe-tecnico-actividad-2.pdf](docs/actividad-2/informe-tecnico-actividad-2.pdf)
- **Actividad 3**: Especialidades y Profesionales refactorizados a **Clean Architecture** (controllers `async`
  por entidad, servicios, validaciones previas con retorno anticipado y códigos de estado dinámicos).
  Ver [Controllers async y códigos de estado dinámicos](#controllers-async-y-códigos-de-estado-dinámicos).
  Informe técnico: [docs/actividad-3/informe-tecnico-actividad-3.pdf](docs/actividad-3/informe-tecnico-actividad-3.pdf)

## Requisitos previos

- [Node.js](https://nodejs.org/) LTS (versión indicada en [`.nvmrc`](.nvmrc); si usás `nvm`,
  correr `nvm use`)
- `npm` (viene con Node). Este proyecto usa **únicamente npm**: solo existe `package-lock.json`.
- [Postman](https://www.postman.com/downloads/) (opcional, para importar la colección).
  También se puede correr por CLI con `npm run test:postman` (descarga [Newman](https://github.com/postmanlabs/newman) con `npx`).

## Instalación

```bash
git clone https://github.com/Luismcbo/turnos-red.git
cd turnos-red
cp .env.example .env
npm install
npm run dev
```

## Variables de entorno

| Variable            | Descripción                                                    | Valor por defecto                |
| ------------------- | -------------------------------------------------------------- | -------------------------------- |
| `PORT`              | Puerto donde escucha el servidor HTTP/Socket.IO                | `3000`                           |
| `TURNOS_DATA_PATH`  | Ruta al archivo `turnos.json` con los turnos de la sede        | requerida (`./data/turnos.json`) |
| `MEDICOS_DATA_PATH` | Ruta al archivo `medicos.json` con los médicos (datos semilla) | `./data/medicos.json`            |

Configuralas en un archivo `.env` en la raíz del proyecto (ver `.env.example` como plantilla).
Nunca se commitea `.env` (está en `.gitignore`); sí se commitea `.env.example`.

## Scripts npm

| Script                  | Qué hace                                                                    |
| ----------------------- | --------------------------------------------------------------------------- |
| `npm run dev`           | Levanta el servidor en modo desarrollo con recarga automática (`tsx watch`) |
| `npm run build`         | Compila TypeScript (`src/`) a JavaScript en `dist/`                         |
| `npm start`             | Corre la app ya compilada desde `dist/` (requiere `npm run build` antes)    |
| `npm run lint`          | Corre ESLint sobre todo el proyecto TypeScript                              |
| `npm run lint:fix`      | Corre ESLint y corrige automáticamente lo que pueda                         |
| `npm run format`        | Formatea el código con Prettier (`--write`)                                 |
| `npm run format:check`  | Verifica el formato sin modificar archivos                                  |
| `npm run test:postman`  | Corre la colección de Postman con Newman (el servidor debe estar levantado) |
| `npm run demo:callback` | Corre el módulo comparativo de lectura con callbacks (`node:fs`)            |

## Formato estándar de errores

**Toda** falla de la API (validación, recurso inexistente, ruta inexistente, JSON mal formado
o error interno) sale con este JSON, generado por un único middleware de manejo de errores
registrado al final de la cadena de Express:

```json
{ "status": 400, "message": "...", "code": "VALIDATION_ERROR", "details": [] }
```

| Código             | Status | Cuándo                                                                  |
| ------------------ | ------ | ----------------------------------------------------------------------- |
| `VALIDATION_ERROR` | 400    | Body, query o params inválidos (Zod) o referencia inválida (`medicoId`) |
| `INVALID_JSON`     | 400    | El cuerpo de la petición no es un JSON válido                           |
| `NOT_FOUND`        | 404    | El recurso o la ruta no existen                                         |
| `INTERNAL_ERROR`   | 500    | Error no controlado (el detalle real solo se registra en el log)        |

`details` es un arreglo de `{ location, field, message }` que indica **qué campo falló y por qué**
(`location` = `body`, `query` o `params`). Es `[]` cuando no hay un campo puntual.

Ejemplo: `POST /turnos` con `"especialidad": "PEDIATRÍA"` → **400**

```json
{
  "status": 400,
  "message": "La peticion contiene datos invalidos (1 error)",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "location": "body",
      "field": "especialidad",
      "message": "Debe ser exactamente uno de: \"Clínica médica\", \"Pediatría\", \"Odontología\", \"Nutrición\" (respetando mayúsculas y tildes)"
    }
  ]
}
```

## Endpoints

Códigos de estado usados: `200`, `201`, `204`, `400`, `404`, `500`.

### Turnos — `/turnos`

| Método   | Ruta          | Descripción                                    | Respuestas            |
| -------- | ------------- | ---------------------------------------------- | --------------------- |
| `GET`    | `/turnos`     | Lista turnos (acepta filtros por query params) | `200` / `400`         |
| `GET`    | `/turnos/:id` | Obtiene un turno por id                        | `200` / `400` / `404` |
| `POST`   | `/turnos`     | Crea un turno                                  | `201` / `400`         |
| `PUT`    | `/turnos/:id` | Actualiza los campos enviados (al menos uno)   | `200` / `400` / `404` |
| `DELETE` | `/turnos/:id` | Elimina un turno (sin cuerpo en la respuesta)  | `204` / `400` / `404` |

**Filtros** de `GET /turnos` (opcionales, se combinan con AND; se resuelven en `turno.service.ts`):

| Query param    | Formato                                                 | Ejemplo                  |
| -------------- | ------------------------------------------------------- | ------------------------ |
| `especialidad` | Una de las 4 especialidades; tolera mayúsculas y tildes | `Pediatria`, `PEDIATRÍA` |
| `fecha`        | `DD/MM/YYYY` o `YYYY-MM-DD`                             | `14/08/2026`             |
| `medicoId`     | Entero positivo                                         | `1`                      |

```bash
curl "http://localhost:3000/turnos?especialidad=Pediatria&fecha=14/08/2026&medicoId=1"
```

Un filtro sin coincidencias devuelve `200` con `[]`; un filtro con valor inválido devuelve
`400` con `details[].location = "query"`.

**Body de `POST /turnos`** (el de `PUT` es el mismo con todos los campos opcionales):

```json
{
  "paciente": "Carlos Ruiz",
  "documento": "31.654.210",
  "especialidad": "Pediatría",
  "fecha": "14/08/2026",
  "hora": "10.00",
  "confirmado": true,
  "observaciones": "Primera consulta",
  "medicoId": 1
}
```

| Campo           | Regla                                                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `paciente`      | string no vacío (se recortan y colapsan espacios)                                                                      |
| `documento`     | **string** de formato libre, 1–30 caracteres (`"31654210"`, `"31.654.210"`, `"DNI 31654210"`)                          |
| `especialidad`  | **exactamente** `Clínica médica`, `Pediatría`, `Odontología` o `Nutrición` (se rechaza `PEDIATRÍA`, `pediatria`, etc.) |
| `fecha`         | `DD/MM/YYYY` o `YYYY-MM-DD`, fecha real del calendario (se guarda como `YYYY-MM-DD`)                                   |
| `hora`          | `HH:mm` o `HH.mm` (se guarda como `HH:mm`)                                                                             |
| `confirmado`    | `true`/`false` o `"si"`/`"no"` (por defecto `false`)                                                                   |
| `observaciones` | string opcional, hasta 500 caracteres                                                                                  |
| `medicoId`      | entero opcional; debe existir un médico con ese id (si no → `400`). En `PUT`, `null` desvincula al médico              |

Los campos que no están en la tabla se rechazan (`"Campo no permitido"`).

### Médicos — `/medicos`

| Método   | Ruta           | Descripción                                     | Respuestas            |
| -------- | -------------- | ----------------------------------------------- | --------------------- |
| `GET`    | `/medicos`     | Lista médicos (acepta filtros por query params) | `200` / `400`         |
| `GET`    | `/medicos/:id` | Obtiene un médico por id                        | `200` / `400` / `404` |
| `POST`   | `/medicos`     | Crea un médico                                  | `201` / `400`         |
| `PUT`    | `/medicos/:id` | Actualiza los campos enviados (al menos uno)    | `200` / `400` / `404` |
| `DELETE` | `/medicos/:id` | Elimina un médico (sin cuerpo en la respuesta)  | `204` / `400` / `404` |

**Filtros** de `GET /medicos`:

| Query param    | Formato                                                 | Ejemplo       |
| -------------- | ------------------------------------------------------- | ------------- |
| `especialidad` | Una de las 4 especialidades; tolera mayúsculas y tildes | `Odontologia` |
| `disponible`   | `true` o `false`                                        | `true`        |

```bash
curl "http://localhost:3000/medicos?especialidad=Odontologia&disponible=true"
```

**Body de `POST /medicos`**:

```json
{
  "nombre": "Julia",
  "apellido": "Fernández",
  "matricula": "MP-2001",
  "especialidad": "Pediatría",
  "disponible": true,
  "email": "julia.fernandez@turnosred.test"
}
```

`nombre`, `apellido`, `matricula` y `especialidad` son obligatorios; `disponible` vale `true`
si no se envía; `email` es opcional y debe tener formato de correo.

> **Al eliminar un médico** sus turnos **no se borran**: quedan sin `medicoId` y se emite
> `turno:actualizado` para los clientes conectados.

### General

| Método | Ruta | Descripción                                      | Respuestas |
| ------ | ---- | ------------------------------------------------ | ---------- |
| `GET`  | `/`  | Bienvenida (`Hello World`), `general.controller` | `200`      |
| `*`    | `*`  | Ruta inexistente: middleware final 404 estándar  | `404`      |

### Especialidades — `/especialidades`

| Método   | Ruta                  | Descripción                                  | Respuestas            |
| -------- | --------------------- | -------------------------------------------- | --------------------- |
| `GET`    | `/especialidades`     | Lista especialidades (filtro `?nombre=`)     | `200` / `400`         |
| `GET`    | `/especialidades/:id` | Obtiene una especialidad                     | `200` / `400` / `404` |
| `POST`   | `/especialidades`     | Crea una especialidad                        | `201` / `400`         |
| `PUT`    | `/especialidades/:id` | Actualiza los campos enviados (al menos uno) | `200` / `400` / `404` |
| `DELETE` | `/especialidades/:id` | Elimina una especialidad (sin cuerpo)        | `204` / `400` / `404` |

Body: `{ "nombre": "Cardiología", "descripcion": "Salud cardiovascular" }` (`nombre` obligatorio, hasta 60 caracteres,
**único** ignorando mayúsculas y tildes; `descripcion` opcional, hasta 200). Un `DELETE` de una especialidad que tiene
profesionales asociados devuelve `400`.

```bash
curl "http://localhost:3000/especialidades?nombre=pedia"
```

### Profesionales — `/profesionales`

| Método   | Ruta                 | Descripción                                                             | Respuestas            |
| -------- | -------------------- | ----------------------------------------------------------------------- | --------------------- |
| `GET`    | `/profesionales`     | Lista profesionales (filtros `?especialidadId`, `?activo`, `?apellido`) | `200` / `400`         |
| `GET`    | `/profesionales/:id` | Obtiene un profesional                                                  | `200` / `400` / `404` |
| `POST`   | `/profesionales`     | Crea un profesional                                                     | `201` / `400`         |
| `PUT`    | `/profesionales/:id` | Actualiza los campos enviados (al menos uno)                            | `200` / `400` / `404` |
| `DELETE` | `/profesionales/:id` | Elimina un profesional (sin cuerpo)                                     | `204` / `400` / `404` |

```json
{
  "nombre": "Julia",
  "apellido": "Fernández",
  "matricula": "PR-2001",
  "especialidadId": 2,
  "email": "julia@turnosred.test",
  "activo": true
}
```

| Campo                | Regla                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------- |
| `nombre`, `apellido` | string no vacío (hasta 60); obligatorios al crear                                      |
| `matricula`          | string no vacío (hasta 20), **única**; obligatoria al crear                            |
| `especialidadId`     | entero positivo de una especialidad **existente** (si no, `400`); obligatorio al crear |
| `email`              | opcional, con formato de correo                                                        |
| `activo`             | booleano opcional (por defecto `true`)                                                 |

Filtros de `GET /profesionales` (se combinan con AND): `?especialidadId=2` (entero positivo), `?activo=true` o `false` y
`?apellido=texto` (contiene, ignora mayúsculas y tildes). Un valor inválido devuelve `400` con `location: "query"`.

```bash
curl "http://localhost:3000/profesionales?especialidadId=2&activo=true&apellido=ben"
```

## Controllers async y códigos de estado dinámicos

Especialidades y Profesionales siguen el flujo `routes → controllers → services → data`:

- **`src/routes`**: solo mapean verbo + path a la función del controller (`router.get('/:id', controller.getById)`).
- **`src/controllers`**: `especialidades.controller.ts`, `profesionales.controller.ts` y `general.controller.ts` (`hello` y el
  middleware `notFound`). Todo método es un `export const x = async (req, res) => {...}` con `try/catch`.
- **`src/services`**: acceso a datos en memoria (arrays cargados desde `src/data/*.json`) con funciones `async`, para que
  la futura base de datos no cambie el contrato con los controllers.
- **`src/validators`**: validación de id, body (tipos, obligatorios, campos desconocidos) y query params.

Patrón de cada controller: una variable local `status` se ajusta según el resultado real; si una validación falla se deja el
status (400/404) y se lanza `throw new Error("mensaje")`; el `catch` responde con el mismo status y, si el fallo fue
inesperado (`status < 400`), con **500**. Toda respuesta usa `return res.status(status).json(...)`, así ninguna ejecución
posterior puede escribir la respuesta dos veces (`headers already sent`).

```ts
export const getById = async (req: Request, res: Response) => {
  let status = 200;
  let details: ErrorDetail[] = [];
  try {
    const id = validateIdParam(req.params.id);
    if (id.data === undefined) {
      status = 400;
      details = id.problems;
      throw new Error('El id de la especialidad debe ser un entero positivo');
    }

    const especialidad = await especialidadesService.findById(id.data);
    if (!especialidad) {
      status = 404;
      throw new Error(`No existe una especialidad con id ${id.data}`);
    }

    return res.status(status).json(especialidad);
  } catch (error) {
    if (status < 400) status = 500; // fallo inesperado
    return res.status(status).json(toErrorBody(status, error, details));
  }
};
```

| Situación                                                                                                               | Status          |
| ----------------------------------------------------------------------------------------------------------------------- | --------------- |
| Lectura/actualización correcta · creación · eliminación                                                                 | 200 · 201 · 204 |
| Body incompleto, tipos inválidos, campo desconocido, id no numérico, filtro inválido, duplicado, referencia inexistente | 400             |
| Id inexistente · ruta inexistente                                                                                       | 404             |
| Fallo inesperado (el detalle solo se registra en el log)                                                                | 500             |

## Validación con Zod

La validación vive en `src/schemas` y se aplica con el middleware `validate({ params, query, body })`
(`src/middlewares/validate.ts`), **antes** de llegar al controlador. Si un dato es inválido, el
`ZodError` lo intercepta `zodErrorHandler` (`src/middlewares/zodErrorHandler.ts`) y lo transforma
al error estándar `400 VALIDATION_ERROR` con un `details` por campo. Los controladores reciben
los datos ya validados y transformados (fecha ISO, hora `HH:mm`, `confirmado` booleano).

Cadena de errores registrada al final de `src/app.ts`:
`generalController.notFound` (404) → `zodErrorHandler` → `errorHandler`.

> Zod se usa en **Turnos** y **Médicos**. **Especialidades** y **Profesionales** (Actividad 3) validan con
> `src/validators` desde el propio controller (ver más abajo) y responden con el mismo formato de error.

## Colección de Postman

Archivos en [`postman/`](postman):

- `turnos-red.postman_collection.json` — colección **TurnosRed API** (71 requests, 314 assertions)
- `turnos-red.postman_environment.json` — environment **TurnosRed - Local** (`baseUrl`, `medicoId`, `turnoId`, `especialidadId`, `profesionalId`)

**Cómo usarla**

1. Levantar el servidor: `npm run dev`.
2. En Postman: **Import** → seleccionar los dos archivos. Elegir el environment _TurnosRed - Local_.
3. Abrir la colección → **Run** (Collection Runner) y ejecutar todo **en orden**.
   Por CLI: `npm run test:postman`.

**Qué incluye**

- **Variables**: `baseUrl` y variables dinámicas `medicoId` / `turnoId` / `especialidadId` / `profesionalId`, que se guardan entre requests con
  `pm.environment.set(...)` (también como variable de colección, para que funcione sin environment activo).
- **Tests (`pm.test`)** en cada request: status code (200/201/204/400/404), `Content-Type`, validez del
  esquema JSON de la respuesta (`pm.response.to.have.jsonSchema`) y reglas de negocio — 314 assertions.
- **Happy path y errores** para Turno y Médico: 201/200/204, `PEDIATRÍA` mal escrita (400), múltiples campos
  inválidos (400), JSON mal formado (400), filtros inválidos (400), ids inexistentes (404), ruta inexistente (404).
- **Saved Responses**: cada request trae un ejemplo con la respuesta real del servidor, listo para usar
  como **Mock Server** (_New → Mock server → Select an existing collection_, y cambiar `baseUrl` a la URL del mock).

Orden de ejecución: `0. General` → `1. Médicos` → `2. Turnos` → `3. Limpieza y errores generales` →
`4. Especialidades` → `5. Profesionales` → `6. Limpieza de Especialidades y Profesionales`.

**Casos unhappy path de Especialidades y Profesionales** (todos verifican status y el formato `{ status, message, code, details }`):
body incompleto (400), tipos de datos inválidos y campo desconocido (400), JSON mal formado (400 `INVALID_JSON`), duplicados
(400), especialidad inexistente al crear/editar un profesional (400), filtros inválidos (400), ids no numéricos (400), ids
inexistentes en GET/PUT/DELETE (404), borrar una especialidad con profesionales (400) y rutas inexistentes con `GET` y `POST`
(404 del middleware general).

**Sin regresión**: el camino feliz del refactor devuelve lo mismo que la versión previa (15 de 19 requests idénticas; las
4 diferencias son las intencionales: `DELETE` 200 → 204 y el formato estándar de error). Como control negativo, la misma
colección contra la versión base tradicional falla en 94 de 314 assertions.

## Eventos en tiempo real (Socket.IO)

Cada operación exitosa del servicio de turnos emite un evento por un `EventEmitter` nativo de Node
(`src/events/eventBus.ts`): `turno:creado`, `turno:actualizado`, `turno:eliminado` (y `medico:eliminado`,
que usa `turno.service` para desvincular turnos sin que los servicios se importen entre sí).

Socket.IO (`src/sockets/socket.ts`) está suscripto a ese bus y retransmite a todos los clientes:

- `turno:nuevo` (al crear) · `turno:actualizado` (al actualizar o desvincular médico) · `turno:eliminado` (al eliminar)

No hay polling: el cliente de prueba (`public/index.html`, servido en `http://localhost:3000/socket-client/`; `GET /` devuelve el `Hello World` JSON)
abre un WebSocket una sola vez y recibe cada evento apenas ocurre en el servidor.

## Estructura de carpetas

```
turnos-red/
├── data/
│   ├── turnos.json                # Turnos crudos de ejemplo (formato inconsistente)
│   └── medicos.json              # Médicos semilla
├── docs/evidencia/               # Informe técnico de la Actividad 1 (PDF + capturas)
├── postman/
│   ├── turnos-red.postman_collection.json
│   └── turnos-red.postman_environment.json
├── public/
│   └── index.html                 # Cliente de prueba de Socket.IO (en /socket-client/)
├── src/
│   ├── config/
│   │   ├── env.ts                 # Variables de entorno
│   │   └── zod.ts                 # Mensajes de Zod en español
│   ├── controllers/               # Capa HTTP: leen datos validados y responden
│   │   ├── especialidades.controller.ts  # async + status dinámico + try/catch
│   │   ├── general.controller.ts         # hello (GET /) y notFound (404 final)
│   │   ├── medico.controller.ts
│   │   ├── profesionales.controller.ts   # async + status dinámico + try/catch
│   │   └── turno.controller.ts
│   ├── data/                      # Datos semilla en JSON (arrays en memoria)
│   │   ├── especialidades.json
│   │   └── profesionales.json
│   ├── errors/
│   │   └── AppError.ts            # AppError, ErrorCode y formato ApiErrorBody
│   ├── events/
│   │   └── eventBus.ts            # EventEmitter interno (turno:* y medico:eliminado)
│   ├── legacy/
│   │   └── readTurnosCallback.ts  # Lectura con callbacks (node:fs), a modo comparativo
│   ├── middlewares/
│   │   ├── errorHandler.ts        # errorHandler final (formato estándar, JSON mal formado, 500)
│   │   ├── validate.ts            # Valida params/query/body con Zod
│   │   └── zodErrorHandler.ts     # ZodError → 400 VALIDATION_ERROR con details
│   ├── models/                    # Tipos de dominio
│   │   ├── especialidad.ts
│   │   ├── especialidades.model.ts
│   │   ├── medico.model.ts
│   │   ├── profesionales.model.ts
│   │   └── turno.model.ts         # TurnoCrudo (entrada) y Turno (dominio)
│   ├── routes/                    # Solo verbo + path -> función del controller
│   │   ├── especialidades.routes.ts
│   │   ├── medico.routes.ts
│   │   ├── profesionales.routes.ts
│   │   └── turno.routes.ts
│   ├── schemas/                   # Schemas de Zod
│   │   ├── common.schema.ts       # id, especialidad (exacta y para filtros)
│   │   ├── medico.schema.ts
│   │   └── turno.schema.ts
│   ├── services/                  # Lógica de negocio, filtros y store en memoria
│   │   ├── especialidades.service.ts
│   │   ├── fileReader.ts          # Lectura async con node:fs/promises
│   │   ├── medico.service.ts
│   │   ├── profesionales.service.ts
│   │   └── turno.service.ts
│   ├── sockets/
│   │   └── socket.ts              # Socket.IO sobre el server HTTP
│   ├── utils/
│   │   ├── httpErrors.ts          # toErrorBody: { status, message, code, details }
│   │   └── normalizers.ts         # Normalización de datos heterogéneos de las sedes
│   ├── validators/                # Validación previa de id, body y query (Especialidades/Profesionales)
│   │   ├── common.validator.ts
│   │   ├── especialidades.validator.ts
│   │   └── profesionales.validator.ts
│   ├── app.ts                     # App Express (middlewares, rutas, cadena de errores)
│   └── index.ts                   # Punto de entrada: carga datos y arranca HTTP + Socket.IO
├── .env.example
├── .eslintrc.cjs
├── .nvmrc
├── .prettierrc.json
├── package.json
└── tsconfig.json
```

Arquitectura en capas: `routes → middlewares (validate) → controllers → services → models`,
con `schemas` (Zod) y `validators` como contrato de validación de entrada.

## Modelo de datos

- **`TurnoCrudo`**: forma heterogénea tal como llega de cada sede (`id: string | number`,
  `documento: string | number`, `confirmado: string | boolean`, fechas/horas con formato libre).
- **`Turno`**: forma de dominio normalizada (`id`, `paciente`, `documento: string`, `especialidad`,
  `fecha` ISO, `hora` `HH:mm`, `confirmado`, `observaciones?`, `medicoId?`).
- **`Medico`**: `id`, `nombre`, `apellido`, `matricula`, `especialidad`, `disponible`, `email?`.
- **`EspecialidadItem`**: `id`, `nombre`, `descripcion?` · **`Profesional`**: `id`, `nombre`, `apellido`, `matricula`,
  `especialidadId`, `email?`, `activo` (Actividad 3; datos semilla en `src/data/`).

Al arrancar se cargan `medicos.json` (validado con Zod) y `turnos.json` (normalizado). Se informa por
consola cuántos registros se aceptaron y cuántos se rechazaron (id inválido, `paciente` vacío,
especialidad desconocida, fecha inexistente, `medicoId` que no existe, etc.). En `turnos.json` la
especialidad se acepta con variaciones (`PEDIATRÍA`, `clinica medica`) y se traduce a su grafía canónica;
en cambio la **API** solo acepta la grafía exacta.

## Decisiones de diseño

- **`PUT` actualiza los campos enviados** (no exige el recurso completo) y rechaza un body vacío.
- **`DELETE` responde `204`** sin cuerpo; repetirlo devuelve `404`.
- **`medicoId` inexistente en un turno → `400`** (dato inválido del cliente), no `404`.
- **Especialidad**: exacta en el body, tolerante en filtros de query (para poder escribir `Pediatria`).
- **`GET /`** devuelve el `Hello World`; por eso el cliente de Socket.IO pasó de `/` a `/socket-client/`.
- **Profesional vs. Médico**: son recursos independientes (Médico se vincula a Turnos; Profesional a Especialidad).
- **Referencias inválidas** (`especialidadId` inexistente) → `400`; ids inexistentes en la ruta → `404`.
- El estado vive **en memoria** (se reinicia al reiniciar el servidor); los JSON solo son datos semilla.

## Uso de Inteligencia Artificial

Herramienta principal de esta actividad: **Claude Code** (Claude Sonnet 5) trabajando sobre el repositorio.
Las filas siguientes son ejemplos ya completados con lo que Claude Code generó en esta sesión; la columna
**Ajuste manual aplicado** registra lo que aportó quien entrega el trabajo (se puede ampliar con más detalle
y agregar más filas).

| Tarea                                                                                   | Herramienta            | Prompt                                                                                                                                                                                                                                                                                                        | Respuesta generada                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Ajuste manual aplicado                                                                                |
| --------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Refactor de errores: formato único y middleware centralizado                            | Claude Code (Sonnet 5) | "Implementá un middleware de manejo de errores centralizado (error-handling middleware de Express, al final de la cadena) que devuelva SIEMPRE este formato JSON en cualquier falla: `{ status, message, code, details }`. Definí códigos de error consistentes… agregá 204 donde falte, ej. DELETE exitoso." | `src/errors/AppError.ts` (clase `AppError` + `ErrorCode`), `src/middlewares/errorHandler.ts` (`notFoundHandler` y `errorHandler` al final de la cadena, cubre también JSON mal formado y 500 sin filtrar detalles internos), servicios que lanzan `NOT_FOUND`, controladores sin `try/catch`, `DELETE` → 204. Verificado con `curl` sobre 404, ruta inexistente, id inválido y JSON roto.                                                                                                                     | Definí los requisitos y el orden de las etapas (commits separados) y pedí publicar el repo en GitHub. |
| Validación con Zod, con `especialidad` exacta y errores por campo                       | Claude Code (Sonnet 5) | "Creá schemas de Zod en `src/schemas` para Turno y Médico… `especialidad`: validar que venga en Title Case exacto (rechazar `PEDIATRÍA`)… Middleware que intercepte los `ZodError` y los transforme al formato estándar de error (400), con `details` mostrando exactamente qué campo falló y por qué."       | `common.schema.ts` (enum exacto), `turno.schema.ts` y `medico.schema.ts` (objetos `strict`, transformaciones de fecha/hora/confirmado), `validate.ts` (valida params/query/body) y `zodErrorHandler.ts` (ZodError → 400 con `details` por campo). Se detectó al probar que el mensaje personalizado de `confirmado` no se aplicaba con `z.union` y se reemplazó por `z.custom`; también que `curl` en Windows enviaba las tildes en ANSI, por lo que las pruebas con acentos se hicieron con `fetch` de Node. | Definí los requisitos y el orden de las etapas (commits separados) y pedí publicar el repo en GitHub. |
| Colección de Postman con tests y ejemplos guardados                                     | Claude Code (Sonnet 5) | "Generá `turnos-red.postman_collection.json` exportable, con variables de entorno, scripts de test (`pm.test`) que verifiquen status code y validez del esquema JSON, casos happy path y de error, y Saved Responses para poder usarlos como Mock Server."                                                    | Un script generador que ejecutó cada request contra el servidor real para guardar respuestas auténticas como ejemplos, más la colección (31 requests, 136 assertions) y el environment. Se corrió completa con Newman: **0 fallas**, con y sin environment seleccionado.                                                                                                                                                                                                                                      | Definí los requisitos y el orden de las etapas (commits separados) y pedí publicar el repo en GitHub. |
| Refactor de Especialidades y Profesionales a controllers async con validaciones previas | Claude Code (Sonnet 5) | "Refactorizar hacia Clean Architecture: controllers por entidad, cada método `async` con una variable `status` dinámica, validaciones previas con `throw new Error` y `return res.status(status).json(...)` siempre, try/catch robusto con el formato `{ status, message, code, details }`."                  | Como no existía la base, se creó primero una versión tradicional (rutas inline) y luego se migró en commits separados: controllers, services, controller general (`hello` y 404 final), validators y colección de Postman. Se comparó el camino feliz contra la base (15/19 idénticas; 4 diferencias intencionales) y se corrió la colección con Newman (314 assertions, 0 fallas; 94 fallan contra la base).                                                                                                 | Definí los requisitos y el orden de las etapas (commits separados) y pedí publicar el repo en GitHub. |

## Git y repositorio remoto

Repositorio: <https://github.com/Luismcbo/turnos-red>. El historial continúa el de la Actividad 1, con un commit por
etapa de la Actividad 2 (refactor de errores, validación Zod, recurso Médico, filtros, colección de Postman y docs) y de la
Actividad 3 (base tradicional, migración a controllers, validaciones con retorno anticipado, colección de Postman y docs).
