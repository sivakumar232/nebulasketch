"use client"
import React from 'react'
import { useShapes } from './useShapes';

interface Props {
  addShape: (type: "rect" | "circle") => void;
}
const Floatnav = ({addShape}:Props) => {
  return (
    <div className="fixed top-1/2 left-4 bg-white shadow p-2 rounded">
      <button onClick={() => addShape("rect")}>Rect</button>
      <button onClick={() => addShape("circle")}> Circle</button>
    </div>
  );
}

export default Floatnav