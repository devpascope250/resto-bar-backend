import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request: Request, {params}: {params: Promise<{id: string}>}) {
    const userRole = request.headers.get("x-user-role");
    if(userRole !== "Admin"){
        return NextResponse.json({message: "You are not authorized to perform this action"}, {status: 401});
    } 
    const data = await request.json();
    const { id } = await params;
    // if existed
    const existed = await prisma.companyWorker.findFirst({
        where: {
            companyId: parseInt(data.companyId),
            workerId: parseInt(data.workerId),
        }
    });
    if(existed) return NextResponse.json({message: "This company is Already added to this worker"}, {status: 400});
    await prisma.companyWorker.update({
        where: {
            id: parseInt(id)
        },
        data: {
            companyId: parseInt(data.companyId),
            workerId: parseInt(data.workerId)
        }
    });
    return NextResponse.json({message: "Company updated to worker"}, {status: 200});
}