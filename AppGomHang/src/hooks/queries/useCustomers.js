import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getCustomersListAPI,
    getCustomerByIdAPI,
    createCustomerAPI,
    updateCustomerAPI,
    deleteCustomerAPI,
    searchCustomersAPI
} from '../../api/customers';

// QUERY KEYS
export const CUSTOMER_KEYS = {
    all: ['customers'],
    lists: () => [...CUSTOMER_KEYS.all, 'list'],
    list: (filters) => [...CUSTOMER_KEYS.lists(), { filters }],
    details: () => [...CUSTOMER_KEYS.all, 'detail'],
    detail: (id) => [...CUSTOMER_KEYS.details(), id],
    searches: () => [...CUSTOMER_KEYS.all, 'search'],
    search: (query) => [...CUSTOMER_KEYS.searches(), { query }]
};

/**
 * Hook to fetch the list of customers
 */
export const useCustomersList = (search = '', phone = '', options = {}) => {
    return useQuery({
        queryKey: CUSTOMER_KEYS.list({ search, phone }),
        queryFn: () => getCustomersListAPI(search, phone),
        ...options,
    });
};

/**
 * Hook to fetch a single customer by ID
 */
export const useCustomerById = (id, options = {}) => {
    return useQuery({
        queryKey: CUSTOMER_KEYS.detail(id),
        queryFn: () => getCustomerByIdAPI(id),
        enabled: !!id,
        ...options,
    });
};

/**
 * Hook to search customers
 */
export const useSearchCustomers = (query, options = {}) => {
    return useQuery({
        queryKey: CUSTOMER_KEYS.search(query),
        queryFn: () => searchCustomersAPI(query),
        enabled: !!query,
        ...options,
    });
};

/**
 * Hook to create a new customer
 */
export const useCreateCustomer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (customerData) => createCustomerAPI(customerData),
        onSuccess: () => {
            // Invalidate all customer lists to refetch
            queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
        },
    });
};

/**
 * Hook to update an existing customer
 */
export const useUpdateCustomer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ customerId, customerData }) => updateCustomerAPI(customerId, customerData),
        onSuccess: (data, variables) => {
            // Invalidate specific customer detail and all lists
            queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.detail(variables.customerId) });
            queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
        },
    });
};

/**
 * Hook to delete a customer
 */
export const useDeleteCustomer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (customerId) => deleteCustomerAPI(customerId),
        onSuccess: (data, variables) => {
            // Remove the deleted customer from cache and invalidate lists
            queryClient.removeQueries({ queryKey: CUSTOMER_KEYS.detail(variables) });
            queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
        },
    });
};
