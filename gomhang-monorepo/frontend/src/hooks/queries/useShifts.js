import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as shiftsApi from '../../api/shifts';

export const shiftKeys = {
    all: ['shifts'],
    lists: () => [...shiftKeys.all, 'list'],
    list: (filters) => [...shiftKeys.lists(), { filters }],
    details: () => [...shiftKeys.all, 'detail'],
    detail: (id) => [...shiftKeys.details(), id],
    current: () => [...shiftKeys.all, 'current'],
    moneyAdditions: (id) => [...shiftKeys.detail(id), 'moneyAdditions'],
};

export const useShiftsList = (params) => {
    return useQuery({
        queryKey: shiftKeys.list(params),
        queryFn: () => shiftsApi.getShiftsListAPI(params),
    });
};

export const useShiftById = (id) => {
    return useQuery({
        queryKey: shiftKeys.detail(id),
        queryFn: () => shiftsApi.getShiftByIdAPI(id),
        enabled: !!id,
    });
};

export const useCurrentShift = () => {
    return useQuery({
        queryKey: shiftKeys.current(),
        queryFn: shiftsApi.getCurrentShiftAPI,
    });
};

export const useCreateShift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: shiftsApi.createShiftAPI,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: shiftKeys.all });
        },
    });
};

export const useAutoStartShift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: shiftsApi.autoStartShiftAPI,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: shiftKeys.current() });
            queryClient.invalidateQueries({ queryKey: shiftKeys.lists() });
        },
    });
};

export const useStartShift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: shiftsApi.startShiftAPI,
        onSuccess: (data, shiftId) => {
            queryClient.invalidateQueries({ queryKey: shiftKeys.detail(shiftId) });
            queryClient.invalidateQueries({ queryKey: shiftKeys.current() });
            queryClient.invalidateQueries({ queryKey: shiftKeys.lists() });
        },
    });
};

export const useEndShift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: shiftsApi.endShiftAPI,
        onSuccess: (data, shiftId) => {
            queryClient.invalidateQueries({ queryKey: shiftKeys.detail(shiftId) });
            queryClient.invalidateQueries({ queryKey: shiftKeys.current() });
            queryClient.invalidateQueries({ queryKey: shiftKeys.lists() });
        },
    });
};

export const useUpdateShiftMoney = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ shiftId, tienGiaoCa }) => shiftsApi.updateShiftMoneyAPI(shiftId, tienGiaoCa),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: shiftKeys.detail(variables.shiftId) });
            queryClient.invalidateQueries({ queryKey: shiftKeys.current() });
        },
    });
};

export const useAddMoneyToShift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ shiftId, amount, note }) => shiftsApi.addMoneyToShiftAPI(shiftId, amount, note),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: shiftKeys.detail(variables.shiftId) });
            queryClient.invalidateQueries({ queryKey: shiftKeys.moneyAdditions(variables.shiftId) });
        },
    });
};

export const useShiftMoneyAdditions = (shiftId) => {
    return useQuery({
        queryKey: shiftKeys.moneyAdditions(shiftId),
        enabled: !!shiftId,
        queryFn: () => shiftsApi.getShiftMoneyAdditionsAPI(shiftId),
    });
};

export const useUpdateShiftMoneyAddition = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ shiftId, additionId, data }) => shiftsApi.updateShiftMoneyAdditionAPI(shiftId, additionId, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: shiftKeys.detail(variables.shiftId) });
            queryClient.invalidateQueries({ queryKey: shiftKeys.moneyAdditions(variables.shiftId) });
        },
    });
};

export const useDeleteShiftMoneyAddition = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ shiftId, additionId }) => shiftsApi.deleteShiftMoneyAdditionAPI(shiftId, additionId),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: shiftKeys.detail(variables.shiftId) });
            queryClient.invalidateQueries({ queryKey: shiftKeys.moneyAdditions(variables.shiftId) });
        },
    });
};
