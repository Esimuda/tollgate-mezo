import { NextResponse } from "next/server";
// Sample upstream API used in the demo walkthrough (stands in for any builder API).
export const GET = () => NextResponse.json({ pair: "USD/NGN", rate: 1532.4, source: "demo", at: new Date().toISOString() });
