/* eslint-disable @typescript-eslint/no-unused-vars */
interface UserAuthPayload {
    id: number;
    role: Role; 
    names: string;
    email: string;
}

type Role = 'Admin' | 'Company' | 'Worker';

interface BasicUserInfo {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
    phone: string;
}