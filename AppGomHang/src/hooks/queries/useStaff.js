import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getStaffListAPI,
    createStaffAPI,
    updateStaffAPI,
    deleteStaffAPI
} from '../../api/staff';

// QUERY KEYS
export const STAFF_KEYS = {
    all: ['staff'],
    lists: () => [...STAFF_KEYS.all, 'list'],
};

/**
 * Hook to fetch the list of staff
 */
export const useStaffList = (options = {}) => {
    return useQuery({
        queryKey: STAFF_KEYS.lists(),
        queryFn: () => getStaffListAPI(),
        ...options,
    });
};

/**
 * Hook to create a new staff member
 */
export const useCreateStaff = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (staffData) => createStaffAPI(staffData),
        onSuccess: () => {
            // Invalidate staff lists to refetch
            queryClient.invalidateQueries({ queryKey: STAFF_KEYS.lists() });
        },
    });
};

/**
 * Hook to update an existing staff member
 */
export const useUpdateStaff = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ staffId, staffData }) => updateStaffAPI(staffId, staffData),
        onSuccess: () => {
            // Invalidate staff lists
            queryClient.invalidateQueries({ queryKey: STAFF_KEYS.lists() });
        },
    });
};

/**
 * Hook to delete a staff member
 */
export const useDeleteStaff = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (staffId) => deleteStaffAPI(staffId),
        onSuccess: () => {
            // Invalidate staff lists
            queryClient.invalidateQueries({ queryKey: STAFF_KEYS.lists() });
        },
    });
};
