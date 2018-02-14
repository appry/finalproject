using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel.DataAnnotations;

namespace JIT.Models
{
    [MetadataType(typeof(UserMetadata))]
    public partial class User
    {
        public string ConfirmPassword { get; set; }
    }
    public class UserMetadata
    {
        [Display(Name ="User name")]
        [Required(AllowEmptyStrings =false,ErrorMessage ="User name required")]
        public string UserName { get; set; }

        [Display(Name ="Email")]
        [Required(AllowEmptyStrings =false,ErrorMessage ="Email required")]
        [DataType(DataType.EmailAddress)]
        public string Email { get; set; }

        [Required(AllowEmptyStrings =false,ErrorMessage ="Password required")]
        [DataType(DataType.Password)]
        [MinLength(6,ErrorMessage ="Password must be at least 6 characters long")]
        public string Password { get; set; }

        [DataType(DataType.Password)]
        [Display(Name ="Confirm password")]
        [Compare("Password",ErrorMessage ="Passwords do not match")]
        public string ConfirmPassword { get; set; }

    }
}