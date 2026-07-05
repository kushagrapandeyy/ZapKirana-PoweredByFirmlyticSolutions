import { AddressesService } from './addresses.service';
export declare class AddressesController {
    private readonly addressesService;
    constructor(addressesService: AddressesService);
    create(body: any): Promise<{
        id: string;
        latitude: number;
        longitude: number;
        createdAt: Date;
        updatedAt: Date;
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
    getAll(userId: string): never[] | Promise<{
        id: string;
        latitude: number;
        longitude: number;
        createdAt: Date;
        updatedAt: Date;
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
    update(id: string, body: any): Promise<{
        id: string;
        latitude: number;
        longitude: number;
        createdAt: Date;
        updatedAt: Date;
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
    delete(id: string): Promise<{
        id: string;
        latitude: number;
        longitude: number;
        createdAt: Date;
        updatedAt: Date;
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
