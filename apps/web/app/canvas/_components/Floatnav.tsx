"use client";
import React from "react";
import {
  Square,
  Circle,
  MousePointer2,
  Type,
  Eraser,
  Minus,
  ArrowRight,
} from "lucide-react";
import { Tool } from "./types";

interface Props {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
}

const Floatnav = ({ activeTool, setActiveTool }: Props) => {
  return (
    <nav
      className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white border border-gray-200 p-1.5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] select-none z-[100]"
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Selection */}
      <NavButton
        icon={<MousePointer2 size={18} strokeWidth={2} />}
        label="Select"
        shortcut="V"
        isActive={activeTool === "select"}
        onSelect={() => setActiveTool("select")}
      />

      <Divider />

      {/* Shapes */}
      <NavButton
        icon={<Square size={18} />}
        label="Rectangle"
        shortcut="R"
        isActive={activeTool === "rect"}
        onSelect={() => setActiveTool("rect")}
      />
      <NavButton
        icon={<Circle size={18} />}
        label="Ellipse"
        shortcut="O"
        isActive={activeTool === "ellipse"}
        onSelect={() => setActiveTool("ellipse")}
      />
      <NavButton
        icon={<Minus size={18} />}
        label="Line"
        shortcut="L"
        isActive={activeTool === "line"}
        onSelect={() => setActiveTool("line")}
      />
      <NavButton
        icon={<ArrowRight size={18} />}
        label="Arrow"
        shortcut="A"
        isActive={activeTool === "arrow"}
        onSelect={() => setActiveTool("arrow")}
      />

      <Divider />

      {/* Utilities */}
      <NavButton
        icon={<Type size={18} />}
        label="Text"
        shortcut="T"
        isActive={activeTool === "text"}
        onSelect={() => setActiveTool("text")}
      />
      <NavButton
        icon={<Eraser size={18} />}
        label="Eraser"
        shortcut="E"
        isActive={activeTool === "eraser"}
        onSelect={() => setActiveTool("eraser")}
      />
    </nav>
  );
};

const Divider = () => (
  <div className="w-px h-5 bg-gray-200 mx-1.5 shrink-0" />
);

interface NavBtnProps {
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  isActive?: boolean;
  onSelect?: () => void;
}

const NavButton = ({ icon, label, shortcut, isActive, onSelect }: NavBtnProps) => (
  <button
    title={`${label} (${shortcut})`}
    onMouseDown={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onSelect?.();
    }}
    onPointerDown={(e) => e.stopPropagation()}
    onMouseUp={(e) => e.stopPropagation()}
    className={`
      group relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-100
      ${isActive
        ? "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
      }
    `}
  >
    {icon}

    {/* Tooltip — rendered above the button */}
    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-[110]">
      <div className="bg-gray-900 text-white text-[11px] px-2 py-1 rounded-md flex items-center gap-1.5 shadow-lg">
        <span className="font-medium">{label}</span>
        <kbd className="bg-white/15 px-1 rounded text-[10px] font-mono">{shortcut}</kbd>
      </div>
      {/* Arrow */}
      <div className="flex justify-center">
        <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
      </div>
    </div>
  </button>
);

export default Floatnav;
