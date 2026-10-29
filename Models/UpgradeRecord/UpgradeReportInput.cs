using CarCareTracker.Helper;

namespace CarCareTracker.Models
{
    public class UpgradeRecordInput
    {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public List<int> ReminderRecordId { get; set; } = new List<int>();
        public string Date { get; set; } = DateTime.Now.ToShortDateString();
        public int Mileage { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Cost { get; set; }
        public string Notes { get; set; } = string.Empty;
        public List<UploadedFiles> Files { get; set; } = new List<UploadedFiles>();
        public List<SupplyUsage> Supplies { get; set; } = new List<SupplyUsage>();
        private List<string> _tags = new List<string>();
        public List<string> Tags 
        { 
            get => _tags; 
            set => _tags = StaticHelper.NormalizeTags(value); 
        }
        public List<ExtraField> ExtraFields { get; set; } = new List<ExtraField>();
        public List<SupplyUsageHistory> RequisitionHistory { get; set; } = new List<SupplyUsageHistory>();
        public List<SupplyUsageHistory> DeletedRequisitionHistory { get; set; } = new List<SupplyUsageHistory>();
        public bool CopySuppliesAttachment { get; set; } = false;
        public UpgradeRecord ToUpgradeRecord()
        {
            return new UpgradeRecord
            {
                Id = Id,
                VehicleId = VehicleId,
                Date = DateTime.Parse(string.IsNullOrWhiteSpace(Date) ? DateTime.Now.ToShortDateString() : Date),
                Cost = Cost,
                Mileage = Mileage,
                Description = Description,
                Notes = Notes,
                Files = Files,
                Tags = Tags,
                ExtraFields = ExtraFields,
                RequisitionHistory = RequisitionHistory
            };
        }
    }
}
