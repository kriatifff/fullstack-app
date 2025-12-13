import { Request, Response } from "express";
import prisma from "../prisma";

const STATE_ID = "default";

export const getState = async (_req: Request, res: Response) => {
  try {
    const row = await prisma.appState.findUnique({ where: { id: STATE_ID } });
    // Возвращаем ровно data, чтобы фронту было удобно
    res.status(200).json(row?.data ?? null);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const saveState = async (req: Request, res: Response) => {
  try {
    // Примем любое JSON-тело и положим как data
    const data = req.body;

    const row = await prisma.appState.upsert({
      where: { id: STATE_ID },
      create: { id: STATE_ID, data },
      update: { data },
    });

    res.status(200).json(row.data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};
