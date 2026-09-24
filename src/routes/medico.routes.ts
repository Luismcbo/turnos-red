import { Router } from 'express';
import * as medicoController from '../controllers/medico.controller.js';
import { validate } from '../middlewares/validate.js';
import { idParamSchema } from '../schemas/common.schema.js';
import {
  createMedicoSchema,
  medicoQuerySchema,
  updateMedicoSchema,
} from '../schemas/medico.schema.js';

const router = Router();

router.get('/', validate({ query: medicoQuerySchema }), medicoController.listMedicos);
router.get('/:id', validate({ params: idParamSchema }), medicoController.getMedico);
router.post('/', validate({ body: createMedicoSchema }), medicoController.createMedico);
router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateMedicoSchema }),
  medicoController.updateMedico,
);
router.delete('/:id', validate({ params: idParamSchema }), medicoController.deleteMedico);

export default router;
