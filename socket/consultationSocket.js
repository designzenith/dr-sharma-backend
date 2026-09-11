// module.exports = (io) => {
//   io.on("connection", (socket) => {
//     console.log("Socket connected:", socket.id);

//     socket.on("join-room", (roomId) => {
//       socket.join(roomId);

//       console.log(
//         `${socket.id} joined room ${roomId}`
//       );

//       socket.to(roomId).emit("user-joined");
//     });

//     socket.on(
//       "offer",
//       ({ roomId, offer }) => {
//         socket.to(roomId).emit(
//           "offer",
//           offer
//         );
//       }
//     );

//     socket.on(
//       "answer",
//       ({ roomId, answer }) => {
//         socket.to(roomId).emit(
//           "answer",
//           answer
//         );
//       }
//     );

//     socket.on(
//       "ice-candidate",
//       ({ roomId, candidate }) => {
//         socket.to(roomId).emit(
//           "ice-candidate",
//           candidate
//         );
//       }
//     );

//     socket.on(
//       "leave-room",
//       ({ roomId }) => {
//         socket.leave(roomId);

//         socket.to(roomId).emit(
//           "user-left"
//         );
//       }
//     );

//     socket.on("disconnect", () => {
//       console.log(
//         "Socket disconnected:",
//         socket.id
//       );
//     });
//   });
// };


const Appointment = require("../models/Appointment");

module.exports = (io) => {
  // Store active rooms temporarily in memory
  // roomId → { doctorSocketId, patientSocketId, startedAt }
  const activeRooms = new Map();

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // ==============================
    // JOIN ROOM
    // ==============================
    socket.on("join-room", async ({ roomId, userType, appointmentId }) => {
      try {
        if (!roomId || !userType) return;

        socket.join(roomId);
        socket.roomId = roomId;
        socket.userType = userType; // "doctor" or "patient"
        socket.appointmentId = appointmentId;

        console.log(`${userType} (${socket.id}) joined room ${roomId}`);

        // Initialize room tracking
        if (!activeRooms.has(roomId)) {
          activeRooms.set(roomId, {
            doctorSocketId: null,
            patientSocketId: null,
            startedAt: null,
          });
        }

        const room = activeRooms.get(roomId);

        if (userType === "doctor") {
          room.doctorSocketId = socket.id;
        } else if (userType === "patient") {
          room.patientSocketId = socket.id;
        }

        // Notify the other person
        socket.to(roomId).emit("user-joined", { userType });

        // Update database - who joined
        if (appointmentId) {
          const update = {};
          if (userType === "doctor") {
            update.doctorJoinedAt = new Date();
          } else {
            update.patientJoinedAt = new Date();
          }
          await Appointment.findByIdAndUpdate(appointmentId, update);
        }

      } catch (err) {
        console.error("join-room error:", err);
      }
    });

    // ==============================
    // CALL CONNECTED (both sides ready)
    // ==============================
    socket.on("call-connected", async ({ roomId, appointmentId }) => {
      try {
        const room = activeRooms.get(roomId);
        if (!room) return;

        // Only set startedAt once
        if (!room.startedAt) {
          room.startedAt = new Date();

          await Appointment.findByIdAndUpdate(appointmentId, {
            callStartedAt: room.startedAt,
            status: "In Progress",
          });

          console.log(`Call started in room ${roomId}`);
          io.to(roomId).emit("call-started", { startedAt: room.startedAt });
        }
      } catch (err) {
        console.error("call-connected error:", err);
      }
    });

    // ==============================
    // SIGNALING (keep your original)
    // ==============================
    socket.on("offer", ({ roomId, offer }) => {
      socket.to(roomId).emit("offer", offer);
    });

    socket.on("answer", ({ roomId, answer }) => {
      socket.to(roomId).emit("answer", answer);
    });

    socket.on("ice-candidate", ({ roomId, candidate }) => {
      socket.to(roomId).emit("ice-candidate", candidate);
    });

    // ==============================
    // LEAVE / END CALL
    // ==============================
    socket.on("leave-room", async ({ roomId, appointmentId }) => {
      await endCall(socket, roomId, appointmentId);
    });

    socket.on("disconnect", async () => {
      if (socket.roomId) {
        await endCall(socket, socket.roomId, socket.appointmentId);
      }
      console.log("Socket disconnected:", socket.id);
    });
  });

  // ==============================
  // Helper: End Call + Calculate Duration
  // ==============================
  async function endCall(socket, roomId, appointmentId) {
    try {
      socket.leave(roomId);
      socket.to(roomId).emit("user-left", { userType: socket.userType });

      const room = activeRooms.get(roomId);
      if (!room) return;

      // Clear this user's socket
      if (socket.userType === "doctor") {
        room.doctorSocketId = null;
      } else {
        room.patientSocketId = null;
      }

      // If both have left → end the call
      if (!room.doctorSocketId && !room.patientSocketId) {
        if (room.startedAt && appointmentId) {
          const endedAt = new Date();
          const durationInSeconds = Math.floor(
            (endedAt - room.startedAt) / 1000
          );
          const durationInMinutes = Math.ceil(durationInSeconds / 60);

          await Appointment.findByIdAndUpdate(appointmentId, {
            callEndedAt: endedAt,
            duration: durationInMinutes,
            status: "Completed",
          });

          console.log(
            `Call ended in room ${roomId}. Duration: ${durationInMinutes} min`
          );
        }

        activeRooms.delete(roomId);
      }
    } catch (err) {
      console.error("endCall error:", err);
    }
  }
};