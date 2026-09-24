import { Router } from 'express';
import especialidadesData from '../data/especialidades.json' with { type: 'json' };
import type { EspecialidadItem } from '../models/especialidades.model.js';

const router = Router();

// Datos en memoria cargados desde src/data/especialidades.json
const especialidades: EspecialidadItem[] = [...especialidadesData];
let nextId = especialidades.reduce((max, e) => Math.max(max, e.id), 0) + 1;

router.get('/', (req, res) => {
  const { nombre } = req.query;
  if (nombre) {
    res.json(
      especialidades.filter((e) => e.nombre.toLowerCase().includes(String(nombre).toLowerCase())),
    );
    return;
  }
  res.json(especialidades);
});

router.get('/:id', (req, res) => {
  const especialidad = especialidades.find((e) => e.id === Number(req.params.id));
  if (!especialidad) {
    res.status(404).json({ error: 'Especialidad no encontrada' });
    return;
  }
  res.json(especialidad);
});

router.post('/', (req, res) => {
  const nueva: EspecialidadItem = { id: nextId++, ...req.body };
  especialidades.push(nueva);
  res.status(201).json(nueva);
});

router.put('/:id', (req, res) => {
  const index = especialidades.findIndex((e) => e.id === Number(req.params.id));
  if (index === -1) {
    res.status(404).json({ error: 'Especialidad no encontrada' });
    return;
  }
  especialidades[index] = { ...especialidades[index], ...req.body, id: especialidades[index].id };
  res.json(especialidades[index]);
});

router.delete('/:id', (req, res) => {
  const index = especialidades.findIndex((e) => e.id === Number(req.params.id));
  if (index === -1) {
    res.status(404).json({ error: 'Especialidad no encontrada' });
    return;
  }
  especialidades.splice(index, 1);
  res.json({ message: 'Especialidad eliminada' });
});

export default router;
