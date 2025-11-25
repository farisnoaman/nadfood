import React, { useState, useEffect } from 'react';
import Card from '../../../common/display/Card';
import Input from '../../../common/ui/Input';
import { Icons } from '../../../Icons';
import Button from '../../../common/ui/Button';
import { useAppContext } from '../../../../providers/AppContext';
import FieldValue from '../../../common/components/FieldValue';

const AdminSettings: React.FC = () => {
  const { 
    accountantPrintAccess, setAccountantPrintAccess,
    isPrintHeaderEnabled, setIsPrintHeaderEnabled,
    appName, setAppName,
    companyName, setCompanyName,
    companyAddress, setCompanyAddress,
    companyPhone, setCompanyPhone,
    companyLogo, setCompanyLogo,
    isTimeWidgetVisible, setIsTimeWidgetVisible
  } = useAppContext();

  // State for edit mode and temporary form data
  const [isEditing, setIsEditing] = useState(false);
  const [tempDetails, setTempDetails] = useState({
    name: companyName,
    address: companyAddress,
    phone: companyPhone,
    logo: companyLogo,
    appName: appName,
  });

  useEffect(() => {
    if (!isEditing) {
      setTempDetails({
        name: companyName,
        address: companyAddress,
        phone: companyPhone,
        logo: companyLogo,
        appName: appName,
      });
    }
  }, [companyName, companyAddress, companyPhone, companyLogo, appName, isEditing]);

  const handleEditClick = () => setIsEditing(true);
  const handleCancelClick = () => {
    setTempDetails({ name: companyName, address: companyAddress, phone: companyPhone, logo: companyLogo, appName: appName });
    setIsEditing(false);
  };
  const handleSaveClick = () => {
    setAppName(tempDetails.appName);
    setCompanyName(tempDetails.name);
    setCompanyAddress(tempDetails.address);
    setCompanyPhone(tempDetails.phone);
    setCompanyLogo(tempDetails.logo);
    setIsEditing(false);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const ToggleSetting: React.FC<{ label: string, isChecked: boolean, onToggle: (checked: boolean) => void, id: string }> = ({ label, isChecked, onToggle, id }) => (
    <label htmlFor={id} className="flex items-center justify-between cursor-pointer p-2 rounded-md hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
      <span className="text-secondary-800 dark:text-secondary-200">{label}</span>
      <input
        type="checkbox"
        id={id}
        checked={isChecked}
        onChange={(e) => onToggle(e.target.checked)}
        className="h-5 w-5 rounded text-primary-600 focus:ring-primary-500 border-secondary-300 dark:border-secondary-600 bg-secondary-100 dark:bg-secondary-900 focus:ring-offset-0"
      />
    </label>
  );

  return (
    <div className="space-y-6">
      <Card title="صلاحيات المستخدمين">
        <ToggleSetting
          id="print-access"
          label="السماح للمحاسب بطباعة تقارير الشحنات النهائية"
          isChecked={accountantPrintAccess}
          onToggle={setAccountantPrintAccess}
        />
      </Card>
      
      <Card title="إعدادات الواجهة">
          <ToggleSetting
            id="time-widget-toggle"
            label="عرض أداة الوقت والتاريخ"
            isChecked={isTimeWidgetVisible}
            onToggle={setIsTimeWidgetVisible}
          />
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold">إعدادات التطبيق والتقارير</h4>
          {!isEditing && (
            <Button onClick={handleEditClick} size="sm" variant="ghost">
              <Icons.Edit className="ml-2 h-4 w-4" />
              تعديل
            </Button>
          )}
        </div>
        
        <div className="space-y-4">
          <ToggleSetting
            id="header-toggle"
            label="تفعيل رأس التقرير المخصص (الاسم والشعار)"
            isChecked={isPrintHeaderEnabled}
            onToggle={setIsPrintHeaderEnabled}
          />

          <div className="pl-4 border-r-2 dark:border-secondary-600">
            {isEditing ? (
              <div className="space-y-4">
                <Input label="اسم التطبيق" name="appName" value={tempDetails.appName} onChange={handleInputChange} />
                <Input label="اسم الشركة" name="name" value={tempDetails.name} onChange={handleInputChange} />
                <Input label="عنوان الشركة" name="address" value={tempDetails.address} onChange={handleInputChange} />
                <Input label="رقم الهاتف" name="phone" value={tempDetails.phone} onChange={handleInputChange} />
                <div>
                  <Input label="رابط شعار الشركة" name="logo" placeholder="https://example.com/logo.png" value={tempDetails.logo} onChange={handleInputChange} />
                  <div className="mt-2 flex items-center gap-4">
                    {tempDetails.logo ? (
                      <img src={tempDetails.logo} alt="Company Logo Preview" className="h-16 w-auto object-contain bg-gray-200 p-1 rounded"/>
                    ) : (
                      <div className="h-16 w-16 flex items-center justify-center bg-secondary-100 dark:bg-secondary-700 rounded text-secondary-500">
                        <Icons.Truck className="h-8 w-8" />
                      </div>
                    )}
                    {tempDetails.logo && <Button variant="secondary" size="sm" onClick={() => setTempDetails(p => ({...p, logo: ''}))}>إزالة الشعار</Button>}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="secondary" onClick={handleCancelClick}>إلغاء</Button>
                  <Button onClick={handleSaveClick}>حفظ التغييرات</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1 p-2 rounded-md bg-secondary-50 dark:bg-secondary-800/30">
                <FieldValue label="اسم التطبيق" value={appName} currency="" />
                <FieldValue label="اسم الشركة" value={companyName} currency="" />
                <FieldValue label="العنوان" value={companyAddress} currency="" />
                <FieldValue label="الهاتف" value={companyPhone} currency="" />
                <div className="flex justify-between py-1 text-sm">
                  <span className="font-semibold text-secondary-600 dark:text-secondary-400">الشعار:</span>
                  <div className="text-secondary-800 dark:text-secondary-200">
                    {companyLogo ? (
                        <img src={companyLogo} alt="Company Logo" className="h-16 w-auto object-contain p-1 rounded bg-white"/>
                    ) : (
                        <span>-</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminSettings;