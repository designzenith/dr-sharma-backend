module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join-room", (roomId) => {
      socket.join(roomId);

      console.log(
        `${socket.id} joined room ${roomId}`
      );

      socket.to(roomId).emit("user-joined");
    });

    socket.on(
      "offer",
      ({ roomId, offer }) => {
        socket.to(roomId).emit(
          "offer",
          offer
        );
      }
    );

    socket.on(
      "answer",
      ({ roomId, answer }) => {
        socket.to(roomId).emit(
          "answer",
          answer
        );
      }
    );

    socket.on(
      "ice-candidate",
      ({ roomId, candidate }) => {
        socket.to(roomId).emit(
          "ice-candidate",
          candidate
        );
      }
    );

    socket.on(
      "leave-room",
      ({ roomId }) => {
        socket.leave(roomId);

        socket.to(roomId).emit(
          "user-left"
        );
      }
    );

    socket.on("disconnect", () => {
      console.log(
        "Socket disconnected:",
        socket.id
      );
    });
  });
};