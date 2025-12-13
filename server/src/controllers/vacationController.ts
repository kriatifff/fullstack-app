import { Request, Response } from 'express';
import prisma from '../prisma';

export const createVacation = async (req: Request, res: Response) => {
  try {
    const vacation = await prisma.vacation.create({
      data: req.body,
    });
    res.status(201).json(vacation);
  } catch (error: any) {
    if (error.code === 'P2003') { // Foreign key constraint failed
      return res.status(400).json({ message: 'Invalid personId provided.' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getVacations = async (req: Request, res: Response) => {
  try {
    const vacations = await prisma.vacation.findMany();
    res.status(200).json(vacations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getVacationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vacation = await prisma.vacation.findUnique({
      where: { id },
    });
    if (!vacation) {
      return res.status(404).json({ message: 'Vacation not found' });
    }
    res.status(200).json(vacation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateVacation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedVacation = await prisma.vacation.update({
      where: { id },
      data: req.body,
    });
    res.status(200).json(updatedVacation);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Vacation not found' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid personId provided.' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteVacation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.vacation.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Vacation not found' });
    }
    res.status(500).json({ error: error.message });
  }
};
