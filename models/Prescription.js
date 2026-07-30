const mongoose = require("mongoose");


const medicineSchema = new mongoose.Schema(
{
    medicineName: {
        type: String,
        required: true,
        trim: true,
    },


    dosage: {
        type: String,
        default: "",
    },


    frequency: {
        type: String,
        default: "",
    },


    duration: {
        type: String,
        default: "",
    },


    instructions: {
        type: String,
        default: "",
    }

},
{
    _id:false
}
);



const prescriptionSchema = new mongoose.Schema(
{

    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Appointment",
        required:true,
    },


    doctor:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Doctor",
        required:true,
    },


    patient:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Patient",
        required:true,
    },


    diagnosis:{
        type:String,
        default:"",
        trim:true,
    },


    symptoms:[
        {
            type:String,
        }
    ],


    medicines:[
        medicineSchema
    ],


    advice:{
        type:String,
        default:"",
    },


    followUpDate:{
        type:Date,
        default:null,
    },


    testRecommended:[
        {
            type:String,
        }
    ],


    prescriptionFile:{
        type:String,
        default:"",
    },


    status:{
        type:String,
        enum:[
            "Active",
            "Completed",
            "Cancelled"
        ],
        default:"Active",
    }

},
{
    timestamps:true
}
);



module.exports = mongoose.model(
    "Prescription",
    prescriptionSchema
);