/**
 * <SectionCard> — dashboard region wrapper card.
 * Provides a consistent Card container with a header row (title + optional actions).
 * Used as the outermost wrapper for each dashboard region.
 */
import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface SectionCardProps {
    title?: React.ReactNode;
    /** Rendered in the top-right of the card header */
    actions?: React.ReactNode;
    /** Extra classes on the outer Card */
    className?: string;
    /** Extra classes on the CardContent */
    contentClassName?: string;
    children: React.ReactNode;
    /** Remove default padding from content */
    noPadding?: boolean;
}

export function SectionCard({
    title,
    actions,
    className,
    contentClassName,
    children,
    noPadding = false,
}: SectionCardProps) {
    return (
        <Card className={cn("instrument-tile", className)}>
            {(title || actions) && (
                <CardHeader className="flex flex-row items-center justify-between gap-2 px-4 py-3 border-b border-border/50">
                    {title && (
                        <h2 className="text-sm font-semibold tracking-tight text-foreground/90 truncate">
                            {title}
                        </h2>
                    )}
                    {actions && (
                        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                            {actions}
                        </div>
                    )}
                </CardHeader>
            )}
            <CardContent className={cn(noPadding ? "p-0" : "p-4", contentClassName)}>
                {children}
            </CardContent>
        </Card>
    );
}
