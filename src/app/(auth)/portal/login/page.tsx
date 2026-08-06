import Link from "next/link";
import { signInWithClientMagicLinkAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";
import { FormField, FormInput, FormLabel } from "@/components/ui/Form";

export default function ClientPortalLogin({ searchParams }: { searchParams?: { error?: string; status?: string } }) {
  const message = searchParams?.status === "magic_link_sent" ? "Magic link sent. Check your email inbox." : searchParams?.error === "invalid_email" ? "Enter a valid email address." : searchParams?.error ? "We could not send that link. Please try again." : null;
  return <div><p className="text-sm font-medium text-brand-700">Client portal</p><h1 className="mt-2 text-lg font-semibold text-neutral-900">Secure sign in</h1><p className="mt-2 text-sm text-neutral-600">Use the email address your case team has on file.</p>{message ? <p className="mt-4 rounded-lg bg-info-50 px-3 py-2 text-sm text-info-700">{message}</p> : null}<form action={signInWithClientMagicLinkAction} className="mt-6 space-y-4"><FormField><FormLabel htmlFor="email">Email address</FormLabel><FormInput id="email" name="email" type="email" autoComplete="email" required /></FormField><Button type="submit" className="w-full">Send secure link</Button></form><p className="mt-5 text-center text-xs text-neutral-500">Firm team? <Link className="font-medium text-brand-700" href="/login">Sign in here</Link></p></div>;
}
