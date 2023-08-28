var express=require("express");
var router=express.Router();
var Page=require('../models/page');
router.get("/",function(req,res)
{
    res.render("index",{title:'home',content:'Home page'});
})

// get a page
router.get('/:slug',function(req,res)
{
    var slug=req.params.slug;
    Page.findOne({slug:slug}).then(function(page)
    {
        if(page)
        {
            res.render('index1',{
                content:page.content,
                title:page.title
            });
        }
    });
    
})
module.exports=router;