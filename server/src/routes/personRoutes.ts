import { Router } from 'express';
import { createPerson, getPeople, getPersonById, updatePerson, deletePerson } from '../controllers/personController';

const router = Router();

router.post('/', createPerson);
router.get('/', getPeople);
router.get('/:id', getPersonById);
router.put('/:id', updatePerson);
router.delete('/:id', deletePerson);

export default router;
