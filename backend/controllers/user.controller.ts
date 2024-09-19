import { Request, Response } from "express";
import { User } from "../models/user.model";
import bcryptjs from "bcryptjs";

export const signup = async (req: Request, res: Response) => {
  try {
    const { fullname, email, password, contact } = req.body;

    // user already exists or not
    let user = await User.findOne({ email });
    if (user) {
      res.status(400).json({
        success: false,
        message:
          "User email already exists. Please enter new email or proceed to login",
      });
    }
    const hashedPassword = await bcryptjs.hash(password, 10); // hashing psw

    const verificationToken = "123456"; // generateVerificationToken()

    user = await User.create({
      fullname,
      email,
      password: hashedPassword,
      contact: Number(contact), // because in our model its types is number and the value we recieve is of string so to remove the error we convert the input data to numeric value
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60, // verification token expires after one days if more that 1 day needed multiply it with the required no. of days
    });

    // generate a jwt token to store the registered user data
    // generateToken(res, user)
    // sendVerificationEmail(user,verificationToken)

    const userWithoutPassword = await User.findOne({ email }).select(
      "-password"
    ); // gives the user's details without the password

    return res.status(200).json({
      success: true,
      message: "Account registered successfully",
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
  const { email, password } = req.body;
    let user = await User.findOne({email})
    if(!user){
        return res.status(400).json({
            success: false,
            message:"Email not found.Please verify or register you email."
        })
    }
    const isPswMatch = await bcryptjs.compare(password,user.password)
    if(!isPswMatch){
        return res.status(400).json({
            success: false,
            message:"Password doesnot match. Please enter correct password."
        })
    }

    // generateToken(res, user) //jwt token generation

    user.lastLogin = new Date() //reseting the current date
    await user.save()

    const userWithoutPassword = await User.findOne({ email }).select(
        "-password"
      ); 

    return res.status(200).json({
        success: true,
        message: `Welcome Back, ${user.fullname}`,
        user: userWithoutPassword,

    })   


  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

{
  /*
    FOR REGISTER:-
        unique user, check email -> X
        logic if user already exists -> X
        if not hash the password (bcrypt) -> X
        verification token generate for the user email 
        user save with hashed pw -> X
        token generate of registered user (jwt)
        send verification token email to the user
        send response to the frontend without the user's psw

    FOR LOGIN:-
        check if the user email exists or not
        if not send error message
        if yes compare the hashed pws with the saved password
        generate token for the login

    FOR VERIFY:-
        get verification code from the request body
        then we find the one and unique verification code is searched
        another thing is also checked with this condition i.e if the code expiration date is greater than the current user date i.e the token hasn't been expired is checked
        if not found error msg is shown
        if found user isVerified variable is assigned a true value
        and the verification code and its expiration date is set to undefined value as it is not needed anymore
        then the user value is saved    
        welcome email is then send to user 
    
*/
}

// verificationTOkenExpiresAt:{$gt: Date.now()}