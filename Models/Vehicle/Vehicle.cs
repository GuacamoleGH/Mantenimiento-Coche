using System.Text.Json.Serialization;

namespace CarCareTracker.Models
{
    public class Vehicle
    {
        public int Id { get; set; }
        public string ImageLocation { get; set; } = "/defaults/noimage.png";
        public string MapLocation { get; set; } = "";
        public int Year { get; set; }
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string LicensePlate { get; set; } = string.Empty;
        [JsonConverter(typeof(FromDateOptional))]
        public string PurchaseDate { get; set; } = string.Empty;
        [JsonConverter(typeof(FromDateOptional))]
        public string SoldDate { get; set; } = string.Empty;
        public decimal PurchasePrice { get; set; }
        public decimal SoldPrice { get; set; }
        public bool IsElectric { get; set; } = false;
        public bool IsDiesel { get; set; } = false;
        public bool UseHours { get; set; } = false;
        public bool OdometerOptional { get; set; } = false;
        public List<ExtraField> ExtraFields { get; set; } = new List<ExtraField>();
        public List<string> Tags { get; set; } = new List<string>();
        public bool HasOdometerAdjustment { get; set; } = false;
        /// <summary>
        /// Primarily used for vehicles with odometer units different from user's settings.
        /// </summary>
        [JsonConverter(typeof(FromDecimalOptional))]
        public string OdometerMultiplier { get; set; } = "1";
        /// <summary>
        /// Primarily used for vehicles where the odometer does not reflect actual mileage.
        /// </summary>
        [JsonConverter(typeof(FromIntOptional))]
        public string OdometerDifference { get; set; } = "0";
        public List<DashboardMetric> DashboardMetrics { get; set; } = new List<DashboardMetric>();
        /// <summary>
        /// Determines what is displayed in place of the license plate.
        /// </summary>
        public string VehicleIdentifier { get; set; } = "LicensePlate";

        // --- Ficha Técnica Extendida y Plazos Legales (España) ---
        public string Vin { get; set; } = string.Empty;
        public string EngineCode { get; set; } = string.Empty;
        public string EngineOil { get; set; } = string.Empty;
        public string SparkPlugs { get; set; } = string.Empty;
        public string TyreSizes { get; set; } = string.Empty;

        [JsonConverter(typeof(FromDateOptional))]
        public string ItvExpiry { get; set; } = string.Empty;

        [JsonConverter(typeof(FromDateOptional))]
        public string InsuranceExpiry { get; set; } = string.Empty;
        public string InsuranceCompany { get; set; } = string.Empty;

        /// <summary>
        /// Visibilidad del vehículo: false = Privado (solo dueño/colaboradores), true = Público (otros usuarios pueden verlo en modo lectura).
        /// </summary>
        public bool IsPublic { get; set; } = false;
    }
}
