/** Especialidades soportadas, con su grafia canonica exacta (mayusculas y tildes). */
export const ESPECIALIDADES = ['Clínica médica', 'Pediatría', 'Odontología', 'Nutrición'] as const;

export type Especialidad = (typeof ESPECIALIDADES)[number];
