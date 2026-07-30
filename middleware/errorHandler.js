const errorHandler = (err, req, res, next) => {

    console.error("ERROR:", err);



    let statusCode = res.statusCode === 200 
        ? 500 
        : res.statusCode;



    let message = err.message || "Server Error";



    // MongoDB Duplicate Key Error
    if(err.code === 11000){

        statusCode = 400;

        message = "Duplicate data already exists";

    }



    // Mongoose Validation Error

    if(err.name === "ValidationError"){

        statusCode = 400;

        message = Object.values(err.errors)
        .map(error => error.message)
        .join(", ");

    }



    // Invalid MongoDB ID

    if(err.name === "CastError"){

        statusCode = 400;

        message = "Invalid ID format";

    }



    res.status(statusCode).json({

        success:false,

        message,

        stack:
        process.env.NODE_ENV === "production"
        ? null
        : err.stack

    });

};


module.exports = errorHandler;