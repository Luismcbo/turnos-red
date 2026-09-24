/**
 * MOCKUP (propuesta): modelo del modulo Pacientes. Solo tipos; el CRUD todavia no esta
 * implementado. Ver pacientes-turnos.md en la raiz del proyecto.
 */

/** Sexo declarado del paciente (F = femenino, M = masculino, X = otro / no binario). */
export type Sexo = 'F' | 'M' | 'X';

/** Datos de contacto del paciente. El telefono es el unico obligatorio. */
export interface ContactoPaciente {
  telefono: string;
  email?: string;
  direccion?: string;
}

/** Cobertura medica (opcional: un paciente puede atenderse de forma particular). */
export interface ObraSocial {
  nombre: string;
  numeroAfiliado: string;
}

export interface Paciente {
  id: number;
  /** DNI solo con digitos (7 u 8), sin puntos. Es unico en el sistema. */
  dni: string;
  nombre: string;
  apellido: string;
  /** Fecha de nacimiento ISO (YYYY-MM-DD). La edad se calcula, no se guarda. */
  fechaNacimiento: string;
  sexo?: Sexo;
  contacto: ContactoPaciente;
  obraSocial?: ObraSocial;
  /** Baja logica: un paciente inactivo conserva su historial pero no puede sacar turnos nuevos. */
  activo: boolean;
  /** Marcas de tiempo ISO 8601 (UTC). */
  creadoEn: string;
  actualizadoEn: string;
}

/** Cuerpo de POST /pacientes: lo que el cliente puede enviar (el servidor asigna id y marcas de tiempo). */
export type CreatePacienteInput = Omit<Paciente, 'id' | 'activo' | 'creadoEn' | 'actualizadoEn'> & {
  activo?: boolean;
};

/** Cuerpo de PUT /pacientes/:id: actualiza los campos enviados (al menos uno). */
export type UpdatePacienteInput = Partial<CreatePacienteInput>;

/** Resumen minimo de un paciente, para incrustar en otras respuestas. */
export type PacienteResumen = Pick<Paciente, 'id' | 'dni' | 'nombre' | 'apellido'>;
