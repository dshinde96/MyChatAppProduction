const express=require('express');
const router=express.Router();
const {AuthenticateUserForHTTP}=require('../Middleware/Authentication');
const fs = require('fs');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, './Attachments')
    },
    filename: function (req, file, cb) {
        return cb(null, `${Date.now()}-${file.originalname}`)
    }
})

const upload = multer({ storage: storage });

router.post('/upload', AuthenticateUserForHTTP,upload.single('file'), (req, res) => {
    try {
        return res.json({ file:{filename:req.file.originalname,path:req.file.path,}, msg: "File Uploaded Successfully" });
    } catch (error) {
        return res.status(501).json({ msg: "Internal Server Error" });
    }

});

router.post('/download',AuthenticateUserForHTTP,(req,res)=>{
    const {filePath,filename} = req.body;
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
})

module.exports=router