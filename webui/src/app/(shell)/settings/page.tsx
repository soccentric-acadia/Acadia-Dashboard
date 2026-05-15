"use client";
import * as React from "react";
import { motion } from "motion/react";
import { useBoard } from "@/lib/board/context";
import { SectionCard } from "@/components/primitives/section-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { Server, Moon, Sun, Monitor, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageVariants } from "@/components/motion/presets";

export default function SettingsPage() {
  const { board } = useBoard();
  const { theme, setTheme } = useTheme();

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-5 max-w-xl">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Dashboard preferences and board configuration</p>
      </div>

      <SectionCard title="Board">
        {board ? (
          <div className="space-y-2">
            {[
              { label: "Hostname", value: board.hostname ?? board.name },
              { label: "Model", value: board.model ?? "—" },
              { label: "Status", value: <Badge variant={board.status === "online" ? "default" : "secondary"} className="capitalize text-xs">{board.status}</Badge> },
              { label: "ID", value: <span className="font-mono text-xs">{board.id}</span> },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center text-sm py-1">
                <span className="text-muted-foreground">{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
            <Server className="h-4 w-4" /> No board connected
          </div>
        )}
      </SectionCard>

      <SectionCard title="Appearance">
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Theme</Label>
          <div className="flex gap-2">
            {[
              { value: "light", icon: Sun, label: "Light" },
              { value: "dark", icon: Moon, label: "Dark" },
              { value: "system", icon: Monitor, label: "System" },
            ].map(({ value, icon: Icon, label }) => (
              <Button
                key={value}
                variant={theme === value ? "default" : "outline"}
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setTheme(value)}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </Button>
            ))}
          </div>
        </div>
      </SectionCard>
    </motion.div>
  );
}
