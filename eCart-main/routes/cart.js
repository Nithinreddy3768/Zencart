var express = require('express');
var router =express.Router();
var fs=require('fs-extra');
//get products model
var auth=require('../config/auth');
var products=require('../models/product');
var categories=require('../models/category');
var product = require('../models/product');

var isUser=auth.isUser;

router.get('/add/:product',isUser,function(req,res)
{
    var slug=req.params.product;
    var cat;
    console.log("dgdjd");
    setCookie('name','Jeevan');
    product.findOne({slug:slug}).then(function(p)
    {
        console.log(req);
        if (typeof req.session.cart == "undefined") {
            req.session.cart = [];
            req.session.cart.push({
                title: slug,
                qty: 1,
                price: parseFloat(p.price).toFixed(2),
                image: '/product_images/' + p._id + '/' + p.image
            });
            // console.log("hmmmmm");
        } else {
            var cart = req.session.cart;
            var newItem = true;

            for (var i = 0; i < cart.length; i++) {
                if (cart[i].title == slug) {
                    cart[i].qty++;
                    newItem = false;
                    break;
                }
            }

            if (newItem) {
                cart.push({
                    title: slug,
                    qty: 1,
                    price: parseFloat(p.price).toFixed(2),
                    image: '/product_images/' + p._id + '/' + p.image
                });
            }
        }
        res.redirect('back');
    })
})


// updating the cart 
router.get('/update/:product',isUser,function(req,res)
{
    var slug=req.params.product;
    var cart=req.session.cart;
    var action=req.query.action;
    for(var i=0;i<cart.length;i++)
    {
        if(cart[i].title==slug)
        {
            switch(action)
            {
                case "add":
                    cart[i].qty++;
                    break;
                case "minus":
                    cart[i].qty--;
                    if(cart[i].qty<1)
                    // deletes 
                    cart.splice(i)
                    break;
                case "clear":
                cart.splice(i)
                if(cart.length==0){
                delete req.session.cart;
                break;}
            }
        }
    }
    res.redirect('/cart/checkout');
})
router.get('/clearcart',isUser,function(req,res)
{
   delete req.session.cart;
   res.redirect('/cart/checkout');
})

router.get('/checkout',isUser,function(req,res)
{
    if(req.session.cart&&req.session.cart.length==0)
    delete req.session.cart;
    res.render('checkout',{title:'checkout',cart:req.session.cart,tot:0});
})

function setCookie(name, value, daysToExpire) {
    let expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + (daysToExpire * 24 * 60 * 60 * 1000));
    const expires = "expires=" + expirationDate.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
    console.log(document.cookie);
  }
module.exports=router;