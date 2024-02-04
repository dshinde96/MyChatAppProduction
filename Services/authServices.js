require('dotenv').config();
const jwt=require('jsonwebtoken')
const secretKey=process.env.JWT_SECRET;

const generatToken=(user)=>{
    const authToken=jwt.sign(user,secretKey);
    return authToken;
}

const validateToken=(authToken)=>{
    const user=jwt.verify(authToken,secretKey);
    return user;
}

module.exports={generatToken,validateToken};