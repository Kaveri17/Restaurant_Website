import { Request, Response } from "express";
import { Restaurant } from "../models/restaurant.model";
import { Order } from "../models/order.model";
import Stripe from "stripe";

const stripe = new Stripe(process.env.SRIPE_SECRET_KEY!) // "!" is used here to show that the value of our secret key is not null to the typescript

type CheckoutSessionRequest = {
  cartItems: {
    menuId: string;
    name: string;
    image: string;
    pricee: number;
    quantity: number;
  }[]; // the "[]" shows that there is multiple objects and the cartitems is the array containing multiple objects
  deliveryDetails: {
    name: string;
    email: string;
    address: string;
    city: string;
  };
  restaurantId: string;
};

export const getOrders = async (req: Request, res: Response) => {
    try {
        const orders = await Order.find({ user: req.id }).populate('user').populate('restaurant');
        return res.status(200).json({
            success: true,
            orders
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const checkoutSessionRequest: CheckoutSessionRequest = req.body;
    const restaurant = await Restaurant.findById(
      checkoutSessionRequest.restaurantId
    ).populate("menu");
    if (!restaurant) {
      return res.status(400).json({
        success: false,
        message: "Restaurant not found",
      });
    }
    const order = new Order({
      restaurant: restaurant._id,
      user: req.id, // id from token generated when user is authenticated is used
      deliveryDetails: checkoutSessionRequest.deliveryDetails,
      cartItems: checkoutSessionRequest.cartItems,
      status: "pending",
    });

    // Line Items
    const menuItems = restaurant.menus;
    const lineItems = createLineItems(checkoutSessionRequest, menuItems);

    const session = await stripe.checkout.sessions.create({
        payment_method_types:['card'],
        shipping_address_collection:{
            allowed_countries:['GB','US','CA']
        },
        line_items:lineItems,
        mode:'payment',
        success_url:`${process.env.FRONTEND_URL}/order/status`,
        cancel_url:`${process.env.FRONTEND_URL}/cart`,
        metadata:{
            orderId: order._id.toString(),
            images: JSON.stringify(menuItems.map((item:any)=> item.image))
        }
    })
    if(!session.url){
        return res.status(400).json({success:false,message:"Error while creating session"})
    }
    await order.save()
    return res.status(200).json({
        session
    })
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createLineItems = (
  checkoutSessionRequest: CheckoutSessionRequest,
  menuItems: any
) => {
  // create line items
  const lineItems = checkoutSessionRequest.cartItems.map((cartItem) => {
    const menuItem = menuItems.find(
      (item: any) => item._id === cartItem.menuId
    );
    if (!menuItem) throw new Error("Menu item id not found");

    return {
      price_data: {
        currency: "nrs",
        product_data: {
          name: menuItem.name,
          images: [menuItem.image],
        },
        unit_amount: menuItem.price * 100,
      },
      quantity: cartItem.quantity,
    };
  });

  // return line items

  return lineItems;
};
