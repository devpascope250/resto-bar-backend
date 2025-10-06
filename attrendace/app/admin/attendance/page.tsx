/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/lib/hooks/api-hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Filter,
  Plus,
  Search,
  User,
  Clock,
  MapPin,
  Check,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import DataTable from "@/components/Datatables/DataTable";
import Modal from "@/components/Modal";
import { ReusableForm } from "@/components/ReusableForm";
import { toast } from "sonner";
import Select from "react-select";
import { components } from "react-select";

// Types based on your Prisma schema
enum AttendanceStatus {
  In = "In",
  Out = "Out",
}

enum AttendanceEventType {
  Success = "Success",
  Failed = "Failed",
  Error = "Error",
}

interface Attendance {
  id: number;
  userId: number;
  user: User;
  latitude: number | null;
  longitude: number | null;
  status: AttendanceStatus;
  eventType: AttendanceEventType;
  createdAt: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
}

export default function AdminAttendancePage() {
  const { useApiQuery, useApiPost } = useApi();
  const [selectedDateRange, setSelectedDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch users for dropdown
  const { data: users, isPending: isLoadingUsers } = useApiQuery<User[]>(
    ["all-users"],
    "/admin/users"
  );

  // Fetch attendances with filters
  const {
    data: attendances,
    isPending: isLoadingAttendances,
    refetch,
  } = useApiQuery<Attendance[]>(
    ["attendances", selectedDateRange, selectedUserId],
    "/admin/attendances",
    undefined,
    {
      from: selectedDateRange.from.toISOString(),
      to: selectedDateRange.to.toISOString(),
      userId: selectedUserId !== "all" ? selectedUserId : undefined,
    }
  );

  // Create attendance mutation
  const { mutateAsync: createAttendance, isPending: isCreating } = useApiPost(
    ["create-attendance"],
    "/admin/attendances"
  );

  // Table columns
  const columns = [
    {
      header: "Employee",
      accessor: "user",
      render: (value: User) => (
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-sm">
              {value.firstName} {value.lastName}
            </p>
            <p className="text-xs text-gray-500">{value.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Date & Time",
      accessor: "createdAt",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm">
            {format(new Date(value), "MMM dd, yyyy hh:mm a")}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (value: AttendanceStatus) => (
        <Badge
          variant={value === AttendanceStatus.In ? "default" : "secondary"}
          className={
            value === AttendanceStatus.In
              ? "bg-green-100 text-green-800 hover:bg-green-100"
              : "bg-blue-100 text-blue-800 hover:bg-blue-100"
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      header: "Event Type",
      accessor: "enventType",
      render: (value: AttendanceEventType) => (
        <Badge
          variant={
            value === AttendanceEventType.Success
              ? "default"
              : value === AttendanceEventType.Failed
              ? "secondary"
              : "destructive"
          }
          className={
            value === AttendanceEventType.Success
              ? "bg-green-100 text-green-800 hover:bg-green-100"
              : value === AttendanceEventType.Failed
              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
              : "bg-red-100 text-red-800 hover:bg-red-100"
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      header: "Location",
      accessor: "latitude",
      render: (value: number | null, row: Attendance) => (
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-500">
            {row.latitude && row.longitude
              ? `${row.latitude.toFixed(4)}, ${row.longitude.toFixed(4)}`
              : "Admin created"}
          </span>
        </div>
      ),
    },
  ];

  // Handle creating a new attendance
  const handleCreateAttendance = async (values: any) => {
    try {
      await createAttendance(values);
      toast.success("Attendance created successfully", {
        style: {
          background: "#2ecc71",
          color: "#fff",
        },
      });
      setIsCreateModalOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Error creating attendance", {
        style: {
          background: "#e74c3c",
          color: "#fff",
        },
      });
    }
  };

  // Filter attendances based on search query
  const filteredAttendances =
    attendances?.filter((attendance) => {
      if (!searchQuery) return true;

      const searchTerm = searchQuery.toLowerCase();
      return (
        attendance.user.firstName.toLowerCase().includes(searchTerm) ||
        attendance.user.lastName.toLowerCase().includes(searchTerm) ||
        attendance.user.email.toLowerCase().includes(searchTerm) ||
        attendance.status.toLowerCase().includes(searchTerm) ||
        format(new Date(attendance.createdAt), "MMM dd, yyyy hh:mm a")
          .toLowerCase()
          .includes(searchTerm)
      );
    }) || [];

  const CustomOption = (props: any) => (
    <components.Option {...props}>
      <div className="flex items-center">
        {props.isSelected && <Check className="mr-2 h-4 w-4" />}
        <span>{props.label}</span>
      </div>
    </components.Option>
  );

  const userOptions =
    users?.map((user) => ({
      value: user.id.toString(),
      label: `${user.firstName} ${user.lastName}`,
    })) || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Attendance Management
          </h1>
          <p className="text-gray-600">
            View and manage employee attendance records
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Attendance
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Filter attendance records by date and employee
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">
                {filteredAttendances.length} records
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range Picker */}
            <div className="space-y-2">
              <Label htmlFor="date-range">Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDateRange.from ? (
                      selectedDateRange.to ? (
                        <>
                          {format(selectedDateRange.from, "MMM dd, yyyy")} -{" "}
                          {format(selectedDateRange.to, "MMM dd, yyyy")}
                        </>
                      ) : (
                        format(selectedDateRange.from, "MMM dd, yyyy")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={selectedDateRange.from}
                    selected={{
                      from: selectedDateRange.from,
                      to: selectedDateRange.to,
                    }}
                    onSelect={(range) => {
                      if (range?.from && range.to) {
                        setSelectedDateRange({
                          from: range.from,
                          to: range.to,
                        });
                      }
                    }}
                    numberOfMonths={2}
                  />
                  <div className="flex justify-between p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        setSelectedDateRange({
                          from: startOfWeek(today),
                          to: endOfWeek(today),
                        });
                      }}
                    >
                      This Week
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        setSelectedDateRange({
                          from: startOfMonth(today),
                          to: endOfMonth(today),
                        });
                      }}
                    >
                      This Month
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Employee Filter */}
            {/* <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select
                options={[
                  { value: "all", label: "All Employees" },
                  ...userOptions,
                ]}
                value={
                  userOptions.find((opt) => opt.value === selectedUserId) || {
                    value: "all",
                    label: "All Employees",
                  }
                }
                onChange={(selectedOption) =>
                  setSelectedUserId(selectedOption?.value || "all")
                }
                isSearchable
                placeholder="Select employee..."
                components={{ Option: CustomOption }}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "40px",
                    borderColor: "#e5e7eb",
                    borderRadius: "6px",
                    "&:hover": {
                      borderColor: "#3b82f6",
                    },
                  }),
                  menu: (base) => ({
                    ...base,
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "#3b82f6"
                      : state.isFocused
                      ? "#f3f4f6"
                      : "white",
                    color: state.isSelected ? "white" : "#374151",
                    "&:active": {
                      backgroundColor: "#3b82f6",
                      color: "white",
                    },
                  }),
                }}
              />
            </div>

            {/* Search Filter */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  type="search"
                  placeholder="Search attendances..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            {selectedDateRange.from && selectedDateRange.to && (
              <>
                Records from {format(selectedDateRange.from, "MMM dd, yyyy")} to{" "}
                {format(selectedDateRange.to, "MMM dd, yyyy")}
                {selectedUserId !== "all" && <> for selected employee</>}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredAttendances}
            isLoading={isLoadingAttendances}
            exportable={true}
            showDefaultFilters={false}
          />
        </CardContent>
      </Card>

      {/* Create Attendance Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Attendance Record"
        size="lg"
      >
        <ReusableForm
          fields={[
            {
              name: "userId",
              type: "react-select",
              label: "Employee",
              required: true,
              options:
                users?.map((user) => ({
                  label: `${user.firstName} ${user.lastName}`,
                  value: user.id.toString(),
                })) || [],
              colSpan: 2,
            },
            {
              name: "status",
              type: "select",
              label: "Status",
              required: true,
              options: [
                { label: "In", value: AttendanceStatus.In },
                { label: "Out", value: AttendanceStatus.Out },
              ],
              colSpan: 2,
            },
            {
              name: "eventType",
              type: "select",
              label: "Event Type",
              required: true,
              options: [
                { label: "Success", value: AttendanceEventType.Success },
                { label: "Failed", value: AttendanceEventType.Failed },
                { label: "Error", value: AttendanceEventType.Error },
              ],
            },
            {
              name: "createdAt",
              type: "datetime",
              label: "Date & Time",
              required: true,
            },
          ]}
          initialValues={{
            userId: "",
            status: AttendanceStatus.In,
            eventType: AttendanceEventType.Success,
            createdAt: new Date().toISOString(),
          }}
          onSubmit={handleCreateAttendance}
          submitButtonText={isCreating ? "Creating..." : "Create Attendance"}
        />
      </Modal>
    </div>
  );
}
