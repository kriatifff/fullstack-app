import { Router } from 'express';
import { createProjectMemberRate, getProjectMemberRates, getProjectMemberRateByIds, updateProjectMemberRate, deleteProjectMemberRate } from '../controllers/projectMemberRateController';

const router = Router();

router.post('/', createProjectMemberRate);
router.get('/', getProjectMemberRates);
router.get('/:projectId/:personId', getProjectMemberRateByIds);
router.put('/:projectId/:personId', updateProjectMemberRate);
router.delete('/:projectId/:personId', deleteProjectMemberRate);

export default router;
