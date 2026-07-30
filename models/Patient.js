const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
{
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },

    name: {
        type: String,
        required: true,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },

    phone: {
        type: String,
        required: true,
    },

    profileImage: {
        type: String,
        default: "",
    },

    gender: {
        type: String,
        enum: [
            "Male",
            "Female",
            "Other",
        ],
        default: "Other",
    },

    dateOfBirth: {
        type: Date,
    },

    bloodGroup: {
        type: String,
        default: "",
    },

    address: {
        type: String,
        default: "",
    },

    city: {
        type: String,
        default: "",
    },

    state: {
        type: String,
        default: "",
    },

    emergencyContact: {
        name: {
            type: String,
            default: "",
        },

        phone: {
            type: String,
            default: "",
        },

        relation: {
            type: String,
            default: "",
        },
    },


    medicalHistory: [
        {
            disease: {
                type: String,
                default: "",
            },

            description: {
                type: String,
                default: "",
            },

            addedDate: {
                type: Date,
                default: Date.now,
            },
        }
    ],


    allergies: [
        {
            type: String,
        }
    ],


    isActive: {
        type: Boolean,
        default: true,
    }

},
{
    timestamps:true
});


module.exports = mongoose.model(
    "Patient",
    patientSchema
);