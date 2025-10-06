import { prisma } from "@/lib/prisma";
import DateTimeHelper from "@/lib/date-time";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string, token: string}> }) {
  const data = await request.json();
  const { id, token } = await params;
  if(!id || !token){
    return NextResponse.json({
        message: 'the qrcode not Found.'
    }, {status: 400});
  }
  // if existed
  const existqr = await prisma.qrcode.findFirst({
    where: {
      value: token,
    },
  });

  if (!existqr) {
    return NextResponse.json({
      message: 'the qrcode not Exist'
    }, {status: 400});
  }
  if(existqr.expiredAt < new Date(DateTimeHelper.getCurrentUTCDateTime())){
    return NextResponse.json({
      message: 'the qrcode has exipred, please Generate New'
    },{
      status: 400
    }
    );
  }

  // update company

  await prisma.company.update({
    where: {
        id: parseInt(id)
    },
    data: {
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude)
    }
  });

  return NextResponse.json({
    message: 'The coordinated Set successfully'
  },{status: 200});
}
