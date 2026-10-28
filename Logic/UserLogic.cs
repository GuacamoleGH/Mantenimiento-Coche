using CarCareTracker.External.Interfaces;
using CarCareTracker.Helper;
using CarCareTracker.Models;

namespace CarCareTracker.Logic
{
    public interface IUserLogic
    {
        List<UserCollaborator> GetCollaboratorsForVehicle(int vehicleId);
        bool AddUserAccessToVehicle(int userId, int vehicleId);
        bool DeleteCollaboratorFromVehicle(int userId, int vehicleId);
        OperationResponse DeleteCollaboratorFromVehicle(int vehicleId, string username);
        OperationResponse AddCollaboratorToVehicle(int vehicleId, string username);
        List<Vehicle> FilterUserVehicles(List<Vehicle> results, int userId);
        bool UserCanEditVehicle(int userId, int vehicleId, HouseholdPermission permission);
        bool UserCanDirectlyEditVehicle(int userId, int vehicleId);
        bool DeleteAllAccessToVehicle(int vehicleId);
        bool DeleteAllAccessToUser(int userId);
        List<UserHouseholdViewModel> GetHouseholdForParentUserId(int parentUserId);
        List<UserHouseholdViewModel> GetHouseholdForChildUserId(int childUserId);
        OperationResponse AddUserToHousehold(int parentUserId, string childUsername);
        bool UpdateUserHousehold(int parentUserId, int childUserId, List<HouseholdPermission> permissions);
        bool DeleteUserFromHousehold(int parentUserId, int childUserId);
        bool DeleteAllHouseholdByParentUserId(int parentUserId);
        bool DeleteAllHouseholdByChildUserId(int childUserId);
        OperationResponse CreateAPIKey(int userId, string keyName, List<HouseholdPermission> permisions);
        List<APIKey> GetAPIKeysByUserId(int userId);
        List<HouseholdPermission> GetAPIKeyPermissions(string apiKey);
        bool DeleteAPIKeyByKeyIdAndUserId(int keyId, int userId);
        bool DeleteAllAPIKeysByUserId(int userId);
        List<UserData> GetAllUsers();
        int GetVehicleOwnerUserId(int vehicleId);
        bool SetVehicleOwner(int vehicleId, int newOwnerUserId);
        int ClaimOrphanVehicles(int targetUserId);
        UserData GetUserRecordById(int userId);
    }
    public class UserLogic: IUserLogic
    {
        private readonly IUserAccessDataAccess _userAccess;
        private readonly IUserRecordDataAccess _userData;
        private readonly IUserHouseholdDataAccess _userHouseholdData;
        private readonly IApiKeyRecordDataAccess _apiKeyData;
        private readonly IVehicleDataAccess _vehicleData;
        public UserLogic(IUserAccessDataAccess userAccess,
            IUserRecordDataAccess userData,
            IUserHouseholdDataAccess userHouseholdData,
            IApiKeyRecordDataAccess apiKeyData,
            IVehicleDataAccess vehicleData) { 
            _userAccess = userAccess;
            _userData = userData;
            _userHouseholdData = userHouseholdData;
            _apiKeyData = apiKeyData;
            _vehicleData = vehicleData;
        }
        public List<UserCollaborator> GetCollaboratorsForVehicle(int vehicleId)
        {
            var result = _userAccess.GetUserAccessByVehicleId(vehicleId);
            var convertedResult = new List<UserCollaborator>();
            //convert useraccess to usercollaborator
            foreach(UserAccess userAccess in result)
            {
                var userCollaborator = new UserCollaborator
                {
                    UserName = _userData.GetUserRecordById(userAccess.Id.UserId).UserName,
                    UserVehicle = userAccess.Id
                };
                convertedResult.Add(userCollaborator);
            }
            return convertedResult;
        }
        public OperationResponse AddCollaboratorToVehicle(int vehicleId, string username)
        {
            //try to find existing user.
            var existingUser = _userData.GetUserRecordByUserName(username);
            if (existingUser.Id != default)
            {
                //user exists.
                //check if user is already a collaborator
                var userAccess = _userAccess.GetUserAccessByVehicleAndUserId(existingUser.Id, vehicleId);
                if (userAccess != null)
                {
                    return OperationResponse.Failed("User is already a collaborator");
                }
                var result = AddUserAccessToVehicle(existingUser.Id, vehicleId);
                if (result)
                {
                    return OperationResponse.Succeed("Collaborator Added");
                }
                return OperationResponse.Failed();
            }
            return OperationResponse.Failed($"Unable to find user {username} in the system");
        }
        public OperationResponse DeleteCollaboratorFromVehicle(int vehicleId, string username)
        {
            //try to find existing user.
            var existingUser = _userData.GetUserRecordByUserName(username);
            if (existingUser.Id != default)
            {
                //user exists.
                //check if user is already a collaborator
                var userAccess = _userAccess.GetUserAccessByVehicleAndUserId(existingUser.Id, vehicleId);
                if (userAccess == null)
                {
                    return OperationResponse.Failed("User doesn't have access to this vehicle");
                }
                var result = _userAccess.DeleteUserAccess(existingUser.Id, vehicleId);
                if (result)
                {
                    return OperationResponse.Succeed("Collaborator Removed");
                }
                return OperationResponse.Failed();
            }
            return OperationResponse.Failed($"Unable to find user {username} in the system");
        }
        public bool DeleteCollaboratorFromVehicle(int userId, int vehicleId)
        {
            var result = _userAccess.DeleteUserAccess(userId, vehicleId);
            return result;
        }
        public bool AddUserAccessToVehicle(int userId, int vehicleId)
        {
            if (userId == -1)
            {
                return true;
            }
            var userVehicle = new UserVehicle { UserId = userId, VehicleId = vehicleId };
            var userAccess = new UserAccess { Id = userVehicle };
            var result = _userAccess.SaveUserAccess(userAccess);
            return result;
        }
        public List<Vehicle> FilterUserVehicles(List<Vehicle> results, int userId)
        {
            if (userId == -1)
            {
                return results;
            }
            var user = _userData.GetUserRecordById(userId);
            bool isAdmin = user != null && (user.IsAdmin || user.IsRootUser);

            return results.Where(v => v.IsPublic || isAdmin || v.OwnerUserId == userId || UserCanDirectlyEditVehicle(userId, v.Id)).ToList();
        }
        public bool UserCanEditVehicle(int userId, int vehicleId, HouseholdPermission permission)
        {
            if (userId == -1)
            {
                return true;
            }
            var user = _userData.GetUserRecordById(userId);
            if (user != null && (user.IsAdmin || user.IsRootUser))
            {
                return true;
            }
            if (UserCanDirectlyEditVehicle(userId, vehicleId))
            {
                return true;
            }
            if (permission == HouseholdPermission.View)
            {
                var vehicle = _vehicleData.GetVehicleById(vehicleId);
                if (vehicle != null && vehicle.IsPublic)
                {
                    return true;
                }
            }
            var userHouseholds = _userHouseholdData.GetUserHouseholdByChildUserId(userId);
            foreach (UserHousehold userHousehold in userHouseholds)
            {
                var userAccess = _userAccess.GetUserAccessByVehicleAndUserId(userHousehold.Id.ParentUserId, vehicleId);
                if (userAccess != null && userAccess.Id.UserId == userHousehold.Id.ParentUserId && userAccess.Id.VehicleId == vehicleId)
                {
                    if (userHousehold.Permissions.Contains(permission))
                    {
                        return true;
                    }
                }
            }
            return false;
        }
        public bool UserCanDirectlyEditVehicle(int userId, int vehicleId)
        {
            if (userId == -1)
            {
                return true;
            }
            var user = _userData.GetUserRecordById(userId);
            if (user != null && (user.IsAdmin || user.IsRootUser))
            {
                return true;
            }
            var vehicle = _vehicleData.GetVehicleById(vehicleId);
            if (vehicle != null && vehicle.OwnerUserId == userId)
            {
                return true;
            }
            var userAccess = _userAccess.GetUserAccessByVehicleAndUserId(userId, vehicleId);
            if (userAccess != null && userAccess.Id.UserId == userId && userAccess.Id.VehicleId == vehicleId)
            {
                return true;
            }
            return false;
        }
        public bool DeleteAllAccessToVehicle(int vehicleId)
        {
            var result = _userAccess.DeleteAllAccessRecordsByVehicleId(vehicleId);
            return result;
        }
        public bool DeleteAllAccessToUser(int userId)
        {
            var result = _userAccess.DeleteAllAccessRecordsByUserId(userId);
            return result;
        }
        public List<UserHouseholdViewModel> GetHouseholdForParentUserId(int parentUserId)
        {
            var result = _userHouseholdData.GetUserHouseholdByParentUserId(parentUserId);
            var convertedResult = new List<UserHouseholdViewModel>();
            //convert userhousehold to viewmodel
            foreach (UserHousehold userHouseholdAccess in result)
            {
                var userCollaborator = new UserHouseholdViewModel
                {
                    UserName = _userData.GetUserRecordById(userHouseholdAccess.Id.ChildUserId).UserName,
                    UserHousehold = userHouseholdAccess
                };
                convertedResult.Add(userCollaborator);
            }
            return convertedResult;
        }
        public List<UserHouseholdViewModel> GetHouseholdForChildUserId(int childUserId)
        {
            var result = _userHouseholdData.GetUserHouseholdByChildUserId(childUserId);
            var convertedResult = new List<UserHouseholdViewModel>();
            //convert userhousehold to viewmodel
            foreach (UserHousehold userHouseholdAccess in result)
            {
                var userCollaborator = new UserHouseholdViewModel
                {
                    UserName = _userData.GetUserRecordById(userHouseholdAccess.Id.ParentUserId).UserName,
                    UserHousehold = userHouseholdAccess
                };
                convertedResult.Add(userCollaborator);
            }
            return convertedResult;
        }
        public OperationResponse AddUserToHousehold(int parentUserId, string childUsername)
        {
            //attempting to add to root user
            if (parentUserId == -1)
            {
                return OperationResponse.Failed("Root user household not allowed");
            }
            //try to find existing user.
            var existingUser = _userData.GetUserRecordByUserName(childUsername);
            if (existingUser.Id != default)
            {
                //user exists.
                //check if user is trying to add themselves
                if (parentUserId == existingUser.Id)
                {
                    return OperationResponse.Failed("Cannot add user to their own household");
                }
                //check if user already belongs to the household
                var householdAccess = _userHouseholdData.GetUserHouseholdByParentAndChildUserId(parentUserId, existingUser.Id);
                if (householdAccess != null && householdAccess.Id.ChildUserId == existingUser.Id && householdAccess.Id.ParentUserId == parentUserId)
                {
                    return OperationResponse.Failed("User already belongs to this household");
                }
                //check if a circular dependency will exist
                var circularHouseholdAccess = _userHouseholdData.GetUserHouseholdByParentAndChildUserId(existingUser.Id, parentUserId);
                if (circularHouseholdAccess != null && circularHouseholdAccess.Id.ChildUserId == parentUserId && circularHouseholdAccess.Id.ParentUserId == existingUser.Id)
                {
                    return OperationResponse.Failed("Circular dependency is not allowed");
                }
                var result = _userHouseholdData.SaveUserHousehold(new UserHousehold { Id = new HouseholdAccess { ParentUserId = parentUserId, ChildUserId = existingUser.Id} });
                if (result)
                {
                    return OperationResponse.Succeed("User Added to Household");
                }
                return OperationResponse.Failed();
            }
            return OperationResponse.Failed($"Unable to find user {childUsername} in the system");
        }
        public bool UpdateUserHousehold(int parentUserId, int childUserId, List<HouseholdPermission> permissions)
        {
            var existingHousehold = _userHouseholdData.GetUserHouseholdByParentAndChildUserId(parentUserId, childUserId);
            if (existingHousehold != null && existingHousehold.Id.ChildUserId == childUserId && existingHousehold.Id.ParentUserId == parentUserId)
            {
                existingHousehold.Permissions = permissions;
                var result = _userHouseholdData.SaveUserHousehold(existingHousehold);
                return result;
            }
            return false;
        }
        public bool DeleteUserFromHousehold(int parentUserId, int childUserId)
        {
            var result = _userHouseholdData.DeleteUserHousehold(parentUserId, childUserId);
            return result;
        }
        public bool DeleteAllHouseholdByParentUserId(int parentUserId)
        {
            var result = _userHouseholdData.DeleteAllHouseholdRecordsByParentUserId(parentUserId);
            return result;
        }
        public bool DeleteAllHouseholdByChildUserId(int childUserId)
        {
            var result = _userHouseholdData.DeleteAllHouseholdRecordsByChildUserId(childUserId);
            return result;
        }
        public OperationResponse CreateAPIKey(int userId, string keyName, List<HouseholdPermission> permisions)
        {
            //check if user already has an API key by that name.
            var existingApiKeys = _apiKeyData.GetAPIKeyRecordsByUserId(userId);
            if (existingApiKeys.Any(x=>x.Name.ToLower() == keyName.ToLower()))
            {
                return OperationResponse.Failed("An API Key with that name already exists");
            }
            //generate key pair
            var unhashedKey = Guid.NewGuid().ToString().Replace("-", string.Empty);
            var hashedKey = StaticHelper.GetHash(unhashedKey);
            var keyToSave = new APIKey
            {
                UserId = userId,
                Name = keyName,
                Permissions = permisions,
                Key = hashedKey
            };
            var result = _apiKeyData.SaveAPIKey(keyToSave);
            if (result && keyToSave.Id != default)
            {
                return OperationResponse.Succeed("API Key Created", new {apiKey = unhashedKey});
            }
            return OperationResponse.Failed("Unable to create API Key");
        }
        public List<APIKey> GetAPIKeysByUserId(int userId)
        {
            var result = _apiKeyData.GetAPIKeyRecordsByUserId(userId);
            return result;
        }
        public List<HouseholdPermission> GetAPIKeyPermissions(string apiKey)
        {
            var hashedKey = StaticHelper.GetHash(apiKey);
            var existingKey = _apiKeyData.GetAPIKeyByKey(hashedKey);
            if (existingKey.Id != default)
            {
                return existingKey.Permissions;
            }
            return new List<HouseholdPermission>();
        }
        public bool DeleteAPIKeyByKeyIdAndUserId(int keyId, int userId)
        {
            var existingKey = _apiKeyData.GetAPIKeyById(keyId);
            if (existingKey.Id != default && existingKey.UserId == userId)
            {
                var result = _apiKeyData.DeleteAPIKeyById(keyId);
                return result;
            }
            return false;
        }
        public bool DeleteAllAPIKeysByUserId(int userId)
        {
            var result = _apiKeyData.DeleteAllAPIKeysByUserId(userId);
            return result;
        }
        public List<UserData> GetAllUsers()
        {
            return _userData.GetUsers();
        }
        public int GetVehicleOwnerUserId(int vehicleId)
        {
            var accesses = _userAccess.GetUserAccessByVehicleId(vehicleId);
            if (accesses != null && accesses.Any())
            {
                return accesses.First().Id.UserId;
            }
            return -1;
        }
        public bool SetVehicleOwner(int vehicleId, int newOwnerUserId)
        {
            _userAccess.DeleteAllAccessRecordsByVehicleId(vehicleId);
            if (newOwnerUserId > 0)
            {
                return AddUserAccessToVehicle(newOwnerUserId, vehicleId);
            }
            return true;
        }
        public int ClaimOrphanVehicles(int targetUserId)
        {
            if (targetUserId <= 0) return 0;
            var allVehicles = _vehicleData.GetVehicles();
            int claimed = 0;
            foreach (var vehicle in allVehicles)
            {
                var accesses = _userAccess.GetUserAccessByVehicleId(vehicle.Id);
                if (accesses == null || !accesses.Any())
                {
                    AddUserAccessToVehicle(targetUserId, vehicle.Id);
                    claimed++;
                }
            }
            return claimed;
        }
        public UserData GetUserRecordById(int userId)
        {
            return _userData.GetUserRecordById(userId);
        }
    }
}