@echo off
setlocal enabledelayedexpansion
cd /d "C:\Users\ZiloTech\Desktop\testingv1"

for /l %%i in (1,1,600) do (
    set randstr=!random!!random!
    set randstr=!randstr:~0,5!
    echo Commit %%i with random: !randstr! >> test.txt

    git add test.txt
    git commit -m "Commit %%i: Added random string !randstr!"
    echo Commit %%i done
)

git push origin main
pause