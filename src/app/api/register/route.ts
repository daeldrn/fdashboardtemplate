// src/app/api/register/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma"; // Asegúrate que la ruta a tu instancia de prisma sea correcta

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return new NextResponse("Faltan datos", { status: 400 });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return new NextResponse("El correo electrónico ya está en uso", {
        status: 409,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("REGISTRATION_ERROR", error);
    return new NextResponse("Error interno", { status: 500 });
  }
}
