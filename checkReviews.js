require("dotenv").config();
const mongoose = require("mongoose");
const Review = require("./models/Review");

async function checkReviews() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const reviews = await Review.find().populate("doctor", "name");
    
    console.log("\n========== REVIEWS ==========");
    console.log(reviews);
    console.log("Total reviews:", reviews.length);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkReviews();