"use client"
import React, { useState } from 'react' 
import {Stage,Layer,Rect, Circle} from "react-konva"
import { useWindowSize } from '../../hooks/useWindow';
import Floatnav from './Floatnav';
import { useShapes } from './useShapes';


const Canvas = () => {
    const {width,height} =useWindowSize()
    const {shapes,addShape}= useShapes();
  return (
    <>
    <Floatnav addShape={addShape}/>
          <Stage width={width} height={height} draggable className="no-scrollbar overflow-y-auto">
      <Layer>
{shapes.map((s) => {
  if (s.type === "rect") {
    return (
      <Rect
        key={s.id}
        x={s.x}
        y={s.y}
        width={100}
        height={60}
        draggable
        stroke={'black'}
      />
    );
  }

  if (s.type === "circle") {
    return (
      <Circle
        key={s.id}
        x={s.x}
        y={s.y}
        radius={40}  
        stroke={'skyblue'}
        draggable      
      />
    );
  }

  return null;
})}

      </Layer>
    </Stage>
    </>

  )
}

export default Canvas