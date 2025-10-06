import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export async function GET(request: NextRequest, {params} : {params: Promise<{id: string }>}) {
    const userId = request.headers.get('x-user-id');
    const role =  request.headers.get('x-user-role');

    if (!userId || !role) {
        return NextResponse.json({message: "Unauthorized"}, {status: 401})
    }

    const { id } = await params;
        if(id === 'null' || id === "undefined"){
          return NextResponse.json({
            message: "Invalid id",
          }, {status: 400})
        }

        const getemployee = await prisma.companyWorker.findFirst({
            where: {
                workerId: parseInt(id),
                status: "Active"
            },
            select: {
                companyId: true
            }
        });

        if(!getemployee){
            return NextResponse.json({
                message: "The company or institution is not available",
            }, {status: 400})
        }



      const leaveSettings = await prisma.companyLeaveSetting.findMany({
        where: {
          companyId: getemployee.companyId,
        },
      })
      return NextResponse.json(leaveSettings);
}