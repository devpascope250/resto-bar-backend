import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    if (!userId || userRole !== "Admin") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    await prisma.user.deleteMany({
        where: {
            id: parseInt(id),
        },
    });
    return NextResponse.json({ message: "Employee deleted successfully" });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");

    if (!userId || userRole !== "Admin") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const data = await request.json();
    // if email existed not on user with this id
    const existEmail = await prisma.user.findFirst({
        where: {
            email: data.email,
            id: { not: parseInt(id) }
        },
    });
    if (existEmail) return NextResponse.json({ message: "Email already exist" }, { status: 400 })

    await prisma.user.update({
        where: {
            id: parseInt(id),
        },
        data: {
            lastName: data.lastName,
            firstName: data.firstName,
            email: data.email,
            gender: data.gender,
            role: data.role,
            phone: data.phone,
            status: data.status,
        },
    });
    return NextResponse.json({ message: "Employee updated successfully" });
}