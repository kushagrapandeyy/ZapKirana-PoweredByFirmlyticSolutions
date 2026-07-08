import { PrismaService } from '../prisma.service';
export declare class AddressesService {
    private prisma;
    constructor(prisma: PrismaService);
    createAddress(data: any): Promise<{
        id: string;
        latitude: number;
        longitude: number;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        address: string;
        city: string | null;
        state: string | null;
        pincode: string | null;
        label: string;
        streetAddress: string | null;
        landmark: string | null;
        isDefault: boolean;
    }>;
    getUserAddresses(userId: string): Promise<{
        id: string;
        latitude: number;
        longitude: number;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        address: string;
        city: string | null;
        state: string | null;
        pincode: string | null;
        label: string;
        streetAddress: string | null;
        landmark: string | null;
        isDefault: boolean;
    }[]>;
    updateAddress(id: string, data: any): Promise<{
        id: string;
        latitude: number;
        longitude: number;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        address: string;
        city: string | null;
        state: string | null;
        pincode: string | null;
        label: string;
        streetAddress: string | null;
        landmark: string | null;
        isDefault: boolean;
    }>;
    deleteAddress(id: string): Promise<{
        id: string;
        latitude: number;
        longitude: number;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        address: string;
        city: string | null;
        state: string | null;
        pincode: string | null;
        label: string;
        streetAddress: string | null;
        landmark: string | null;
        isDefault: boolean;
    }>;
}
