import { Response } from "express";
import { query } from "../db";
import { AuthRequest } from "../middleware/auth";

const isMember = async (workspaceId: number, userId: number) => {
  const result = await query(
    "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
    [workspaceId, userId]
  );
  return result.rows[0] || null;
};

export const createBoard = async (req: AuthRequest, res: Response) => {
  const { name, workspace_id } = req.body;
  const userId = req.userId!;
  if (!name || !workspace_id) {
    res.status(400).json({ error: "Name and workspace_id are required" });
    return;
  }
  try {
    const member = await isMember(workspace_id, userId);
    if (!member) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    const result = await query(
      "INSERT INTO boards (name, workspace_id) VALUES ($1, $2) RETURNING *",
      [name, workspace_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const getBoards = async (req: AuthRequest, res: Response) => {
  const { workspaceId } = req.params;
  const userId = req.userId!;
  try {
    const member = await isMember(Number(workspaceId), userId);
    if (!member) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    const result = await query(
      "SELECT * FROM boards WHERE workspace_id = $1 ORDER BY created_at DESC",
      [workspaceId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const getBoard = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId!;
  try {
    const board = await query("SELECT * FROM boards WHERE id = $1", [id]);
    if (board.rows.length === 0) {
      res.status(404).json({ error: "Board not found" });
      return;
    }
    const member = await isMember(board.rows[0].workspace_id, userId);
    if (!member) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    const columns = await query(
      "SELECT * FROM columns WHERE board_id = $1 ORDER BY position ASC",
      [id]
    );
    const cards = await query(
      `SELECT c.* FROM cards c
       INNER JOIN columns col ON col.id = c.column_id
       WHERE col.board_id = $1
       ORDER BY c.position ASC`,
      [id]
    );
    res.json({
      ...board.rows[0],
      columns: columns.rows.map((col) => ({
        ...col,
        cards: cards.rows.filter((card) => card.column_id === col.id),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const updateBoard = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.userId!;
  try {
    const board = await query("SELECT * FROM boards WHERE id = $1", [id]);
    if (board.rows.length === 0) {
      res.status(404).json({ error: "Board not found" });
      return;
    }
    const member = await query(
      "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [board.rows[0].workspace_id, userId]
    );
    if (member.rows[0]?.role !== "admin") {
      res.status(403).json({ error: "Only admins can rename boards" });
      return;
    }
    const result = await query(
      "UPDATE boards SET name = $1 WHERE id = $2 RETURNING *",
      [name, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteBoard = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId!;
  try {
    const board = await query("SELECT * FROM boards WHERE id = $1", [id]);
    if (board.rows.length === 0) {
      res.status(404).json({ error: "Board not found" });
      return;
    }
    const member = await query(
      "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [board.rows[0].workspace_id, userId]
    );
    if (member.rows[0]?.role !== "admin") {
      res.status(403).json({ error: "Only admins can delete boards" });
      return;
    }
    await query("DELETE FROM boards WHERE id = $1", [id]);
    res.json({ message: "Board deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};