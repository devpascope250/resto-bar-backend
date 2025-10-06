import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await request.json();
    
    const user = await prisma.user.findUnique({
        where: {
            id: parseInt(id)
        },
    });
    if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
        where: {
            id: parseInt(id)
        },
        data: {
            ...data
        }
    });

    return NextResponse.json(updatedUser);
    
}