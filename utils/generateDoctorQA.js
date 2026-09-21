// =====================================================
// utils/generateDoctorQA.js
// =====================================================

function generateDoctorServices(doctor) {
  const specialization = (
    doctor.specialization || ""
  ).toLowerCase();

  let services = [
    "General consultation & diagnosis",
    "Prescription & follow-up care",
    "Lab test recommendations",
    "Second opinion consultations",
  ];

  if (
    specialization.includes("psycholog") ||
    specialization.includes("psychiatr")
  ) {
    services = [
      "Anxiety & Stress Management",
      "OCD & Phobia Treatment",
      "ADHD & ASD Assessment",
      "Career Counselling",
      "Cognitive Behaviour Therapy (CBT)",
      "Emotional Freedom Techniques (EFT)",
      "Self-esteem & Confidence Building",
      "Online Counselling Sessions",
    ];
  } else if (
    specialization.includes("paediatric") ||
    specialization.includes("pediatric") ||
    specialization.includes("child")
  ) {
    services = [
      "Newborn & Infant Care",
      "Growth & Development Assessment",
      "Immunization & Vaccination",
      "Developmental Delay Evaluation",
      "ADHD & ASD Screening",
      "Adolescent Health Consultation",
      "Prescription & Follow-up Care",
      "Second Opinion Consultations",
    ];
  } else if (
    specialization.includes("dermatolog") ||
    specialization.includes("skin")
  ) {
    services = [
      "Acne & Pimple Treatment",
      "Hair Fall & Scalp Treatment",
      "Skin Allergy Management",
      "Pigmentation Treatment",
      "Eczema & Psoriasis Care",
      "Cosmetic Dermatology",
      "Skin Biopsy & Diagnosis",
      "Follow-up Care",
    ];
  } else if (
    specialization.includes("gynaec") ||
    specialization.includes("gynec") ||
    specialization.includes("obstetric")
  ) {
    services = [
      "Pregnancy Care & Antenatal Checkup",
      "Menstrual Disorder Treatment",
      "PCOS / PCOD Management",
      "Infertility Consultation",
      "Menopause Care",
      "Gynecological Infections",
      "Family Planning Counselling",
      "Second Opinion Consultations",
    ];
  } else if (specialization.includes("orthop")) {
    services = [
      "Joint Pain Management",
      "Fracture Treatment",
      "Back & Neck Pain Care",
      "Sports Injury Treatment",
      "Arthritis Management",
      "Physiotherapy Guidance",
      "Post-surgery Follow-up",
      "Second Opinion Consultations",
    ];
  }

  return services;
}


// =====================================================
// Generate Doctor FAQ
// =====================================================

function generateDoctorQA(doctor) {
  const {
    name,
    specialization,
    experience,
    clinicName,
    location,
    rating = 0,
    totalReviews = 0,
    services = [],
    about = "",
  } = doctor;

  return [
    {
      question: `Where does ${name} practice?`,
      answer: `${name} practices at ${
        clinicName || "the clinic"
      }${
        location ? ` - ${location}` : ""
      }. The doctor also provides online video consultation.`,
    },

    {
      question: `How can I take ${name}'s appointment?`,
      answer: `You can take ${name}'s appointment online for in-clinic visit or for video consultation with the doctor.`,
    },

    {
      question: `Why do patients visit ${name}?`,
      answer: `Patients frequently visit ${name} for ${
        specialization || "medical"
      } related concerns${
        services.length > 0
          ? ` including ${services
              .slice(0, 3)
              .join(", ")}`
          : ""
      }. To see more reasons visit the doctor's profile.`,
    },

    {
      question: `What do patients say about ${name}?`,
      answer: `${name} has a rating of ${rating}/5 based on ${totalReviews} patient reviews. You can read detailed patient stories of the doctor.`,
    },

    {
      question: `What is ${name}'s education qualification and experience?`,
      answer: `${name} is a ${
        specialization || "Doctor"
      } with ${
        experience || "years of experience"
      }. ${
        about
          ? about.split(".")[0] + "."
          : ""
      }`,
    },
  ];
}


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  generateDoctorQA,
  generateDoctorServices,
};