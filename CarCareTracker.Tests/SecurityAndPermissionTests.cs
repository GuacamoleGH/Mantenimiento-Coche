using Xunit;
using CarCareTracker.Helper;
using CarCareTracker.Logic;
using CarCareTracker.Models;
using Moq;
using System.Collections.Generic;
using CarCareTracker.External.Interfaces;

namespace CarCareTracker.Tests
{
    public class SecurityAndPermissionTests
    {
        [Theory]
        [InlineData("Valid1@Pass", true)]
        [InlineData("Admin2026!", true)]
        [InlineData("short1!", false)]              // Less than 8 chars
        [InlineData("nouppercase123!", false)]      // Missing uppercase
        [InlineData("NOLOWERCASE123!", false)]      // Missing lowercase
        [InlineData("NoSpecialNumber1", false)]     // Missing special char
        [InlineData("NoNumberSpec!", false)]        // Missing number
        public void ValidatePasswordComplexity_EnforcesRules(string password, bool expectedSuccess)
        {
            var result = StaticHelper.ValidatePasswordComplexity(password);
            Assert.Equal(expectedSuccess, result.Success);
        }

        [Fact]
        public void Vehicle_OwnerCanDirectlyEdit_NonOwnerCannot()
        {
            // Arrange mocks
            var mockUserAccess = new Mock<IUserAccessDataAccess>();
            var mockUserData = new Mock<IUserRecordDataAccess>();
            var mockHousehold = new Mock<IUserHouseholdDataAccess>();
            var mockApiKey = new Mock<IApiKeyRecordDataAccess>();
            var mockVehicleData = new Mock<IVehicleDataAccess>();

            int ownerId = 10;
            int nonOwnerId = 20;
            int vehicleId = 100;

            var vehicle = new Vehicle
            {
                Id = vehicleId,
                OwnerUserId = ownerId,
                IsPublic = false
            };

            mockVehicleData.Setup(x => x.GetVehicleById(vehicleId)).Returns(vehicle);
            mockUserData.Setup(x => x.GetUserRecordById(ownerId)).Returns(new UserData { Id = ownerId, IsAdmin = false });
            mockUserData.Setup(x => x.GetUserRecordById(nonOwnerId)).Returns(new UserData { Id = nonOwnerId, IsAdmin = false });

            var userLogic = new UserLogic(
                mockUserAccess.Object,
                mockUserData.Object,
                mockHousehold.Object,
                mockApiKey.Object,
                mockVehicleData.Object
            );

            // Act & Assert
            // 1. Propietario tiene permiso directo
            Assert.True(userLogic.UserCanDirectlyEditVehicle(ownerId, vehicleId));

            // 2. No propietario no tiene permiso directo
            Assert.False(userLogic.UserCanDirectlyEditVehicle(nonOwnerId, vehicleId));
        }

        [Fact]
        public void AdminRole_HasFullAccessToVehicles()
        {
            var mockUserAccess = new Mock<IUserAccessDataAccess>();
            var mockUserData = new Mock<IUserRecordDataAccess>();
            var mockHousehold = new Mock<IUserHouseholdDataAccess>();
            var mockApiKey = new Mock<IApiKeyRecordDataAccess>();
            var mockVehicleData = new Mock<IVehicleDataAccess>();

            int adminUserId = 99;
            int vehicleId = 100;

            var vehicle = new Vehicle { Id = vehicleId, OwnerUserId = 1, IsPublic = false };

            mockVehicleData.Setup(x => x.GetVehicleById(vehicleId)).Returns(vehicle);
            mockUserData.Setup(x => x.GetUserRecordById(adminUserId)).Returns(new UserData { Id = adminUserId, IsAdmin = true });

            var userLogic = new UserLogic(
                mockUserAccess.Object,
                mockUserData.Object,
                mockHousehold.Object,
                mockApiKey.Object,
                mockVehicleData.Object
            );

            // El usuario admin puede editar directamente aunque no sea el creador
            Assert.True(userLogic.UserCanDirectlyEditVehicle(adminUserId, vehicleId));
            Assert.True(userLogic.UserCanEditVehicle(adminUserId, vehicleId, HouseholdPermission.Edit));
        }

        [Fact]
        public void PublicVehicle_AllowsView_BlocksEditForNonOwner()
        {
            var mockUserAccess = new Mock<IUserAccessDataAccess>();
            var mockUserData = new Mock<IUserRecordDataAccess>();
            var mockHousehold = new Mock<IUserHouseholdDataAccess>();
            var mockApiKey = new Mock<IApiKeyRecordDataAccess>();
            var mockVehicleData = new Mock<IVehicleDataAccess>();

            int strangerUserId = 55;
            int vehicleId = 200;

            var publicVehicle = new Vehicle { Id = vehicleId, OwnerUserId = 1, IsPublic = true };

            mockVehicleData.Setup(x => x.GetVehicleById(vehicleId)).Returns(publicVehicle);
            mockUserData.Setup(x => x.GetUserRecordById(strangerUserId)).Returns(new UserData { Id = strangerUserId, IsAdmin = false });
            mockHousehold.Setup(x => x.GetUserHouseholdByChildUserId(strangerUserId)).Returns(new List<UserHousehold>());

            var userLogic = new UserLogic(
                mockUserAccess.Object,
                mockUserData.Object,
                mockHousehold.Object,
                mockApiKey.Object,
                mockVehicleData.Object
            );

            // Coche público permite Ver (View)
            Assert.True(userLogic.UserCanEditVehicle(strangerUserId, vehicleId, HouseholdPermission.View));

            // Coche público NO permite Editar (Edit) a extraños
            Assert.False(userLogic.UserCanEditVehicle(strangerUserId, vehicleId, HouseholdPermission.Edit));
            Assert.False(userLogic.UserCanDirectlyEditVehicle(strangerUserId, vehicleId));
        }
    }
}
