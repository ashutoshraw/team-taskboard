import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  inviteMember,
  updateWorkspace,
  deleteWorkspace,
} from "../controllers/workspace.controller";

const router = Router();

router.use(authenticate);

router.post("/", createWorkspace);
router.get("/", getWorkspaces);
router.get("/:id", getWorkspace);
router.put("/:id", updateWorkspace);
router.delete("/:id", deleteWorkspace);
router.post("/:id/invite", inviteMember);

export default router;