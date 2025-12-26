// This below wrapper code is promise based which we also use in this project 

const asyncHnadler = (requestHnadler)=> {
    (req,res,next)=>{
        Promise.resolve(requestHnadler(req,res,next).catch((error=>next(err))))
    }
}


export{ asyncHnadler}

// The below code is wrapper code for connecting data base using async and await with try and catch method , here we just make a function whenever we need to connect to  db and pass that function to with name"fn" to this method "asyncHandler".
 /*
 const asyncHnadler = (fn)=> async(req,res,next)=>{
    try{
        await fn(req,res,next)

    }catch(error){
        res.status(err.code||500).json({
            success:false,
            message:err.message
        })
    }
}
*/    