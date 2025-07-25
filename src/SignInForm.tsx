"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          signIn("resend", formData)
            .then(() => {
              toast.success("Check your email for a sign-in link!");
            })
            .catch((error) => {
              console.error(error);
              toast.error("Could not send sign-in link, please try again.");
            })
            .finally(() => {
              setSubmitting(false);
            });
        }}
      >
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          Sign in with Email
        </button>
      </form>
      <div className="flex items-center justify-center my-3">
        <hr className="my-4 grow border-gray-200" />
        <span className="mx-4 text-secondary">or</span>
        <hr className="my-4 grow border-gray-200" />
      </div>
      <button
        className="auth-button"
        onClick={() => {
          signIn("anonymous").catch((error) => {
            console.error(error);
            toast.error("Could not sign in anonymously, please try again.");
          });
        }}
      >
        Sign in anonymously
      </button>
    </div>
  );
}
