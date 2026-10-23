import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app";
import { query } from "../db";
import pool from "../db";

let accessToken: string;
let workspaceId: number;

beforeAll(async () => {
  await query("DELETE FROM users WHERE email = $1", ["wstest@example.com"]);
  const res = await request(app).post("/api/auth/register").send({
    email: "wstest@example.com",
    name: "WS Test User",
    password: "password123",
  });
  accessToken = res.body.accessToken;
});

afterAll(async () => {
  await query("DELETE FROM users WHERE email = $1", ["wstest@example.com"]);
  await pool.end();
});

describe("POST /api/workspaces", () => {
  it("should create a workspace", async () => {
    const res = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Test Workspace" });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Test Workspace");
    workspaceId = res.body.id;
  });

  it("should reject request without token", async () => {
    const res = await request(app)
      .post("/api/workspaces")
      .send({ name: "Test Workspace" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/workspaces", () => {
  it("should return user workspaces", async () => {
    const res = await request(app)
      .get("/api/workspaces")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe("GET /api/workspaces/:id", () => {
  it("should return a single workspace", async () => {
    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(workspaceId);
  });
});