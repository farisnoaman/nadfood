/**
 * Subscription service - handles subscription plans and requests
 */

import { supabase } from '../../../utils/supabaseClient';
import { SubscriptionPlan, SubscriptionRequest } from '../../../types';
import logger from '../../../utils/logger';

export const subscriptionService = {
    /**
     * Fetch all available subscription plans
     */
    async fetchPlans(): Promise<SubscriptionPlan[]> {
        const { data, error } = await (supabase as any)
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('monthly_price', { ascending: true });

        if (error) {
            logger.error('Error fetching subscription plans:', error);
            throw error;
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            name: row.name,
            description: row.description,
            maxUsers: row.max_users,
            maxProducts: row.max_products,
            maxDrivers: row.max_drivers,
            maxStorageMb: row.max_storage_mb,
            monthlyPrice: row.monthly_price,
            isActive: row.is_active,
            createdAt: row.created_at,
        }));
    },

    /**
     * Create a subscription request (Company Admin)
     */
    async createRequest(
        companyId: string,
        planId: string,
        paymentReference: string,
        requestType: 'renewal' | 'upgrade' = 'renewal'
    ): Promise<void> {
        const { error } = await (supabase as any)
            .from('subscription_requests')
            .insert({
                company_id: companyId,
                requested_plan_id: planId,
                payment_reference: paymentReference,
                request_type: requestType,
                status: 'pending',
            });

        if (error) {
            logger.error('Error creating subscription request:', error);
            throw error;
        }
    },

    /**
     * Fetch subscription requests for a company (Company Admin)
     */
    async fetchRequestsByCompany(companyId: string): Promise<SubscriptionRequest[]> {
        const { data, error } = await (supabase as any)
            .from('subscription_requests')
            .select(`
        *,
        subscription_plans!requested_plan_id (name)
      `)
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (error) {
            logger.error('Error fetching subscription requests:', error);
            throw error;
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            companyId: row.company_id,
            requestedPlanId: row.requested_plan_id,
            requestedPlanName: row.subscription_plans?.name,
            paymentReference: row.payment_reference,
            requestType: row.request_type as 'renewal' | 'upgrade',
            status: row.status as 'pending' | 'approved' | 'rejected',
            adminNotes: row.admin_notes,
            effectiveStartDate: row.effective_start_date,
            effectiveEndDate: row.effective_end_date,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    },

    /**
     * Fetch all pending subscription requests (Platform Admin)
     */
    async fetchAllPendingRequests(): Promise<SubscriptionRequest[]> {
        const { data, error } = await (supabase as any)
            .from('subscription_requests')
            .select(`
        *,
        companies!company_id (name),
        subscription_plans!requested_plan_id (name)
      `)
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (error) {
            logger.error('Error fetching pending subscription requests:', error);
            throw error;
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            companyId: row.company_id,
            companyName: row.companies?.name,
            requestedPlanId: row.requested_plan_id,
            requestedPlanName: row.subscription_plans?.name,
            paymentReference: row.payment_reference,
            requestType: row.request_type as 'renewal' | 'upgrade',
            status: row.status as 'pending' | 'approved' | 'rejected',
            adminNotes: row.admin_notes,
            effectiveStartDate: row.effective_start_date,
            effectiveEndDate: row.effective_end_date,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    },

    /**
     * Approve a subscription request (Platform Admin)
     * Updates the request status and the company's subscription automatically
     */
    async approveRequest(
        requestId: string,
        adminNotes?: string
    ): Promise<void> {
        // First, get the request details
        const { data: request, error: fetchError } = await (supabase as any)
            .from('subscription_requests')
            .select('company_id, requested_plan_id, request_type')
            .eq('id', requestId)
            .single();

        if (fetchError || !request) {
            logger.error('Error fetching request for approval:', fetchError);
            throw fetchError || new Error('Request not found');
        }

        // Get the plan details for limits
        const { data: plan, error: planError } = await (supabase as any)
            .from('subscription_plans')
            .select('*')
            .eq('id', request.requested_plan_id)
            .single();

        if (planError || !plan) {
            logger.error('Error fetching plan details:', planError);
            throw planError || new Error('Plan not found');
        }

        // Get current company subscription status to determine start date
        const { data: company, error: companyError } = await (supabase as any)
            .from('companies')
            .select('subscription_end_date, subscription_status')
            .eq('id', request.company_id)
            .single();

        if (companyError) {
            logger.error('Error fetching company details:', companyError);
            throw companyError;
        }

        // Calculate new subscription dates
        // Logic: 
        // - If renewal and active/future end date -> Start from current end date
        // - If upgrade -> Start from NOW (pro-rated logic not implemented, simplified to immediate switch)
        // - If expired -> Start from NOW

        let startDate = new Date();
        const currentEndDate = company.subscription_end_date ? new Date(company.subscription_end_date) : null;

        if (
            request.request_type === 'renewal' &&
            currentEndDate &&
            currentEndDate > new Date()
        ) {
            startDate = currentEndDate;
        }

        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        // Update company's subscription automatically
        const { error: updateCompanyError } = await supabase
            .from('companies')
            .update({
                plan_id: request.requested_plan_id,
                subscription_status: 'active',
                subscription_start_date: startDate.toISOString(),
                subscription_end_date: endDate.toISOString(),
                usage_limits: {
                    maxUsers: plan.max_users,
                    maxProducts: plan.max_products,
                    maxDrivers: plan.max_drivers,
                    maxStorageMb: plan.max_storage_mb,
                },
            } as any)
            .eq('id', request.company_id);

        if (updateCompanyError) {
            logger.error('Error updating company subscription:', updateCompanyError);
            throw updateCompanyError;
        }

        // Update request status with effective dates
        const { error: updateRequestError } = await (supabase as any)
            .from('subscription_requests')
            .update({
                status: 'approved',
                admin_notes: adminNotes,
                effective_start_date: startDate.toISOString(),
                effective_end_date: endDate.toISOString(),
            })
            .eq('id', requestId);

        if (updateRequestError) {
            logger.error('Error updating request status:', updateRequestError);
            throw updateRequestError;
        }
    },

    /**
     * Reject a subscription request (Platform Admin)
     */
    async rejectRequest(requestId: string, adminNotes?: string): Promise<void> {
        const { error } = await (supabase as any)
            .from('subscription_requests')
            .update({
                status: 'rejected',
                admin_notes: adminNotes,
            })
            .eq('id', requestId);

        if (error) {
            logger.error('Error rejecting subscription request:', error);
            throw error;
        }
    },
};
