import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

/**
 * POST /api/seed
 * Cria usuário de teste para desenvolvimento
 *
 * Email: admin@herge.com
 * Senha: herge2026
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-seed-secret");

  // Proteger com secret simples
  if (secret !== "seed-herge-2026") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const hashedPassword = await bcrypt.hash("herge2026", 10);

    const user = await prisma.user.upsert({
      where: { email: "admin@herge.com" },
      update: {},
      create: {
        email: "admin@herge.com",
        name: "Admin",
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
          email: "admin@herge.com",
          password: "herge2026",
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
