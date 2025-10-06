"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock } from "lucide-react";
import * as yup from "yup";
import { useFormik } from "formik";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
interface userData {
  message: string;
  user: UserAuthPayload
}
export function LoginForm() {
  const router = useRouter();
  const { user } = useAuth();
  React.useEffect(() => {
    if(user?.role === "Admin"){
      router.replace('/admin')
    }else{
      router.replace("/worker/");
    }
    
  },[user,router]);
  const formIk = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: yup.object({
      email: yup.string().email("Invalid email address").required("Required"),
      password: yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      await axios
        .post("/api/auth/login", values)
        .then((response) => {
          const data: userData = response.data;
          toast.success(data.message, {
            style: {
              background: "#00c389", // Green background
              color: "white",
            },
          });

          if(data.user.role === "Admin"){
            router.push("/admin/");
          }else{
            router.push("/worker/");
          }
        })
        .catch((error) => {
          toast.error(error.response.data.message, {
            style: {
              background: "#ff4b4b", // Red background
              color: "white",
            },
          });
        });
    },
  });

  return (
    <Card className="w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-semibold text-center">
          Sign In
        </CardTitle>
        <CardDescription className="text-center text-gray-600">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={formIk.handleSubmit}>
          {!formIk.isValid && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-700">
                {formIk.errors.email
                  ? "Email is invalid"
                  : "Password is required"}
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formIk.values.email}
                onChange={formIk.handleChange}
                className={
                  formIk.errors.email
                    ? `pl-10 h-12 border-red-200 focus:border-red-500 focus:ring-red-500`
                    : `pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500`
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formIk.values.password}
                onChange={formIk.handleChange}
                className={
                  formIk.errors.password
                    ? `pl-10 h-12 border-red-200 focus:border-red-500 focus:ring-red-500`
                    : `pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500`
                }
                autoComplete="password"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={formIk.isSubmitting || !formIk.isValid}
          >
            {formIk.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">Demo Credentials: admin@company.com / password123</p>
        </div> */}
      </CardContent>
    </Card>
  );
}
