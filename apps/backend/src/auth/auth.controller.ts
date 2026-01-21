import { Response,Request } from "express";
import { authService } from "./auth.service";
export const register=async(res:Response,req:Request)=>{
    const {email,password}=req.body;
    const user= await authService.register;
    console.log(user);
}
export const login=async(res:Response,req:Request)=>{
    const {email,password}=req.body;
    const user= await authService.login;
    console.log(user);
}