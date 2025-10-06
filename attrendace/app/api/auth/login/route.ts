/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/auth/login/route.ts
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { generateToken, setTokenCookieApp, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const platform = req.headers.get("x-platform")
  if(platform && platform === "MOBILE-APP") {
    try {
    const formData = await req.json();
    const { email, password } = formData;

    const user = await prisma.user.findUnique({
      where: {
        email: email,
        role: "Worker"
      },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        gender: true,
        phone: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
        companyWorker: {
          select: {
            status: true,
            company: {
              select: {
                id: true,
                name: true,
                address: true,
                latitude: true,
                longitude: true,
                radius: true,
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // if active
    if (user.status !== "Active") {
      return NextResponse.json(
        { message: "Your account is not active, please contact the administrator" },
        { status: 401 }
      );
      
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = generateToken({ id: user.id, role: user.role as Role});
    // Create response with user data
    const comp = user.companyWorker?.find(companyWorker => (companyWorker.status === "Active"));
    const newUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      gender: user.gender,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      createdAt: user.createdAt,
      company: {
        id: comp?.company.id,
        name: comp?.company.name,
        address: comp?.company.address,
        latitude: comp?.company.latitude ? parseFloat(comp?.company?.latitude.toString()) : 0.0,
        longitude: comp?.company.longitude ? parseFloat(comp?.company.longitude.toString()) : 0.0,
        radius: comp?.company.radius,
        status: comp?.status
      }
    };
    const toke = await token;
    const response = NextResponse.json({user: newUser , token: toke}, { status: 200 }
    );
    // Set cookie in the response
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: "Login failed" },
      { status: 500 }
    );
  }
  }else{
  try {
    const formData = await req.json();
    const { email, password } = formData;

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        firstName: true,
        lastName: true,
        status: true,
        company: {
          select: {
            name: true,
            address: true
          },
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // if active
    if (user.status !== "Active") {
      return NextResponse.json(
        { message: "Your account is not active, please contact the administrator" },
        { status: 401 }
      );
      
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = generateToken({ id: user.id, role: user.role as Role});
    // Create response with user data
    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user.id,
          role: user.role,
        }
      },
      { status: 200 }
    );

    // Set cookie in the response
    setTokenCookieApp(response, await token);
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: "Login failed" },
      { status: 500 }
    );
  }
}
}