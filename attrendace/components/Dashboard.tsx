"use client";
import React from "react";
import { Sidebar } from "./sidebar";
import { Button } from "./ui/button";
import { Menu } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { LoadingSpinner } from "./ui/loading-spinner";
export default function Dashboard({
  children,
}:{
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const { userBasicInfo, loading } = useUser();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Component */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeItem="attendance"
      />

      {/* Main Content - Add left margin to account for fixed sidebar */}
      <main className="md:ml-64 transition-all duration-300">
        <div className="p-6 md:p-10">
          <div className="flex items-center mb-8">
            <Button
              variant="outline"
              size="icon"
              className="md:hidden mr-4"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex">
                Hello, { loading ? <LoadingSpinner size="sm"/> :
                  `${userBasicInfo?.firstName.toString().charAt(0).toUpperCase() +""+ userBasicInfo?.firstName.toString().slice(1)}  ${userBasicInfo?.lastName.toString()}`
                } 👋
              </h1>
              <p className="text-lg text-gray-600">Your dashboard</p>
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
