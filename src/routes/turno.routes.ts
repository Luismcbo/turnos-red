import { Router } from 'express';
import * as turnoController from '../controllers/turno.controller.js';

const router = Router();

router.get('/', turnoController.listTurnos);
router.get('/:id', turnoController.getTurno);
router.post('/', turnoController.createTurno);
router.put('/:id', turnoController.updateTurno);
router.delete('/:id', turnoController.deleteTurno);

export default router;
