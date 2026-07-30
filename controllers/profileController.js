const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const VerificationDocument = require("../models/VerificationDocument");


// ======================================
// Get My Profile
// ======================================
const getProfile = async (req, res) => {

    try {

        const user = await User.findById(req.user._id)
            .select("-password");


        if (!user) {

            return res.status(404).json({

                success:false,

                message:"User not found",

            });

        }



        let profile = null;



        if(user.role === "doctor"){

            profile = await Doctor.findOne({
                user:user._id
            });


        }


        if(user.role === "patient"){

            profile = await Patient.findOne({
                user:user._id
            });

        }



        res.json({

            success:true,

            user,

            profile,

        });



    } catch(error){

        console.error(error);


        res.status(500).json({

            success:false,

            message:error.message,

        });

    }

};




// ======================================
// Update User Basic Details
// ======================================
const updateProfile = async(req,res)=>{

try{


const {
    name,
    phone,
    email,
}=req.body;



const user =
await User.findByIdAndUpdate(

    req.user._id,

    {
        name,
        phone,
        email,
    },

    {
        new:true
    }

)
.select("-password");




res.json({

    success:true,

    message:"Profile updated successfully",

    user,

});



}catch(error){

console.error(error);


res.status(500).json({

success:false,

message:error.message,

});


}

};




// ======================================
// Update Doctor Details
// ======================================
const updateDoctorProfile = async(req,res)=>{

try{


const doctor =
await Doctor.findOneAndUpdate(

{
    user:req.user._id
},

req.body,

{
    new:true,
    runValidators:true,
}

);



if(!doctor){

return res.status(404).json({

success:false,

message:"Doctor profile not found",

});

}



res.json({

success:true,

message:"Doctor profile updated",

doctor,

});



}catch(error){

res.status(500).json({

success:false,

message:error.message,

});

}

};




// ======================================
// Update Patient Details
// ======================================
const updatePatientProfile = async(req,res)=>{

try{


const patient =
await Patient.findOneAndUpdate(

{
    user:req.user._id
},

req.body,

{
    new:true,
    runValidators:true,
}

);



if(!patient){

return res.status(404).json({

success:false,

message:"Patient profile not found",

});

}



res.json({

success:true,

message:"Patient profile updated",

patient,

});



}catch(error){

res.status(500).json({

success:false,

message:error.message,

});

}

};





// ======================================
// Doctor Verification Status
// ======================================
const getVerificationStatus = async(req,res)=>{


try{


const doctor =
await Doctor.findOne({

user:req.user._id

});



if(!doctor){

return res.status(404).json({

success:false,

message:"Doctor not found",

});

}




const verification =
await VerificationDocument.findOne({

doctor:doctor._id

});




res.json({

success:true,

verification,

});



}catch(error){


res.status(500).json({

success:false,

message:error.message,

});


}


};




// ======================================
// Delete Account
// ======================================
const deleteAccount = async(req,res)=>{


try{


await User.findByIdAndDelete(
    req.user._id
);



await Doctor.findOneAndDelete({

user:req.user._id

});



await Patient.findOneAndDelete({

user:req.user._id

});



res.json({

success:true,

message:"Account deleted successfully",

});



}catch(error){


res.status(500).json({

success:false,

message:error.message,

});


}


};




module.exports = {

getProfile,

updateProfile,

updateDoctorProfile,

updatePatientProfile,

getVerificationStatus,

deleteAccount,

};