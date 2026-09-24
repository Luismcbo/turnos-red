import { Router } from 'express';
import * as turnoController from '../controllers/turno.controller.js';
import { validate } from '../middlewares/validate.js';
import { idParamSchema } from '../schemas/common.schema.js';
import { createTurnoSchema, updateTurnoSchema } from '../schemas/turno.schema.js';

const router = Router();

router.get('/', turnoController.listTurnos);
router.get('/:id', validate({ params: idParamSchema }), turnoController.getTurno);
router.post('/', validate({ body: createTurnoSchema }), turnoController.createTurno);
router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateTurnoSchema }),
  turnoController.updateTurno,
);
router.delete('/:id', validate({ params: idParamSchema }), turnoController.deleteTurno);

export default router;
