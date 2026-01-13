import React, { useMemo } from 'react';
import { useAppContext } from '../providers/AppContext';

export const SubscriptionBanner: React.FC = () => {
    const { isSubscriptionActive, company } = useAppContext();

    const bannerState = useMemo(() => {
        if (!company) return null;
        if (isSubscriptionActive) {
            // Check for expiring soon
            if (company.subscriptionEndDate) {
                const endDate = new Date(company.subscriptionEndDate);
                const now = new Date();
                const diffTime = endDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 7 && diffDays > 0) {
                    return {
                        type: 'warning',
                        message: `Your subscription expires in ${diffDays} days. Please renew to avoid interruption.`
                    };
                }
            }
            return null;
        } else {
            // Suspended/Expired
            return {
                type: 'error',
                message: 'Your subscription is inactive. Please contact support or renew your plan.'
            };
        }
    }, [company, isSubscriptionActive]);

    if (!bannerState) return null;

    return (
        <div style={{
            backgroundColor: bannerState.type === 'error' ? '#fee2e2' : '#fef3c7',
            color: bannerState.type === 'error' ? '#991b1b' : '#92400e',
            padding: '12px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 500,
            borderBottom: '1px solid rgba(0,0,0,0.1)'
        }}>
            {bannerState.message}
        </div>
    );
};
