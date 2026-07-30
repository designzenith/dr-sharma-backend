const express=require("express");

const router=express.Router();

const auth=require("../middleware/auth");


const {

addDoctor,

getDoctors,

getDoctor,

getMyDoctorProfile,

updateDoctor,

deleteDoctor,
getSpecializations

}=require("../controllers/doctorController");



router.post(
"/",
auth,
addDoctor
);


router.get(
"/",
getDoctors
);


router.get(
"/me",
auth,
getMyDoctorProfile
);


router.get(
"/:id",
getDoctor
);


router.put(
"/update",
auth,
updateDoctor
);


router.delete(
"/delete",
auth,
deleteDoctor
);

router.get(
"/specializations",
getSpecializations
);

module.exports=router;