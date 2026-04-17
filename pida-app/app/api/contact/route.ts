import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validations";
import { sendContactEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validation Zod
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Données invalides", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Envoi email
    await sendContactEmail(parsed.data);

    return NextResponse.json({ success: true, message: "Message envoyé avec succès" });
  } catch (error) {
    console.error("[contact/route]", error);
    return NextResponse.json(
      { success: false, message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
