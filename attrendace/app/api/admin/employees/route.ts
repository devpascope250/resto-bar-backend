import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
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

    // get all employees
    const employees = await prisma.user.findMany({
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
        include: {
            companyWorker: {
                include: {
                    company: true,
                },
            },
        },
    });

    const newEmployees = employees.map((employee) => {
        return {
            id: employee.id,
            lastName: employee.lastName,
            firstName: employee.firstName,
            email: employee.email,
            gender: employee.gender,
            role: employee.role,
            status: employee.status,
            phone: employee.phone,
            company: employee.companyWorker.map((companyWorker) => {
                return {
                    id: companyWorker.company.id,
                    companyWorkerId: companyWorker.id,
                    name: companyWorker.company.name,
                    type: companyWorker.company.type,
                    status: companyWorker.status,
                };
            }),
        };
    });

    return NextResponse.json(newEmployees);
}


export async function POST(request: NextRequest) {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    if (!userId || userRole !== "Admin") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const data = await request.json();
    // email exist
    const emailExist = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
    });
    if (emailExist) return NextResponse.json({ message: "Email already exist" }, { status: 400 });
    const password = await hashPassword('@12344fgfff');
    await prisma.$transaction(async (tx) => {
        const company = await tx.company.findUnique({
            where: {
                id: parseInt(data.companyId?.toString()),
            },
        });
        if (!company) return NextResponse.json({ message: "Company not found" }, { status: 404 });

        const worker = await tx.user.create({
            data: {
                lastName: data.lastName,
                firstName: data.firstName,
                email: data.email,
                gender: data.gender,
                role: data.role,
                phone: data.phone,
                status: data.status,
                password: password,
            },
        });

        await tx.companyWorker.create({
            data: {
                workerId: worker.id,
                companyId: parseInt(data.companyId?.toString()),
                status: data.status,
            },
        })
    });
    return NextResponse.json({ message: "Employee created successfully" });
}