using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using System.Web.Security;
using JIT.Models;


namespace JIT.Controllers
{
    public class UserController : Controller
    {
        [HttpGet]
        public ActionResult Registration()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Registration([Bind(Exclude ="IsEmailVerified,ActivationCode")] User user)
        {
            bool status = false;
            string message = "";
            if (ModelState.IsValid)
            {
                #region Email or name already exists
                bool emailCheck = EmailExist(user.Email);
                bool userNameCheck = UserNameExist(user.UserName);
                if(emailCheck)
                    ModelState.AddModelError("EmailExists", "Email already exists");
                if(userNameCheck)
                    ModelState.AddModelError("UserNameExists", "User name already exists");
                if(emailCheck || userNameCheck)
                    return View(user);
                #endregion

                #region Generate activation code
                user.ActivationCode = Guid.NewGuid();
                #endregion

                #region Password hashing
                user.Password = System.Web.Helpers.Crypto.HashPassword(user.Password);
                System.Diagnostics.Debug.WriteLine(System.Web.Helpers.Crypto.VerifyHashedPassword(user.Password,"qwerty"));
                #endregion

                #region Save to DB
                using (JITContext db = new JITContext())
                {
                    user.IsEmailVerified = false;
                    db.Users.Add(user);
                    db.Configuration.ValidateOnSaveEnabled = false;
                    db.SaveChanges();
                    db.Configuration.ValidateOnSaveEnabled = true;
                }
                #endregion
                SendVerificationEmail(user.Email, user.ActivationCode.ToString());
                message = "Registration succsessfully done. Account activation link" +
                    "has been sent to your email: " + user.Email;
                status = true;
            }
            else
            {
                message = "Invalid Request";
            }
            ViewBag.Message = message;
            ViewBag.Status = status;
            return View(user);
        }

        [HttpGet]
        public ActionResult VerifyAccount(string id)
        {
            bool status = false;
            using (JITContext db = new JITContext())
            {
                db.Configuration.ValidateOnSaveEnabled = false;
                try
                {
                    var v = db.Users.Where(user => user.ActivationCode == new Guid(id)).FirstOrDefault();
                    if(v!=null)
                    {
                        v.IsEmailVerified = true;
                        db.SaveChanges();
                        status = true;
                    }
                    else
                    {
                        ViewBag.Message = "Invalid Request";
                        ViewBag.Status = false;
                    }
                }
                catch (FormatException e)
                {
                    ViewBag.Message = "Invalid Request";
                    ViewBag.Status = false;
                }
            }
            ViewBag.Status = status;
            return View();
        }
        
        [HttpGet]
        public ActionResult Login()
        {
            return View();
        }
        
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Login(UserLogin login,string returnUrl="")
        {
            using (JITContext db = new JITContext())
            {
                
                var v = db.Users.Where(user => user.UserName == login.UserName).FirstOrDefault();
                if(v!=null)
                {
                    if(System.Web.Helpers.Crypto.VerifyHashedPassword(v.Password,login.Password))
                    {
                        int timeout = 525600;
                        var ticket = new FormsAuthenticationTicket(login.UserName,login.RememberMe,timeout);
                        string encrypted = FormsAuthentication.Encrypt(ticket);
                        var cookie = new HttpCookie(FormsAuthentication.FormsCookieName, encrypted);
                        if (login.RememberMe)
                            cookie.Expires = DateTime.Now.AddHours(24);
                        cookie.HttpOnly = false;
                        Response.Cookies.Add(cookie);
                        if (Url.IsLocalUrl(returnUrl))
                        {
                            return Redirect(returnUrl);
                        }
                        {
                            return RedirectToAction("Index", "Home");
                        }
                    }
                }
            }
            ModelState.AddModelError("InvalidCredentials", "Wrong user name or password");
            return View();
        }

        [Authorize]
        public ActionResult Logout()
        {
            FormsAuthentication.SignOut();
            return RedirectToAction("Login", "User");
        }

        [NonAction]
        public bool EmailExist(string email)
        {
            using (JITContext db = new JITContext())
            {
                var v = db.Users.Where(user => user.Email == email).FirstOrDefault();
                return v != null;
            }
        }

        [NonAction]
        public bool UserNameExist(string userName)
        {
            using (JITContext db = new JITContext())
            {
                var v = db.Users.Where(user => user.UserName == userName).FirstOrDefault();
                return v != null;
            }
        }

        [NonAction]
        public void SendVerificationEmail(string email, string code)
        {
            var verificationUrl = "/User/Verification/" + code;
            using (SmtpClient smtp = new SmtpClient())
            {
                using (MailMessage mm = new MailMessage("jitpackages@gmail.com", email))
                {
                    mm.Subject = "Email Confirmation";
                    mm.Body = "<br/><br/> Please click the link below to complete your registration" +
                        "<br/><br/><a href=" + Request.Url.AbsoluteUri.Replace(Request.Url.PathAndQuery, verificationUrl) + ">Confirm Email</a>";
                    mm.IsBodyHtml = true;
                    mm.Priority = MailPriority.High;
                    smtp.Send(mm);
                }
            }
        }
    }
}