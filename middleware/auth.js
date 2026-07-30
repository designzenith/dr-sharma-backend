const jwt = require("jsonwebtoken");
const User = require("../models/User");


module.exports = async (req,res,next)=>{


try{


const authHeader = req.headers.authorization;



if(!authHeader){

return res.status(401).json({

success:false,

message:"No token provided"

});

}




const token = authHeader.split(" ")[1];



if(!token){

return res.status(401).json({

success:false,

message:"Invalid token"

});

}




const decoded = jwt.verify(
token,
process.env.JWT_SECRET
);



// get user from database
const user = await User.findById(decoded.id)
.select("-password");



if(!user){

return res.status(401).json({

success:false,

message:"User not found"

});

}



req.user = user;



next();



}catch(error){


console.log("AUTH ERROR:",error.message);



return res.status(401).json({

success:false,

message:"Unauthorized"

});


}


};