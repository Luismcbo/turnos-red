import { Router } from 'express';
import * as especialidadesController from '../controllers/especialidades.controller.js';

const router = Router();

router.get('/', especialidadesController.getAll);
router.get('/:id', especialidadesController.getById);
router.post('/', especialidadesController.create);
router.put('/:id', especialidadesController.update);
router.delete('/:id', especialidadesController.remove);

export default router;
