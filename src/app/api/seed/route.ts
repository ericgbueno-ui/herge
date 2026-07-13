import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

/**
 * POST /api/seed
 * Cria usuário de teste para desenvolvimento
 *
 * Email: ericgbueno@gmail.com
 * Senha: portaaberta
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-seed-secret");

  // Proteger com secret simples
  if (secret !== "seed-herge-2026") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const hashedPassword = await bcrypt.hash("portaaberta", 10);

    const user = await prisma.user.upsert({
      where: { email: "ericgbueno@gmail.com" },
      update: {},
      create: {
        email: "ericgbueno@gmail.com",
        name: "Eric Bueno",
        passwordHash: hashedPassword,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        credentials: {
          email: "ericgbueno@gmail.com",
          password: "portaaberta",
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
