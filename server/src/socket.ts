import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyAccessToken } from "./utils/jwt";

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      next(new Error("No token provided"));
      return;
    }
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User ${socket.data.userId} connected`);

    socket.on("join:board", (boardId: number) => {
      socket.join(`board:${boardId}`);
      console.log(`User ${socket.data.userId} joined board ${boardId}`);
    });

    socket.on("leave:board", (boardId: number) => {
      socket.leave(`board:${boardId}`);
    });

    socket.on("card:moved", (data: {
      cardId: number;
      columnId: number;
      position: number;
      boardId: number;
    }) => {
      socket.to(`board:${data.boardId}`).emit("card:moved", {
        ...data,
        movedBy: socket.data.userId,
      });
    });

    socket.on("card:created", (data: {
      card: object;
      boardId: number;
    }) => {
      socket.to(`board:${data.boardId}`).emit("card:created", {
        ...data,
        createdBy: socket.data.userId,
      });
    });

    socket.on("card:updated", (data: {
      card: object;
      boardId: number;
    }) => {
      socket.to(`board:${data.boardId}`).emit("card:updated", {
        ...data,
        updatedBy: socket.data.userId,
      });
    });

    socket.on("card:deleted", (data: {
      cardId: number;
      boardId: number;
    }) => {
      socket.to(`board:${data.boardId}`).emit("card:deleted", {
        ...data,
        deletedBy: socket.data.userId,
      });
    });

    socket.on("column:created", (data: {
      column: object;
      boardId: number;
    }) => {
      socket.to(`board:${data.boardId}`).emit("column:created", data);
    });

    socket.on("disconnect", () => {
      console.log(`User ${socket.data.userId} disconnected`);
    });
  });

  return io;
};