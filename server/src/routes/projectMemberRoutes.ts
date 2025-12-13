import { Router } from 'express';
import { createProjectMember, getProjectMembers, getProjectMemberByIds, deleteProjectMember } from '../controllers/projectMemberController';

const router = Router();

router.post('/', createProjectMember);
router.get('/', getProjectMembers);
router.get('/:projectId/:personId', getProjectMemberByIds);
// Update is not directly supported for ProjectMember as it's a join table, only create/delete for association
router.delete('/:projectId/:personId', deleteProjectMember);

export default router;
