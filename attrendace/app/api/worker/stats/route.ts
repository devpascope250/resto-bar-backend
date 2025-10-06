import DateTimeHelper from "@/lib/date-time";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if(!userId || !userRole){
        return NextResponse.json({message: 'unAuthorized'}, { status: 401});
    }

    if(userRole !== "Worker"){
        return NextResponse.json({message: 'unAuthorized'}, { status: 401});
    }

    // count all presented days in this month

    const alldays = await prisma.attendance.count(
        {
            where: {
                userId: parseInt(userId),
                status: "In",
                createdAt: {
                    gte: DateTimeHelper.dateToISOString(DateTimeHelper.getCurrentMonth())
                }
            }
        }
    );

    // calculate leave balance average available for this month
    const leaves = await prisma.requestLeave.count(
        {
            where: {
                userId: parseInt(userId),
                status: "APPROVED",
                createdAt: {
                    gte: DateTimeHelper.dateToISOString(DateTimeHelper.getCurrentMonth())
                }
            }
        }
    );
    
    return NextResponse.json({'days': alldays, 'leaves': leaves}, { status: 200});
}