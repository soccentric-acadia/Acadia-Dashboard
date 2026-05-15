"use client";
import * as React from "react";

import { motion } from "motion/react";
import { SectionCard } from "@/components/primitives/section-card";
import { Button } from "@/components/ui/button";
import { Plus, FileCode } from "lucide-react";
import { pageVariants } from "@/components/motion/presets";

export default function TemplatesPage() {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Templates</h1>
          <p className="text-sm text-muted-foreground">Reusable run configurations and test suites</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8"><Plus className="h-3.5 w-3.5" /> New Template</Button>
      </div>
      <SectionCard title="Saved Templates">
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <FileCode className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No templates saved yet</p>
          <p className="text-xs text-muted-foreground">Templates let you quickly re-run a set of modules with the same configuration</p>
          <Button variant="outline" size="sm">Create template</Button>
        </div>
      </SectionCard>
    </motion.div>
  );
}
