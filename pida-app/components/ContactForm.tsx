"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Loader2 } from "lucide-react";
import { contactSchema, type ContactSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";

const sujetOptions = [
  { value: "devis", label: "Demande de devis" },
  { value: "inscription", label: "Inscription à une formation" },
  { value: "financement", label: "Financement & CPF" },
  { value: "partenariat", label: "Partenariat" },
  { value: "information", label: "Demande d'information" },
  { value: "support", label: "Support technique" },
  { value: "autre", label: "Autre" },
];

export default function ContactForm() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactSchema>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactSchema) => {
    setServerError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur lors de l'envoi");
      setSuccess(true);
      reset();
    } catch {
      setServerError("Une erreur s'est produite. Veuillez réessayer.");
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-dim border border-emerald/30 flex items-center justify-center">
          <CheckCircle className="text-emerald" size={28} />
        </div>
        <h3 className="font-display font-bold text-xl text-white">Message envoyé !</h3>
        <p className="text-sm text-white-60 max-w-xs">
          Nous avons bien reçu votre message et vous répondrons dans les 24 heures ouvrées.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-2 text-sm text-blue hover:underline"
        >
          ← Envoyer un autre message
        </button>
      </div>
    );
  }

  const fieldClass = (hasError: boolean) =>
    cn(
      "w-full bg-slate border rounded-xl px-4 py-3 text-sm text-white placeholder-white-35 outline-none transition-all",
      hasError
        ? "border-red-500/50 focus:border-red-500"
        : "border-border focus:border-blue-border focus:bg-graphite"
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Prénom + Nom */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-white-35 mb-2">
            Prénom
          </label>
          <input
            {...register("prenom")}
            placeholder="Marie"
            className={fieldClass(!!errors.prenom)}
          />
          {errors.prenom && (
            <p className="text-xs text-red-400 mt-1">{errors.prenom.message}</p>
          )}
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-white-35 mb-2">
            Nom
          </label>
          <input
            {...register("nom")}
            placeholder="Dupont"
            className={fieldClass(!!errors.nom)}
          />
          {errors.nom && (
            <p className="text-xs text-red-400 mt-1">{errors.nom.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-white-35 mb-2">
          Email <span className="text-blue">*</span>
        </label>
        <input
          {...register("email")}
          type="email"
          placeholder="marie@exemple.com"
          className={fieldClass(!!errors.email)}
        />
        {errors.email && (
          <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Téléphone */}
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-white-35 mb-2">
          Téléphone <span className="text-white-35">(optionnel)</span>
        </label>
        <input
          {...register("telephone")}
          type="tel"
          placeholder="+33 6 00 00 00 00"
          className={fieldClass(false)}
        />
      </div>

      {/* Sujet */}
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-white-35 mb-2">
          Sujet <span className="text-blue">*</span>
        </label>
        <select
          {...register("sujet")}
          className={cn(fieldClass(!!errors.sujet), "cursor-pointer")}
          defaultValue=""
        >
          <option value="" disabled className="bg-graphite text-white-35">
            Sélectionnez un sujet...
          </option>
          {sujetOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-graphite text-white">
              {opt.label}
            </option>
          ))}
        </select>
        {errors.sujet && (
          <p className="text-xs text-red-400 mt-1">{errors.sujet.message}</p>
        )}
      </div>

      {/* Message */}
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-white-35 mb-2">
          Message <span className="text-blue">*</span>
        </label>
        <textarea
          {...register("message")}
          rows={5}
          placeholder="Décrivez votre demande..."
          className={cn(fieldClass(!!errors.message), "resize-none")}
        />
        {errors.message && (
          <p className="text-xs text-red-400 mt-1">{errors.message.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {serverError}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="text-[11px] text-white-35 max-w-[240px] leading-relaxed">
          Vos données sont protégées et ne seront jamais partagées.{" "}
          <a href="/politique-confidentialite" className="text-blue hover:underline">
            Politique de confidentialité
          </a>
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 bg-blue text-white rounded-xl text-sm font-semibold hover:bg-blue/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Envoi...
            </>
          ) : (
            "Envoyer le message →"
          )}
        </button>
      </div>
    </form>
  );
}
