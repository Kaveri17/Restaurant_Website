import mongoose from "mongoose";
import { Menu } from "../models/menu.model";
import { Restaurant } from "../models/restaurant.model";
import uploadImageOnCloudinary from "../utils/imageUpload";
import { Request, Response } from "express";

export const addMenu = async (req:Request, res:Response) => {
    try {
        const {name, description, price} = req.body;
        const file = req.file;
        if(!file){
            return res.status(400).json({
                success:false,
                message:"Image is required"
            })
        };
        const imageUrl = await uploadImageOnCloudinary(file as Express.Multer.File);
        const menu: any = await Menu.create({
            name , 
            description,
            price,
            image:imageUrl
        });
        const restaurant = await Restaurant.findOne({user:req.id});
        if(restaurant){
            (restaurant.menus as mongoose.Schema.Types.ObjectId[]).push(menu._id); // array of menu's id
            await restaurant.save();
        }

        return res.status(201).json({
            success:true,
            message:"Menu added successfully",
            menu
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:"Internal server error in addmenu"}); 
    }
}

export const editMenu = async(req:Request, res:Response)=>{
    try {
        const {id} = req.params
        const {name,description, price} = req.body
        const file = req.file

        const menu = await Menu.findById(id)
        if(!menu){
            return res.status(400).json({
                success:false,
                message:"Menu not found"
            })
        }
        if(name) menu.name = name
        if(description) menu.description = description
        if(price) menu.price = price

        if(file){
            const imageUrl = await uploadImageOnCloudinary(file as Express.Multer.File)
            menu.image = imageUrl
        }
        await menu.save()
        return res.status(200).json({
            success: true,
            message: "Menu updated successfully",
            menu
        })
    } catch (error:any) {
        console.log(error);
        return res.status(500).json({message:"Internal server error in edit menu"}); 
    }
}

// not needed 
export const deleteMenu = async(req:Request, res:Response)=>{
    try {
        const {menuId} = req.params

        const menu = await Menu.findOneAndDelete({_id:menuId})

        if(!menu){
            return res.status(400).json({
                success:false,
                message:"Menu not found"
            })
        }

        return res.status(200).json({
            success: true,
            message: "Menu deleted successfully",
            menu
        })

        
    } catch (error:any) {
        console.log(error);
        return res.status(500).json({message:"Internal server error in delete menu"}); 
    }
}