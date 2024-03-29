import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import Message from "./database/messageSchema.js";

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: "GET,POST",
    credentials: true,
  },
});

const mongoDBAtlasUri =
  "mongodb+srv://ahmed2007:JUJmMMvvE1MbHju9@cluster0.gkrwha3.mongodb.net/?retryWrites=true&w=majority";
mongoose
  .connect(mongoDBAtlasUri)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => console.error("Error connecting to MongoDB Atlas:", err));

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  socket.on("join_room", (data) => {
    socket.join(data);
    socket.emit("joined", `user_joined ${data}`);
  });

  socket.on("send_message", (data) => {
    socket.to(data.id).emit("reseve_message", data);
    const newUser = new Message({ ...data });
    newUser
      .save()
      .then(() => console.log("message saved"))
      .catch((err) => console.error("Error creating user:", err));
  });

  socket.on("fetch_messages", async (room) => {
    Message.find({ id: room })
      .then((messages) => {
        socket.emit("display_messages", messages);
      })
      .catch((err) => console.error("Error", err));
  });

  socket.on("typing", (id) => {
    socket.to(id).emit("user_typing", "user typing");
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
