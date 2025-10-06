"use client";
import { useApi } from "@/lib/hooks/api-hooks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  Home,
  LogOut,
  Settings,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { LoadingSpinner } from "./ui/loading-spinner";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  activeItem: string;
  className?: string;
}

// Navigation items for the sidebar
const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, href: "/admin" },
  {
    id: "attendance",label: "Attendance",
    icon: Clock,
    href: "/admin/attendance"
  },
  { id: "leaves", label: "Leaves", icon: Calendar, href: "/admin/leaves" },
  { id: "emplyees", label: "Employees", icon: Calendar, href: "/admin/employees" },
  // { id: "reports", label: "Reports", icon: BarChart3, href: "/admin/reports" },
  // { id: "profile", label: "Profile", icon: User, href: "/admin/profile" },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/admin/settings",
  },
];

export  function Sidebar({ open, onClose, className }: SidebarProps) {
  const { userBasicInfo, loading } = useUser();
  const { useApiPost } = useApi();
  const router = usePathname();
  const navLink = useRouter();

  const {
    mutateAsync: logoutUser,
    isPending,
    isSuccess,
  } = useApiPost(["logout"], `/auth/logout`);
  // get current url and compare it with activeItem
  return (
    <>
      {/* Sidebar Navigation - Made fixed */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r flex flex-col py-6 px-4",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0", // Removed md:relative to keep it fixed on all screens
          className
        )}
      >
        <div className="flex justify-between items-center mb-8 px-2">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center mr-3">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800">WorkForce</h2>
          </div>
          {/* Close button for mobile */}
          <button
            className="md:hidden p-1 rounded-md hover:bg-gray-100"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User Profile Section */}
        <div className="px-4 py-3 mb-6 bg-blue-50 rounded-lg mx-2">
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-3">
                {userBasicInfo?.firstName[0].toUpperCase().toString().charAt(0) +
                  "" +
                  userBasicInfo?.lastName[0].toUpperCase().toString()}
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  {userBasicInfo?.firstName.toString().charAt(0).toUpperCase()+""+userBasicInfo?.firstName.toString().slice(1) + " " + userBasicInfo?.lastName}
                </p>
                <p className="text-xs text-gray-600">
                  {userBasicInfo?.role || "No department"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                onClick={() => {
                  navLink.push(item.href);
                  onClose();
                }}
                key={item.id}
                variant={router.includes(item.href) ? "secondary" : "ghost"}
                className={cn(
                  "justify-start h-11 cursor-pointer",
                  router.includes(item.href)
                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Logout Button at bottom */}
        <div className="mt-auto px-2 pt-4 border-t">
          <Button
            variant="outline"
            className="w-full justify-start h-11 text-gray-700 hover:text-red-600 hover:bg-red-50 cursor-pointer"
            onClick={async () => {
              await logoutUser({});
              window.location.href = "/";
            }}
          >
            {isPending ? (
              <>
                <LoadingSpinner className="mr-3 h-4 w-4" />
                Logging out
              </>
              
            ) : (
              <>
                <LogOut className="mr-3 h-4 w-4" />
                Logout
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
