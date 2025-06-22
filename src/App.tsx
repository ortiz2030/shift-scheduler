import { useState, useEffect } from 'react';
import { Container, Box, Typography, CircularProgress } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import ShiftStrip from './components/ShiftStrip';
import ControlPanel from './components/ControlPanel';
import { Shift } from './types/types';
import { dbService } from './services/database';

function App() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load shifts from database on component mount
  useEffect(() => {
    let mounted = true;

    const loadShifts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadedShifts = await dbService.getAllShifts();
        if (mounted) {
          setShifts(loadedShifts);
        }
      } catch (error) {
        console.error('Error loading shifts:', error);
        if (mounted) {
          setError('Failed to load shifts. Please refresh the page.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadShifts();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const checkCompletedShifts = async () => {
      const now = new Date();
      let hasChanges = false;
      let nextScheduledShift: Shift | null = null;

      // First, check for completed shifts and find the next scheduled shift
      const updatedShifts = shifts.map(shift => {
        if (shift.status === 'active' && new Date(shift.endTime) <= now) {
          hasChanges = true;
          return { ...shift, status: 'completed' as const };
        }
        if (shift.status === 'scheduled' && !nextScheduledShift) {
          nextScheduledShift = shift;
        }
        return shift;
      });

      // If we have changes and found a next scheduled shift, activate it
      if (hasChanges && nextScheduledShift) {
        const finalShifts = updatedShifts.map(shift => {
          if (shift.id === nextScheduledShift!.id) {
            const duration = shift.duration;
            return {
              ...shift,
              status: 'active' as const,
              startTime: now,
              endTime: new Date(now.getTime() + duration * 3600000)
            };
          }
          return shift;
        });

        // Update database and state
        try {
          for (const shift of finalShifts) {
            await dbService.updateShift(shift);
          }
          setShifts(finalShifts);
        } catch (error) {
          console.error('Error updating shifts:', error);
        }
      } else if (hasChanges) {
        try {
          for (const shift of updatedShifts) {
            await dbService.updateShift(shift);
          }
          setShifts(updatedShifts);
        } catch (error) {
          console.error('Error updating shifts:', error);
        }
      }
    };

    const interval = setInterval(checkCompletedShifts, 1000);
    return () => clearInterval(interval);
  }, [shifts]);

  const handleCreateShift = async (shiftData: Omit<Shift, 'id' | 'status'>) => {
    const duration = (shiftData.endTime.getTime() - shiftData.startTime.getTime()) / 3600000;
    const newShift: Shift = {
      ...shiftData,
      id: uuidv4(),
      status: 'scheduled',
      duration
    };
    try {
      await dbService.createShift(newShift);
      setShifts(prev => [...prev, newShift]);
    } catch (error) {
      console.error('Error creating shift:', error);
    }
  };

  const handleStatusChange = async (id: string, status: Shift['status']) => {
    try {
      const updatedShifts = shifts.map(shift => {
        if (shift.id === id) {
          if (status === 'active' && shift.status === 'scheduled') {
            const now = new Date();
            const duration = shift.duration;
            return {
              ...shift,
              status,
              startTime: now,
              endTime: new Date(now.getTime() + duration * 3600000)
            };
          }
          return { ...shift, status };
        }
        return shift;
      });

      for (const shift of updatedShifts) {
        if (shift.id === id) {
          await dbService.updateShift(shift);
        }
      }
      setShifts(updatedShifts);
    } catch (error) {
      console.error('Error updating shift status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dbService.deleteShift(id);
      setShifts(prev => prev.filter(shift => shift.id !== id));
    } catch (error) {
      console.error('Error deleting shift:', error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      try {
        const oldIndex = shifts.findIndex(shift => shift.id === active.id);
        const newIndex = shifts.findIndex(shift => shift.id === over.id);
        
        const newShifts = [...shifts];
        const [movedShift] = newShifts.splice(oldIndex, 1);
        newShifts.splice(newIndex, 0, movedShift);

        // Recalculate times for all shifts
        const updatedShifts = newShifts.map((shift, index) => {
          if (index === 0) {
            return shift;
          }
          const prevShift = newShifts[index - 1];
          const newStartTime = new Date(prevShift.endTime);
          const newEndTime = new Date(newStartTime.getTime() + shift.duration * 3600000);
          return {
            ...shift,
            startTime: newStartTime,
            endTime: newEndTime
          };
        });

        // Update all shifts in the database
        for (const shift of updatedShifts) {
          await dbService.updateShift(shift);
        }
        setShifts(updatedShifts);
      } catch (error) {
        console.error('Error updating shifts after drag:', error);
      }
    }
  };

  const handleUpdate = async (updatedShift: Shift) => {
    try {
      await dbService.updateShift(updatedShift);
      setShifts(prev =>
        prev.map(shift =>
          shift.id === updatedShift.id ? updatedShift : shift
        )
      );
    } catch (error) {
      console.error('Error updating shift:', error);
    }
  };

  // Sort shifts: active first, then scheduled, then completed
  const sortedShifts = [...shifts].sort((a, b) => {
    const statusOrder = { active: 0, scheduled: 1, completed: 2, onHold: 3, terminated: 4 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  if (isLoading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>Loading shifts...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">{error}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Shift Scheduler
        </Typography>
        <ControlPanel 
          onCreateShift={handleCreateShift} 
          lastShiftEndTime={shifts.length > 0 ? shifts[shifts.length - 1].endTime : new Date()} 
        />
        <Box sx={{ mt: 3 }}>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortedShifts.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {sortedShifts.map(shift => (
                <ShiftStrip
                  key={shift.id}
                  shift={shift}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                  onMove={async (id: string, newStartTime: Date) => {
                    const shiftToUpdate = shifts.find(s => s.id === id);
                    if (shiftToUpdate) {
                      const duration = shiftToUpdate.duration;
                      const updatedShift = {
                        ...shiftToUpdate,
                        startTime: newStartTime,
                        endTime: new Date(newStartTime.getTime() + duration * 3600000)
                      };
                      await handleUpdate(updatedShift);
                    }
                  }}
                />
              ))}
            </SortableContext>
          </DndContext>
        </Box>
      </Box>
    </Container>
  );
}

export default App;
