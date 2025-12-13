import { Router } from 'express';
import { createVacation, getVacations, getVacationById, updateVacation, deleteVacation } from '../controllers/vacationController';

const router = Router();

router.post('/', createVacation);
router.get('/', getVacations);
router.get('/:id', getVacationById);
router.put('/:id', updateVacation);
router.delete('/:id', deleteVacation);

export default router;
