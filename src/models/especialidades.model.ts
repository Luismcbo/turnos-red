/** Especialidad medica como recurso (no confundir con el enum `Especialidad` de turnos/medicos). */
export interface EspecialidadItem {
  id: number;
  nombre: string;
  descripcion?: string;
}
