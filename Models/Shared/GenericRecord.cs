using CarCareTracker.Helper;

namespace CarCareTracker.Models
{
    public class GenericRecord
    {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public DateTime Date { get; set; }
        public int Mileage { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Cost { get; set; }
        public string Notes { get; set; } = string.Empty;
        public List<UploadedFiles> Files { get; set; } = new List<UploadedFiles>();
        private List<string> _tags = new List<string>();
        public List<string> Tags 
        { 
            get => _tags; 
            set => _tags = StaticHelper.NormalizeTags(value); 
        }
        public List<ExtraField> ExtraFields { get; set; } = new List<ExtraField>();
        public List<SupplyUsageHistory> RequisitionHistory { get; set; } = new List<SupplyUsageHistory>();
        public List<string> ServiceTypes { get; set; } = new List<string>();
    }
}
