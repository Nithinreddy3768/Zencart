var express=require('express');
var router =express.Router();
var fs=require('fs-extra');
//get products model

var products=require('../models/product');
var categories=require('../models/category');
const product = require('../models/product');
router.get('/',function(req,res)
{
    products.find().then(function(prods)
    {
      res.render("all_products",{products:prods,title:'All Products'});
    })
})
router.get('/:category',function(req,res)
{
    var cat = req.params.category;
    categories.findOne({slug:cat}).then(function(category)
    {
        console.log(category);
      if(category)
      {
        products.find({category:cat}).then(function(products)
        {
            console.log(products);
          res.render("all_products",{products:products,title: category.title});
        })
      }
      else
      {
     console.log("not okkk");
      res.send("not exists");
      }
    })
})
router.get('/:category/:product', function (req, res) {
    var galleryImages = [];

    products.findOne({ slug: req.params.product }).then(function (product) {
        if (product) {
            // console.log(product);
            var galleryDir = 'public/product_images/' + product.id + '/gallery';
            // console.log(galleryDir);
            fs.readdir(galleryDir, function (err, files) {
                if (err) {
                    console.error(err);
                    res.render('product', {
                        title: product.title,
                        p: product,
                        galleryImages: galleryImages
                    });
                } else {
                    galleryImages = files;
                    res.render('product', {
            
                        title: product.title,
                        p: product,
                        galleryImages: galleryImages
                    });
                }
            });
        }
    });
});
;
  
module.exports=router;