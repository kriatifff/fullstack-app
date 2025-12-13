import { Request, Response } from 'express';
import prisma from '../prisma';

export const createRole = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const role = await prisma.role.create({
      data: { name },
    });
    res.status(201).json(role);
  } catch (error: any) {
    if (error.code === 'P2002') { // Unique constraint failed
      return res.status(409).json({ message: 'Role with this name already exists.' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany();
    res.status(200).json(roles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getRoleByName = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const role = await prisma.role.findUnique({
      where: { name },
    });
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.status(200).json(role);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const { name } = req.params; // Old name
    const { newName } = req.body; // New name
    const updatedRole = await prisma.role.update({
      where: { name },
      data: { name: newName },
    });
    res.status(200).json(updatedRole);
  } catch (error: any) {
    if (error.code === 'P2025') { // Record not found
      return res.status(404).json({ message: 'Role not found' });
    }
    if (error.code === 'P2002') { // Unique constraint failed
      return res.status(409).json({ message: 'Role with this new name already exists.' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    await prisma.role.delete({
      where: { name },
    });
    res.status(204).send(); // No content
  } catch (error: any) {
    if (error.code === 'P2025') { // Record not found
      return res.status(404).json({ message: 'Role not found' });
    }
    res.status(500).json({ error: error.message });
  }
};
