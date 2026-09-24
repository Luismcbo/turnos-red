import { Router } from 'express';
import profesionalesData from '../data/profesionales.json' with { type: 'json' };
import type { Profesional } from '../models/profesionales.model.js';

const router = Router();

// Datos en memoria cargados desde src/data/profesionales.json
const profesionales: Profesional[] = [...profesionalesData];
let nextId = profesionales.reduce((max, p) => Math.max(max, p.id), 0) + 1;

router.get('/', (req, res) => {
  const { especialidadId, activo } = req.query;
  let resultado = profesionales;
  if (especialidadId) {
    resultado = resultado.filter((p) => p.especialidadId === Number(especialidadId));
  }
  if (activo) {
    resultado = resultado.filter((p) => p.activo === (activo === 'true'));
  }
  res.json(resultado);
});

router.get('/:id', (req, res) => {
  const profesional = profesionales.find((p) => p.id === Number(req.params.id));
  if (!profesional) {
    res.status(404).json({ error: 'Profesional no encontrado' });
    return;
  }
  res.json(profesional);
});

router.post('/', (req, res) => {
  const nuevo: Profesional = { id: nextId++, activo: true, ...req.body };
  profesionales.push(nuevo);
  res.status(201).json(nuevo);
});

router.put('/:id', (req, res) => {
  const index = profesionales.findIndex((p) => p.id === Number(req.params.id));
  if (index === -1) {
    res.status(404).json({ error: 'Profesional no encontrado' });
    return;
  }
  profesionales[index] = { ...profesionales[index], ...req.body, id: profesionales[index].id };
  res.json(profesionales[index]);
});

router.delete('/:id', (req, res) => {
  const index = profesionales.findIndex((p) => p.id === Number(req.params.id));
  if (index === -1) {
    res.status(404).json({ error: 'Profesional no encontrado' });
    return;
  }
  profesionales.splice(index, 1);
  res.json({ message: 'Profesional eliminado' });
});

export default router;
