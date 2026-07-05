import { PrismaService } from '../prisma.service';
export declare class AddressesService {
    private prisma;
    constructor(prisma: PrismaService);
    createAddress(data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        latitude: number;
        longitude: number;
        userId: string;
        address: string;
        label: string;
        streetAddress: string | null;
        landmark: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        isDefault: boolean;
    }>;
    getUserAddresses(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        latitude: number;
        longitude: number;
        userId: string;
        address: string;
        label: string;
        streetAddress: string | null;
        landmark: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        isDefault: boolean;
    }[]>;
    updateAddress(id: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        latitude: number;
        longitude: number;
        userId: string;
        address: string;
        label: string;
        streetAddress: string | null;
        landmark: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        isDefault: boolean;
    }>;
    deleteAddress(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        latitude: number;
        longitude: number;
        userId: string;
        address: string;
        label: string;
        streetAddress: string | null;
        landmark: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        isDefault: boolean;
    }>;
}
