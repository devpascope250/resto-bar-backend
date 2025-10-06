import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import DateTimeHelper from "@/lib/date-time";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { type, companyId } = await request.json();
  const token = uuidv4(); // or crypto.randomBytes

  // if existed
  const existqr = await prisma.qrcode.findFirst({
    where: {
      entityId: companyId,
    },
  });

  if (existqr) {
    await prisma.qrcode.deleteMany({
      where: {
        entityId: companyId,
      },
    });
  }

  const qr = await prisma.qrcode.create({
    data: {
      type,
      entityId: companyId,
      value: token,
      createdAt: DateTimeHelper.dateToISOString(DateTimeHelper.getCurrentUTCDateTime()),
      expiredAt: DateTimeHelper.dateToISOString(DateTimeHelper.addMinutes(5).date)
    },
  });
  const newdata = {
    companyId: qr.entityId,
    type: qr.type,
    value: qr.value,
  }

  return NextResponse.json(newdata, {
    status: 200,
  });
}
