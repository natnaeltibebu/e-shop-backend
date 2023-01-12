const {
    Product
} = require('../models/product');
const {
    Category
} = require('../models/category');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const {
    count
} = require('mongoose/lib/model');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('Invalid file type');
        if (isValid) {
            uploadError = null;
        }
        cb(uploadError, 'public/uploads')
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-')
        const extension = FILE_TYPE_MAP[file.mimetype]
        cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
})

const uploadOptions = multer({
    storage: storage
})

router.get(`/`, async (req, res) => {
    //query parameters ?catagories
    let filter = {};
    if (req.query.categories) {
        filter = {
            category: req.query.categories.split(',')
        }
    }
    const productList = await Product.find(filter).populate('category');

    if (!productList) {
        res.status(500).json({
            success: false
        })
    }
    res.send(productList);
})

router.get(`/:id`, async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category');

    if (!product) {
        res.status(500).json({
            success: false,
            msg: 'Product not found'
        })
    }
    res.send(product);
})

router.post(`/`, uploadOptions.single('image'), async (req, res) => {
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid category');
    const file = req.file;
    if (!file) return res.status(400).send('Please enter a file');
    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads`
    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}/${fileName}`,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    })
    product = await product.save();
    if (!product)
        return res.status(500).send('The product was not saved')
    res.send(product)
})

router.put('/:id', uploadOptions.single('image'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).send('Invalid product ID')
    }

    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid category');

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(400).send('Invalid product');

    const file = req.file;
    let imagepath;

    if (file) {
        const fileName = req.file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads`
        imagepath = `${basePath}/${fileName}`
    } else {
        imagepath = product.image
    }

    const updatedProduct = await Product.findOneAndReplace(req.params.id, {
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: imagepath,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    }, {
        new: true
    })

    if (!updatedProduct)
        return res.status(404).send('the product cannot be updated')
    res.send(updatedProduct);
})

router.delete('/:id', (req, res) => {
    Product.findByIdAndRemove(req.params.id).then(product => {
        if (product) {
            return res.status(200).json({
                success: true,
                msg: 'product is removed successfully'
            })
        } else {
            return res.status(404).json({
                success: false,
                msg: 'product is not found'
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
    const productCount = await Product.countDocuments((count) => count)

    if (!productCount) {
        res.status(500).json({
            success: false,
            msg: 'products is not counted'
        })
    }
    res.send({
        productCount: productCount
    });
})


router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0
    const products = await Product.find({
        isFeatured: true
    }).limit(+
        count)

    if (!products) {
        res.status(500).json({
            success: false,
            msg: 'no featured products found'
        })
    }
    res.send({
        products: products
    });
})

router.put('/gallery-images/:id', uploadOptions.array('images', 10), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).send('Invalid product ID')
    }
    const files = req.files
    let imagesPath = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads`
    if (files) {
        files.map((file) => {
            imagesPath.push(`${basePath}${file.filename}`)
        })
    }
    const product = await Product.findOneAndUpdate(req.params.id, {
        images: imagesPath
    }, {
        new: true
    })

    if (!product)
        return res.status(404).send('the product cannot be updated')
    res.send(product);
});

module.exports = router;