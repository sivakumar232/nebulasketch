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
      className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 select-none z-[100]"
      style={{
        background: "var(--paper)",
        border: "2px solid var(--ink)",
        boxShadow: "4px 4px 0 var(--ink)",
        borderRadius: "4px",
        fontFamily: "var(--font-mono)",
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <NavButton icon={<MousePointer2 size={17} strokeWidth={2} />} label="Select" shortcut="V" isActive={activeTool === "select"} onSelect={() => setActiveTool("select")} />
      <Divider />
      <NavButton icon={<Square size={17} />} label="Rectangle" shortcut="R" isActive={activeTool === "rect"} onSelect={() => setActiveTool("rect")} />
      <NavButton icon={<Circle size={17} />} label="Ellipse" shortcut="O" isActive={activeTool === "ellipse"} onSelect={() => setActiveTool("ellipse")} />
      <NavButton icon={<Minus size={17} />} label="Line" shortcut="L" isActive={activeTool === "line"} onSelect={() => setActiveTool("line")} />
      <NavButton icon={<ArrowRight size={17} />} label="Arrow" shortcut="A" isActive={activeTool === "arrow"} onSelect={() => setActiveTool("arrow")} />
      <Divider />
      <NavButton icon={<Type size={17} />} label="Text" shortcut="T" isActive={activeTool === "text"} onSelect={() => setActiveTool("text")} />
      <NavButton icon={<Eraser size={17} />} label="Eraser" shortcut="E" isActive={activeTool === "eraser"} onSelect={() => setActiveTool("eraser")} />
    </nav>
  );
};

const Divider = () => (
  <div className="w-px h-5 mx-1 shrink-0" style={{ background: "var(--ink)", opacity: 0.2 }} />
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
    className="group relative flex items-center justify-center w-9 h-9 transition-all duration-100"
    style={{
      background: isActive ? "var(--ink)" : "transparent",
      color: isActive ? "var(--paper)" : "var(--ink)",
      borderRadius: "3px",
    }}
  >
    {icon}
    {/* Tooltip */}
    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-[110]">
      <div
        className="text-[10px] px-2 py-1 flex items-center gap-1.5"
        style={{
          background: "var(--ink)",
          color: "var(--paper)",
          fontFamily: "var(--font-mono)",
          borderRadius: "2px",
        }}
      >
        <span>{label}</span>
        <kbd
          className="px-1 text-[9px]"
          style={{
            background: "rgba(255,255,255,0.15)",
            borderRadius: "2px",
          }}
        >
          {shortcut}
        </kbd>
      </div>
      <div className="flex justify-center">
        <div className="w-2 h-2 rotate-45 -mt-1" style={{ background: "var(--ink)" }} />
      </div>
    </div>
  </button>
);

export default Floatnav;
