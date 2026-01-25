"use client"
import { useEffect, useState } from "react"
import { withDiff } from "tldraw"

export function useWindowSize(){
    const [size,setSize] =useState({width:0,height:0})

    useEffect(()=>{
        const update =()=>
        {
            setSize({width:window.innerWidth,height:window.innerHeight})

        }
        update();
        window.addEventListener("resize",update)
        return ()=> window.removeEventListener("resize",update)

    },[]);
    return size;
}