import { useState } from 'react';

export const useSettings = () => {
    const [accountantPrintAccess, setAccountantPrintAccess] = useState<boolean>(false);
    const [isPrintHeaderEnabled, setIsPrintHeaderEnabled] = useState<boolean>(true);
    const [appName, setAppName] = useState<string>('');
    const [companyName, setCompanyName] = useState<string>('');
    const [companyAddress, setCompanyAddress] = useState<string>('عنوان الشركة');
    const [companyPhone, setCompanyPhone] = useState<string>('رقم الهاتف');
    const [companyLogo, setCompanyLogo] = useState<string>('');
    const [isTimeWidgetVisible, setIsTimeWidgetVisible] = useState<boolean>(true);
    // Accountant workflow settings
    const [accountantDeductionsAccess, setAccountantDeductionsAccess] = useState<boolean>(false);
    const [accountantAdditionsAccess, setAccountantAdditionsAccess] = useState<boolean>(false);
    const [accountantTransferAccess, setAccountantTransferAccess] = useState<boolean>(false);

    return {
        accountantPrintAccess, setAccountantPrintAccess,
        isPrintHeaderEnabled, setIsPrintHeaderEnabled,
        appName, setAppName,
        companyName, setCompanyName,
        companyAddress, setCompanyAddress,
        companyPhone, setCompanyPhone,
        companyLogo, setCompanyLogo,
        isTimeWidgetVisible, setIsTimeWidgetVisible,
        accountantDeductionsAccess, setAccountantDeductionsAccess,
        accountantAdditionsAccess, setAccountantAdditionsAccess,
        accountantTransferAccess, setAccountantTransferAccess,
    };
};
