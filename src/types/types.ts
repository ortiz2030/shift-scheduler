export interface Shift {
    id: string;
    particulars: string;
    startTime: Date;
    endTime: Date;
    notes: string;
    status: 'scheduled' | 'active' | 'onHold' | 'terminated' | 'completed';
    duration: number; // in hours
}

export interface ShiftStripProps {
    shift: Shift;
    onStatusChange: (id: string, status: Shift['status']) => void;
    onDelete: (id: string) => void;
    onMove: (id: string, newStartTime: Date) => void;
    onUpdate: (shift: Shift) => void;
}
