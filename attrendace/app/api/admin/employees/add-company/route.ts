import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const userRole = request.headers.get("x-user-role");
    if(userRole !== "Admin"){
        return NextResponse.json({message: "You are not authorized to perform this action"}, {status: 401});
    } 
    const data = await request.json();    
    // existed
    const existed = await prisma.companyWorker.findFirst({
        where: {
            companyId: parseInt(data.companyId),
            workerId: parseInt(data.workerId)
        }
    });
    if(existed) return NextResponse.json({message: "This company is Already added to this worker"}, {status: 400});

   const worker = await prisma.companyWorker.findFirst({
        where: {
            workerId: parseInt(data.workerId),
            status: "Active"
        }
});
  const saved = await prisma.companyWorker.create({
        data: {
            companyId: parseInt(data.companyId),
            workerId: parseInt(data.workerId),
            status: worker ? "Inactive" : "Active"
        }
    });
    return NextResponse.json({data: saved}, {status: 200});
}
