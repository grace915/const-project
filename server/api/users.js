var express = require('express');
var router = express.Router();

const { User } = require('../models/User'); 

const auth = (req, res, next) => { 
    // authentication 

    // get token in clinet's cookie 
    let token = req.cookies.x_auth; 

    // decode token and find user 
    User.findByToken(token, (err, user) => { 
        if(err) throw err; 
        if(!user) return res.json({ isAuth: false, error: true })
        
        req.token = token; 
        req.user = user; 
        next(); 
    })
    // if user exist, authentication complete
}

router.post('/signup', (req, res) => { 

    // Sign up
    const user = new User(req.body);
    user.save((err, user) => { 
        if (err) return res.json({ status: "failed", message: err })
        else { 
            res.json({status: "success"})
        }
    })
})

router.get('/checkEmail/:email', (req, res) => {
    
	User.findOne({email: req.params.email}, (err, user) => {
        let result = true; 
		if(!user) result = false; 
		return res.json({status: "success", result})
	})
})

router.get('/checkName/:name', (req, res) => {
    
	User.findOne({name: req.params.name}, (err, user) => {
        let result = true; 
		if(!user) result = false; 
		return res.json({status: "success", result})
	})
})

router.post('/signin', (req, res) => { 

    // Log in
    User.findOne({ email: req.body.email }, (err, user) => { 
        if(!user) { 
            return res.json({ 
                status: "failed", 
                message: "Not found: email address.."
            })
        }
        
        user.comparePassword(req.body.password, (err, isMatch) => { 
            if(!isMatch) return res.json({
                status: "failed", 
                message: "Wrong Password"
            })

            // Generate token if password is correct 
            user.generateToken( (err, user) => { 
                if (err) return res.status(400).send(err); 

                // Save token in Cookie
                res.cookie("x_auth", user.token).status(200).json({ 
                    status: "success", 
                    userId: user._id, 
                    email: user.email, 
                    name: user.name 
                })
            }) 
        })
    })
})


router.get('/auth', auth, (req, res) => { 
    res.status(200).json({ 
        _id: req.user._id, 
        // isAdmin: req.user.role === 0 ? false : true,
        isAuth: true, 
        email: req.user.email, 
        name: req.user.name 
    })
})

router.get('/logout', auth, (req, res) => { 
    User.findOneAndUpdate({_id: req.user._id}, 
        { token: "" }, 
        (err, user) => { 
            if(err) return res.json({ status: "failed", message: err }); 
            return res.status(200).send({ 
                status: "success"
        })
    })
})

module.exports = router;