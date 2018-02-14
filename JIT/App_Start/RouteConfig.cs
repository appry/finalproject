using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace JIT
{
    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            routes.MapRoute("Modelling", "Home/Index",
                new { controller="Home", action="Index" });
            routes.MapRoute("Verification", "User/Verification/{id}",
                new { controller = "User", action = "VerifyAccount" });
            routes.MapRoute("Registration", "User/Registration",
                new { controller = "User", action = "Registration" });
            routes.MapRoute("Signin", "User/Signin",
                new { controller = "User", action = "Signin" });
            routes.MapRoute("Default", "{controller}/{action}",
                new { controller = "Home", action = "Index" });
        }
    }
}
