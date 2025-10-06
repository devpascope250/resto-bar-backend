/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  User,
  Building,
  Calendar,
  Save,
  Edit,
  Plus,
  Trash2,
  Navigation,
  MapPin,
  QrCode,
  Check,
  X,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import * as yup from "yup";
import { useFormik } from "formik";
import { toast } from "sonner";
import { useApi } from "@/lib/hooks/api-hooks";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  Table,
} from "@/components/ui/table";
import {
  Company,
  CompanyLeaveSetting,
  Days,
  LeaveType,
  WorkingHours,
} from "@prisma/client";
import Modal from "@/components/Modal";
import LocationQrCodeClient from "@/components/LocationQrCode";
import { socketService } from "@/lib/socket";
interface Companies extends Company {
  workingHours: WorkingHours[];
}
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPass, setIsEditingPass] = useState(false);
  const [isEditingLeaveSettings, setIsEditingLeaveSettings] = useState(false);
  const [leaveSettings, setLeaveSettings] = useState<CompanyLeaveSetting[]>([]);
  const [newLeaveType, setNewLeaveType] = useState<LeaveType>("Personal");
  const [newLeaveDays, setNewLeaveDays] = useState(0);
  const { loading, userBasicInfo } = useUser();

  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );
  const [isDeletingLeaveSettingId, setIsDeletingLeaveSettingId] = useState<
    string | null
  >(null);
  const [selectedLeaveCompanyId, setSelectedLeaveCompanyId] = useState<
    string | null
  >(null);
  const { useApiPut, useApiPost, useApiQuery, useApiDelete, queryClient, api } =
    useApi();
  const [companies, setCompanies] = useState<Companies[]>([]);
  const { data: companiss } = useApiQuery(["all-company"], "/admin/company");
  interface Company {
    id: number;
    name: string;
    address: string;
    longitude: number;
    latitude: number;
    radius: number;
    type: CompanyType;
    workingHours: WorkingHour[];
  }
  type CompanyType = "Main" | "Branch";
  interface WorkingHour {
    id: number;
    day: string;
    startTime: string;
    endTime: string;
  }
  type SocketStatus = "START_COORDINATE_CAPTURE" | "QR_EXPIRED" | "COMPLETE_COORDINATE"
  const [newCompany, setNewCompany] = useState<Company>({
    id: 0,
    name: "",
    address: "",
    longitude: 0,
    latitude: 0,
    radius: 0,
    type: "Branch",
    workingHours: [],
  });

  interface Qr {
    companyId: number;
    type: string;
    value: string;
  }

  const [newWorkingDay, setNewWorkingDay] = useState("");
  const [editWorkingDay, setEditNewWorkingDay] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [editNewStartTime, setEditNewStartTime] = useState("");
  const [editNewEndTime, setEditNewEndTime] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Companies | null>(
    null
  );
  const [isDeletingHourId, setIsDeletingHourId] = useState<number | null>(null);
  const [isDeletingCompanyId, setIsDeletingCompanyId] = useState<number | null>(
    null
  );
  const [socketMessage, setSocketMessage] = useState<SocketStatus | ''>("");
  const [qrCodeData, setQrCodeData] = useState<Qr | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  // all companies
  useEffect(() => {
    setCompanies(companiss as Companies[]);
  }, [companiss]);

  // Get the currently selected company
  useEffect(() => {
    if (companies && companies.length > 0 && !selectedCompanyId) {
      const mainCompany = companies.find((company) => company.type === "Main");
      const initialCompany = mainCompany || companies[0];
      setSelectedCompanyId(initialCompany.id.toString());
      setSelectedCompany(initialCompany);
      setSelectedLeaveCompanyId(initialCompany.id.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies]);
  // Handle form changes for existing company
  const handleCompanyChange = (field: string, value: string) => {
    setSelectedCompany((prev) => (prev ? { ...prev, [field]: value } : null));
  };
  // Handle form changes for new company
  const handleNewCompanyChange = (field: string, value: string) => {
    setNewCompany((prev) => ({ ...prev, [field]: value }));
  };

  const deleteCompany = async (id: number) => {
    try {
      setIsDeletingCompanyId(id);
      await deleteBranch({ id: id.toString() });
      const comp = companies?.filter((comp) => comp.id !== id);
      setCompanies(comp);
      if (selectedCompany?.id === id) {
        setSelectedCompany(null);
      }
      toast.success("Company deleted successfully", {
        style: {
          background: "#2ecc71",
          color: "#fff",
        },
      });
    } catch (error) {
      toast.error("Error deleting company", {
        style: {
          background: "#de1e1ef0",
          color: "#fff",
        },
      });
    } finally {
      setIsDeletingCompanyId(null);
    }
  };
  const handleLeaveSettingChange = (
    id: number,
    field: string,
    value: string | number
  ) => {
    const updatedSettings = leaveSettings.map((setting) =>
      setting.id === id ? { ...setting, [field]: value } : setting
    );
    setLeaveSettings(updatedSettings);
  };

  const addLeaveSetting = () => {
    // if leave type exist
    const existedLeaveType = leaveSettings.find(
      (setting) => setting.type === newLeaveType
    );
    if (existedLeaveType) {
      toast.error("This leave type is already added", {
        style: {
          background: "#de1e1ef0",
          color: "#fff",
        },
      });
      return;
    }
    if (newLeaveType && newLeaveDays > 0) {
      const newSetting = {
        id:
          leaveSettings.length > 0
            ? Math.max(...leaveSettings.map((l) => l.id)) + 1
            : 1,
        type: newLeaveType,
        days: newLeaveDays,
        companyId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setLeaveSettings([...leaveSettings, newSetting]);
      setNewLeaveType("Personal");
      setNewLeaveDays(0);
    }
  };

  const addingNewWorkingDayWhenUpdating = () => {
    const existedDay = selectedCompany?.workingHours.find(
      (day) => day.day === editWorkingDay
    );
    if (existedDay) {
      toast.error("This day is already added", {
        style: {
          background: "#de1e1ef0",
          color: "#fff",
        },
      });
      return;
    }

    if (editWorkingDay && editNewStartTime && editNewEndTime) {
      const newWorkingHour: WorkingHours = {
        id: selectedCompany?.workingHours?.length
          ? Math.max(...selectedCompany.workingHours.map((day) => day.id)) + 1
          : 1,
        day: editWorkingDay as Days,
        startTime: editNewStartTime,
        endTime: editNewEndTime,
        createdAt: new Date(),
        updatedAt: new Date(),
        companyId: selectedCompany?.id || 1,
      };

      setSelectedCompany((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          workingHours: [...prev.workingHours, newWorkingHour],
        };
      });

      setEditNewWorkingDay("");
      setEditNewStartTime("");
      setEditNewEndTime("");
    }
  };

  const addingNewWorkingDay = () => {
    const existedDay = newCompany.workingHours.find(
      (day) => day.day === newWorkingDay
    );
    if (existedDay) {
      toast.error("This day is already added", {
        style: {
          background: "#de1e1ef0",
          color: "#fff",
        },
      });
      return;
    }

    if (newWorkingDay && newStartTime && newEndTime) {
      const newWorkingHour: WorkingHour = {
        id: Math.max(...newCompany.workingHours.map((day) => day.id)) + 1,
        day: newWorkingDay,
        startTime: newStartTime,
        endTime: newEndTime,
      };
      setNewCompany((prev) => ({
        ...prev,
        workingHours: [...prev.workingHours, newWorkingHour],
      }));
      setNewWorkingDay("");
      setNewStartTime("");
      setNewEndTime("");
    }
  };

  const { mutateAsync: deletingLeaveSetting, isPending: loadingDeleteLeave } =
    useApiDelete(["delete-leave"], "/admin/leave-settings");

  const removeLeaveSetting = async (id: number) => {
    setIsDeletingLeaveSettingId(id.toString());
    await deletingLeaveSetting({ id: id.toString() });
    setLeaveSettings(leaveSettings.filter((setting) => setting.id !== id));
    setIsDeletingLeaveSettingId(null);
  };
  const { mutateAsync: updateCompany, isPending: loadingUpdateCompany } =
    useApiPut(["update-company"], "/admin/company/" + selectedCompany?.id);

  // Save functions

  const saveCompanyChanges = async () => {
    await updateCompany(selectedCompany)
      .then(() => {
        setIsEditingCompany(false);
        toast.success("Company updated successfully", {
          style: {
            background: "#1a6e1a",
            color: "#fff",
          },
        });
      })
      .catch((error) => {
        toast.error(error || "Something went wrong", {
          style: {
            background: "#de1e1ef0",
            color: "#fff",
          },
        });
      });
  };

  const { mutateAsync: createUpdateLeave, isPending: loadingLeave } = useApiPut(
    ["create-update-leave"],
    "/admin/leave-settings/" + selectedLeaveCompanyId
  );

  const saveLeaveSettings = async () => {
    if (!selectedLeaveCompanyId) {
      return;
    }

    await createUpdateLeave(leaveSettings)
      .then(() => {
        setIsEditingLeaveSettings(false);
        toast.success("Leave settings updated successfully", {
          style: {
            background: "#1a6e1a",
            color: "#fff",
          },
        });
      })
      .catch((error) => {
        console.log(error);

        // toast.error(error || "Something went wrong", {
        //   style: {
        //     background: "#de1e1ef0",
        //     color: "#fff",
        //   },
        // });
      });

    // Update with API response
  };

  const { mutateAsync: updateProfile, isPending: loadingProfile } = useApiPut(
    ["edit-profile"],
    "/user/" + userBasicInfo?.id
  );

  const { mutateAsync: updateUserPas, isPending: loadingUserPass } = useApiPut(
    ["edit-profile"],
    "/user/" + userBasicInfo?.id + "/password"
  );

  async function handleEditProfile(values: unknown): Promise<void> {
    if (!profilrFormIk.isValid) {
      toast.error(
        profilrFormIk.errors.email ||
          profilrFormIk.errors.firstName ||
          profilrFormIk.errors.lastName ||
          profilrFormIk.errors.phone ||
          profilrFormIk.errors.gender,
        {
          style: {
            background: "#de1e1ef0",
            color: "#fff",
          },
        }
      );
      return;
    }
    await updateProfile(values)
      .then((response) => {
        toast.success("Profile updated successfully", {
          style: {
            background: "#1a6e1a",
            color: "#fff",
          },
        });
        setIsEditingProfile(false);
      })
      .catch((error) => {
        console.log(error);

        toast.error(error.response.data.message, {
          style: {
            background: "#de1e1ef0",
            color: "#fff",
          },
        });
      });
  }
  const profilrFormIk = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstName: userBasicInfo?.firstName ?? "",
      lastName: userBasicInfo?.lastName ?? "",
      email: userBasicInfo?.email ?? "",
      phone: userBasicInfo?.phone ?? "",
      gender: userBasicInfo?.gender || "Other",
    },
    validationSchema: yup.object({
      firstName: yup.string().required("The first Name Is required here"),
      lastName: yup.string().required("Please Enter The Lastname"),
      email: yup
        .string()
        .email("Please enter valid email")
        .required("Required"),
      phone: yup.string().required("The phone number is Required"),
      gender: yup.string().required("Please select Gender"),
    }),
    onSubmit: handleEditProfile,
  });

  async function handleEditUserPass(values: unknown): Promise<void> {
    if (!passwordFormik.isValid) {
      toast.error(
        passwordFormik.errors.currentPassword ||
          passwordFormik.errors.newPassword ||
          passwordFormik.errors.confirmNewPassword,
        {
          style: {
            background: "#de1e1ef0",
            color: "#fff",
          },
        }
      );
      return; // Just return without value
    }

    await updateUserPas(values)
      .then((response) => {
        toast.success("Password updated successfully", {
          style: {
            background: "#1a6e1a",
            color: "#fff",
          },
        });
        setIsEditingPass(false);
      })
      .catch((error) => {
        toast.error(error.message, {
          style: {
            background: "#de1e1ef0",
            color: "#fff",
          },
        });
      });
  }

  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    validationSchema: yup.object({
      currentPassword: yup
        .string()
        .required("The current password is required"),
      newPassword: yup
        .string()
        .required("The new password is required")
        .min(6, "Password must be at least 6 characters"),
      confirmNewPassword: yup
        .string()
        .required("The confirm password is required")
        .oneOf([yup.ref("newPassword")], "Passwords must match"),
    }),
    onSubmit: handleEditUserPass,
  });

  const { mutateAsync: createNewBranch, isPending: loadingBranch } = useApiPost(
    ["create-company"],
    "/admin/company/"
  );

  const handleCreateNewBranch = async () => {
    if (
      newCompany.name === "" ||
      newCompany.address === "" ||
      newCompany.latitude === 0 ||
      newCompany.longitude === 0
    ) {
      toast.error("Please fill all the fields", {
        style: {
          background: "#de1e1ef0",
          color: "#fff",
        },
      });
      return;
    }

    await createNewBranch(newCompany);
    setIsCreatingCompany(false);
    queryClient.invalidateQueries({ queryKey: ["all-company"] });
    toast.success("Company created successfully", {
      style: {
        background: "#1a6e1a",
        color: "#fff",
      },
    });
  };

  // delete hour

  const { mutateAsync: deleteHour, isPending: loadingHour } = useApiDelete(
    ["delete-hour"],
    "/admin/company/working-hour/"
  );

  // delete branch

  const { mutateAsync: deleteBranch, isPending: loadingDeletingBranch } =
    useApiDelete(["delete-branch"], "/admin/company/");

  const handleDeleteWorkingHour = async (id: string) => {
    try {
      setIsDeletingHourId(parseInt(id));
      await deleteHour({ id: id });
      const hours = selectedCompany?.workingHours.filter(
        (hour) => hour.id !== parseInt(id)
      );
      if (hours && selectedCompany) {
        setSelectedCompany({
          ...selectedCompany,
          workingHours: hours,
        });
      }

      toast.success("Working hour deleted successfully", {
        style: {
          background: "#333",
          color: "#fff",
        },
      });
    } catch (error) {
      toast.error("Error deleting working hour", {
        style: {
          background: "#333",
          color: "#fff",
        },
      });
    } finally {
      setIsDeletingHourId(null);
    }
  };

  const { data: getLeaveSettings, isLoading: loadingLeaveSettings } =
    useApiQuery(
      ["get-leave-settings"],
      "/admin/leave-settings/" + selectedLeaveCompanyId
    );

  useEffect(() => {
    if (getLeaveSettings) {
      setLeaveSettings(getLeaveSettings as CompanyLeaveSetting[]);
    }
  }, [getLeaveSettings]);

  const handleChangeLeaveCompany = async (id: string) => {
    setSelectedLeaveCompanyId(id);
    await api
      .get("/admin/leave-settings/" + id)
      .then((response) => {
        setLeaveSettings(response as CompanyLeaveSetting[]);
      })
      .catch((error) => {
        toast.error(error.message, {
          style: {
            background: "#de1e1ef0",
            color: "#fff",
          },
        });
      });
  };

  const { mutateAsync: generateQrcode, isPending: loadingQrCode } =
    useApiPost<Qr>(["generate-qr-code"], "/admin/qrcode");

  const handleGenerateQrCode = async () => {
    const Data = {
      companyId: selectedCompany?.id,
      type: "EDIT_COMPANY_LOCATION",
    };
    await generateQrcode(Data)
      .then((response) => {
        setQrCodeData(response);
        setIsModalOpen(true);
      })
      .catch(() => {
        toast.error("Error generating QR code", {
          style: {
            background: "#de1e1ef0",
            color: "#fff",
          },
        });
      });
  };


   // In your web page
