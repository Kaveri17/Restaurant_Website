import cloudinary from "./cloudinary";

const uploadImageOnCloudinary = async (file: Express.Multer.File)=>{
    const base64Image = Buffer.from(file.buffer).toString("base64")
    const dataURI = `data:${file.mimetype};base64,${base64Image}`
    const uploadResponse = await cloudinary.uploader.upload(dataURI)
    return uploadResponse.secure_url
}
export default uploadImageOnCloudinary;

{/*
base64:- it is a way to represent binary data(like an img) using text.
Computers store data as binary (1s and 0s). Base64 takes that data and converts it into a string that can easily be sent in text-based formats (like in a web request)


file.buffer: 
    Holds the raw binary data of the uploaded image.
    This data is not directly usable in web requests or responses because it’s in binary form.

Buffer.from(file.buffer): 
    Creates a Buffer object that allows you to manipulate the raw binary data easily.
    You need this buffer because you're going to transform the raw image data into another format (Base64).
.toString("base64"): 
    Converts the buffer (raw binary data) into a Base64 string.
    This string can now be used in web requests (like uploading to Cloudinary), as Base64 is a format that works well with text-based systems (like HTTP requests).

*/}