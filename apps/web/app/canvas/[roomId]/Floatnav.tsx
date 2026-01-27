"use client";
import React from "react";
import { Tool } from "./types";
import {
  Square,
  Circle,
  MousePointer2,
  Type,
  Eraser,
  Minus,
  ArrowRight,
} from "lucide-react";


interface Props {
  activeTool: Tool; 
  setActiveTool: (tool: Tool) => void;
}

const Floatnav = ({ activeTool, setActiveTool }: Props) => {
  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#ffffff] border border-gray-200 p-1 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] select-none z-50">

      {/* Selection Tool */}
      <NavButton
        icon={<MousePointer2 size={19} strokeWidth={2.5} />}
        label="Selection"
        shortcut="1"
        isActive={activeTool === "select"}
        onSelect={() => setActiveTool("select")}
      />

      <div className="w-[1px] h-5 bg-gray-200 mx-1" />

      {/* Shape Tools */}
      <NavButton
        icon={<Square size={19} />}
        label="Rectangle"
        shortcut="2"
        isActive={activeTool === "rect"}
        onSelect={() => setActiveTool("rect")}
      />

      <NavButton
        icon={<Circle size={19} />}
        label="Circle"
        shortcut="3"
        isActive={activeTool === "ellipse"}
        onSelect={() => {
          console.log("Circle Tool Selected via onSelect");
          setActiveTool("ellipse");
        }}
      />

      {/* Line Tools (future) */}
      <NavButton icon={<Minus size={19} />} label="Line" shortcut="4" />
      <NavButton icon={<ArrowRight size={19} />} label="Arrow" shortcut="5" />

      <div className="w-[1px] h-5 bg-gray-200 mx-1" />

      {/* Utilities */}
      <NavButton icon={<Type size={19} />} label="Text" shortcut="6" />
      <NavButton icon={<Eraser size={19} />} label="Eraser" shortcut="0" />
    </nav>
  );
};

interface NavBtnProps {
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  isActive?: boolean;
  onSelect?: () => void;
}

const NavButton = ({
  icon,
  label,
  shortcut,
  isActive,
  onSelect,
}: NavBtnProps) => (
  <button
    onMouseDown={(e) => {
      console.log(`NavButton MouseDown: ${label}`);
      e.preventDefault();      
      e.stopPropagation();     
      onSelect?.();          
    }}
    onMouseUp={(e) => {
      e.stopPropagation(); 
    }}
    className={`
      group relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150
      ${isActive
        ? "bg-[#e0e0ff] text-[#6965db]"
        : "hover:bg-[#f0f0f8] text-gray-600 hover:text-gray-900"
      }
    `}
  >
    {icon}

    {/* Tooltip */}
    <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      <div className="bg-gray-800 text-white text-[11px] px-2 py-1 rounded-md flex items-center gap-2 whitespace-nowrap shadow-lg">
        <span className="font-medium">{label}</span>
        <span className="text-gray-400 border border-gray-600 px-1 rounded text-[9px]">
          {shortcut}
        </span>
      </div>
      <div className="w-2 h-2 bg-gray-800 rotate-45 -mt-1.5" />
    </div>
  </button>
);

export default Floatnav;
