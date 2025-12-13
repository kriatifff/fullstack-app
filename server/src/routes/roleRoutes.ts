import { Router } from 'express';
import { createRole, getRoles, getRoleByName, updateRole, deleteRole } from '../controllers/roleController';

const router = Router();

router.post('/', createRole);
router.get('/', getRoles);
router.get('/:name', getRoleByName);
router.put('/:name', updateRole); // Expects { newName: '...' } in body
router.delete('/:name', deleteRole);

export default router;
