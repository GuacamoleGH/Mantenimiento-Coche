namespace CarCareTracker.Models
{
    public class SocialAuthConfig
    {
        public bool Enabled { get; set; } = false;
        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
    }
}
