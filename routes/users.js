const {
    User
} = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.get(`/`, async (req, res) => {
    const userList = await User.find().select('name email phone');

    if (!userList) {
        res.status(500).json({
            success: false
        })
    }
    res.send(userList);
})

router.get('/:id', async (req, res) => {
    const user = await User.findById(req.params.id).select('name email phone');
    if (!user) {
        res.status(500).json({
            success: false,
            message: 'user not found'
        })
    } else {
        res.status(200).send(user);
    }
})

router.post('/', async (req, res) => {
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.passwordHash, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
    })

    user = await user.save();
    if (!user)
        return res.status(404).send('the user can not be created')
    res.send(user);
})

router.post('/login', async (req, res) => {
    const SECRET_KEY = process.env.SECRET_KEY
    const user = await User.findOne({
        email: req.body.email
    });

    if (!user) {
        return res.status(404).send('user not found')
    };

    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        //creating token syntax: const token = jwt.sign(payload, secretKey);
        const token = jwt.sign({
                userId: user.id,
                isAdmin: user.isAdmin
            },
            SECRET_KEY, {
                expiresIn: '1d'
            }
        )
        res.status(200).send({
            user: user.email,
            token: token
        });
    } else {
        res.status(404).send('password mismatch')
    }
})

router.post('/register', async (req, res) => {
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
    })
    user = await user.save();

    if (!user)
        return res.status(400).send('the user cannot be created!')

    res.send(user);
})

router.delete('/:id', (req, res) => {
    User.findByIdAndRemove(req.params.id).then(user => {
        if (user) {
            return res.status(200).json({
                success: true,
                msg: 'user is removed successfully'
            })
        } else {
            return res.status(404).json({
                success: false,
                msg: 'user is not found'
            })
        }
    }).catch(err => {
        return res.status(400).json({
            success: false,
            err: err
        })
    });

})

router.get(`/get/count`, async (req, res) => {
    const userCount = await User.countDocuments((count) => count)

    if (!userCount) {
        res.status(500).json({
            success: false,
            msg: 'users is not counted'
        })
    }
    res.send({
        userCount: userCount
    });
})



module.exports = router;