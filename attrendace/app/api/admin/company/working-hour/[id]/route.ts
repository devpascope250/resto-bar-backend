import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(request: Request, { params } : {params: Promise<{ id: string }>}) {
    const { id } = await params;
    await prisma.workingHours.delete({
        where: {
            id: parseInt(id)
        }
    })
    return NextResponse.json({ message: "success" })
}