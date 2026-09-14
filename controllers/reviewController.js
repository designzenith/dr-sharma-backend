const Review = require("../models/Review");
const Doctor = require("../models/Doctor");

// =====================================================
// GET /api/reviews/doctor
// =====================================================
exports.getDoctorReviews = async (req, res) => {
  try {
    const doctorUserId = req.user.id || req.user._id;

    const doctor = await Doctor.findOne({ user: doctorUserId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const reviews = await Review.find({ doctor: doctor._id })
      .populate("patient", "name")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = reviews.map((r) => ({
      _id: r._id,
      patientName: r.patient?.name || "Anonymous Patient",
      patientId: r.patient?._id || r.patient,
      rating: r.rating,
      comment: r.comment || "",
      isPublic: r.isPublic,
      appointmentId: r.appointment,
      createdAt: r.createdAt,
    }));

    res.json({
      success: true,
      reviews: formatted,
    });
  } catch (error) {
    console.error("getDoctorReviews error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch reviews",
    });
  }
};

// =====================================================
// POST /api/reviews  (patient submits a review)
// =====================================================
exports.createReview = async (req, res) => {
  try {
    const patientId = req.user.id || req.user._id;
    const { doctorId, appointmentId, rating, comment, isPublic } = req.body;

    if (!doctorId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Doctor and rating are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const review = await Review.create({
      doctor: doctorId,
      patient: patientId,
      appointment: appointmentId || undefined,
      rating,
      comment: comment || "",
      isPublic: isPublic !== false,
    });

    res.status(201).json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("createReview error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to create review",
    });
  }
};