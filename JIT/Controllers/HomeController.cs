﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace JIT.Controllers
{
    public class HomeController : Controller
    {
        // GET: Home
        [Authorize]
        public ViewResult Index()
        {
            return View();
        }
    }
}