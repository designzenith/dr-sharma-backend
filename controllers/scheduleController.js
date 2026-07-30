const Schedule = require("../models/Schedule");
const Doctor = require("../models/Doctor");
const DoctorLeave = require("../models/DoctorLeave");



// ======================================
// Helper: Get Doctor Profile
// ======================================
const getDoctor = async (userId) => {

    return await Doctor.findOne({
        user:userId
    });

};



// ======================================
// Get Doctor Schedule
// ======================================
const getDoctorSchedule = async(req,res)=>{

try{


const doctor =
await getDoctor(req.user._id);



if(!doctor){

return res.status(404).json({

success:false,

message:"Doctor profile not found"

});

}



let schedule =
await Schedule.findOne({

doctor:doctor._id

});



if(!schedule){

schedule =
await Schedule.create({

doctor:doctor._id

});

}



res.json({

success:true,

schedule

});



}catch(error){

console.error(error);


res.status(500).json({

success:false,

message:error.message

});

}

};




// ======================================
// Update Weekly Schedule
// ======================================
const updateDoctorSchedule = async(req,res)=>{

try{


const doctor =
await getDoctor(req.user._id);



if(!doctor){

return res.status(404).json({

success:false,

message:"Doctor not found"

});

}



const schedule =
await Schedule.findOneAndUpdate(

{
doctor:doctor._id
},

{
weeklySchedule:req.body.weeklySchedule
},

{
new:true,
upsert:true
}

);



res.json({

success:true,

message:"Schedule updated successfully",

schedule

});



}catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

};





// ======================================
// Add Time Slot
// ======================================
const addTimeSlot = async(req,res)=>{

try{


const doctor =
await getDoctor(req.user._id);



const {
day,
startTime,
endTime,
consultationType
}=req.body;



const schedule =
await Schedule.findOne({

doctor:doctor._id

});



if(!schedule){

return res.status(404).json({

success:false,

message:"Schedule not found"

});

}




const dayData =
schedule.weeklySchedule.find(
(item)=>item.day===day
);



if(!dayData){

return res.status(404).json({

success:false,

message:"Day not found"

});

}




const exists =
dayData.slots.some(
(slot)=>
slot.startTime===startTime &&
slot.endTime===endTime
);



if(exists){

return res.status(400).json({

success:false,

message:"Slot already exists"

});

}



dayData.slots.push({

startTime,

endTime,

consultationType,

isBooked:false

});



await schedule.save();



res.json({

success:true,

message:"Slot added successfully",

schedule

});



}catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

};





// ======================================
// Delete Time Slot
// ======================================
const deleteTimeSlot = async(req,res)=>{

try{


const doctor =
await getDoctor(req.user._id);



const {
day,
slotIndex
}=req.params;



const schedule =
await Schedule.findOne({

doctor:doctor._id

});



const dayData =
schedule.weeklySchedule.find(
(item)=>item.day===day
);



if(!dayData){

return res.status(404).json({

success:false,

message:"Day not found"

});

}



dayData.slots.splice(
Number(slotIndex),
1
);



await schedule.save();



res.json({

success:true,

message:"Slot deleted successfully",

schedule

});



}catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

};





// ======================================
// Toggle Day Availability
// ======================================
const toggleDayAvailability = async(req,res)=>{

try{


const doctor =
await getDoctor(req.user._id);


const schedule =
await Schedule.findOne({

doctor:doctor._id

});


const dayData =
schedule.weeklySchedule.find(
(item)=>item.day===req.params.day
);



if(!dayData){

return res.status(404).json({

success:false,

message:"Day not found"

});

}



dayData.isAvailable =
!dayData.isAvailable;



await schedule.save();



res.json({

success:true,

message:"Availability updated",

schedule

});



}catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

};





// ======================================
// Add Doctor Leave
// ======================================
const addLeave = async(req,res)=>{

try{


const doctor =
await getDoctor(req.user._id);



const leave =
await DoctorLeave.create({

doctor:doctor._id,

...req.body

});



res.status(201).json({

success:true,

message:"Leave added successfully",

leave

});



}catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

};





// ======================================
// Get Doctor Leaves
// ======================================
const getLeaves = async(req,res)=>{

try{


const doctor =
await getDoctor(req.user._id);



const leaves =
await DoctorLeave.find({

doctor:doctor._id

})
.sort({
fromDate:-1
});



res.json({

success:true,

leaves

});



}catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

};





// ======================================
// Delete Leave
// ======================================
const deleteLeave = async(req,res)=>{

try{


const leave =
await DoctorLeave.findByIdAndDelete(
req.params.id
);



if(!leave){

return res.status(404).json({

success:false,

message:"Leave not found"

});

}



res.json({

success:true,

message:"Leave deleted successfully"

});



}catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

};




module.exports={

getDoctorSchedule,

updateDoctorSchedule,

addTimeSlot,

deleteTimeSlot,

toggleDayAvailability,

addLeave,

getLeaves,

deleteLeave

};