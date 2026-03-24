import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getCountersListAPI,
    getCounterByIdAPI,
    createCounterAPI,
    updateCounterAPI,
    deleteCounterAPI
} from '../../api/counters';

// QUERY KEYS
export const COUNTER_KEYS = {
    all: ['counters'],
    lists: () => [...COUNTER_KEYS.all, 'list'],
    list: (filters) => [...COUNTER_KEYS.lists(), { filters }],
    details: () => [...COUNTER_KEYS.all, 'detail'],
    detail: (id) => [...COUNTER_KEYS.details(), id],
};

/**
 * Hook to fetch the list of counters
 */
export const useCountersList = (activeOnly = true, options = {}) => {
    return useQuery({
        queryKey: COUNTER_KEYS.list({ activeOnly }),
        queryFn: () => getCountersListAPI(activeOnly),
        ...options,
    });
};

/**
 * Hook to fetch a single counter by ID
 */
export const useCounterById = (id, options = {}) => {
    return useQuery({
        queryKey: COUNTER_KEYS.detail(id),
        queryFn: () => getCounterByIdAPI(id),
        enabled: !!id,
        ...options,
    });
};

/**
 * Hook to create a new counter
 */
export const useCreateCounter = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (counterData) => createCounterAPI(counterData),
        onSuccess: () => {
            // Invalidate all counter lists to refetch
            queryClient.invalidateQueries({ queryKey: COUNTER_KEYS.lists() });
        },
    });
};

/**
 * Hook to update an existing counter
 */
export const useUpdateCounter = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ counterId, counterData }) => updateCounterAPI(counterId, counterData),
        onSuccess: (data, variables) => {
            // Invalidate specific counter detail and all lists
            queryClient.invalidateQueries({ queryKey: COUNTER_KEYS.detail(variables.counterId) });
            queryClient.invalidateQueries({ queryKey: COUNTER_KEYS.lists() });
        },
    });
};

/**
 * Hook to delete/disable a counter
 */
export const useDeleteCounter = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (counterId) => deleteCounterAPI(counterId),
        onSuccess: (data, variables) => {
            // Remove the deleted counter from cache and invalidate lists
            queryClient.removeQueries({ queryKey: COUNTER_KEYS.detail(variables) });
            queryClient.invalidateQueries({ queryKey: COUNTER_KEYS.lists() });
        },
    });
};
