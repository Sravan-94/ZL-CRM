import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { generateCalendarEvents } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { isWithinInterval, addHours, addMinutes } from 'date-fns';

const ReminderSystem = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    
    const checkForReminders = () => {
      // Only run for BDA users
      if (user.role !== 'bda') return;
      
      const events = generateCalendarEvents(user.id);
      const now = new Date();
      
      // Check for follow-ups due in the next hour
      const dueInHour = events.filter(event => 
        isWithinInterval(event.date, {
          start: now,
          end: addHours(now, 1)
        }) && !event.date.getTime() < now.getTime() // Not overdue
      );
      
      // Check for follow-ups due in the next 10 minutes
      const dueInTenMinutes = events.filter(event => 
        isWithinInterval(event.date, {
          start: now,
          end: addMinutes(now, 10)
        })
      );
      
      // Show toast for follow-ups due in the next 10 minutes
      dueInTenMinutes.forEach(event => {
        toast(
          <div>
            <p className="font-medium">Urgent Follow-up Reminder!</p>
            <p className="text-sm">Your follow-up with {event.title} is due in less than 10 minutes</p>
          </div>,
          {
            icon: '🔔',
            duration: 10000, // 10 seconds
            style: {
              backgroundColor: '#FFFBEB',
              color: '#92400E',
              border: '1px solid #FCD34D',
            },
          }
        );
      });
      
      // Show toast for follow-ups due in the next hour (excluding those already notified for 10 min)
      const hourNotTenMin = dueInHour.filter(hourEvent => 
        !dueInTenMinutes.some(tenMinEvent => tenMinEvent.id === hourEvent.id)
      );
      
      hourNotTenMin.forEach(event => {
        toast(
          <div>
            <p className="font-medium">Follow-up Reminder</p>
            <p className="text-sm">You have a follow-up with {event.title} in the next hour</p>
          </div>,
          {
            icon: '📅',
            duration: 5000, // 5 seconds
            style: {
              backgroundColor: '#F0F9FF',
              color: '#0C4A6E',
              border: '1px solid #BAE6FD',
            },
          }
        );
      });
    };
    
    // Check immediately on component mount
    checkForReminders();
    
    // Set up interval to check every minute
    const interval = setInterval(checkForReminders, 60000);
    
    return () => clearInterval(interval);
  }, [user]);
  
  return null; // This is a background component, no UI
};

export default ReminderSystem;