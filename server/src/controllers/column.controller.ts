import { Response } from "express";
import { query } from "../db";
import { AuthRequest } from "../middleware/auth";

export const createColumn = async (req: AuthRequest, res: Response) => {
  const { name, board_id } = req.body;
  if (!name || !board_id) {
    res.status(400).json({ error: "Name and board_id are required" });
    return;
  }
  try {
    const countResult = await query(
      "SELECT COUNT(*) FROM columns WHERE board_id = $1",
      [board_id]
    );
    const position = Number(countResult.rows[0].count);
    const result = await query(
      "INSERT INTO columns (name, board_id, position) VALUES ($1, $2, $3) RETURNING *",
      [name, board_id, position]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const updateColumn = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const result = await query(
      "UPDATE columns SET name = $1 WHERE id = $2 RETURNING *",
      [name, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Column not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteColumn = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await query("DELETE FROM columns WHERE id = $1", [id]);
    res.json({ message: "Column deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};