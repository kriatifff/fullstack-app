import { Request, Response } from 'express';
import prisma from '../prisma';

export const createContract = async (req: Request, res: Response) => {
  try {
    const contract = await prisma.contract.create({
      data: req.body,
    });
    res.status(201).json(contract);
  } catch (error: any) {
    if (error.code === 'P2003') { // Foreign key constraint failed (e.g., projectId not found)
      return res.status(400).json({ message: 'Invalid projectId provided.' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getContracts = async (req: Request, res: Response) => {
  try {
    const contracts = await prisma.contract.findMany();
    res.status(200).json(contracts);
  }
  catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getContractById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contract = await prisma.contract.findUnique({
      where: { id },
    });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    res.status(200).json(contract);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateContract = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedContract = await prisma.contract.update({
      where: { id },
      data: req.body,
    });
    res.status(200).json(updatedContract);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Contract not found' });
    }
    if (error.code === 'P2003') { // Foreign key constraint failed
      return res.status(400).json({ message: 'Invalid projectId provided.' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteContract = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.contract.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Contract not found' });
    }
    res.status(500).json({ error: error.message });
  }
};
