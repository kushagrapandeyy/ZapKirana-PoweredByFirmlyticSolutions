import { PrismaService } from '../prisma.service';
export declare class AddressesService {
    private prisma;
    constructor(prisma: PrismaService);
    createAddress(data: any): Promise<{
        id: string;
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
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    getUserAddresses(userId: string): Promise<{
        id: string;
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
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }[]>;
    updateAddress(id: string, data: any): Promise<{
        id: string;
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
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    deleteAddress(id: string): Promise<{
        id: string;
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
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
}
