
import React from 'react';
import {
    Sun, Moon, Laptop, Palette, LogIn, LogOut, User, KeyRound, Truck,
    FilePlus, Send, Archive, Edit, X, Check, Search, Calendar, Hash,
    ChevronDown, Plus, Trash2, FileInput, FileOutput, Users, MapPin,
    Package, Bell, Save, AlertTriangle, ChevronsRightLeft, Undo2, FileText, UserPlus,
    FileDown, CircleCheck, CircleX, Grid, List, Settings, ArrowRight, ArrowLeft, Printer,
    ArrowUp, ArrowDown, Share, BarChart3, WifiOff, RefreshCw, Wifi, CheckCircle, Info,
    Eye, EyeOff, DollarSign
} from 'lucide-react';

// Type guard to ensure all icons are valid components
const validateIcon = (icon: any, name: string) => {
    if (!icon) {
        console.warn(`Invalid icon: ${name}`, icon);
        return ({ className }: { className?: string }) => <div className={className} title={`Icon ${name} not found`} />;
    }
    return icon;
};

export const Icons = {
    Sun: validateIcon(Sun, 'Sun'),
    Moon: validateIcon(Moon, 'Moon'),
    Laptop: validateIcon(Laptop, 'Laptop'),
    Palette: validateIcon(Palette, 'Palette'),
    LogIn: validateIcon(LogIn, 'LogIn'),
    LogOut: validateIcon(LogOut, 'LogOut'),
    User: validateIcon(User, 'User'),
    KeyRound: validateIcon(KeyRound, 'KeyRound'),
    Truck: validateIcon(Truck, 'Truck'),
    FilePlus: validateIcon(FilePlus, 'FilePlus'),
    Send: validateIcon(Send, 'Send'),
    Archive: validateIcon(Archive, 'Archive'),
    Edit: validateIcon(Edit, 'Edit'),
    Eye: validateIcon(Eye, 'Eye'),
    EyeOff: validateIcon(EyeOff, 'EyeOff'),
    X: validateIcon(X, 'X'),
    Check: validateIcon(Check, 'Check'),
    Search: validateIcon(Search, 'Search'),
    Calendar: validateIcon(Calendar, 'Calendar'),
    Hash: validateIcon(Hash, 'Hash'),
    ChevronDown: validateIcon(ChevronDown, 'ChevronDown'),
    Plus: validateIcon(Plus, 'Plus'),
    Trash2: validateIcon(Trash2, 'Trash2'),
    FileInput: validateIcon(FileInput, 'FileInput'),
    FileOutput: validateIcon(FileOutput, 'FileOutput'),
    Users: validateIcon(Users, 'Users'),
    MapPin: validateIcon(MapPin, 'MapPin'),
    Package: validateIcon(Package, 'Package'),
    Bell: validateIcon(Bell, 'Bell'),
    Save: validateIcon(Save, 'Save'),
    AlertTriangle: validateIcon(AlertTriangle, 'AlertTriangle'),
    ChevronsRightLeft: validateIcon(ChevronsRightLeft, 'ChevronsRightLeft'),
    Undo2: validateIcon(Undo2, 'Undo2'),
    FileText: validateIcon(FileText, 'FileText'),
    UserPlus: validateIcon(UserPlus, 'UserPlus'),
    FileDown: validateIcon(FileDown, 'FileDown'),
    CircleCheck: validateIcon(CircleCheck, 'CircleCheck'),
    CheckCircle: validateIcon(CheckCircle, 'CheckCircle'),
    CircleX: validateIcon(CircleX, 'CircleX'),
    Grid: validateIcon(Grid, 'Grid'),
    List: validateIcon(List, 'List'),
    Settings: validateIcon(Settings, 'Settings'),
    ArrowRight: validateIcon(ArrowRight, 'ArrowRight'),
    ArrowLeft: validateIcon(ArrowLeft, 'ArrowLeft'),
    Printer: validateIcon(Printer, 'Printer'),
    ArrowUp: validateIcon(ArrowUp, 'ArrowUp'),
    ArrowDown: validateIcon(ArrowDown, 'ArrowDown'),
    Share: validateIcon(Share, 'Share'),
    BarChart3: validateIcon(BarChart3, 'BarChart3'),
    WifiOff: validateIcon(WifiOff, 'WifiOff'),
    RefreshCw: validateIcon(RefreshCw, 'RefreshCw'),
    Wifi: validateIcon(Wifi, 'Wifi'),
    Info: validateIcon(Info, 'Info'),
    DollarSign: validateIcon(DollarSign, 'DollarSign')
};

// Fallback icons in case any are undefined
export const IconsWithFallback = {
    ...Icons,
    RefreshCw: Icons.RefreshCw || ((props: any) => React.createElement('div', { ...props }, '↻')),
    Edit: Icons.Edit || ((props: any) => React.createElement('div', { ...props }, '✏️')),
    Undo2: Icons.Undo2 || ((props: any) => React.createElement('div', { ...props }, '↩️')),
    AlertTriangle: Icons.AlertTriangle || ((props: any) => React.createElement('div', { ...props }, '⚠️'))
};