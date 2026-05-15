"use client";
import * as React from "react";
import { motion } from "motion/react";
import { SectionCard } from "@/components/primitives/section-card";
import {  BookOpen, Terminal, Activity } from "lucide-react";
import { pageVariants } from "@/components/motion/presets";

const SHORTCUTS = [
  { keys: ["⌘", "K"], description: "Open command palette" },
  { keys: ["B"], description: "Toggle sidebar" },
  { keys: ["⌘", "N"], description: "New run" },
  { keys: ["⌘", "/"], description: "Toggle help" },
];

const SECTIONS = [
  { icon: Activity, title: "Running tests", content: "Navigate to Runs → New Run to start a hardware test. Select a module, choose test mode, optionally attach a configuration, then launch." },
  { icon: Terminal, title: "CLI & API", content: "The Acadia server exposes a REST API at /api/v1. All endpoints are documented via OpenAPI at /api/v1/docs. Run `acadia --help` for CLI usage." },
  { icon: BookOpen, title: "Configuration", content: "Test configurations define module parameters, thresholds, and iteration counts. Create them under Configs, then reference them when starting a run." },
];

export default function HelpPage() {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Help</h1>
        <p className="text-sm text-muted-foreground">Acadia IV&V Dashboard reference</p>
      </div>
      <SectionCard title="Shortcuts">
        <div className="space-y-2">
          {SHORTCUTS.map(({ keys, description }) => (
            <div key={description} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{description}</span>
              <div className="flex items-center gap-1">
                {keys.map((k) => (
                  <kbd key={k} className="inline-flex items-center rounded border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-[10px]">{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
      <div className="space-y-3">
        {SECTIONS.map(({ icon: Icon, title, content }) => (
          <SectionCard key={title} title={title}>
            <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
          </SectionCard>
        ))}
      </div>
    </motion.div>
  );
}
