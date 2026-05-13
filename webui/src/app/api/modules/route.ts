// This route has been DISABLED.
// Per REQ.md §4, the WebUI must source the module list from the Acadia Server
// (GET /api/v1/modules), never from its own local copy on disk.
//
// Previously this route read Acadia-HAL/protos/registry/modules.yaml directly.
// That approach violates the contract between components and has been removed.

import { NextResponse } from "next/server";

// 410 Gone — callers should use the Server endpoint directly.
export function GET() {
    return NextResponse.json(
        { error: "Deprecated. Use GET /api/v1/modules on the Acadia Server." },
        { status: 410 },
    );
}
