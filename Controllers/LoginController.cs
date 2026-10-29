using CarCareTracker.Helper;
using CarCareTracker.Logic;
using CarCareTracker.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;

namespace CarCareTracker.Controllers
{
    public class LoginController : Controller
    {
        private IDataProtector _dataProtector;
        private ILoginLogic _loginLogic;
        private IConfigHelper _config;
        private readonly ITranslationHelper _translator;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<LoginController> _logger;
        public LoginController(
            ILogger<LoginController> logger,
            IDataProtectionProvider securityProvider,
            ILoginLogic loginLogic,
            IConfigHelper config,
            ITranslationHelper translator,
            IHttpClientFactory httpClientFactory
            )
        {
            _dataProtector = securityProvider.CreateProtector("login");
            _logger = logger;
            _loginLogic = loginLogic;
            _config = config;
            _translator = translator;
            _httpClientFactory = httpClientFactory;
        }
        public IActionResult Index(string redirectURL = "", string redirectURLBase64 = "")
        {
            var remoteAuthConfig = _config.GetOpenIDConfig();
            if (remoteAuthConfig.DisableRegularLogin && !string.IsNullOrWhiteSpace(remoteAuthConfig.LogOutURL))
            {
                //OIDC login flow
                var generatedState = Guid.NewGuid().ToString().Substring(0, 8);
                remoteAuthConfig.State = generatedState;
                var pkceKeyPair = _loginLogic.GetPKCEChallengeCode();
                remoteAuthConfig.CodeChallenge = pkceKeyPair.Value;
                if (remoteAuthConfig.ValidateState)
                {
                    Response.Cookies.Append("OIDC_STATE", remoteAuthConfig.State, new CookieOptions { Expires = new DateTimeOffset(DateTime.Now.AddMinutes(5)) });
                }
                if (remoteAuthConfig.UsePKCE)
                {
                    Response.Cookies.Append("OIDC_VERIFIER", pkceKeyPair.Key, new CookieOptions { Expires = new DateTimeOffset(DateTime.Now.AddMinutes(5)) });
                }
                if (!string.IsNullOrWhiteSpace(redirectURLBase64))
                {
                    Response.Cookies.Append("OIDC_REDIRECTURL", redirectURLBase64, new CookieOptions { Expires = new DateTimeOffset(DateTime.Now.AddMinutes(5)) });
                }
                var remoteAuthURL = remoteAuthConfig.RemoteAuthURL;
                return Redirect(remoteAuthURL);
            }
            //regular login flow
            if (!string.IsNullOrWhiteSpace(redirectURLBase64))
            {
                try
                {
                    redirectURL = Encoding.UTF8.GetString(Convert.FromBase64String(redirectURLBase64));
                }
                catch
                {
                    redirectURL = string.Empty;
                }
            }
            return View(model: redirectURL);
        }
        public IActionResult Registration(string token = "", string email = "")
        {
            if (_config.GetServerDisabledRegistration())
            {
                return RedirectToAction("Index");
            }
            var remoteAuthConfig = _config.GetOpenIDConfig();
            if (remoteAuthConfig.DisableRegularLogin && !string.IsNullOrWhiteSpace(remoteAuthConfig.LogOutURL))
            {
                return RedirectToAction("Index");
            }
            var viewModel = new LoginModel
            {
                EmailAddress = string.IsNullOrWhiteSpace(email) ? string.Empty : email,
                Token = string.IsNullOrWhiteSpace(token) ? string.Empty : token
            };
            return View(viewModel);
        }
        public IActionResult ForgotPassword()
        {
            var remoteAuthConfig = _config.GetOpenIDConfig();
            if (remoteAuthConfig.DisableRegularLogin && !string.IsNullOrWhiteSpace(remoteAuthConfig.LogOutURL))
            {
                return RedirectToAction("Index");
            }
            return View();
        }
        public IActionResult ResetPassword(string token = "", string email = "")
        {
            var remoteAuthConfig = _config.GetOpenIDConfig();
            if (remoteAuthConfig.DisableRegularLogin && !string.IsNullOrWhiteSpace(remoteAuthConfig.LogOutURL))
            {
                return RedirectToAction("Index");
            }
            var viewModel = new LoginModel
            {
                EmailAddress = string.IsNullOrWhiteSpace(email) ? string.Empty : email,
                Token = string.IsNullOrWhiteSpace(token) ? string.Empty : token
            };
            return View(viewModel);
        }
        public IActionResult GetRemoteLoginLink(string redirectURLBase64)
        {
            var remoteAuthConfig = _config.GetOpenIDConfig();
            var generatedState = Guid.NewGuid().ToString().Substring(0, 8);
            remoteAuthConfig.State = generatedState;
            var pkceKeyPair = _loginLogic.GetPKCEChallengeCode();
            remoteAuthConfig.CodeChallenge = pkceKeyPair.Value;
            if (remoteAuthConfig.ValidateState)
            {
                Response.Cookies.Append("OIDC_STATE", remoteAuthConfig.State, new CookieOptions { Expires = new DateTimeOffset(DateTime.Now.AddMinutes(5)) });
            }
            if (remoteAuthConfig.UsePKCE)
            {
                Response.Cookies.Append("OIDC_VERIFIER", pkceKeyPair.Key, new CookieOptions { Expires = new DateTimeOffset(DateTime.Now.AddMinutes(5)) });
            }
            if (!string.IsNullOrWhiteSpace(redirectURLBase64))
            {
                Response.Cookies.Append("OIDC_REDIRECTURL", redirectURLBase64, new CookieOptions { Expires = new DateTimeOffset(DateTime.Now.AddMinutes(5)) });
            }
            var remoteAuthURL = remoteAuthConfig.RemoteAuthURL;
            return Json(remoteAuthURL);
        }
        public async Task<IActionResult> RemoteAuth(string code, string state = "")
        {
            var storedRedirectURL = Request.Cookies["OIDC_REDIRECTURL"];
            if (!string.IsNullOrWhiteSpace(storedRedirectURL))
            {
                Response.Cookies.Delete("OIDC_REDIRECTURL");
            }
            try
            {
                if (!string.IsNullOrWhiteSpace(code))
                {
                    //received code from OIDC provider
                    //create http client to retrieve user token from OIDC
                    var httpClient = _httpClientFactory.CreateClient();
                    var openIdConfig = _config.GetOpenIDConfig();
                    //check if validate state is enabled.
                    if (openIdConfig.ValidateState)
                    {
                        var storedStateValue = Request.Cookies["OIDC_STATE"];
                        if (!string.IsNullOrWhiteSpace(storedStateValue))
                        {
                            Response.Cookies.Delete("OIDC_STATE");
                        }
                        if (string.IsNullOrWhiteSpace(storedStateValue) || string.IsNullOrWhiteSpace(state) || storedStateValue != state)
                        {
                            _logger.LogInformation("Failed OIDC State Validation - Try disabling state validation if you are confident this is not a malicious attempt.");
                            return new RedirectResult("/Login");
                        }
                    }
                    var httpParams = new List<KeyValuePair<string, string>>
                {
                     new KeyValuePair<string, string>("code", code),
                     new KeyValuePair<string, string>("grant_type", "authorization_code"),
                     new KeyValuePair<string, string>("client_id", openIdConfig.ClientId),
                     new KeyValuePair<string, string>("client_secret", openIdConfig.ClientSecret),
                     new KeyValuePair<string, string>("redirect_uri", openIdConfig.RedirectURL)
                };
                    if (openIdConfig.UsePKCE)
                    {
                        //retrieve stored challenge verifier
                        var storedVerifier = Request.Cookies["OIDC_VERIFIER"];
                        if (!string.IsNullOrWhiteSpace(storedVerifier))
                        {
                            httpParams.Add(new KeyValuePair<string, string>("code_verifier", storedVerifier));
                            Response.Cookies.Delete("OIDC_VERIFIER");
                        }
                    }
                    var httpRequest = new HttpRequestMessage(HttpMethod.Post, openIdConfig.TokenURL)
                    {
                        Content = new FormUrlEncodedContent(httpParams)
                    };
                    var tokenResult = await httpClient.SendAsync(httpRequest).Result.Content.ReadAsStringAsync();
                    var decodedToken = JsonSerializer.Deserialize<OpenIDResult>(tokenResult);
                    var userJwt = decodedToken?.id_token ?? string.Empty;
                    var userAccessToken = decodedToken?.access_token ?? string.Empty;
                    var tokenParser = new JsonWebTokenHandler();
                    bool passedSignatureCheck = true;
                    string signatureValidationError = "check jwks endpoint";
                    if (!string.IsNullOrWhiteSpace(openIdConfig.JwksURL))
                    {
                        //validate token signature if jwks endpoint is provided
                        var jwksData = await httpClient.GetStringAsync(openIdConfig.JwksURL);
                        if (!string.IsNullOrWhiteSpace(jwksData))
                        {
                            var signingKeys = new JsonWebKeySet(jwksData).GetSigningKeys();
                            var tokenValidationParams = new TokenValidationParameters
                            {
                                ValidateAudience = false,
                                ValidateIssuer = false,
                                RequireAudience = false,
                                IssuerSigningKeys = signingKeys,
                                ValidateIssuerSigningKey = true
                            };
                            var validatedIdToken = await tokenParser.ValidateTokenAsync(userJwt, tokenValidationParams);
                            if (!validatedIdToken.IsValid)
                            {
                                passedSignatureCheck = false;
                                if (validatedIdToken.Exception != null && !string.IsNullOrWhiteSpace(validatedIdToken.Exception.Message))
                                {
                                    signatureValidationError = validatedIdToken.Exception.Message;
                                }
                            }
                        }
                    }
                    if (passedSignatureCheck)
                    {
                        if (!string.IsNullOrWhiteSpace(userJwt))
                        {
                            //validate JWT token
                            var parsedToken = tokenParser.ReadJsonWebToken(userJwt);
                            var userEmailAddress = string.Empty;
                            if (parsedToken.Claims.Any(x => x.Type == "email"))
                            {
                                userEmailAddress = parsedToken.Claims.First(x => x.Type == "email").Value;
                            }
                            else if (!string.IsNullOrWhiteSpace(openIdConfig.UserInfoURL) && !string.IsNullOrWhiteSpace(userAccessToken))
                            {
                                //retrieve claims from userinfo endpoint if no email claims are returned within id_token
                                var userInfoHttpRequest = new HttpRequestMessage(HttpMethod.Get, openIdConfig.UserInfoURL);
                                userInfoHttpRequest.Headers.Add("Authorization", $"Bearer {userAccessToken}");
                                var userInfoResult = await httpClient.SendAsync(userInfoHttpRequest).Result.Content.ReadAsStringAsync();
                                var userInfo = JsonSerializer.Deserialize<OpenIDUserInfo>(userInfoResult);
                                if (!string.IsNullOrWhiteSpace(userInfo?.email ?? string.Empty))
                                {
                                    userEmailAddress = userInfo?.email ?? string.Empty;
                                }
                                else
                                {
                                    _logger.LogError($"OpenID Provider did not provide an email claim via UserInfo endpoint");
                                }
                            }
                            else
                            {
                                var returnedClaims = parsedToken.Claims.Select(x => x.Type);
                                _logger.LogError($"OpenID Provider did not provide an email claim, claims returned: {string.Join(",", returnedClaims)}");
                            }
                            if (!string.IsNullOrWhiteSpace(userEmailAddress))
                            {
                                var userData = _loginLogic.ValidateOpenIDUser(new LoginModel() { EmailAddress = userEmailAddress });
                                if (userData.Id != default)
                                {
                                    AuthCookie authCookie = new AuthCookie
                                    {
                                        UserData = userData,
                                        ExpiresOn = DateTime.Now.AddDays(1)
                                    };
                                    var serializedCookie = JsonSerializer.Serialize(authCookie);
                                    var encryptedCookie = _dataProtector.Protect(serializedCookie);
                                    Response.Cookies.Append(StaticHelper.LoginCookieName, encryptedCookie, new CookieOptions { Expires = new DateTimeOffset(authCookie.ExpiresOn) });
                                    if (!string.IsNullOrWhiteSpace(storedRedirectURL))
                                    {
                                        try
                                        {
                                            var decodedRedirectURL = Encoding.UTF8.GetString(Convert.FromBase64String(storedRedirectURL));
                                            return new RedirectResult(decodedRedirectURL);
                                        } catch
                                        {
                                            return new RedirectResult("/Home");
                                        }
                                    }
                                    return new RedirectResult("/Home");
                                }
                                else
                                {
                                    _logger.LogInformation($"User {userEmailAddress} tried to login via OpenID but is not a registered user in LubeLogger.");
                                    OpenIDRegistrationModel openIDRegistrationViewModel = new OpenIDRegistrationModel() { 
                                        EmailAddress = userEmailAddress,
                                        RegistrationDisabled = openIdConfig.DisableRegistration,
                                        LogOutUrl = openIdConfig.LogOutURL
                                    };
                                    if (openIdConfig.AutoGenerateTokens)
                                    {
                                        openIDRegistrationViewModel.Token = _loginLogic.GenerateOIDCUserToken(userEmailAddress);
                                    }
                                    return View("OpenIDRegistration", model: openIDRegistrationViewModel);
                                }
                            }
                            else
                            {
                                _logger.LogInformation("OpenID Provider did not provide a valid email address for the user");
                            }
                        }
                        else
                        {
                            _logger.LogInformation("OpenID Provider did not provide a valid id_token");
                            if (!string.IsNullOrWhiteSpace(tokenResult))
                            {
                                //if something was returned from the IdP but it's invalid, we want to log it as an error.
                                _logger.LogError($"Expected id_token, received {tokenResult}");
                            }
                        }
                    } 
                    else
                    {
                        _logger.LogError($"OpenID Provider did not provide a valid id_token: {signatureValidationError}");
                    }
                }
                else
                {
                    _logger.LogInformation("OpenID Provider did not provide a code.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return new RedirectResult("/Login");
            }
            return new RedirectResult("/Login");
        }
        public async Task<IActionResult> RemoteAuthDebug(string code, string state = "")
        {
            List<OperationResponse> results = new List<OperationResponse>();
            var storedRedirectURL = Request.Cookies["OIDC_REDIRECTURL"];
            if (!string.IsNullOrWhiteSpace(storedRedirectURL))
            {
                Response.Cookies.Delete("OIDC_REDIRECTURL");
                results.Add(OperationResponse.Succeed($"Redirect URL Configured: {storedRedirectURL}"));
            }
            try
            {
                if (!string.IsNullOrWhiteSpace(code))
                {
                    results.Add(OperationResponse.Succeed($"Received code from OpenID Provider: {code}"));
                    //received code from OIDC provider
                    //create http client to retrieve user token from OIDC
                    var httpClient = _httpClientFactory.CreateClient();
                    var openIdConfig = _config.GetOpenIDConfig();
                    //check if validate state is enabled.
                    if (openIdConfig.ValidateState)
                    {
                        var storedStateValue = Request.Cookies["OIDC_STATE"];
                        if (!string.IsNullOrWhiteSpace(storedStateValue))
                        {
                            Response.Cookies.Delete("OIDC_STATE");
                        }
                        if (string.IsNullOrWhiteSpace(storedStateValue) || string.IsNullOrWhiteSpace(state) || storedStateValue != state)
                        {
                            results.Add(OperationResponse.Failed($"Failed State Validation - Expected: {storedStateValue} Received: {state}"));
                        }
                        else
                        {
                            results.Add(OperationResponse.Succeed($"Passed State Validation - Expected: {storedStateValue} Received: {state}"));
                        }
                    }
                    var httpParams = new List<KeyValuePair<string, string>>
                {
                     new KeyValuePair<string, string>("code", code),
                     new KeyValuePair<string, string>("grant_type", "authorization_code"),
                     new KeyValuePair<string, string>("client_id", openIdConfig.ClientId),
                     new KeyValuePair<string, string>("client_secret", openIdConfig.ClientSecret),
                     new KeyValuePair<string, string>("redirect_uri", openIdConfig.RedirectURL)
                };
                    if (openIdConfig.UsePKCE)
                    {
                        //retrieve stored challenge verifier
                        var storedVerifier = Request.Cookies["OIDC_VERIFIER"];
                        if (!string.IsNullOrWhiteSpace(storedVerifier))
                        {
                            httpParams.Add(new KeyValuePair<string, string>("code_verifier", storedVerifier));
                            Response.Cookies.Delete("OIDC_VERIFIER");
                        }
                    }
                    var httpRequest = new HttpRequestMessage(HttpMethod.Post, openIdConfig.TokenURL)
                    {
                        Content = new FormUrlEncodedContent(httpParams)
                    };
                    var tokenResult = await httpClient.SendAsync(httpRequest).Result.Content.ReadAsStringAsync();
                    var decodedToken = JsonSerializer.Deserialize<OpenIDResult>(tokenResult);
                    var userJwt = decodedToken?.id_token ?? string.Empty;
                    var userAccessToken = decodedToken?.access_token ?? string.Empty;
                    var tokenParser = new JsonWebTokenHandler();
                    bool passedSignatureCheck = true;
                    if (!string.IsNullOrWhiteSpace(openIdConfig.JwksURL))
                    {
                        //validate token signature if jwks endpoint is provided
                        var jwksData = await httpClient.GetStringAsync(openIdConfig.JwksURL);
                        if (!string.IsNullOrWhiteSpace(jwksData))
                        {
                            var signingKeys = new JsonWebKeySet(jwksData).GetSigningKeys();
                            var tokenValidationParams = new TokenValidationParameters
                            {
                                ValidateAudience = false,
                                ValidateIssuer = false,
                                RequireAudience = false,
                                IssuerSigningKeys = signingKeys,
                                ValidateIssuerSigningKey = true
                            };
                            var validatedIdToken = await tokenParser.ValidateTokenAsync(userJwt, tokenValidationParams);
                            if (!validatedIdToken.IsValid)
                            {
                                passedSignatureCheck = false;
                                if (validatedIdToken.Exception != null && !string.IsNullOrWhiteSpace(validatedIdToken.Exception.Message))
                                {
                                    results.Add(OperationResponse.Failed($"Failed JWT Validation: {validatedIdToken.Exception.Message}"));
                                }
                            } else
                            {
                                results.Add(OperationResponse.Succeed($"Passed JWT Validation - Valid To: {validatedIdToken.SecurityToken.ValidTo}"));
                            }
                        }
                    }
                    if (passedSignatureCheck)
                    {
                        if (!string.IsNullOrWhiteSpace(userJwt))
                        {
                            results.Add(OperationResponse.Succeed($"Passed JWT Parsing - id_token: {userJwt}"));
                            //validate JWT token
                            var parsedToken = tokenParser.ReadJsonWebToken(userJwt);
                            var userEmailAddress = string.Empty;
                            if (parsedToken.Claims.Any(x => x.Type == "email"))
                            {
                                userEmailAddress = parsedToken.Claims.First(x => x.Type == "email").Value;
                                results.Add(OperationResponse.Succeed($"Passed Claim Validation - email"));
                            }
                            else if (!string.IsNullOrWhiteSpace(openIdConfig.UserInfoURL) && !string.IsNullOrWhiteSpace(userAccessToken))
                            {
                                //retrieve claims from userinfo endpoint if no email claims are returned within id_token
                                var userInfoHttpRequest = new HttpRequestMessage(HttpMethod.Get, openIdConfig.UserInfoURL);
                                userInfoHttpRequest.Headers.Add("Authorization", $"Bearer {userAccessToken}");
                                var userInfoResult = await httpClient.SendAsync(userInfoHttpRequest).Result.Content.ReadAsStringAsync();
                                var userInfo = JsonSerializer.Deserialize<OpenIDUserInfo>(userInfoResult);
                                if (!string.IsNullOrWhiteSpace(userInfo?.email ?? string.Empty))
                                {
                                    userEmailAddress = userInfo?.email ?? string.Empty;
                                    results.Add(OperationResponse.Succeed($"Passed Claim Validation - Retrieved email via UserInfo endpoint"));
                                }
                                else
                                {
                                    results.Add(OperationResponse.Failed($"Failed Claim Validation - Unable to retrieve email via UserInfo endpoint: {openIdConfig.UserInfoURL} using access_token: {userAccessToken} - Received {userInfoResult}"));
                                }
                            }
                            else
                            {
                                var returnedClaims = parsedToken.Claims.Select(x => x.Type);
                                results.Add(OperationResponse.Failed($"Failed Claim Validation - Expected: email Received: {string.Join(",", returnedClaims)}"));
                            }
                            if (!string.IsNullOrWhiteSpace(userEmailAddress))
                            {
                                var userData = _loginLogic.ValidateOpenIDUser(new LoginModel() { EmailAddress = userEmailAddress });
                                if (userData.Id != default)
                                {
                                    results.Add(OperationResponse.Succeed($"Passed User Validation - Email: {userEmailAddress} Username: {userData.UserName}"));
                                }
                                else
                                {
                                    results.Add(OperationResponse.Succeed($"Passed Email Validation - Email: {userEmailAddress} User not registered"));
                                }
                            }
                            else
                            {
                                results.Add(OperationResponse.Failed($"Failed Email Validation - No email received from OpenID Provider"));
                            }
                        }
                        else
                        {
                            results.Add(OperationResponse.Failed($"Failed to parse JWT - Expected: id_token Received: {tokenResult}"));
                        }
                    } 
                    else
                    {
                        results.Add(OperationResponse.Failed("Failed JWT Validation: Check Signing Keys"));
                    }
                }
                else
                {
                    results.Add(OperationResponse.Failed("No code received from OpenID Provider"));
                }
            }
            catch (Exception ex)
            {
                results.Add(OperationResponse.Failed($"Exception: {ex.Message}"));
            }
            return View(results);
        }
        [HttpPost]
        public IActionResult Login(LoginModel credentials)
        {
            if (string.IsNullOrWhiteSpace(credentials.UserName) ||
                string.IsNullOrWhiteSpace(credentials.Password))
            {
                return Json(OperationResponse.Failed(_translator.Translate(_config.GetServerLanguage(), "Invalid Login Credentials")));
            }
            credentials.UserName = credentials.UserName.Trim();
            //compare it against hashed credentials
            try
            {
                var userData = _loginLogic.ValidateUserCredentials(credentials);
                if (userData.Id != default)
                {
                    AuthCookie authCookie = new AuthCookie
                    {
                        UserData = userData,
                        ExpiresOn = DateTime.Now.AddDays(credentials.IsPersistent ? _config.GetAuthCookieLifeSpan() : 1)
                    };
                    var serializedCookie = JsonSerializer.Serialize(authCookie);
                    var encryptedCookie = _dataProtector.Protect(serializedCookie);
                    Response.Cookies.Append(StaticHelper.LoginCookieName, encryptedCookie, new CookieOptions { Expires = new DateTimeOffset(authCookie.ExpiresOn) });
                    return Json(OperationResponse.Succeed());
                }
                else
                {
                    //log failed login attempts
                    string ipAddressToLog = Request.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? string.Empty;
                    //check for forwarded headers from reverse proxies
                    if (Request.Headers.ContainsKey("X-Forwarded-For"))
                    {
                        string forwardedIp = Request.Headers["X-Forwarded-For"].ToString();
                        if (!string.IsNullOrWhiteSpace(forwardedIp))
                        {
                            //append forwarded ip
                            ipAddressToLog += $", {forwardedIp}";
                        }
                    }
                    if (!string.IsNullOrWhiteSpace(ipAddressToLog))
                    {
                        _logger.LogWarning($"Failed Login for {credentials.UserName} from {ipAddressToLog}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Login Error.");
            }
            return Json(OperationResponse.Failed(_translator.Translate(_config.GetServerLanguage(), "Invalid Login Credentials")));
        }

        [HttpPost]
        public IActionResult Register(LoginModel credentials)
        {
            var result = _loginLogic.RegisterNewUser(credentials);
            return Json(result);
        }
        [HttpPost]
        public IActionResult RegisterOpenIdUser(LoginModel credentials)
        {
            var result = _loginLogic.RegisterOpenIdUser(credentials);
            if (result.Success)
            {
                var userData = _loginLogic.ValidateOpenIDUser(new LoginModel() { EmailAddress = credentials.EmailAddress });
                if (userData.Id != default)
                {
                    AuthCookie authCookie = new AuthCookie
                    {
                        UserData = userData,
                        ExpiresOn = DateTime.Now.AddDays(1)
                    };
                    var serializedCookie = JsonSerializer.Serialize(authCookie);
                    var encryptedCookie = _dataProtector.Protect(serializedCookie);
                    Response.Cookies.Append(StaticHelper.LoginCookieName, encryptedCookie, new CookieOptions { Expires = new DateTimeOffset(authCookie.ExpiresOn) });
                }
            }
            return Json(result);
        }
        [HttpPost]
        public async Task<IActionResult> SendRegistrationToken(LoginModel credentials)
        {
            var result = await _loginLogic.SendRegistrationToken(credentials);
            return Json(result);
        }
        [HttpPost]
        public async Task<IActionResult> RequestResetPassword(LoginModel credentials)
        {
            var result = await _loginLogic.RequestResetPassword(credentials);
            return Json(result);
        }
        [HttpPost]
        public IActionResult PerformPasswordReset(LoginModel credentials)
        {
            var result = _loginLogic.ResetPasswordByUser(credentials);
            return Json(result);
        }
        [Authorize(Roles = nameof(UserData.IsRootUser))] //User must already be logged in as root user to do this.
        [HttpPost]
        public IActionResult CreateLoginCreds(LoginModel credentials)
        {
            try
            {
                var result = _loginLogic.CreateRootUserCredentials(credentials);
                return Json(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error on saving config file.");
            }
            return Json(false);
        }
        [Authorize(Roles = nameof(UserData.IsRootUser))]
        [HttpPost]
        public IActionResult DestroyLoginCreds()
        {
            try
            {
                var result = _loginLogic.DeleteRootUserCredentials();
                //destroy any login cookies.
                if (result)
                {
                    Response.Cookies.Delete(StaticHelper.LoginCookieName);
                }
                return Json(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error on saving config file.");
            }
            return Json(false);
        }
        [HttpGet]
        public IActionResult GoogleLogin()
        {
            var googleConfig = _config.GetGoogleAuthConfig();
            if (string.IsNullOrWhiteSpace(googleConfig.ClientId))
            {
                return Content("<script>alert('El inicio de sesión con Google requiere configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.'); window.location.href='/Login';</script>", "text/html; charset=utf-8");
            }
            var state = Guid.NewGuid().ToString("N");
            Response.Cookies.Append("OIDC_STATE", state, new CookieOptions { Expires = DateTimeOffset.Now.AddMinutes(10), HttpOnly = true, SameSite = SameSiteMode.Lax });

            var redirectUri = $"{GetBaseUrl()}/Login/GoogleCallback";
            var authUrl = $"https://accounts.google.com/o/oauth2/v2/auth?client_id={Uri.EscapeDataString(googleConfig.ClientId)}&response_type=code&scope=openid%20email%20profile&redirect_uri={Uri.EscapeDataString(redirectUri)}&state={state}";
            return Redirect(authUrl);
        }

        [HttpGet]
        public async Task<IActionResult> GoogleCallback(string code, string state = "")
        {
            try
            {
                var storedState = Request.Cookies["OIDC_STATE"];
                if (!string.IsNullOrEmpty(storedState))
                {
                    Response.Cookies.Delete("OIDC_STATE");
                }
                if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(storedState) || storedState != state)
                {
                    _logger.LogError("OAuth state validation failed: missing or invalid state");
                    return RedirectToAction("Index");
                }

                var googleConfig = _config.GetGoogleAuthConfig();
                var redirectUri = $"{GetBaseUrl()}/Login/GoogleCallback";
                var httpClient = _httpClientFactory.CreateClient();

                var tokenParams = new Dictionary<string, string>
                {
                    { "code", code },
                    { "client_id", googleConfig.ClientId },
                    { "client_secret", googleConfig.ClientSecret },
                    { "redirect_uri", redirectUri },
                    { "grant_type", "authorization_code" }
                };

                var tokenResponse = await httpClient.PostAsync("https://oauth2.googleapis.com/token", new FormUrlEncodedContent(tokenParams));
                if (!tokenResponse.IsSuccessStatusCode)
                {
                    _logger.LogError("Error retrieving token from Google OAuth");
                    return RedirectToAction("Index");
                }

                var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
                using var tokenDoc = JsonDocument.Parse(tokenJson);
                var accessToken = tokenDoc.RootElement.GetProperty("access_token").GetString();

                // Get User Info
                var userInfoRequest = new HttpRequestMessage(HttpMethod.Get, "https://openidconnect.googleapis.com/v1/userinfo");
                userInfoRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
                var userInfoResponse = await httpClient.SendAsync(userInfoRequest);
                if (!userInfoResponse.IsSuccessStatusCode)
                {
                    _logger.LogError("Error retrieving user info from Google OAuth");
                    return RedirectToAction("Index");
                }

                var userInfoJson = await userInfoResponse.Content.ReadAsStringAsync();
                using var userDoc = JsonDocument.Parse(userInfoJson);
                var email = userDoc.RootElement.GetProperty("email").GetString();
                var emailVerified = userDoc.RootElement.TryGetProperty("email_verified", out var evProp) && evProp.GetBoolean();
                if (!emailVerified || string.IsNullOrWhiteSpace(email))
                {
                    _logger.LogError("Google OAuth returned unverified or empty email");
                    return Content("<script>alert('Tu cuenta de Google debe tener un correo electrónico verificado.'); window.location.href='/Login';</script>", "text/html; charset=utf-8");
                }
                var name = userDoc.RootElement.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : email?.Split('@')[0];

                return ProcessSocialLogin(email, name);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception in GoogleCallback");
                return RedirectToAction("Index");
            }
        }

        [HttpGet]
        public IActionResult DiscordLogin()
        {
            var discordConfig = _config.GetDiscordAuthConfig();
            if (string.IsNullOrWhiteSpace(discordConfig.ClientId))
            {
                return Content("<script>alert('El inicio de sesión con Discord requiere configurar DISCORD_CLIENT_ID y DISCORD_CLIENT_SECRET.'); window.location.href='/Login';</script>", "text/html; charset=utf-8");
            }
            var state = Guid.NewGuid().ToString("N");
            Response.Cookies.Append("OIDC_STATE", state, new CookieOptions { Expires = DateTimeOffset.Now.AddMinutes(10), HttpOnly = true, SameSite = SameSiteMode.Lax });

            var redirectUri = $"{GetBaseUrl()}/Login/DiscordCallback";
            var authUrl = $"https://discord.com/api/oauth2/authorize?client_id={Uri.EscapeDataString(discordConfig.ClientId)}&response_type=code&scope=identify%20email&redirect_uri={Uri.EscapeDataString(redirectUri)}&state={state}";
            return Redirect(authUrl);
        }

        [HttpGet]
        public async Task<IActionResult> DiscordCallback(string code, string state = "")
        {
            try
            {
                var storedState = Request.Cookies["OIDC_STATE"];
                if (!string.IsNullOrEmpty(storedState))
                {
                    Response.Cookies.Delete("OIDC_STATE");
                }
                if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(storedState) || storedState != state)
                {
                    _logger.LogError("OAuth state validation failed: missing or invalid state");
                    return RedirectToAction("Index");
                }

                var discordConfig = _config.GetDiscordAuthConfig();
                var redirectUri = $"{GetBaseUrl()}/Login/DiscordCallback";
                var httpClient = _httpClientFactory.CreateClient();

                var tokenParams = new Dictionary<string, string>
                {
                    { "code", code },
                    { "client_id", discordConfig.ClientId },
                    { "client_secret", discordConfig.ClientSecret },
                    { "redirect_uri", redirectUri },
                    { "grant_type", "authorization_code" }
                };

                var tokenResponse = await httpClient.PostAsync("https://discord.com/api/oauth2/token", new FormUrlEncodedContent(tokenParams));
                if (!tokenResponse.IsSuccessStatusCode)
                {
                    _logger.LogError("Error retrieving token from Discord OAuth");
                    return RedirectToAction("Index");
                }

                var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
                using var tokenDoc = JsonDocument.Parse(tokenJson);
                var accessToken = tokenDoc.RootElement.GetProperty("access_token").GetString();

                // Get User Info from Discord
                var userInfoRequest = new HttpRequestMessage(HttpMethod.Get, "https://discord.com/api/users/@me");
                userInfoRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
                var userInfoResponse = await httpClient.SendAsync(userInfoRequest);
                if (!userInfoResponse.IsSuccessStatusCode)
                {
                    _logger.LogError("Error retrieving user info from Discord OAuth");
                    return RedirectToAction("Index");
                }

                var userInfoJson = await userInfoResponse.Content.ReadAsStringAsync();
                using var userDoc = JsonDocument.Parse(userInfoJson);
                var email = userDoc.RootElement.TryGetProperty("email", out var emailProp) ? emailProp.GetString() : null;
                var isVerified = userDoc.RootElement.TryGetProperty("verified", out var verProp) && verProp.GetBoolean();
                if (!isVerified || string.IsNullOrWhiteSpace(email))
                {
                    _logger.LogError("Discord OAuth returned unverified or missing email");
                    return Content("<script>alert('Tu cuenta de Discord debe tener un correo electrónico verificado para iniciar sesión.'); window.location.href='/Login';</script>", "text/html; charset=utf-8");
                }
                var username = userDoc.RootElement.TryGetProperty("username", out var userProp) ? userProp.GetString() : null;

                return ProcessSocialLogin(email, username ?? email.Split('@')[0]);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception in DiscordCallback");
                return RedirectToAction("Index");
            }
        }

        private IActionResult ProcessSocialLogin(string? email, string? displayName)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return RedirectToAction("Index");
            }

            var userData = _loginLogic.ValidateOpenIDUser(new LoginModel() { EmailAddress = email });
            if (userData.Id == default)
            {
                if (_config.GetServerDisabledRegistration())
                {
                    _logger.LogWarning($"Social registration blocked: registration is disabled on this server ({email})");
                    return Content("<script>alert('El registro de nuevos usuarios está desactivado en este servidor.'); window.location.href='/Login';</script>", "text/html; charset=utf-8");
                }

                var uniqueUsername = string.IsNullOrWhiteSpace(displayName) ? email.Split('@')[0] : displayName;
                var existingUser = _loginLogic.GetAllUsers().FirstOrDefault(x => x.UserName.Equals(uniqueUsername, StringComparison.OrdinalIgnoreCase));
                if (existingUser != null)
                {
                    uniqueUsername = $"{uniqueUsername}_{Guid.NewGuid().ToString("N").Substring(0, 4)}";
                }

                _loginLogic.RegisterOpenIdUser(new LoginModel
                {
                    UserName = uniqueUsername,
                    EmailAddress = email,
                    Token = _loginLogic.GenerateOIDCUserToken(email)
                });

                userData = _loginLogic.ValidateOpenIDUser(new LoginModel() { EmailAddress = email });
            }

            if (userData.Id != default)
            {
                AuthCookie authCookie = new AuthCookie
                {
                    UserData = userData,
                    ExpiresOn = DateTime.Now.AddDays(7)
                };
                var serializedCookie = JsonSerializer.Serialize(authCookie);
                var encryptedCookie = _dataProtector.Protect(serializedCookie);
                Response.Cookies.Append(StaticHelper.LoginCookieName, encryptedCookie, new CookieOptions { Expires = new DateTimeOffset(authCookie.ExpiresOn) });
                return Redirect("/Home");
            }

            return RedirectToAction("Index");
        }

        private string GetBaseUrl()
        {
            var serverUrl = _config.GetServerDomain();
            if (!string.IsNullOrWhiteSpace(serverUrl))
            {
                return serverUrl.TrimEnd('/');
            }
            return $"{Request.Scheme}://{Request.Host}";
        }


        [Authorize]
        [HttpPost]
        public IActionResult LogOut()
        {
            Response.Cookies.Delete(StaticHelper.LoginCookieName);
            var remoteAuthConfig = _config.GetOpenIDConfig();
            if (remoteAuthConfig.DisableRegularLogin && !string.IsNullOrWhiteSpace(remoteAuthConfig.LogOutURL))
            {
                return Json(remoteAuthConfig.LogOutURL);
            }
            return Json("/Login");
        }
    }
}
