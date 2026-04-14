import React from "react";
import {
  MousePointer2,
  Eraser,
  Pencil,
  Circle,
} from "lucide-react";
import { Tool } from "./types";

interface Props {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
}

const COLORS = [
  "#000000", "#ffffff", "#888888", "#ff0000",
  "#ff8800", "#ffff00", "#00ff00", "#00ffff",
  "#0000ff", "#ff00ff"
];

const THICKNESSES = [
  { size: 2, label: "S" },
  { size: 4, label: "M" },
  { size: 10, label: "L" },
  { size: 20, label: "XL" },
];

const Floatnav = ({ activeTool, setActiveTool, strokeColor, setStrokeColor, strokeWidth, setStrokeWidth }: Props) => {
  return (
    <div className="flex flex-col gap-3">
        {/* UPPER ROW: TOOLS & THICKNESS */}
        <div className="flex items-center gap-4">
            {/* THICKNESS BOX */}
            <div className="bg-white border-2 border-[#0a0a0a] shadow-[4px_4px_0px_#0a0a0a] p-1 gap-1 flex items-center">
                {THICKNESSES.map((t) => (
                    <button
                        key={t.size}
                        onClick={() => setStrokeWidth(t.size)}
                        className={`w-8 h-8 flex items-center justify-center transition-all ${strokeWidth === t.size ? "bg-[#0a0a0a] text-white" : "hover:bg-[#f5f0e8] text-[#0a0a0a]"}`}
                    >
                        <div 
                          className="rounded-full bg-current" 
                          style={{ width: Math.min(20, t.size + 4), height: Math.min(20, t.size + 4) }} 
                        />
                    </button>
                ))}
            </div>

            {/* TOOLS BOX */}
            <nav
                className="flex items-center gap-1 p-1 select-none"
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
                <NavButton icon={<MousePointer2 size={16} />} label="Select" shortcut="V" isActive={activeTool === "select"} onSelect={() => setActiveTool("select")} />
                <Divider />
                <NavButton icon={<Pencil size={16} />} label="Pen" shortcut="P" isActive={activeTool === "line"} onSelect={() => setActiveTool("line")} />
                <NavButton icon={<Eraser size={16} />} label="Eraser" shortcut="E" isActive={activeTool === "eraser"} onSelect={() => setActiveTool("eraser")} />
            </nav>
        </div>

        {/* LOWER ROW: COLORS */}
        <div className="bg-white border-2 border-[#0a0a0a] shadow-[4px_4px_0px_#0a0a0a] p-2 flex flex-wrap gap-2 justify-center max-w-[320px]">
            {COLORS.map((c) => (
                <button
                    key={c}
                    onClick={() => setStrokeColor(c)}
                    className={`w-6 h-6 border-2 border-[#0a0a0a] transition-transform active:scale-95 ${strokeColor === c ? "scale-110 shadow-[2px_2px_0px_#0a0a0a]" : "hover:scale-105"}`}
                    style={{ backgroundColor: c }}
                />
            ))}
            <div className="w-px h-6 bg-[#0a0a0a]/10 mx-1" />
            <div 
                className="w-6 h-6 border-2 border-[#0a0a0a] shadow-[inset_0_0_0_2px_white]"
                style={{ backgroundColor: strokeColor }}
            />
        </div>
    </div>
  );
};

const Divider = () => (
  <div className="w-px h-4 mx-1 shrink-0" style={{ background: "var(--ink)", opacity: 0.2 }} />
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
    className="group relative flex items-center justify-center w-9 h-9 transition-all duration-100"
    style={{
      background: isActive ? "var(--ink)" : "transparent",
      color: isActive ? "var(--paper)" : "var(--ink)",
      borderRadius: "3px",
    }}
  >
    {icon}
  </button>
);

export default Floatnav;
