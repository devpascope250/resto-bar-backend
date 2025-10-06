import prisma from "@/lib/prisma";
import { LeaveStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    // get status from query
    const status = request.nextUrl.searchParams.get("status");
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    if (!userId || !userRole) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const company = await prisma.company.findMany({
        where: {
            userId: parseInt(userId)
        }
    });

    const leaveRequest = await prisma.requestLeave.findMany({
        where: {
            user: {
                companyWorker: {
                    some: {
                        companyId: {
                            in: company.map((company) => company.id)
                        }
                    }
                }
            },
            status: status ? status as LeaveStatus : undefined
        },
        select: {
            id:true,
            days: true,
            endDate: true,
            startDate: true,
            reason: true,
            userId: true,
            status: true,
            createdAt: true,
            user: {
                select:{
                    firstName: true,
                    lastName: true,
                    email: true,
                }
            },
            leaveSetting: {
                select: {
                    type: true
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });  
    
    const newLeaveRequest = leaveRequest.map((leaveRequest) => {
        return {
            ...leaveRequest,
            ...leaveRequest.user,
            type: leaveRequest.leaveSetting.type
        }
    })
    return NextResponse.json(newLeaveRequest, { status: 200 });

}

export async function POST(request: NextRequest) {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    if (!userId || !userRole) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    // Get current date in UTC to avoid timezone issues
    const now = new Date();
    const utcNow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const firstDayOfMonth = new Date(Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth(), 1));
    const firstDayOfNextMonth = new Date(Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth() + 1, 1));

    const leaveRequest = await prisma.requestLeave.findMany({
        where: {
            userId: parseInt(data.userId),
            leaveSettingId: parseInt(data.leaveType),
            createdAt: {
                gte: firstDayOfMonth,
                lt: firstDayOfNextMonth
            }
        },
        select: {
            days: true
        }
    });
    // calculate the total days of leave requests for the user within this month
    const totalDays = leaveRequest.reduce((acc, curr) => acc + curr.days, 0);
    // check if the total days of leave requests for the user within this month is greater than 30
    if (totalDays > 30) {
        return NextResponse.json({ message: "You have exceeded your leave quota for this month" }, { status: 400 });
    }
    // get allowed 
    const allowedDays = await prisma.companyLeaveSetting.findUnique({
        where: {
            id: parseInt(data.leaveType)
        },
        select: {
            days: true
        }
    });
    // if request is greater that allowed days return error
    const allDays = totalDays + parseInt(data.days);
    if (allowedDays && allDays > allowedDays?.days) {
        const theLeftLeaves = allowedDays?.days - totalDays;
        return NextResponse.json({ message: `You have exceeded your leave quota for this month \n You have Only ${theLeftLeaves} days left` }, { status: 400 });

    }
    await prisma.requestLeave.create({
        data: {
            days: data.days,
            startDate: dataTimeIso(data.startDate),
            endDate: dataTimeIso(data.endDate),
            reason: data.reason,
            leaveSettingId: parseInt(data.leaveType),
            status: "APPROVED",
            userId: parseInt(data.userId)
        }
    });
    return NextResponse.json({message: "Leave Request Created Successfully"}, { status: 200 });
}

export async function PUT(Request: NextRequest) {
    const role = Request.headers.get("x-user-role");
    if (role !== "Admin") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { id, status } = await Request.json();

    await prisma.requestLeave.update({
        where: {
            id: parseInt(id)
        },
        data: {
            status: status as LeaveStatus
        }
    });
    return NextResponse.json({message: 'Leave Request Updated Successfully'}, { status: 200
    })

}

function dataTimeIso(date: string) {
    return new Date(date).toISOString();
}