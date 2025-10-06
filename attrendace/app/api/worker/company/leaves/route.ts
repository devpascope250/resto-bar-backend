import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || !userRole) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (userRole !== 'Worker') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const leaves = await prisma.companyLeaveSetting.findMany({
        where: {
            company: {
                companyWorkers: {
                    some: {
                        workerId: parseInt(userId)
                    }
                }
                }
            }
        }
    );

    const NewCompLeave = leaves.map((leave) => {
        return{
            id: leave.id,
            type: leave.type,
            days: leave.days,
            companyId: leave.companyId,
        }
    });
console.log('The output ',NewCompLeave);

    return NextResponse.json(NewCompLeave);
}