import { prisma } from "@/lib/prisma";
import DateTimeHelper from "@/lib/date-time";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if(!id){
    return NextResponse.json({
        message: 'the qrcode has exipred, please Generate New'
    }, {status: 400});
  }
  // if existed
  const existqr = await prisma.qrcode.findFirst({
    where: {
      value: id,
    },
  });

  if (!existqr) {
    return NextResponse.json({
      message: 'the qrcode has exipred, please Generate New'
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
  return NextResponse.json({
    message: 'the qrcode is valid'
  },{status: 200});
}
