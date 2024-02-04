const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../Models/User');
const { generatToken } = require('../Services/authServices');
const { body, validationResult } = require('express-validator');

router.post('/signup',
    body('name', 'Name Cannot be empty').notEmpty(),
    body('email', "Enter a valid Email").isEmail(),
    body('password', 'password Cannot be empty').notEmpty(), async (req, res) => {
        try {
            const result = validationResult(req);
            if (!result.isEmpty()) {
                return res.status(401).json({ msg: "Invalid Email Address or Name and Password caannot be empty" });
            }
            const { name, email, password } = req.body;
            let user = await User.findOne({ email });
            if (user) {
                return res.status(401).json({ msg: "User already registered. Please try to login to your account" });
            }

            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(password, salt, async (err, secPass) => {
                    if (err) {
                        throw new Error(err);
                    }
                    user = await User.create({
                        name,
                        email,
                        password: secPass
                    });
                    const authToken = generatToken({ _id: user._id, name: user.name, email: user.email });
                    return res.json({ authToken, name: user.name, email: user.email, msg: "User Successfully Registered" });
                })
            })
        } catch (error) {
            console.log(error.message);
            return res.status(500).json({ msg: "Internal Server error" });
        }
    });

router.post('/login',
    body('email', "Enter a valid Email").isEmail(),
    body('password', 'password Cannot be empty').notEmpty(), async (req, res) => {
        try {
            const result = validationResult(req);
            if (!result.isEmpty()) {
                return res.status(401).json({ msg: "Invalid Email Address or Password caannot be empty" });
            }
            const { email, password } = req.body;

            let user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ msg: "User not found" });
            }

            bcrypt.compare(password, user.password, (error, result) => {
                if (error) {
                    throw new Error(error);
                }
                if (result) {
                    const authToken = generatToken({ _id: user._id, name: user.name, email: user.email });
                    return res.json({ authToken, name: user.name, email: user.email, msg: "User Successfully Loggedin" });
                }
                else {
                    return res.status(401).json({ msg: "Invalid credentials" });
                }
            })
        } catch (error) {
            console.log(error.message);
            return res.status(500).json({ msg: "Internal Server error" });
        }
    });


module.exports = router;