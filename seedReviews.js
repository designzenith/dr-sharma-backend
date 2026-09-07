require("dotenv").config();
const mongoose = require("mongoose");
const Review = require("./models/Review");
const Doctor = require("./models/Doctor");

async function seedReviews() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Get any one doctor from database
    const doctor = await Doctor.findOne();

    if (!doctor) {
      console.log("No doctor found. Please add a doctor first.");
      process.exit(1);
    }

    console.log("Using doctor:", doctor.name, doctor._id);

    // 2. Dummy reviews
    const dummyReviews = [
      {
        doctor: doctor._id,
        patientName: "Ankit S.",
        rating: 5,
        review:
          "Video consultation was smooth, doctor explained everything clearly and prescription came in minutes.",
      },
      {
        doctor: doctor._id,
        patientName: "Priya M.",
        rating: 5,
        review:
          "Very patient and thorough. Didn't feel rushed even on a video call.",
      },
      {
        doctor: doctor._id,
        patientName: "Sanjay R.",
        rating: 4,
        review: "Good experience overall, audio call quality was clear.",
      },
      {
        doctor: doctor._id,
        patientName: "Neelam K.",
        rating: 5,
        review: "Booked an evening slot and got connected right on time.",
      },
    ];

    // 3. Insert reviews
    await Review.insertMany(dummyReviews);

    console.log("✅ Dummy reviews added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

seedReviews();