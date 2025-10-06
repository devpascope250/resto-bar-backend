import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const userId = request.headers.get("x-user-id");
    const role = request.headers.get("x-user-role");

    if (!userId || !role) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (role !== "Admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all companies belong to me
    const companies = await prisma.company.findMany({
        where: {
            userId: parseInt(userId),
        }
    });

    // Get today's date for filtering
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Count all users belong to my companies
    const countAllEmployees = await prisma.user.count({
        where: {
            companyWorker: {
                some: {
                    companyId: {
                        in: companies.map((company) => company.id)
                    }
                }
            }
        }
    });

    // Get all users attended today - FIXED
    const countAllEmployeesAttendedToday = await prisma.attendance.count({
        where: {
            user: {
                companyWorker: {
                    some: {
                        companyId: {
                            in: companies.map((company) => company.id)
                        }
                    }
                }
            },
            createdAt: {
                gte: startOfDay,
                lt: endOfDay
            }
        }
    });

    // Get all pending leaves
    const countAllPendingLeaves = await prisma.requestLeave.count({
        where: {
            user: {
                companyWorker: {
                    some: {
                        companyId: {
                            in: companies.map((company) => company.id)
                        }
                    }
                }
            },
            status: "PENDING"
        }
    });

    // Get all Late Arrival today - FIXED
    const lateArrivals = await prisma.attendance.findMany({
        where: {
            user: {
                companyWorker: {
                    some: {
                        companyId: {
                            in: companies.map((company) => company.id)
                        }
                    },
                }
            },
            createdAt: {
                gte: startOfDay,
                lt: endOfDay
            }
        },
        include: {
            user: {
                include: {
                    companyWorker: {
                        include: {
                            company: {
                                include: {
                                    workingHours: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    // Getting name of this day
    const day = new Date().toLocaleString("en-US", { weekday: "long" });

    // Count all where arrival time is after working hours start time
    const countAllLateArrivals = lateArrivals.filter((attendance) => {
        // Check if user has any company with working hours
        if (!attendance.user.companyWorker || attendance.user.companyWorker.length === 0) {
            return false;
        }

        // Check all companies the user works for
        for (const worker of attendance.user.companyWorker) {
            if (worker.company.workingHours) {
                for (const workingHour of worker.company.workingHours) {
                    if (workingHour.day === day) {
                        const arrivalTime = new Date(attendance.createdAt);
                        const startTime = new Date(workingHour.startTime);
                        
                        // Compare hours and minutes
                        if (arrivalTime.getHours() > startTime.getHours() || 
                            (arrivalTime.getHours() === startTime.getHours() && 
                             arrivalTime.getMinutes() > startTime.getMinutes())) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    });

    const data = {
        countAllEmployees,
        countAllEmployeesAttendedToday,
        countAllPendingLeaves,
        countAllLateArrivals: countAllLateArrivals.length
    }

    return NextResponse.json(data);
}