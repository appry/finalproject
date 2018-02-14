using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace JIT.Models
{
    public class UserLogin
    {
        [Display(Name ="User name")]
        [Required(AllowEmptyStrings =false,ErrorMessage ="User name required")]
        public string UserName { get; set; }

        [Required(AllowEmptyStrings =false,ErrorMessage ="Password required")]
        [DataType(DataType.Password)]
        public string Password { get; set; }

        [Display(Name = "Remember me")]
        public bool RememberMe { get; set; }
    }
}