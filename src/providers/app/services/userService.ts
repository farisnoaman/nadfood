/**
 * User service - CRUD operations for users
 */

import { supabase } from '../../../utils/supabaseClient';
import SupabaseService from '../../../utils/supabaseService';
import { User } from '../../../types';
import { userFromRow } from '../mappers';
import logger from '../../../utils/logger';

export const userService = {
    async fetchAll(signal?: AbortSignal, companyId?: string): Promise<User[]> {
        const { data, error } = await SupabaseService.fetchAll('users', (query) => {
            let q = query.order('username');
            if (companyId) {
                q = q.eq('company_id', companyId);
            }
            if (signal) {
                q = q.abortSignal(signal);
            }
            return q;
        });

        if (error) {
            logger.error('Error fetching users:', error);
            throw error;
        }

        return (data || []).map(userFromRow);
    },

    async fetchById(userId: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            logger.error('Error fetching user by id:', error);
            throw error;
        }

        return data ? userFromRow(data) : null;
    },

    async create(userData: Omit<User, 'id'>, password: string, currentUser: any): Promise<User | null> {
        try {
            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: userData.email,
                password,
                options: {
                    data: {
                        username: userData.username,
                        role: userData.role,
                        company_id: currentUser?.companyId,
                    },
                },
            });

            if (authError) {
                logger.error('Error creating auth user:', authError);
                throw authError;
            }

            if (!authData.user) {
                throw new Error('Failed to create user');
            }

            // Fetch the created user from public.users table
            const { data: newUser, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('id', authData.user.id)
                .single();

            if (fetchError) {
                logger.error('Error fetching created user:', fetchError);
                throw fetchError;
            }

            return userFromRow(newUser);
        } catch (error) {
            logger.error('Error in user creation:', error);
            return null;
        }
    },

    async update(userId: string, updates: Partial<User>): Promise<void> {
        const updateData: any = {};
        if (updates.username !== undefined) updateData.username = updates.username;
        if (updates.role !== undefined) updateData.role = updates.role;
        if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
        if (updates.email !== undefined) updateData.email = updates.email;

        const { error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId);

        if (error) {
            logger.error('Error updating user:', error);
            throw error;
        }
    },
};
