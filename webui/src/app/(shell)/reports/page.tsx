"use client";
import * as React from "react";
import { motion } from "motion/react";
import { BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/primitives/section-card";
import { pageVariants } from "@/components/motion/presets";

export default function ReportsPage() {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Export and analyze test run data</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8"><Download className="h-3.5 w-3.5" /> Export CSV</Button>
      </div>
      <SectionCard title="Generated Reports">
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No reports generated yet</p>
          <p className="text-xs text-muted-foreground">Reports are generated from completed runs</p>
        </div>
      </SectionCard>
    </motion.div>
  );
}
