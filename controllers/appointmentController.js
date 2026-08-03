const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const { v4: uuidv4 } = require("uuid");


// =========================
// Book Appointment
// Patient sends request
// =========================
const bookAppointment = async (req, res) => {

try {

console.log("Appointment Request:", req.body);


const appointment = await Appointment.create({

patient: req.body.patient,

doctor: req.body.doctor,

appointmentDate: req.body.appointmentDate,

appointmentTime: req.body.appointmentTime,

consultationType: req.body.consultationType,


roomId: uuidv4(),


status: "Pending",

});


res.status(201).json({

success:true,

message:"Appointment request sent. Waiting for doctor approval.",

appointment,

});


}
catch(error){

console.error(error);


res.status(500).json({

success:false,

message:error.message,

});

}

};




// =========================
// Patient All Appointments
// =========================

const patientAppointments = async(req,res)=>{

try{


const appointments =
await Appointment.find({

patient:req.params.id

})
.populate(
"doctor",
"name specialization profileImage"
)
.sort({
appointmentDate:-1
});



res.json({

success:true,

appointments,

});


}
catch(error){

res.status(500).json({

success:false,

message:error.message,

});

}

};




// =========================
// Logged In Patient Appointments
// =========================

const getMyPatientAppointments = async(req,res)=>{

try{


const appointments =
await Appointment.find({

patient:req.user._id

})
.populate(
"doctor",
"name specialization profileImage"
)
.sort({
createdAt:-1
});



res.json({

success:true,

appointments,

});


}
catch(error){

res.status(500).json({

success:false,

message:error.message,

});

}

};





// =========================
// Doctor Appointments
// =========================

const doctorAppointments = async(req,res)=>{

try{


const doctor =
await Doctor.findOne({

user:req.params.id

});



if(!doctor){

return res.status(404).json({

success:false,

message:"Doctor profile not found"

});

}



const appointments =
await Appointment.find({

doctor:doctor._id

})
.populate(
"patient",
"name email phone"
)
.sort({
createdAt:-1
});



res.json({

success:true,

appointments,

});


}
catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

};





// =========================
// Doctor Accept Appointment
// =========================

const acceptAppointment = async(req,res)=>{

try{


const appointment =
await Appointment.findByIdAndUpdate(

req.params.id,

{
status:"Confirmed"
},

{
new:true
}

);



if(!appointment){

return res.status(404).json({

success:false,

message:"Appointment not found"

});

}



res.json({

success:true,

message:"Appointment confirmed",

appointment

});


}
catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

};





// =========================
// Doctor Reject Appointment
// =========================

const rejectAppointment = async(req,res)=>{

try{


const appointment =
await Appointment.findByIdAndUpdate(

req.params.id,

{
status:"Cancelled"
},

{
new:true
}

);



res.json({

success:true,

message:"Appointment rejected",

appointment

});


}
catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

};






// =========================
// Start Consultation
// =========================

const startCall = async(req,res)=>{

try{


const appointment =
await Appointment.findByIdAndUpdate(

req.params.id,

{

status:"In Progress",

callStartedAt:new Date(),

},

{
new:true
}

);



res.json({

success:true,

appointment

});


}
catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

};






// =========================
// End Consultation
// =========================

const endCall = async(req,res)=>{

try{


const appointment =
await Appointment.findById(
req.params.id
);



if(!appointment){

return res.status(404).json({

success:false,

message:"Appointment not found"

});

}



appointment.status="Completed";

appointment.callEndedAt=new Date();



if(appointment.callStartedAt){

appointment.duration =
Math.floor(
(
appointment.callEndedAt -
appointment.callStartedAt
)
/1000/60
);

}



await appointment.save();



res.json({

success:true,

appointment

});


}
catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

};





// =========================
// Update Appointment
// =========================

const updateAppointment = async(req,res)=>{

try{


const appointment =
await Appointment.findByIdAndUpdate(

req.params.id,

req.body,

{
new:true
}

);


res.json({

success:true,

appointment

});


}
catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

};





// =========================
// Cancel Appointment
// =========================

const cancelAppointment = async(req,res)=>{

try{


const appointment =
await Appointment.findByIdAndUpdate(

req.params.id,

{
status:"Cancelled"
},

{
new:true
}

);



res.json({

success:true,

appointment

});


}
catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

};





// =========================
// Get Appointment By Room
// =========================

const getAppointmentByRoom = async(req,res)=>{

try{


const appointment =
await Appointment.findOne({

roomId:req.params.roomId

})
.populate("doctor")
.populate("patient");



if(!appointment){

return res.status(404).json({

success:false,

message:"Appointment not found"

});

}



res.json({

success:true,

appointment

});


}
catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

};





module.exports={


bookAppointment,

patientAppointments,

getMyPatientAppointments,

doctorAppointments,


acceptAppointment,

rejectAppointment,


updateAppointment,

cancelAppointment,


startCall,

endCall,


getAppointmentByRoom,


};