const {validateToken}=require('../Services/authServices');

const AuthenticateUserForHTTP=(req,res,next)=>{
    try {
        const authTocken = req.header("authTocken");
        if (!authTocken) {
            return next(new Error('Authentication error'));
        }
        const user = validateToken(authTocken);
        req.user = user;
        next();
    } catch (error) {
        console.log(error.message);
        return;
    }
}

const AuthenticateUserForSocket=(socket,next)=>{
    try {
        const authTocken = socket.handshake.auth.token;
        if (!authTocken) {
            return next(new Error('Authentication error'));
        }
        const user = validateToken(authTocken);
        socket.user = user;
        next();
    } catch (error) {
        console.log(error.message);
        return;
    }
}

module.exports={AuthenticateUserForSocket,AuthenticateUserForHTTP};