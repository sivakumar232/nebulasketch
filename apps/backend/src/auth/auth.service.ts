import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient as prisma } from "@repo/db/client";


export const authService = {
    async register(email: string, password: string, name: string) {
        try{

        // Hash password with bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save new user with email password and name
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });

        const userId = user.id;

        // Generate JWT token
        const token = jwt.sign(
            { userId, email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return {
            token,
            user: { userId, email, name }
        };
       }catch(e){
        throw new Error("register error")
       }
    },

    async login(email: string, password: string) {
        try{
        //Fetching  user from database
        const user= await prisma.user.findUnique({
            where:{email:email}
        })
        if(!user){
            return ;
        }
        const userId=user.id
        //compare the both passwords
        const isvalid=await bcrypt.compare(password, user.password)
        // if isvalid true then generate a token or thrw error


        if(!isvalid){
            throw new Error("Invalid password or email");
            
        }
                        const token = jwt.sign(
            { userId, email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return {
            token,
            user: { userId, email }
         };
        }
        catch(error){
            console.error("Login error",error)
            throw new Error("Login error")
        }
   }
};