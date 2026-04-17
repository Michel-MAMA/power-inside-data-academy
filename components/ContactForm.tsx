"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema } from "@/lib/validations";
import type { ContactFormValues } from "@/types";

export default function ContactForm() {
    const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ContactFormValues>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            prenom: "",
            nom: "",
            email: "",
            message: "",
            sujet: "Demande de contact",
        },
    });

    async function onSubmit(values: ContactFormValues) {
        setStatus("sending");

        const response = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
        });

        if (response.ok) {
            setStatus("success");
            reset();
            return;
        }

        setStatus("error");
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-300">
                    <span>Prénom</span>
                    <input {...register("prenom")} className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-white outline-none transition focus:border-sky-500" />
                    {errors.prenom && <span className="text-sm text-rose-400">{errors.prenom.message}</span>}
                </label>
                <label className="space-y-2 text-sm text-slate-300">
                    <span>Nom</span>
                    <input {...register("nom")} className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-white outline-none transition focus:border-sky-500" />
                    {errors.nom && <span className="text-sm text-rose-400">{errors.nom.message}</span>}
                </label>
            </div>

            <label className="space-y-2 text-sm text-slate-300">
                <span>Email</span>
                <input type="email" {...register("email")} className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-white outline-none transition focus:border-sky-500" />
                {errors.email && <span className="text-sm text-rose-400">{errors.email.message}</span>}
            </label>

            <label className="space-y-2 text-sm text-slate-300">
                <span>Sujet</span>
                <input {...register("sujet")} className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-white outline-none transition focus:border-sky-500" />
            </label>

            <label className="space-y-2 text-sm text-slate-300">
                <span>Message</span>
                <textarea rows={5} {...register("message")} className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-white outline-none transition focus:border-sky-500" />
                {errors.message && <span className="text-sm text-rose-400">{errors.message.message}</span>}
            </label>

            <button type="submit" className="inline-flex w-full items-center justify-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 sm:w-auto">
                {status === "sending" ? "Envoi..." : "Envoyer le message"}
            </button>

            {status === "success" && <p className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">Message envoyé ! Nous revenons vers vous sous 24h.</p>}
            {status === "error" && <p className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">Une erreur est survenue, réessayez ou contactez-nous directement.</p>}
        </form>
    );
}
