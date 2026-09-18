import { Router } from 'express';
import * as turnoController from '../controllers/turno.controller.js';

const router = Router();

router.get('/', turnoController.listarTurnos);
router.get('/:id', turnoController.obtenerTurno);
router.post('/', turnoController.crearTurno);
router.put('/:id', turnoController.actualizarTurno);
router.delete('/:id', turnoController.eliminarTurno);

export default router;
