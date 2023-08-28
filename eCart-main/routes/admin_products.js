var express = require('express');
var router = express.Router();
var mkdirp = require('mkdirp');
var fs = require('fs-extra');
var resizeImg = require('resize-img');
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

// Get Product model
var Product = require('../models/product');

// Get Category model
var Category = require('../models/category');

/*
 * GET products index
 */
router.get('/',isAdmin,function (req, res) {
    var count;
    Product.count().then(function (c) {
        count = c;
        Product.find().then(function (products) {
            res.render('admin/products', {
                products: products,
                count: count
            });
        });
    });
    
});

/*
 * GET add product
 */
router.get('/add-product',isAdmin, function (req, res) {

    var title = "";
    var desc = "";
    var price = "";

    Category.find().then(function (categories) {
        res.render('admin/add_product', {
            title: title,
            desc: desc,
            categories: categories,
            price: price
        });
    });


});

/*
 * POST add product
 */
router.post('/add-product',function (req, res) {
    
    var imageFile ;
    if (req.files && req.files.image) 
        imageFile = req.files.image.md5;
    else 
        imageFile = "";

    req.checkBody('title', 'Title must have a value.').notEmpty();
    req.checkBody('desc', 'Description must have a value.').notEmpty();
    req.checkBody('price', 'Price must have a value.').isDecimal();
    req.checkBody('image', 'You must upload an image').isImage(imageFile);
      
    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var desc = req.body.desc;
    var price = req.body.price;
    var category = req.body.category;
    var errors = req.validationErrors();

    if (errors) {
        Category.find().then(function (categories) {
            res.render('admin/add_product', {
                errors: errors,
                title: title,
                desc: desc,
                categories: categories,
                price: price
            });
        });
    }
    else
    {
        Product.findOne({slug: slug}).then(function (product) {
            if (product) {
                req.flash('danger', 'Product title exists, choose another.');
                Category.find().then(function (categories) {
                    res.render('admin/add_product', {
                        title: title,
                        desc: desc,
                        categories: categories,
                        price: price
                    });
                });
            } 
            else {
                var price2 = parseFloat(price).toFixed(2);
                var product = new Product({
                    title: title,
                    slug: slug,
                    desc: desc,
                    price: price2,
                    category: category,
                    image: imageFile
                });
                product.save();
                fs.mkdirp('public/product_images/' + product._id, function (err) {
                    return console.log(err);
                });
    
                fs.mkdirp('public/product_images/' + product._id + '/gallery', function (err) {
                    return console.log(err);
                });
    
                fs.mkdirp('public/product_images/' + product._id + '/gallery/thumbs', function (err) {
                    return console.log(err);
                });
    
                if (imageFile != "") {
                    var productImage = req.files.image;
                    var path = 'public/product_images/' + product._id + '/' + imageFile;
                    productImage.mv(path);
                }
                req.flash('success', 'Product edited!');
                res.redirect('/admin/products');
            }
        });
    }
});

/*
 * GET edit product
 */
router.get('/edit-product/:id',isAdmin, function (req, res) {

    Category.find().then(function (categories) {
        Product.findById(req.params.id).then(function (p) {
            var galleryDir = 'public/product_images/' + p._id + '/gallery';
            var galleryImages = null;
            fs.readdir(galleryDir, function (err, files) {
                galleryImages = files;
                res.render('admin/edit_product', {
                    title: p.title,
                    desc: p.desc,
                    categories: categories,
                    category: p.category.replace(/\s+/g, '-').toLowerCase(),
                    price: parseFloat(p.price).toFixed(2),
                    image: p.image,
                    galleryImages: galleryImages,
                    id: p._id
                });
            });
        });
    });
});

/*
 * POST edit product
 */
router.post('/edit-product/:id',function (req, res) {

    var imageFile ;
    if (req.files && req.files.image) 
        imageFile = req.files.image.md5;
    else 
        imageFile = "";

    req.checkBody('title', 'Title must have a value.').notEmpty();
    req.checkBody('desc', 'Description must have a value.').notEmpty();
    req.checkBody('price', 'Price must have a value.').isDecimal();
    req.checkBody('image', 'You must upload an image').isImage(imageFile);

    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var desc = req.body.desc;
    var price = req.body.price;
    var category = req.body.category;
    var pimage = req.body.pimage;
    var id = req.params.id;

    var errors = req.validationErrors();

    if (errors) {
        req.session.errors = errors;
        req.flash('danger', 'Fillout all the fields');
        res.redirect('/admin/products/edit-product/' + id);
    } 
    else
     {
        //we are checking if there exists same slug with different id exist or not
        Product.findOne({slug: slug, _id: {'$ne': id}}).then(function (p) {
            if (p) {
                req.flash('danger', 'product exists, choose another.');
                res.redirect('/admin/products/edit-product/' + id);
            } 
            else 
            {
                Product.findById(id).then(function (p) {
                    p.title = title;
                    p.slug = slug;
                    p.desc = desc;
                    p.price = parseFloat(price).toFixed(2);
                    p.category = category;

                    if (imageFile != "") {
                        p.image = imageFile;
                    }
                    
                    console.log(imageFile);
                    p.save().then(function() {
                        if (imageFile != "") {
                            if (p.image != "") {
                                fs.remove('public/product_images/' + id + '/'+p.image);
                            } 
                            p.image = imageFile;
                            var productImage = req.files.image;
                            var path = 'public/product_images/' + id + '/' + imageFile;
                            productImage.mv(path);
                        }
                    })
                    req.flash('success', 'Product edited!');
                    res.redirect('/admin/products/edit-product/' + id);
                });
            }
        });
    }
});

/*
 * POST product gallery
 */
router.post('/product-gallery/:id', function (req, res) {

    var productImage = req.files.file;
    var id = req.params.id;
    var path = 'public/product_images/' + id + '/gallery/' + req.files.file.md5;
    var thumbsPath = 'public/product_images/' + id + '/gallery/thumbs/' + req.files.file.md5;

    productImage.mv(path, function (err) {
        if (err)
            console.log(err);
        resizeImg(fs.readFileSync(path), {width: 100, height: 100}).then(function (buf) {
            fs.writeFileSync(thumbsPath, buf);
        });
    });

    res.sendStatus(200);

});

/*
 * GET delete image
 */
router.get('/delete-image/:image',isAdmin,function (req, res) {

    var originalImage = 'public/product_images/' + req.query.id + '/gallery/' + req.params.image;
    var thumbImage = 'public/product_images/' + req.query.id + '/gallery/thumbs/' + req.params.image;

    fs.remove(originalImage, function (err) {
        if (err) {
            console.log(err);
        } else {
            fs.remove(thumbImage, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    req.flash('success', 'Image deleted!');
                    res.redirect('/admin/products/edit-product/' + req.query.id);
                }
            });
        }
    });
});

/*
 * GET delete product
 */
router.get('/delete-product/:id',isAdmin,function (req, res) {

    var id = req.params.id;
    var path = 'public/product_images/' + id;

    fs.remove(path, function (err) {
        if (err) {
            console.log(err);
        } else {
            Product.findByIdAndRemove(id).then();
            req.flash('success', 'Product deleted!');
            res.redirect('/admin/products');
        }
    });

});

// Exports
module.exports = router;

