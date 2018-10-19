const { ObjectId } = require('mongoose').Types;
const Joi = require('joi');

exports.checkObjectId =(ctx, next) => {
    const { id } = ctx.params;

    if(!ObjectId.isValid(id)){
        ctx.status = 400;
        return null;
    }
    return next();
};
const Post = require('models/post');

exports.write = async (ctx) => {
    const schema = Joi.object().keys({
        title: Joi.string().required(),
        location: Joi.string().required(),
        body: Joi.string().required(),
        tags: Joi.array().items(Joi.string()).required()
    });
    //validate(검증할객체, 스키마)
    const result = Joi.validate(ctx.request.body, schema);

    if(result.error){
        ctx.status = 400;
        ctx.body = result.error;
        return;
    }

    const { title, location, body, tags } = ctx.request.body;

    const post = new Post({
        title, location, body, tags
    });

    try {
        await post.save();
        ctx.body = post;
    }catch(e) {
        ctx.throw(e, 500);
    }
};
exports.list = async (ctx) => {
    const page = parseInt(ctx.query.page || 1, 10); //페이지 없으면 1로간주

    if(page<1){
        ctx.status = 400;
        return;
    }

    try{
        const posts = await Post.find()
            .sort({_id: -1})
            .limit(10) //보이는 갯수 제한
            .skip((page -1) * 10)
            .exec();

        const postCount = await Post.count().exec();
        //마지막 페이지 알려주기
        ctx.set('Last-Page', Math.ceil(postCount / 10));
        //커스텀 헤더 설정
        ctx.body = posts;
    }catch(e) {
        ctx.throw(e, 500);
    }
};
exports.read = async (ctx) => {
    const { id } = ctx.params;
    try{
        const post = await Post.findById(id).exec();

        if(!post){
            ctx.status = 404;
            return;
        }
        ctx.body = post;
    } catch(e){
        ctx.throw(e, 500);
    }
};
exports.remove = async (ctx) => {
    const { id } = ctx.params;
    try{
        await Post.findByIdAndRemove(id).exec();
        ctx.status = 204;
    } catch(e){
        ctx.throw(e, 500);
    }   
};
exports.update = async (ctx) => {
    const { id } = ctx.params;
    try{
        const post = await Post.findByIdAndUpdate(id, ctx.request.body, {
            new: true
        }).exec();
        if(!post){
            ctx.status = 404;
            return;
        }
        ctx.body = post;
    } catch(e){
        ctx.throw(e, 500);
    } 
};
