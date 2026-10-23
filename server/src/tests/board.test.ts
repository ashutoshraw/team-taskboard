import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app";
import { query } from "../db";
import pool from "../db";

let accessToken: string;
let workspaceId: number;
let boardId: number;
let columnId: number;
let cardId: number;

beforeAll(async () => {
  await query("DELETE FROM users WHERE email = $1", ["boardtest@example.com"]);
  const res = await request(app).post("/api/auth/register").send({
    email: "boardtest@example.com",
    name: "Board Test User",
    password: "password123",
  });
  accessToken = res.body.accessToken;

  const ws = await request(app)
    .post("/api/workspaces")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ name: "Test Workspace" });
  workspaceId = ws.body.id;
});

afterAll(async () => {
  await query("DELETE FROM users WHERE email = $1", ["boardtest@example.com"]);
  await pool.end();
});

describe("POST /api/boards", () => {
  it("should create a board", async () => {
    const res = await request(app)
      .post("/api/boards")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Test Board", workspace_id: workspaceId });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Test Board");
    boardId = res.body.id;
  });
});

describe("GET /api/boards/:id", () => {
  it("should return a board with columns and cards", async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("columns");
  });
});

describe("POST /api/boards/columns", () => {
  it("should create a column", async () => {
    const res = await request(app)
      .post("/api/boards/columns")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "To Do", board_id: boardId });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("To Do");
    columnId = res.body.id;
  });
});

describe("POST /api/boards/cards", () => {
  it("should create a card", async () => {
    const res = await request(app)
      .post("/api/boards/cards")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Test Card", column_id: columnId });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Test Card");
    cardId = res.body.id;
  });
});

describe("PUT /api/boards/cards/:id", () => {
  it("should update a card", async () => {
    const res = await request(app)
      .put(`/api/boards/cards/${cardId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Updated Card" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated Card");
  });
});

describe("GET /api/boards/cards/:id/activity", () => {
  it("should return card activity", async () => {
    const res = await request(app)
      .get(`/api/boards/cards/${cardId}/activity`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("DELETE /api/boards/cards/:id", () => {
  it("should delete a card", async () => {
    const res = await request(app)
      .delete(`/api/boards/cards/${cardId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
  });
});