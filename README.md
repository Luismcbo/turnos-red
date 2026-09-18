# TurnosRed

API REST que centraliza turnos de distintos centros médicos (clínica médica, pediatría,
odontología, nutrición). Cada sede exporta un `turnos.json` con formato inconsistente
(tipos mezclados, fechas y horas con distinto formato, campos con espacios, etc.);
TurnosRed lo lee, **normaliza y valida** los datos, expone una API REST con CRUD y
notifica en tiempo real por **Socket.IO** cada vez que se crea, actualiza o elimina un turno.

## Requisitos previos

- [Node.js](https://nodejs.org/) LTS (versión indicada en [`.nvmrc`](.nvmrc); si usás `nvm`,
  correr `nvm use`)
- `npm` (viene con Node). Este proyecto usa **únicamente npm** — no hay `yarn.lock` ni
  `pnpm-lock.yaml`, solo `package-lock.json`.

## Instalación

```bash
git clone <url-del-repo>
cd turnos-red
cp .env.example .env
npm install
```

## Variables de entorno

| Variable          | Descripción                                              | Valor por defecto     |
| ----------------- | --------------------------------------------------------- | ---------------------- |
| `PORT`             | Puerto donde escucha el servidor HTTP/Socket.IO           | `3000`                 |
| `TURNOS_DATA_PATH` | Ruta al archivo `turnos.json` con los turnos de la sede    | `./data/turnos.json`   |

Configuralas en un archivo `.env` en la raíz del proyecto (ver `.env.example` como plantilla).
Nunca se commitea `.env` (está en `.gitignore`); sí se commitea `.env.example`.

## Scripts npm

| Script                | Qué hace                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `npm run dev`           | Levanta el servidor en modo desarrollo con recarga automática (`tsx watch`)          |
| `npm run build`         | Compila TypeScript (`src/`) a JavaScript en `dist/`                                  |
| `npm start`             | Corre la app ya compilada desde `dist/` (requiere `npm run build` antes)             |
| `npm run lint`          | Corre ESLint sobre todo el proyecto TypeScript                                       |
| `npm run lint:fix`      | Corre ESLint y corrige automáticamente lo que pueda                                  |
| `npm run format`        | Formatea el código con Prettier (`--write`)                                          |
| `npm run format:check`  | Verifica el formato sin modificar archivos (usado en CI)                             |
| `npm run demo:callback` | Corre el módulo comparativo de lectura de `turnos.json` con callbacks (`node:fs`)     |

## Uso rápido

```bash
npm run dev
```

- API disponible en `http://localhost:3000`
- Cliente de prueba de Socket.IO servido en `http://localhost:3000/` (página estática en
  [`public/index.html`](public/index.html)): se conecta por WebSocket y muestra en vivo
  los eventos `turno:nuevo`, `turno:actualizado` y `turno:eliminado` cada vez que se hace
  POST/PUT/DELETE contra `/turnos` — sin polling.

Al iniciar, la app lee `turnos.json`, normaliza cada registro e informa por consola cuántos
turnos se aceptaron y cuántos se rechazaron (por ejemplo, `id` no numérico o no positivo,
`paciente` vacío, fecha/hora con formato irreconocible, etc.).

## Endpoints

Base: `/turnos`

| Método   | Ruta          | Descripción                    | Respuestas                  |
| -------- | ------------- | ------------------------------- | ---------------------------- |
| `GET`    | `/turnos`      | Lista todos los turnos          | `200`                        |
| `GET`    | `/turnos/:id`  | Obtiene un turno por id         | `200` / `404`                |
| `POST`   | `/turnos`      | Crea un turno nuevo             | `201` / `400`                |
| `PUT`    | `/turnos/:id`  | Actualiza campos de un turno    | `200` / `400` / `404`        |
| `DELETE` | `/turnos/:id`  | Elimina un turno                | `200` / `404`                |

Cualquier error no controlado responde `500` con `{ "error": "Error interno del servidor" }`.

### Ejemplo de body para `POST` / `PUT`

El body acepta el mismo formato heterogéneo que llega de las sedes (se normaliza igual
que `turnos.json`):

