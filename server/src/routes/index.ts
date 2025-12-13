import { Router } from 'express';
import roleRoutes from './roleRoutes';
import personRoutes from './personRoutes';
import projectRoutes from './projectRoutes';
import contractRoutes from './contractRoutes';
import projectWriteOffRoutes from './projectWriteOffRoutes';
import assignmentRoutes from './assignmentRoutes';
import vacationRoutes from './vacationRoutes';
import projectMemberRoutes from './projectMemberRoutes';
import projectMemberRateRoutes from './projectMemberRateRoutes';

const router = Router();

router.use('/roles', roleRoutes);
router.use('/people', personRoutes);
router.use('/projects', projectRoutes);
router.use('/contracts', contractRoutes);
router.use('/project-write-offs', projectWriteOffRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/vacations', vacationRoutes);
router.use('/project-members', projectMemberRoutes);
router.use('/project-member-rates', projectMemberRateRoutes);

export default router;
