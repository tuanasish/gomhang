import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ordersApi from '../../api/orders';

// Centralize query keys for consistent invalidation
export const orderKeys = {
    all: ['orders'],
    lists: () => [...orderKeys.all, 'list'],
    list: (filters) => [...orderKeys.lists(), { filters }],
    details: () => [...orderKeys.all, 'detail'],
    detail: (id) => [...orderKeys.details(), id],
    byShift: (shiftId) => [...orderKeys.all, 'shift', shiftId],
    byDate: (date) => [...orderKeys.all, 'date', date],
};

export const useOrdersList = (params) => {
    return useQuery({
        queryKey: orderKeys.list(params),
        queryFn: () => ordersApi.getOrdersListAPI(params),
    });
};

export const useOrderById = (id) => {
    return useQuery({
        queryKey: orderKeys.detail(id),
        queryFn: () => ordersApi.getOrderByIdAPI(id),
        enabled: !!id, // Only fetch if ID exists
    });
};

export const useOrdersByShift = (shiftId) => {
    return useQuery({
        queryKey: orderKeys.byShift(shiftId),
        queryFn: () => ordersApi.getOrdersByShiftAPI(shiftId),
        enabled: !!shiftId,
    });
};

export const useOrdersByDate = (date) => {
    return useQuery({
        queryKey: orderKeys.byDate(date),
        queryFn: () => ordersApi.getOrdersByDateAPI(date),
        enabled: !!date,
    });
};

export const useCreateOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ordersApi.createOrderAPI,
        onSuccess: (data) => {
            // Invalidate all orders to reflect the newly created one
            queryClient.invalidateQueries({ queryKey: orderKeys.all });
        },
    });
};

export const useUpdateOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orderId, orderData }) => ordersApi.updateOrderAPI(orderId, orderData),
        onSuccess: (data, variables) => {
            // Update specific detail and lists
            queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
            queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
            if (data?.data?.shift) {
                queryClient.invalidateQueries({ queryKey: orderKeys.byShift(data.data.shift) });
            }
        },
    });
};

export const useDeleteOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ordersApi.deleteOrderAPI,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: orderKeys.all });
        },
    });
};
