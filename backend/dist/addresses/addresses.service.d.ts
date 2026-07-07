import { PrismaService } from '../prisma.service';
export declare class AddressesService {
    private prisma;
    constructor(prisma: PrismaService);
    createAddress(data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        label: string;
        streetAddress: string | null;
        landmark: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        address: string;
        latitude: number;
        longitude: number;
        isDefault: boolean;
    }>;
    getUserAddresses(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        label: string;
        streetAddress: string | null;
        landmark: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        address: string;
        latitude: number;
        longitude: number;
        isDefault: boolean;
    }[]>;
    updateAddress(id: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        label: string;
        streetAddress: string | null;
        landmark: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        address: string;
        latitude: number;
        longitude: number;
        isDefault: boolean;
    }>;
    deleteAddress(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        label: string;
        streetAddress: string | null;
        landmark: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        address: string;
        latitude: number;
        longitude: number;
        isDefault: boolean;
    }>;
}
