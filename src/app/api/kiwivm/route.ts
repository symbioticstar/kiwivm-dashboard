import { NextResponse } from "next/server";
import { KiwiVMApi } from "@/lib/kiwivm";

// Define a type for the allowed actions
type KiwiAction = keyof KiwiVMApi;

export async function POST(request: Request) {
  try {
    const { veid, api_key, action = "getServiceInfo" } = await request.json();

    if (!veid || !api_key) {
      return NextResponse.json(
        { error: "VEID and API key are required" },
        { status: 400 },
      );
    }

    const kiwiApi = new KiwiVMApi(veid, api_key);

    if (typeof kiwiApi[action as KiwiAction] !== "function") {
      return NextResponse.json(
        { error: "Invalid action specified" },
        { status: 400 },
      );
    }

    // @ts-expect-error: action is a valid key of KiwiVMApi
    const data = await kiwiApi[action]();

    return NextResponse.json(data);
  } catch (error) {
    console.error("API route internal error:", error);
    const message =
      error instanceof Error ? error.message : "An internal server error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
