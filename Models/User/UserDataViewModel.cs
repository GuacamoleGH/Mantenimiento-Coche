namespace CarCareTracker.Models
{
    public class UserDataViewModel: UserData
    {
        public bool CanResetPassword { get; set; } = true;
        public bool IsSmtpConfigured { get; set; } = false;
    }
}