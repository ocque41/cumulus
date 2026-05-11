import { redirect } from "next/navigation";

type SignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const resolvedSearchParams = await searchParams;
  const nextSearchParams = new URLSearchParams();

  nextSearchParams.set("mode", "signup");

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (key === "mode" || typeof value !== "string") {
      continue;
    }

    nextSearchParams.set(key, value);
  }

  redirect(`/login?${nextSearchParams.toString()}`);
}
