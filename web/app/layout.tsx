export const metadata = { title: "Tollgate on Mezo", description: "Pay-per-request API tolls for AI agents, settled in MUSD" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#0b0b0f", color: "#eee", margin: 0 }}>{children}</body></html>);
}
