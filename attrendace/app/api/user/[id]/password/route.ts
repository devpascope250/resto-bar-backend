import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await request.json();
    const {currentPassword, newPassword, confirmNewPassword} = data;
    const user = await prisma.user.findUnique({
        where: {
            id: parseInt(id)
        },
    });
    if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const verfyCurrentPasswod = await verifyPassword(currentPassword, user.password);

    if (!verfyCurrentPasswod) {
        return NextResponse.json({ message: "Invalid current password" }, { status: 400 });
    }

    if (newPassword !== confirmNewPassword) {
        return NextResponse.json({ message: "New password and confirm new password do not match" }, { status: 400 });
    }

    // if new password is same as current password
    const isSamePassword = await verifyPassword(newPassword, user.password);

    if (isSamePassword) {
        return NextResponse.json({ message: "New password cannot be the same as current password" }, { status: 400 });
    }
    const password = await hashPassword(newPassword);

     await prisma.user.update({
        where: {
            id: parseInt(id)
        },
        data: {
            password: password
        }
    });

    return NextResponse.json({message: "Password updated successfully" }, { status: 200 });
    
}