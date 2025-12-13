import { Request, Response } from 'express';
import prisma from '../prisma';

export const createProjectMember = async (req: Request, res: Response) => {
  try {
    const { projectId, personId } = req.body;
    const projectMember = await prisma.projectMember.create({
      data: { projectId, personId },
    });
    res.status(201).json(projectMember);
  } catch (error: any) {
    if (error.code === 'P2002') { // Unique constraint failed (already a member)
      return res.status(409).json({ message: 'Person is already a member of this project.' });
    }
    if (error.code === 'P2003') { // Foreign key constraint failed
      return res.status(400).json({ message: 'Invalid projectId or personId provided.' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getProjectMembers = async (req: Request, res: Response) => {
  try {
    const projectMembers = await prisma.projectMember.findMany();
    res.status(200).json(projectMembers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProjectMemberByIds = async (req: Request, res: Response) => {
  try {
    const { projectId, personId } = req.params;
    const projectMember = await prisma.projectMember.findUnique({
      where: { projectId_personId: { projectId, personId } },
    });
    if (!projectMember) {
      return res.status(404).json({ message: 'Project member not found' });
    }
    res.status(200).json(projectMember);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProjectMember = async (req: Request, res: Response) => {
  try {
    const { projectId, personId } = req.params;
    await prisma.projectMember.delete({
      where: { projectId_personId: { projectId, personId } },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Project member not found' });
    }
    res.status(500).json({ error: error.message });
  }
};
