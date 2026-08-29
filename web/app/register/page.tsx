"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").trim(),
    email: z.string().email("Please enter a valid email").trim().toLowerCase(),
    phone: z.string().trim().optional().or(z.literal("")),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["BUYER", "FARMER"]),
    farmName: z.string().trim().optional(),
    location: z.string().trim().optional(),
    bio: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "FARMER") {
      if (!data.farmName || data.farmName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Farm name is required",
          path: ["farmName"],
        });
      }
      if (!data.location || data.location.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Location is required",
          path: ["location"],
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "BUYER" },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const role = watch("role");

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.details) {
          const first = Object.values(data.details).flat()[0] as string | undefined;
          setServerError(first || data.error || "Registration failed");
        } else {
          setServerError(data.error || "Registration failed");
        }
        return;
      }
      const userRole = data.user?.role;
      if (userRole === "FARMER") router.push("/farmer/dashboard");
      else if (userRole === "BUYER") router.push("/buyer/dashboard");
      else router.push("/");
      router.refresh();
    } catch {
      setServerError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#fbfbf5] px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-black">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Join Mlimi Market as a buyer or farmer
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {serverError && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" placeholder="Jane Doe" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" placeholder="+265 ..." {...register("phone")} />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">I want to join as</Label>
              <Select id="role" {...register("role")}>
                <option value="BUYER">Buyer — I want to purchase produce</option>
                <option value="FARMER">Farmer — I want to sell produce</option>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {role === "FARMER" && (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-4">
                <p className="text-sm font-medium text-zinc-900">Farmer details</p>
                <div className="space-y-2">
                  <Label htmlFor="farmName">Farm name</Label>
                  <Input id="farmName" placeholder="Green Valley Farm" {...register("farmName")} />
                  {errors.farmName && (
                    <p className="text-sm text-red-600">{errors.farmName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="Lilongwe" {...register("location")} />
                  {errors.location && (
                    <p className="text-sm text-red-600">{errors.location.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio (optional)</Label>
                  <Textarea id="bio" placeholder="Tell buyers about your farm" {...register("bio")} />
                </div>
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-black hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
