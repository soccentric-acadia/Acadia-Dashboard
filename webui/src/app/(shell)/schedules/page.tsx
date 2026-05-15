"use client";
import * as React from "react";
import { motion } from "motion/react";
import { Calendar, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/primitives/section-card";
import { pageVariants } from "@/components/motion/presets";

export default function SchedulesPage() {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Schedules</h1>
          <p className="text-sm text-muted-foreground">Automated test run scheduling</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8"><Plus className="h-3.5 w-3.5" /> New Schedule</Button>
      </div>
      <SectionCard title="Upcoming">
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No schedules configured</p>
          <Button variant="outline" size="sm">Create your first schedule</Button>
        </div>
      </SectionCard>
    </motion.div>
  );
}