// After user logs in, register with user ID
useEffect(() => {
  socketService.connect();
  
  // Get the actual user ID from your authentication system
  if(qrCodeData?.value){
    const userId = qrCodeData.value; // Replace with actual user ID
    socketService.emit('register', {
      clientType: 'web',
      userId: userId // Add user ID here
    })
  }
  
  
  // Listen for messages from mobile (targeted to this specific user)
  socketService.on('fromMobile', (data) => {
    // console.log('📱 Received from mobile user:', data.fromUserId);
    setSocketMessage(data.message as SocketStatus);
    console.log('Message:', data.message);
    // Update your UI here - this message is specifically for THIS user
  });

  // Listen for client count updates
  socketService.on('clientCountUpdate', (data) => {
    console.log('👥 Client counts:', data);
  });

  return () => {
    socketService.disconnect();
  };
});

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger
            value="profile"
            className="flex items-center gap-2 cursor-pointer"
          >
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="company"
            className="flex items-center gap-2 cursor-pointer"
          >
            <Building className="h-4 w-4" />
            Company & Branches
          </TabsTrigger>

          <TabsTrigger
            value="leave"
            className="flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="h-4 w-4" />
            Leave Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {loading ? (
            <LoadingSpinner size="md" className="mx-auto" />
          ) : (
            <form
              onSubmit={loadingProfile ? undefined : profilrFormIk.handleSubmit}
              className="space-y-6"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal details
                    </CardDescription>
                  </div>
                  {!isEditingProfile ? (
                    <Button
                      className="cursor-pointer"
                      variant="outline"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                  ) : (
                    <div className="space-x-2">
                      <Button
                        className="cursor-pointer"
                        variant="outline"
                        onClick={() => setIsEditingProfile(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="cursor-pointer"
                        type="submit"
                        disabled={profilrFormIk.isSubmitting}
                        onClick={
                          !profilrFormIk.isValid ? handleEditProfile : () => {}
                        }
                      >
                        {loadingProfile ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Saving{" "}
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" /> Save
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={profilrFormIk.values.firstName}
                        onChange={profilrFormIk.handleChange}
                        disabled={!isEditingProfile}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={profilrFormIk.values.lastName}
                        onChange={profilrFormIk.handleChange}
                        disabled={!isEditingProfile}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profilrFormIk.values.email}
                        onChange={profilrFormIk.handleChange}
                        disabled={!isEditingProfile}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={profilrFormIk.values.phone ?? ""}
                        onChange={profilrFormIk.handleChange}
                        disabled={!isEditingProfile}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={"Other"}
                      onValueChange={(value) =>
                        profilrFormIk.setFieldValue("gender", value)
                      }
                      disabled={!isEditingProfile}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {profilrFormIk.values.gender || "Select gender"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex items-center">
                      <Badge
                        variant={
                          userBasicInfo?.status === "Active"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {userBasicInfo?.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          )}

          <form
            onSubmit={loadingUserPass ? undefined : passwordFormik.handleSubmit}
            className="space-y-6"
            id="passwordForm"
          >
            <input
              type="text"
              name="email"
              autoComplete="email"
              value={userBasicInfo?.email ?? ""} // Pass your user's email/username here
              readOnly
              style={{ display: "none" }}
              aria-hidden="true"
            />
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Security Change</CardTitle>
                  <CardDescription>
                    Update your credentials to keep your account secure.
                  </CardDescription>
                </div>
                {!isEditingPass ? (
                  <Button
                    className="cursor-pointer"
                    variant="outline"
                    onClick={() => setIsEditingPass(true)}
                  >
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                ) : (
                  <div className="space-x-2">
                    <Button
                      className="cursor-pointer"
                      variant="outline"
                      onClick={() => setIsEditingPass(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="cursor-pointer"
                      type="submit"
                      disabled={passwordFormik.isSubmitting}
                      onClick={
                        !passwordFormik.isValid ? handleEditUserPass : () => {}
                      }
                    >
                      {loadingUserPass ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Saving{" "}
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" /> Save
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Current Password</Label>
                    <Input
                      type="password"
                      id="current-password"
                      name="currentPassword"
                      value={passwordFormik.values.currentPassword}
                      onChange={passwordFormik.handleChange}
                      disabled={!isEditingPass}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">New Password</Label>
                    <Input
                      type="password"
                      id="new-password"
                      name="newPassword"
                      value={passwordFormik.values.newPassword}
                      onChange={passwordFormik.handleChange}
                      disabled={!isEditingPass}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Confirm Password">Confirm Password</Label>
                    <Input
                      type="password"
                      id="confirm-Password"
                      name="confirmNewPassword"
                      value={passwordFormik.values.confirmNewPassword ?? ""}
                      onChange={passwordFormik.handleChange}
                      disabled={!isEditingPass}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Details about your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="p-2 border rounded-md bg-muted">
                    <Badge variant="outline">{userBasicInfo?.role}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Member Since</Label>
                  <div className="p-2 border rounded-md bg-muted">
                    {new Date(
                      userBasicInfo?.createdAt ?? ""
                    ).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          {/* Company Selection Card */}
          <Card>
            <CardHeader>
              <CardTitle>Company & Branches</CardTitle>
              <CardDescription>
                Select a company or branch to manage its settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Company/Branch</Label>
                  <Select
                    value={selectedCompanyId ?? ""}
                    onValueChange={(value) => {
                      setSelectedCompanyId(value as string);
                      const company = companies?.find(
                        (c) => c.id === parseInt(value as string)
                      );
                      if (company) {
                        setSelectedCompany(company);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies?.map((company) => (
                        <SelectItem
                          key={company.id}
                          value={company.id.toString()}
                        >
                          {company.name} {company.type === "Main" && "(Main)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => setIsCreatingCompany(true)}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add New Branch
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {isCreatingCompany ? (
            /* New Company Form */
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Create New Branch</CardTitle>
                  <CardDescription>
                    Add a new branch to your company
                  </CardDescription>
                </div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingCompany(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={loadingBranch ? undefined : handleCreateNewBranch}
                    disabled={loadingBranch}
                    className="disabled:opacity-50"
                  >
                    {loadingBranch ? (
                      <>
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                        creating
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> Create Branch
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newCompanyName">Branch Name</Label>
                  <Input
                    id="newCompanyName"
                    value={newCompany.name}
                    onChange={(e) =>
                      handleNewCompanyChange("name", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newCompanyAddress">Address</Label>
                  <Input
                    id="newCompanyAddress"
                    value={newCompany.address}
                    onChange={(e) =>
                      handleNewCompanyChange("address", e.target.value)
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newCompanyLatitude">Latitude</Label>
                    <Input
                      id="newCompanyLatitude"
                      type="number"
                      value={newCompany.latitude}
                      onChange={(e) =>
                        handleNewCompanyChange("latitude", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newCompanyLongitude">Longitude</Label>
                    <Input
                      id="newCompanyLongitude"
                      type="number"
                      value={newCompany.longitude}
                      onChange={(e) =>
                        handleNewCompanyChange("longitude", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newCompanyRadius">Radius (meters)</Label>
                    <Input
                      id="newCompanyRadius"
                      type="number"
                      value={newCompany.radius}
                      onChange={(e) =>
                        handleNewCompanyChange("radius", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Working Hours</Label>
                  {newCompany.workingHours.map((day, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-2"
                    >
                      <div className="space-y-2">
                        <Label>Day</Label>
                        <div className="p-2 border rounded-md bg-muted">
                          {day.day}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => {
                            const updatedHours = [...newCompany.workingHours];
                            updatedHours[index] = {
                              ...updatedHours[index],
                              startTime: e.target.value,
                            };
                            setNewCompany({
                              ...newCompany,
                              workingHours: updatedHours,
                            });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => {
                            const updatedHours = [...newCompany.workingHours];
                            updatedHours[index] = {
                              ...updatedHours[index],
                              endTime: e.target.value,
                            };
                            setNewCompany({
                              ...newCompany,
                              workingHours: updatedHours,
                            });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 mt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">
                    Add New Working Hour
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Day</Label>
                      <Select
                        value={newWorkingDay}
                        onValueChange={(value) => {
                          setNewWorkingDay(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monday">Monday</SelectItem>
                          <SelectItem value="Tuesday">Tuesday</SelectItem>
                          <SelectItem value="Wednesday">Wednesday</SelectItem>
                          <SelectItem value="Thursday">Thursday</SelectItem>
                          <SelectItem value="Friday">Friday</SelectItem>
                          <SelectItem value="Saturday">Saturday</SelectItem>
                          <SelectItem value="Sunday">Sunday</SelectItem>
                          <SelectItem value="Other">Other Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        // disabled={!isEditingCompany}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                        // disabled={!isEditingCompany}
                      />
                    </div>
                    <Button onClick={addingNewWorkingDay}>
                      <Plus className="mr-2 h-4 w-4" /> Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Existing Company Edit Form */
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>
                      {selectedCompany?.name}
                      {selectedCompany?.type === "Main" && (
                        <Badge className="ml-2">Main Company</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {selectedCompany?.address}
                    </CardDescription>
                  </div>
                  {!isEditingCompany ? (
                    <div className="space-x-2">
                      {selectedCompany?.type !== "Main" && (
                        <Button
                          disabled={
                            isDeletingCompanyId === selectedCompany?.id &&
                            loadingDeletingBranch
                          }
                          variant="destructive"
                          onClick={async () =>
                            await deleteCompany(selectedCompany?.id as number)
                          }
                        >
                          {isDeletingCompanyId === selectedCompany?.id &&
                          loadingDeletingBranch ? (
                            <>
                              <LoadingSpinner size="sm" /> Delete
                            </>
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingCompany(true)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Button>
                    </div>
                  ) : (
                    <div className="space-x-2">
                      <Button
                        disabled={loadingUpdateCompany}
                        variant="outline"
                        onClick={() => setIsEditingCompany(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={
                          loadingUpdateCompany ? undefined : saveCompanyChanges
                        }
                      >
                        {loadingUpdateCompany ? (
                          <>
                            <LoadingSpinner size="sm" /> Save
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" /> Save
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={selectedCompany?.name}
                      onChange={(e) =>
                        handleCompanyChange("name", e.target.value)
                      }
                      disabled={
                        !isEditingCompany || selectedCompany?.type === "Main"
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Address</Label>
                    <Input
                      id="companyAddress"
                      value={selectedCompany?.address || ""}
                      onChange={(e) =>
                        handleCompanyChange("address", e.target.value)
                      }
                      disabled={!isEditingCompany}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        value={selectedCompany?.latitude || ""}
                        onChange={(e) =>
                          handleCompanyChange("latitude", e.target.value)
                        }
                        disabled={!isEditingCompany}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        value={selectedCompany?.longitude || ""}
                        onChange={(e) =>
                          handleCompanyChange("longitude", e.target.value)
                        }
                        disabled={!isEditingCompany}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="radius">Radius (meters)</Label>
                      <Input
                        id="radius"
                        type="number"
                        value={selectedCompany?.radius || ""}
                        onChange={(e) =>
                          handleCompanyChange("radius", e.target.value)
                        }
                        disabled={!isEditingCompany}
                      />
                    </div>
                  </div>
                  {isEditingCompany && (
                    <div className="justify-right text-right mr-auto">
                      <Button
                        size={"sm"}
                        variant={"default"}
                        onClick={
                          loadingQrCode ? undefined : handleGenerateQrCode
                        }
                        disabled={loadingQrCode}
                      >
                        {loadingQrCode ? (
                          <>
                            <LoadingSpinner size="sm" /> Generating QR Code
                          </>
                        ) : (
                          <>
                            <QrCode className="mr-2 h-4 w-4" /> Scan for
                            Location{" "}
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="companyType">Company Type</Label>
                    <Select
                      value={selectedCompany?.type}
                      onValueChange={(value) =>
                        handleCompanyChange("type", value)
                      }
                      disabled={
                        !isEditingCompany || selectedCompany?.type === "Main"
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Main">Main</SelectItem>
                        <SelectItem value="Branch">Branch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Working Hours</CardTitle>
                  <CardDescription>
                    Set your company&apos;s working hours
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedCompany?.workingHours.map((day, index) => (
                    <div
                      key={day.id}
                      className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
                    >
                      <div className="space-y-2">
                        <Label>Day</Label>
                        <div className="p-2 border rounded-md bg-muted">
                          {day.day}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => {
                            const hours = selectedCompany.workingHours.map(
                              (start) => {
                                if (start.day === day.day) {
                                  return {
                                    ...start,
                                    startTime: e.target.value,
                                  };
                                }
                                return start;
                              }
                            );

                            setSelectedCompany({
                              ...selectedCompany,
                              workingHours: hours,
                            });
                          }}
                          disabled={!isEditingCompany}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => {
                            const hours = selectedCompany.workingHours.map(
                              (end) => {
                                if (end.day === day.day) {
                                  return {
                                    ...end,
                                    endTime: e.target.value,
                                  };
                                }
                                return end;
                              }
                            );
                            setSelectedCompany({
                              ...selectedCompany,
                              workingHours: hours,
                            });
                          }}
                          disabled={!isEditingCompany}
                        />
                      </div>
                      <div className="space-y-2">
                        {isEditingCompany && (
                          <Button
                            disabled={
                              isDeletingHourId === day.id && loadingHour
                            }
                            variant="destructive"
                            size="sm"
                            className="cursor-pointer"
                            onClick={async () =>
                              handleDeleteWorkingHour(day.id.toString())
                            }
                          >
                            {isDeletingHourId === day.id && loadingHour ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {isEditingCompany && (
                    <div className="pt-4 mt-4 border-t">
                      <h3 className="text-lg font-medium mb-4">
                        Add New Working Hour
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                          <Label>Day</Label>
                          <Select
                            value={editWorkingDay}
                            onValueChange={(value) => {
                              setEditNewWorkingDay(value);
                            }}
                            disabled={!isEditingCompany}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select leave type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Monday">Monday</SelectItem>
                              <SelectItem value="Tuesday">Tuesday</SelectItem>
                              <SelectItem value="Wednesday">
                                Wednesday
                              </SelectItem>
                              <SelectItem value="Thursday">Thursday</SelectItem>
                              <SelectItem value="Friday">Friday</SelectItem>
                              <SelectItem value="Saturday">Saturday</SelectItem>
                              <SelectItem value="Sunday">Sunday</SelectItem>
                              <SelectItem value="Other">Other Leave</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Start Time</Label>
                          <Input
                            type="time"
                            value={editNewStartTime}
                            onChange={(e) =>
                              setEditNewStartTime(e.target.value)
                            }
                            disabled={!isEditingCompany}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Time</Label>
                          <Input
                            type="time"
                            value={editNewEndTime}
                            onChange={(e) => setEditNewEndTime(e.target.value)}
                            disabled={!isEditingCompany}
                          />
                        </div>
                        {isEditingCompany && (
                          <Button onClick={addingNewWorkingDayWhenUpdating}>
                            <Plus className="mr-2 h-4 w-4" /> Add
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Branches List */}
              {companies &&
                companies?.filter((c) => c.type === "Branch").length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>All Branches</CardTitle>
                      <CardDescription>
                        List of all your company branches
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Coordinates</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {companies
                            ?.filter((c) => c.type === "Branch")
                            .map((company) => (
                              <TableRow key={company.id}>
                                <TableCell className="font-medium">
                                  {company.name}
                                </TableCell>
                                <TableCell>{company.address}</TableCell>
                                <TableCell>
                                  {company.latitude && company.longitude ? (
                                    <span className="flex items-center">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {company.latitude.toFixed(4)},{" "}
                                      {company.longitude.toFixed(4)}
                                    </span>
                                  ) : (
                                    "Not set"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setSelectedCompany(company)
                                      }
                                    >
                                      <Navigation className="h-3 w-3 mr-1" />{" "}
                                      View
                                    </Button>
                                    <Button
                                      disabled={
                                        loadingDeletingBranch &&
                                        isDeletingCompanyId === company.id
                                      }
                                      variant="destructive"
                                      size="sm"
                                      onClick={async () =>
                                        await deleteCompany(company.id)
                                      }
                                    >
                                      {loadingDeletingBranch &&
                                      isDeletingCompanyId === company.id ? (
                                        <>
                                          <LoadingSpinner size="sm" />
                                        </>
                                      ) : (
                                        <>
                                          <Trash2 className="h-3 w-3" />
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
            </>
          )}
        </TabsContent>

        <TabsContent value="leave" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave & Management</CardTitle>
              <CardDescription>
                Select a company or branch to manage Leave settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Company/Branch</Label>
                  <Select
                    name="company-id"
                    value={selectedLeaveCompanyId ?? ""}
                    onValueChange={handleChangeLeaveCompany}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies?.map((company) => (
                        <SelectItem
                          key={company.id}
                          value={company.id.toString()}
                        >
                          {company.name} {company.type === "Main" && "(Main)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Leave Settings</CardTitle>
                <CardDescription>
                  Configure company leave policies
                </CardDescription>
              </div>
              {!isEditingLeaveSettings ? (
                <Button
                  variant="outline"
                  onClick={() => setIsEditingLeaveSettings(true)}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
              ) : (
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingLeaveSettings(false)}
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </Button>
                  <Button onClick={saveLeaveSettings} disabled={loadingLeave}>
                    {loadingLeave ? (
                      <>
                        <LoadingSpinner size="sm" /> Saving
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> Save
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {leaveSettings.map((setting) => (
                <div
                  key={setting.id}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
                >
                  <div className="space-y-2">
                    <Label>Leave Type</Label>
                    <Select
                      value={setting.type}
                      onValueChange={(value) =>
                        handleLeaveSettingChange(setting.id, "type", value)
                      }
                      disabled={!isEditingLeaveSettings}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sick">Sick Leave</SelectItem>
                        <SelectItem value="Annual">Annual Leave</SelectItem>
                        <SelectItem value="Maternity">
                          Maternity Leave
                        </SelectItem>
                        <SelectItem value="Paternity">
                          Paternity Leave
                        </SelectItem>
                        <SelectItem value="Vacation">Vacation Leave</SelectItem>
                        <SelectItem value="Personal">Personal Leave</SelectItem>
                        <SelectItem value="Other">Other Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Days Allocated</Label>
                    <Input
                      type="number"
                      value={setting.days}
                      onChange={(e) =>
                        handleLeaveSettingChange(
                          setting.id,
                          "days",
                          parseInt(e.target.value)
                        )
                      }
                      disabled={!isEditingLeaveSettings}
                    />
                  </div>
                  {isEditingLeaveSettings && (
                    <Button
                      disabled={
                        loadingDeleteLeave &&
                        isDeletingLeaveSettingId === setting.id.toString()
                      }
                      variant="outline"
                      onClick={() => removeLeaveSetting(setting.id)}
                      className="h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingDeleteLeave &&
                      isDeletingLeaveSettingId === setting.id.toString() ? (
                        <>
                          <LoadingSpinner size="sm" />
                        </>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}

              {isEditingLeaveSettings && (
                <div className="pt-4 mt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">
                    Add New Leave Type
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Leave Type</Label>
                      <Select
                        value={newLeaveType}
                        onValueChange={(value) => {
                          setNewLeaveType(value as LeaveType);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sick">Sick Leave</SelectItem>
                          <SelectItem value="Annual">Annual Leave</SelectItem>
                          <SelectItem value="Maternity">
                            Maternity Leave
                          </SelectItem>
                          <SelectItem value="Paternity">
                            Paternity Leave
                          </SelectItem>
                          <SelectItem value="Vacation">
                            Vacation Leave
                          </SelectItem>
                          <SelectItem value="Personal">
                            Personal Leave
                          </SelectItem>
                          <SelectItem value="Other">Other Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Days Allocated</Label>
                      <Input
                        type="number"
                        value={newLeaveDays}
                        onChange={(e) =>
                          setNewLeaveDays(parseInt(e.target.value))
                        }
                      />
                    </div>
                    <Button onClick={addLeaveSetting}>
                      <Plus className="mr-2 h-4 w-4" /> Add
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {selectedCompany && !loadingQrCode && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Scan QrCode To Create Or modify Company Settings"
        >
          {
            socketMessage === "START_COORDINATE_CAPTURE" ? 
            <div className="justify-center items-center m-auto">
              <LoadingSpinner size="lg" className="mx-auto"/>
              <p className="text-center">Waiting capturing Coordinates</p>
            </div> 
            : socketMessage === "COMPLETE_COORDINATE" ? 
            <div className="justify-center items-center m-auto">
              {/* use tick icon to show complete */}
              <Check className="text-green-500 text-4xl m-auto" />
              <p className="text-center"> Coordinates successfull captured.</p>
            </div> 
            : socketMessage === "QR_EXPIRED" ? 
            <div className="justify-center items-center m-auto ">
              <X className="text-red-500 text-4xl m-auto" />
              <p className="text-center">QR Code Expired, Generate New</p>
            </div> :<LocationQrCodeClient data={qrCodeData} />
          }
          
        </Modal>
      )}
    </div>
  );
}
