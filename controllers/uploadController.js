const User = require("../models/User");
const Doctor = require("../models/Doctor");
const VerificationDocument = require("../models/VerificationDocument");


// ======================================
// Upload Profile Image
// ======================================
const uploadProfileImage = async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }


    const imagePath = req.file.path;


    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        profileImage: imagePath,
      },
      {
        new: true,
      }
    );


    res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully",
      user,
    });


  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};




// ======================================
// Upload Doctor Documents
// ======================================
const uploadDoctorDocuments = async (req, res) => {

  try {

    const {
      aadhaarNumber,
      medicalLicenseNumber,
    } = req.body;


    const doctor = await Doctor.findOne({
      user: req.user._id,
    });


    if (!doctor) {

      return res.status(404).json({
        success:false,
        message:"Doctor profile not found",
      });

    }



    const documents = {

      doctor: doctor._id,

      aadhaarNumber,

      medicalLicenseNumber,

      aadhaarFile:
        req.files?.aadhaar
          ? req.files.aadhaar[0].path
          : "",


      medicalLicenseFile:
        req.files?.medicalLicense
          ? req.files.medicalLicense[0].path
          : "",


      certificate:

        req.files?.certificate
          ? req.files.certificate.map(
              file => file.path
            )
          : [],

    };



    const verification =
      await VerificationDocument.create(
        documents
      );



    res.status(201).json({

      success:true,

      message:
        "Doctor documents uploaded successfully",

      verification,

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
// Upload Doctor Image
// ======================================
const uploadDoctorImage = async(req,res)=>{

try{


if(!req.file){

return res.status(400).json({

success:false,

message:"Doctor image required",

});

}



const doctor =
await Doctor.findOneAndUpdate(

{
user:req.user._id
},

{
image:req.file.path
},

{
new:true
}

);



if(!doctor){

return res.status(404).json({

success:false,

message:"Doctor not found",

});

}



res.json({

success:true,

message:
"Doctor image updated",

doctor,

});


}catch(error){

console.error(error);

res.status(500).json({

success:false,

message:error.message,

});

}

};





module.exports = {

uploadProfileImage,

uploadDoctorDocuments,

uploadDoctorImage,

};