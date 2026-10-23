import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  inviteMember,
} from "../controllers/workspace.controller";

const router = Router();

router.use(authenticate);

router.post("/", createWorkspace);
router.get("/", getWorkspaces);
router.get("/:id", getWorkspace);
router.post("/:id/invite", inviteMember);

export default router;