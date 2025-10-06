import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
   const token = req.cookies.get('access_token')?.value;
     
    if (!token) {
        return NextResponse.redirect(new URL('/', req.url));
    }
    const decoded = await verifyToken(token);
    if(!decoded){
        return NextResponse.redirect(new URL('/', req.url));
    }
    const user = await prisma.user.findUnique({
        where: {
            id: parseInt(decoded?.id)
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            gender: true,
            createdAt: true,
        }
    });
    return NextResponse.json(user);
}