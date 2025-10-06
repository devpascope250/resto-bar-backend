import prisma from "@/lib/prisma";
import { CompanyLeaveSetting } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if(id === 'null' || id === "undefined"){
      return NextResponse.json({
        message: "Invalid id",
      }, {status: 400})
    }
  const leaveSettings = await prisma.companyLeaveSetting.findMany({
    where: {
      companyId: parseInt(id),
    },
  })
  return NextResponse.json(leaveSettings);
}

// update

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
   const { id } = await params;
  if(id === 'null' || id === "undefined"){
    return NextResponse.json({
      message: "Invalid id",
    }, {status: 400})
  }
   
    const data = await request.json();    
    await Promise.all(
      data.map(async (leaveSetting: CompanyLeaveSetting) => {
        await prisma.companyLeaveSetting.upsert({
          where: {
            companyId_type: {
              companyId: parseInt(id),
              type: leaveSetting.type,
            },
          },
          update: {
            days: leaveSetting.days,
          },
          create:{
            days: leaveSetting.days,
            companyId: parseInt(id),
            type: leaveSetting.type,
          }

        });
      })
    );
    return NextResponse.json({
      message: "Leave settings updated successfully",
    });
  }

  export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if(id === 'null' || id === "undefined"){
      return NextResponse.json({
        message: "Invalid id",
      }, {status: 400})
    }
    await prisma.companyLeaveSetting.deleteMany({
      where: {
        id: parseInt(id),
      },
    });
    return NextResponse.json({
      message: "Leave settings deleted successfully",
    });
  }