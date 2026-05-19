"use client";
import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { MODULE_CATALOG, CATEGORY_ORDER, type ModuleDefinition } from "@/proto/module-catalog";
import { getModuleLabel } from "@/lib/utils";
import { ModuleIcon } from "@/components/primitives/module-icon";
import { LiveDot } from "@/components/primitives/live-dot";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { pageVariants, listItemVariants } from "@/components/motion/presets";

export default function ModulesPage() {
  const [filter, setFilter] = React.useState("");
  const modules = React.useMemo(() => Object.values(MODULE_CATALOG), []);

  const filtered = React.useMemo(() => {
    const q = filter.toLowerCase();
    if (!q) return modules;
    return modules.filter((m) => m.id.toLowerCase().includes(q) || m.displayName.toLowerCase().includes(q));
  }, [modules, filter]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, ModuleDefinition[]>();
    // Order by CATEGORY_ORDER first
    for (const cat of CATEGORY_ORDER) {
      const mods = filtered.filter((m) => m.category === cat);
      if (mods.length > 0) map.set(cat, mods);
    }
    // Remaining categories not in order
    for (const m of filtered) {
      if (!CATEGORY_ORDER.includes(m.category)) {
        const key = m.category;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(m);
      }
    }
    return map;
  }, [filtered]);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Hardware Modules</h1>
          <p className="text-sm text-muted-foreground">{modules.length} modules in inventory</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search…" className="h-8 pl-8 text-sm w-48 font-mono" />
        </div>
      </div>

      <div className="space-y-6">
        {Array.from(grouped.entries()).map(([cat, mods]) => (
          <div key={cat}>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">{cat}</div>
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
            >
              {mods.map((m) => (
                <motion.div key={m.id} variants={listItemVariants}>
                  <Link href={`/modules/${m.id}`}>
                    <div className="instrument-tile rounded-lg p-3 flex flex-col items-center gap-2 text-center cursor-pointer hover:border-primary/40 transition-colors group">
                      <ModuleIcon moduleId={m.id} size="md" className="text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="font-mono text-[10px] leading-tight">{getModuleLabel(m.id)}</span>
                      <LiveDot state="never" size="xs" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
initial = "hidden"
animate = "visible"
variants = {{ visible: { transition: { staggerChildren: 0.03 } } }}
              >
{
  mods.map((m) => (
    <motion.div key={m.id} variants={listItemVariants}>
      <Link href={`/modules/${m.id}`}>
        <div className="instrument-tile rounded-lg p-3 flex flex-col items-center gap-2 text-center cursor-pointer hover:border-primary/40 transition-colors group">
          <ModuleIcon moduleId={m.id} size="md" className="text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="font-mono text-[10px] leading-tight">{getModuleLabel(m.id)}</span>
          <LiveDot state="never" size="xs" />
        </div>
      </Link>
    </motion.div>
  ))
}
              </motion.div >
            </div >
          ))}
        </div >
      )}
    </motion.div >
  );
}
