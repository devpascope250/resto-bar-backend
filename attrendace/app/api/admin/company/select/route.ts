import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    // Get headers instead of cookies
    const userid = request.headers.get('x-user-id');
    if(!userid){
        return NextResponse.json({
            message: "User not authenticated"
        }, {
            status: 401
        })
    }
    const userRole = request.headers.get('x-user-role');
    if(userRole !== "Admin"){
        return NextResponse.json({
            message: "You are not authorized to access this route"
        }, {
            status: 401
        })
    }

    // get all companies
    const companies = await prisma.company.findMany(
        {
            where: {
                userId: parseInt(userid)
            },
            select: {
                id: true,
                name: true,
                address: true,
                type: true,
            }
        }
    );
    return NextResponse.json(companies,
        {
            status: 200
        }
    );
}