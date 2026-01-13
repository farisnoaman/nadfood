import React from 'react';
import { ShipmentStatus } from '../../../types';
import { Icons } from '../../Icons';

interface ShipmentStepperProps {
    status: ShipmentStatus;
}

const getStepIndex = (status: ShipmentStatus): number => {
    switch (status) {
        case ShipmentStatus.FROM_SALES:
        case ShipmentStatus.RETURNED_FOR_EDIT:
            return 2; // Accounting is current step
        case ShipmentStatus.SENT_TO_ADMIN:
        case ShipmentStatus.DRAFT:
            return 3; // Admin is current step
        case ShipmentStatus.FINAL:
        case ShipmentStatus.FINAL_MODIFIED:
            return 4; // All completed
        default:
            return 1; // Traffic is current step
    }
}

const ShipmentStepper: React.FC<ShipmentStepperProps & { dates?: { traffic?: string; accounting?: string; admin?: string } }> = ({ status, dates }) => {
    const currentStepIndex = getStepIndex(status);

    const getStepState = (index: number) => {
        if (index < currentStepIndex) {
            return 'completed';
        }
        if (index === currentStepIndex) {
            return status === ShipmentStatus.RETURNED_FOR_EDIT ? 'returned' : 'current';
        }
        return 'upcoming';
    };

    const stepLabels = ['مسؤول الحركة', 'المحاسبة', 'الإدارة'];
    const stepIcons = [Icons.FilePlus, Icons.FileText, Icons.Archive];
    const stepDates = [dates?.traffic, dates?.accounting, dates?.admin];

    // Helper to format date
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return null;
        try {
            // Basic detection of Arabic locale support or just use a standard format
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return null;
            return date.toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            });
        } catch (e) {
            return null;
        }
    };

    return (
        <div className="w-full px-4 sm:px-0 mb-6">
            <div className="flex justify-between items-start relative">
                {/* Background Line (Gray) */}
                <div className="absolute top-5 left-0 w-full h-0.5 bg-secondary-200 dark:bg-secondary-700 -z-10" style={{ transform: 'translateY(-50%)' }}></div>

                {stepLabels.map((label, index) => {
                    const state = getStepState(index + 1);
                    const Icon = stepIcons[index];
                    const dateStr = stepDates[index];
                    const formattedDate = formatDate(dateStr);

                    const iconContainerClasses =
                        state === 'completed' ? 'bg-green-500 ring-4 ring-white dark:ring-secondary-800' :
                            state === 'current' ? 'bg-primary-600 ring-4 ring-white dark:ring-secondary-800' :
                                state === 'returned' ? 'bg-orange-500 ring-4 ring-white dark:ring-secondary-800' :
                                    'bg-secondary-200 dark:bg-secondary-700 ring-4 ring-white dark:ring-secondary-800'; // Upcoming

                    const iconClasses =
                        state === 'completed' || state === 'current' || state === 'returned'
                            ? 'text-white'
                            : 'text-secondary-400 dark:text-secondary-500';

                    const labelClasses =
                        state === 'upcoming' ? 'text-secondary-400 dark:text-secondary-500' :
                            'text-secondary-800 dark:text-secondary-200 font-bold';

                    return (
                        <React.Fragment key={label}>
                            <div className="flex-1 flex flex-col items-center">
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${iconContainerClasses}`}>
                                        {state === 'completed' ? <Icons.Check className="w-5 h-5 text-white" /> : <Icon className={`w-5 h-5 ${iconClasses}`} />}
                                        {state === 'returned' && <div className="absolute -top-1 -right-1"><Icons.Undo2 className="w-4 h-4 text-white bg-orange-600 rounded-full p-0.5" /></div>}
                                    </div>
                                    <div className="mt-2 text-center">
                                        <p className={`text-xs sm:text-sm whitespace-nowrap ${labelClasses}`}>{label}</p>
                                        {formattedDate && <p className="text-[10px] text-secondary-400 dark:text-secondary-500 mt-0.5 font-medium">{formattedDate}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Connector Line (Overlay) */}
                            {index < stepLabels.length - 1 && (
                                <div className={`flex-auto h-0.5 mt-5 transition-colors duration-500 -mx-4 ${getStepState(index + 2) === 'completed' || getStepState(index + 2) === 'current' || getStepState(index + 2) === 'returned' ? 'bg-green-500' : 'bg-transparent'}`}></div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default ShipmentStepper;
