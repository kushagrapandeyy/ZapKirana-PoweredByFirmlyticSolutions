import { AddressesService } from './addresses.service';
export declare class AddressesController {
    private readonly addressesService;
    constructor(addressesService: AddressesService);
    create(body: any): Promise<{
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
    getAll(userId: string): never[] | Promise<{
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
    update(id: string, body: any): Promise<{
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
    delete(id: string): Promise<{
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
