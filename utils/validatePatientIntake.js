const validatePatientIntake = (patientIntake = {}, intakeQuestions = []) => {
  const errors = [];

  // ========== PERSONAL REQUIRED FIELDS ==========
  const requiredPersonal = [
    { key: "fullName", label: "Full Name" },
    { key: "age", label: "Age" },
    { key: "gender", label: "Gender" },
    { key: "phone", label: "Phone Number" },
    { key: "email", label: "Email" },
    { key: "chiefComplaint", label: "Chief Complaint / Main Concern" },
  ];

  requiredPersonal.forEach((field) => {
    const value = patientIntake[field.key];
    if (!value || (typeof value === "string" && !value.trim())) {
      errors.push(`${field.label} is required`);
    }
  });

  // Email format
  if (patientIntake.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(patientIntake.email)) {
      errors.push("Please enter a valid email address");
    }
  }

  // Age validation
  if (patientIntake.age) {
    const age = Number(patientIntake.age);
    if (isNaN(age) || age <= 0 || age > 120) {
      errors.push("Please enter a valid age (1-120)");
    }
  }

  // ========== SPECIALTY QUESTIONS (from doctor.intakeQuestions) ==========
  if (Array.isArray(intakeQuestions) && intakeQuestions.length > 0) {
    intakeQuestions.forEach((q) => {
      if (q.required) {
        const answer = patientIntake.specialtyAnswers?.[q.key];
        if (!answer || (typeof answer === "string" && !answer.trim())) {
          errors.push(`${q.label} is required`);
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = validatePatientIntake;