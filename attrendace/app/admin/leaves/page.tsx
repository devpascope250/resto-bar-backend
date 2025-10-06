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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarIcon,
  Filter,
  Plus,
  Search,
  User,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  differenceInDays,
  addDays,
} from "date-fns";
import DataTable from "@/components/Datatables/DataTable";
import Modal from "@/components/Modal";
import { ReusableForm } from "@/components/ReusableForm";
import { toast } from "sonner";
import { LeaveStatus } from "@prisma/client";

// Types based on your Prisma schema

enum LeaveType {
  Sick = "Sick",
  Annual = "Annual",
  Maternity = "Maternity",
  Paternity = "Paternity",
  Vacation = "Vacation",
  Personal = "Personal",
  Other = "Other",
}

interface RequestLeave {
  id: number;
  userId: number;
  user: User;
  days: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
  updatedAt: string;
}

interface CompanyLeaveSetting {
  id: number;
  days: number;
  type: LeaveType;
  companyId: number;
  company: Company;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
}

interface Company {
  id: number;
  name: string;
}

export default function AdminLeaveManagementPage() {
  const { useApiQuery, useApiPost, useApiPut, useApiDelete, queryClient, api } =
    useApi();
  const [activeTab, setActiveTab] = useState("requests");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    useState<CompanyLeaveSetting | null>(null);
  const [leaveWorkerSettings, setLeaveWorkerSettings] = useState<
    CompanyLeaveSetting[]
  >([]);
  // Fetch leave requests
  const {
    data: leaveRequests,
    isLoading: isLoadingLeaves,
    refetch,
  } = useApiQuery<RequestLeave[]>(
    ["leave-requests", selectedStatus],
    "/admin/leave-requests",
    undefined,
    {
      status: selectedStatus !== "all" ? selectedStatus : undefined,
    }
  );

  

  // Fetch company leave settings
//   const {
//     data: leaveSettings,
//     isPending: isLoadingSettings,
//     refetch: refetchSettings,
//   } = useApiQuery<CompanyLeaveSetting[]>(
//     ["leave-settings"],
//     "/admin/leave-settings"
//   );

  // Fetch users for dropdown
  const { data: users, isPending: isLoadingUsers } = useApiQuery<User[]>(
    ["all-users"],
    "/admin/users"
  );

  // Fetch companies for dropdown
  const { data: companies, isPending: isLoadingCompanies } = useApiQuery<
    Company[]
  >(["all-companies"], "/admin/company/select");

  // create leave request mutation
  const { mutateAsync: createLeaveRequest, isPending: isCreating } = useApiPost(
    ["create-leave-request"],
    "/admin/leave-requests"
  );

  // Update leave request mutation
  const { mutateAsync: updateLeaveRequest, isPending: isUpdating } = useApiPut(
    ["update-leave-request"],
    "/admin/leave-requests"
  );

  // Create leave setting mutation
  const { mutateAsync: createLeaveSetting, isPending: isCreatingSetting } =
    useApiPost(["create-leave-setting"], "/admin/leave-settings");

  // Update leave setting mutation
  const { mutateAsync: updateLeaveSetting, isPending: isUpdatingSetting } =
    useApiPut(["update-leave-setting"], "/admin/leave-settings");

  // Delete leave setting mutation
  const { mutateAsync: deleteLeaveSetting, isPending: isDeletingSetting } =
    useApiDelete(["delete-leave-setting"], "/admin/leave-settings");

  // Leave Requests Table columns
  const leaveRequestColumns = [
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
      header: "Leave Type",
      accessor: "type",
      render: (value: string) => {
        // Extract leave type from reason or use the first word
        const isValidType = Object.values(LeaveType).includes(
          value as LeaveType
        );

        return (
          <Badge variant="outline" className="capitalize">
            {isValidType ? value : "Other"}
          </Badge>
        );
      },
    },
    {
      header: "Duration",
      accessor: "days",
      render: (value: number, row: RequestLeave) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {value} day{value !== 1 ? "s" : ""}
          </span>
          <span className="text-xs text-gray-500">
            {format(new Date(row.startDate), "MMM dd")} -{" "}
            {format(new Date(row.endDate), "MMM dd, yyyy")}
          </span>
        </div>
      ),
    },
    {
      header: "Reason",
      accessor: "reason",
      render: (value: string) => (
        <div className="max-w-[200px] truncate" title={value}>
          {value}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (value: LeaveStatus) => (
        <Badge
          variant={
            value === LeaveStatus.APPROVED
              ? "default"
              : value === LeaveStatus.REJECTED
              ? "destructive"
              : "secondary"
          }
          className={
            value === LeaveStatus.APPROVED
              ? "bg-green-100 text-green-800 hover:bg-green-100"
              : value === LeaveStatus.REJECTED
              ? "bg-red-100 text-red-800 hover:bg-red-100"
              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      header: "Submitted",
      accessor: "createdAt",
      render: (value: string) => (
        <div className="text-xs text-gray-500">
          {format(new Date(value), "MMM dd, yyyy hh:mm a")}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "id",
      render: (value: number, row: RequestLeave) => (
        <div className="flex space-x-2">
          {row.status === LeaveStatus.PENDING && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 bg-green-50 text-green-700 hover:bg-green-100"
                onClick={() => handleUpdateStatus(value, LeaveStatus.APPROVED)}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 bg-red-50 text-red-700 hover:bg-red-100"
                onClick={() => handleUpdateStatus(value, LeaveStatus.REJECTED)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
          {(row.status === LeaveStatus.APPROVED ||
            row.status === LeaveStatus.REJECTED) && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2"
              onClick={() => handleViewDetails(row)}
            >
              View
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Leave Settings Table columns
  //   const leaveSettingsColumns = [
  //     {
  //       header: "Leave Type",
  //       accessor: "type",
  //       render: (value: LeaveType) => (
  //         <Badge variant="outline" className="capitalize">
  //           {value}
  //         </Badge>
  //       ),
  //     },
  //     {
  //       header: "Days Allocated",
  //       accessor: "days",
  //       render: (value: number) => (
  //         <span className="font-medium">{value} days</span>
  //       ),
  //     },
  //     {
  //       header: "Company",
  //       accessor: "company",
  //       render: (value: Company) => (
  //         <span className="text-sm">{value.name}</span>
  //       ),
  //     },
  //     {
  //       header: "Actions",
  //       accessor: "id",
  //       render: (value: number, row: CompanyLeaveSetting) => (
  //         <div className="flex space-x-2">
  //           <Button
  //             size="sm"
  //             variant="outline"
  //             className="h-8 px-2"
  //             onClick={() => {
  //               setEditingSetting(row);
  //               setIsSettingsModalOpen(true);
  //             }}
  //           >
  //             <Settings className="h-4 w-4" />
  //           </Button>
  //           <Button
  //             size="sm"
  //             variant="outline"
  //             className="h-8 px-2 bg-red-50 text-red-700 hover:bg-red-100"
  //             onClick={() => handleDeleteSetting(value)}
  //           >
  //             <XCircle className="h-4 w-4" />
  //           </Button>
  //         </div>
  //       ),
  //     },
  //   ];

  // Handle updating leave request status
  const handleUpdateStatus = async (id: number, status: LeaveStatus) => {
    try {
      await updateLeaveRequest({ id, status });
      toast.success(`Leave request ${status.toLowerCase()} successfully`, {
        style: {
          background: status === LeaveStatus.APPROVED ? "#2ecc71" : "#e74c3c",
          color: "#fff",
        },
      });
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Error updating leave request", {
        style: {
          background: "#e74c3c",
          color: "#fff",
        },
      });
    }
  };

  // Handle viewing leave request details
  const handleViewDetails = (request: RequestLeave) => {
    // In a real app, this would open a detail modal or page
    toast.info(
      `Viewing details for ${request.user.firstName}'s leave request`,
      {
        style: {
          background: "#3498db",
          color: "#fff",
        },
      }
    );
  };

  // Handle creating/updating leave settings
//   const handleSaveSetting = async (values: any) => {
//     try {
//       if (editingSetting) {
//         await updateLeaveSetting({ ...values, id: editingSetting.id });
//         toast.success("Leave setting updated successfully", {
//           style: {
//             background: "#2ecc71",
//             color: "#fff",
//           },
//         });
//       } else {
//         await createLeaveSetting(values);
//         toast.success("Leave setting created successfully", {
//           style: {
//             background: "#2ecc71",
//             color: "#fff",
//           },
//         });
//       }
//       setIsSettingsModalOpen(false);
//       setEditingSetting(null);
//       refetchSettings();
//     } catch (error: any) {
//       toast.error(error.message || "Error saving leave setting", {
//         style: {
//           background: "#e74c3c",
//           color: "#fff",
//         },
//       });
//     }
//   };

  // Handle deleting leave settings
//   const handleDeleteSetting = async (id: number) => {
//     try {
//       await deleteLeaveSetting({ id: id.toString() });
//       toast.success("Leave setting deleted successfully", {
//         style: {
//           background: "#2ecc71",
//           color: "#fff",
//         },
//       });
//       refetchSettings();
//     } catch (error: any) {
//       toast.error(error.message || "Error deleting leave setting", {
//         style: {
//           background: "#e74c3c",
//           color: "#fff",
//         },
//       });
//     }
//   };

  // Filter leave requests based on search query
  const filteredLeaveRequests =
    leaveRequests?.filter((request) => {
      if (!searchQuery) return true;

      const searchTerm = searchQuery.toLowerCase();
      return (
        request.user.firstName.toLowerCase().includes(searchTerm) ||
        request.user.lastName.toLowerCase().includes(searchTerm) ||
        request.user.email.toLowerCase().includes(searchTerm) ||
        request.reason.toLowerCase().includes(searchTerm) ||
        request.status.toLowerCase().includes(searchTerm)
      );
    }) || [];

  // Filter leave settings by type
//   const filteredLeaveSettings =
//     leaveSettings?.filter((setting) => {
//       if (selectedLeaveType === "all") return true;
//       return setting.type === selectedLeaveType;
//     }) || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600">
            Manage employee leave requests and company leave policies
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Leave Request
          </Button>
          {/* <Button onClick={() => {
            setEditingSetting(null);
            setIsSettingsModalOpen(true);
          }}>
            <Settings className="h-4 w-4 mr-2" />
            Leave Settings
          </Button> */}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          {/* <TabsTrigger value="settings">Leave Settings</TabsTrigger> */}
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          {/* Filters Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Leave Requests</CardTitle>
                  <CardDescription>
                    Manage employee leave requests
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">
                    {filteredLeaveRequests.length} requests
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value={LeaveStatus.PENDING}>Pending</SelectItem>
                      <SelectItem value={LeaveStatus.APPROVED}>Approved</SelectItem>
                      <SelectItem value={LeaveStatus.REJECTED}>Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Filter */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="search"
                      type="search"
                      placeholder="Search leave requests..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leave Requests Table */}
          <Card>
            <CardContent className="p-0">
              <DataTable
                columns={leaveRequestColumns}
                data={filteredLeaveRequests}
                isLoading={isLoadingLeaves}
                exportable={true}
                showDefaultFilters={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* <TabsContent value="settings" className="space-y-6"> */}
        {/* Leave Settings Filters */}
        {/* <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Leave Settings</CardTitle>
                  <CardDescription>Manage company leave policies</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">{filteredLeaveSettings.length} settings</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leaveType">Leave Type</Label>
                  <Select value={selectedLeaveType} onValueChange={setSelectedLeaveType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.values(LeaveType).map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card> */}

        {/* Leave Settings Table */}
        {/* <Card>
            <CardContent className="p-0">
              <DataTable
                columns={leaveSettingsColumns}
                data={filteredLeaveSettings}
                isLoading={isLoadingSettings}
                exportable={true}
                showDefaultFilters={false}
              />
            </CardContent>
          </Card> */}
        {/* </TabsContent> */}
      </Tabs>

      {/* Create Leave Request Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {setIsCreateModalOpen(false);
            setLeaveWorkerSettings([]);
        }}
        title="Create Leave Request"
        size="xl"
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
              isSearchable: true,
              colSpan: 2,
              onChange: async (value: string) => {
                toast.loading("Fetching employee leave settings...", {id: "fetching-leave-settings"});
                // active company
                await api
                  .get("/admin/leave-settings/" + value+"/employee-company-leaves")
                  .then((response) => {
                    console.log(companies);
                    console.log(response);
                    
                    setLeaveWorkerSettings(response as CompanyLeaveSetting[]);
                  })
                  .catch((error) => {
                    toast.error(error.message, {
                      style: {
                        background: "#de1e1ef0",
                        color: "#fff",
                      },
                    });
                  }).finally(() => {
                      toast.dismiss("fetching-leave-settings");
                  });
              },
            },
            ...(leaveWorkerSettings?.length > 0 ? [
              {
                name: "leaveType",
                type: "react-select" as const,
                label: "Leave Type",
                required: true,
                colSpan: 2 as const,
                options: leaveWorkerSettings.map((setting) =>(
                    {
                      label: setting.type,
                      value: setting.id.toString(),
                    }
                ))
              }] : []
              
            ),

            {
              name: "startDate",
              type: "datetime",
              label: "Start Date",
              required: true,
            },
            {
              name: "endDate",
              type: "datetime",
              label: "End Date",
              required: true,
            },
            {
              name: "reason",
              type: "textarea",
              label: "Reason",
              required: true,
              placeholder: "E.g., Sick leave for medical appointment",
              colSpan: 2,
            },
          ]}
          initialValues={{
            userId: "",
            startDate: "",
            endDate: "",
            reason: "",
            leaveType: "",
          }}
          onSubmit={async (values) => {
            // Calculate days between dates
            const start = new Date(values.startDate);
            const end = new Date(values.endDate);
            const days = differenceInDays(end, start) + 1; // Inclusive of both dates

            try {
              await createLeaveRequest({
                ...values,
                days,
                status: LeaveStatus.APPROVED, // Auto-approve admin-created requests
              });
              toast.success("Leave request created successfully", {
                style: {
                  background: "#2ecc71",
                  color: "#fff",
                },
              });
              setIsCreateModalOpen(false);
              refetch();
            } catch (error: any) {
              toast.error(error.message || "Error creating leave request", {
                style: {
                  background: "#e74c3c",
                  color: "#fff",
                },
              });
            }
          }}
          submitButtonText="Create Leave Request"
        />
      </Modal>

      {/* Leave Settings Modal */}
      {/* <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => {
          setIsSettingsModalOpen(false);
          setEditingSetting(null);
        }}
        title={editingSetting ? "Edit Leave Setting" : "Create Leave Setting"}
        size="lg"
      >
        <ReusableForm
          fields={[
            {
              name: "type",
              type: "select",
              label: "Leave Type",
              required: true,
              options: Object.values(LeaveType).map(type => ({
                label: type,
                value: type
              })),
              colSpan: 2
            },
            {
              name: "days",
              type: "number",
              label: "Days Allocated",
              required: true,
              min: 1,
              colSpan: 2
            },
            {
              name: "companyId",
              type: "select",
              label: "Company",
              required: true,
              options: companies?.map(company => ({
                label: company.name,
                value: company.id.toString()
              })) || [],
              colSpan: 2
            }
          ]}
          initialValues={{
            type: editingSetting?.type || "",
            days: editingSetting?.days || 1,
            companyId: editingSetting?.companyId.toString() || ""
          }}
          onSubmit={handleSaveSetting}
          submitButtonText={
            isCreatingSetting || isUpdatingSetting 
              ? "Saving..." 
              : editingSetting ? "Update Setting" : "Create Setting"
          }
        />
      </Modal> */}
    </div>
  );
}
