/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    if (!userId || !userRole) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (userRole !== "Admin") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get from, to, and userId from query
    const searchParams = request.nextUrl.searchParams;
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const userIdQuery = searchParams.get('userId');

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

    const companies = await prisma.company.findMany({
        where: {
            userId: parseInt(userId),
        },
        select: {
            id: true,
        },
    });

    // Build the where clause dynamically
    const whereClause: any = {
        user: {
            companyWorker: {
                some: {
                    companyId: {
                        in: companies.map((company) => company.id),
                    }
                }
            }
        },
        createdAt: {
            gte: startDate,
            lte: endDate
        }
    };

    // Add user filter if userIdQuery is provided and not "all"
    if (userIdQuery && userIdQuery !== "all") {
        whereClause.userId = parseInt(userIdQuery);
    }

    const attendances = await prisma.attendance.findMany({
        where: whereClause,
        select: {
            id: true,
            status: true,
            latitude: true,
            longitude: true,
            createdAt: true,
            enventType: true,
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    gender: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc' // Optional: order by date descending
        }
    });

    return NextResponse.json(attendances);
}

// create attendance

export async function POST(request: NextRequest) {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    if (!userId || !userRole) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (userRole !== "Admin") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const createdAt = new Date(data.createdAt);

    const attendance = await prisma.attendance.findFirst({
        where: {
            userId: parseInt(data.userId),
            createdAt: {
                gte: new Date(createdAt.setHours(0, 0, 0, 0)),
                lt: new Date(createdAt.setHours(24, 0, 0, 0))
            }
        },
    });
    if (attendance) {
        return NextResponse.json({ message: "Attendance already exists" }, { status: 400 });
    }
    // create attendance
    await prisma.attendance.create({
        data: {
            userId: parseInt(data.userId),
            status: data.status,
            enventType: data.eventType,
            createdAt: toISOFormat(data.createdAt),
        }
    });
    return NextResponse.json({ message: "Attendance created successfully" });
}

function toISOFormat(date: string) {
    return new Date(date).toISOString();
}