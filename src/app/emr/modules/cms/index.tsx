import { StaffAttendanceAnalytics } from './attendance-analytics';

export function CMSPage() {
  return (
    <div className="h-full">
      <StaffAttendanceAnalytics />
    </div>
  );
}

// Export the attendance analytics component for direct use
export { StaffAttendanceAnalytics } from './attendance-analytics';
