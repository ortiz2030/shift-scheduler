import React, { FC, useState } from 'react';
import { Card, Typography, IconButton, Menu, MenuItem, TextField, Box } from '@mui/material';
import { MoreVert, Delete, Pause, PlayArrow, Stop, DragIndicator } from '@mui/icons-material';
import { format, isSameDay, differenceInDays } from 'date-fns';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Shift, ShiftStripProps } from '../types/types';

const ShiftStrip: FC<ShiftStripProps> = ({ shift, onStatusChange, onDelete, onUpdate }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedShift, setEditedShift] = useState(shift);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: shift.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleStatusChange = (status: Shift['status']) => {
        onStatusChange(shift.id, status);
        handleMenuClose();
    };

    const handleSave = () => {
        onUpdate(editedShift);
        setIsEditing(false);
    };

    const getStatusColor = () => {
        switch (shift.status) {
            case 'active':
                return '#4caf50';
            case 'onHold':
                return '#ff9800';
            case 'terminated':
                return '#f44336';
            case 'completed':
                return '#2196f3';
            case 'scheduled':
                return '#9c27b0';
            default:
                return '#757575';
        }
    };

    const formatDateTime = (date: Date) => {
        return format(date, 'MMM d, yyyy (EEEE) HH:mm');
    };

    const getTimeDisplay = () => {
        if (isSameDay(shift.startTime, shift.endTime)) {
            return `${formatDateTime(shift.startTime)} - ${format(shift.endTime, 'HH:mm')}`;
        } else {
            const daysDiff = differenceInDays(shift.endTime, shift.startTime);
            return `${formatDateTime(shift.startTime)} - ${formatDateTime(shift.endTime)} (${daysDiff + 1} days)`;
        }
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            sx={{
                p: 2,
                m: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderLeft: `6px solid ${getStatusColor()}`,
                cursor: 'grab',
                '&:hover': { boxShadow: 3 }
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                <IconButton
                    {...attributes}
                    {...listeners}
                    sx={{ cursor: 'grab', mr: 1 }}
                >
                    <DragIndicator />
                </IconButton>
                {!isEditing ? (
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6">{shift.particulars}</Typography>
                        <Typography variant="body2" color="textSecondary">
                            {getTimeDisplay()}
                            {shift.status === 'scheduled' && ' (Scheduled)'}
                        </Typography>
                        <Typography variant="body2">{shift.notes}</Typography>
                    </Box>
                ) : (
                    <Box sx={{ flexGrow: 1 }}>
                        <TextField
                            fullWidth
                            margin="dense"
                            label="Particulars"
                            value={editedShift.particulars}
                            onChange={(e) => setEditedShift({ ...editedShift, particulars: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            margin="dense"
                            label="Notes"
                            value={editedShift.notes}
                            onChange={(e) => setEditedShift({ ...editedShift, notes: e.target.value })}
                            multiline
                        />
                        <Box sx={{ mt: 1 }}>
                            <IconButton onClick={handleSave} color="primary">
                                <PlayArrow />
                            </IconButton>
                        </Box>
                    </Box>
                )}
            </Box>
            <Box>
                <IconButton onClick={handleMenuOpen}>
                    <MoreVert />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuItem onClick={() => setIsEditing(true)}>Edit</MenuItem>
                    {shift.status === 'scheduled' && (
                        <MenuItem onClick={() => handleStatusChange('active')}>
                            <PlayArrow sx={{ mr: 1 }} /> Activate Now
                        </MenuItem>
                    )}
                    {shift.status === 'active' && (
                        <MenuItem onClick={() => handleStatusChange('onHold')}>
                            <Pause sx={{ mr: 1 }} /> Put on Hold
                        </MenuItem>
                    )}
                    {shift.status === 'onHold' && (
                        <MenuItem onClick={() => handleStatusChange('active')}>
                            <PlayArrow sx={{ mr: 1 }} /> Resume
                        </MenuItem>
                    )}
                    <MenuItem onClick={() => handleStatusChange('terminated')}>
                        <Stop sx={{ mr: 1 }} /> Terminate
                    </MenuItem>
                    <MenuItem onClick={() => onDelete(shift.id)}>
                        <Delete sx={{ mr: 1 }} /> Delete
                    </MenuItem>
                </Menu>
            </Box>
        </Card>
    );
};

export default ShiftStrip;
