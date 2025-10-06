import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { WorkingHours } from "@prisma/client";

export async function GET(request: NextRequest) {
    // Get headers instead of cookies
    const userid = request.headers.get('x-user-id');
    if(!userid){
        return NextResponse.json({
            message: "User not authenticated"
        }, {
            status: 401
        })
    }
    const userRole = request.headers.get('x-user-role');
    if(userRole !== "Admin"){
        return NextResponse.json({
            message: "You are not authorized to access this route"
        }, {
            status: 401
        })
    }

    // get all companies
    const companies = await prisma.company.findMany(
        {
            where: {
                userId: parseInt(userid)
            },
            include: {
                workingHours: true
            }
        }
    );
    return NextResponse.json(companies,
        {
            status: 200
        }
    );
}

// create new company
export async function POST(request: NextRequest) {
    // Get headers instead of cookies
    const userid = request.headers.get('x-user-id');
    if(!userid){
        return NextResponse.json({
            message: "User not authenticated"
        }, {
            status: 401
        })
    }
    const userRole = request.headers.get('x-user-role');
    if(userRole !== "Admin"){
        return NextResponse.json({
            message: "You are not authorized to access this route"
        }, {
            status: 401
        })
    }

    // get data from request

    const data = await request.json();
    await prisma.$transaction(async(tx) => {
        const company = await tx.company.create({
            data: {
                name: data.name,
                userId: parseInt(userid),
                address: data.address,
                latitude: parseFloat(data.latitude),
                longitude: parseFloat(data.longitude),
                type: data.type,
                radius: parseInt(data.radius)
            }
    });
    // if working hours are array and not empty, create working hours
    if(data.workingHours && data.workingHours.length > 0){
        await tx.workingHours.createMany({
            data: data.workingHours.map((workingHour: WorkingHours) => {
                return {
                    day: workingHour.day,
                    startTime: workingHour.startTime,
                    endTime: workingHour.endTime,
                    companyId: company.id
                }
            })
        })
    }
    });
    
    return NextResponse.json({
        message: "Company created successfully"
    }, {
        status: 200
    })
    
}



// function timeToISO(timeString: string) {
//     const [hours, minutes] = timeString.split(':');
//     const date = new Date();
//     date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
//     return date.toISOString();
// }