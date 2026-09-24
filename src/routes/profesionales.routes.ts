import { Router } from 'express';
import * as profesionalesController from '../controllers/profesionales.controller.js';

const router = Router();

router.get('/', profesionalesController.getAll);
router.get('/:id', profesionalesController.getById);
router.post('/', profesionalesController.create);
router.put('/:id', profesionalesController.update);
router.delete('/:id', profesionalesController.remove);

export default router;
