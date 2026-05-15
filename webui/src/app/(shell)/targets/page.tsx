"use client";
import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { SectionCard } from "@/components/primitives/section-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Target, ChevronRight } from "lucide-react";
import { pageVariants } from "@/components/motion/presets";
import { cn } from "@/lib/utils";

export default function TargetsPage() {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Targets</h1>
          <p className="text-sm text-muted-foreground">Hardware target device registry</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8"><Plus className="h-3.5 w-3.5" /> Add Target</Button>
      </div>
      <SectionCard title="Registered Targets">
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Target className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No targets registered</p>
          <Button variant="outline" size="sm">Register target</Button>
        </div>
      </SectionCard>
    </motion.div>
  );
}
