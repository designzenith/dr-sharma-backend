const Review = require("../models/Review");
const Doctor = require("../models/Doctor");

// =====================================================
// GET DOCTOR REVIEWS
// GET /api/reviews/doctor
// =====================================================

exports.getDoctorReviews = async (req, res) => {
  try {
    const doctorUserId = req.user?.id || req.user?._id;

    if (!doctorUserId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found",
      });
    }

    const doctor = await Doctor.findOne({
      user: doctorUserId,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const reviews = await Review.find({
      doctor: doctor._id,
    })
      .populate("patient", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    const formattedReviews = reviews.map((review) => ({
      _id: review._id,

      patientName:
        review.patient?.name || "Anonymous Patient",

      patientId:
        review.patient?._id || review.patient || null,

      rating: Number(review.rating) || 0,

      comment: review.comment || "",

      isPublic: review.isPublic !== false,

      appointmentId:
        review.appointment || null,

      createdAt: review.createdAt,

      updatedAt: review.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      count: formattedReviews.length,
      reviews: formattedReviews,
    });
  } catch (error) {
    console.error("Get Doctor Reviews Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor reviews",
      error: error.message,
    });
  }
};


// =====================================================
// CREATE REVIEW
// POST /api/reviews
// =====================================================

exports.createReview = async (req, res) => {
  try {
    const patientId = req.user?.id || req.user?._id;

    if (!patientId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found",
      });
    }

    const {
      doctorId,
      appointmentId,
      rating,
      comment,
      isPublic,
    } = req.body;

    // -------------------------------------------------
    // Validation
    // -------------------------------------------------

    if (!doctorId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Doctor and rating are required",
      });
    }

    const numericRating = Number(rating);

    if (
      Number.isNaN(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // -------------------------------------------------
    // Check Doctor
    // -------------------------------------------------

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // -------------------------------------------------
    // Create Review
    // -------------------------------------------------

    const review = await Review.create({
      doctor: doctorId,

      patient: patientId,

      appointment:
        appointmentId || undefined,

      rating: numericRating,

      comment: comment || "",

      isPublic: isPublic !== false,
    });

    // -------------------------------------------------
    // Populate
    // -------------------------------------------------

    await review.populate([
      {
        path: "patient",
        select: "name email phone",
      },
      {
        path: "doctor",
        select: "name email",
      },
      {
        path: "appointment",
        select:
          "appointmentDate appointmentTime consultationType status",
      },
    ]);

    return res.status(201).json({
      success: true,
      message: "Review added successfully",
      review,
    });
  } catch (error) {
    console.error("Create Review Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create review",
      error: error.message,
    });
  }
};


// =====================================================
// ADMIN - GET ALL REVIEWS
// GET /api/admin/reviews
// =====================================================

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate(
        "patient",
        "name email phone"
      )
      .populate(
        "doctor",
        "name email"
      )
      .populate(
        "appointment",
        "appointmentDate appointmentTime consultationType status"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    // -------------------------------------------------
    // Format Reviews
    // -------------------------------------------------

    const formattedReviews = reviews.map(
      (review) => ({
        _id: review._id,

        patient: {
          _id:
            review.patient?._id ||
            null,

          name:
            review.patient?.name ||
            "Anonymous Patient",

          email:
            review.patient?.email ||
            "",

          phone:
            review.patient?.phone ||
            "",
        },

        doctor: {
          _id:
            review.doctor?._id ||
            null,

          name:
            review.doctor?.name ||
            "Doctor",

          email:
            review.doctor?.email ||
            "",
        },

        appointment: {
          _id:
            review.appointment?._id ||
            review.appointment ||
            null,

          appointmentDate:
            review.appointment
              ?.appointmentDate ||
            null,

          appointmentTime:
            review.appointment
              ?.appointmentTime ||
            "",

          consultationType:
            review.appointment
              ?.consultationType ||
            "",

          status:
            review.appointment?.status ||
            "",
        },

        rating:
          Number(review.rating) || 0,

        comment:
          review.comment || "",

        isPublic:
          review.isPublic !== false,

        createdAt:
          review.createdAt,

        updatedAt:
          review.updatedAt,
      })
    );

    return res.status(200).json({
      success: true,

      count:
        formattedReviews.length,

      reviews:
        formattedReviews,
    });
  } catch (error) {
    console.error(
      "Get All Reviews Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};


// =====================================================
// ADMIN - GET SINGLE REVIEW
// GET /api/admin/reviews/:id
// =====================================================

exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(
      req.params.id
    )
      .populate(
        "patient",
        "name email phone"
      )
      .populate(
        "doctor",
        "name email"
      )
      .populate(
        "appointment",
        "appointmentDate appointmentTime consultationType status"
      )
      .lean();

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    return res.status(200).json({
      success: true,
      review,
    });
  } catch (error) {
    console.error(
      "Get Review By ID Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch review",
      error: error.message,
    });
  }
};


// =====================================================
// ADMIN - DELETE REVIEW
// DELETE /api/admin/reviews/:id
// =====================================================

exports.deleteReview = async (req, res) => {
  try {
    const review =
      await Review.findByIdAndDelete(
        req.params.id
      );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Review Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error.message,
    });
  }
};