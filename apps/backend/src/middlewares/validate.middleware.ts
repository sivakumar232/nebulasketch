import { ZodSchema } from 'zod';
import { NextFunction, Response, Request } from 'express';
export const validate=(Schema:ZodSchema)=>(req:Request,res:Response,next: NextFunction)=>{
    Schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
next();
}