const {
    Order
} = require('../models/order');
const {
    OrderItem
} = require('../models/order-item');
const express = require('express');
const router = express.Router();

router.get(`/`, async (req, res) => {
    const orderList = await Order.find()
        .populate('user', 'name').sort({
            'dateOrdered': -1
        })
        .populate({
            path: 'orderItems',
            populate: {
                path: 'product',
                populate: 'order',
            }
        })

    if (!orderList) {
        res.status(500).json({
            success: false
        })
    }
    res.send(orderList);
});

router.get('/:id', async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        res.status(500).json({
            success: false,
            message: 'order not found'
        })
    } else {
        res.status(200).send(order);
    }
})
//get all total sales in the ecommerce website
router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Order.aggregate([{
        $group: {
            _id: null,
            totalsales: {
                $sum: '$totalPrice'
            }
        }
    }])

    if (!totalSales) {
        return res.status(400).send('The order has no sales')
    }

    res.send({
        totalsales: totalSales.pop().totalsales
    });
})
//get all orders
router.get(`/get/count`, async (req, res) => {
    const orderCount = await Order.countDocuments((count) => count)

    if (!orderCount) {
        res.status(500).json({
            success: false,
            msg: 'orders is not counted'
        })
    }
    res.send({
        orderCount: orderCount
    });
})
//get ordered product for single user
router.get(`/get/userorders/:userId`, async (req, res) => {
    const userOrderList = await Order.find({
            user: req.params.userId
        })
        .populate({
            path: 'orderItems',
            populate: {
                path: 'product',
                populate: 'order',
            }
        }).sort({
            'dateOrdered': -1
        })


    if (!userOrderList) {
        res.status(500).json({
            success: false
        })
    }
    res.send(userOrderList);
});


router.post('/', async (req, res) => {
    const orderItemsIds = Promise.all(req.body.orderItems.map(async orderItem => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        });

        newOrderItem = await newOrderItem.save();
        return newOrderItem._id;
    }))

    const orderItemsIdsResolved = await orderItemsIds;
    const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId) => {
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice
    }))
    const totalPrice = totalPrices.reduce((a, b) => a + b, 0);
    console.log(totalPrice);


    let order = new Order({
        orderItems: orderItemsIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user,
    })

    order = await order.save();
    if (!order)
        return res.status(404).send('the order can not be created')
    res.send(order);
})

router.put('/:id', async (req, res) => {
    const order = await Order.findOneAndUpdate(req.params.id, {
        status: req.body.status,
    }, {
        new: true
    })

    if (!order)
        return res.status(404).send('order not found')
    res.send(order);
})

router.delete('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndRemove(req.params.id)
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            })
        }

        await OrderItem.deleteMany({
            _id: {
                $in: order.orderItems
            }
        })

        res.json({
            success: true,
            message: 'Order deleted successfully'
        })

    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err,
        })
    }



});


module.exports = router;