import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { WorkingHours } from "@prisma/client";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await request.json();
        await prisma.$transaction(async (tx) => {
            const company = await tx.company.update({
                where: {
                    id: parseInt(id)
                },
                data: {
                    name: data.name,
                    address: data.address,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    radius: parseInt(data.radius),
                    type: data.type,
                },
            });

            // Use Promise.all to wait for all upsert operations
            await Promise.all(
                data.workingHours.map(async (hours: WorkingHours) => {
                    return tx.workingHours.upsert({
                        where: {
                            id: hours.id
                        },
                        update: {
                            day: hours.day,
                            startTime: hours.startTime,
                            endTime: hours.endTime,
                            company: {
                                connect: {
                                    id: company.id
                                }
                            }
                        },
                        create: {
                            day: hours.day,
                            startTime: hours.startTime,
                            endTime: hours.endTime,
                            company: {
                                connect: {
                                    id: company.id
                                }
                            }
                        }
                    });
                })
            );
        });
        
        return NextResponse.json({ message: "Company updated successfully" });
    } catch (error) {
        console.error("Error updating company:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}




export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    await prisma.company.delete({
        where: {
            id: parseInt(id)
        }
    });
    return NextResponse.json({
        message: "Company deleted successfully"
    }, {
        status: 200
    })
    
}