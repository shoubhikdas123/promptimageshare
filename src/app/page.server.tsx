import { getPrompts } from "@/lib/prompts";
import { Suspense } from "react";
import ClientHomePage from "./ClientHomePage";

export default async function HomePage() {
  const prompts = getPrompts().slice(0, 50);
  return <ClientHomePage initialPrompts={prompts} />;
}
