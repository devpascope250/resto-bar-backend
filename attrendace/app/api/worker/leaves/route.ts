import DateTimeHelper from "@/lib/date-time";
import AttendanceDateTimeHelper from "@/lib/date-time";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    if (!userId || !userRole) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (userRole !== "Worker") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get from, to, and userId from query
    const searchParams = request.nextUrl.searchParams;
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    // Calculate date range - default to last 30 days if no dates provided
    let startDate: Date;
    let endDate: Date = new Date(); // Default end date is now

    if (fromParam) {
        startDate = new Date(fromParam);
    } else {
        // Default to 30 days ago if no from date provided
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
    }

    if (toParam) {
        endDate = new Date(toParam);
    } else {
        // Ensure end date includes today if not provided
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999); // End of day
    }

    const leaves = await prisma.requestLeave.findMany({
        where: {
            userId: parseInt(userId),
            createdAt: {
                gte: startDate,
                lte: endDate
            },

        },
        select: {
            id: true,
            days: true,
            reason: true,
            startDate: true,
            endDate: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            leaveSetting: {
                select:{
                    type: true
                }
            }

        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const newRequest = leaves.map((leave) => {
        return {
            id: leave.id,
            days: leave.days,
            reason: leave.reason,
            startDate: DateTimeHelper.dateFormateter(leave.startDate),
            endDate: DateTimeHelper.dateFormateter(leave.endDate),
            status: leave.status,
            createdAt: DateTimeHelper.dateFormateter(leave.createdAt),
            updatedAt: leave.updatedAt,
            type: leave.leaveSetting.type
        }
    });

    return NextResponse.json(newRequest);
}

// export async function POST(request: NextRequest) {
//     const userId = request.headers.get("x-user-id");
//     const userRole = request.headers.get("x-user-role");
//     if (!userId || !userRole) {
//         return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
//     }
//     if (userRole !== "Worker") {
//         return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
//     }

//     const data = await request.json();
//     const { startDate, endDate, reason, type } = data;

//     const leave = await prisma.requestLeave.create({
//         data: {
//             days: AttendanceDateTimeHelper.daysBetween(startDate, endDate),
//             endDate: AttendanceDateTimeHelper.dateToISOString(endDate),
//             startDate: AttendanceDateTimeHelper.dateToISOString(startDate),
//             reason: reason,
//             userId: parseInt(userId),
//             leaveSettingId: type,
//             createdAt: AttendanceDateTimeHelper.dateToISOString(AttendanceDateTimeHelper.getCurrentUTCDateTime()),
//         }
//     })

//     return NextResponse.json({message: 'Request sent Successful'}, {status: 200});
// }




export async function POST(request: NextRequest) {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    if (!userId || !userRole) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (userRole !== "Worker") {
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
            userId: parseInt(userId),
            leaveSettingId: parseInt(data.type),
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
            id: parseInt(data.type)
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
            days: AttendanceDateTimeHelper.daysBetween(data.startDate, data.endDate),
            startDate: AttendanceDateTimeHelper.dateToISOString(data.startDate),
            endDate: AttendanceDateTimeHelper.dateToISOString(data.endDate),
            reason: data.reason,
            leaveSettingId: parseInt(data.type),
            status: "PENDING",
            userId: parseInt(userId),
            createdAt: AttendanceDateTimeHelper.dateToISOString(AttendanceDateTimeHelper.getCurrentUTCDateTime())
        }
    });
    return NextResponse.json({message: "Leave Request Created Successfully"}, { status: 200 });
}

// function dataTimeIso(date: string) {
//     return new Date(date).toISOString();
// }