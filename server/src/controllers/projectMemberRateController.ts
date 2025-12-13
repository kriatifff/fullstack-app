import { Request, Response } from 'express';
import prisma from '../prisma';

export const createProjectMemberRate = async (req: Request, res: Response) => {
  try {
    const { projectId, personId, rate } = req.body;
    const projectMemberRate = await prisma.projectMemberRate.create({
      data: { projectId, personId, rate },
    });
    res.status(201).json(projectMemberRate);
  } catch (error: any) {
    if (error.code === 'P2002') { // Unique constraint failed (rate already exists for this pair)
      return res.status(409).json({ message: 'Rate for this person on this project already exists. Use PUT to update.' });
    }
    if (error.code === 'P2003') { // Foreign key constraint failed
      return res.status(400).json({ message: 'Invalid projectId or personId provided.' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getProjectMemberRates = async (req: Request, res: Response) => {
  try {
    const projectMemberRates = await prisma.projectMemberRate.findMany();
    res.status(200).json(projectMemberRates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProjectMemberRateByIds = async (req: Request, res: Response) => {
  try {
    const { projectId, personId } = req.params;
    const projectMemberRate = await prisma.projectMemberRate.findUnique({
      where: { projectId_personId: { projectId, personId } },
    });
    if (!projectMemberRate) {
      return res.status(404).json({ message: 'Project member rate not found' });
    }
    res.status(200).json(projectMemberRate);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProjectMemberRate = async (req: Request, res: Response) => {
  try {
    const { projectId, personId } = req.params;
    const { rate } = req.body;
    const updatedProjectMemberRate = await prisma.projectMemberRate.update({
      where: { projectId_personId: { projectId, personId } },
      data: { rate },
    });
    res.status(200).json(updatedProjectMemberRate);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Project member rate not found' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid projectId or personId provided.' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteProjectMemberRate = async (req: Request, res: Response) => {
  try {
    const { projectId, personId } = req.params;
    await prisma.projectMemberRate.delete({
      where: { projectId_personId: { projectId, personId } },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Project member rate not found' });
    }
    res.status(500).json({ error: error.message });
  }
};
