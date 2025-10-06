import DateTimeHelper from "@/lib/date-time";
import AttendanceDateTimeHelper from "@/lib/date-time";
import prisma from "@/lib/prisma";
import { AttendanceEventType, AttendanceStatus } from "@prisma/client";
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


    const attendance = await prisma.attendance.findMany({
        where: {
            userId: parseInt(userId),
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        },
        select: {
            id: true,
            enventType: true,
            status: true,
            latitude: true,
            longitude: true,
            createdAt: true,
            userId: true,
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const newAttendance = attendance.map((attendance) => {
        return {
            id: attendance.id,
            userId: attendance.userId,
            eventType: attendance.enventType.toLowerCase(),
            status: attendance.status === AttendanceStatus.In ? "in_" : "out",
            latitude: attendance.latitude,
            longitude: attendance.longitude,
            createdAt: DateTimeHelper.dateFormateter(attendance.createdAt),
        }
    });

    return NextResponse.json(newAttendance);
}
// create attendance
export async function POST(request: NextRequest) {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    if (!userId || !userRole) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (userRole !== "Worker") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // check if already made an attendance

    const existAttendancein = await prisma.attendance.findFirst({
        where: {
            userId: parseInt(userId),
            // status is in and out
            status: AttendanceStatus.In,
            createdAt: {
                gte: AttendanceDateTimeHelper.dateToISOString(AttendanceDateTimeHelper.getCurrentUTCDate()),
            }
        }
    });



    const existAttendanceOut = await prisma.attendance.findFirst({
        where: {
            userId: parseInt(userId),
            // status is in and out
            status: AttendanceStatus.Out,
            createdAt: {
                gte: AttendanceDateTimeHelper.dateToISOString(AttendanceDateTimeHelper.getCurrentUTCDate()),
            }
        }
    });
    if (existAttendancein && !existAttendanceOut) {
        const toDay = AttendanceDateTimeHelper.DayHelper(AttendanceDateTimeHelper.getThisDay());
        // get working hours
        const workingHours = await prisma.workingHours.findFirst({
            where: {
                day: toDay,
                company: {
                    companyWorkers: {
                        some: {
                            workerId: parseInt(userId),
                            status: "Active",
                        }
                    }
                },
            }
        });
        if (workingHours) {
            const companyHour = AttendanceDateTimeHelper.timeToTodayInZone(workingHours?.endTime.toString()).formatted;
            const currentHour = AttendanceDateTimeHelper.getCurrentUTCDateTime();
            if (companyHour > currentHour) {
                return NextResponse.json({ message: `You Connot check out before company time at \n ${workingHours?.endTime.toString()} On ${toDay}` }, { status: 400 })
            }
        }
    }

    if (existAttendancein && existAttendanceOut) {
        return NextResponse.json({ message: "Already made an attendance" }, { status: 400 });
    }

    const data = await request.json();

    await prisma.attendance.create({
        data: {
            userId: parseInt(userId),
            enventType: data.event_type === "success" ? AttendanceEventType.Success : data.event_type === "failed" ? AttendanceEventType.Failed : AttendanceEventType.Error,
            status: existAttendancein ? AttendanceStatus.Out : AttendanceStatus.In,
            latitude: data.latitude,
            longitude: data.longitude,
            createdAt: AttendanceDateTimeHelper.dateToISOString(AttendanceDateTimeHelper.getCurrentUTCDateTime()),
        }
    });

    return NextResponse.json({ message: 'Attendance made successfully' });
}