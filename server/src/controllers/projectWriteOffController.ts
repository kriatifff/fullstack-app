import { Request, Response } from 'express';
import prisma from '../prisma';

export const createProjectWriteOff = async (req: Request, res: Response) => {
  try {
    const writeOff = await prisma.projectWriteOff.create({
      data: req.body,
    });
    res.status(201).json(writeOff);
  } catch (error: any) {
    if (error.code === 'P2003') { // Foreign key constraint failed
      return res.status(400).json({ message: 'Invalid projectId or personId provided.' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getProjectWriteOffs = async (req: Request, res: Response) => {
  try {
    const writeOffs = await prisma.projectWriteOff.findMany();
    res.status(200).json(writeOffs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProjectWriteOffById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const writeOff = await prisma.projectWriteOff.findUnique({
      where: { id },
    });
    if (!writeOff) {
      return res.status(404).json({ message: 'ProjectWriteOff not found' });
    }
    res.status(200).json(writeOff);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProjectWriteOff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedWriteOff = await prisma.projectWriteOff.update({
      where: { id },
      data: req.body,
    });
    res.status(200).json(updatedWriteOff);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'ProjectWriteOff not found' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid projectId or personId provided.' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteProjectWriteOff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.projectWriteOff.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'ProjectWriteOff not found' });
    }
    res.status(500).json({ error: error.message });
  }
};
