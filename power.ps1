cd "C:\Users\ZiloTech\Desktop\testingv1"
for ($i=1; $i -le 600; $i++) {
    $randstr = -join ((65..90) + (97..122) | Get-Random -Count 5 | % {[char]$_})
    Add-Content test.txt "Commit $i with random: $randstr"
    git add test.txt
    git commit -m "Commit $i: Added random string $randstr"
    Write-Output "Commit $i done"
}
git push origin main