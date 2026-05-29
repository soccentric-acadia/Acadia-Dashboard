"use client";

import { BarChart2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportingPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-3">
                <BarChart2 className="h-6 w-6 text-primary" />
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Reporting</h1>
                    <p className="text-sm text-muted-foreground">Generate and view test reports</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Test Summary</CardTitle>
                        <CardDescription>Aggregated pass/fail statistics</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">No report data available.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Trend Analysis</CardTitle>
                        <CardDescription>Pass/fail trends over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">No trend data available.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Export Reports</CardTitle>
                        <CardDescription>Download reports in various formats</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">No reports to export.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
