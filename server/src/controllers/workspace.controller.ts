import { Response } from "express";
import { query } from "../db";
import { AuthRequest } from "../middleware/auth";

export const createWorkspace = async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  const userId = req.userId!;
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  try {
    const result = await query(
      "INSERT INTO workspaces (name, owner_id) VALUES ($1, $2) RETURNING *",
      [name, userId]
    );
    const workspace = result.rows[0];
    await query(
      "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'admin')",
      [workspace.id, userId]
    );
    res.status(201).json(workspace);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const getWorkspaces = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  try {
    const result = await query(
      `SELECT 
        w.*,
        COUNT(DISTINCT wm.user_id)::int AS member_count,
        COUNT(DISTINCT b.id)::int AS board_count
       FROM workspaces w
       INNER JOIN workspace_members wm ON wm.workspace_id = w.id
       LEFT JOIN boards b ON b.workspace_id = w.id
       WHERE wm.user_id = $1
       GROUP BY w.id
       ORDER BY w.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const getWorkspace = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  try {
    const member = await query(
      "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [id, userId]
    );
    if (member.rows.length === 0) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    const result = await query("SELECT * FROM workspaces WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Workspace not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const inviteMember = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  const { email, role = "member" } = req.body;
  try {
    const admin = await query(
      "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [id, userId]
    );
    if (admin.rows[0]?.role !== "admin") {
      res.status(403).json({ error: "Only admins can invite members" });
      return;
    }
    const invitee = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (invitee.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    await query(
      "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [id, invitee.rows[0].id, role]
    );
    res.json({ message: "Member added" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const updateWorkspace = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  const { name } = req.body;
  try {
    const admin = await query(
      "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [id, userId]
    );
    if (admin.rows[0]?.role !== "admin") {
      res.status(403).json({ error: "Only admins can rename this workspace" });
      return;
    }
    const result = await query(
      "UPDATE workspaces SET name = $1 WHERE id = $2 RETURNING *",
      [name, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteWorkspace = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  try {
    const admin = await query(
      "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [id, userId]
    );
    if (admin.rows[0]?.role !== "admin") {
      res.status(403).json({ error: "Only admins can delete this workspace" });
      return;
    }
    await query("DELETE FROM workspaces WHERE id = $1", [id]);
    res.json({ message: "Workspace deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const getMembers = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  try {
    const member = await query(
      "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [id, userId]
    );
    if (member.rows.length === 0) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    const result = await query(
      `SELECT u.id, u.name, u.email, wm.role, wm.joined_at
       FROM workspace_members wm
       INNER JOIN users u ON u.id = wm.user_id
       WHERE wm.workspace_id = $1
       ORDER BY wm.role ASC, u.name ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const removeMember = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id, memberId } = req.params;
  try {
    const admin = await query(
      "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [id, userId]
    );
    if (admin.rows[0]?.role !== "admin") {
      res.status(403).json({ error: "Only admins can remove members" });
      return;
    }
    if (Number(memberId) === userId) {
      res.status(400).json({ error: "You cannot remove yourself" });
      return;
    }
    await query(
      "DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [id, memberId]
    );
    res.json({ message: "Member removed" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const leaveWorkspace = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  try {
    const member = await query(
      "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [id, userId]
    );
    if (member.rows.length === 0) {
      res.status(404).json({ error: "Not a member" });
      return;
    }
    if (member.rows[0].role === "admin") {
      const otherAdmins = await query(
        "SELECT id FROM workspace_members WHERE workspace_id = $1 AND role = 'admin' AND user_id != $2",
        [id, userId]
      );
      if (otherAdmins.rows.length === 0) {
        res.status(400).json({ error: "You are the only admin. Assign another admin before leaving." });
        return;
      }
    }
    await query(
      "DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [id, userId]
    );
    res.json({ message: "Left workspace" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};