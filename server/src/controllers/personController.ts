import { Request, Response } from 'express';
import prisma from '../prisma';

export const createPerson = async (req: Request, res: Response) => {
  try {
    const person = await prisma.person.create({
      data: req.body,
    });
    res.status(201).json(person);
  } catch (error: any) {
    if (error.code === 'P2003') { // Foreign key constraint failed (e.g., roleName not found)
      return res.status(400).json({ message: 'Invalid roleName provided.' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getPeople = async (req: Request, res: Response) => {
  try {
    const people = await prisma.person.findMany();
    res.status(200).json(people);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPersonById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const person = await prisma.person.findUnique({
      where: { id },
    });
    if (!person) {
      return res.status(404).json({ message: 'Person not found' });
    }
    res.status(200).json(person);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePerson = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedPerson = await prisma.person.update({
      where: { id },
      data: req.body,
    });
    res.status(200).json(updatedPerson);
  } catch (error: any) {
    if (error.code === 'P2025') { // Record not found
      return res.status(404).json({ message: 'Person not found' });
    }
    if (error.code === 'P2003') { // Foreign key constraint failed
      return res.status(400).json({ message: 'Invalid roleName provided.' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deletePerson = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.person.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') { // Record not found
      return res.status(404).json({ message: 'Person not found' });
    }
    res.status(500).json({ error: error.message });
  }
};
