import { FC, useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';
import { Add } from '@mui/icons-material';
import { Shift } from '../types/types';

interface ControlPanelProps {
    onCreateShift: (shift: Omit<Shift, 'id' | 'status'>) => void;
    lastShiftEndTime: Date;
}

const ControlPanel: FC<ControlPanelProps> = ({ onCreateShift, lastShiftEndTime }) => {
    const [open, setOpen] = useState(false);
    const [newShift, setNewShift] = useState({
        particulars: '',
        duration: 1,
        notes: '',
        startTime: lastShiftEndTime,
    });

    useEffect(() => {
        setNewShift(prev => ({
            ...prev,
            startTime: lastShiftEndTime
        }));
    }, [lastShiftEndTime]);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleCreate = () => {
        const endTime = new Date(newShift.startTime);
        endTime.setHours(endTime.getHours() + newShift.duration);

        onCreateShift({
            particulars: newShift.particulars,
            startTime: new Date(newShift.startTime),
            endTime,
            notes: newShift.notes,
            duration: newShift.duration
        });

        setNewShift({
            particulars: '',
            duration: 1,
            notes: '',
            startTime: endTime,
        });
        handleClose();
    };

    return (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleOpen}
            >
                Create New Shift
            </Button>

            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Create New Shift</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        margin="dense"
                        label="Particulars"
                        value={newShift.particulars}
                        onChange={(e) => setNewShift({ ...newShift, particulars: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        margin="dense"
                        label="Duration (hours)"
                        type="number"
                        value={newShift.duration}
                        onChange={(e) => setNewShift({ ...newShift, duration: Number(e.target.value) })}
                        inputProps={{ min: 1 }}
                    />
                    <TextField
                        fullWidth
                        margin="dense"
                        label="Start Time"
                        type="datetime-local"
                        value={formatDateTime(newShift.startTime)}
                        onChange={(e) => setNewShift({ ...newShift, startTime: new Date(e.target.value) })}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        fullWidth
                        margin="dense"
                        label="Notes"
                        multiline
                        rows={4}
                        value={newShift.notes}
                        onChange={(e) => setNewShift({ ...newShift, notes: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleCreate} variant="contained" color="primary">
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

const formatDateTime = (date: Date) => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
};

export default ControlPanel;
