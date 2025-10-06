import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const  id = request.headers.get("x-user-id");
    if(!id){
        return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const user = await prisma.user.findUnique({
        where: {
            id: parseInt(id)
        },
    });
    if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
    });
}

export async function PUT(request: NextRequest) {
    const  id = request.headers.get("x-user-id");
    if(!id){
        return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const data = await request.json();
    data.gender = data.gender === "male" ? "Male" : "Female";
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