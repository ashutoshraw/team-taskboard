export type Role = "admin" | "member";

export interface User {
  id: number;
  email: string;
  name: string;
}