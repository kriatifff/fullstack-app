import { Router } from 'express';
import { createProjectWriteOff, getProjectWriteOffs, getProjectWriteOffById, updateProjectWriteOff, deleteProjectWriteOff } from '../controllers/projectWriteOffController';

const router = Router();

router.post('/', createProjectWriteOff);
router.get('/', getProjectWriteOffs);
router.get('/:id', getProjectWriteOffById);
router.put('/:id', updateProjectWriteOff);
router.delete('/:id', deleteProjectWriteOff);

export default router;
