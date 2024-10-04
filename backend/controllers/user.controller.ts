import { Request, Response } from "express";
import { User } from "../models/user.model";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import cloudinary from "../utils/cloudinary";
import { generateToken } from "../utils/generateToken";
import { generateVerificationCode } from "../utils/generateVerificationCode";
import { sendPasswordResetEmail, sendResetSuccessEmail, sendVerificationEmail, sendWelcomeEmail } from "../mailtrap/email";

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

    const verificationToken = generateVerificationCode()

    user = await User.create({
      fullname,
      email,
      password: hashedPassword,
      contact: Number(contact), // because in our model its types is number and the value we recieve is of string so to remove the error we convert the input data to numeric value
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // verification token expires after one days if more that 1 day needed multiply it with the required no. of days
    });

    // generate a jwt token to store the registered user data
    generateToken(res, user)
    sendVerificationEmail(email,verificationToken)

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
    return res.status(500).json({ message: "Internal Server Error In Signup" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email not found.Please verify or register you email.",
      });
    }
    const isPswMatch = await bcryptjs.compare(password, user.password);
    if (!isPswMatch) {
      return res.status(400).json({
        success: false,
        message: "Password doesnot match. Please enter correct password.",
      });
    }

    generateToken(res, user) //jwt token generation

    user.lastLogin = new Date(); //reseting the current date
    await user.save();

    const userWithoutPassword = await User.findOne({ email }).select(
      "-password"
    );

    return res.status(200).json({
      success: true,
      message: `Welcome Back, ${user.fullname}`,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error In Login",
    });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { verificationCode } = req.body;
    console.log(verificationCode)
    const user = await User.findOne({
      verificationToken: verificationCode,
      verificationTokenExpiresAt: { $gt: Date.now() },
    }).select("-password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    await  sendWelcomeEmail(user.email,user.fullname) // send welcome email

    return res.status(200).json({
      success: true,
      message: "Email Verified Successfully",
      user,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error In VerifyEmail",
    });
  }
};

export const logout = async (_: Request, res: Response) => {
  // _ is replaced by res becuz res isnot used
  try {
    return res.clearCookie("token").status(200).json({
      success: true,
      message: "Logged Out Successfully.",
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error In Logout",
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User doesn't exists",
      });
    }
    const resetToken = crypto.randomBytes(40).toString("hex");
    const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // expires in 1 hrs
    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpiresAt = resetTokenExpiresAt;
    await user.save();

    // send reset email
    await sendPasswordResetEmail(user.email, `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`)

    return res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error In Forgot Password",
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpiresAt: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset password link invalid or expired.",
      });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiresAt = undefined;
    await user.save();

    // sending success reset email
    await sendResetSuccessEmail(user.email)

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error In Reset Password",
    });
  }
};

export const checkAuth = async (req: Request, res: Response) => {
  try {
    const userId = req.id;
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        };
        return res.status(200).json({
            success: true,
            user
        });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error In Check Auth",
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.id;
        const { fullname, email, address, city, country, profilePicture } = req.body;
        // upload image on cloudinary
        let cloudResponse: any;
        cloudResponse = await cloudinary.uploader.upload(profilePicture);
        const updatedData = {fullname, email, address, city, country, profilePicture};

        const user = await User.findByIdAndUpdate(userId, updatedData,{new:true}).select("-password");

        return res.status(200).json({
            success:true,
            user,
            message:"Profile updated successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

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
        genereate cookie and save the cookie 

    FOR VERIFY:-
        get verification code from the request body
        then we find the one and unique verification code is searched
        another thing is also checked with this condition i.e if the code expiration date is greater than the current user date i.e the token hasn't been expired is checked
        if not found error msg is shown
        if found user isVerified variable is assigned a true value
        and the verification code and its expiration date is set to undefined value as it is not needed anymore
        then the user value is saved    
        welcome email is then send to user       
// verificationTOkenExpiresAt:{$gt: Date.now()}
    
*/
}

