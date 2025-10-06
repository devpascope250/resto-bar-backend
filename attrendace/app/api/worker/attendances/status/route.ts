import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import AttendanceDateTimeHelper  from '@/lib/date-time';
export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');

  if(!userId || !userRole) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if(userRole !== "Worker"){
    return NextResponse.json({ message: "Forbidden" }, { status: 401 });
  }

  const attendanceIn = await prisma.attendance.findFirst({
      where: {
        userId: parseInt(userId),
        status: 'In',
        createdAt: {
            gte: AttendanceDateTimeHelper.dateToISOString(AttendanceDateTimeHelper.getCurrentUTCDate()),
        }
      }
  });

const AttendanceOut = await prisma.attendance.findFirst({
    where: {
      userId: parseInt(userId),
      status: 'Out',
      createdAt: {
          gte: AttendanceDateTimeHelper.dateToISOString(AttendanceDateTimeHelper.getCurrentUTCDate()),
      }
    }
});

const attendanceSt = (attendanceIn && AttendanceOut) ? 3 : (!attendanceIn && !AttendanceOut) ? 4 : attendanceIn ? 1 : AttendanceOut ? 2 : 1;
  return NextResponse.json({ message: 'Attendance Status Retrieved well', status: attendanceSt , CreatedAt: AttendanceDateTimeHelper.getTimeFromDate(attendanceIn?.createdAt ?? AttendanceOut?.createdAt ?? '' )}, { status: 200})
    
}

