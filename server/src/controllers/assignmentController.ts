import { Request, Response } from 'express';
import prisma from '../prisma';

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await prisma.assignment.create({
      data: req.body,
    });
    res.status(201).json(assignment);
  } catch (error: any) {
    if (error.code === 'P2003') { // Foreign key constraint failed
      return res.status(400).json({ message: 'Invalid projectId or personId provided.' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.assignment.findMany();
    res.status(200).json(assignments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAssignmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await prisma.assignment.findUnique({
      where: { id },
    });
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.status(200).json(assignment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: req.body,
    });
    res.status(200).json(updatedAssignment);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid projectId or personId provided.' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.assignment.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.status(500).json({ error: error.message });
  }
};
