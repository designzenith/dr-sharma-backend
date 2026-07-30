const mongoose = require("mongoose");


const notificationSchema = new mongoose.Schema(
{
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },


    title: {
        type: String,
        required: true,
        trim: true,
    },


    message: {
        type: String,
        required: true,
        trim: true,
    },


    type: {
        type: String,
        enum: [
            "Appointment",
            "Prescription",
            "Payment",
            "System",
            "Reminder",
            "Message"
        ],
        default: "System",
    },


    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
        default: null,
    },


    isRead: {
        type: Boolean,
        default: false,
    },


    readAt: {
        type: Date,
        default: null,
    },


    status: {
        type: String,
        enum:[
            "Active",
            "Deleted"
        ],
        default:"Active",
    }

},
{
    timestamps:true
});


module.exports = mongoose.model(
    "Notification",
    notificationSchema
);