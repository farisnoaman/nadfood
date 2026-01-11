
import React, { useState, useMemo, useEffect } from 'react';
import { User, Role } from '../../../types/types';
import { sanitizeUsername, sanitizeEmail } from '../../../utils/sanitization';
import Card from '../../common/display/Card';
import Button from '../../common/ui/Button';
import Input from '../../common/ui/Input';
import { Icons } from '../../Icons';
import Modal from '../../common/ui/Modal';
import { useAppContext } from '../../../providers/AppContext';
import SearchableSelect from '../../common/forms/SearchableSelect';
import { supabase } from '../../../utils/supabaseClient';

const ManageUsers: React.FC = () => {
  const { users, updateUser, currentUser } = useAppContext();
  
  // Sorting state
  const [sortBy, setSortBy] = useState<'username' | 'role' | 'status'>('username');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // State for password change modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [changePasswordMessage, setChangePasswordMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for add user modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [addUserPassword, setAddUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>(Role.SALES);
  const [addUserError, setAddUserError] = useState('');
  
   // State for activation/deactivation modal
   const [userToToggleStatus, setUserToToggleStatus] = useState<User | null>(null);

   // State for edit user modal
   const [userToEdit, setUserToEdit] = useState<User | null>(null);
   const [editUsername, setEditUsername] = useState('');
   const [editUserRole, setEditUserRole] = useState<Role>(Role.SALES);
   const [editUserMessage, setEditUserMessage] = useState('');

   // State for delete user modal
   const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const sortedUsers = useMemo(() => {
    const filtered = users.filter((u: User) => u.id !== currentUser?.id);
    return filtered.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      if (sortBy === 'username') {
        valA = a.username.toLowerCase();
        valB = b.username.toLowerCase();
      } else if (sortBy === 'role') {
        valA = a.role;
        valB = b.role;
      } else if (sortBy === 'status') {
        // Treat active (true) as 1, inactive (false) as 0
        valA = (a.isActive ?? true) ? 1 : 0;
        valB = (b.isActive ?? true) ? 1 : 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, currentUser, sortBy, sortOrder]);

  const handlePasswordChange = async () => {
    if (!selectedUser || !newPassword) {
      setChangePasswordMessage("الرجاء إدخال كلمة مرور جديدة.");
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setChangePasswordMessage("يجب أن تكون كلمة المرور 6 أحرف على الأقل.");
      return;
    }

    setIsSubmitting(true);
    setChangePasswordMessage('');

    try {
      // Call the Edge Function to change user password
      const { data, error } = await supabase.functions.invoke('admin-change-user-password', {
        body: { 
          userId: selectedUser.id, 
          newPassword: newPassword 
        }
      });

      if (error) {
        console.error('Password change error:', error);
        setChangePasswordMessage(`خطأ: ${error.message || 'فشل تغيير كلمة المرور'}`);
        setIsSubmitting(false);
        return;
      }

      if (data?.error) {
        console.error('Password change error:', data.error);
        setChangePasswordMessage(`خطأ: ${data.error}`);
        setIsSubmitting(false);
        return;
      }

      // Success
      setChangePasswordMessage(`تم تغيير كلمة مرور ${selectedUser.username} بنجاح`);
      setNewPassword('');
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setSelectedUser(null);
        setChangePasswordMessage('');
      }, 2000);

    } catch (err) {
      console.error('Unexpected error:', err);
      setChangePasswordMessage('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setNewUsername('');
    setNewUserEmail('');
    setAddUserPassword('');
    setNewUserRole(Role.SALES);
    setAddUserError('');
  };

  const handleAddNewUser = async () => {
    setAddUserError('');
    
    // Sanitize inputs
    const sanitizedUsername = sanitizeUsername(newUsername);
    const sanitizedEmail = sanitizeEmail(newUserEmail);

    if (!sanitizedUsername || !addUserPassword.trim() || !sanitizedEmail) {
      setAddUserError('يرجى ملء جميع الحقول بشكل صحيح.');
      return;
    }

    // Validate password length
    if (addUserPassword.length < 6) {
      setAddUserError('يجب أن تكون كلمة المرور 6 أحرف على الأقل.');
      return;
    }

    // Check for duplicate username
    const isDuplicate = users.some((u: User) => u.username === sanitizedUsername);
    if (isDuplicate) {
      setAddUserError(`اسم المستخدم "${sanitizedUsername}" موجود بالفعل.`);
      return;
    }

    setIsSubmitting(true);
    
    const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: addUserPassword,
    });

    if (error) {
        setAddUserError(error.message);
    } else if (data.user) {
        // Now create the users entry
        const { error: profileError } = await supabase.from('users').insert({
            id: data.user.id,
            username: sanitizedUsername,
            role: newUserRole,
            is_active: true,
        });

        if (profileError) {
            setAddUserError(`فشل إنشاء ملف المستخدم: ${profileError.message}`);
        } else {
            handleCloseAddModal();
            // The context will refetch data automatically after a short delay or via real-time subscription
        }
    }
    setIsSubmitting(false);
  };
  
   const confirmToggleUserStatus = async () => {
     if (!userToToggleStatus) return;
     setIsSubmitting(true);
     await updateUser(userToToggleStatus.id, { isActive: !(userToToggleStatus.isActive ?? true) });
     setUserToToggleStatus(null);
     setIsSubmitting(false);
   };

   const handleEditUser = async () => {
     if (!userToEdit || !editUsername.trim()) {
       setEditUserMessage("الرجاء إدخال اسم المستخدم.");
       return;
     }

     setIsSubmitting(true);
     setEditUserMessage('');

     try {
       // Call the Edge Function to update user
       const { data, error } = await supabase.functions.invoke('admin-update-user', {
         body: {
           userId: userToEdit.id,
           username: editUsername.trim(),
           role: editUserRole
         }
       });

       if (error) {
         console.error('Edit user error:', error);
         setEditUserMessage(`خطأ: ${error.message || 'فشل تعديل المستخدم'}`);
         setIsSubmitting(false);
         return;
       }

       if (data?.error) {
         console.error('Edit user error:', data.error);
         setEditUserMessage(`خطأ: ${data.error}`);
         setIsSubmitting(false);
         return;
       }

       // Success
       setEditUserMessage(`تم تعديل ${editUsername} بنجاح`);
       setEditUsername('');
       setUserToEdit(null);

       // Close modal after 2 seconds
       setTimeout(() => {
         setEditUserMessage('');
       }, 2000);

     } catch (err) {
       console.error('Unexpected error:', err);
       setEditUserMessage('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
     } finally {
       setIsSubmitting(false);
     }
   };

   useEffect(() => {
     if (userToEdit) {
       setEditUsername(userToEdit.username);
       setEditUserRole(userToEdit.role);
     }
   }, [userToEdit]);

   const confirmDeleteUser = async () => {
     if (!userToDelete) return;
     setIsSubmitting(true);

     try {
       // Call the Edge Function to delete user
       const { data, error } = await supabase.functions.invoke('admin-delete-user', {
         body: { userId: userToDelete.id }
       });

       if (error) {
         console.error('Delete user error:', error);
         // Handle error - perhaps show a message
         setIsSubmitting(false);
         return;
       }

       if (data?.error) {
         console.error('Delete user error:', data.error);
         setIsSubmitting(false);
         return;
       }

       // Success - the context will refetch data automatically
       setUserToDelete(null);

     } catch (err) {
       console.error('Unexpected error:', err);
     } finally {
       setIsSubmitting(false);
     }
   };
  
  return (
    <>
      <Card title="إدارة المستخدمين">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="min-w-[160px]">
                    <SearchableSelect 
                        label="ترتيب حسب"
                        options={[
                            { value: 'username', label: 'اسم المستخدم' },
                            { value: 'role', label: 'الدور' },
                            { value: 'status', label: 'الحالة' },
                        ]}
                        value={sortBy}
                        onChange={(val) => setSortBy(val as any)}
                    />
                </div>
                <div className="mt-6">
                     <Button variant="secondary" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} title={sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}>
                        {sortOrder === 'asc' ? <Icons.ArrowUp className="h-5 w-5" /> : <Icons.ArrowDown className="h-5 w-5" />}
                    </Button>
                </div>
            </div>
            <div className="w-full sm:w-auto mt-auto">
                <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto">
                    <Icons.UserPlus className="ml-2 h-4 w-4" />
                    إضافة مستخدم جديد
                </Button>
            </div>
        </div>

        <div className="space-y-3">
          {sortedUsers.map((user: User) => (
            <div key={user.id} className={`flex flex-col sm:flex-row justify-between sm:items-center p-3 bg-secondary-100 dark:bg-secondary-700 rounded-md transition-opacity ${user.isActive ?? true ? '' : 'opacity-60'}`}>
              <div>
                <p className="font-semibold">{user.username}</p>
                <div className="flex items-center text-sm mt-1 sm:mt-0">
                  <p className="text-secondary-500">{user.role}</p>
                  <span className={`mx-2 px-2 py-0.5 text-xs rounded-full ${user.isActive ?? true ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                      {user.isActive ?? true ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
              </div>
               {/* Mobile: Grid layout for action buttons */}
               <div className="grid grid-cols-2 gap-2 mt-3 sm:hidden">
                    <Button size="sm" variant="ghost-red" onClick={() => setUserToToggleStatus(user)} title={user.isActive ?? true ? 'إلغاء التفعيل' : 'تفعيل'} className="justify-center">
{user.isActive ?? true
                            ? <><Icons.CircleX className="h-4 w-4" /><span className="mr-1 text-xs">تعطيل</span></>
                            : <><Icons.CircleCheck className="h-4 w-4 text-green-500" /><span className="mr-1 text-xs">تفعيل</span></>
                        }
                    </Button>
                   <Button size="sm" onClick={() => setUserToEdit(user)} className="justify-center">
                       <Icons.Edit className="ml-1 h-3 w-3" />
                       <span className="text-xs">تعديل</span>
                   </Button>
                   <Button size="sm" onClick={() => setSelectedUser(user)} className="justify-center">
                       <Icons.KeyRound className="ml-1 h-3 w-3" />
                       <span className="text-xs">كلمة السر</span>
                   </Button>
                    <Button size="sm" variant="ghost-red" onClick={() => setUserToDelete(user)} title="حذف" className="justify-center">
                        <Icons.Trash2 className="h-4 w-4" />
                        <span className="mr-1 text-xs">حذف</span>
                    </Button>
               </div>
               
               {/* Desktop: Horizontal layout for action buttons */}
               <div className="hidden sm:flex items-center space-x-1 rtl:space-x-reverse mt-2 sm:mt-0 self-end sm:self-center">
                    <Button size="sm" variant="ghost-red" onClick={() => setUserToToggleStatus(user)} title={user.isActive ?? true ? 'تعطيل' : 'تفعيل'}>
                        {user.isActive ?? true
                            ? <Icons.CircleX className="h-5 w-5" />
                            : <Icons.CircleCheck className="h-5 w-5" />
                        }
                    </Button>
                   <Button size="sm" onClick={() => setUserToEdit(user)}>
                       <Icons.Edit className="ml-2 h-4 w-4" />
                       تعديل
                   </Button>
                   <Button size="sm" onClick={() => setSelectedUser(user)}>
                       <Icons.KeyRound className="ml-2 h-4 w-4" />
                       تغيير كلمة السر
                   </Button>
                    <Button size="sm" variant="ghost-red" onClick={() => setUserToDelete(user)} title="حذف">
                        <Icons.Trash2 className="h-5 w-5" />
                    </Button>
               </div>
            </div>
          ))}
          {sortedUsers.length === 0 && (
              <p className="text-center text-secondary-500 py-4">لا يوجد مستخدمين آخرين.</p>
          )}
        </div>

        {selectedUser && (
          <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title={`تغيير كلمة مرور ${selectedUser.username}`}>
            <div className="space-y-4">
              {changePasswordMessage && (
                <p className={`text-center ${changePasswordMessage.includes('خطأ') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {changePasswordMessage}
                </p>
              )}
              <Input 
                label="كلمة المرور الجديدة"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="********"
                disabled={isSubmitting}
              />
              <p className="text-xs text-secondary-500">يجب أن تكون كلمة المرور 6 أحرف على الأقل</p>
              <div className="flex justify-end gap-3">
                  <Button variant="ghost-red" onClick={() => setSelectedUser(null)} disabled={isSubmitting}>إلغاء</Button>
                  <Button onClick={handlePasswordChange} disabled={isSubmitting}>{isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}</Button>
              </div>
            </div>
          </Modal>
        )}

        <Modal isOpen={isAddModalOpen} onClose={handleCloseAddModal} title="إضافة مستخدم جديد">
          <div className="space-y-4">
            {addUserError && <p className="text-red-500 text-sm text-center">{addUserError}</p>}
            <Input 
              label="اسم المستخدم"
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
            />
            <Input 
              label="البريد الإلكتروني (للدخول)"
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              required
            />
            <Input 
              label="كلمة المرور"
              type="password"
              value={addUserPassword}
              onChange={(e) => setAddUserPassword(e.target.value)}
              placeholder="********"
              required
            />
            <SearchableSelect
              label="الدور"
              options={Object.values(Role).map(role => ({ value: role, label: role }))}
              value={newUserRole}
              onChange={(val) => setNewUserRole(val as Role)}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost-red" onClick={handleCloseAddModal}>إلغاء</Button>
              <Button onClick={handleAddNewUser} disabled={isSubmitting}>{isSubmitting ? 'جاري الإضافة...' : 'إضافة المستخدم'}</Button>
            </div>
          </div>
        </Modal>
      </Card>
        <Modal isOpen={!!userToToggleStatus} onClose={() => setUserToToggleStatus(null)} title="تأكيد تغيير الحالة">
           <div className="text-center">
               <Icons.AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
               <p className="mt-4">
                   هل أنت متأكد من رغبتك في
                   {userToToggleStatus?.isActive ?? true ? ' إلغاء تفعيل ' : ' تفعيل '}
                   المستخدم
                   <span className="font-bold"> {userToToggleStatus?.username}</span>؟
               </p>
               <p className="text-sm text-secondary-500">
                   {userToToggleStatus?.isActive ?? true
                       ? 'لن يتمكن المستخدم من تسجيل الدخول بعد إلغاء التفعيل.'
                       : 'سيتمكن المستخدم من تسجيل الدخول بعد التفعيل.'}
               </p>
               <div className="mt-6 flex justify-center gap-4">
                    <Button variant="ghost-red" onClick={() => setUserToToggleStatus(null)}>إلغاء</Button>
                   <Button variant="primary" onClick={confirmToggleUserStatus} disabled={isSubmitting}>{isSubmitting ? 'جاري التغيير...' : 'نعم، تأكيد'}</Button>
               </div>
           </div>
       </Modal>

       {userToEdit && (
         <Modal isOpen={!!userToEdit} onClose={() => setUserToEdit(null)} title={`تعديل ${userToEdit.username}`}>
           <div className="space-y-4">
             {editUserMessage && (
               <p className={`text-center ${editUserMessage.includes('خطأ') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                 {editUserMessage}
               </p>
             )}
             <Input
               label="اسم المستخدم"
               type="text"
               value={editUsername}
               onChange={(e) => setEditUsername(e.target.value)}
               placeholder="اسم المستخدم الجديد"
               disabled={isSubmitting}
               required
             />
             <SearchableSelect
               label="الدور"
               options={Object.values(Role).map(role => ({ value: role, label: role }))}
               value={editUserRole}
               onChange={(val) => setEditUserRole(val as Role)}
             />
             <div className="flex justify-end gap-3">
                  <Button variant="ghost-red" onClick={() => setUserToEdit(null)} disabled={isSubmitting}>إلغاء</Button>
                 <Button onClick={handleEditUser} disabled={isSubmitting}>{isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}</Button>
             </div>
           </div>
         </Modal>
       )}

       <Modal isOpen={!!userToDelete} onClose={() => setUserToDelete(null)} title="تأكيد حذف المستخدم">
         <div className="text-center">
             <Icons.AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
             <p className="mt-4">
                 هل أنت متأكد من رغبتك في حذف المستخدم
                 <span className="font-bold"> {userToDelete?.username}</span>؟
             </p>
             <p className="text-sm text-secondary-500">
                 هذا الإجراء لا يمكن التراجع عنه. سيتم حذف المستخدم نهائياً من النظام.
             </p>
             <div className="mt-6 flex justify-center gap-4">
                  <Button variant="ghost-red" onClick={() => setUserToDelete(null)}>إلغاء</Button>
                 <Button variant="destructive" onClick={confirmDeleteUser} disabled={isSubmitting}>{isSubmitting ? 'جاري الحذف...' : 'نعم، حذف'}</Button>
             </div>
         </div>
     </Modal>
    </>
  );
};

export default ManageUsers;