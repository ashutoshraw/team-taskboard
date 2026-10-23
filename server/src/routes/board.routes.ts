import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { createBoard, getBoards, getBoard } from "../controllers/board.controller";
import { createColumn, updateColumn, deleteColumn } from "../controllers/column.controller";
import { createCard, updateCard, deleteCard, getCardActivity } from "../controllers/card.controller";

const router = Router();

router.use(authenticate);

router.post("/", createBoard);
router.get("/workspace/:workspaceId", getBoards);
router.get("/:id", getBoard);

router.post("/columns", createColumn);
router.put("/columns/:id", updateColumn);
router.delete("/columns/:id", deleteColumn);

router.post("/cards", createCard);
router.put("/cards/:id", updateCard);
router.delete("/cards/:id", deleteCard);
router.get("/cards/:id/activity", getCardActivity);

export default router;