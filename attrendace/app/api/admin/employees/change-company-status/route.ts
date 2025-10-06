import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Status } from "@prisma/client";

export async function POST(request: NextRequest) {
    
    const data = await request.json();
    // check exist

    const companyWorker = await prisma.companyWorker.findFirst({
        where: {
            workerId: parseInt(data.workerId),
            companyId: parseInt(data.companyId),
        }
    });
    if (!companyWorker) {
        return NextResponse.json({
            message: "Company worker not found"
        },
        {status: 404}
        );
    }

    if(data.status as Status === "Inactive"){
         await prisma.$transaction(async(tx) => {
        // inactive all company workers and active the current one
    await tx.companyWorker.updateMany({
        where: {
            workerId: parseInt(data.workerId),
        },
        data: {
            status: "Inactive",
        }
    });

    await tx.companyWorker.update({
        where: {
            id: companyWorker.id,
        },
        data: {
            status: "Active",
        }
    })
    });
    }else{
        await prisma.companyWorker.update({
            where: {
                id: companyWorker.id,
            },
            data: {
                status: "Inactive",
            }
        })
    }

   

    return NextResponse.json({
        message: "Company worker status updated successfully"
    }, {status: 200});
    
}