import { Response } from "express";
import { query } from "../db";
import { AuthRequest } from "../middleware/auth";

export const createCard = async (req: AuthRequest, res: Response) => {
  const { title, column_id, description, assignee_id, due_date } = req.body;
  const userId = req.userId!;
  if (!title || !column_id) {
    res.status(400).json({ error: "Title and column_id are required" });
    return;
  }
  try {
    const countResult = await query(
      "SELECT COUNT(*) FROM cards WHERE column_id = $1",
      [column_id]
    );
    const position = Number(countResult.rows[0].count);
    const result = await query(
      `INSERT INTO cards (title, column_id, description, assignee_id, due_date, position)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, column_id, description || null, assignee_id || null, due_date || null, position]
    );
    const card = result.rows[0];
    await query(
      "INSERT INTO activity_logs (card_id, user_id, action) VALUES ($1, $2, $3)",
      [card.id, userId, "created this card"]
    );
    res.status(201).json(card);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const updateCard = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, assignee_id, due_date, column_id, position } = req.body;
  const userId = req.userId!;
  try {
    const current = await query("SELECT * FROM cards WHERE id = $1", [id]);
    if (current.rows.length === 0) {
      res.status(404).json({ error: "Card not found" });
      return;
    }
    const result = await query(
      `UPDATE cards SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        assignee_id = COALESCE($3, assignee_id),
        due_date = COALESCE($4, due_date),
        column_id = COALESCE($5, column_id),
        position = COALESCE($6, position)
       WHERE id = $7 RETURNING *`,
      [title, description, assignee_id, due_date, column_id, position, id]
    );
    const updated = result.rows[0];
    if (column_id && column_id !== current.rows[0].column_id) {
      await query(
        "INSERT INTO activity_logs (card_id, user_id, action) VALUES ($1, $2, $3)",
        [id, userId, "moved this card"]
      );
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteCard = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await query("DELETE FROM cards WHERE id = $1", [id]);
    res.json({ message: "Card deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const getCardActivity = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT al.*, u.name as user_name FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.card_id = $1
       ORDER BY al.created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};