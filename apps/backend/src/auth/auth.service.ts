import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


export const authService={
    async register(email:string,password:string){

    },
    async login(email:string,password:string){
        const userID=1;
        const token=jwt.sign({
            userID
        },"secret");
        return {
            token
        }
    }

}