```json
{
  "paciente": "Ana Lopez",
  "documento": "39887766",
  "especialidad": "NUTRICION",
  "fecha": "20/08/2026",
  "hora": "11.00",
  "confirmado": "si"
}
```

Probalo en Postman importando la colección o armando requests manuales a
`http://localhost:3000/turnos`.

## Eventos en tiempo real (Socket.IO)

Internamente, cada operación exitosa del servicio de turnos emite un evento por un
`EventEmitter` nativo de Node (`src/events/turnoEventBus.ts`):

- `turno:creado`
- `turno:actualizado`
- `turno:eliminado`

Socket.IO (`src/sockets/socket.ts`) está suscripto a ese bus y retransmite a todos los
clientes conectados:

- `turno:nuevo` (al crear)
- `turno:actualizado` (al actualizar)
- `turno:eliminado` (al eliminar)

No hay polling: el cliente HTML de prueba (`public/index.html`) abre un WebSocket una
sola vez y recibe cada evento apenas ocurre en el servidor.

## Estructura de carpetas

```
turnos-red/
├── data/
│   └── turnos.json              # Datos crudos de ejemplo (formato inconsistente)
├── public/
│   └── index.html               # Cliente de prueba de Socket.IO
├── src/
│   ├── config/
│   │   └── env.ts               # Carga y validación de variables de entorno
│   ├── controllers/
│   │   └── turno.controller.ts  # Handlers de Express (req/res) para /turnos
│   ├── events/
│   │   └── turnoEventBus.ts     # EventEmitter interno (turno:creado/actualizado/eliminado)
│   ├── legacy/
│   │   └── leerTurnosCallback.ts # Lectura de turnos.json con callbacks (node:fs), a modo comparativo
│   ├── middlewares/
│   │   └── errorHandler.ts      # Middleware 404 y manejador de errores 500
│   ├── models/
│   │   └── turno.model.ts       # Interfaces TurnoCrudo (entrada) y Turno (dominio)
│   ├── routes/
│   │   └── turno.routes.ts      # Definición de rutas REST
│   ├── services/
│   │   ├── turno.service.ts     # Store en memoria + lógica de negocio (CRUD, emite eventos)
│   │   └── turnosFileReader.ts  # Lectura async de turnos.json con node:fs/promises
│   ├── sockets/
│   │   └── socket.ts            # Configuración de Socket.IO sobre el server HTTP
│   ├── utils/
│   │   ├── normalizarTurno.ts   # Normalización (id, documento, fecha, hora, confirmado, etc.)
│   │   └── validarTurnoBody.ts  # Validación de shape de los bodies de POST/PUT
│   ├── app.ts                   # Construcción de la app Express (middlewares, rutas)
│   └── index.ts                 # Punto de entrada: arranca HTTP server + Socket.IO
├── .env.example
├── .eslintrc.cjs
├── .nvmrc
├── .prettierrc.json
├── package.json
└── tsconfig.json
```

## Modelo de datos

- **`TurnoCrudo`**: forma heterogénea tal como llega de cada sede (`id: string | number`,
  `documento: string | number`, `confirmado: string | boolean`, fechas/horas con formato libre).
- **`Turno`**: forma de dominio ya normalizada (`id: number`, `documento: string`,
  `fecha` en ISO `YYYY-MM-DD`, `hora` en `HH:mm`, `confirmado: boolean`,
  `observaciones?: string` opcional).

La normalización (`src/utils/normalizarTurno.ts`) descarta y cuenta como rechazado
cualquier registro donde el `id` no sea un entero positivo, el `paciente` quede vacío
tras recortar espacios, o la fecha/hora/confirmado no puedan interpretarse.

## Git y repositorio remoto

El proyecto ya está inicializado como repositorio Git local con commits por etapa. Para
crear el repo remoto en GitHub y subir el código (reemplazá `<tu-usuario>` y elegí
público o privado según corresponda):

```bash
gh repo create <tu-usuario>/turnos-red --private --source=. --remote=origin
git push -u origin main
```

O sin la CLI de GitHub, creando el repo manualmente desde github.com y luego:

```bash
git remote add origin https://github.com/<tu-usuario>/turnos-red.git
git branch -M main
git push -u origin main
```
