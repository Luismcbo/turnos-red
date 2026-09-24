/** Profesional de la salud; se vincula con una especialidad por `especialidadId`. */
export interface Profesional {
  id: number;
  nombre: string;
  apellido: string;
  matricula: string;
  especialidadId: number;
  email?: string;
  activo: boolean;
}
