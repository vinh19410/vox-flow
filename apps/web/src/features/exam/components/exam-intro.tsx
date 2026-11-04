import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ds/button";

import { PART_INFO } from "../data";
import type { Part } from "../types";

export interface ExamIntroProps {
  part: Part;
  onBegin: () => void;
}

export function ExamIntro({ part, onBegin }: ExamIntroProps) {
  const info = PART_INFO[part];
  return (
    <div className="m-auto animate-rise text-center">
      <div className="font-mono text-sm text-brand">PART {part}</div>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{info.title.split(" · ")[1]}</h1>
      <p className="mx-auto mt-4 max-w-md text-white/60">{info.desc}</p>
      <Button variant="accent" size="lg" className="mt-10" onClick={onBegin}>
        Bắt đầu Part {part} <ArrowRight size={18} />
      </Button>
    </div>
  );
}
