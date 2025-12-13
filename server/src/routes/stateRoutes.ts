import { Router } from "express";
import { getState, saveState } from "../controllers/stateController";

const router = Router();

router.get("/", getState);
router.post("/", saveState);

export default router;
