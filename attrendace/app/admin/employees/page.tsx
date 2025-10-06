/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useApi } from "@/lib/hooks/api-hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  User2,
  Phone,
  Briefcase,
  Building,
  X,
} from "lucide-react";
import { Company, CompanyType, Gender, Status, User } from "@prisma/client";
import DataTable from "@/components/Datatables/DataTable";
import Modal from "@/components/Modal";
import React from "react";
import { ReusableForm } from "@/components/ReusableForm";
import { toast } from "sonner";
import { DropdownActions } from "@/components/DropdownActions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Employees extends User {
  company: Companyy[];
}
interface Companyy {
  id: number;
  companyWorkerId: number;
  name: string;
  type: CompanyType;
  status: Status;
}

export default function AdminDashboard() {
  const [isEmployeeDetailsOpen, setIsEmployeeDetailsOpen] =
    React.useState<boolean>(false);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] =
    React.useState<Employees | null>(null);
  const { useApiQuery, useApiPost, useApiDelete, queryClient, useApiPut } =
    useApi();
  const [isChangingStatusId, setIsChangingStatusId] = React.useState<
    string | null
  >(null);
  const {
    data: employeess,
    refetch,
  } = useApiQuery(["all-employees"], "/admin/employees");
  const { data: companies } = useApiQuery<
    Company[]
  >(["all-companies"], "/admin/company/select");
  const { mutateAsync: addEmployee } = useApiPost(
    ["add-user"],
    "/admin/employees"
  );
  const [selectedEmployee, setSelectedEmployee] =
    React.useState<Employees | null>(null);
  const { mutateAsync: deleteEmployee } =
    useApiDelete(["delete-user"], "/admin/employees");
  const { mutateAsync: updateEmploye } = useApiPut(
    ["update-user"],
    "/admin/employees/" + selectedEmployee?.id
  );
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const [employees, setEmployees] = React.useState<Employees[]>([]);
  React.useEffect(() => {
    if (employeess) {
      setEmployees(employeess as Employees[]);
    }
  }, [employeess]);
  const columns = [
    {
      header: "Names",
      accessor: "name",
      render: (value: string, row: Employees) => (
        <div className=" gap-4">
          <p className="font-medium text-gray-900">{row.firstName}</p>
          <p className="text-gray-600">{row.lastName}</p>
        </div>
      ),
    },
    {
      header: "Gender",
      accessor: "gender",
    },
    {
      header: "Email",
      accessor: "email",
    },
    {
      header: "Phone",
      accessor: "phone",
    },
    {
      header: "Role",
      accessor: "role",
    },
    {
      header: "Status",
      accessor: "status",
    },
    {
      header: "Action",
      accessor: "id",
      render: (value: number, row: Employees) => (
        <DropdownActions
          onEdit={() => {
            setSelectedEmployee(row);
            setIsOpen(true);
          }}
          onDelete={async () => {
            await deleteEmployee({ id: value.toString() })
              .then(() => {
                const newEmployees = employees.filter(
                  (employee) => employee.id !== value
                );
                setEmployees(newEmployees);
                toast.success("Employee deleted successfully", {
                  style: {
                    background: "#2ecc71",
                    color: "#fff",
                  },
                });
              })
              .catch((error) => {
                toast.error("Error deleting employee", {
                  style: {
                    background: "#e74c3c",
                    color: "#fff",
                  },
                });
              });
          }}
          onView={() => {
            setSelectedEmployeeDetails(row);
            setIsEmployeeDetailsOpen(true);
          }}
        />
      ),
    },
  ];

  const [showAddCompany, setShowAddCompany] = React.useState(false);
  const [companyToChange, setCompanyToChange] = React.useState<Companyy | null>(
    null
  );
  const { mutateAsync: addCompanyToEmployee } = useApiPost(
    ["add-company-to-employee"],
    "/admin/employees/add-company"
  );
  // Filter out companies already associated with the employee
  const handleAddCompany = async (value: { companyId: string }) => {
    const values = {
      companyId: value.companyId,
      workerId: selectedEmployeeDetails?.id,
    };

    await addCompanyToEmployee(values)
      .then((response) => {
        setShowAddCompany(false);
        toast.success("successfully added company to employee", {
          style: {
            background: "#2ecc71",
            color: "#fff",
          },
        });

        // Create the NEW company object
        const newCompany = {
          id: parseInt(value.companyId),
          companyWorkerId: (response as { data: { id: number } }).data.id,
          name:
            companies?.find((comp) => comp.id === parseInt(value.companyId))
              ?.name || "",
          status: (response as { data: { status: Status } }).data.status,
          type: companies?.find((comp) => comp.id === parseInt(value.companyId))
            ?.type as CompanyType,
        };

        if (selectedEmployeeDetails) {
          // Append the NEW company to the EXISTING array
          setSelectedEmployeeDetails({
            ...selectedEmployeeDetails,
            company: [
              ...selectedEmployeeDetails.company,
              newCompany as Companyy,
            ],
          });
        }
      })
      .catch((error) => {
        toast.error(error.message || "Error adding company to employee", {
          style: {
            background: "#e74c3c",
            color: "#fff",
          },
        });
      });
  };

  const { mutateAsync: deleteCompany } = useApiDelete(
    ["delete-company"],
    "/admin/employees/delete-company"
  );
  const handleRemoveCompany = async (companyId: number) => {
    toast.loading("Deleting company", {
      style: {
        background: "#3498db",
        color: "#fff",
      },
      id: "delete-company",
    });
    await deleteCompany({ id: companyId.toString() })
      .then(() => {
        const newCompanies = selectedEmployeeDetails?.company.filter(
          (company) => company.companyWorkerId !== companyId
        );
        if (selectedEmployeeDetails) {
          setSelectedEmployeeDetails({
            ...selectedEmployeeDetails,
            company: newCompanies || [],
          });
        }
      })
      .catch((error) => {
        toast.error(error.message || "Error deleting company", {
          style: {
            background: "#e74c3c",
            color: "#fff",
          },
        });
      })
      .finally(() => {
        toast.dismiss("delete-company");
      });
  };

  const handleChangeCompany = (company: Companyy) => {
    setCompanyToChange(company);
  };

  const { mutateAsync: changeCompany } = useApiPut(
    ["update-company"],
    "/admin/employees/add-company/" + companyToChange?.companyWorkerId
  );
  const handleConfirmChangeCompany = async (value: {
    newCompanyId: string;
  }) => {
    if (companyToChange) {
      const values = {
        companyId: value.newCompanyId,
        workerId: selectedEmployeeDetails?.id,
      };
      await changeCompany(values)
        .then((response) => {
          const changeComp =
            selectedEmployeeDetails?.company.map((company) => {
              const newCompany = companies?.find(
                (comp) => comp.id === parseInt(value.newCompanyId)
              );
              if (company.id === companyToChange.id) {
                return {
                  ...company,
                  id: parseInt(value.newCompanyId),
                  name: newCompany?.name || "Unknown",
                  status: Status.Active,
                };
              } else {
                return company;
              }
            }) || [];

          if (selectedEmployeeDetails) {
            setSelectedEmployeeDetails({
              ...selectedEmployeeDetails,
              company: changeComp,
            });
          }
          setCompanyToChange(null);
        })
        .catch((error) => {
          toast.error(error.message || "Error changing company", {
            style: {
              background: "#e74c3c",
              color: "#fff",
            },
          });
        });
    }
  };

  const { mutateAsync: changeCompanyStatus, isPending: isChangingStatus } =
    useApiPost(
      ["change-company-status"],
      "/admin/employees/change-company-status"
    );

  const handleChangeAssignCompanyStatus = async (values: {
    companyWorkerId: number;
    workerId: number;
    companyId: number;
    status: Status;
  }) => {
    await changeCompanyStatus(values)
      .then(() => {
        toast.success("Company status changed successfully", {
          style: {
            background: "#2ecc71",
            color: "#fff",
          },
        });

        refetch();

        const newSelectedDetail = selectedEmployeeDetails?.company
          .map((company) => {
            const isTargetCompany =
              values.companyWorkerId === company.companyWorkerId;

            if (values.status === Status.Inactive) {
              // When deactivating, activate the target company, deactivate others
              return {
                ...company,
                status: isTargetCompany ? Status.Active : Status.Inactive,
              };
            } else {
              // When activating, deactivate the target company (or handle other cases)
              return {
                ...company,
                status: isTargetCompany ? Status.Inactive : company.status, // Keep original status for others
              };
            }
          })
          .filter(Boolean) as Companyy[]; // Filter out any undefined values

        if (selectedEmployeeDetails && newSelectedDetail) {
          setSelectedEmployeeDetails({
            ...selectedEmployeeDetails,
            company: newSelectedDetail,
          });
        }
      })
      .catch((error) => {
        toast.error(error.message || "Error changing company status", {
          style: {
            background: "#e74c3c",
            color: "#fff",
          },
        });
      })
      .finally(() => {
        setIsChangingStatusId(null);
      });
  };

  const onClose = () => {
    setIsOpen(false);
    setSelectedEmployee(null);
  };


  return (
    <>

      {/* Recent Activity */}
      <Card className="border-0 shadow-sm mb-10">
        <DataTable
          columns={columns}
          data={(employees as Employees[]) ?? []}
          exportable={false}
          showDefaultFilters={false}
          customFilter={
            <Button
              variant="default"
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setIsOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          }
        />
      </Card>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={selectedEmployee ? "Edit Employee" : "Add Employee"}
        size="xl"
      >
        <ReusableForm
          fields={[
            {
              name: "firstName",
              type: "text",
              label: "Firstname",
              required: true,
            },
            {
              name: "lastName",
              type: "text",
              label: "Lastname",
              required: true,
            },
            { name: "email", type: "email", label: "Email", required: true },
            { name: "phone", type: "text", label: "Phone", required: true },
            {
              name: "gender",
              type: "select",
              label: "Gender",
              required: true,
              options: [
                { label: "Male", value: Gender.Male },
                { label: "Female", value: Gender.Female },
                { label: "Other", value: Gender.Other },
              ],
            },
            {
              name: "status",
              type: "select",
              label: "Status",
              required: true,
              options: [
                { label: "Active", value: Status.Active },
                { label: "Inactive", value: Status.Inactive },
              ],
            },
            {
              name: "role",
              type: "select",
              label: "Role",
              required: true,
              options: [{ label: "Worker", value: "Worker" }],
              colSpan: selectedEmployee ? 2 : 1,
            },
            ...(selectedEmployee
              ? []
              : [
                  {
                    name: "companyId",
                    type: "select" as const,
                    label: "Company",
                    required: true,
                    options: companies?.map((company) => ({
                      label: company.name,
                      value: company.id.toString(),
                    })),
                  },
                ]),
          ]}
          initialValues={{
            firstName: selectedEmployee?.firstName || "",
            lastName: selectedEmployee?.lastName || "",
            email: selectedEmployee?.email || "",
            phone: selectedEmployee?.phone || "",
            gender: (selectedEmployee?.gender as Gender) || Gender.Other,
            role: selectedEmployee?.role || "",
            status: (selectedEmployee?.status as Status) || Status.Active,
            companyId: selectedEmployee?.company || "",
          }}
          onSubmit={async (values) => {
            if (selectedEmployee) {
              await updateEmploye(values)
                .then(() => {
                  setIsOpen(false);
                  const newEmploye = employees.map((employee) => {
                    if (employee.id === selectedEmployee.id) {
                      return {
                        ...employee,
                        ...values,
                      };
                    }
                    return employee;
                  });
                  setEmployees(newEmploye as Employees[]);
                  toast.success("Employee updated successfully", {
                    style: {
                      background: "#2ecc71",
                      color: "#fff",
                    },
                  });
                })
                .catch((error) => {
                  toast.error(error.message || "Error updating employee", {
                    style: {
                      background: "#e74c3c",
                      color: "#fff",
                    },
                  });
                });
            } else {
              await addEmployee(values)
                .then(() => {
                  setIsOpen(false);
                  queryClient.invalidateQueries({
                    queryKey: ["all-employees"],
                  });
                  toast.success("Employee added successfully", {
                    style: {
                      background: "#2ecc71",
                      color: "#fff",
                    },
                  });
                })
                .catch((error) => {
                  toast.error(error.message || "Error adding employee", {
                    style: {
                      background: "#e74c3c",
                      color: "#fff",
                    },
                  });
                });
            }
          }}
          submitButtonText={selectedEmployee ? "Edit" : "Save"}
        />
      </Modal>

      <Modal
        isOpen={isEmployeeDetailsOpen}
        onClose={() => {
          setIsEmployeeDetailsOpen(false);
          queryClient.invalidateQueries({
            queryKey: ["all-employees"],
          });
        }}
        size="xxl"
      >
        <Card className="w-full max-w-3xl">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <User2 className="h-6 w-6" />
                Employee Details
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEmployeeDetailsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
                  <User2 className="h-4 w-4" />
                  Personal Information
                </h3>
                <div className="grid gap-3">
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                    <span className="font-medium text-sm">First Name:</span>
                    <span className="text-foreground font-semibold">
                      {selectedEmployeeDetails?.firstName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                    <span className="font-medium text-sm">Last Name:</span>
                    <span className="text-foreground font-semibold">
                      {selectedEmployeeDetails?.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                    <span className="font-medium text-sm">Gender:</span>
                    <span className="text-foreground font-semibold capitalize">
                      {selectedEmployeeDetails?.gender?.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact Information
                </h3>
                <div className="grid gap-3">
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                    <span className="font-medium text-sm">Email:</span>
                    <span className="text-foreground font-semibold text-sm">
                      {selectedEmployeeDetails?.email}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                    <span className="font-medium text-sm">Phone:</span>
                    <span className="text-foreground font-semibold">
                      {selectedEmployeeDetails?.phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Employment Details
                </h3>
                <div className="grid gap-3">
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                    <span className="font-medium text-sm">Role:</span>
                    <span className="text-foreground font-semibold capitalize">
                      {selectedEmployeeDetails?.role?.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                    <span className="font-medium text-sm">Status:</span>
                    <Badge
                      variant={
                        selectedEmployeeDetails?.status === Status.Active
                          ? "default"
                          : "secondary"
                      }
                      className={
                        selectedEmployeeDetails?.status === Status.Active
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                      }
                    >
                      {selectedEmployeeDetails?.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Company Associations */}
              <div className="space-y-4 md:col-span-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Company Associations
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => setShowAddCompany(true)}
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Add Company
                  </Button>
                </div>

                <div className="grid gap-3">
                  {selectedEmployeeDetails?.company &&
                  selectedEmployeeDetails.company.length > 0 ? (
                    selectedEmployeeDetails.company.map((company) => (
                      <div
                        key={company.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-md border"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-sm">
                            {company.name}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {company?.type}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              company.status === Status.Active
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs cursor-pointer"
                            onClick={() => {
                              const values = {
                                companyWorkerId: company.companyWorkerId,
                                workerId: selectedEmployeeDetails.id,
                                companyId: company.id,
                                status: company.status,
                              };
                              if (!isChangingStatus) {
                                handleChangeAssignCompanyStatus(
                                  values as {
                                    companyWorkerId: number;
                                    workerId: number;
                                    companyId: number;
                                    status: Status;
                                  }
                                );

                                setIsChangingStatusId(
                                  company.companyWorkerId.toString()
                                );
                              }
                            }}
                          >
                            {isChangingStatus &&
                            isChangingStatusId ===
                              company.companyWorkerId.toString() ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              company.status
                            )}
                          </Badge>
                          <DropdownActions
                            onEdit={() => handleChangeCompany(company)}
                            onDelete={() =>
                              handleRemoveCompany(company.companyWorkerId)
                            }
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-6 text-muted-foreground border-2 border-dashed rounded-md">
                      <Building className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm mb-3">No company associations</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddCompany(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Company
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Company Modal */}
        <Modal isOpen={showAddCompany} onClose={() => setShowAddCompany(false)}>
          <ReusableForm
            fields={[
              {
                label: "Company",
                type: "select",
                name: "companyId",
                options: companies?.map((company) => ({
                  label: company.name,
                  value: company.id.toString(),
                })),
                colSpan: 2,
                required: true,
              },
            ]}
            initialValues={{
              companyId: "",
            }}
            onSubmit={handleAddCompany}
          />
        </Modal>

        {/* Change Company Modal */}
        <Modal
          title="Change Company"
          isOpen={!!companyToChange}
          onClose={() => setCompanyToChange(null)}
        >
          <ReusableForm
            fields={[
              {
                label: "Company",
                type: "select",
                name: "newCompanyId",
                options: companies?.map((company) => ({
                  label: company.name,
                  value: company.id.toString(),
                })),
                colSpan: 2,
                required: true,
              },
            ]}
            initialValues={{
              newCompanyId: companyToChange?.id.toString() || "",
            }}
            onSubmit={handleConfirmChangeCompany}
          />
        </Modal>
      </Modal>
    </>
  );
}
