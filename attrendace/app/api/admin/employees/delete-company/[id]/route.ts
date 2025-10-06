import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(request: Request, {params}: {params: Promise<{id: string}>}) {
    const userRole = request.headers.get("x-user-role");
    const { id } = await params;
    if(userRole !== "Admin"){
        return NextResponse.json({message: "You are not authorized to perform this action"}, {status: 401});
    } 
    // check if left one company assigned to worker
    const getworker = await prisma.companyWorker.findUnique({
        where: {
            id: parseInt(id)
        }
    });
    if(!getworker){
        return NextResponse.json({message: "Company not found"}, {status: 404});
    }
    const companyWorkers = await prisma.companyWorker.count({
        where: {
            workerId: getworker.workerId,
        }
    });
    
    if(companyWorkers === 1){
        return NextResponse.json({message: "You cannot delete this company because it is the only company assigned to this worker"}, {status: 400});
    }
    
    await prisma.companyWorker.delete({
        where: {
            id: parseInt(id)
        }
    });
    return NextResponse.json({message: "Company deleted successfully"}, {status: 200
    })
}