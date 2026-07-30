const mongoose = require("mongoose");

const verificationDocumentSchema = new mongoose.Schema(
{
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: true,
        index: true,
    },


    // ==========================
    // Identity Details
    // ==========================

    aadhaarNumber: {
        type: String,
        trim: true,
        default: "",
    },


    panNumber: {
        type: String,
        trim: true,
        default: "",
    },


    medicalRegistrationNumber: {

        type: String,

        trim: true,

        default: "",

        unique: true,

        sparse: true,

    },


    medicalCouncil: {

        type: String,

        trim: true,

        default: "",

    },


    experienceYears: {

        type: Number,

        default: 0,

    },


    specialization: {

        type: String,

        default: "",

    },



    // ==========================
    // Uploaded Documents
    // ==========================


    aadhaarFront: {

        type:String,

        default:"",

    },


    aadhaarBack: {

        type:String,

        default:"",

    },


    panCard: {

        type:String,

        default:"",

    },


    profilePhoto: {

        type:String,

        default:"",

    },


    medicalLicense: {

        type:String,

        default:"",

    },


    degreeCertificate: {

        type:String,

        default:"",

    },


    additionalCertificate: [

        {

            type:String,

        }

    ],



    // ==========================
    // Verification
    // ==========================


    verificationStatus: {

        type:String,

        enum:[
            "Pending",
            "Under Review",
            "Approved",
            "Rejected",
        ],

        default:"Pending",

    },


    rejectionReason: {

        type:String,

        default:"",

    },


    verifiedBy: {

        type:mongoose.Schema.Types.ObjectId,

        ref:"User",

    },


    verifiedAt: {

        type:Date,

    },


},
{
    timestamps:true,
}
);



module.exports =
mongoose.model(
    "VerificationDocument",
    verificationDocumentSchema
);