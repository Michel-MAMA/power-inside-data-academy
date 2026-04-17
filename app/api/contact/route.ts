import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validations";
import { sendContactEmail } from "@/lib/mail";

export async function POST(req: Request) {
    const body = await req.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
        return NextResponse.json({ success: false, errors: result.error.flatten() }, { status: 400 });
    }

    try {
        await sendContactEmail(result.data);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Erreur serveur" }, { status: 500 });
    }
}
