import { NextResponse } from "next/server";

// Define a type for the allowed actions
type KiwiAction = 
  | "getServiceInfo" 
  | "getLiveServiceInfo" 
  | "start" 
  | "stop" 
  | "restart" 
  | "kill";

export async function POST(request: Request) {
  try {
    const { veid, api_key, action = "getServiceInfo" } = await request.json();

    if (!veid || !api_key) {
      return NextResponse.json(
        { error: "VEID and API key are required" },
        { status: 400 }
      );
    }

    const validActions: KiwiAction[] = ["getServiceInfo", "getLiveServiceInfo", "start", "stop", "restart", "kill"];
    if (!validActions.includes(action)) {
        return NextResponse.json(
            { error: "Invalid action specified" },
            { status: 400 }
        );
    }

    const kiwiAPI = `https://api.64clouds.com/v1/${action}?veid=${veid}&api_key=${api_key}`;

    const response = await fetch(kiwiAPI, {
      headers: {
        "User-Agent": "KiwiVM-Dashboard/1.0",
      },
    });

    // KiwiVM might return non-JSON responses on error (e.g., plain text)
    const responseText = await response.text();

    if (!response.ok) {
      console.error(`KiwiVM API Error (Status: ${response.status}): ${responseText}`);
      // Try to parse as JSON, as some errors might be structured
      try {
        const errorJson = JSON.parse(responseText);
        return NextResponse.json(
          { error: errorJson.error || "KiwiVM API returned an error." },
          { status: response.status }
        );
      } catch {
        // If not JSON, return the raw text, which is more informative
        return NextResponse.json(
          { error: `KiwiVM API request failed: ${responseText}` },
          { status: response.status }
        );
      }
    }
    
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (error) {
       console.error("Failed to parse KiwiVM response:", error);
       return NextResponse.json({ error: "Failed to parse response from KiwiVM API." }, { status: 500 });
    }

  } catch (error) {
    console.error("API route internal error:", error);
    const message = error instanceof Error ? error.message : "An internal server error occurred.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
