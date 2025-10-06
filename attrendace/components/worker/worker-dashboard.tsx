"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, User, MapPin, Loader2} from "lucide-react"
import { toast } from "sonner"
import { LeaveRequestForm } from "./leave-request-form"

export function WorkerDashboard() {
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [checkInTime, setCheckInTime] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [daysPresent, setDaysPresent] = useState(0)
  const [showLeaveForm, setShowLeaveForm] = useState(false)

 const [currentTime, setCurrentTime] = useState<Date | null>(null) // Initialize as null

  useEffect(() => {
    // Set initial time only on client side
    setCurrentTime(new Date())
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Load attendance status on component mount
    loadAttendanceStatus()
  }, [])

  const loadAttendanceStatus = async () => {
    try {
      const response = await fetch("/api/attendance/status")
      const data = await response.json()

      if (data.success) {
        setIsCheckedIn(data.stats.isCheckedIn)
        setDaysPresent(data.stats.daysPresent)
        if (data.attendance?.check_in_time) {
          setCheckInTime(new Date(data.attendance.check_in_time).toLocaleTimeString())
        }
      }
    } catch (error) {
      console.error("Failed to load attendance status:", error)
    }
  }

  const handleCheckIn = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/attendance/check-in", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setIsCheckedIn(true)
        setCheckInTime(new Date().toLocaleTimeString())
        toast.success("Checked in successfully!")
        loadAttendanceStatus() // Refresh stats
      } else {
        toast.error(data.error || "Failed to check in")
      }
    } catch (error) {
      toast.error("Failed to check in")
      console.error("Check-in error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/attendance/check-out", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setIsCheckedIn(false)
        setCheckInTime(null)
        toast.success("Checked out successfully!")
        loadAttendanceStatus() // Refresh stats
      } else {
        toast.error(data.error || "Failed to check out")
      }
    } catch (error) {
      toast.error("Failed to check out")
      console.error("Check-out error:", error)
    } finally {
      setLoading(false)
    }
  }
  return (
    <>    {/* Current Time & Attendance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white">
               <CardContent className="p-6 text-center">
            <div className="text-3xl md:text-4xl font-bold mb-2">
              {currentTime ? currentTime.toLocaleTimeString() : "Loading..."}
            </div>
            <div className="text-blue-100 text-base md:text-lg">
              {currentTime
                ? currentTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Loading..."}
            </div>
          </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center">
                  <Clock className="mr-2 h-5 w-5" /> Attendance Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isCheckedIn ? (
                  <Button
                    onClick={handleCheckIn}
                    disabled={loading}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-base font-medium"
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                    {loading ? "Checking In..." : "Check In Now"}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-green-800">Checked In</p>
                        <p className="text-sm text-green-600">at {checkInTime}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Present</Badge>
                    </div>
                    <Button
                      onClick={handleCheckOut}
                      disabled={loading}
                      variant="outline"
                      className="w-full h-12 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {loading ? "Checking Out..." : "Check Out"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-5 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">{daysPresent}</div>
                <div className="text-sm text-gray-600">Days Present</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-5 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">5</div>
                <div className="text-sm text-gray-600">Leave Balance</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-5 text-center">
                <div className="text-2xl font-bold text-amber-600 mb-1">2</div>
                <div className="text-sm text-gray-600">Pending Requests</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-5 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">98%</div>
                <div className="text-sm text-gray-600">Monthly Attendance</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Button
              variant="outline"
              className="h-14 text-base flex flex-col items-center justify-center gap-1 py-4 bg-white"
              onClick={() => setShowLeaveForm(true)}
            >
              <Calendar className="h-5 w-5 mb-1" />
              <span>Request Leave</span>
            </Button>
            <Button variant="outline" className="h-14 text-base flex flex-col items-center justify-center gap-1 py-4 bg-white">
              <Clock className="h-5 w-5 mb-1" />
              <span>View Attendance History</span>
            </Button>
            <Button variant="outline" className="h-14 text-base flex flex-col items-center justify-center gap-1 py-4 bg-white">
              <User className="h-5 w-5 mb-1" />
              <span>Update Profile</span>
            </Button>
          </div>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Recent Activity 📊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Checked in today</p>
                  <p className="text-xs text-gray-600">{checkInTime || "Not checked in yet"}</p>
                </div>
                <Badge
                  variant="secondary"
                  className={isCheckedIn ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}
                >
                  {isCheckedIn ? "Present" : "Not Present"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Leave request approved</p>
                  <p className="text-xs text-gray-600">Yesterday at 2:30 PM</p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Approved
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Updated profile information</p>
                  <p className="text-xs text-gray-600">2 days ago</p>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  Updated
                </Badge>
              </div>
            </CardContent>
          </Card>

      {showLeaveForm && (
        <LeaveRequestForm
          onClose={() => setShowLeaveForm(false)}
          onSuccess={() => {
            loadAttendanceStatus()
          }}
        />
      )}
    </>
  )
}