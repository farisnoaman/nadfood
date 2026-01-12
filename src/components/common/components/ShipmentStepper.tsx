import React from 'react';
import { ShipmentStatus } from '../../../types/types';
import { Icons } from '../../Icons';

interface ShipmentStepperProps {
  status: ShipmentStatus;
}

const getStepIndex = (status: ShipmentStatus): number => {
    switch(status) {
        case ShipmentStatus.FROM_SALES:
        case ShipmentStatus.DRAFT:
        case ShipmentStatus.RETURNED_FOR_EDIT:
            return 1; // Accounting is current step
        case ShipmentStatus.SENT_TO_ADMIN:
            return 2; // Admin is current step
        case ShipmentStatus.FINAL:
        case ShipmentStatus.FINAL_MODIFIED:
            return 3; // All completed
        default:
            return 0;
    }
}

const ShipmentStepper: React.FC<ShipmentStepperProps> = ({ status }) => {
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
  
    return (
        <div className="w-full px-4 sm:px-0 mb-6">
            <div className="flex justify-between items-center">
                {stepLabels.map((label, index) => {
                    const state = getStepState(index + 1);
                    const Icon = stepIcons[index];
                    
                    const iconContainerClasses = 
                        state === 'completed' ? 'bg-green-500' :
                        state === 'current' ? 'bg-primary-600 border-4 border-white dark:border-secondary-800' :
                        state === 'returned' ? 'bg-orange-500 border-4 border-white dark:border-secondary-800' :
                        'bg-secondary-300 dark:bg-secondary-600';

                    const iconClasses = 
                        state === 'completed' || state === 'current' || state === 'returned'
                        ? 'text-white'
                        : 'text-secondary-500 dark:text-secondary-400';
                    
                    const labelClasses =
                        state === 'upcoming' ? 'text-secondary-500' :
                        'text-secondary-800 dark:text-secondary-200 font-semibold';
                    
                    const connectorIsActive = getStepState(index) === 'completed';

                    return (
                        <React.Fragment key={label}>
                            <div className="flex flex-col items-center text-center z-10">
                                <div className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-300 ${iconContainerClasses}`}>
                                    {state === 'completed' ? <Icons.Check className="w-6 h-6 text-white" /> : <Icon className={`w-5 h-5 ${iconClasses}`} />}
                                    {state === 'returned' && <div className="absolute -top-1 -right-1"><Icons.Undo2 className="w-4 h-4 text-white bg-orange-600 rounded-full p-0.5" /></div>}
                                </div>
                                <p className={`mt-2 text-xs sm:text-sm ${labelClasses}`}>{label}</p>
                            </div>
                            {index < stepLabels.length - 1 && (
                                <div className={`flex-auto border-t-2 transition-colors duration-500 -mx-2 sm:-mx-4 ${connectorIsActive ? 'border-primary-500' : 'border-secondary-300 dark:border-secondary-600'}`}></div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default ShipmentStepper;
