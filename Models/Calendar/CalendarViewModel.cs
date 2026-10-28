using System;
using System.Collections.Generic;

namespace CarCareTracker.Models
{
    public class CalendarEventItem
    {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public string VehicleName { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string DateString => Date.ToString("yyyy-MM-dd");
        public string Description { get; set; } = string.Empty;
        public string Type { get; set; } = "Reminder"; // "Reminder", "Service", "Repair", "Upgrade"
        public ReminderUrgency Urgency { get; set; } = ReminderUrgency.NotUrgent;
        public string Notes { get; set; } = string.Empty;
    }

    public class CalendarViewModel
    {
        public List<ReminderRecordViewModel> PendingReminders { get; set; } = new();
        public List<CalendarEventItem> CalendarEvents { get; set; } = new();
        public List<Vehicle> Vehicles { get; set; } = new();
    }
}
