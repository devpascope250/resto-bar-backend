"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, Calendar,Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useApi } from "@/lib/hooks/api-hooks"
interface Stats {
  countAllEmployees: number;
  countAllEmployeesAttendedToday: number;
  countAllLateArrivals: number;
  countAllPendingLeaves: number;
}
export function AdminDashboard() {
  const { useApiQuery } = useApi();
  const { data: employees } = useApiQuery<Stats>(['stats'],"/admin/stats");
  const router = useRouter();
  const stats = [
    { title: "Total Employees", value: employees?.countAllEmployees, icon: Users, color: "bg-blue-500" },
    { title: "Present Today", value: employees?.countAllEmployeesAttendedToday, icon: Clock, color: "bg-green-500" },
    { title: "Pending Leaves", value: employees?.countAllPendingLeaves, icon: Calendar, color: "bg-orange-500" },
    { title: "Late Arrivals", value: employees?.countAllLateArrivals, icon: Clock, color: "bg-red-500" },
  ]


  return (
    <>

        {/* Stats Grid - horizontal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-base text-gray-600">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Button className="flex-1 h-13 bg-blue-600 hover:bg-blue-700 text-sm cursor-pointer" onClick={() => router.push("/admin/employees")}>
            <Plus className="mr-2 h-3 w-3" /> Add New Employee
          </Button>
          <Button variant="outline" className="flex-1 h-13 text-sm cursor-pointer"  onClick={() => router.push("/admin/employees")}>
            <Users className="mr-2 h-3 w-3" /> View All Employees
          </Button>
            <Button
            variant="outline"
            className="flex-1 h-13 text-sm cursor-pointer"
            onClick={() => router.push("/admin/leaves")}
          >
            <Calendar className="h-3 w-3" /> Manage Leave Requests
          </Button>

            <Button variant="outline" className="flex-1 h-13 text-sm cursor-pointer"  onClick={() => router.push("/admin/attendance")}>
            <Clock className="mr-2 h-3 w-3" /> Attendance Reports
          </Button>
          </div>

        {/* Recent Activity */}
        <Card className="border-0 shadow-sm mb-10">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-sm">John Doe checked in</p>
                <p className="text-xs text-gray-600">2 minutes ago</p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Present
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-sm">Sarah Wilson requested leave</p>
                <p className="text-xs text-gray-600">1 hour ago</p>
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                Pending
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-sm">Mike Johnson checked out</p>
                <p className="text-xs text-gray-600">3 hours ago</p>
              </div>
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                Completed
              </Badge>
            </div>
          </CardContent>
        </Card>
      </>
  )
}
