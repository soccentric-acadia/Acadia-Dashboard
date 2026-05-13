"use client";

import { Suspense } from "react";
import { ConfigBuilder } from "@/components/configs/config-builder";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewConfigPage() {
    return (
        <div className="space-y-6 max-w-2xl">
            <h1 className="text-2xl font-bold">New Configuration</h1>
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <ConfigBuilder />
            </Suspense>
        </div>
    );
}
