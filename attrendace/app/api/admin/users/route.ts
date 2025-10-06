import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const role = request.headers.get("x-user-role");
    if (role !== "Admin") {
        return new Response("Unauthorized", { status: 401 });
    }
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    // get all companies Id
    const companies = await prisma.company.findMany({
        where: {
            userId: parseInt(userId?.toString()),
        },
        select: {
            id: true,
        },
    });
    const users = await prisma.user.findMany(
        {
            where: {
                role: "Worker",
                companyWorker: {
                    some: {
                        companyId: {
                            in: companies.map((company) => company.id),
                        },
                    },
                },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                phone: true
            }
        }
    );
    return NextResponse.json(users);
}