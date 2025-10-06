"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Check, X, Calendar, User, Clock, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

interface Leave {
  id: string
  leave_type: string
  start_date: string
  end_date: string
  reason: string
  status: "pending" | "approved" | "rejected"
  days_requested: number
  admin_notes?: string
  created_at: string
  profiles: {
    full_name: string
    email: string
    employee_id: string
    department: string
  }
}

interface LeaveManagementProps {
  onBack: () => void
}

export function LeaveManagement({ onBack }: LeaveManagementProps) {
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    loadLeaves()
  }, [])

  const loadLeaves = async () => {
    try {
      const response = await fetch("/api/leaves/admin")
      const data = await response.json()

      if (data.success) {
        setLeaves(data.leaves)
      } else {
        toast.error("Failed to load leave requests")
      }
    } catch (error) {
      toast.error("Failed to load leave requests")
      console.error("Load leaves error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveAction = async (leaveId: string, status: "approved" | "rejected") => {
    setProcessingId(leaveId)

    try {
      const response = await fetch("/api/leaves/admin", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leave_id: leaveId,
          status,
          admin_notes: adminNotes[leaveId] || "",
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        loadLeaves() // Refresh the list
        setAdminNotes((prev) => ({ ...prev, [leaveId]: "" }))
      } else {
        toast.error(data.error || "Failed to update leave request")
      }
    } catch (error) {
      toast.error("Failed to update leave request")
      console.error("Leave action error:", error)
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-orange-100 text-orange-700">Pending</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-700">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatLeaveType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leave requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-3">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Leave Management</h1>
            <p className="text-sm text-gray-600">{leaves.length} total requests</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {leaves.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Leave Requests</h3>
              <p className="text-gray-600">There are no leave requests to review at this time.</p>
            </CardContent>
          </Card>
        ) : (
          leaves.map((leave) => (
            <Card key={leave.id} className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      {leave.profiles.full_name}
                    </CardTitle>
                    <CardDescription>
                      {leave.profiles.employee_id} • {leave.profiles.department}
                    </CardDescription>
                  </div>
                  {getStatusBadge(leave.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Leave Type</p>
                    <p className="text-gray-600">{formatLeaveType(leave.leave_type)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Duration</p>
                    <p className="text-gray-600">{leave.days_requested} days</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Start Date</p>
                    <p className="text-gray-600">{new Date(leave.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">End Date</p>
                    <p className="text-gray-600">{new Date(leave.end_date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-gray-700 mb-2">Reason</p>
                  <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">{leave.reason}</p>
                </div>

                {leave.status === "pending" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes (Optional)</label>
                      <Textarea
                        placeholder="Add any notes about this leave request..."
                        value={adminNotes[leave.id] || ""}
                        onChange={(e) => setAdminNotes((prev) => ({ ...prev, [leave.id]: e.target.value }))}
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleLeaveAction(leave.id, "rejected")}
                        disabled={processingId === leave.id}
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleLeaveAction(leave.id, "approved")}
                        disabled={processingId === leave.id}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </div>
                  </div>
                )}

                {leave.admin_notes && (
                  <div>
                    <p className="font-medium text-gray-700 mb-2">Admin Notes</p>
                    <p className="text-gray-600 text-sm bg-blue-50 p-3 rounded-lg">{leave.admin_notes}</p>
                  </div>
                )}

                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="mr-1 h-3 w-3" />
                  Requested on {new Date(leave.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
