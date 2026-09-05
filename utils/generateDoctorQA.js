// utils/generateDoctorQA.js

function generateDoctorQA(doctor) {
  const {
    name = "the doctor",
    specialization = "Doctor",
    qualification = "",
    experience = 0,
    hospital = "the clinic",
    address = "",
    about = "",
    consultationType = [],
    rating = 0,
    totalReviews = 0,
    services = [],
  } = doctor;

  // Helper: format consultation types nicely
  const formatConsultationTypes = () => {
    if (!consultationType || consultationType.length === 0) {
      return "online video consultation";
    }
    const types = consultationType.map((type) => {
      if (type === "video") return "video consultation";
      if (type === "audio") return "audio consultation";
      if (type === "clinic") return "in-clinic visit";
      return type;
    });
    return types.join(", ");
  };

  // Common base questions (for all doctors)
  const commonQA = [
    {
      question: `Where does ${name} practice?`,
      answer: `${name} practices at ${hospital}${
        address ? ` - ${address}` : ""
      }. The doctor also provides ${formatConsultationTypes()}.`,
    },
    {
      question: `How can I take ${name}'s appointment?`,
      answer: `You can book ${name}'s appointment online for ${formatConsultationTypes()}.`,
    },
    {
      question: `What is ${name}'s education qualification and experience?`,
      answer: `${name} holds the following qualifications - ${
        qualification || "Professional medical qualifications"
      }. ${name} has ${experience} years of experience.`,
    },
    {
      question: `What do patients say about ${name}?`,
      answer:
        rating && totalReviews
          ? `${name} has a rating of ${rating}/5 based on ${totalReviews} patient reviews. You can read detailed patient stories on the doctor's profile.`
          : `Patients appreciate ${name}'s professional approach and clear communication. You can read patient reviews on the doctor's profile.`,
    },
  ];

  // Specialization-based extra questions
  let specializationQA = [];

  const spec = specialization.toLowerCase();

  // ========== PSYCHOLOGIST / PSYCHIATRIST ==========
  if (spec.includes("psycholog") || spec.includes("psychiatr")) {
    specializationQA = [
      {
        question: `Why do patients visit ${name}?`,
        answer: `Patients frequently visit ${name} for anxiety, OCD, phobias, panic attacks, ADHD, ASD, developmental delays, career counselling, self-esteem issues, and emotional difficulties. ${
          about ? about.split(".")[0] + "." : ""
        }`,
      },
      {
        question: `What therapies does ${name} use?`,
        answer: `${name} is experienced in Cognitive Behaviour Therapy (CBT), Hypnotic Behaviour Therapy, and Emotional Freedom Techniques (EFT).`,
      },
      {
        question: `Does ${name} provide online counselling?`,
        answer: `Yes, ${name} provides both online video and audio counselling sessions in addition to in-clinic visits.`,
      },
    ];
  }

  // ========== PAEDIATRICIAN ==========
  else if (spec.includes("paediatric") || spec.includes("pediatric") || spec.includes("child")) {
    specializationQA = [
      {
        question: `Why do patients visit ${name}?`,
        answer: `Patients frequently visit ${name} for newborn care, child & adolescent health, growth & development assessment, immunization, vaccination scheduling, and developmental concerns.`,
      },
      {
        question: `What services does ${name} offer?`,
        answer: `${name} offers general consultation & diagnosis, prescription & follow-up care, lab test recommendations, second opinion consultations, and vaccination guidance.`,
      },
      {
        question: `Does ${name} treat developmental disorders?`,
        answer: `Yes, ${name} has experience in assessing and managing developmental delays, ADHD, ASD, and specific learning disorders in children.`,
      },
    ];
  }

  // ========== DERMATOLOGIST ==========
  else if (spec.includes("dermatolog") || spec.includes("skin")) {
    specializationQA = [
      {
        question: `Why do patients visit ${name}?`,
        answer: `Patients frequently visit ${name} for acne, hair fall, skin allergies, pigmentation, eczema, psoriasis, and other skin & hair related concerns.`,
      },
      {
        question: `Does ${name} provide cosmetic treatments?`,
        answer: `You can check ${name}'s profile for available cosmetic and aesthetic dermatology services.`,
      },
    ];
  }

  // ========== GENERAL / OTHER SPECIALIZATIONS ==========
  else {
    specializationQA = [
      {
        question: `Why do patients visit ${name}?`,
        answer: `Patients frequently visit ${name} for ${specialization.toLowerCase()} related concerns${
          services.length > 0 ? ` including ${services.slice(0, 3).join(", ")}` : ""
        }. ${about ? about.split(".")[0] + "." : ""}`,
      },
      {
        question: `What consultation options are available with ${name}?`,
        answer: `${name} offers ${formatConsultationTypes()}.`,
      },
    ];
  }

  // Final combined Q&A
  return [...commonQA, ...specializationQA];
}

module.exports = { generateDoctorQA };