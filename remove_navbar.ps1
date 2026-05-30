$pages = @(
  "c:\Users\HP\Desktop\camcod\src\pages\Home.tsx",
  "c:\Users\HP\Desktop\camcod\src\pages\Projects.tsx",
  "c:\Users\HP\Desktop\camcod\src\pages\Services.tsx",
  "c:\Users\HP\Desktop\camcod\src\pages\Contact.tsx",
  "c:\Users\HP\Desktop\camcod\src\pages\Login.tsx",
  "c:\Users\HP\Desktop\camcod\src\pages\ForgotPassword.tsx",
  "c:\Users\HP\Desktop\camcod\src\pages\Signup.tsx",
  "c:\Users\HP\Desktop\camcod\src\pages\Profile.tsx",
  "c:\Users\HP\Desktop\camcod\src\pages\Marketplace.tsx",
  "c:\Users\HP\Desktop\camcod\src\pages\Showcase.tsx",
  "c:\Users\HP\Desktop\camcod\src\pages\Solutions.tsx",
  "c:\Users\HP\Desktop\camcod\src\pages\Terms.tsx",
  "c:\Users\HP\Desktop\camcod\src\pages\Categories.tsx",
  "c:\Users\HP\Desktop\camcod\src\pages\Announcements.tsx"
)

foreach ($page in $pages) {
  if (Test-Path $page) {
    $content = Get-Content $page -Raw
    # Remove import Navbar lines
    $content = $content -replace '(?m)^.*import Navbar from.*(\r\n|\n)', ''
    # Remove <Navbar /> JSX (with optional indentation)
    $content = $content -replace '(?m)^[ \t]*<Navbar \/>(\r\n|\n)', ''
    Set-Content $page $content -NoNewline -Encoding UTF8
    Write-Host "Cleaned: $page"
  }
}
Write-Host "All done!"
